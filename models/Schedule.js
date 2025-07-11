import mongoose from "mongoose";

const ScheduleSchema = new mongoose.Schema({
  // Reference to QuestionSet for population in API
  examSet: { type: mongoose.Schema.Types.ObjectId, ref: "QuestionSet", required: true },
  faculty: { type: String, required: true },
  // NOW SUPPORTS MULTIPLE DEPARTMENTS:
  departments: [{ type: String, required: true }], // Array of department IDs or names
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default mongoose.model("Schedule", ScheduleSchema);
