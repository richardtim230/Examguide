import mongoose from "mongoose";
const CBTExamSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  channel: { type: String, required: true }, // topic
  questions: [{
    text: String,
    options: [String],
    answer: Number, // correct index
    explanation: String
  }],
  answers: [Number], // user's answer indices
  explanations: [{
    correct: Boolean,
    answer: Number,
    yourAnswer: Number,
    options: [String],
    explanation: String,
    question: String
  }],
  score: Number,
  status: { type: String, enum: ["scheduled", "completed"], default: "scheduled" },
  startedAt: Date,
  completedAt: Date
});
export default mongoose.model("CBTExam", CBTExamSchema);
