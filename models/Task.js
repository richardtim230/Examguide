import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    // Owner of the task (typically the User's _id)
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Activity Types: "reading", "video", "mocktest", "social", "profile", etc.
    activityType: {
      type: String,
      required: true,
      enum: [
        "reading", "video", "mocktest", "social", "profile",
        "custom", "assignment", "practice", "goal"
      ],
      default: "custom"
    },

    // Main task content/title/description
    title: { type: String, required: true },

    // Optional: Longer description for details or instructions
    description: { type: String, default: "" },

    // Points/reward for completion
    points: { type: Number, default: 0 },

    // Status: active, done, overdue, pending
    status: {
      type: String,
      enum: ["active", "done", "overdue", "pending"],
      default: "active"
    },

    // Flexible structure for duration, URLs, etc.
    meta: {
      type: mongoose.Schema.Types.Mixed, // Use as key-value object
      default: {}
    },

    // Due date
    dueDate: { type: Date },

    // Completion time
    completedAt: { type: Date },

    // Indicates if the user has interacted / marked as started
    startedAt: { type: Date },

    // System-generated or custom
    source: { type: String, enum: ["system", "custom"], default: "system" },

    // Additional: Array of tags (for categorization/search)
    tags: [{ type: String }]
  },
  {
    timestamps: true // Adds createdAt and updatedAt
  }
);

export default mongoose.model("Task", TaskSchema);
