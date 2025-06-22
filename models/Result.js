import mongoose from "mongoose";
const ResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  examSet: { type: mongoose.Schema.Types.ObjectId, ref: "QuestionSet", required: true },
  answers: { type: Map, of: String, default: {} },
  score: { type: Number, required: true },
  timeTaken: { type: Number, required: true },
  questions: { type: Array, default: [] },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Result", ResultSchema);
