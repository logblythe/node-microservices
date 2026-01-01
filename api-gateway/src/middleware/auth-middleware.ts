import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";

export const validateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("No authorization header present");
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET!, (error, user) => {
    if (error) {
      logger.warn("Invalid token: %o", error);
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    req.user = user as { userId: string };
    next();
  });
};
