import Redis from "ioredis";
import { AppError } from "../Classes/ResponseStructure.js";
import { env } from "../config/env.js";
import { authConstants } from "../constants/auth.constants.js";
import { cookieOptions } from "../constants/cookie.constants.js";
import {
  LoginRequestDTO,
  LoginResponse,
  UserDetailDTO,
} from "../DTO/auth/Login.dto.js";
import { User } from "../generated/prisma/client.js";
import resendProvider from "../providers/email/resend.provider.js";
import emailVerificationRepository from "../repositories/emailVerification.repository.js";
import forgotPasswordRepository from "../repositories/forgotPassword.repository.js";
import refreshTokenRepository from "../repositories/refreshToke.repository.js";
import userRepository from "../repositories/user.repository.js";
import { generateForgotPasswordEmailTemplate } from "../templates/email/forgotpassword.template.js";
import { generatePasswordUpdateSuccessEmail } from "../templates/email/passwordChanged.template.js";
import { generateVerificationEmailTemplate } from "../templates/email/verificationEmail.template.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/JWTUtils.js";
import { comparePassword, hashPassword } from "../utils/PasswordUtils.js";
import { generateRandomToken } from "../utils/randomTokenGenerator.js";
import { RegisterInput, LoginInput } from "../validators/auth.validator.js";
import { getRedisClient } from "../config/redis.js";

type ReturnUser = {
  id: string;
  name: string;
  email: string;
};
type LoginResult = {
  createdAt: Date;
  user: LoginResponse;
  accessToken: string;
  refreshToken: string;
};

type RefreshDTO = {
  accessToken: string;
  refreshToken: string;
};
const USER_CACHE_TTL = 60 * 15; // 15 minutes
class AuthService {
  async registerNewUser(data: RegisterInput): Promise<ReturnUser> {
    const existingUser = await userRepository.findByIdOrEmail({
      email: data?.email,
    });

    if (existingUser) {
      throw new AppError("User with this Email already exists", 409);
    }
    const hashedPassword = await hashPassword(data?.password);
    const createUser = await userRepository.create({
      ...data,
      password: hashedPassword,
    });

    if (!createUser) throw new AppError("Unable to create user", 400);

    //Generating Email Verification flow

    const randomToken = generateRandomToken();
    const expiry = new Date(
      Date.now() + authConstants.VERIFICATION_EMAIL_EXPIRY,
    );
    await emailVerificationRepository.createEmailVerificationToken({
      userId: createUser?.id,
      token: randomToken,
      expiresAt: expiry,
    });
    const urlForVerification = `${env.FRONTEND_URL}${env.EMAIL_VERIFICATION_PATH}?token=${randomToken}`;

    const getEmailToSend = generateVerificationEmailTemplate(
      urlForVerification,
      data?.name,
    );
    try {
      await resendProvider.sendEmail({
        to: data?.email,
        html: getEmailToSend,
        subject: "Verify your email address",
      });
    } catch (error) {
      throw new AppError("Failed to send verification email", 500);
    }

    return createUser;
  }

  async loginUser(data: LoginInput): Promise<LoginResult> {
    const redis = getRedisClient();
    const userExist = await userRepository.findByIdOrEmail({
      email: data.email,
    });

    if (!userExist) {
      throw new AppError("User with this email does not exist!", 401);
    }

    const isValidPassword = await comparePassword(
      data.password,
      userExist.password,
    );

    if (!isValidPassword) {
      throw new AppError("Invalid password!", 400);
    }

    const authToken = generateAccessToken({
      email: userExist.email,
      id: userExist.id,
    });

    const refreshToken = generateRefreshToken({
      email: userExist.email,
      id: userExist.id,
    });

    const expiresAt = new Date(Date.now() + cookieOptions.maxAge);

    await refreshTokenRepository.create({
      token: refreshToken,
      expiresAt,
      user: {
        connect: {
          id: userExist.id,
        },
      },
    });

    const userResponse = new LoginResponse(userExist);

    const returnableObject: LoginResult = {
      createdAt: userExist.createdAt,
      user: userResponse,
      accessToken: authToken,
      refreshToken,
    };

    const cacheKey = `user:${userExist.id}`;

    try {
      await redis.set(
        cacheKey,
        JSON.stringify({ ...userResponse, createdAt: userExist?.createdAt }),
        "EX",
        USER_CACHE_TTL,
      );
    } catch (error) {
      console.error("Failed to cache user:", error);
    }

    return returnableObject;
  }

  async rotateRefreshToken(refreshToken: string): Promise<RefreshDTO> {
    if (!refreshToken) throw new AppError("User Unauthorized", 401);

    const decoded = verifyRefreshToken(refreshToken);

    const isTokenPresent =
      await refreshTokenRepository.getRefreshTokenByToken(refreshToken);

    if (!isTokenPresent) throw new AppError("Refresh token not found", 404);
    if (isTokenPresent?.userId !== decoded?.id)
      throw new AppError("Unauthorized user", 401);
    const isRevoked = isTokenPresent.revoked;
    if (isRevoked) throw new AppError("Refresh token has been revoked", 401);
    if (isTokenPresent.expiresAt < new Date())
      throw new AppError("Refresh token has expired", 401);
    const tokenId = isTokenPresent.id;
    const userId = decoded.id;

    const userEmail = decoded?.email;

    const generateNewAccessToken = generateAccessToken({
      email: userEmail,
      id: userId,
    });

    const generateNewRefreshToken = generateRefreshToken({
      email: userEmail,
      id: userId,
    });
    const expiresAt = new Date(Date.now() + cookieOptions.maxAge);

    await refreshTokenRepository.updateRefreshTokenById(
      tokenId,
      generateNewRefreshToken,
      expiresAt,
    );

    return {
      accessToken: generateNewAccessToken,
      refreshToken: generateNewRefreshToken,
    };
  }

  async logoutUser(refreshToken: string): Promise<void> {
    const redis = getRedisClient();
    if (!refreshToken) {
      throw new AppError("Refresh token is required!", 401);
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      throw new AppError("Invalid refresh token", 401);
    }

    const tokenObj =
      await refreshTokenRepository.getRefreshTokenByToken(refreshToken);

    if (!tokenObj) {
      throw new AppError("Refresh token not found", 404);
    }

    if (tokenObj.revoked) {
      throw new AppError("Refresh token already revoked!", 401);
    }

    if (tokenObj.userId !== decoded.id) {
      throw new AppError("Unauthorized user", 401);
    }

    try {
      await redis.del(`user:${tokenObj.userId}`);
    } catch (error) {
      console.error("Redis DEL failed:", error);
    }

    await refreshTokenRepository.revokeRefreshToken(tokenObj.id);
  }

  async getUserDetails(id: string): Promise<UserDetailDTO> {
    const cacheKey = `user:${id}`;
    const redis = getRedisClient();
    try {
      const redisUser = await redis.get(cacheKey);

      if (redisUser) {

        return new UserDetailDTO(JSON.parse(redisUser));
      }

    } catch (error) {
      console.error("Redis GET failed:", error);
    }

    const user = await userRepository.findByIdOrEmail({ id });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    try {
      await redis.set(
        cacheKey,
        JSON.stringify({
          ...new LoginResponse(user),
          createdAt: user?.createdAt,
        }),
        "EX",
        USER_CACHE_TTL,
      );
    } catch (error) {
      console.error("Redis SET failed:", error);
    }

    return new UserDetailDTO(user);
  }

  async verifyEmail(token: string): Promise<void> {
    if (!token) throw new AppError("Email verification token is required", 400);

    const emailVerificationRecord =
      await emailVerificationRepository.getEmailVerificationByToken(token);

    if (!emailVerificationRecord)
      throw new AppError("Invalid email verification token", 400);

    const user = await userRepository.findByIdOrEmail({
      id: emailVerificationRecord?.userId,
    });
    if (!user) throw new AppError("User with this email id not found.", 404);
    if (user?.isVerified) throw new AppError("Email already verified", 400);
    if (emailVerificationRecord?.expiresAt < new Date())
      throw new AppError("Verification token expired", 400);
    await userRepository.verify(emailVerificationRecord?.userId);
    await emailVerificationRepository.deleteEmailVerificationToken(
      emailVerificationRecord?.id,
    );
    return;
  }

  async forgotPassword(email: string): Promise<void> {
    if (!email) throw new AppError("Email is required", 400);
    const user = await userRepository.findByIdOrEmail({ email });
    if (user) {
      const resetToken = generateRandomToken();

      await forgotPasswordRepository.deleteAllForgotTokenbyUserId(user?.id);
      await forgotPasswordRepository.createForgotPasswordToken({
        userId: user?.id,
        token: resetToken,
        expiresAt: new Date(
          Date.now() + authConstants.VERIFICATION_EMAIL_EXPIRY,
        ),
      });

      const emailURL = `${env.FRONTEND_URL}${env.FORGOT_PATH}?token=${resetToken}`;

      const getEmailToSend = generateForgotPasswordEmailTemplate(
        emailURL,
        user?.name,
      );

      try {
        await resendProvider.sendEmail({
          to: user?.email,
          html: getEmailToSend,
          subject: "Reset your password",
        });
      } catch (error) {
        throw new AppError("Failed to send email", 500);
      }
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const isTokenPresent =
      await forgotPasswordRepository.getForgotPasswordByToken(token);
    if (!isTokenPresent || isTokenPresent?.expiresAt < new Date())
      throw new AppError("Invalid or expired token", 400);
    const userId = isTokenPresent?.userId;
    const user = await userRepository.findByIdOrEmail({ id: userId });
    if (!user) throw new AppError("USer not found", 404);
    const hashedPassword = await hashPassword(newPassword);
    const isSamePassword = await comparePassword(newPassword, user?.password);
    if (isSamePassword)
      throw new AppError(
        "New password cannot be the same as the old password",
        400,
      );
    const updatedAt = new Date();
    await userRepository.updatePassword(userId, hashedPassword, updatedAt);
    await forgotPasswordRepository.deleteFordotPasswordByToken(token);
    await refreshTokenRepository.revokeAllByUserID(user?.id);
    const loginLink = `${env.FRONTEND_URL}${env.LOGIN_PATH}`;
    const getEmailToSend = generatePasswordUpdateSuccessEmail(
      user?.name,
      loginLink,
    );
    try {
      await resendProvider.sendEmail({
        to: user?.email,
        html: getEmailToSend,
        subject: "Password updated!",
      });
    } catch (error) {
      console.log("Update password Email Failed", error);
    }
    return;
  }

  async changePassword(
    id: string,
    newPassword: string,
    currentPassword: string,
  ): Promise<void> {
    const user = await userRepository.findByIdOrEmail({ id });
    if (!user) throw new AppError("User not found!", 404);
    const currentHash = user?.password;
    const isCurrentPasswordCorrect = await comparePassword(
      currentPassword,
      currentHash,
    );
    if (!isCurrentPasswordCorrect)
      throw new AppError("Current password is incorrect!", 400);
    const arePasswordSame = await comparePassword(newPassword, currentHash);
    if (arePasswordSame)
      throw new AppError("Password cannot be same as previous password!", 400);
    const hashedPassword = await hashPassword(newPassword);
    const updatedAt = new Date();
    await userRepository.updatePassword(id, hashedPassword, updatedAt);
    await refreshTokenRepository.revokeAllByUserID(id);
    const loginLink = `${env.FRONTEND_URL}${env.LOGIN_PATH}`;

    const getEmailToSend = generatePasswordUpdateSuccessEmail(
      user?.name,
      loginLink,
    );
    try {
      await resendProvider.sendEmail({
        to: user?.email,
        html: getEmailToSend,
        subject: "Password updated!",
      });
    } catch (error) {
      console.log("Update password Email Failed", error);
    }
    return;
  }

  async resendVerificationMail(email: string): Promise<void> {
    const user = await userRepository.findByIdOrEmail({ email });
    if (!user) throw new AppError("User not found", 404);
    const isUserVerified = user?.isVerified;
    if (isUserVerified) throw new AppError("Email already verified!", 400);
    const existingToken = await emailVerificationRepository.findTokenByUserId(
      user?.id,
    );
    if (existingToken)
      await emailVerificationRepository.deleteEmailVerificationToken(
        existingToken?.id,
      );

    const randomToken = generateRandomToken();
    const expiry = new Date(
      Date.now() + authConstants.VERIFICATION_EMAIL_EXPIRY,
    );

    await emailVerificationRepository.createEmailVerificationToken({
      userId: user?.id,
      token: randomToken,
      expiresAt: expiry,
    });
    const urlForVerification = `${env.FRONTEND_URL}${env.EMAIL_VERIFICATION_PATH}?token=${randomToken}`;

    const getEmailToSend = generateVerificationEmailTemplate(
      urlForVerification,
      user?.name,
    );
    try {
      await resendProvider.sendEmail({
        to: user?.email,
        html: getEmailToSend,
        subject: "Verify your email address",
      });
    } catch (error) {
      throw new AppError("Failed to send verification email", 500);
    }

    return;
  }
}

export default new AuthService();
