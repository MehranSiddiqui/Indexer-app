import { NextFunction, Request, Response } from "express";
import memoryStore from "./memoryStore.js";
import {
  DEFAULT_WINDOW,
  DEFAULT_MAX_REQUESTS,
} from "../../utils/rateLimiterUtils.js";
import { RateLimiterOptions } from "../../types/rateLimiter.types.js";
interface RateLimitRecord {
  count: number;
  expiresAt: number;
}

export const rateLimiterMiddleWare =
  ({
    maxRequests = DEFAULT_MAX_REQUESTS,
    windowMs = DEFAULT_WINDOW,
    keyGenerator,
  }: RateLimiterOptions) =>
  (req: Request, res: Response, next: NextFunction) => {
    const ip =
      keyGenerator?.(req) ?? req?.ip ?? req.socket?.remoteAddress ?? "unknown";
    const now = Date.now();

    let record = memoryStore.get(ip);
    if (!record || now > record.expiresAt) {
      record = {
        count: 0,
        expiresAt: now + windowMs,
      };
    }

    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.expiresAt - now) / 1000);

      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({
        message: "Too many requests. Please try again later",
        success: false,
      });
    }

    record.count++;
    memoryStore.set(ip, record);
    next();
  };
