import "dotenv/config";
import z from "zod";

const urlEnvSchema = z.object({
  PORT: z.string().default("4002"),
  DATABASE_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(32),
});

export const env = urlEnvSchema.parse(process.env);
