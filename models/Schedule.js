import mongoose from "mongoose";

const ScheduleSchema = new mongoose.Schema({
  examSet: { type: mongoose.Schema.Types.ObjectId, ref: "QuestionSet", required: true },
  faculty: { type: String, required: true },
  departments: [{ type: String, required: true }], // Array of department IDs or names
  levels: [{ type: String, required: true }],      // <-- NEW FIELD, array of levels (e.g., ["200","300"])
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default mongoose.model("Schedule", ScheduleSchema);
