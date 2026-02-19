import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  code: { type: String, index: true },
  description: { type: String },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "Applications" },
  program: { type: String, index: true },
  className: { type: String, index: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Applications" }],
  tags: [{ type: String }],
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

CourseSchema.index({ title: "text", code: "text", program: 1 });

export default mongoose.model("Course", CourseSchema);
