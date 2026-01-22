import mongoose from "mongoose";
const { Schema } = mongoose;

// Used for direct 1-1 chat. For group, see GroupChat.
const ChatSchema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }], // Always length 2!
  lastMessage:  { type: Schema.Types.ObjectId, ref: "Message" },
  updatedAt:    { type: Date, default: Date.now }
});

export default mongoose.model("Chat", ChatSchema);
