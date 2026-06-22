import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    activityType: {
      type: String,
      required: true,
      enum: [
        "reading",
        "video",
        "mocktest",
        "social",
        "profile",
        "custom",
        "assignment",
        "practice",
        "goal"
      ],
      default: "custom"
    },

    title: { type: String, required: true },

    description: { type: String, default: "" },

    points: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["active", "done", "overdue", "pending"],
      default: "active"
    },

    // NEW FIELD
    rewardGranted: {
      type: Boolean,
      default: false
    },

    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    dueDate: { type: Date },

    completedAt: { type: Date },

    startedAt: { type: Date },

    source: {
      type: String,
      enum: ["system", "custom"],
      default: "system"
    },

    tags: [{ type: String }]
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Task", TaskSchema);
