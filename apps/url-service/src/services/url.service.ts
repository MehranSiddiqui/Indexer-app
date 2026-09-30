import { AppError } from "@rocket/shared";
import {
  GET_URL,
  GET_URL_BY_ID,
  UPDATE_URL_STATUS,
  URLCreateArgument,
} from "../DTO/CreateURL.DTO.js";
import urlRepository from "../repositories/url.repository.js";
import { normalizeURL } from "../utils/normalizeURL.utils.js";
import { validateTargetUrl } from "../utils/validateTargetUrl.utils.js";
import { env } from "../config/env.js";
import { Url } from "../generated/prisma/client.js";
import rabbitMQ from "./rabbitMQ/rabbit.service.js";
import logger from "../logger.js";

class UrlService {
  async addNewURL(
    data: URLCreateArgument,
  ): Promise<{ url: Url; isNewUrl: boolean }> {
    await validateTargetUrl(data.url);
    const normalizedUrl = normalizeURL(data.url);
    if (normalizedUrl.length > env.MAX_URL_LENGTH) {
      throw new AppError("Bad request. Url too long", 400);
    }
    const createNewURL = await urlRepository.createUrl({
      normalizedUrl,
      userId: data.userId,
      url: data.url,
    });
    const isNewUrl =
      createNewURL.createdAt.getTime() === createNewURL.updatedAt.getTime();
    return { url: createNewURL, isNewUrl };
  }
  async getUrlById(data: GET_URL_BY_ID): Promise<Url> {
    const url = await urlRepository.findURLById({
      id: data?.id,
      userId: data.userId,
    });
    if (!url) throw new AppError("Url not found", 404);
    return url;
  }

  async getAllUrls(
    data: GET_URL,
  ): Promise<{ urls: Url[]; total: number; limit: number; offset: number }> {
    const rows = await urlRepository.getAllUrls(data);

    if (rows.length === 0) {
      return { urls: [], total: 0, limit: data.limit, offset: data.offset };
    }

    const total = Number(rows[0].totalCount);
    const urls = rows.map(({ totalCount, ...url }) => url);

    return { urls, total, limit: data.limit, offset: data.offset };
  }

  async incrementPublishAttempts(data: GET_URL_BY_ID): Promise<void> {
    try {
      await urlRepository.increaseAttempt(data);
    } catch (err) {
      logger.error(
        { err, urlId: data?.id },
        "Failed to increment the attempt, will rerun publishing with cron",
      );
    }
  }

  async publishUrl(data: Url): Promise<void> {
    try {
      await rabbitMQ.sendMessage(JSON.stringify(data));
      await urlRepository.markPublished({ id: data?.id, userId: data?.userId });
    } catch (err) {
      logger.error(
        { err, urlId: data?.id },
        "Failed to publish url, will rerun publishing with cron",
      );
      await this.incrementPublishAttempts(data);
    }
  }

  async getUnPublishedURLS(): Promise<void> {
    const PUBLISH_BATCH_SIZE = 20;
    const urls = await urlRepository.getUnPublishedUrls(PUBLISH_BATCH_SIZE);
    for (const url of urls) {
      await this.publishUrl(url);
    }
  }

  async deleteURL(data: GET_URL_BY_ID): Promise<void> {
    
      const [deleted] = await urlRepository.deleteUrl(data);
      if (!deleted) throw new AppError("Url not found", 404);
   
  }

  async updateUrlStatus(data: GET_URL_BY_ID): Promise<void> {
   
      const [updatedUrl] = await urlRepository.updateURLStatus(data);
      if (!updatedUrl) throw new AppError("Url not found", 404);
   
  }
}

const urlService = new UrlService();

export default urlService;
