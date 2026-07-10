import mongoose from "mongoose";

const { Schema, model } = mongoose;

const AttachmentSchema = new Schema({
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    default: ""
  },
  originalName: {
    type: String,
    default: ""
  },
  mimeType: {
    type: String,
    default: ""
  },
  size: {
    type: Number,
    default: 0
  },
  storageType: {
    type: String,
    enum: ["cloudinary", "gridfs"],
    default: "cloudinary"
  },
  fileId: {
    type: String,
    default: ""
  }
}, { _id: false });

const FeedbackAttachmentSchema = new Schema({
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    default: ""
  },
  originalName: {
    type: String,
    default: ""
  },
  mimeType: {
    type: String,
    default: ""
  },
  size: {
    type: Number,
    default: 0
  },
  storageType: {
    type: String,
    enum: ["cloudinary", "gridfs"],
    default: "cloudinary"
  },
  fileId: {
    type: String,
    default: ""
  }
}, { _id: false });

const AssignmentSubmissionSchema = new Schema({
  assignment: {
    type: Schema.Types.ObjectId,
    ref: "Questions",
    required: true,
    index: true
  },
  course: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  lecturer: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  submissionType: {
    type: String,
    enum: ["text", "file", "media", "mixed"],
    default: "text"
  },
  textSubmission: {
    type: String,
    default: ""
  },
  attachments: {
    type: [AttachmentSchema],
    default: []
  },
  attempt: {
    type: Number,
    default: 1
  },
  isLate: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ["draft", "submitted", "graded", "returned"],
    default: "submitted",
    index: true
  },
  score: {
    type: Number,
    default: null
  },
  maxScore: {
    type: Number,
    default: null
  },
  percentage: {
    type: Number,
    default: null
  },
  grade: {
    type: String,
    default: ""
  },
  feedback: {
    type: String,
    default: ""
  },
  feedbackAttachments: {
    type: [FeedbackAttachmentSchema],
    default: []
  },
  privateNotes: {
    type: String,
    default: ""
  },
  gradedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  gradedAt: {
    type: Date,
    default: null
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

AssignmentSubmissionSchema.index(
  {
    assignment: 1,
    student: 1
  },
  {
    unique: true
  }
);

AssignmentSubmissionSchema.index({
  lecturer: 1,
  assignment: 1
});

AssignmentSubmissionSchema.index({
  course: 1,
  status: 1
});

export default model("AssignmentSubmission", AssignmentSubmissionSchema);
