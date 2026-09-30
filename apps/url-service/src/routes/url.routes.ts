import { Router } from "express";
import { validate } from "@rocket/shared";
import { authMiddleware } from "../middleware/auth.middleware.js";
import urlController from "../controllers/url.controller.js";
import { urlValidator } from "../validators/url.validator.js";

const urlRoute = Router();

urlRoute.post(
  "/addUrl",
  authMiddleware,
  validate(urlValidator),
  urlController.addUrl.bind(urlController),
);

urlRoute.get(
  "/allUrls",
  authMiddleware,
  urlController.getAllURls.bind(urlController),
);

urlRoute.get(
  "/url-detail/:id",
  authMiddleware,
  urlController.getUrlById.bind(urlController),
);

urlRoute.delete(
  "/delete-url/:id",
  authMiddleware,
  urlController.deleteUrl.bind(urlController),
);
urlRoute.patch(
  "/update-url-status/:id/reindex",
  authMiddleware,
  urlController.updateUrl.bind(urlController),
);
export default urlRoute;
