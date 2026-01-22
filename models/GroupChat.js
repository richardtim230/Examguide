import mongoose from "mongoose";
const { Schema } = mongoose;

const GroupChatSchema = new Schema({
  name:        { type: String, required: true },
  avatar:      { type: String }, // group icon URL
  members:     [{ type: Schema.Types.ObjectId, ref: "User" }],
  admins:      [{ type: Schema.Types.ObjectId, ref: "User" }],
  lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
  createdBy:   { type: Schema.Types.ObjectId, ref: "User" },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
});

export default mongoose.model("GroupChat", GroupChatSchema);
