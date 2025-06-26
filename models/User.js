import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username:   { type: String, required: true, unique: true, trim: true },
  password:   { type: String, required: true },
  fullname:   { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, trim: true },
  profilePic: { type: String, default: "" },
  faculty:    { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true},
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true},
  role:       { type: String, enum: ["student", "admin", "superadmin", "uploader"], default: "student" },
  active:     { type: Boolean, default: true },
  level:      { type: String, trim: true }, // Added, e.g., "100", "200", etc.
  phone:      { type: String, trim: true }, // Added
  createdAt:  { type: Date, default: Date.now }
});

export default mongoose.model("User", UserSchema);
