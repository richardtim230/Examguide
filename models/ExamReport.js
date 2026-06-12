import mongoose from "mongoose";

const examReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    examSetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSet",
      required: true,
      index: true
    },
    attemptId: String, // Unique identifier for this attempt
    subject: String,
    title: String,
    examType: {
      type: String,
      enum: ["cbt", "theory", "hybrid"],
      default: "cbt"
    },
    
    // Score Details
    totalQuestions: Number,
    attemptedQuestions: Number,
    correctAnswers: Number,
    wrongAnswers: Number,
    skippedQuestions: Number,
    score: Number,
    percentage: Number,
    
    // Time Details
    totalDuration: Number, // in seconds
    timeSpent: Number, // in seconds
    startTime: Date,
    endTime: Date,
    
    // Answers Detail
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        questionText: String,
        questionType: String,
        userAnswer: mongoose.Schema.Types.Mixed,
        correctAnswer: String,
        isCorrect: Boolean,
        explanation: String,
        points: Number
      }
    ],
    
    // Theory Submissions
    theoryAnswers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        questionText: String,
        userAnswer: String,
        submittedAt: Date,
        gradeStatus: {
          type: String,
          enum: ["pending", "graded"],
          default: "pending"
        }
      }
    ],
    
    // Grading Info
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    gradingNotes: String,
    
    // Status
    status: {
      type: String,
      enum: ["submitted", "graded"],
      default: "submitted"
    },
    
    // Feedback
    feedback: String,
    performanceLevel: {
      type: String,
      enum: ["excellent", "good", "satisfactory", "needs_improvement"],
    }
  },
  { timestamps: true }
);

// Index for faster queries
examReportSchema.index({ userId: 1, createdAt: -1 });
examReportSchema.index({ examSetId: 1 });
examReportSchema.index({ attemptId: 1 });

export default mongoose.model("ExamReport", examReportSchema);
