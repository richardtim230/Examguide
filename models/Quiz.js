import mongoose from "mongoose";

const QuizQuestionSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  topic: { type: String, required: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  answer: { type: String, required: true }
}, { _id: false });

const QuizSchema = new mongoose.Schema({
  day: { type: Number, required: true, unique: false },
  topic: { type: String, required: true },
  questions: [QuizQuestionSchema]
}, { collection: "quizzes" });

export default mongoose.model("Quiz", QuizSchema);
