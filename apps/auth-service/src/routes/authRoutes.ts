import { Router } from "express";
import authController from "../controllers/auth.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validation.middleware.js";
import { registerSchema } from "../validators/auth.validator.js";

const authRoute = Router();

authRoute.post(
  "/",
  validate(registerSchema),
  asyncHandler(authController.register.bind(authController)),
);

export default authRoute;
