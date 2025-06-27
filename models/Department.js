import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
}, { timestamps: true });

// Prevent OverwriteModelError in dev/hot-reload/multiple imports
export default mongoose.models.Department || mongoose.model("Department", DepartmentSchema);
