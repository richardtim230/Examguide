import mongoose from "mongoose";

const ProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "Applications", required: true },
  examSet: { type: String, required: true }, // examSet id or identifier
  answers: { type: mongoose.Schema.Types.Mixed, default: {} }, // e.g., {questionId: answer}
  answeredIds: [{ type: String }],
  currentQuestionIndex: { type: Number, default: 0 },
  timeRemaining: { type: Number, default: 0 }, // seconds
  completed: { type: Boolean, default: false },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

ProgressSchema.index({ user: 1, examSet: 1 }, { unique: true });

export default mongoose.model("Progress", ProgressSchema);
