const mongoose = require("mongoose");

const broadcastSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 120 },
  message: { type: String, required: true, maxlength: 2000 },
  imageUrl: { type: String }, // URL or path to image attachment
  link: { type: String },     // Optional: external or internal link
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  type: { type: String, enum: ["info", "warning", "danger", "success"], default: "info" },
  seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

module.exports = mongoose.model("Broadcast", broadcastSchema);
