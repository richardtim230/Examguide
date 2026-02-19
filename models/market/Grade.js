import mongoose from "mongoose";

const GradeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Applications", required: true },
  course: { type: String, required: true },
  subject: { type: String },
  score: { type: Number },           // numeric score where applicable
  mark: { type: Number },            // alternate name
  grade: { type: String },           // letter grade e.g., A, B+
  term: { type: String },            // e.g., "Term 1", "2026"
  year: { type: Number },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Applications" },
  comments: { type: String },
  program: { type: String, index: true },
  className: { type: String, index: true }
}, { timestamps: true });

GradeSchema.index({ student: 1, course: 1, term: 1, year: 1 });

export default mongoose.model("Grade", GradeSchema);
