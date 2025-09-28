import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderName: { type: String },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverName: { type: String },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Listing" },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Message", MessageSchema);
