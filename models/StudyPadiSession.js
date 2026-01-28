import mongoose from "mongoose";

const StudyPadiSessionSchema = new mongoose.Schema({
  goalId: { type: mongoose.Schema.Types.ObjectId, ref: "StudyPadiGoal", default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  start: { type: Date, required: true },
  durationMin: { type: Number, default: 30 },
  status: { type: String, enum: ["scheduled","in-progress","done","cancelled"], default: "scheduled" },
  startedAt: { type: Date, default: null }, // when session actually started
  endedAt: { type: Date, default: null },   // when session ended
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // users who joined
}, { timestamps: true });

export default mongoose.model("StudyPadiSession", StudyPadiSessionSchema);
