import mongoose from "mongoose";

const responseSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form", required: true },
  data: { type: Object, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Response", responseSchema);
