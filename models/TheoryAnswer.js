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
  
  // Keyword-based auto-grading
  autoScore: { type: Number, default: 0 },
  matchedKeywords: [{ type: String }],
  rubricMatches: [
    {
      bucketIndex: { type: Number },
      score: { type: Number },
      matchedKeywords: [{ type: String }]
    }
  ],
  
  // AI-based grading (Gemini)
  aiScore: { type: Number, default: null },
  aiMatchedKeywords: [{ type: String }],
  aiExplanation: { type: String, default: "" },
  aiFeedback: { type: String, default: "" },
  aiGradingAttempted: { type: Boolean, default: false },
  aiGradingSuccess: { type: Boolean, default: false },
  
  // Manual override (by tutor/admin)
  manualScore: { type: Number, default: null },
  manualFeedback: { type: String, default: "" },
  manualGradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  
  // Final grading result
  finalScore: { type: Number, default: 0 },
  scoringMethod: { 
    type: String, 
    enum: ["keyword", "ai", "manual"], 
    default: "keyword"
  },
  isGraded: { type: Boolean, default: false },
  
  // Timestamps
  submittedAt: { type: Date, default: Date.now },
  gradedAt: { type: Date, default: null },
  aiGradedAt: { type: Date, default: null }
}, { timestamps: true });

// Index for faster queries
TheoryAnswerSchema.index({ examSet: 1, student: 1 });
TheoryAnswerSchema.index({ question: 1, isGraded: 1 });
TheoryAnswerSchema.index({ student: 1, isGraded: 1 });

export default mongoose.models.TheoryAnswer || 
  mongoose.model("TheoryAnswer", TheoryAnswerSchema);
