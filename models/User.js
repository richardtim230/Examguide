import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: "" },
  faculty: { type: String, default: "" },
  department: { type: String, default: "" },
  role: { type: String, enum: ["student", "admin", "superadmin"], default: "student" },
  active: { type: Boolean, default: true }, // for activate/deactivate
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", UserSchema);
