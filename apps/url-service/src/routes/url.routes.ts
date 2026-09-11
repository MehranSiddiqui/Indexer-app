import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import urlController from "../controllers/url.controller.js";

const urlRoute = Router();

urlRoute.post(
  "/addUrl",
  authMiddleware,
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

export default urlRoute;
