import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { uploadPaths, editorUpload } from "../middleware/upload.js";
import { createResource, uploadEditorImage } from "../controllers/resourceController.js";
import Resources from "../models/Resources.js";
import { fileURLToPath } from "url";

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "coverFile") return cb(null, uploadPaths.covers);
    return cb(null, uploadPaths.resources);
  },
  filename: (req, file, cb) => {
    const { base, ext } = sanitizeBaseName(file.originalname);
    const uniq = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}-${uniq}${ext}`);
  }
});

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

async function removeFilesSafely(files = []) {
  if (!files) return;
  const arr = Array.isArray(files) ? files : [files];
  await Promise.all(arr.map(async (f) => {
    if (!f) return;
    const p = typeof f === "string" ? f : f.path || f.url || f;
    if (!p) return;
    try {
      let fp = p;
      if (typeof p === "string" && p.startsWith("/uploads/")) fp = path.join(process.cwd(), p.slice(1));
      await fs.unlink(fp).catch(() => {});
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

router.post(
  "/",
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
  if (req.query.uploader) filter.uploader = req.query.uploader;
  if (q) filter.$or = [
    { title: new RegExp(q, "i") },
    { subtitle: new RegExp(q, "i") },
    { authors: new RegExp(q, "i") },
    { courseCode: new RegExp(q, "i") }
  ];
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Resources.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Resources.countDocuments(filter)
  ]);
  res.json({ items, total, page, limit });
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ error: "Invalid id" });
  const doc = await Resources.findById(id).lean();
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json({ resource: doc });
});

router.put(
  "/:id",
  multerMiddleware([
    { name: "mainFile", maxCount: 1 },
    { name: "coverFile", maxCount: 1 }
  ]),
  async (req, res) => {
    const id = req.params.id;
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      await removeFilesSafely([req.file, req.coverFile]);
      return res.status(400).json({ error: "Invalid id" });
    }
    const doc = await Resources.findById(id);
    if (!doc) {
      await removeFilesSafely([req.file, req.coverFile]);
      return res.status(404).json({ error: "Not found" });
    }
    const up = {};
    const fields = ["title","subtitle","authors","coauthors","publisher","edition","isbn10","isbn13","language","publicationYear","pages","format","faculty","department","level","semester","courseCode","courseTitle","contentHtml","copyrightHolder","licenseType","visibility"];
    fields.forEach(f => {
      if (typeof req.body[f] !== "undefined" && req.body[f] !== null) up[f] = req.body[f];
    });
    if (req.body.tags) {
      try { up.tags = typeof req.body.tags === "string" ? JSON.parse(req.body.tags) : req.body.tags; } catch(e){ up.tags = req.body.tags; }
    }
    if (req.file) {
      const fileObj = {
        name: req.file.originalname,
        label: req.body.fileLabel || req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: req.file.path ? (() => { const rel = path.relative(process.cwd(), req.file.path); return "/" + rel.split(path.sep).join("/"); })() : req.file.filename,
        storageType: "local",
        uploadedAt: new Date()
      };
      doc.files = doc.files || [];
      doc.files.push(fileObj);
    }
    if (req.coverFile) {
      doc.cover = {
        url: req.coverFile.path ? (() => { const rel = path.relative(process.cwd(), req.coverFile.path); return "/" + rel.split(path.sep).join("/"); })() : req.coverFile.filename,
        mimeType: req.coverFile.mimetype,
        size: req.coverFile.size
      };
    }
    Object.assign(doc, up);
    await doc.save();
    res.json({ success: true, resource: doc });
  }
);

router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ error: "Invalid id" });
  const doc = await Resources.findById(id);
  if (!doc) return res.status(404).json({ error: "Not found" });
  const filePaths = [];
  if (Array.isArray(doc.files)) {
    doc.files.forEach(f => {
      if (f && f.url && typeof f.url === "string" && f.url.startsWith("/uploads/")) {
        filePaths.push(path.join(process.cwd(), f.url.slice(1)));
      }
    });
  }
  if (doc.cover && doc.cover.url && typeof doc.cover.url === "string" && doc.cover.url.startsWith("/uploads/")) {
    filePaths.push(path.join(process.cwd(), doc.cover.url.slice(1)));
  }
  await Resources.deleteOne({ _id: id });
  await Promise.all(filePaths.map(p => fs.unlink(p).catch(() => {})));
  res.json({ success: true });
});

router.post("/uploads/editor", (req, res, next) => {
  if (!editorUpload || typeof editorUpload.single !== "function") return res.status(500).json({ error: "Editor upload middleware missing" });
  const uploader = editorUpload.single("image");
  uploader(req, res, async (err) => {
    if (err instanceof multer.MulterError) return res.status(413).json({ error: "Editor image too large or invalid" });
    if (err) return res.status(500).json({ error: "Editor image upload error" });
    try {
      await uploadEditorImage(req, res);
    } catch (e) {
      if (req.file && req.file.path) await fs.unlink(req.file.path).catch(() => {});
      next(e);
    }
  });
});

export default router;
