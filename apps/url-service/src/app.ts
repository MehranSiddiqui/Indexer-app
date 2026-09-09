import logger from "./logger.js";
import helmet from "helmet";
import cors from "cors";
import express, { type Express, type Request, type Response } from "express";

const app: Express = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

logger.info("Hello world!");
app.get("/health", (req: Request, res: Response): void => {
  res.status(200).json({ service: "url", status: "OK" });
});
export default app;
