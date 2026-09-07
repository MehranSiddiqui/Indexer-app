import logger from "./logger.js";
import helmet from "helmet";
import cors from "cors";
import express, { type Express } from "express";

const PORT = process.env.PORT || 4002;
const app: Express = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

logger.info("Hello world!");
app.get("/health", () => {
  console.log(`Server Running on ${PORT}`);
});
export default app;
