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
}

const urlRepository = new UrlRepository();

export default urlRepository;
