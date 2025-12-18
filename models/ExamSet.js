import mongoose from "mongoose";

const ExamSetSchema = new mongoose.Schema({
  subject: { type: String, required: true }, // e.g., "MTH101"
  title: { type: String, required: true },   // e.g. "Mathematics 1st CA Test"
  accessCode: { type: String, required: true, unique: true },
  duration: { type: Number, default: 3600 }, // seconds
  tags: [{ type: String, default: [] }],     // <<== TAG SYSTEM
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.ExamSet || mongoose.model("ExamSet", ExamSetSchema);
