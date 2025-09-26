import mongoose from "mongoose";

// This schema supports BOTH string and ObjectId for faculty/department (legacy and relational).
const UserSchema = new mongoose.Schema({
  fullname: { type: String, default: "" },
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  studentId: { type: String, default: "" },
  level: { type: String, default: "" },
  religion: { type: String, default: "" },
  password: { type: String, required: true },
  profilePic: { type: String, default: "" },
  faculty: { type: mongoose.Schema.Types.Mixed, ref: "Faculty", default: "" },
  department: { type: mongoose.Schema.Types.Mixed, ref: "Department", default: "" },
  role: { type: String, enum: ["student", "blogger", "uploader", "pq-uploader", "admin", "superadmin", "codec"], default: "student" },
  active: { type: Boolean, default: true },
  status: { type: String, enum: ["pending", "active", "banned"], default: "pending" },
approved: { type: Boolean, default: false },
ninSlip: { type: String, default: "" },
institution: { type: String, default: "" },
  points: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  offers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Offer" }],
  // Track reward history for breakdown and to prevent double-awards
  rewardHistory: {
    practiced: [
      {
        key: String, // e.g. "mock:examSetId"
        points: Number,
        date: { type: Date, default: Date.now }
      }
    ],
    reading: [
      {
        postId: String,
        points: Number,
        date: { type: Date, default: Date.now }
      }
    ],
    bonus: [
      {
        reason: String,
        points: Number,
        date: { type: Date, default: Date.now },
        by: String // admin username
      }
    ],
    admin: [
      {
        reason: String,
        points: Number,
        date: { type: Date, default: Date.now },
        by: String // admin username
      }
    ]
  },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", UserSchema);
