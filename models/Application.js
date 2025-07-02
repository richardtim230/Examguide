import mongoose from "mongoose";

const ApplicationSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: { type: String, required: true },
    education: { type: String, required: true },
    resume: { type: String, required: true }, // stores filename
    linkedin: { type: String },
    github: { type: String },
    position: { type: String, required: true },
    skills: [{ type: String, required: true }],
    startdate: { type: Date },
    referral: { type: String },
    cover: { type: String, required: true },
    formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form" },
  },
  { timestamps: true }
);

export default mongoose.model("Application", ApplicationSchema);
