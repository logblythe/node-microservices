import { Request, Response } from "express";
import { z } from "zod";
import PostModel from "../models/post.schema";
import { logger } from "../utils/logger";
import { publishEvent } from "../utils/rabbitmq";
import { validateCreatePost } from "../utils/validation";

async function invalidatePostCache(req: Request, input: string) {
  const cacheKey = `post:${input}`;
  await req.redisClient!.del(cacheKey);

  const keys = await req.redisClient!.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient!.del(keys);
    logger.info("Invalidated user posts cache for keys: %o", keys);
  }
}

export const createPost = async (req: Request, res: Response) => {
  try {
    const { error } = validateCreatePost(req.body);
    if (error) {
      logger.warn("Validation error creating post: %o", error.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: z.formatError(error),
      });
    }
    const { content, mediaIds = [] } = req.body;
    const userId = req.user!.userId;
    const newPost = new PostModel({
      user: userId,
      content,
      mediaIds,
    });
    await newPost.save();

    await publishEvent("post.created", {
      postId: newPost._id,
      userId: newPost.user,
      content: newPost.content,
      createdAt: newPost.createdAt,
    });

    await invalidatePostCache(req, newPost._id.toString());
    logger.info("Post created successfully by user: %o", newPost);
    return res.status(201).json({
      message: "Post created successfully",
      success: true,
      post: newPost,
    });
  } catch (error) {
    logger.error("Error creating post: %o", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;

    const cacheKey = `posts:${page}:${limit}`;
    const cachedPosts = await req.redisClient!.get(cacheKey);

    if (cachedPosts) {
      logger.info("Serving posts from cache for key: %s", cacheKey);
      return res.status(200).json({
        success: true,
        message: "Posts fetched successfully (from cache)",
        posts: JSON.parse(cachedPosts),
      });
    }

    const posts = await PostModel.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalPosts = await PostModel.countDocuments();

    const result = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    };
    await req.redisClient!.setex(cacheKey, 300, JSON.stringify(result));

    return res.status(200).json({
      success: true,
      message: "Posts fetched successfully",
      posts: result,
    });
  } catch (error) {
    logger.error("Error fetching posts: %o", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getPostById = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;
    const cacheKey = `post:${postId}`;
    const cachedPost = await req.redisClient!.get(cacheKey);

    if (cachedPost) {
      logger.info("Serving post from cache for key: %s", cacheKey);
      return res.status(200).json({
        success: true,
        message: "Post fetched successfully (from cache)",
        post: JSON.parse(cachedPost),
      });
    }

    const post = await PostModel.findById(postId);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    req.redisClient!.setex(cacheKey, 3600, JSON.stringify(post));

    return res.status(200).json({
      success: true,
      message: "Post fetched successfully",
      post,
    });
  } catch (error) {
    logger.error("Error fetching post by id: %o", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.userId;

    const post = await PostModel.findOneAndDelete({
      _id: postId,
      user: userId,
    });

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found or unauthorized" });
    }

    await publishEvent("post.deleted", {
      postId: post._id.toString(),
      userId: userId,
      mediaIds: post.mediaIds,
    });

    await invalidatePostCache(req, postId);

    logger.info("Post deleted successfully: %o", postId);
    return res
      .status(200)
      .json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    logger.error("Error deleting post by id: %o", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
