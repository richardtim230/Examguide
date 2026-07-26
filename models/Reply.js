// models/Reply.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const AttachmentSchema = new Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ["image", "video", "file"], default: "image" },
  filename: { type: String },
});

const ReplySchema = new Schema({
  discussion: { type: Schema.Types.ObjectId, ref: "Discussion", required: true },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },

  content: { type: String, required: true },

  attachments: [AttachmentSchema],

  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  likeCount: { type: Number, default: 0 },

  isAnswer: { type: Boolean, default: false }, // Mark as best answer

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ReplySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Reply", ReplySchema);
