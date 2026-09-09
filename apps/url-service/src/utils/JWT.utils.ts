import { AppError, isJWTPayload, JWTPayload } from "@rocket/shared";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const verifyAccessToken = (token: string): JWTPayload => {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (!isJWTPayload(decoded))
    throw new AppError("Invalid access token payload", 403);
  return decoded;
};
