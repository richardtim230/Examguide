import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
  title: { type: String },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Applications" }], // users in conversation
  program: { type: String, index: true },     // optional: program/class group conversations
  className: { type: String, index: true },
  lastMessage: { type: String },
  unreadCounts: { type: Map, of: Number },    // map userId -> unread count
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

ConversationSchema.index({ participants: 1, updatedAt: -1 });

export default mongoose.model("Conversation", ConversationSchema);
