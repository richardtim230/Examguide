import mongoose from "mongoose";

const AdSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["image", "url", "video", "html", "text"],
    required: true
  },
  content: { type: String, required: true },
  actions: [
    {
      type: { type: String, enum: ["download", "visit", "share"], required: true },
      label: { type: String },
      url: { type: String }
    }
  ],
  meta: {
    title: { type: String },
    description: { type: String }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Ad", AdSchema);
