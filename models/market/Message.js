import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "Applications", required: true },
  body: { type: String, default: "" },
  attachments: [{ type: String }],
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Applications" }],
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

MessageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.model("Message", MessageSchema);
