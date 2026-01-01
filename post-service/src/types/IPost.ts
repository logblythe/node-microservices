import { Types } from "mongoose";

export interface IPost extends Document {
  user: Types.ObjectId;
  content: string;
  mediaIds?: string[];
  createdAt: string;
}
