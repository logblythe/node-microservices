import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshUserToken,
  registerUser,
} from "../controllers/identity-controller";

const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/refresh-token", refreshUserToken);
userRouter.post("/logout", logoutUser);

export default userRouter;
