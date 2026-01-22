import mongoose from "mongoose";

const PastQuestionSchema = new mongoose.Schema({
  course: { type: String, required: true }, // e.g. "PHY101"
  title: { type: String, required: true },
  year: { type: Number, required: true },
  type: { type: String, enum: ["midterm", "final", "quiz"], required: true },
  description: String,
  fileUrl: { type: String, required: true },
  mimetype: String, // "application/pdf", "image/jpeg", etc.
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("PastQuestion", PastQuestionSchema);
