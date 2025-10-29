import mongoose from "mongoose";

const FAQSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true }
});

export default mongoose.model("FAQ", FAQSchema);
