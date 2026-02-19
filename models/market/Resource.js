import mongoose from "mongoose";

const ResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  subject: { type: String },
  course: { type: String },
  type: { type: String, enum: ["pdf", "doc", "video", "link", "other"], default: "other" },
  file: { type: String },                // url/path to file
  public: { type: Boolean, default: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Applications" },
  program: { type: String, index: true },
  className: { type: String, index: true },
  tags: [{ type: String }],
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

ResourceSchema.index({ title: "text", subject: "text", tags: 1 });

export default mongoose.model("Resource", ResourceSchema);
