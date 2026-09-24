import { Url } from "../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { GET_URL, GET_URL_BY_ID, URLArgument } from "../DTO/CreateURL.DTO.js";
class UrlRepository {
  async createUrl(data: URLArgument): Promise<Url> {
    const [row] = await prisma.$queryRaw<Url[]>`
    INSERT INTO "Url" ("id","normalizedUrl","userId","url","createdAt","updatedAt") VALUES (gen_random_uuid(),${data?.normalizedUrl},${data?.userId},${data?.url},now(),now())
    
    ON CONFLICT ("userId","normalizedUrl")
    DO UPDATE SET "updatedAt"=now(),"publishedAt"=NULL 
    RETURNING *
    `;

    return row;
  }

  async markPublished(data: GET_URL_BY_ID): Promise<void> {
    await prisma.$executeRaw`
    UPDATE "Url" SET "publishedAt"=now() WHERE "id"=${data?.id} AND "userId"=${data?.userId}`;
  }

  async findURLById(data: GET_URL_BY_ID): Promise<Url | null> {
    const [row] = await prisma.$queryRaw<Url[]>`
    SELECT * FROM "Url" WHERE "id"=${data?.id} and "userId"=${data?.userId}`;

    return row ?? null;
  }

  async getAllUrls(data: GET_URL): Promise<Url[]> {
    const userID = data?.userId;
    const limit = data?.limit;
    const offSet = data?.offset;

    return await prisma.$queryRaw<Url[]>`
    SELECT * FROM "Url" WHERE "userId"=${userID}
    ORDER BY "createdAt" DESC
    LIMIT ${limit} OFFSET ${offSet}`;
  }

  async getUnPublishedUrls(limit: number): Promise<Url[]> {
    return await prisma.$queryRaw<Url[]>`
    Select * from "Url" where "publishedAt" is NULL
    order by "createdAt" ASC
    limit ${limit}
    `;
  }
}

const urlRepository = new UrlRepository();

export default urlRepository;
