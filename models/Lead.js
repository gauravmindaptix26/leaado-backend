import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    website: {
      type: String,
      trim: true,
      lowercase: true,
      required: function () {
        return this.sourceType === "url";
      }
    },
    contactName: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },
    service: { type: String, trim: true },
    message: { type: String, trim: true },
    sourceWebsite: { type: String, trim: true },
    pitchMessage: { type: String, trim: true },
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
      enum: ["uploaded", "ready", "processing", "Pending", "Success", "Rejected", "In-Process", "Failed"],
      default: "Pending"
    },
    pitchResult: {
      type: String,
      enum: ["Pending", "Success", "Failed"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

leadSchema.index({ owner: 1, website: 1 }, { unique: true });

export default mongoose.model("Lead", leadSchema);
