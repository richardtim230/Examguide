import mongoose from "mongoose";
const AdminSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model("Admin", AdminSchema);
