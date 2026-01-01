import { Router } from "express";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPostById,
} from "../controllers/post-controller";
import { authMiddleware } from "../middlewares/auth-middleware";

const postRouter = Router();

postRouter.use(authMiddleware);

postRouter.post("/create-post", createPost);
postRouter.get("/all-posts", getAllPosts);
postRouter.get("/:id", getPostById);
postRouter.delete("/:id", deletePost);

export default postRouter;
