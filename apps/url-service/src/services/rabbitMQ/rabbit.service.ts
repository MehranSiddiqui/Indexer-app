import { AppError } from "@rocket/shared";
import { env } from "../../config/env.js";
import { connect, Channel, ChannelModel, ConfirmChannel } from "amqplib";
import logger from "../../logger.js";

const url: string = env.RABBITMQ_URL;
const queue: string = "piIndexer0101";
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;
const BACKOFF_FACTOR = 2;

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

class RabbitMQ {
  public channel?: ConfirmChannel;
  private connectionModel?: ChannelModel;
  // Guards against two reconnect loops running at once (e.g. connection and channel both firing "close" for the same underlying disconnect).
  private isConnecting = false;
  //flag for shut down, so when closing the retry or reconnect doesnot get called
  private isShuttingDown = false;
  // Number of failed connect attempts in a row; feeds the backoff delay
  // and resets to 0 once a connection succeeds.
  private reconnectAttempt = 0;

  async startRabbitMq(): Promise<void> {
    if (this.isConnecting || this.isShuttingDown) return;
    this.isConnecting = true;
    try {
      await this.connectWithRetry();
    } finally {
      this.isConnecting = false;
    }
  }

  // Keeps retrying forever (with growing backoff) until a connection,
  // channel, and the queue assertion all succeed - a slow/late-starting
  // broker should not stop this service from eventually coming up.
  private async connectWithRetry(): Promise<void> {
    if (this.isShuttingDown) return;
    for (;;) {
      try {
        const connectionModel = await connect(url);
        const channel = await connectionModel.createConfirmChannel();
        await channel.assertQueue(queue, { durable: true });
        this.connectionModel = connectionModel;
        this.channel = channel;
        this.reconnectAttempt = 0;

        // Both the connection and the channel are EventEmitters that can
        // die independently, so both need "error" and "close" listeners
        // wired up again after every (re)connect.
        connectionModel.on("error", (err) => {
          this.handleDisconnect("connection", err);
        });

        connectionModel.on("close", () => {
          this.handleDisconnect(
            "connection",
            new AppError("RabbitMQ conncetion closed!"),
          );
        });

        channel.on("error", (err) => {
          this.handleDisconnect("channel", err);
        });

        channel.on("close", () => {
          this.handleDisconnect(
            "channel",
            new AppError("RabbitMQ channel closed!"),
          );
        });

        logger.info("Connected to RabbitMq!");
        return;
      } catch (error) {
        if (this.isShuttingDown) return;
        const delay = this.getBackOffDelay();
        logger.error(
          { err: error },
          `Failed to connect to RabbitMQ, retrying in ${delay}ms`,
        );
        await sleep(delay);
      }
    }
  }

  private handleDisconnect(source: string, error: unknown) {
    // A single disconnect usually fires "close" on both the connection
    // and the channel in the same tick; once the first call clears these,
    // the second call sees them already undefined and skips reconnecting
    // a second time.
    if ((!this.channel && !this.connectionModel) || this.isShuttingDown) return;
    logger.error(
      { err: error, source },
      "Lost RabbitMQ connection, reconnecting!",
    );
    this.channel = undefined;
    this.connectionModel = undefined;
    void this.startRabbitMq();
  }

  // Exponential backoff capped at MAX_RETRY_DELAY: 1s, 2s, 4s, 8s, ...
  // up to 30s, so a struggling broker isn't hammered with retries.
  private getBackOffDelay(): number {
    const delay = Math.min(
      INITIAL_RETRY_DELAY * BACKOFF_FACTOR ** this.reconnectAttempt,
      MAX_RETRY_DELAY,
    );
    this.reconnectAttempt += 1;
    return delay;
  }

  async sendMessage(message: string): Promise<void> {
    // No channel means we're mid-(re)connect - 503 tells the caller this
    // is temporary and worth retrying, unlike a hard 500 failure.
    if (!this.channel) {
      throw new AppError("RabbitMQ channel is not initialized", 503);
    }
    const channel = this.channel;
    return new Promise<void>((res, rej) => {
      try {
        channel.sendToQueue(
          queue,
          Buffer.from(message),
          { persistent: true },
          (err) => {
            if (err) {
              logger.error({ err }, "RabbitMQ nacked the message");
              rej(new AppError("Failed to send the message", 500));
            } else {
              logger.info(`Message confirmed by broker for ${queue}`);
              res();
            }
          },
        );
      } catch (error) {
        logger.error({ err: error }, "Failed to send the message");
        rej(new AppError("Failed to send the message", 500));
      }
    });
  }

  async closeRabbitMQ(): Promise<void> {
    this.isShuttingDown = true;
    if (this.channel) {
      await this.channel.close().catch((error) => {
        logger.error({ err: error }, "Error closing RabbitMQ channel");
      });
      this.channel = undefined;
    }
    if (this.connectionModel) {
      await this.connectionModel.close().catch((error) => {
        logger.error({ err: error }, "Error closing RabbitMQ connection");
      });
      this.connectionModel = undefined;
    }
  }
}

const rabbitMQ = new RabbitMQ();

export default rabbitMQ;
