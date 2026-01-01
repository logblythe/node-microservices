import type { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

export const errorHandler = (
  error: Error,
  req: Request,
  response: Response,
  next: NextFunction
) => {
  logger.error("Unhandled error: %s", error.message);
  logger.error(error.stack);
  return response
    .status(500)
    .json({ success: false, message: "Internal server error" });
};
