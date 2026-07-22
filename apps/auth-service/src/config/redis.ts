import { Redis } from "ioredis";
import { env } from "./env.js"; // Update the path if your env helper is elsewhere

let redis: Redis | null = null;

export const connectRedis = async (): Promise<Redis> => {
  if (redis) {
    return redis;
  }

  redis = new Redis({
    host: env.REDIS_HOST,
    port: Number(env.REDIS_PORT),
    password: env.REDIS_PASSWORD || undefined,
    db: Number(env.REDIS_DB || 0),

    maxRetriesPerRequest: null,
    enableReadyCheck: true,

    retryStrategy(times: number) {
      const delay = Math.min(times * 100, 2000);
      console.log(`Redis reconnect attempt #${times} in ${delay}ms`);
      return delay;
    },
  });

  redis.on("connect", () => {
    console.log("🟢 Redis connected");
  });

  redis.on("ready", () => {
    console.log("✅ Redis ready");
  });

  redis.on("error", (err: Error) => {
    console.error("🔴 Redis error:", err);
  });

  redis.on("close", () => {
    console.warn("🟡 Redis connection closed");
  });

  redis.on("reconnecting", () => {
    console.log("🔄 Redis reconnecting...");
  });

  await redis.ping();

  return redis;
};

export const getRedisClient = (): Redis => {
  if (!redis) {
    throw new Error(
      "Redis has not been initialized. Call connectRedis() first.",
    );
  }

  return redis;
};
