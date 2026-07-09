import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Uploaded Attachment Schema
 */
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
  }
}, { _id: false });

/**
 * Assignment Submission Schema
 */
const AssignmentSubmissionSchema = new Schema({

  /**
   * Assignment being answered
   */
  assignment: {
    type: Schema.Types.ObjectId,
    ref: "Questions",
    required: true,
    index: true
  },

  /**
   * Course
   */
  course: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },

  /**
   * Student
   */
  student: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  /**
   * Lecturer
   */
  lecturer: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  /**
   * Submission Type
   */
  submissionType: {
    type: String,
    enum: [
      "text",
      "file",
      "media",
      "mixed"
    ],
    default: "text"
  },

  /**
   * Student Answer
   */
  textSubmission: {
    type: String,
    default: ""
  },

  /**
   * Uploaded Files
   */
  attachments: {
    type: [AttachmentSchema],
    default: []
  },

  /**
   * Submission Attempt
   */
  attempt: {
    type: Number,
    default: 1
  },

  /**
   * Late?
   */
  isLate: {
    type: Boolean,
    default: false
  },

  /**
   * Submission Status
   */
  status: {
    type: String,
    enum: [
      "draft",
      "submitted",
      "graded",
      "returned"
    ],
    default: "submitted",
    index: true
  },

  /**
   * Score
   */
  score: {
    type: Number,
    default: null
  },

  /**
   * Lecturer Feedback
   */
  feedback: {
    type: String,
    default: ""
  },

  /**
   * Lecturer Annotation
   */
  privateNotes: {
    type: String,
    default: ""
  },

  /**
   * Graded By
   */
  gradedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  /**
   * Date Graded
   */
  gradedAt: {
    type: Date,
    default: null
  },

  /**
   * Submission Timestamp
   */
  submittedAt: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true
});

/**
 * Prevent duplicate submissions.
 * One student can only have one active submission
 * unless resubmission updates the existing document.
 */
AssignmentSubmissionSchema.index(
  {
    assignment: 1,
    student: 1
  },
  {
    unique: true
  }
);

/**
 * Faster lecturer dashboard queries
 */
AssignmentSubmissionSchema.index({
  lecturer: 1,
  assignment: 1
});

AssignmentSubmissionSchema.index({
  course: 1,
  status: 1
});

export default model(
  "AssignmentSubmission",
  AssignmentSubmissionSchema
);
