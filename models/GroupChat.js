// File: models/GroupChat.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const GroupChatSchema = new Schema({
  name:        { type: String, required: true },
  description: { type: String, default: "" },
  avatar:      { type: String }, // group icon URL
  members:     [{ type: Schema.Types.ObjectId, ref: "User" }],
  admins:      [{ type: Schema.Types.ObjectId, ref: "User" }],
  lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
  joinCode:    { type: String, unique: true, sparse: true },
  createdBy:   { type: Schema.Types.ObjectId, ref: "User" },
  type:        { type: String, enum: ["forum", "group"], default: "forum" }, // Distinguish forums from regular groups
  isPublic:    { type: Boolean, default: false }, // Public forums vs private groups
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
});

export default mongoose.model("GroupChat", GroupChatSchema);
