import mongoose from "mongoose";

const { Schema, model } = mongoose;

const fileSchema = new Schema(
  {
    name: {
      type: String,
      default: ""
    },
    label: {
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
    url: {
      type: String,
      default: ""
    },
    storageType: {
      type: String,
      enum: ["local", "gridfs", "cloudinary", "supabase", "other"],
      default: "local"
    },
    bucket: {
      type: String,
      default: null
    },
    publicId: {
      type: String,
      default: null
    },
    fileId: {
      type: String,
      default: null
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: false
  }
);

const ResourcesSchema = new Schema(
  {
    resourceType: {
      type: String,
      enum: ["textbook", "notebook"],
      default: "textbook",
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    subtitle: {
      type: String,
      default: ""
    },

    authors: {
      type: [String],
      default: []
    },

    coauthors: {
      type: [String],
      default: []
    },

    publisher: {
      type: String,
      default: ""
    },

    edition: {
      type: String,
      default: ""
    },

    isbn10: {
      type: String,
      default: ""
    },

    isbn13: {
      type: String,
      default: ""
    },

    language: {
      type: String,
      default: "English"
    },

    publicationYear: {
      type: String,
      default: ""
    },

    pages: {
      type: Number,
      default: 0
    },

    format: {
      type: String,
      default: ""
    },

    faculty: {
      type: String,
      default: "",
      index: true
    },

    department: {
      type: String,
      default: "",
      index: true
    },

    level: {
      type: String,
      default: "",
      index: true
    },

    semester: {
      type: String,
      default: "",
      index: true
    },

    courseCode: {
      type: String,
      default: ""
    },

    courseTitle: {
      type: String,
      default: ""
    },

    lecturer: {
      type: String,
      default: ""
    },

    description: {
      type: String,
      default: ""
    },

    introduction: {
      type: String,
      default: ""
    },

    totalChapters: {
      type: Number,
      default: 0
    },

    totalWords: {
      type: Number,
      default: 0
    },

    lastChapterNumber: {
      type: Number,
      default: 0
    },

    files: {
      type: [fileSchema],
      default: []
    },

    cover: {
      url: {
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
        enum: ["local", "supabase", "other"],
        default: "local"
      },
      bucket: {
        type: String,
        default: null
      },
      publicId: {
        type: String,
        default: null
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },

    tags: {
      type: [String],
      default: [],
      index: true
    },

    copyrightHolder: {
      type: String,
      default: ""
    },

    licenseType: {
      type: String,
      default: "All Rights Reserved"
    },

    visibility: {
      type: String,
      enum: ["public", "campus", "department", "private"],
      default: "public"
    },

    allowPreview: {
      type: Boolean,
      default: true
    },

    allowComments: {
      type: Boolean,
      default: true
    },

    enableDownload: {
      type: Boolean,
      default: true
    },

    published: {
      type: Boolean,
      default: false,
      index: true
    },

    publishDate: {
      type: Date,
      index: true
    },

    uploader: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
);

ResourcesSchema.virtual("chapters", {
  ref: "Chapter",
  localField: "_id",
  foreignField: "resource",
  justOne: false
});

ResourcesSchema.index({
  title: "text",
  authors: "text",
  tags: "text",
  courseTitle: "text",
  courseCode: "text",
  lecturer: "text",
  description: "text",
  introduction: "text"
});

ResourcesSchema.index({
  createdAt: -1
});

ResourcesSchema.pre("validate", function (next) {
  if (this.resourceType === "textbook" && this.files.length === 0) {
    return next(new Error("A textbook must contain at least one uploaded file."));
  }

  next();
});

export default model("Resources", ResourcesSchema);
