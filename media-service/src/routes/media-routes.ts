import { Router } from "express";
import { uploadMedia } from "../controllers/media-controller";
import { authMiddleware } from "../middlewares/auth-middleware";
import { singleFileUploadWithErrorHandling as multerMiddleware } from "../middlewares/multer-middleware";

const mediaRouter = Router();

mediaRouter.get("/health-check", (req, res) => {
  res.status(200).json({ status: "Media Service is healthy" });
});

mediaRouter.post("/upload", authMiddleware, multerMiddleware, uploadMedia);

export default mediaRouter;
