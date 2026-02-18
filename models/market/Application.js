import mongoose from "mongoose";

const ApplicationsSchema = new mongoose.Schema({
  applicantType: { type: String, required: true },
  username: { type: String, required: true, unique: true, minlength: 3 },
  password: { type: String, required: true }, // Store as hash in production!
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dob: { type: Date, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  nationality: { type: String },
  address: { type: String },
  intakeTerm: { type: String, required: true },
  program: { type: String, required: true },
  currentSchool: { type: String },
  currentGrade: { type: String },
  prevAcademics: { type: String },
  languageProof: { type: String },
  emergencyName: { type: String },
  emergencyPhone: { type: String },
  idFile: { type: String },
  transcripts: [{ type: String }],
  submittedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Applications", ApplicationsSchema);
