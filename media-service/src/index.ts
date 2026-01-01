import cors from "cors";
import dotenv from "dotenv";
import Express from "express";
import helmet from "helmet";
import Redis from "ioredis";
import mongoose from "mongoose";
import { handlePostDeletedEvent } from "./event-handlers/media-event-handlers";
import errorHandler from "./middlewares/error-handler";
import mediaRouter from "./routes/media-routes";
import { logger } from "./utils/logger";
import { connectToRabbitMQ, consumeEvent } from "./utils/rabbitmq";

dotenv.config();

const app = Express();

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = Number(process.env.REDIS_PORT);

mongoose
  .connect(MONGO_URI!)
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((err) => {
    logger.error("Failed to connect to MongoDB", err);
  });

const redisClient: Redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
});

redisClient.on("connect", () => {
  logger.info("Connected to Redis");
});

redisClient.on("error", (err) => {
  logger.error("Redis connection error: %s", err);
});

// Middleware
app.use(helmet());
app.use(cors());

app.use("/api/v1/media", mediaRouter);

app.use(Express.json());

app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();

    await consumeEvent("post.deleted", handlePostDeletedEvent);

    app.listen(PORT, () => {
      logger.info(`Media Service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Error starting server:", error);
    process.exit(1);
  }
}

startServer();

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});
