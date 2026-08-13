import mongoose from "mongoose";

const ExamSetSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },

  title: {
    type: String,
    required: true,
    trim: true
  },

  accessCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  duration: {
    type: Number,
    default: 3600
  },

  tags: [{
    type: String
  }],

  examType: {
    type: String,
    enum: ["cbt", "theory", "hybrid"],
    default: "cbt"
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  // Lightweight attempt summary for fast reads
  attemptSummary: {
    attempts: { type: Number, default: 0 },           // total attempts (graded or not)
    scoredAttempts: { type: Number, default: 0 },     // number of attempts that have percentage values
    totalScore: { type: Number, default: 0 },         // sum of percentages for scored attempts
    averageScore: { type: Number, default: 0 },       // average over scoredAttempts (totalScore / scoredAttempts)
    bestScore: { type: Number, default: 0 },
    worstScore: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 },     // cumulative time spent in seconds
    lastAttemptAt: { type: Date, default: null }
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// keep existing export pattern
export default mongoose.models.ExamSet ||
  mongoose.model("ExamSet", ExamSetSchema);
