import mongoose from "mongoose";
const ResponseSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form", required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true }, // flexible for field answers
  date: { type: Date, default: Date.now }
});
export default mongoose.model("Response", ResponseSchema);