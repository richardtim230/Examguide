import mongoose from "mongoose";

const PracticeSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  questions: { type: Array, required: true },
  topics: { type: Array, default: [] },
  numQuestions: { type: Number, required: true },
  score: { type: Number },
  time: { type: Number }, // time limit in minutes
  mode: { type: String, enum: ["random", "topic"], default: "random" },
  completedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model("PracticeSession", PracticeSessionSchema);
