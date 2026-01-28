import mongoose from "mongoose";

const StudyPadiGoalSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  course: { type: String, default: "General", trim: true },
  description: { type: String, default: "" },
  due: { type: Date, default: null },
  durationMin: { type: Number, default: null },
  completed: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.model("StudyPadiGoal", StudyPadiGoalSchema);
