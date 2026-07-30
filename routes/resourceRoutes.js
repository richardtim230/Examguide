import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { uploadPaths } from "../middleware/upload.js";
import { createResource, uploadEditorImage } from "../controllers/resourceController.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const MAX_RESOURCE_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5 MB

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
    try {
      if (file.fieldname === "coverFile") return cb(null, uploadPaths.covers);
      return cb(null, uploadPaths.resources);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    try {
      const { base, ext } = sanitizeBaseName(file.originalname);
      const uniq = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${base}-${uniq}${ext}`);
    } catch (err) {
      cb(err);
    }
  }
});

function fileFilter(req, file, cb) {
  try {
    if (file.fieldname === "coverFile") {
      if (file.mimetype && file.mimetype.startsWith("image/")) return cb(null, true);
      const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Invalid cover image type");
      return cb(err);
    }

    if (allowedResourceMimes.has(file.mimetype)) return cb(null, true);

    const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Unsupported resource file type");
    return cb(err);
  } catch (err) {
    cb(err);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_RESOURCE_SIZE } // global max; cover size validated after upload
});

async function removeFilesSafely(files = []) {
  if (!files) return;
  const arr = Array.isArray(files) ? files : [files];
  await Promise.all(arr.map(async (f) => {
    if (!f || !f.path) return;
    try { await fs.unlink(f.path); } catch (e) { /* ignore */ }
  }));
}

function multerMiddleware(fieldsSpec) {
  const handler = upload.fields(fieldsSpec);
  return (req, res, next) => {
    handler(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        // Clean up any saved files
        await removeFilesSafely(req.files && Object.values(req.files).flat());
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({ error: "Uploaded file too large" });
        }
        return res.status(415).json({ error: err.message || "Invalid upload" });
      } else if (err) {
        await removeFilesSafely(req.files && Object.values(req.files).flat());
        return res.status(500).json({ error: "Upload error" });
      }

      try {
        // Post-process size constraints for coverFile
        const coverArr = (req.files && req.files.coverFile) || [];
        const mainArr = (req.files && req.files.mainFile) || [];

        if (coverArr[0] && coverArr[0].size > MAX_COVER_SIZE) {
          await removeFilesSafely(Object.values(req.files).flat());
          return res.status(413).json({ error: "Cover image exceeds maximum allowed size (5 MB)" });
        }

        // Normalize single-file expectations for downstream controller:
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
      // Ensure uploaded files are removed if controller fails
      await removeFilesSafely([req.file, req.coverFile]);
      next(err);
    }
  }
);

router.post("/uploads/editor", (req, res, next) => {
  // editorUpload is imported from your middleware/upload.js
  // it already has its own storage and limits
  const uploader = editorUpload.single("image");
  uploader(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(413).json({ error: "Editor image too large or invalid" });
    } else if (err) {
      return res.status(500).json({ error: "Editor image upload error" });
    }
    try {
      await uploadEditorImage(req, res);
    } catch (e) {
      // cleanup
      if (req.file && req.file.path) {
        try { await fs.unlink(req.file.path); } catch (_) {}
      }
      next(e);
    }
  });
});

export default router;
