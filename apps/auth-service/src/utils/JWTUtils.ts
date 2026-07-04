import jwt from "jsonwebtoken";
import { JWTPayload } from "../types/jwt.types.js";
import { env } from "../config/env.js";
import { AppError } from "../Classes/ResponseStructure.js";
import { authConstants } from "../constants/auth.constants.js";

const isJWTPayload = (payload: unknown): payload is JWTPayload => {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "id" in payload &&
    typeof payload.id === "string" &&
    "email" in payload &&
    typeof payload.email === "string"
  );
};
export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: authConstants.ACCESS_TOKEN_EXPIRY,
  });
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: authConstants.REFRESH_TOKEN_EXPIRY,
  });
};

export const verifyAccessToken = (token: string): JWTPayload => {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

  if (!isJWTPayload(decoded)) {
    throw new AppError("Invalid access token payload", 403);
  }

  return decoded;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  if (!isJWTPayload(decoded))
    throw new AppError("Invalid refresh token payload", 403);

  return decoded;
};
