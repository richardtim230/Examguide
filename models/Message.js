import mongoose from "mongoose";
const { Schema } = mongoose;

const MessageSchema = new Schema({
  chat:       { type: Schema.Types.ObjectId, ref: "Chat", required: true },       // 1-1 or group chat  
  from:       { type: Schema.Types.ObjectId, ref: "User", required: true },
  to:         { type: Schema.Types.ObjectId, ref: "User" },      // only for direct chat else null
  text:       { type: String, default: "" },
  attachmentUrl: { type: String },
  attachmentType: { type: String }, // "image", "file" etc
  isGroup:    { type: Boolean, default: false },
  readBy:     [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt:  { type: Date, default: Date.now }
});

export default mongoose.model("Message", MessageSchema);
