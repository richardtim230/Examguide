/**
 * models/
 * Assignment entity representing tasks a tutor creates for students.
 */

import mongoose from "mongoose";

const { Schema, model } = mongoose;

const assignmentSchema = new Schema({
  title: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true, index: true },
  instructions: { type: String, default: "" },
  dueDate: { type: Date, required: true },
  assignedTo: [{ type: Schema.Types.ObjectId, ref: "User", required: true }], // can be multiple students or groups
  tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  status: { type: String, enum: ["Pending", "Published", "Completed", "Cancelled"], default: "Pending", index: true },
  attachments: [{ filename: String, url: String, uploadedAt: Date }],
  meta: { type: Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
});

assignmentSchema.index({ tutor: 1, dueDate: -1 });

export default model("Assignment", assignmentSchema);
