// File: models/
import mongoose from "mongoose";
const { Schema } = mongoose;

const DiscussionSchema = new Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  category:    { type: String, enum: ["general", "academic", "social", "technical"], default: "general" },
  
  author:      { type: Schema.Types.ObjectId, ref: "User", required: true },
  
  // Content
  content:     { type: String, default: "" },
  tags:        [{ type: String }],
  
  // Engagement
  replies:     [{ type: Schema.Types.ObjectId, ref: "Reply" }],
  replyCount:  { type: Number, default: 0 },
  likes:       [{ type: Schema.Types.ObjectId, ref: "User" }],
  likeCount:   { type: Number, default: 0 },
  views:       { type: Number, default: 0 },
  
  // Status
  isPinned:    { type: Boolean, default: false },
  isClosed:    { type: Boolean, default: false },
  
  // Metadata
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
});

export default mongoose.model("Discussion", DiscussionSchema);
