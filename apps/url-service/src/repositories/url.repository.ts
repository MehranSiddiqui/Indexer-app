import { Prisma, Url } from "../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import {
  GET_URL,
  GET_URL_BY_ID,
  UPDATE_URL_STATUS,
  URLArgument,
} from "../DTO/CreateURL.DTO.js";

class UrlRepository {
  async createUrl(data: URLArgument): Promise<Url> {
    const [row] = await prisma.$queryRaw<Url[]>`
    INSERT INTO "Url" ("id","normalizedUrl","userId","url","createdAt","updatedAt") VALUES (gen_random_uuid(),${data?.normalizedUrl},${data?.userId},${data?.url},now(),now())
    
    ON CONFLICT ("userId","normalizedUrl")
    DO UPDATE SET "updatedAt"=now(),"publishedAt"=NULL ,"status" = 'Pending', "statusReason"=NULL,"statusUpdatedAt"= now(), "publishAttempts"=0, "isDeleted"=false, "deletedAt"=NULL
    RETURNING *
    `;

    return row;
  }
  async increaseAttempt(
    tx: Prisma.TransactionClient,
    data: GET_URL_BY_ID,
  ): Promise<void> {
    await tx.$executeRaw`
  UPDATE "Url"
  SET
    "publishAttempts" = "publishAttempts" + 1,
    "status" = CASE
      WHEN "publishAttempts" < 5 THEN "status"
      ELSE 'Failed'
    END,
    "statusUpdatedAt"=now()
  WHERE "id" = ${data?.id}
    AND "userId" = ${data?.userId}
`;
  }

  async markPublished(
    tx: Prisma.TransactionClient,
    data: GET_URL_BY_ID,
  ): Promise<void> {
    await tx.$executeRaw`
    UPDATE "Url" SET "publishedAt"=now(), "status"='Queued',"statusUpdatedAt"=now() WHERE "id"=${data?.id} AND "userId"=${data?.userId}`;
  }

  async findURLById(data: GET_URL_BY_ID): Promise<Url | null> {
    const [row] = await prisma.$queryRaw<Url[]>`
    SELECT * FROM "Url" WHERE "id"=${data?.id} and "userId"=${data?.userId} and "isDeleted"=false and "deletedAt" IS NULL`;

    return row ?? null;
  }

  async getAllUrls(data: GET_URL): Promise<(Url & { totalCount: bigint })[]> {
    const userID = data?.userId;
    const limit = data?.limit;
    const offSet = data?.offset;

    return await prisma.$queryRaw<(Url & { totalCount: bigint })[]>`
  SELECT *, COUNT(*) OVER() AS "totalCount" FROM "Url" WHERE "userId"=${userID} and "isDeleted"=false and "deletedAt" IS NULL
  ORDER BY "createdAt" DESC
  LIMIT ${limit} OFFSET ${offSet}
  `;
  }


  private async claimNextPendingUrl(
    tx: Prisma.TransactionClient,
  ): Promise<Url | null> {
    const [row] = await tx.$queryRaw<Url[]>`
    SELECT * FROM "Url" WHERE "status" = 'Pending' and "isDeleted"=false and "deletedAt" IS NULL
    ORDER BY "publishAttempts" ASC, "createdAt" ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
    `;
    return row ?? null;
  }

  async withNextPendingUrl<T>(
    work: (tx: Prisma.TransactionClient, url: Url) => Promise<T>,
  ): Promise<T | null> {
    return await prisma.$transaction(async (tx) => {
      const url = await this.claimNextPendingUrl(tx);
      if (!url) return null;
      return await work(tx, url);
    });
  }

  async updateURLStatus(data: GET_URL_BY_ID): Promise<Url[]> {
    return await prisma.$queryRaw<Url[]>`
    UPDATE "Url" SET "status"='Pending', "statusReason"='Manual reindex initiated' WHERE "id"=${data?.id} AND "userId"=${data?.userId}
    RETURNING *
    `;
  }

  async deleteUrl(data: GET_URL_BY_ID): Promise<Url[]> {
    return await prisma.$queryRaw<Url[]>`
    UPDATE "Url" SET "isDeleted"=true, "deletedAt" = now(),status = 'Aborted', "statusReason"='Deleted by user' WHERE "id"=${data?.id} AND "userId" = ${data?.userId} AND "isDeleted" = false AND "deletedAt" IS NULL
    RETURNING *
    `;
  }
}

const urlRepository = new UrlRepository();

export default urlRepository;
