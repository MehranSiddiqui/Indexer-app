import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";

class ForgotPasswordRepository {
  async createForgotPasswordToken(
    data: Prisma.PasswordResetsUncheckedCreateInput,
  ) {
    return await prisma.passwordResets.create({ data });
  }

  async getForgotPasswordByToken(token: string) {
    return await prisma.passwordResets.findUnique({ where: { token } });
  }

  async deleteFordotPasswordByToken(token: string) {
    return await prisma.passwordResets.delete({ where: { token } });
  }

  async deleteAllForgotTokenbyUserId(userId: string) {
    return await prisma.passwordResets.deleteMany({ where: { userId } });
  }
}

const forgotPasswordRepository = new ForgotPasswordRepository();

export default forgotPasswordRepository;
