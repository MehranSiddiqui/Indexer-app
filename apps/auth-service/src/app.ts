import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());//This is the bodyparser

app.get("/health", (_: Request, res: Response): void => {
  res.status(200).json({ service: "auth", status: "OK" });
});

export default app;
