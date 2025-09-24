import mongoose from "mongoose";
const NewsletterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String },
  message: { type: String },
  date: { type: Date, default: Date.now }
});
export default mongoose.model("Newsletter", NewsletterSchema);
