import { Router } from "express";
import authController from "../controllers/auth.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validation.middleware.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

const authRoute = Router();

authRoute.post(
  "/register",
  validate(registerSchema),
  asyncHandler(authController.register.bind(authController)),
);

authRoute.post(
  "/login",
  validate(loginSchema),
  asyncHandler(authController.login.bind(authController)),
);

authRoute.post(
  "/refresh",
  asyncHandler(authController.refreshToken.bind(authController)),
);

authRoute.post(
  "/logout",
  asyncHandler(authController.logout.bind(authController)),
);
export default authRoute;
