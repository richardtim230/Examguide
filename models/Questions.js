import mongoose from "mongoose";

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  image: { type: String, default: "" }
}, { _id: false });

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [OptionSchema], default: [] },
  answer: { type: String, default: "" },
  explanation: { type: String, default: "" },
  questionImage: { type: String, default: "" },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
  type: { type: String, default: "multiple_choice" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Questions || mongoose.model("Questions", QuestionsSchema);
