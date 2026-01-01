import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import proxy from "express-http-proxy";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import Redis from "ioredis";
import { validateToken } from "./middleware/auth-middleware";
import { errorHandler } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";
import { logger } from "./utils/logger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = Number(process.env.REDIS_PORT) || 6379;

const redisClient = new Redis({
  host: redisHost,
  port: redisPort,
});

redisClient.on("connect", () => {
  logger.info("Connected to Redis");
});

redisClient.on("error", (err) => {
  logger.error("Redis connection error: %s", err);
});

//middlewares
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(requestLogger);

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
  "/identity-service",
  proxy(process.env.IDENTITY_SERVICE_URL!, {
    proxyReqPathResolver: (req) =>
      req.originalUrl.replace("/identity-service", ""),
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      userRes.setHeader("X-Proxy-By", "API Gateway");
      logger.info(
        "Response received from Identity Service: %s",
        proxyRes.statusCode
      );
      return proxyResData;
    },
    proxyErrorHandler: (err, res, next) => {
      logger.error("Error in proxying request: %s", err.message);
      next(err);
    },
  })
);

app.use(
  "/post-service",
  validateToken,
  proxy(process.env.POST_SERVICE_URL!, {
    proxyReqPathResolver: (req) => req.originalUrl.replace("/post-service", ""),
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq.user!.userId;
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      userRes.setHeader("X-Proxy-By", "API Gateway");
      logger.info(
        "Response received from Post Service: %s",
        proxyRes.statusCode
      );
      return proxyResData;
    },
    proxyErrorHandler: (err, res, next) => {
      logger.error("Error in proxying request: %s", err.message);
      next(err);
    },
  })
);

app.use(
  "/media-service",
  validateToken,
  proxy(process.env.MEDIA_SERVICE_URL!, {
    proxyReqPathResolver: (req) =>
      req.originalUrl.replace("/media-service", ""),
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["x-user-id"] = srcReq.user!.userId;
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      userRes.setHeader("X-Proxy-By", "API Gateway");
      logger.info(
        "Response received from Media Service: %s",
        proxyRes.statusCode
      );
      return proxyResData;
    },
    proxyErrorHandler: (err, res, next) => {
      logger.error("Error in proxying request: %s", err.message);
      next(err);
    },
    parseReqBody: false,
  })
);

app.use(
  "/search-service",
  validateToken,
  proxy(process.env.SEARCH_SERVICE_URL!, {
    proxyReqPathResolver: (req) =>
      req.originalUrl.replace("/search-service", ""),
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq.user!.userId;
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      userRes.setHeader("X-Proxy-By", "API Gateway");
      logger.info(
        "Response received from Search Service: %s",
        proxyRes.statusCode
      );
      return proxyResData;
    },
    proxyErrorHandler: (err, res, next) => {
      logger.error("Error in proxying request: %s", err.message);
      next(err);
    },
  })
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway is running on port ${PORT}`);
});
