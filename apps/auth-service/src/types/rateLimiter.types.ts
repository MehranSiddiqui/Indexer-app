import { Request } from "express";

export interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: Request) => string;
}

export interface RateLimitRecord {
  count: number;
  expiresAt: number;
}
