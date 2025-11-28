import mongoose from "mongoose";

const ScheduleSchema = new mongoose.Schema({
  examSet: { type: mongoose.Schema.Types.ObjectId, ref: "QuestionSet", required: true },
  faculties: [{ type: String, required: true }],        // <-- updated to array
  departments: [{ type: String, required: true }], 
  levels: [{ type: String, required: true }],      
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default mongoose.model("Schedule", ScheduleSchema);
