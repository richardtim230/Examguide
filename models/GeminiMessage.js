import mongoose from "mongoose";

const GeminiMessageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  channel: { type: String, default: "general" }, // NEW - topic/channel
  messages: [{ role: String, content: String }], // full context for Gemini
  image: {
    mimeType: String,
    fileName: String,
    refNumber: Number  // NEW - image number for referencing (optional)
  },
  professorReply: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("GeminiMessage", GeminiMessageSchema);
