import { NextFunction, Request, Response } from "express";
import { AppError } from "../Classes/ResponseStructure.js";
import { verifyAccessToken } from "../utils/JWTUtils.js";

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AppError("Authorization header missing", 401);
    }
    if (!authHeader.startsWith("Bearer ")) {
      throw new AppError("Invalid authorization header", 401);
    }
    const token = authHeader.split(" ")[1];
    if (!token) throw new AppError("Access token missing", 401);
    const verifyToken = verifyAccessToken(token);
    req.user = verifyToken;

    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(new AppError("Unauthorized access", 401));
  }
};
