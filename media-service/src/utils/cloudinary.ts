import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { logger } from "./logger";

export const uploadMediaToCloudinary = async (file: any) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "media-service", resource_type: "auto" },
      (error, result) => {
        if (error) {
          logger.error("Error while uploading media to cloudinary", error);
          return reject(error);
        } else {
          if (!result) {
            return reject(new Error("Cloudinary returned no result"));
          }
          return resolve(result);
        }
      }
    );
    uploadStream.end(file.buffer);
  });
};

export const deleteMediaFromCloudinary = async (publicId: string) => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info("Media deleted successfully from cloud storage", publicId);
    return result;
  } catch (error) {
    logger.error("Error deleting media from cloudinary", error);
    throw error;
  }
};
