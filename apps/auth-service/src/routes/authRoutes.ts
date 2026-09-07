import { Router } from "express";
import authController from "../controllers/auth.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validation.middleware.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";
import { authenticate } from "../middleware/authenticate.middleware.js";
import { rateLimiterMiddleWare } from "../middleware/rateLimiter/rateLimiterindex.middleware.js";
import { routeRateLimits } from "../utils/rateLimiterUtils.js";

const authRoute = Router();

authRoute.post(
  "/register",
  rateLimiterMiddleWare(routeRateLimits.REGISTER),
  validate(registerSchema),
  asyncHandler(authController.register.bind(authController)),
);

authRoute.post(
  "/login",
  rateLimiterMiddleWare(routeRateLimits.LOGIN),
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

authRoute.get(
  "/profile",
  authenticate,
  authController.getCurrentUser.bind(authController),
);

authRoute.get(
  "/verify",
  authController.handleEmailVerification.bind(authController),
);

authRoute.post(
  "/forgot-password",
  rateLimiterMiddleWare(routeRateLimits.FORGOT_PASSWORD),
  authController.forgotPasswordByEmail.bind(authController),
);

authRoute.post(
  "/reset-password",
  authController.resetPassword.bind(authController),
);

authRoute.patch(
  "/change-password",
  authenticate,
  authController.resetPassword.bind(authController),
);

authRoute.post(
  "/resend-verification",
  rateLimiterMiddleWare(routeRateLimits.RESEND_VERIFICATION),
  authController.reverifyEmail.bind(authController),
);
export default authRoute;
