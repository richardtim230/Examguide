import mongoose from "mongoose";

const { Schema } = mongoose;

const ChatSchema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
  title: { type: String, default: "" },

  lastMessage: { type: Schema.Types.ObjectId, ref: "Message", default: null },
  lastMessageText: { type: String, default: "" },
  lastMessageAt: { type: Date, default: null },

  type: { type: String, enum: ["direct", "chat", "forum", "group"], default: "chat" },

}, {
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
});

ChatSchema.index({ participants: 1 });
ChatSchema.index({ lastMessageAt: -1 });

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);
