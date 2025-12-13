import mongoose from "mongoose";

const CbtQuestionSchema = new mongoose.Schema({
  examSet: { type: mongoose.Schema.Types.ObjectId, ref: "ExamSet", required: true },
  question: { type: String, required: true },
  options: [
    {
      key: { type: String, required: true }, // "A", "B", "C", "D"
      text: { type: String, required: true }
    }
  ],
  answer: { type: String, required: true }, // e.g., "A"
  explanation: { type: String, default: "" },
  image: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.CbtQuestion || mongoose.model("CbtQuestion", CbtQuestionSchema);
