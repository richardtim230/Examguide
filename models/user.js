// models/User.js

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: { 
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  dob: { // Date of birth
    type: Date,
  },
  creditPoints: {
  type: Number,
  default: 35
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other", ""],
    default: "",
  },
  address: {
    type: String,
    trim: true,
    default: ""
  },
  program: {
    type: String,
    enum: ["WAEC/NECO", "JAMB", "POST UTME"],
    required: true,
  },
  role: {
    type: String,
    enum: ["student", "admin", "tutor", "superadmin"],
    default: "student",
  },
  password: { // Hashed
    type: String,
    required: true,
  },
  passport: { // local file path or Image URL
    type: String,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "overdue"],
    default: "pending",
  },
  referral: {
    type: String, // username, code, or userId of the referrer
    default: "",
    trim: true,
  },
  guardianName: {
    type: String,
    trim: true,
    default: ""
  },
  guardianPhone: {
    type: String,
    trim: true,
    default: ""
  },
  emailVerified: { 
    type: Boolean, 
    default: false 
  },
  emailVerificationToken: {
    type: String
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const User = mongoose.models.student_account || mongoose.model("student_account", userSchema, "student_accounts");
export default User;
