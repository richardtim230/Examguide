import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  imageUrl: { type: String }, // New field for image URL
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sentTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

export default mongoose.model("Notification", NotificationSchema);
