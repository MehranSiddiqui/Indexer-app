import "dotenv/config";
import z from "zod";

const urlEnvSchema = z.object({
  PORT: z.string().default("4002"),
  DATABASE_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  APP_NAME: z.string(),
  API_PREFIX: z.string(),
  API_VERSION: z.string(),
  DEFAULT_PAGE_SIZE: z.string(),
  MAX_PAGE_SIZE: z.string(),
  RABBITMQ_URL: z.url(),
  MAX_URL_LENGTH: z.coerce.number().int().positive(),
});

export const env = urlEnvSchema.parse(process.env);
