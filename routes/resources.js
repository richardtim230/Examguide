import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import Resource from "../models/Resource.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

// Ensure uploads/resources dir exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads", "resources");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer storage (disk)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_").slice(0, 120);
    cb(null, `${base}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// GET /api/resources
// Supports q, type, course, uploader, page, limit, sort
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
        .populate("uploadedBy", "fullname username email")
        .lean()
    ]);
    res.json({ meta: { page: pg, limit: lim, total, pages: Math.ceil(total / lim) }, items });
  } catch (e) {
    console.error("GET /api/resources error:", e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/resources/courses - distinct course list
router.get("/courses", async (req, res) => {
  try {
    const courses = await Resource.distinct("course", { course: { $ne: "" } });
    res.json(courses.sort());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/resources - create (upload)
// multipart/form-data: fields: title, description, type, course, link (if external), file: file
router.post("/", authenticate, upload.single("file"), async (req, res) => {
  try {
    const { title, description = "", type = "other", course = "", link } = req.body;
    if (!title) return res.status(400).json({ message: "Title required" });

    let fileUrl = "";
    let fileMime = "";
    let fileSize = 0;
    if (req.file) {
      // Save accessible URL path (served from /uploads/resources)
      fileUrl = `/uploads/resources/${req.file.filename}`;
      fileMime = req.file.mimetype;
      fileSize = req.file.size;
    } else if (link) {
      fileUrl = link;
    }

    const resource = await Resource.create({
      title, description, type, course, fileUrl, fileMime, fileSize, uploadedBy: req.user.id
    });

    res.status(201).json(resource);
  } catch (e) {
    console.error("POST /api/resources error:", e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/resources/:id - details
router.get("/:id", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).populate("uploadedBy", "fullname username email").lean();
    if (!resource) return res.status(404).json({ message: "Not found" });
    res.json(resource);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/resources/:id/download - increment download count and serve file or redirect to external link
router.get("/:id/download", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Not found" });

    // increment downloads
    resource.downloads = (resource.downloads || 0) + 1;
    await resource.save();

    const url = resource.fileUrl || "";
    if (!url) return res.status(404).json({ message: "No file available" });

    // if startsWith http(s) -> redirect
    if (/^https?:\/\//i.test(url)) {
      return res.redirect(url);
    }

    // local path expected like /uploads/resources/filename
    const filePath = path.join(process.cwd(), url.replace(/^\/+/g, ""));
    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });
    return res.sendFile(filePath);
  } catch (e) {
    console.error("GET download error:", e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/resources/:id/favorite - toggle favorite for authenticated user
router.post("/:id/favorite", authenticate, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Not found" });

    const uid = req.user.id;
    const idx = (resource.favorites || []).findIndex(f => String(f) === String(uid));
    if (idx === -1) {
      resource.favorites.push(uid);
    } else {
      resource.favorites.splice(idx, 1);
    }
    await resource.save();
    res.json({ favorited: idx === -1, favoritesCount: resource.favorites.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/resources/:id/rate - { rating: 1..5 }
router.post("/:id/rate", authenticate, async (req, res) => {
  try {
    const { rating } = req.body;
    const r = Math.max(1, Math.min(5, parseInt(rating, 10) || 0));
    if (!r) return res.status(400).json({ message: "Invalid rating" });

    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Not found" });

    // if user already rated, update
    const existing = (resource.ratings || []).find(rt => String(rt.user) === String(req.user.id));
    if (existing) {
      existing.rating = r;
    } else {
      resource.ratings.push({ user: req.user.id, rating: r });
    }
    await resource.save();
    res.json({ ratingAvg: resource.ratingAvg, ratingCount: resource.ratings.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/resources/:id - edit (owner or admin)
router.put("/:id", authenticate, upload.single("file"), async (req, res) => {
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

    if (req.file) {
      // delete old local file if existed and local
      if (resource.fileUrl && !/^https?:\/\//.test(resource.fileUrl)) {
        const oldPath = path.join(process.cwd(), resource.fileUrl.replace(/^\/+/g, ""));
        try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch (er) {}
      }
      resource.fileUrl = `/uploads/resources/${req.file.filename}`;
      resource.fileMime = req.file.mimetype;
      resource.fileSize = req.file.size;
    } else if (link) {
      // if changing to link, remove old local file if any
      if (resource.fileUrl && !/^https?:\/\//.test(resource.fileUrl)) {
        const oldPath = path.join(process.cwd(), resource.fileUrl.replace(/^\/+/g, ""));
        try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch (er) {}
      }
      resource.fileUrl = link;
      resource.fileMime = "";
      resource.fileSize = 0;
    }

    resource.updatedAt = new Date();
    await resource.save();
    res.json(resource);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/resources/:id - owner or admin
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Not found" });
    if (String(resource.uploadedBy) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // remove local file if present
    if (resource.fileUrl && !/^https?:\/\//.test(resource.fileUrl)) {
      const filePath = path.join(process.cwd(), resource.fileUrl.replace(/^\/+/g, ""));
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (er) { /* ignore */ }
    }

    await resource.remove();
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
