import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
    required: true
  },
  // You can add other fields if needed, e.g., code, description, etc.
}, { timestamps: true });

const Department = mongoose.model("Department", DepartmentSchema);
export default Department;
