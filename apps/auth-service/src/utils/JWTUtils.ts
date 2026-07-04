import jwt from "jsonwebtoken";
import { JWTPayload } from "../types/jwt.types.js";
import { env } from "../config/env.js";
export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: "15m",
  });
};
