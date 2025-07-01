import mongoose from "mongoose";
const FormSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  desc: { type: String },
}, { timestamps: true });
export default mongoose.model("Form", FormSchema);