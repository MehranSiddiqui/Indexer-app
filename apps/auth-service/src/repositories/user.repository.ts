import { prisma } from "../config/prisma.js";
import { User, Prisma } from "../generated/prisma/client.js";
type UUID = string & { readonly __brand: unique symbol };

class UserRepository {
  //   async findById(id: UUID): Promise<User | null> {
  //     return await prisma.user.findUnique({ where: { id } });
  //   }

  //   async findByEmail(email: string): Promise<User | null> {
  //     return await prisma.user.findUnique({ where: { email } });
  //   }

  async findByIdOrEmail(
    where: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    return await prisma.user.findUnique({
      where,
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User | null> {
    return await prisma.user.create({ data });
  }

  async verify(id: string): Promise<User | null> {
    return await prisma.user.update({
      where: { id },
      data: { isVerified: true },
    });
  }
}

export default new UserRepository();
