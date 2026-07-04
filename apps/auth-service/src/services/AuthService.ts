import { User } from "../generated/prisma/client.js";
import userRepository from "../repositories/user.repository.js";
import { RegisterPayloadDTO } from "../types/auth.types.js";
import { hashPassword } from "../utils/PasswordUtils.js";
class AuthService {
  async registerNewUser(data: RegisterPayloadDTO): Promise<User> {
    const existingUser = await userRepository.findByIdOrEmail({
      email: data?.email,
    });

    if (existingUser) {
      throw new Error("User with this Email already exists");
    }
    const hashedPassword = await hashPassword(data?.password);
    const createUser = await userRepository.create({
      ...data,
      password: hashedPassword,
    });

    if (!createUser) throw new Error("Unable to create user");
    return createUser;
  }
}

export default new AuthService();
