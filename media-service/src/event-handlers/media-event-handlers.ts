import MediaModel from "../models/media.schema";
import { deleteMediaFromCloudinary } from "../utils/cloudinary";
import { logger } from "../utils/logger";

export const handlePostDeletedEvent = async (eventData: {
  postId: string;
  userId: string;
  mediaIds: string[];
}) => {
  try {
    const mediaToDelete = MediaModel.find({ _id: { $in: eventData.mediaIds } });

    for (const media of await mediaToDelete) {
      await deleteMediaFromCloudinary(media.publicId);
      await MediaModel.findByIdAndDelete(media._id);
      logger.info(
        `Deleted media with ID: ${media._id} associated with post ID: ${eventData.postId}`
      );
    }
    logger.info(
      `All media associated with post ID: ${eventData.postId} have been deleted.`
    );
  } catch (error) {
    logger.error("Error while deleting media");
  }
};
