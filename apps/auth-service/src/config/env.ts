import z from "zod";

const envSchema = z.object({
  PORT: z.string().default("4001"),
  DATABASE_URI: z.url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  NODE_ENV: z.enum(["development", "qa", "staging", "production"]),
});

export const env = envSchema.parse(process.env);
