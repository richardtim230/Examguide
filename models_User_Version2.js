import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, minlength: 3, maxlength: 50 },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "admin", "superadmin"], default: "student" },
  faculty: { type: String },
  department: { type: String },
  profilePic: { type: String },
}, { timestamps: true });

export default mongoose.model("User", UserSchema);