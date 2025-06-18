import mongoose from "mongoose";
const ResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  examSet: { type: String, required: true },
  answers: { type: Map, of: String, default: {} },
  score: { type: Number },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });
export default mongoose.model("Result", ResultSchema);
