import cors from "cors";
import dotenv from "dotenv";
import Express from "express";
import helmet from "helmet";
import { Redis } from "ioredis";
import mongoose from "mongoose";
import postRouter from "./routes/post-route";
import { logger } from "./utils/logger";
import { connectToRabbitMQ } from "./utils/rabbitmq";

dotenv.config();

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = Number(process.env.REDIS_PORT) || 6379;
const app = Express();

const redisClient: Redis = new Redis({
  host: redisHost,
  port: redisPort,
});

redisClient.on("connect", () => {
  logger.info("Redis client running on %s:%d", redisHost, redisPort);
});

mongoose
  .connect(MONGO_URI!)
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((err) => {
    logger.error("Failed to connect to MongoDB", err);
  });

// Middleware
app.use(helmet());
app.use(cors());
app.use(Express.json());

app.use(
  "/api/v1/posts",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRouter
);

async function startServer() {
  try {
    await connectToRabbitMQ();
    app.listen(PORT, () => {
      logger.info(`Post Service is running on port ${PORT}`);
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
