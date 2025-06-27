import mongoose from "mongoose";

const FacultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
}, { timestamps: true });

// Prevent OverwriteModelError in dev/hot-reload/multiple imports
export default mongoose.models.Faculty || mongoose.model("Faculty", FacultySchema);
