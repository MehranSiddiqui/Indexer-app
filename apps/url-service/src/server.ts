import { AppError } from "@rocket/shared";
import app from "./app.js";
import { env } from "./config/env.js";
import logger from "./logger.js";
import rabbitMQ from "./services/rabbitMQ/rabbit.service.js";
import { closePrisma } from "./config/prisma.js";

const PORT = Number(env.PORT);
const SHUTDOWN_TIMEOUT = 10000;
let isShuttingDown = false;

const startServer = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const bootstrapApp = async () => {
  try {
    await rabbitMQ.startRabbitMq();
  } catch (error) {
    logger.error({ err: error }, "Error starting server");
    throw new AppError("Error starting server", 500);
  }
};

bootstrapApp().catch((err) => {
  logger.error({ err }, "Failed to bootstrap app");
  process.exit(1);
});

const gracefulShutDown = (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`Received this ${signal}, shutting down gracefully`);

  const forceExit = setTimeout(() => {
    logger.error("Graceful shutdown failed, force shut down implemented.");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);
  startServer.close(async (err) => {
    if (err)
      logger.error({ err }, "There was an error while closing http server");
    else logger.info("Http server closed");

    await Promise.allSettled([rabbitMQ.closeRabbitMQ(), closePrisma()]);
    clearTimeout(forceExit);
    process.exit(err ? 1 : 0);
  });
};

process.on("SIGINT", () => gracefulShutDown("SIGINT"));
process.on("SIGTERM", () => gracefulShutDown("SIGTERM"));
