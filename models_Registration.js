import mongoose from "mongoose";
const RegistrationSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, required: true },
  gender: { type: String, required: true },
  passport: { type: String, required: true },
  receipt: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model("Registration", RegistrationSchema);