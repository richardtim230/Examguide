import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ["mcq", "theory"], required: true },
  q: { type: String, required: true, maxlength: 2000 },
  options: { type: [String], default: [] },
  correct: { type: Number, default: null },
  explanation: { type: String, default: "", maxlength: 2000 },
  modelAnswer: { type: String, default: "", maxlength: 5000 }
}, { _id: false });

const aiPracticeAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  format: { type: String, enum: ["mcq", "theory", "hybrid"], required: true },
  questions: { type: [questionSchema], required: true },
  answers: { type: mongoose.Schema.Types.Mixed, default: {} },
  score: { type: Number, min: 0, max: 100, default: null },
  total: { type: Number, required: true },
  answered: { type: Number, required: true },
  durationSeconds: { type: Number, default: null }
}, { timestamps: true });

aiPracticeAttemptSchema.index({ user: 1, createdAt: -1 });
export default mongoose.models.AiPracticeAttempt ||
  mongoose.model("AiPracticeAttempt", aiPracticeAttemptSchema);
