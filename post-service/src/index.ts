import cors from "cors";
import dotenv from "dotenv";
import Express from "express";
import { rateLimit } from "express-rate-limit";
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

const rateLimitOptions = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn("Rate limit exceeded for IP: %s", req.ip);
    res.status(429).json({
      message: "Too many requests, please try again later.",
    });
  },
});

app.use(rateLimitOptions);

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
