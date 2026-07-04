import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { RegisterRoutes } from "./Classes/RegisterRoutes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json()); //This is the bodyparser

const routerRegistry = new RegisterRoutes();
routerRegistry.addRoutes();
const routes = routerRegistry.getRoutes();

routes.forEach((route) => {
  app.use(route.path, route.router);
});

console.log(routes);

app.get("/health", (_: Request, res: Response): void => {
  res.status(200).json({ service: "auth", status: "OK" });
});

app.use(errorHandler);

export default app;
