// 
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const ChatMessageSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: "ChatSession", required: true },
  role: { type: String, enum: ["user","assistant","system"], required: true },
  content: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  tokensUsed: { type: Number, default: 0 }, // estimated tokens or cost metric
  costCredits: { type: Number, default: 0 }, // credits charged for this message (deducted from user)
  meta: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

export default model("ChatMessage", ChatMessageSchema);
