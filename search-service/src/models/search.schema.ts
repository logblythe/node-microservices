import mongoose from "mongoose";
import { SearchPostType } from "../types/search-post";

const searchPostSchema = new mongoose.Schema<SearchPostType>(
  {
    postId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

searchPostSchema.index({ content: "text" });
searchPostSchema.index({ createdAt: -1 });

const SearchPostModel = mongoose.model<SearchPostType>(
  "search-posts",
  searchPostSchema
);

export default SearchPostModel;
