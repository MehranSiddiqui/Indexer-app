import { prisma } from "../config/prisma.js";
import { Prisma } from "../generated/prisma/client.js";

class EmailVerificationRepository {
  async createEmailVerificationToken(
    data: Prisma.EmailVerificationUncheckedCreateInput,
  ) {
    return await prisma.emailVerification.create({ data });
  }

  async getEmailVerificationByToken(token: string) {
    return await prisma.emailVerification.findUnique({ where: { token } });
  }

  async deleteEmailVerificationToken(id: string) {
    return await prisma.emailVerification.delete({ where: { id } });
  }
}

const emailVerificationRepository = new EmailVerificationRepository();

export default emailVerificationRepository;
