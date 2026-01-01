import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import {
  handlePostCreated,
  handlePostDeleted,
} from "./eventHandlers/search-event-handlers";
import { errorHandler } from "./middlewares/error-handler";
import searchRouter from "./routes/search-route";
import { logger } from "./utils/logger";
import { connectToRabbitMQ, consumeEvent } from "./utils/rabbitmq";

dotenv.config();

const app = express();
const PORT = process.env.PORT;
app.use(helmet());
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((error) => {
    logger.error("MongoDB connection error: %o", error);
  });

app.use("/api/v1", searchRouter);

app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();

    await consumeEvent("post.created", handlePostCreated);

    await consumeEvent("post.deleted", handlePostDeleted);

    app.listen(PORT, () => {
      logger.info(`Search service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Error starting server: %o", error);
  }
}

startServer();

export default app;
