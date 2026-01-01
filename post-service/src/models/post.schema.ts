import { model, Schema, Types } from "mongoose";
import { IPost } from "../types/IPost";

const postSchema: Schema<IPost> = new Schema<IPost>(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    mediaIds: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

postSchema.index({ content: "text" });

const PostModel = model<IPost>("Post", postSchema);

export default PostModel;
