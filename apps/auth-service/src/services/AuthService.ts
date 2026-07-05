import { AppError } from "../Classes/ResponseStructure.js";
import { authConstants } from "../constants/auth.constants.js";
import { cookieOptions } from "../constants/cookie.constants.js";
import { LoginRequestDTO, LoginResponse } from "../DTO/auth/Login.dto.js";
import { User } from "../generated/prisma/client.js";
import refreshTokenRepository from "../repositories/refreshToke.repository.js";
import userRepository from "../repositories/user.repository.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/JWTUtils.js";
import { comparePassword, hashPassword } from "../utils/PasswordUtils.js";
import { RegisterInput, LoginInput } from "../validators/auth.validator.js";

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
    return createUser;
  }

  async loginUser(data: LoginInput): Promise<LoginResult> {
    const userExist = await userRepository.findByIdOrEmail({
      email: data?.email,
    });
    if (!userExist) {
      throw new AppError("User with this email dows not exist!", 401);
    }
    const plainPassword = data?.password;

    const isValidPassword = await comparePassword(
      plainPassword,
      userExist?.password,
    );

    if (!isValidPassword) {
      throw new AppError("Invalid password!", 400);
    }

    const authToken = generateAccessToken({
      email: data?.email,
      id: userExist?.id,
    });
    const refreshToken = generateRefreshToken({
      email: data?.email,
      id: userExist?.id,
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

    return {
      createdAt: userExist?.createdAt,
      user: new LoginResponse(userExist),
      accessToken: authToken,
      refreshToken: refreshToken,
    };
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
    if (!refreshToken) throw new AppError("Refresh token is required!", 401);
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) throw new AppError("Invalid refresh token", 401);
    const tokenObj =
      await refreshTokenRepository.getRefreshTokenByToken(refreshToken);
    if (!tokenObj) throw new AppError("Refresh token not found", 404);
    if (tokenObj?.revoked)
      throw new AppError("Refresh token already revoked!", 401);
    if (tokenObj.userId !== decoded.id)
      throw new AppError("Unauthorized user", 401);

    await refreshTokenRepository.revokeRefreshToken(tokenObj.id);
  }
}

export default new AuthService();
