import { env } from "../config/env.js";

export const authConstants = {
  ACCESS_TOKEN_EXPIRY: "15m" as const,
  REFRESH_TOKEN_EXPIRY: "7d" as const,
  ACCESS_TOKEN_COOKIE_NAME: `${env.NODE_ENV}-authToken`,
  REFRESH_TOKEN_COOKIE_NAME: `${env.NODE_ENV}-refreshToken`,
  PASSWORD_HASH_ROUNDS: 12 as const,
  VERIFICATION_EMAIL_EXPIRY: 15*60*1000,
};
