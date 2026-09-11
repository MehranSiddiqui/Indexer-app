import logger from "./logger.js";
import helmet from "helmet";
import cors from "cors";
import express, { type Express, type Request, type Response } from "express";
import { errorHandlerGlobal } from "@rocket/shared";
import routeRegister from "./Classes/RouteRegister.class.js";

const app: Express = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

logger.info("Hello world!");

routeRegister.addRoutes();
const routes = routeRegister.getRoutes();
routes.forEach((route) => {
  app.use(route.path, route.router);
});

app.get("/health", (_req: Request, res: Response): void => {
  res.status(200).json({ service: "url", status: "OK" });
});

app.use(errorHandlerGlobal);
export default app;
