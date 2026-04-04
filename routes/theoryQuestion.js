import mongoose from "mongoose";

const TheoryQuestionSchema = new mongoose.Schema({
  examSet: { type: mongoose.Schema.Types.ObjectId, ref: "ExamSet", required: true },
  questionNumber: { type: Number, required: true }, // Q1, Q2, Q3...
  question: { type: String, required: true },
  maxMarks: { type: Number, default: 10 },
  expectedLength: { type: String, enum: ["short", "medium", "long"], default: "medium" },
  
  // Rubric: Multiple scoring levels
  rubric: {
    scoreBuckets: [
      {
        score: { type: Number, required: true },
        keywords: [{ type: String }],
        matchThreshold: { type: Number, default: 1 },
        description: { type: String }
      }
    ]
  },
  
  sampleAnswer: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.TheoryQuestion || 
  mongoose.model("TheoryQuestion", TheoryQuestionSchema);
