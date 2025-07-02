import mongoose from "mongoose";

const FormSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  desc: String,
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true }
}, { timestamps: true });


export default mongoose.models.Form || mongoose.model("Form", FormSchema);
