// 
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const ChatSessionSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: "User", default: null },
  title: { type: String, default: "New session" },
  materials: [{ type: Schema.Types.ObjectId, ref: "ChatMaterial" }], // referenced materials
  meta: { type: Schema.Types.Mixed, default: {} },
  lastMessageAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default model("ChatSession", ChatSessionSchema);
