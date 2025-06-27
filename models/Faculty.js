import mongoose from "mongoose";

const FacultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  // You can add other fields if needed, e.g., code, description, etc.
}, { timestamps: true });

const Faculty = mongoose.model("Faculty", FacultySchema);
export default Faculty;
