import mongoose from "mongoose";

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  image: { type: String, default: "" }
}, { _id: false });

const QuestionSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  question: { type: String, required: true },
  options: { type: [OptionSchema], required: true },
  answer: { type: String, required: true },
  explanation: { type: String, default: "" },
  questionImage: { type: String, default: "" }
}, { _id: false });

const QuestionSetSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "INACTIVE" },
  faculty: { type: String, required: true },
  department: { type: String, required: true },
  questions: { type: [QuestionSchema], required: true, default: [] },
  schedule: {
    start: { type: Date },
    end: { type: Date }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default mongoose.model("QuestionSet", QuestionSetSchema);