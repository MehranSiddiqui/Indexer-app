import { ZodError, ZodType } from "zod";
import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod/v3";

export const validate =
  (schema: ZodType) =>
  (req: Request, _: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
        return;
      }

      next(error);
    }
  };
