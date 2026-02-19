import mongoose from "mongoose";

const TimetableRowSchema = new mongoose.Schema({
  time: { type: String },        // e.g., "8:00 - 9:00"
  slots: [{ type: String }]      // subjects/activities per day order
}, { _id: false });

const TimetableSchema = new mongoose.Schema({
  title: { type: String, default: "Timetable" },
  program: { type: String, index: true },
  className: { type: String, index: true },
  level: { type: String },
  cohort: { type: String },
  days: [{ type: String, default: ["Time", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] }],
  times: [{ type: String }],     // list of time labels
  rows: [TimetableRowSchema],    // array of rows: each row = time + slots[]
  // OR a generic structure:
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

TimetableSchema.index({ program: 1, className: 1 });

export default mongoose.model("Timetable", TimetableSchema);
