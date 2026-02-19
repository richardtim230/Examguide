import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  course: { type: String, default: "" },            // course name or code
  program: { type: String, index: true },            // program (e.g., "IBDP", "SS2")
  className: { type: String, index: true },          // class or grade (e.g., "SS2", "Year 1")
  level: { type: String },                           // optional level/grade
  cohort: { type: String },                          // cohort/year group
  due: { type: Date },
  attachments: [{ type: String }],                   // file URLs
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Applications" }], // assigned students (optional)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Applications" },  // teacher/admin who created it
  status: { type: String, default: "pending", enum: ["pending", "published", "closed", "draft"] },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

AssignmentSchema.index({ program: 1, className: 1, due: 1 });

export default mongoose.model("Assignment", AssignmentSchema);
