import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import { ObjectId } from "mongodb";
import streamifier from "streamifier";
import Resource from "../models/Resource.js";
import UserLibrary from "../models/UserLibrary.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

// Use memory storage so we can stream directly into GridFS
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } }); // 200MB cap

// Helper to get GridFS bucket (must be created after mongoose connects)
function getBucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection not ready for GridFS");
  return new mongoose.mongo.GridFSBucket(db, { bucketName: process.env.GRIDFS_BUCKET_NAME || "resourcesFiles" });
}

// GET /api/resources  (list)
router.get("/", async (req, res) => {
  try {
    const { q, type, course, uploader, page = 1, limit = 20 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (course) query.course = course;
    if (uploader) query.uploadedBy = uploader;
    if (q && q.trim()) {
      const re = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ title: re }, { description: re }, { course: re }];
    }
    const pg = Math.max(1, parseInt(page, 10));
    const lim = Math.max(1, Math.min(200, parseInt(limit, 10)));
    const [total, items] = await Promise.all([
      Resource.countDocuments(query),
      Resource.find(query)
        .sort({ createdAt: -1 })
        .skip((pg - 1) * lim)
        .limit(lim)
        .populate("uploadedBy", "fullname username email")
        .lean()
    ]);
    res.json({ meta: { page: pg, limit: lim, total, pages: Math.ceil(total / lim) }, items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/resources  (upload)
// Use upload.fields to accept both 'file' and 'thumbnail' (memory storage)
router.post(
  "/",
  authenticate,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { title, description = "", type = "other", course = "", link } = req.body;
      if (!title) return res.status(400).json({ message: "Title required" });

      // Files (if any)
      const fileObj = req.files?.file?.[0] ?? null;
      const thumbObj = req.files?.thumbnail?.[0] ?? null;

      let fileUrl = "";
      let cloudinaryPublicId = "";
      let fileMime = "";
      let fileSize = 0;
      let thumbnailUrl = "";

      // Upload main file to Cloudinary if provided
      if (fileObj && fileObj.buffer) {
        const uploadResult = await new Promise((resolve, reject) => {
          const opts = {
            folder: process.env.CLOUDINARY_RESOURCES_FOLDER || "resources",
            resource_type: "auto",
            use_filename: true,
            unique_filename: true,
            overwrite: false
          };
          const stream = cloudinary.v2.uploader.upload_stream(opts, (error, result) => {
            if (error) return reject(error);
            resolve(result);
          });
          streamifier.createReadStream(fileObj.buffer).pipe(stream);
        });

        fileUrl = uploadResult.secure_url || "";
        cloudinaryPublicId = uploadResult.public_id || "";
        fileSize = uploadResult.bytes || fileObj.size || 0;
        fileMime = fileObj.mimetype || uploadResult.resource_type || "";
      } else if (link) {
        fileUrl = link;
      }

      // Upload thumbnail (image) if provided
      if (thumbObj && thumbObj.buffer) {
        const thumbResult = await new Promise((resolve, reject) => {
          const opts = {
            folder: (process.env.CLOUDINARY_RESOURCES_FOLDER || "resources") + "/thumbnails",
            resource_type: "image",
            use_filename: true,
            unique_filename: true,
            overwrite: false
          };
          const stream = cloudinary.v2.uploader.upload_stream(opts, (error, result) => {
            if (error) return reject(error);
            resolve(result);
          });
          streamifier.createReadStream(thumbObj.buffer).pipe(stream);
        });
        thumbnailUrl = thumbResult.secure_url || "";
      }

      const resource = await Resource.create({
        title,
        description,
        type,
        course,
        fileUrl,
        cloudinaryPublicId,
        fileMime,
        fileSize,
        thumbnailUrl,          // store thumbnail URL in the doc
        uploadedBy: req.user.id
      });

      res.status(201).json(resource);
    } catch (e) {
      console.error("POST /api/resources error:", e);
      // Return JSON error for easier debugging
      res.status(500).json({ error: e.message, stack: process.env.NODE_ENV === "development" ? e.stack : undefined });
    }
  }
);

// GET /api/resources/:id  (details)
router.get("/:id", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).populate("uploadedBy", "fullname username email").lean();
    if (!resource) return res.status(404).json({ message: "Not found" });
    res.json(resource);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/resources/:id/download  (stream file)
router.get("/:id/download", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    resource.downloads = (resource.downloads || 0) + 1;
    await resource.save();

    if (resource.fileUrl && /^https?:\/\//.test(resource.fileUrl)) {
      // external link
      return res.redirect(resource.fileUrl);
    }

    if (!resource.fileId) {
      return res.status(404).json({ message: "No file available for this resource" });
    }

    const bucket = getBucket();
    const fileObjectId = typeof resource.fileId === "string" ? new ObjectId(resource.fileId) : resource.fileId;

    const downloadStream = bucket.openDownloadStream(fileObjectId);
    res.setHeader("Content-Disposition", `attachment; filename="${resource.title.replace(/"/g, "")}"`);
    if (resource.fileMime) res.setHeader("Content-Type", resource.fileMime);

    downloadStream.on("error", (err) => {
      console.error("gridfs download error:", err);
      res.status(500).end("Could not download file");
    });

    downloadStream.pipe(res);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/resources/:id  (owner or admin)
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Not found" });
    if (String(resource.uploadedBy) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // remove GridFS file if present
    if (resource.fileId) {
      const bucket = getBucket();
      const fileObjectId = typeof resource.fileId === "string" ? new ObjectId(resource.fileId) : resource.fileId;
      try {
        await bucket.delete(fileObjectId);
      } catch (er) {
        // ignore deletion errors (file might already be gone)
        console.warn("GridFS delete error (ignored):", er.message);
      }
    }

    await resource.remove();
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Save to library endpoints (same as Cloudinary route)
router.post("/:id/save", authenticate, async (req, res) => {
  try {
    const resourceId = req.params.id;
    const resource = await Resource.findById(resourceId).select("_id title");
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    const lib = await UserLibrary.findOneAndUpdate(
      { user: req.user.id },
      { $addToSet: { resources: resourceId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ saved: true, libraryCount: lib.resources.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id/save", authenticate, async (req, res) => {
  try {
    const resourceId = req.params.id;
    const lib = await UserLibrary.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { resources: resourceId } },
      { new: true }
    );
    res.json({ removed: true, libraryCount: lib ? lib.resources.length : 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/library/me", authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const lib = await UserLibrary.findOne({ user: req.user.id }).lean();
    const resourcesIds = (lib && lib.resources) ? lib.resources : [];
    const pg = Math.max(1, parseInt(page, 10));
    const lim = Math.max(1, Math.min(200, parseInt(limit, 10)));
    const total = resourcesIds.length;
    const slice = resourcesIds.slice((pg - 1) * lim, (pg - 1) * lim + lim);
    const items = await Resource.find({ _id: { $in: slice } }).populate("uploadedBy", "fullname username").lean();
    res.json({ meta: { page: pg, limit: lim, total, pages: Math.ceil(total / lim) }, items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
