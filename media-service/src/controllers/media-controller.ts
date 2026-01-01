import { NextFunction, Request, Response } from "express";
import MediaModel from "../models/media.schema";
import { uploadMediaToCloudinary } from "../utils/cloudinary";
import { logger } from "../utils/logger";

export const uploadMedia = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { originalname, mimetype, buffer } = req.file!;
    const userId = req.user!.userId;

    logger.info(
      "File details: Name - %s, Type - %s, Size - %d bytes",
      originalname,
      mimetype,
      buffer.length
    );

    logger.info("Uploading to Cloudinary for user: %s", userId);

    const result = await uploadMediaToCloudinary(req.file);
    logger.info(
      "Media uploaded successfully with public id %s",
      result.public_id
    );

    const media = new MediaModel({
      url: result.secure_url,
      mimeType: mimetype,
      uploadedBy: userId,
      originalName: originalname,
      publicId: result.public_id,
    });

    await media.save();
    logger.info("Media metadata saved to database: %o", media);
    return res
      .status(200)
      .json({ success: true, mediaId: media._id, url: media.url });
  } catch (error) {
    logger.error("Error uploading media file: %o", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
