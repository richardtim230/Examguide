import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import streamifier from "streamifier";
import Resource from "../models/Resource.js";
import UserLibrary from "../models/UserLibrary.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/authenticate.js";
import cloudinary from "cloudinary";

const router = express.Router();

// Use Cloudinary v2 API
const cl = cloudinary.v2;

// Memory storage for direct streaming to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB
});

// Helper to upload a buffer to Cloudinary
async function uploadBufferToCloudinary(buffer, filename, options = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      folder: process.env.CLOUDINARY_RESOURCES_FOLDER || "resources",
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      ...options
    };
    const stream = cl.uploader.upload_stream(opts, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

/**
 * GET /api/resources
 */
router.get("/", async (req, res) => {
  try {
    const { q, type, course, uploader, page = 1, limit = 20, sort = "-createdAt" } = req.query;
    const query = {};
    if (type) query.type = type;
    if (course) query.course = course;
    if (uploader) query.uploadedBy = uploader;
    if (q && q.trim()) {
      const re = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ title: re }, { description: re }, { course: re }];
    }
    const pg = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.max(1, Math.min(200, parseInt(limit, 10) || 20));
    const [total, items] = await Promise.all([
      Resource.countDocuments(query),
      Resource.find(query)
        .sort(sort)
        .skip((pg - 1) * lim)
        .limit(lim)
        .populate("uploadedBy", "fullname username email profilePic")
        .lean()
    ]);
    res.json({ meta: { page: pg, limit: lim, total, pages: Math.ceil(total / lim) }, items });
  } catch (e) {
    console.error("GET /api/resources error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/resources/courses
 */
router.get("/courses", async (req, res) => {
  try {
    const courses = await Resource.distinct("course", { course: { $ne: "" } });
    res.json(courses.sort());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/resources
 * multipart/form-data: title (required), description, type, course, link, file, thumbnail
 */
router.post("/", authenticate, upload.fields([{ name: "file", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]), async (req, res) => {
  try {
    const { title, description = "", type = "other", course = "", link } = req.body;
    if (!title) return res.status(400).json({ message: "Title required" });

    let fileUrl = "";
    let cloudinaryPublicId = "";
    let thumbUrl = "";
    let thumbPublicId = "";
    let fileMime = "";
    let fileSize = 0;

    // Upload main file if provided
    if (req.files && req.files.file && req.files.file[0]) {
      const file = req.files.file[0];
      const uploadResult = await uploadBufferToCloudinary(file.buffer, file.originalname, {
        folder: process.env.CLOUDINARY_RESOURCES_FOLDER || "resources"
      });
      fileUrl = uploadResult.secure_url || "";
      cloudinaryPublicId = uploadResult.public_id || "";
      fileSize = uploadResult.bytes || file.size || 0;
      fileMime = file.mimetype || uploadResult.resource_type || "";
    } else if (link) {
      // external link
      fileUrl = link;
    }

    // Upload thumbnail if provided
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const t = req.files.thumbnail[0];
      try {
        const thumbResult = await uploadBufferToCloudinary(t.buffer, t.originalname, {
          folder: process.env.CLOUDINARY_RESOURCES_FOLDER ? `${process.env.CLOUDINARY_RESOURCES_FOLDER}/thumbnails` : "resources/thumbnails"
        });
        thumbUrl = thumbResult.secure_url || "";
        thumbPublicId = thumbResult.public_id || "";
      } catch (thumbErr) {
        // non-fatal: log and continue without thumbnail
        console.warn("Thumbnail upload failed:", thumbErr.message || thumbErr);
      }
    }

    const resource = await Resource.create({
      title,
      description,
      type,
      course,
      fileUrl,
      cloudinaryPublicId,
      thumbnailUrl: thumbUrl,
      thumbnailPublicId: thumbPublicId,
      fileMime,
      fileSize,
      uploadedBy: req.user.id
    });

    res.status(201).json(resource);
  } catch (e) {
    console.error("POST /api/resources error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/resources/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).populate("uploadedBy", "fullname username email profilePic").lean();
    if (!resource) return res.status(404).json({ message: "Not found" });
    res.json(resource);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/resources/:id/download
 * redirect to Cloudinary or external link
 */
router.get("/:id/download", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Not found" });

    resource.downloads = (resource.downloads || 0) + 1;
    await resource.save();

    const url = resource.fileUrl || "";
    if (!url) return res.status(404).json({ message: "No file available" });

    // redirect to the hosted file (Cloudinary or external)
    return res.redirect(url);
  } catch (e) {
    console.error("GET download error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/resources/:id/favorite
 */
router.post("/:id/favorite", authenticate, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Not found" });

    const uid = req.user.id;
    const idx = (resource.favorites || []).findIndex(f => String(f) === String(uid));
    if (idx === -1) resource.favorites.push(uid);
    else resource.favorites.splice(idx, 1);
    await resource.save();
    res.json({ favorited: idx === -1, favoritesCount: resource.favorites.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/resources/:id/rate
 */
router.post("/:id/rate", authenticate, async (req, res) => {
  try {
    const { rating } = req.body;
    const r = Math.max(1, Math.min(5, parseInt(rating, 10) || 0));
    if (!r) return res.status(400).json({ message: "Invalid rating" });

    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Not found" });

    const existing = resource.ratings.find(rt => String(rt.user) === String(req.user.id));
    if (existing) existing.rating = r;
    else resource.ratings.push({ user: req.user.id, rating: r });
    await resource.save();
    res.json({ ratingAvg: resource.ratingAvg, ratingCount: resource.ratings.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * PUT /api/resources/:id (edit)
 * Allows replacing file/thumbnail (uploads new Cloudinary assets and tries to destroy previous ones)
 */
router.put("/:id", authenticate, upload.fields([{ name: "file", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]), async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Not found" });
    if (String(resource.uploadedBy) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { title, description, type, course, link } = req.body;
    if (title) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (type) resource.type = type;
    if (course !== undefined) resource.course = course;

    // Replace file if provided
    if (req.files && req.files.file && req.files.file[0]) {
      const file = req.files.file[0];
      const uploadResult = await uploadBufferToCloudinary(file.buffer, file.originalname, {
        folder: process.env.CLOUDINARY_RESOURCES_FOLDER || "resources"
      });
      // try destroy existing
      if (resource.cloudinaryPublicId) {
        try { await cl.uploader.destroy(resource.cloudinaryPublicId, { resource_type: "auto" }); } catch (er) { /* ignore */ }
      }
      resource.fileUrl = uploadResult.secure_url || "";
      resource.cloudinaryPublicId = uploadResult.public_id || "";
      resource.fileSize = uploadResult.bytes || file.size || 0;
      resource.fileMime = file.mimetype || uploadResult.resource_type || "";
    } else if (link) {
      // switch to external link: delete cloudinary asset if existed
      if (resource.cloudinaryPublicId) {
        try { await cl.uploader.destroy(resource.cloudinaryPublicId, { resource_type: "auto" }); } catch (er) {}
        resource.cloudinaryPublicId = "";
      }
      resource.fileUrl = link;
      resource.fileMime = "";
      resource.fileSize = 0;
    }

    // Replace thumbnail if provided
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const t = req.files.thumbnail[0];
      const thumbResult = await uploadBufferToCloudinary(t.buffer, t.originalname, {
        folder: process.env.CLOUDINARY_RESOURCES_FOLDER ? `${process.env.CLOUDINARY_RESOURCES_FOLDER}/thumbnails` : "resources/thumbnails"
      });
      if (resource.thumbnailPublicId) {
        try { await cl.uploader.destroy(resource.thumbnailPublicId, { resource_type: "image" }); } catch (er) {}
      }
      resource.thumbnailUrl = thumbResult.secure_url || "";
      resource.thumbnailPublicId = thumbResult.public_id || "";
    }

    resource.updatedAt = new Date();
    await resource.save();
    res.json(resource);
  } catch (e) {
    console.error("PUT /api/resources/:id error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * DELETE /api/resources/:id
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Not found" });
    if (String(resource.uploadedBy) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    // remove cloudinary assets if present
    if (resource.cloudinaryPublicId) {
      try { await cl.uploader.destroy(resource.cloudinaryPublicId, { resource_type: "auto" }); } catch (er) {}
    }
    if (resource.thumbnailPublicId) {
      try { await cl.uploader.destroy(resource.thumbnailPublicId, { resource_type: "image" }); } catch (er) {}
    }
    await resource.remove();
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Save to / remove from library & library listing (same as before)
 */
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
