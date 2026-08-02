import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    activityType: {
      type: String,
      enum: [
        "reading",
        "video",
        "mocktest",
        "quiz",
        "social",
        "profile",
        "assignment",
        "practice",
        "goal",
        "upload",
        "referral",
        "daily",
        "custom"
      ],
      default: "custom",
      index: true
    },

    action: {
      type: String,
      enum: [
        "daily_login",
        "complete_profile",
        "refer_friend",
        "publish_article",
        "read_post",
        "read_resource",
        "read_chapter",
        "practice_quiz",
        "take_mock_test",
        "upload_resource",
        "upload_quiz",
        "share_social",
        "watch_video",
        "complete_assignment",
        "custom"
      ],
      required: true,
      index: true
    },

    targetModel: {
      type: String,
      enum: [
        "Post",
        "Resources",
        "Chapter",
        "ExamSet",
        "User"
      ],
      default: null
    },

    target: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "targetModel",
      default: null,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    points: {
      type: Number,
      default: 0,
      min: 0
    },

    status: {
      type: String,
      enum: [
        "active",
        "pending",
        "done",
        "overdue",
        "cancelled"
      ],
      default: "active",
      index: true
    },

    verificationStatus: {
      type: String,
      enum: [
        "pending",
        "verified",
        "failed"
      ],
      default: "pending"
    },

    rewardGranted: {
      type: Boolean,
      default: false,
      index: true
    },

    completionData: {
      duration: {
        type: Number,
        default: 0
      },
      score: {
        type: Number,
        default: 0
      },
      percentage: {
        type: Number,
        default: 0
      },
      referralId: {
        type: String,
        default: ""
      },
      device: {
        type: String,
        default: ""
      },
      ip: {
        type: String,
        default: ""
      },
      url: {
        type: String,
        default: ""
      },
      notes: {
        type: String,
        default: ""
      }
    },

    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    startedAt: {
      type: Date
    },

    completedAt: {
      type: Date
    },

    dueDate: {
      type: Date
    },

    expiresAt: {
      type: Date
    },

    source: {
      type: String,
      enum: [
        "system",
        "custom",
        "admin"
      ],
      default: "system"
    },

    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

TaskSchema.index({ user: 1, status: 1 });

TaskSchema.index({ user: 1, rewardGranted: 1 });

TaskSchema.index({ user: 1, action: 1 });

TaskSchema.index({ targetModel: 1, target: 1 });

export default mongoose.model("Task", TaskSchema);
