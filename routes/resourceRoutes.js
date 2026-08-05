import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { createResource, uploadEditorImage, deleteSupabaseFile } from "../controllers/resourceController.js";
import Resources from "../models/Resources.js";
import ResourceChapter from "../models/ResourceChapter.js";
import User from "../models/User.js";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { avatarUpload } from "../middleware/upload.js";
import ReadAccess from "../models/ReadAccess.js";
import CreditTransaction from "../models/CreditTransaction.js";

export async function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization;

    if (!auth) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = auth.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id || decoded._id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(String(id));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const MAX_RESOURCE_SIZE = 100 * 1024 * 1024;
const MAX_COVER_SIZE = 5 * 1024 * 1024;

const allowedResourceMimes = new Set([
  "application/pdf",
  "application/epub+zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/mp4",
  "audio/mpeg",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

function sanitizeBaseName(name) {
  const ext = path.extname(name);
  const base = path.basename(name, ext)
    .replace(/[^a-z0-9\-_.]/gi, "_")
    .slice(0, 120);
  return { base, ext };
}

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (file.fieldname === "coverFile") {
    if (file.mimetype && file.mimetype.startsWith("image/")) return cb(null, true);
    return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Invalid cover image type"));
  }
  if (allowedResourceMimes.has(file.mimetype)) return cb(null, true);
  return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Unsupported resource file type"));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_RESOURCE_SIZE }
});

async function refreshResourceStats(resourceId) {
  const total = await ResourceChapter.countDocuments({
    resource: resourceId
  });

  const lastChapter = await ResourceChapter.findOne({
    resource: resourceId
  })
    .sort({ chapterNumber: -1 })
    .select("chapterNumber")
    .lean();

  const totalWordsAgg = await ResourceChapter.aggregate([
    {
      $match: {
        resource: new mongoose.Types.ObjectId(resourceId)
      }
    },
    {
      $group: {
        _id: null,
        words: {
          $sum: "$wordCount"
        }
      }
    }
  ]);

  const totalWords = totalWordsAgg[0]?.words || 0;

  await Resources.findByIdAndUpdate(resourceId, {
    totalChapters: total,
    lastChapterNumber: lastChapter?.chapterNumber || 0,
    totalWords
  });
}

const BookmarkSchema = new mongoose.Schema({
  resource: { type: mongoose.Schema.Types.ObjectId, ref: "Resources", required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });
const Bookmark = mongoose.models.Bookmark || mongoose.model("Bookmark", BookmarkSchema);

const ProgressSchema = new mongoose.Schema({
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
        default: 1
    },

    progressPercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
const Progress = mongoose.models.ReaderProgress || mongoose.model("ReaderProgress", ProgressSchema);

async function removeFilesSafely(files = []) {
  if (!files) return;
  const arr = Array.isArray(files) ? files : [files];
  await Promise.all(arr.map(async (f) => {
    if (!f) return;
    if (typeof f === "object" && f.bucket && (f.publicId || f.fileId || f.key)) {
      const key = f.publicId || f.fileId || f.key;
      await deleteSupabaseFile(f.bucket, key).catch(() => {});
      return;
    }
    try {
      let p = typeof f === "string" ? f : f.path || f.url || f;
      if (!p) return;
      if (typeof p === "string" && p.startsWith("/uploads/")) p = path.join(process.cwd(), p.slice(1));
      await fs.unlink(p).catch(() => {});
    } catch (e) {}
  }));
}

function multerMiddleware(fieldsSpec) {
  const handler = upload.fields(fieldsSpec);
  return (req, res, next) => {
    handler(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        await removeFilesSafely(req.files && Object.values(req.files).flat());
        if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "Uploaded file too large" });
        return res.status(415).json({ error: err.message || "Invalid upload" });
      } else if (err) {
        await removeFilesSafely(req.files && Object.values(req.files).flat());
        return res.status(500).json({ error: "Upload error" });
      }
      try {
        const coverArr = (req.files && req.files.coverFile) || [];
        const mainArr = (req.files && req.files.mainFile) || [];
        if (coverArr[0] && coverArr[0].size > MAX_COVER_SIZE) {
          await removeFilesSafely(Object.values(req.files).flat());
          return res.status(413).json({ error: "Cover image exceeds maximum allowed size (5 MB)" });
        }
        if (mainArr[0]) req.file = mainArr[0];
        if (coverArr[0]) req.coverFile = coverArr[0];
        return next();
      } catch (e) {
        await removeFilesSafely(req.files && Object.values(req.files).flat());
        return res.status(500).json({ error: "Server error after upload" });
      }
    });
  };
}

// BOOKMARKS ROUTE PLACED ABOVE /:id TO PREVENT EXPRESS ROUTE SHADOWING
router.get("/user/bookmarks", authenticate, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      Bookmark.find({ user: req.user._id })
        .populate({
          path: "resource",
          populate: { path: "uploader", select: "fullname profilePic faculty department level username" }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Bookmark.countDocuments({ user: req.user._id })
    ]);

    const items = bookmarks.map(b => b.resource).filter(Boolean);

    res.json({ success: true, items, total, page, limit });
  } catch (err) {
    console.error("Fetch bookmarks error:", err);
    res.status(500).json({ error: "Failed to fetch bookmarks" });
  }
});

router.get("/user/library", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      uploadedResources,
      readingProgress,
      accessedResources,
      bookmarks
    ] = await Promise.all([
      Resources.find({
        uploader: userId
      })
        .populate("uploader", "fullname profilePic username faculty department level")
        .sort({ createdAt: -1 })
        .lean(),

      Progress.find({
        user: userId
      })
        .populate({
          path: "resource",
          populate: {
            path: "uploader",
            select: "fullname profilePic username faculty department level"
          }
        })
        .populate("chapter", "chapterNumber title")
        .sort({ updatedAt: -1 })
        .lean(),

      ReadAccess.find({
        user: userId
      })
        .populate({
          path: "resource",
          populate: {
            path: "uploader",
            select: "fullname profilePic username faculty department level"
          }
        })
        .sort({ paidAt: -1 })
        .lean(),

      Bookmark.find({
        user: userId
      })
        .populate({
          path: "resource",
          populate: {
            path: "uploader",
            select: "fullname profilePic username faculty department level"
          }
        })
        .sort({ createdAt: -1 })
        .lean()
    ]);

    const uploadedBooks = uploadedResources.filter(
      resource => resource.resourceType === "textbook"
    );

    const uploadedNotes = uploadedResources.filter(
      resource => resource.resourceType === "notebook"
    );

    const progressMap = new Map();

    for (const progress of readingProgress) {
      if (!progress.resource?._id) continue;

      progressMap.set(
        String(progress.resource._id),
        {
          chapter: progress.chapter
            ? {
                _id: progress.chapter._id,
                chapterNumber: progress.chapter.chapterNumber,
                title: progress.chapter.title
              }
            : null,
          page: progress.page || 1,
          updatedAt: progress.updatedAt,
          progressPercent: progress.progressPercent || 0
        }
      );
    }

    const addProgress = resource => {
      if (!resource) return null;

      const progress = progressMap.get(String(resource._id));

      return {
        ...resource,
        progress: progress || {
          chapter: null,
          page: 1,
          updatedAt: null,
          progressPercent: 0
        }
      };
    };

    const libraryBooks = uploadedBooks.map(addProgress);
    const libraryNotes = uploadedNotes.map(addProgress);

    const history = readingProgress
      .filter(item => item.resource)
      .map(item => ({
        ...item.resource,
        progress: {
          chapter: item.chapter
            ? {
                _id: item.chapter._id,
                chapterNumber: item.chapter.chapterNumber,
                title: item.chapter.title
              }
            : null,
          page: item.page || 1,
          progressPercent: item.progressPercent || 0,
          updatedAt: item.updatedAt
        }
      }));

    const accessed = accessedResources
      .filter(item => item.resource)
      .map(item => ({
        ...item.resource,
        access: {
          paidAt: item.paidAt || item.createdAt || null
        },
        progress: progressMap.get(String(item.resource._id)) || {
          chapter: null,
          page: 1,
          updatedAt: null,
          progressPercent: 0
        }
      }));

    const bookmarked = bookmarks
      .filter(item => item.resource)
      .map(item => ({
        ...item.resource,
        bookmarkedAt: item.createdAt
      }));

    res.json({
      success: true,

      user: {
        _id: req.user._id,
        fullname: req.user.fullname || "",
        username: req.user.username || "",
        profilePic: req.user.profilePic || "",
        faculty: req.user.faculty || "",
        department: req.user.department || "",
        level: req.user.level || "",
        bio: req.user.bio || ""
      },

      stats: {
        totalResources: uploadedResources.length,
        totalBooks: uploadedBooks.length,
        totalNotes: uploadedNotes.length,
        totalOpened: readingProgress.length,
        totalAccessed: accessedResources.length,
        totalBookmarks: bookmarks.length
      },

      library: {
        books: libraryBooks,
        notes: libraryNotes
      },

      history,

      accessed,

      bookmarks: bookmarked
    });

  } catch (err) {
    console.error("Fetch user library error:", err);

    res.status(500).json({
      success: false,
      error: "Failed to fetch user library"
    });
  }
});

router.get("/users/me/library", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .select("fullname username profilePic faculty department level")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    const uploadedResources = await Resources.find({
      uploader: userId
    })
      .sort({ createdAt: -1 })
      .populate("uploader", "fullname username profilePic")
      .lean();

    const books = uploadedResources.filter(
      resource => resource.resourceType === "textbook"
    );

    const notes = uploadedResources.filter(
      resource => resource.resourceType === "notebook"
    );

    const resourceIds = uploadedResources.map(resource => resource._id);

    const progresses = await Progress.find({
      user: userId,
      resource: { $in: resourceIds }
    })
      .sort({ updatedAt: -1 })
      .lean();

    const progressMap = new Map(
      progresses.map(progress => [
        String(progress.resource),
        progress
      ])
    );

    const booksWithProgress = books.map(book => {
      const progress = progressMap.get(String(book._id));

      return {
        ...book,
        coverImage: book.cover?.url || "",
        progress: progress
          ? {
              progressPercent: progress.progressPercent || 0,
              currentPage: progress.currentPage || 0,
              totalPages: progress.totalPages || book.pages || 0,
              updatedAt: progress.updatedAt,
              lastOpenedAt: progress.lastOpenedAt || progress.updatedAt
            }
          : {
              progressPercent: 0,
              currentPage: 0,
              totalPages: book.pages || 0,
              updatedAt: null,
              lastOpenedAt: null
            }
      };
    });

    const notesWithProgress = notes.map(note => {
      const progress = progressMap.get(String(note._id));

      return {
        ...note,
        coverImage: note.cover?.url || "",
        progress: progress
          ? {
              progressPercent: progress.progressPercent || 0,
              currentPage: progress.currentPage || 0,
              totalPages: progress.totalPages || note.pages || 0,
              updatedAt: progress.updatedAt,
              lastOpenedAt: progress.lastOpenedAt || progress.updatedAt
            }
          : {
              progressPercent: 0,
              currentPage: 0,
              totalPages: note.pages || 0,
              updatedAt: null,
              lastOpenedAt: null
            }
      };
    });

    const accessedRecords = await ReadAccess.find({
      user: userId
    })
      .sort({ paidAt: -1 })
      .populate({
        path: "resource",
        populate: {
          path: "uploader",
          select: "fullname username profilePic"
        }
      })
      .lean();

    const accessed = accessedRecords
      .filter(item => item.resource)
      .map(item => {
        const resource = item.resource;
        const progress = progressMap.get(String(resource._id));

        return {
          _id: resource._id,
          title: resource.title,
          subtitle: resource.subtitle,
          resourceType: resource.resourceType,
          courseCode: resource.courseCode,
          courseTitle: resource.courseTitle,
          uploader: resource.uploader,
          coverImage: resource.cover?.url || "",
          access: {
            paidAt: item.paidAt,
            createdAt: item.createdAt
          },
          progress: progress
            ? {
                progressPercent: progress.progressPercent || 0,
                currentPage: progress.currentPage || 0,
                totalPages: progress.totalPages || resource.pages || 0,
                updatedAt: progress.updatedAt,
                lastOpenedAt: progress.lastOpenedAt || progress.updatedAt
              }
            : {
                progressPercent: 0,
                currentPage: 0,
                totalPages: resource.pages || 0,
                updatedAt: null,
                lastOpenedAt: null
              }
        };
      });

    const historyRecords = await Progress.find({
      user: userId
    })
      .sort({ updatedAt: -1 })
      .limit(50)
      .populate({
        path: "resource",
        populate: {
          path: "uploader",
          select: "fullname username profilePic"
        }
      })
      .lean();

    const history = historyRecords
      .filter(item => item.resource)
      .map(item => {
        const resource = item.resource;

        return {
          _id: resource._id,
          title: resource.title,
          subtitle: resource.subtitle,
          resourceType: resource.resourceType,
          courseCode: resource.courseCode,
          courseTitle: resource.courseTitle,
          uploader: resource.uploader,
          coverImage: resource.cover?.url || "",
          progress: {
            progressPercent: item.progressPercent || 0,
            currentPage: item.currentPage || 0,
            totalPages: item.totalPages || resource.pages || 0,
            updatedAt: item.updatedAt,
            lastOpenedAt: item.lastOpenedAt || item.updatedAt
          }
        };
      });

    const totalOpened = await Progress.countDocuments({
      user: userId
    });

    const stats = {
      totalBooks: books.length,
      totalNotes: notes.length,
      totalAccessed: accessed.length,
      totalOpened,
      totalBookmarks: 0
    };

    return res.json({
      success: true,

      user,

      stats,

      library: {
        books: booksWithProgress,
        notes: notesWithProgress
      },

      accessed,

      history,

      bookmarks: []
    });

  } catch (error) {
    console.error("GET /users/me/library error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to load library"
    });
  }
});

router.get("/users/:id/library", async (req, res) => {
  try {
    const userId = req.params.id;

    if (!isValidId(userId)) {
      return res.status(400).json({
        error: "Invalid user id"
      });
    }

    const user = await User.findById(userId)
      .select("_id fullname username profilePic faculty department level bio institution")
      .populate("institution", "name")
      .populate("faculty", "name")
      .populate("department", "name")
      .lean();

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    const page = Math.max(
      1,
      parseInt(req.query.page || "1", 10)
    );

    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit || "12", 10))
    );

    const skip = (page - 1) * limit;

    const uploadedFilter = {
      uploader: userId
    };

    const progressFilter = {
      user: userId
    };

    const [
      uploadedResources,
      uploadedTotal,
      progressRecords,
      openedTotal,
      bookmarkRecords,
      bookmarkTotal
    ] = await Promise.all([
      Resources.find(uploadedFilter)
        .populate(
          "uploader",
          "fullname username profilePic faculty department level"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Resources.countDocuments(uploadedFilter),

      Progress.find(progressFilter)
        .populate({
          path: "resource",
          populate: {
            path: "uploader",
            select: "fullname username profilePic faculty department level"
          }
        })
        .populate("chapter", "chapterNumber title")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Progress.countDocuments(progressFilter),

      Bookmark.find({ user: userId })
        .populate({
          path: "resource",
          populate: {
            path: "uploader",
            select: "fullname username profilePic faculty department level"
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Bookmark.countDocuments({ user: userId })
    ]);

    const openedResources = progressRecords
      .filter(item => item.resource)
      .map(item => ({
        ...item.resource,
        readingProgress: {
          chapter: item.chapter || null,
          page: item.page || 1,
          updatedAt: item.updatedAt
        }
      }));

    const bookmarkedResources = bookmarkRecords
      .filter(item => item.resource)
      .map(item => ({
        ...item.resource,
        bookmarkedAt: item.createdAt
      }));

    res.json({
      success: true,

      user: {
        _id: user._id,
        fullName: user.fullname || "",
        username: user.username || "",
        profilePicture: user.profilePic || "",
        faculty:
          typeof user.faculty === "object"
            ? user.faculty?.name || ""
            : user.faculty || "",
        department:
          typeof user.department === "object"
            ? user.department?.name || ""
            : user.department || "",
        institution:
          typeof user.institution === "object"
            ? user.institution?.name || ""
            : user.institution || "",
        level: user.level || "",
        bio: user.bio || ""
      },

      stats: {
        uploaded: uploadedTotal,
        opened: openedTotal,
        bookmarked: bookmarkTotal
      },

      uploaded: {
        items: uploadedResources,
        total: uploadedTotal,
        page,
        limit,
        hasMore: skip + uploadedResources.length < uploadedTotal
      },

      opened: {
        items: openedResources,
        total: openedTotal,
        page,
        limit,
        hasMore: skip + openedResources.length < openedTotal
      },

      bookmarked: {
        items: bookmarkedResources,
        total: bookmarkTotal,
        page,
        limit,
        hasMore: skip + bookmarkedResources.length < bookmarkTotal
      }
    });

  } catch (err) {
    console.error("Fetch user library error:", err);

    res.status(500).json({
      error: "Failed to fetch user library"
    });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!isValidId(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const user = await User.findById(id)
      .populate("institution", "name")
      .populate("faculty", "name")
      .populate("department", "name")
      .select(
        "fullname profilePic faculty department level bio institution username"
      )
      .lean();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      _id: user._id,
      fullName: user.fullname || "",
      username: user.username || "",
      profilePicture: user.profilePic || "",
      faculty:
        typeof user.faculty === "object"
          ? user.faculty?.name || ""
          : user.faculty || "",
      department:
        typeof user.department === "object"
          ? user.department?.name || ""
          : user.department || "",
      institution:
        typeof user.institution === "object"
          ? user.institution?.name || ""
          : user.institution || "",
      level: user.level || "",
      bio: user.bio || ""
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post(
  "/",
  authenticate,
  multerMiddleware([
    { name: "mainFile", maxCount: 1 },
    { name: "coverFile", maxCount: 1 }
  ]),
  async (req, res, next) => {
    try {
      await createResource(req, res);
    } catch (err) {
      await removeFilesSafely([req.file, req.coverFile]);
      next(err);
    }
  }
);

router.post(
  "/users/upload-avatar",
  authenticate,
  avatarUpload.single("profilePic"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "Please upload an image."
        });
      }

      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          profilePic: req.file.publicUrl
        },
        {
          new: true
        }
      ).select("-password");

      res.json({
        success: true,
        message: "Profile picture updated successfully.",
        profilePic: req.file.publicUrl,
        user
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: "Failed to upload profile picture."
      });
    }
  }
);

router.get("/", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
  const q = req.query.q || "";
  const filter = {};
  if (req.query.faculty) filter.faculty = req.query.faculty;
  if (req.query.department) filter.department = req.query.department;

  if (req.query.uploader) {
    if (!mongoose.Types.ObjectId.isValid(req.query.uploader)) {
      return res.status(400).json({ error: "Invalid uploader id" });
    }
    filter.uploader = new mongoose.Types.ObjectId(req.query.uploader);
  }

  if (req.query.published !== undefined) {
    filter.published = req.query.published === "true";
  }
  if (q) filter.$or = [
    { title: new RegExp(q, "i") },
    { subtitle: new RegExp(q, "i") },
    { authors: new RegExp(q, "i") },
    { courseCode: new RegExp(q, "i") }
  ];
  const skip = (page - 1) * limit;

  console.log("FILTER:", filter);

  const [items, total] = await Promise.all([
    Resources.find(filter)
      .populate("uploader", "fullname avatar faculty department level")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Resources.countDocuments(filter)
  ]);

  console.log("FOUND:", items.length);

  res.json({ items, total, page, limit });
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid id" });
    const resource = await Resources.findById(id)
      .populate("uploader", "fullname profilePic faculty department level username")
      .lean();
    if (!resource) return res.status(404).json({ error: "Resource not found" });
    res.json({ success: true, resource });
  } catch (err) {
    next(err);
  }
});

router.put(
  "/:id",
  authenticate,
  multerMiddleware([
    { name: "mainFile", maxCount: 1 },
    { name: "coverFile", maxCount: 1 }
  ]),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!isValidId(id)) {
        await removeFilesSafely([req.file, req.coverFile]);
        return res.status(400).json({ error: "Invalid id" });
      }
      const doc = await Resources.findById(id);
      if (!doc) {
        await removeFilesSafely([req.file, req.coverFile]);
        return res.status(404).json({ error: "Resource not found" });
      }
      const up = {};
      const fields = [
        "resourceType", "title", "subtitle", "authors", "coauthors", "publisher",
        "edition", "isbn10", "isbn13", "language", "publicationYear", "pages",
        "format", "faculty", "department", "level", "semester", "courseCode",
        "courseTitle", "lecturer", "description", "introduction", "contentHtml",
        "copyrightHolder", "licenseType", "visibility", "allowPreview",
        "allowComments", "enableDownload", "published", "publishDate"
      ];
      fields.forEach(f => {
        if (typeof req.body[f] !== "undefined" && req.body[f] !== null) up[f] = req.body[f];
      });
      if (req.body.tags) {
        try { up.tags = typeof req.body.tags === "string" ? JSON.parse(req.body.tags) : req.body.tags; } catch (e) { up.tags = req.body.tags; }
      }

      if (req.file) {
        const f = req.file;
        const fileObj = {
          name: f.originalname || f.name,
          label: req.body.fileLabel || f.originalname || f.fieldname,
          mimeType: f.mimetype,
          size: f.size || (f.buffer ? f.buffer.length : 0),
          url: f.publicUrl || (f.path ? (() => { const rel = path.relative(process.cwd(), f.path); return "/" + rel.split(path.sep).join("/"); })() : f.filename || ""),
          storageType: f.bucket ? "supabase" : "local",
          bucket: f.bucket || null,
          publicId: f.key || f.publicId || f.fileId || null,
          fileId: f.key || f.publicId || f.fileId || null,
          uploadedAt: new Date()
        };
        doc.files = doc.files || [];
        doc.files.push(fileObj);
      }
      if (req.coverFile) {
        const cf = req.coverFile;
        doc.cover = {
          url: cf.publicUrl || (cf.path ? (() => { const rel = path.relative(process.cwd(), cf.path); return "/" + rel.split(path.sep).join("/"); })() : cf.filename || ""),
          mimeType: cf.mimetype,
          size: cf.size || (cf.buffer ? cf.buffer.length : 0),
          storageType: cf.bucket ? "supabase" : "local",
          bucket: cf.bucket || null,
          publicId: cf.key || cf.publicId || cf.fileId || null
        };
      }

      Object.assign(doc, up);
      await doc.save();
      res.json({ success: true, resource: doc });
    } catch (err) {
      await removeFilesSafely([req.file, req.coverFile]);
      next(err);
    }
  }
);

router.post("/:id/bookmark", authenticate, async (req, res) => {
  try {
    const resourceId = req.params.id;
    if (!isValidId(resourceId)) return res.status(400).json({ error: "Invalid resource id" });

    const resource = await Resources.findById(resourceId).select("_id");
    if (!resource) return res.status(404).json({ error: "Resource not found" });

    const existing = await Bookmark.findOne({ resource: resourceId, user: req.user._id });

    if (existing) {
      await Bookmark.deleteOne({ _id: existing._id });
      return res.json({ success: true, bookmarked: false, message: "Bookmark removed" });
    }

    const bookmark = await Bookmark.create({
      resource: resourceId,
      user: req.user._id
    });

    res.json({ success: true, bookmarked: true, bookmark });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Resource already bookmarked" });
    }
    console.error("Bookmark toggle error:", err);
    res.status(500).json({ error: "Failed to toggle bookmark" });
  }
});

router.get("/:id/bookmark", authenticate, async (req, res) => {
  try {
    const resourceId = req.params.id;
    if (!isValidId(resourceId)) return res.status(400).json({ error: "Invalid resource id" });

    const [bookmark, bookmarkCount] = await Promise.all([
      Bookmark.findOne({ resource: resourceId, user: req.user._id }).lean(),
      Bookmark.countDocuments({ resource: resourceId })
    ]);

    res.json({
      success: true,
      bookmarked: !!bookmark,
      bookmarkCount
    });
  } catch (err) {
    console.error("Bookmark status error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id/progress", authenticate, async (req, res) => {
  try {
    const resourceId = req.params.id;
    if (!isValidId(resourceId)) return res.status(400).json({ error: "Invalid resource id" });

    const progress = await Progress.findOne({ resource: resourceId, user: req.user._id })
      .populate("chapter", "chapterNumber title")
      .lean();

    res.json({ success: true, progress: progress || null });
  } catch (err) {
    console.error("Get progress error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/progress", authenticate, async (req, res) => {
  try {
    const resourceId = req.params.id;
    if (!isValidId(resourceId)) return res.status(400).json({ error: "Invalid resource id" });

    const resource = await Resources.findById(resourceId).select("uploader").lean();
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    const isOwner = String(resource.uploader) === String(req.user._id);
    if (!isOwner) {
      const access = await ReadAccess.findOne({
        user: req.user._id,
        resource: resourceId
      }).lean();

      if (!access) {
        return res.status(403).json({ error: "You don't have access to this resource." });
      }
    }

    const { chapterId, page } = req.body;

    if (chapterId) {
      if (!isValidId(chapterId)) {
        return res.status(400).json({ error: "Invalid chapter id" });
      }

      const chapter = await ResourceChapter.findOne({
        _id: chapterId,
        resource: resourceId
      }).lean();

      if (!chapter) {
        return res.status(404).json({ error: "Chapter not found for this resource" });
      }
    }

    const progress = await Progress.findOneAndUpdate(
      { resource: resourceId, user: req.user._id },
      {
        chapter: chapterId || null,
        page: Number(page) || 1,
        updatedAt: new Date()
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const populated = await Progress.findById(progress._id)
      .populate("chapter", "chapterNumber title")
      .lean();

    res.json({ success: true, progress: populated });
  } catch (err) {
    console.error("Save progress error:", err);
    res.status(500).json({ error: "Failed to update reading progress" });
  }
});

router.get("/:id/read-status", authenticate, async (req, res) => {
  try {
    const resourceId = req.params.id;
    if (!isValidId(resourceId)) return res.status(400).json({ error: "Invalid resource id" });

    const resource = await Resources.findById(resourceId).select("uploader").lean();
    if (!resource) return res.status(404).json({ error: "Resource not found" });

    if (String(resource.uploader) === String(req.user._id)) {
      return res.json({
        success: true,
        hasAccess: true,
        isOwner: true,
        paidAt: null
      });
    }

    const access = await ReadAccess.findOne({
      resource: resourceId,
      user: req.user._id
    }).lean();

    res.json({
      success: true,
      hasAccess: !!access,
      isOwner: false,
      paidAt: access?.paidAt || null
    });
  } catch (err) {
    console.error("Read status error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id/read-access", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({
        error: "Invalid resource id"
      });
    }

    const resource = await Resources.findById(id)
      .select("uploader")
      .lean();

    if (!resource) {
      return res.status(404).json({
        error: "Resource not found"
      });
    }

    if (String(resource.uploader) === String(req.user._id)) {
      return res.json({
        success: true,
        hasAccess: true,
        owner: true,
        alreadyPaid: false
      });
    }

    const access = await ReadAccess.findOne({
      user: req.user._id,
      resource: id
    }).lean();

    res.json({
      success: true,
      hasAccess: !!access,
      owner: false,
      alreadyPaid: !!access
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error"
    });
  }
});

router.post(
  "/:id/read",
  authenticate,
  async (req, res) => {
    const session = await mongoose.startSession();

    try {
      await session.startTransaction();

      const resource = await Resources.findById(req.params.id).session(session);

      if (!resource) {
        await session.abortTransaction();
        return res.status(404).json({
          error: "Resource not found"
        });
      }

      const reader = await User.findById(req.user.id).session(session);

      const uploader = await User.findById(resource.uploader).session(session);

      if (!reader || !uploader) {
        await session.abortTransaction();
        return res.status(404).json({
          error: "User not found"
        });
      }

      if (reader._id.equals(uploader._id)) {
        await session.commitTransaction();

        return res.json({
          success: true,
          free: true
        });
      }

      const existingAccess = await ReadAccess.findOne({
        user: reader._id,
        resource: resource._id
      }).session(session);

      if (existingAccess) {
        await session.commitTransaction();

        return res.json({
          success: true,
          alreadyPaid: true,
          readerCredits: reader.creditPoints
        });
      }

      if (reader.creditPoints < 10) {
        await session.abortTransaction();

        return res.status(400).json({
          error: "Insufficient credit points."
        });
      }

      await User.updateOne(
        { _id: reader._id },
        {
          $inc: { creditPoints: -10 }
        },
        { session }
      );

      await User.updateOne(
        { _id: uploader._id },
        {
          $inc: { points: 5 }
        },
        { session }
      );

      await ReadAccess.create(
        [
          {
            user: reader._id,
            resource: resource._id,
            paidAt: new Date()
          }
        ],
        { session }
      );

      await CreditTransaction.create(
        [
          {
            from: reader._id,
            to: uploader._id,
            resource: resource._id,
            amount: 10,
            uploaderReward: 5
          }
        ],
        { session }
      );

      await session.commitTransaction();

      res.json({
        success: true,
        alreadyPaid: false,
        readerCredits: reader.creditPoints
      });

    } catch (err) {

      await session.abortTransaction();

      console.error(err);

      res.status(500).json({
        error: "Transaction failed."
      });

    } finally {

      await session.endSession();

    }
  }
);

router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid id" });
    const doc = await Resources.findById(id);
    if (!doc) return res.status(404).json({ error: "Resource not found" });

    const deleteOps = [];
    if (Array.isArray(doc.files)) {
      doc.files.forEach(f => {
        if (f && f.storageType === "supabase" && f.bucket && (f.publicId || f.fileId)) {
          deleteOps.push(deleteSupabaseFile(f.bucket, f.publicId || f.fileId));
        } else if (f && f.url && typeof f.url === "string" && f.url.startsWith("/uploads/")) {
          const p = path.join(process.cwd(), f.url.slice(1));
          deleteOps.push(fs.unlink(p).catch(() => {}));
        }
      });
    }
    if (doc.cover && doc.cover.storageType === "supabase" && doc.cover.bucket && doc.cover.publicId) {
      deleteOps.push(deleteSupabaseFile(doc.cover.bucket, doc.cover.publicId));
    } else if (doc.cover && doc.cover.url && typeof doc.cover.url === "string" && doc.cover.url.startsWith("/uploads/")) {
      deleteOps.push(fs.unlink(path.join(process.cwd(), doc.cover.url.slice(1))).catch(() => {}));
    }

    await Promise.all(deleteOps);
    await Resources.deleteOne({ _id: id });
    await ResourceChapter.deleteMany({ resource: id }).catch(() => {});
    await Bookmark.deleteMany({ resource: id }).catch(() => {});
    await Progress.deleteMany({ resource: id }).catch(() => {});

    res.json({ success: true, message: "Resource and related data removed", resourceId: id });
  } catch (err) {
    next(err);
  }
});

router.get("/:resourceId/chapters", async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    if (!isValidId(resourceId)) return res.status(400).json({ error: "Invalid resource id" });
    const resource = await Resources.findById(resourceId).select("_id");
    if (!resource) return res.status(404).json({ error: "Resource not found" });
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || "50", 10)));
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "chapterNumber";
    const [chapters, total] = await Promise.all([
      ResourceChapter.find({ resource: resourceId }).sort(sort).skip(skip).limit(limit).lean(),
      ResourceChapter.countDocuments({ resource: resourceId })
    ]);
    res.json({ success: true, page, limit, total, chapters });
  } catch (err) { next(err); }
});

router.post("/:resourceId/chapters", authenticate, async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    if (!isValidId(resourceId)) return res.status(400).json({ error: "Invalid resource id" });
    const resource = await Resources.findById(resourceId).select("_id");
    if (!resource) return res.status(404).json({ error: "Resource not found" });
    const payload = {
      resource: resourceId,
      chapterNumber: req.body.chapterNumber,
      title: req.body.title,
      slug: req.body.slug || "",
      description: req.body.description || "",
      contentHtml: req.body.contentHtml || "",
      isLocked: req.body.isLocked || false,
      allowComments: typeof req.body.allowComments === "boolean" ? req.body.allowComments : true,
      status: req.body.status || "draft",
      publishedAt: req.body.publishedAt || null,
      lastEditedBy: req.body.lastEditedBy || null
    };
    const chapter = new ResourceChapter(payload);
    await chapter.save();
    await refreshResourceStats(resourceId);
    res.status(201).json({ success: true, chapter });
  } catch (err) {
    if (err && err.code === 11000) return res.status(409).json({ error: "Chapter number already exists for this resource" });
    next(err);
  }
});

router.get("/:resourceId/chapters/latest", async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    if (!isValidId(resourceId)) return res.status(400).json({ error: "Invalid resource id" });
    const resource = await Resources.findById(resourceId).select("_id");
    if (!resource) return res.status(404).json({ error: "Resource not found" });
    let chapter = await ResourceChapter.findOne({ resource: resourceId, status: "published" }).sort({ chapterNumber: -1 }).lean();
    if (!chapter) chapter = await ResourceChapter.findOne({ resource: resourceId }).sort({ chapterNumber: -1 }).lean();
    if (!chapter) return res.status(404).json({ error: "No chapters found" });
    res.json({ success: true, chapter });
  } catch (err) { next(err); }
});

router.get("/:resourceId/chapters/:chapterId", async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    const chapterId = req.params.chapterId;
    if (!isValidId(resourceId) || !isValidId(chapterId)) return res.status(400).json({ error: "Invalid id(s)" });
    const chapter = await ResourceChapter.findOne({ _id: chapterId, resource: resourceId }).lean();
    if (!chapter) return res.status(404).json({ error: "Chapter not found" });
    res.json({ success: true, chapter });
  } catch (err) { next(err); }
});

router.put("/:resourceId/chapters/:chapterId", authenticate, async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    const chapterId = req.params.chapterId;
    if (!isValidId(resourceId) || !isValidId(chapterId)) return res.status(400).json({ error: "Invalid id(s)" });
    const chapter = await ResourceChapter.findOne({ _id: chapterId, resource: resourceId });
    if (!chapter) return res.status(404).json({ error: "Chapter not found" });
    const allowed = ["chapterNumber","title","slug","description","contentHtml","isLocked","allowComments","status","publishedAt","lastEditedBy"];
    allowed.forEach(k => { if (typeof req.body[k] !== "undefined") chapter[k] = req.body[k]; });
    await chapter.save();
    await refreshResourceStats(resourceId);
    res.json({ success: true, chapter });
  } catch (err) {
    if (err && err.code === 11000) return res.status(409).json({ error: "Chapter number conflict" });
    next(err);
  }
});

router.delete("/:resourceId/chapters/:chapterId", authenticate, async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    const chapterId = req.params.chapterId;
    if (!isValidId(resourceId) || !isValidId(chapterId)) return res.status(400).json({ error: "Invalid id(s)" });
    const chapter = await ResourceChapter.findOneAndDelete({ _id: chapterId, resource: resourceId });
    if (!chapter) return res.status(404).json({ error: "Chapter not found" });
    const remaining = await ResourceChapter.find({ resource: resourceId }).sort({ chapterNumber: 1 }).lean();
    for (let i = 0; i < remaining.length; i++) {
      const desired = i + 1;
      if (remaining[i].chapterNumber !== desired) await ResourceChapter.updateOne({ _id: remaining[i]._id }, { chapterNumber: desired });
    }
    await refreshResourceStats(resourceId);
    res.json({ success: true, message: "Chapter deleted", chapterId });
  } catch (err) { next(err); }
});

router.post("/uploads/editor", authenticate, (req, res, next) => {
  if (!upload || typeof upload.single !== "function") return res.status(500).json({ error: "Editor upload middleware missing" });
  const uploader = upload.single("image");
  uploader(req, res, async (err) => {
    if (err instanceof multer.MulterError) return res.status(413).json({ error: "Editor image too large or invalid" });
    if (err) return res.status(500).json({ error: "Editor image upload error" });
    try {
      await uploadEditorImage(req, res);
    } catch (e) {
      await removeFilesSafely(req.file).catch(() => {});
      next(e);
    }
  });
});

export default router;
