import mongoose from "mongoose";

const FormSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true }, // e.g. for URL code
  desc: { type: String },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  fields: [{ 
    label: String, 
    type: String, // e.g. "text", "email", "number", "file", etc.
    options: [String], // for select/radio types
    required: Boolean
  }]
}, { timestamps: true });

export default mongoose.models.Form || mongoose.model("Form", FormSchema);
