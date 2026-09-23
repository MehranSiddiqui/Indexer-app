import { AppError } from "@rocket/shared";
import app from "./app.js";
import { env } from "./config/env.js";
import logger from "./logger.js";
import rabbitMQ from "./services/rabbitMQ/rabbit.service.js";

const PORT = Number(env.PORT);
const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
const bootstrapApp = async () => {
  try {
    await rabbitMQ.startRabbitMq();
    const channel = rabbitMQ.channel;
    if (channel) {
      await startServer();
    }
  } catch (error) {
    logger.error({ err: error }, "Error starting server");
    throw new AppError("Error starting server", 500);
  }
};

bootstrapApp();
