import mongoose from "mongoose";
const ProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  examSet: { type: String, required: true },
  answers: { type: Map, of: String, default: {} },
  answeredIds: { type: [Number], default: [] },
  currentQuestionIndex: { type: Number, default: 0 },
  timeRemaining: { type: Number, default: 0 },
  completed: { type: Boolean, default: false }
}, { timestamps: true });
export default mongoose.model("Progress", ProgressSchema);
