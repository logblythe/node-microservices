import amqp from "amqplib";
import SearchPostModel from "../models/search.schema";
import { SearchPostType } from "../types/search-post";
import { logger } from "../utils/logger";

const handlePostCreated = async (msg: amqp.ConsumeMessage | null) => {
  try {
    if (!msg) return;

    const postData = JSON.parse(msg.content.toString());

    const searchPostModel = new SearchPostModel<SearchPostType>({
      postId: postData.postId,
      userId: postData.userId,
      content: postData.content,
    });
    await searchPostModel.save();
    logger.info("Post created event handled: %o", postData);
  } catch (error) {
    logger.error("Error handling post created event: %o", error);
  }
};

const handlePostDeleted = async (msg: amqp.ConsumeMessage | null) => {
  try {
    if (!msg) return;
    const postData = JSON.parse(msg.content.toString());

    await SearchPostModel.findOneAndDelete({ postId: postData.postId });
    logger.info("Post deleted event handled: %o", postData);
  } catch (error) {
    logger.error("Error handling post deleted event: %o", error);
  }
};

export { handlePostCreated, handlePostDeleted };
