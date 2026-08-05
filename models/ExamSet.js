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

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.ExamSet ||
  mongoose.model("ExamSet", ExamSetSchema);
