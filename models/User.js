import mongoose from "mongoose";

// This schema supports BOTH string and ObjectId for faculty/department (legacy and relational).
const UserSchema = new mongoose.Schema({
  fullname: { type: String, default: "" },
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  studentId: { type: String, default: "" },
  level: { type: String, default: "" }, // or "year"
  religion: { type: String, default: "" }, // or "year"
  password: { type: String, required: true },
  profilePic: { type: String, default: "" },
  // Accept either ObjectId (for populate) or string (for legacy/text)
  faculty: { type: mongoose.Schema.Types.Mixed, ref: "Faculty", default: "" },
  department: { type: mongoose.Schema.Types.Mixed, ref: "Department", default: "" },
  role: { type: String, enum: ["student", "uploader", "admin", "superadmin", "codec"], default: "student" },
  active: { type: Boolean, default: true },
  points: { type: Number, dedault: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", UserSchema);
