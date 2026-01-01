import { model, Schema, Types } from "mongoose";

const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    uploadedBy: { type: Types.ObjectId, ref: "User", required: true },
    originalName: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { timestamps: true }
);

const MediaModel = model("Media", mediaSchema);

export default MediaModel;
