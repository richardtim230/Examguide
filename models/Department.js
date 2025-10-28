import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
  // ADDITIONAL FIELDS
  backgroundImage: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  courses: { type: [String], default: [] }
}, { timestamps: true });

// Prevent OverwriteModelError in dev/hot-reload/multiple imports
export default mongoose.models.Department || mongoose.model("Department", DepartmentSchema);
