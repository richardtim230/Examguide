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
  resource: { type: mongoose.Schema.Types.ObjectId, ref: "Resources", required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: "ResourceChapter", default: null },
  page: { type: Number, default: 1 },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
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
