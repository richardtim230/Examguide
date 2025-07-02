import mongoose from "mongoose";

const formSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  desc: String,
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true }
}, { timestamps: true });

export default mongoose.model("Form", formSchema);
