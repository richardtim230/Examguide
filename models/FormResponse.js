import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema({
  fieldId: { type: mongoose.Schema.Types.ObjectId, required: true },
  value: { type: mongoose.Schema.Types.Mixed }, // could be String, Array, etc
});

const FormResponseSchema = new mongoose.Schema({
  form: { type: mongoose.Schema.Types.ObjectId, ref: "Form", required: true },
  answers: [AnswerSchema],
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional: anonymous submission
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("FormResponse", FormResponseSchema);
