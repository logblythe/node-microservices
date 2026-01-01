import amqp from "amqplib";
import { logger } from "./logger";

let channelModel: amqp.ChannelModel | null = null;
let channel: amqp.Channel | null = null;

const EXCHANGE_NAME = "post_exchange";

export const connectToRabbitMQ = async () => {
  try {
    channelModel = await amqp.connect(process.env.RABBITMQ_URI!);
    channel = await channelModel.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
    logger.info("Connected to RabbitMQ and exchange asserted");
    return channel;
  } catch (error) {
    logger.error("Error connecting to RabbitMQ: %o", error);
  }
};

export const consumeEvent = async (
  routingKey: string,
  callback: (msg: amqp.ConsumeMessage | null) => void
) => {
  if (!channel) {
    await connectToRabbitMQ();
    return;
  }

  const q = await channel.assertQueue("", { exclusive: true });
  await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);
  channel.consume(q.queue, (msg) => {
    callback(msg);
  });

  logger.info(`Subscribed to event: ${routingKey}`);
};
