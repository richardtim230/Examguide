/**
 * models/
 * Tutor-session model (named TutorSession to match imports).
 */

import mongoose from "mongoose";

const { Schema, model } = mongoose;

const tutorSessionSchema = new Schema({
  title: { type: String, required: true, trim: true },
  date: { type: Date, required: true, index: true },
  student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  subject: { type: String, trim: true, default: "" },
  description: { type: String, default: "" },
  tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  status: { type: String, enum: ["Active", "Completed", "Cancelled", "Scheduled"], default: "Scheduled", index: true },
  durationMinutes: { type: Number },
  location: { type: String }, // could be a link for online sessions
  meta: { type: Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
});

tutorSessionSchema.index({ tutor: 1, date: -1 });
tutorSessionSchema.index({ student: 1, date: -1 });

export default model("TutorSession", tutorSessionSchema);
