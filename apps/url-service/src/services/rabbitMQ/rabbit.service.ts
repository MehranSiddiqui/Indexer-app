import { AppError } from "@rocket/shared";
import { env } from "../../config/env.js";
import { connect, Channel } from "amqplib";
import logger from "../../logger.js";
const url: string = env.RABBITMQ_URL;
const queue: string = "piIndexer0101";

class RabbitMQ {
  public channel?: Channel;
  async startRabbitMq() {
    const connection = await connect(url);
    this.channel = await connection.createChannel();

    
  }
  async sendMessage(message: string): Promise<void> {
    if (!this.channel) {
      throw new AppError("RabbitMQ channel is not initialized", 500);
    }
    const channel = this.channel;
    try {
      await channel.assertQueue(queue, {
        durable: true,
      });
      await channel.sendToQueue(queue, Buffer.from(message), {
        persistent: true,
      });
      console.log(`Message sent to ${queue}:${message}`);
    } catch (error) {
      logger.error({ err: error }, "Error sending message to RabbitMQ");
      throw new AppError("Error sending to RabbitMQ", 500);
    }
  }
}

const rabbitMQ = new RabbitMQ();

export default rabbitMQ;
