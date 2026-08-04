import mongoose from "mongoose";

const ProgressSchema = new mongoose.Schema(
  {
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resources",
      required: true,
      index: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResourceChapter",
      default: null
    },

    page: {
      type: Number,
      default: 1,
      min: 1
    },

    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    lastOpenedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

ProgressSchema.index(
  { user: 1, resource: 1 },
  { unique: true }
);

export default mongoose.models.ReaderProgress ||
  mongoose.model("ReaderProgress", ProgressSchema);
