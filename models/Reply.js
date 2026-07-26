// File: models/Reply.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const ReplySchema = new Schema({
  discussion:  { type: Schema.Types.ObjectId, ref: "Discussion", required: true },
  author:      { type: Schema.Types.ObjectId, ref: "User", required: true },
  
  content:     { type: String, required: true },
  
  likes:       [{ type: Schema.Types.ObjectId, ref: "User" }],
  likeCount:   { type: Number, default: 0 },
  
  isAnswer:    { type: Boolean, default: false }, // Mark as best answer
  
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now }
});

export default mongoose.model("Reply", ReplySchema);
