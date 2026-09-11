import { AppError } from "@rocket/shared";
import {
  GET_URL,
  GET_URL_BY_ID,
  GET_URL_BY_NORMALIZED_URL,
  ReturnUrl,
  URLCreateArgument,
} from "../DTO/CreateURL.DTO.js";
import urlRepository from "../repositories/url.repository.js";
import { normalizeURL } from "../utils/normalizeURL.utils.js";
import { Url } from "../generated/prisma/client.js";

class UrlService {
  async addNewURL(data: URLCreateArgument): Promise<ReturnUrl> {
    const createNewURL = await urlRepository.createUrl({
      normalizedUrl: normalizeURL(data.url),
      userId: data.userId,
      url: data.url,
    });
    return createNewURL;
  }
  async getUrlByNormalizedURL(data: GET_URL_BY_NORMALIZED_URL): Promise<Url> {
    const url = await urlRepository.findURLByNormalize(data);
    return url;
  }
  async getUrlById(data: GET_URL_BY_ID): Promise<Url> {
    const url = await urlRepository.findURLById({
      id: data?.id,
      userId: data.userId,
    });
    if (!url) throw new AppError("Url not found", 404);
    return url;
  }

  async getAllUrls(data: GET_URL): Promise<Url[]> {
    const userUrls = await urlRepository.getAllUrls(data);

    if (userUrls?.length <= 0)
      throw new AppError("No urls added by this user!", 404);

    return userUrls;
  }
}

const urlService = new UrlService();

export default urlService;
