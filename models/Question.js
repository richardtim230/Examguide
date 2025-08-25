import mongoose from "mongoose";
const QuestionSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  year: { type: String, required: true },
  courseCode: { type: String, required: true }, // Changed from 'difficulty'
  text: { type: String, required: true }, // Question text
  image: { type: String }, // Optional image URL or file reference
  options: [{ type: String, required: true }], // Choices
  correctAnswer: { type: String, required: true }, // Must match one of the options
  explanation: { type: String, default: "" }, // Optional explanation
  topic: { type: String, default: "" },
  tags: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now }
  // You can add a field for file type if supporting different media types
});

export default mongoose.model("Question", QuestionSchema);
