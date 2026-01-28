import mongoose from "mongoose";

const StudyPadiTimelineSchema = new mongoose.Schema({
  type: { type: String, enum: ["session","goal","note","other"], default: "other" },
  title: { type: String, required: true },
  msg: { type: String, default: "" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional actor
  time: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("StudyPadiTimeline", StudyPadiTimelineSchema);
