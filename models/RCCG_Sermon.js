import mongoose from "mongoose";

const rccgSermonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Sermon title is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    pastor: {
      type: String,
      required: [true, "Pastor name is required"],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    eventType: {
      type: String,
      trim: true,
    },
    duration: {
      type: String, // e.g., "45:30" or "1:15:00"
    },
    type: {
      type: String,
      required: [true, "Sermon type is required"],
      enum: ["video", "audio"],
      index: true,
    },
    videoUrl: {
      type: String,
      // Only required if the type is 'video'
      required: function () {
        return this.type === "video";
      },
    },
    audioUrl: {
      type: String,
      // Only required if the type is 'audio'
      required: function () {
        return this.type === "audio";
      },
    },
    thumbnailUrl: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RCCG_User",
      required: true,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Optional: Add a text index to optimize the search functionality in your routes
rccgSermonSchema.index({ title: "text", pastor: "text", description: "text" });

const RCCG_Sermon = mongoose.model("RCCG_Sermon", rccgSermonSchema);

export default RCCG_Sermon;
