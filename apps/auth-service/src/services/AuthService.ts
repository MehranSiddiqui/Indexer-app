import { AppError } from "../Classes/ResponseStructure.js";
import { User } from "../generated/prisma/client.js";
import userRepository from "../repositories/user.repository.js";
import { hashPassword } from "../utils/PasswordUtils.js";
import { RegisterInput } from "../validators/auth.validator.js";

type ReturnUser = {
  id: string;
  name: string;
  email: string;
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
}

export default new AuthService();
