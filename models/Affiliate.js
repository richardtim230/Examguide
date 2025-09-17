import mongoose from "mongoose";

const AffiliateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  school: { type: String, required: true },
  ref: { type: String },
  password: { type: String, required: true }, // store hashed!
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Affiliate", AffiliateSchema);
