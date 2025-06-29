import mongoose from "mongoose";

const broadcastSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 120 },
  message: { type: String, required: true, maxlength: 2000 },
  imageUrl: { type: String }, // image attachment path or URL
  link: { type: String },     // Optional: external/internal link
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  type: { type: String, enum: ["info", "warning", "danger", "success"], default: "info" },
  seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

const Broadcast = mongoose.model("Broadcast", broadcastSchema);
export default Broadcast;
