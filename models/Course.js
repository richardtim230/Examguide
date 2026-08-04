/**
 * Course model
 * Fields chosen to match the Course/Subjects page (title, description, level, faculty, department, image, booksCount, meta, rewardPoints, etc.)
 */
import mongoose from "mongoose";

const { Schema } = mongoose;

const CourseSchema = new Schema({
  title: { type: String, required: true, trim: true, index: true },
  slug: { type: String, trim: true, index: true },
  description: { type: String, default: "" },
  level: { type: String, default: "" }, // e.g. "100 Level", "200 Level"
  faculty: { type: String, default: "" },
  department: { type: String, default: "" },
  booksCount: { type: Number, default: 0 },
  imageUrl: { type: String, default: "" },
  cover: {
    url: { type: String, default: "" },
    alt: { type: String, default: "" }
  },
  rewardPoints: { type: Number, default: 0 },
  minimumReadTime: { type: Number, default: 60 }, // seconds
  published: { type: Boolean, default: true },
  visibility: { type: String, enum: ["public", "campus", "department"], default: "public" },
  resourceType: { type: String, default: "course" },
  tags: [{ type: String }],
  meta: { type: Schema.Types.Mixed, default: {} },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false }
}, {
  timestamps: true
});

// Optional: add text index for search
CourseSchema.index({ title: "text", description: "text", tags: "text" });

const Course = mongoose.models.Course || mongoose.model("Course", CourseSchema);
export default Course;
