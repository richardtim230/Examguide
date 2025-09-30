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
}, { _id: true }); // allow _id for replies

const CommentSchema = new mongoose.Schema({
  name: String,
  text: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: { type: Date, default: Date.now },
  parentId: mongoose.Schema.Types.ObjectId,
  likes: { type: Number, default: 0 },
  replies: [ReplySchema]
}, { _id: true }); // allow _id for comments

// --- Main Post Schema ---
const PostSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  category: { type: String, index: true },
  subject: { type: String, index: true },
  topic: { type: String, index: true },
  status: { type: String, enum: ["Draft", "Published", "Archived"], default: "Draft", index: true },
  date: { type: Date, default: Date.now, index: true },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  comments: [CommentSchema],
  images: [{ type: String }],
  imageUrl: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  approved: { type: Boolean, default: false },
  readers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  viewRecords: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    time: Number
  }]
});

// --- Indexes for lightning-fast taxonomy and article queries ---
PostSchema.index({ category: 1 });
PostSchema.index({ subject: 1 });
PostSchema.index({ topic: 1 });
PostSchema.index({ status: 1, category: 1, subject: 1, topic: 1 });
PostSchema.index({ author: 1, date: -1 });
PostSchema.index({ date: -1 });

export default mongoose.model("Post", PostSchema);
