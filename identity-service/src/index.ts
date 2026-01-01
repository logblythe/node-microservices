import cors from "cors";
import dotenv from "dotenv";
import type { Request } from "express";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import Redis from "ioredis/built/Redis";
import mongoose from "mongoose";
import { RateLimiterRedis } from "rate-limiter-flexible";
import errorHandler from "./middleware/error-handler";
import identityRouter from "./routes/identity-route";
import { logger } from "./utils/logger";

dotenv.config();
const mongoURI = process.env.MONGO_URI;
const port = process.env.PORT || 3001;
const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;

const app = express();

//connect to mongodb
mongoose
  .connect(mongoURI!)
  .then(() => logger.info("Connected to MongoDB"))
  .catch((err) => logger.error("Failed to connect to MongoDB", err));

const redisClient = new Redis({
  host: redisHost,
  port: parseInt(redisPort!),
});

//middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info("Received %s request for %s", req.method, req.url);
  logger.info("Request body: %o", req.body);
  next();
});

//DDOS protection and rate limiting
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 100, // Number of points
  duration: 60, // Per second(s)
  blockDuration: 300, // Block for 5 minutes if consumed more than points
});

app.use((req: Request, res, next) => {
  rateLimiter
    .consume(req.ip!)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({ success: false, message: "Too Many Requests" });
    });
});

//Ip based rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
});

app.use("/api/v1/auth/register", sensitiveEndpointsLimiter);

app.use("/api/v1/auth", identityRouter);

app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Identity service is running on port ${port}`);
});

//unhandled promise rejection

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
