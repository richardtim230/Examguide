/**
 * models/
 * Stores student submissions for assignments with grading fields.
 */

import mongoose from "mongoose";

const { Schema, model } = mongoose;

const submissionSchema = new Schema({
  assignment: { type: Schema.Types.ObjectId, ref: "Assignment", required: true, index: true },
  student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  answers: { type: String, default: "" },
  files: [{ filename: String, url: String, uploadedAt: Date }],
  submittedAt: { type: Date, default: Date.now },
  grade: { type: Number, min: 0 },
  feedback: { type: String, default: "" },
  gradedAt: { type: Date },
  status: { type: String, enum: ["Submitted", "Graded", "Late", "Resubmitted"], default: "Submitted", index: true },
  meta: { type: Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
});

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true }); // one submission per student per assignment (adjust if you allow multiple)

export default model("AssignmentSubmission", submissionSchema);
