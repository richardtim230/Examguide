import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  gender: { type: String, required: true },
  passport: { type: String, required: true },
  receipt: { type: String, required: true },
  // Optional: link to Form and Admin if needed
  formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form" },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }
}, { timestamps: true });

export default mongoose.model("Registration", registrationSchema);
