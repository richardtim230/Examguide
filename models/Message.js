
import mongoose from "mongoose";
const { Schema } = mongoose;

const attachmentSchema = new Schema({
  filename: String,
  url: String,
  contentType: String,
  size: Number
}, { _id: false });

const MessageSchema = new Schema({
  // grouping: chat reference (existing) and an optional conversationId string
  chat:       { type: Schema.Types.ObjectId, ref: "Chat", required: true, index: true }, // 1-1 or group chat
  conversationId: { type: String, default: "", index: true }, // optional string id used by some clients

  // sender / recipient
  from:       { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  to:         { type: Schema.Types.ObjectId, ref: "User", index: true }, // only for direct chat else null

  // message content
  text:       { type: String, default: "" },
  // legacy single attachment fields (kept)
  attachmentUrl: { type: String, default: "" },
  attachmentType: { type: String, default: "" }, // "image", "file" etc

  // modern attachment array (supports multiple attachments)
  attachments: { type: [attachmentSchema], default: [] },

  // group vs direct
  isGroup:    { type: Boolean, default: false },

  // read/tracking
  readBy:     [{ type: Schema.Types.ObjectId, ref: "User" }], // users who have read this message
  read:       { type: Boolean, default: false, index: true }, // quick flag for "anyone read"
  deliveredAt: { type: Date },

  // meta and extensibility
  meta: { type: Schema.Types.Mixed, default: {} },

  // createdAt will be provided by timestamps option
}, {
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
});

/**
 * Indexes
 */
MessageSchema.index({ from: 1, to: 1, createdAt: -1 });
MessageSchema.index({ chat: 1, createdAt: -1 });

/**
 * Convenience: mark a user as having read the message
 */
MessageSchema.methods.markReadBy = async function (userId) {
  const idStr = (userId && userId.toString) ? userId.toString() : String(userId);
  const exists = (this.readBy || []).map(String).includes(idStr);
  if (!exists) {
    this.readBy.push(userId);
    this.read = true;
    await this.save();
  }
  return this;
};

export default mongoose.model("Message", MessageSchema);
