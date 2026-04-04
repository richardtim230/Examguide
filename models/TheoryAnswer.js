import mongoose from "mongoose";

const TheoryAnswerSchema = new mongoose.Schema({
  examSet: { type: mongoose.Schema.Types.ObjectId, ref: "ExamSet", required: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: "TheoryQuestion", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // Single question answer
  answerType: { type: String, enum: ["text", "image"], required: true },
  answerText: { type: String, default: "" },
  answerImageUrl: { type: String, default: "" },
  ocrExtractedText: { type: String, default: "" }, // After OCR processing
  
  // Auto-grading
  autoScore: { type: Number, default: 0 },
  matchedKeywords: [{ type: String }],
  rubricMatches: [
    {
      bucketIndex: { type: Number },
      score: { type: Number },
      matchedKeywords: [{ type: String }]
    }
  ],
  
  // Manual override
  manualScore: { type: Number, default: null },
  manualFeedback: { type: String, default: "" },
  manualGradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  
  finalScore: { type: Number, default: 0 },
  isGraded: { type: Boolean, default: false },
  
  submittedAt: { type: Date, default: Date.now },
  gradedAt: { type: Date, default: null }
});

export default mongoose.models.TheoryAnswer || 
  mongoose.model("TheoryAnswer", TheoryAnswerSchema);
