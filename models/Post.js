import mongoose from "mongoose";

// --- Comment Schema ---
const ReplySchema = new mongoose.Schema({
  name: String,
  text: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: { type: Date, default: Date.now },
  parentId: mongoose.Schema.Types.ObjectId,
  likes: { type: Number, default: 0 },
  replies: []
}, { _id: true });

const CommentSchema = new mongoose.Schema({
  name: String,
  text: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: { type: Date, default: Date.now },
  parentId: mongoose.Schema.Types.ObjectId,
  likes: { type: Number, default: 0 },
  replies: [ReplySchema]
}, { _id: true });

// --- Main Post Schema ---
// Remove index: true from fields, only use schema.index at the bottom
const PostSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  category: { type: String }, // index via schema.index below
  subject: { type: String },
  topic: { type: String },
  status: { type: String, enum: ["Draft", "Published", "Archived"], default: "Draft" }, // index via schema.index below
  date: { type: Date, default: Date.now }, // index via schema.index below
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  comments: [CommentSchema],
  images: [{ type: String }],
  imageUrl: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // index via schema.index below
  approved: { type: Boolean, default: false },
  readers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  viewRecords: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    time: Number
  }]
});

// --- Explicit Indexes for maximum speed, avoid duplicates ---
PostSchema.index({ category: 1 });
PostSchema.index({ subject: 1 });
PostSchema.index({ topic: 1 });
PostSchema.index({ status: 1, category: 1, subject: 1, topic: 1 });
PostSchema.index({ author: 1, date: -1 });
PostSchema.index({ date: -1 });

export default mongoose.model("Post", PostSchema);
