import mongoose from "mongoose";

const GeminiMessageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  messages: [{ role: String, content: String }],
  image: {
    mimeType: String,
    fileName: String
  },
  professorReply: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("GeminiMessage", GeminiMessageSchema);
