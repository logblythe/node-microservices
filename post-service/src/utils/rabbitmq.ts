import amqplib, { Channel, ChannelModel } from "amqplib";
import { logger } from "./logger";

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

const EXCHANGE_NAME = "post_exchange";

export const connectToRabbitMQ = async () => {
  try {
    connection = await amqplib.connect(process.env.RABBITMQ_URI!);
    channel = await connection.createChannel();

    channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
    logger.info("Connected to RabbitMQ successfully.");
    return channel;
  } catch (error) {
    logger.error("Error connecting to RabbitMQ:", error);
  }
};

export const publishEvent = async (routingKey: string, message: object) => {
  if (!channel) {
    logger.warn("RabbitMQ channel is not established.");
    await connectToRabbitMQ();
  }

  channel!.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message))
  );
  logger.info(`Event published to ${routingKey}: ${JSON.stringify(message)}`);
};
