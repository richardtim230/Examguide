import mongoose from "mongoose";

const LectureNoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  course: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true }, // Quill HTML content
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

LectureNoteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("LectureNote", LectureNoteSchema);
