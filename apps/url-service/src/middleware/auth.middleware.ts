import { AppError } from "@rocket/shared";
import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/JWT.utils.js";

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const headers = req.headers.authorization;

    if (!headers) {
      throw new AppError("Authorization header missing!", 401);
    }
    if (!headers.startsWith("Bearer ")) {
      throw new AppError("Invalid authorization header!", 401);
    }
    const token = headers.split(" ")[1];
    if (!token) throw new AppError("Access token missing!", 401);
    const verifyToken = verifyAccessToken(token);
    if (!verifyToken) throw new AppError("Invalid token!", 401);
    req.user = verifyToken;
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(new AppError("Unauthorized access", 401));
  }
};
