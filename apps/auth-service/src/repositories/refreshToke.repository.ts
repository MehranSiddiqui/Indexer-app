import { prisma } from "../config/prisma.js";
import { User, Prisma } from "../generated/prisma/client.js";

class RefreshTokenRepository {
  async create(data: Prisma.RefresTokenCreateInput) {
    return await prisma.refresToken.create({ data });
  }

  async getRefreshTokenByToken(token: string) {
    return await prisma.refresToken.findUnique({ where: { token } });
  }

  async updateRefreshTokenById(id: string, newToken: string, expiresAt: Date) {
    return await prisma.refresToken.update({
      where: {
        id,
      },

      data: {
        token: newToken,
        expiresAt,
      },
    });
  }

  async revokeRefreshToken(id: string) {
    return prisma.refresToken.update({
      where: {
        id,
      },
      data: {
        revoked: true,
      },
    });
  }
  async deleteRefreshToken(id: string) {
    return await prisma.refresToken.delete({ where: { id } });
  }
}
const refreshTokenRepository = new RefreshTokenRepository();
export default refreshTokenRepository;
