import mongoose from "mongoose";

const { Schema, model } = mongoose;

const fileSchema = new Schema({
  name: { type: String, default: "" },
  label: { type: String, default: "" },
  mimeType: { type: String, default: "" },
  size: { type: Number, default: 0 },
  url: { type: String, default: "" },
  // storageType now includes 'supabase'
  storageType: { type: String, enum: ["local", "gridfs", "cloudinary", "supabase", "other"], default: "local" },
  // bucket & publicId/fileId help identify Supabase objects
  bucket: { type: String, default: null },
  publicId: { type: String, default: null },
  fileId: { type: String, default: null },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const ResourcesSchema = new Schema({
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, default: "" },
  authors: { type: [String], default: [] },
  coauthors: { type: [String], default: [] },
  publisher: { type: String, default: "" },
  edition: { type: String, default: "" },
  isbn10: { type: String, default: "" },
  isbn13: { type: String, default: "" },
  language: { type: String, default: "English" },
  publicationYear: { type: String, default: "" },
  pages: { type: Number, default: 0 },
  format: { type: String, default: "" },

  faculty: { type: String, default: "" },
  department: { type: String, default: "" },
  level: { type: String, default: "" },
  semester: { type: String, default: "" },
  courseCode: { type: String, default: "" },
  courseTitle: { type: String, default: "" },

  // For notebooks/lecture notes - save HTML produced by Quill
  contentHtml: { type: String, default: "" },

  // file uploads (pdf, epub, docx, mp4, mp3, etc)
  files: { type: [fileSchema], default: [] },

  cover: {
    url: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
    storageType: { type: String, enum: ["local", "supabase", "other"], default: "local" },
    bucket: { type: String, default: null },
    publicId: { type: String, default: null }
  },

  tags: { type: [String], default: [] },

  // licensing & copyright
  copyrightHolder: { type: String, default: "" },
  licenseType: { type: String, default: "All Rights Reserved" },

  // visibility and options
  visibility: { type: String, enum: ["public", "campus", "department", "private"], default: "public" },
  allowPreview: { type: Boolean, default: true },
  allowComments: { type: Boolean, default: true },
  enableDownload: { type: Boolean, default: true },

  published: { type: Boolean, default: false },
  publishDate: { type: Date },

  uploader: { type: Schema.Types.ObjectId, ref: "User", default: null },

}, { timestamps: true });

export default model("Resources", ResourcesSchema);
