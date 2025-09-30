import mongoose from "mongoose";

// Optionally, reuse your comment schema if you have one
const CommentSchema = new mongoose.Schema({
  name: String,
  text: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: Date,
  parentId: mongoose.Schema.Types.ObjectId,
  likes: Number,
  replies: [this],
}, { _id: false }); // If your comments don't need their own IDs

const PostSchema = new mongoose.Schema({
  title: String,
  content: String,
  category: String,
  subject: String,
  topic: String,
  status: { type: String, default: "Draft" },
  date: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  comments: [CommentSchema],
  images: [String],
  imageUrl: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approved: { type: Boolean, default: false },
  readers: [mongoose.Schema.Types.ObjectId],
  viewRecords: [
    {
      userId: mongoose.Schema.Types.ObjectId,
      time: Number,
    },
  ],
});

export default mongoose.model("Post", PostSchema);
