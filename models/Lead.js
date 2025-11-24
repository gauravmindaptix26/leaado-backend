import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    website: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    originalName: { type: String, trim: true },
    fileName: { type: String, trim: true },
    mimeType: { type: String },
    size: { type: Number },
    sourceType: {
      type: String,
      enum: ["file", "url"],
      required: true
    },
    filePath: { type: String },
    fileUrl: { type: String },
    importUrl: { type: String },
    status: {
      type: String,
      enum: ["uploaded", "ready", "processing"],
      default: "uploaded"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Lead", leadSchema);
