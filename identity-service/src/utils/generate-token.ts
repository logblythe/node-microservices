import crypto from "crypto";
import jwt from "jsonwebtoken";
import RefreshTokenModel from "../models/refresh-token.schema";
import { IUser } from "../types/user";

export const generateToken = async (user: IUser) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const refreshTokenExpiresAt = new Date();
  refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7); // 7 days expiry

  await RefreshTokenModel.create({
    user: user._id,
    token: refreshToken,
    expiresAt: refreshTokenExpiresAt,
  });

  return { accessToken, refreshToken };
};
