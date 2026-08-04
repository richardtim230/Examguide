import mongoose from "mongoose";

const { Schema } = mongoose;

const SubcourseSchema = new Schema({
  title: { type: String, required: true, trim: true, index: true },
  code: { type: String, trim: true, default: "" },
  description: { type: String, default: "" },
  level: { type: String, default: "" },
  parentCourse: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  resources: { type: Number, default: 0 },
  imageUrl: { type: String, default: "" },
  published: { type: Boolean, default: true },
  tags: [{ type: String }],
  meta: { type: Schema.Types.Mixed, default: {} },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false }
}, {
  timestamps: true
});

SubcourseSchema.index({ title: "text", description: "text", tags: "text" });

const Subcourse = mongoose.models.Subcourse || mongoose.model("Subcourse", SubcourseSchema);
export default Subcourse;
