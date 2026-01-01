import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err.stack);

  res.status(500).json({
    message: "Internal Server Error",
    error: err.message,
  });
};

export default errorHandler;
