import mongoose from "mongoose";

const ResponseSchema = new mongoose.Schema({
  form: { type: mongoose.Schema.Types.ObjectId, ref: "Form", required: true },
  data: { type: Object, required: true }, // Submitted fields and answers
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Response", ResponseSchema);
