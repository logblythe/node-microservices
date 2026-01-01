import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { logger } from "../utils/logger";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
}).single("file");

export function singleFileUploadWithErrorHandling(
  req: Request,
  res: Response,
  next: NextFunction
) {
  upload(req, res, (err) => {
    if (!req.file) {
      logger.error("No file provided in the request");
      return res
        .status(400)
        .json({ success: false, message: "No file provided" });
    }
    if (err instanceof multer.MulterError) {
      logger.error("Multer error during file upload: %o", err);
      return res.status(400).json({
        success: false,
        message: "Multer error",
        error: err.message,
        stack: err.stack,
      });
    } else if (err) {
      logger.error("Unknown error during file upload: %o", err);
      return res.status(500).json({
        success: false,
        message: "Unknown error",
        error: err.message,
        stack: err.stack,
      });
    }
    next();
  });
}
