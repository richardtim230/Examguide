import mongoose from "mongoose";
const ResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  examSet: { type: String, required: true }, // use String or mongoose.Schema.Types.ObjectId, depending on your examSet data type
  answers: { type: Map, of: String, default: {} },
  score: { type: Number, required: true },
  timeTaken: { type: Number, required: true }, // Add this line if you want to store time taken (in seconds)
  questions: { type: Array, default: [] }, // Stores questions for review if needed
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Result", ResultSchema);
