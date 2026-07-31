import mongoose from "mongoose";

const { Schema, model } = mongoose;

const ResourceChapterSchema = new Schema({

  resource: {
    type: Schema.Types.ObjectId,
    ref: "Resources",
    required: true,
    index: true
  },

  chapterNumber: {
    type: Number,
    required: true,
    min: 1
  },

  title: {
    type: String,
    required: true,
    trim: true
  },

  slug: {
    type: String,
    default: ""
  },

  description: {
    type: String,
    default: ""
  },

  contentHtml: {
    type: String,
    required: true,
    default: ""
  },

  estimatedReadingTime: {
    type: Number,
    default: 0
  },

  wordCount: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft",
    index: true
  },

  isLocked: {
    type: Boolean,
    default: false
  },

  allowComments: {
    type: Boolean,
    default: true
  },

  publishedAt: {
    type: Date,
    default: null
  },

  lastEditedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null
  }

}, {
  timestamps: true,
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});

ResourceChapterSchema.index({
  resource: 1,
  chapterNumber: 1
}, {
  unique: true
});

ResourceChapterSchema.index({
  resource: 1,
  createdAt: 1
});

ResourceChapterSchema.index({
  resource: 1,
  status: 1
});

ResourceChapterSchema.index({
  title: "text",
  description: "text",
  contentHtml: "text"
});

ResourceChapterSchema.pre("save", function (next) {

  const plainText = this.contentHtml
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  this.wordCount = plainText
    ? plainText.split(" ").length
    : 0;

  this.estimatedReadingTime = Math.max(
    1,
    Math.ceil(this.wordCount / 200)
  );

  if (this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

export default model("ResourceChapter", ResourceChapterSchema);
