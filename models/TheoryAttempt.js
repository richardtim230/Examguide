import mongoose from "mongoose";

const TheoryAttemptSchema = new mongoose.Schema({
  examSet: { type: mongoose.Schema.Types.ObjectId, ref: "ExamSet", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // Overall attempt tracking
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  
  // Per-question answers (references)
  answers: [
    {
      question: { type: mongoose.Schema.Types.ObjectId, ref: "TheoryQuestion" },
      answer: { type: mongoose.Schema.Types.ObjectId, ref: "TheoryAnswer" }
    }
  ],
  
  // Overall scores
  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  
  // Status
  status: { type: String, enum: ["in-progress", "submitted", "graded"], default: "in-progress" },
  
  // Grading status
  allQuestionsGraded: { type: Boolean, default: false },
  gradedAt: { type: Date, default: null }
});

export default mongoose.models.TheoryAttempt || 
  mongoose.model("TheoryAttempt", TheoryAttemptSchema);
