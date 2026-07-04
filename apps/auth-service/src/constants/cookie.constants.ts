import { env } from "../config/env.js";

const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
export const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: REFRESH_TOKEN_MAX_AGE,
} as const;
