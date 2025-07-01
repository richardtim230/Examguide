import mongoose from "mongoose";

const FieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["text", "textarea", "radio", "checkbox", "select", "date", "time", "number", "email", "file"], 
    required: true 
  },
  options: [String], // for select/radio/checkbox
  required: { type: Boolean, default: false },
  order: { type: Number, default: 0 }, // for ordering fields
  description: { type: String }, // optional help text
});

const FormSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  fields: [FieldSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("Form", FormSchema);
