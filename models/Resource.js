import mongoose from "mongoose";

const RatingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number, min: 1, max: 5 }
}, { _id: false });

const ResourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  type: { type: String, enum: ["pdf", "document", "presentation", "spreadsheet", "video", "audio", "image", "archive", "file", "other"], default: "other" },
  course: { type: String, default: "" },
  // GridFS file ID (for files stored in MongoDB)
  fileId: { type: mongoose.Schema.Types.ObjectId, default: null },
  // External link
  link: { type: String, default: "" },
  fileMime: { type: String, default: "" },
  fileSize: { type: Number, default: 0 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  downloads: { type: Number, default: 0 },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  ratings: [RatingSchema]
}, {
  timestamps: true
});

ResourceSchema.virtual("ratingAvg").get(function() {
  if (!this.ratings || this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((s, r) => s + (r.rating || 0), 0);
  return Math.round((sum / this.ratings.length) * 10) / 10;
});

export default mongoose.model("Resource", ResourceSchema);
