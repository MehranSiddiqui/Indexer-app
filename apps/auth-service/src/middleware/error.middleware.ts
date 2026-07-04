import { ErrorRequestHandler } from "express";
import { AppError, ErrorResponse } from "../Classes/ResponseStructure.js";
import { ZodError } from "zod";

/** Global Error Handler */
export const errorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
_next
): void => {
console.log("Error middleware hit");
  
  if (err instanceof AppError) {
    res.status(err.code).json(new ErrorResponse(err.message, err.code));

    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json(
      new ErrorResponse(
        "Validation Failed",
        err.issues.map((issue) => ({
          filed: issue.path.join("."),
          message: issue.message,
        })),
      ),
    );
    return;
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
