import { Schema, model } from "mongoose";
import { IRefreshToken } from "../types/refresh-token";

const refreshTokenSchema: Schema<IRefreshToken> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshTokenModel = model<IRefreshToken>(
  "RefreshToken",
  refreshTokenSchema
);

export default RefreshTokenModel;
