import { Router } from "express";
import { searchController } from "../controllers/search-controller";
import { authMiddleware } from "../middlewares/auth-middleware";

const searchRouter = Router();

searchRouter.use(authMiddleware);

searchRouter.get("/search", searchController);

export default searchRouter;
