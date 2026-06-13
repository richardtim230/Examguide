import express from "express";
import Resource from "../models/Resource.js";
import UserLibrary from "../models/UserLibrary.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/authenticate.js";
import multer from "multer";
import path from "path";
import mongoose from "mongoose";

const router = express.Router();

// Initialize GridFS
let gfsBucket;
const conn = mongoose.connection;

conn.once("open", () => {
  gfsBucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: "resources" });
  console.log("GridFS bucket initialized");
});

// Use memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

const getResourceType = (mimeType = "", originalName = "") => {
  const ext = path.extname((originalName || "")).toLowerCase();

  const typeMap = {
    ".pdf": "pdf",
    ".doc": "document",
    ".docx": "document",
    ".txt": "document",
    ".ppt": "presentation",
    ".pptx": "presentation",
    ".xls": "spreadsheet",
    ".xlsx": "spreadsheet",
    ".mp4": "video",
    ".avi": "video",
    ".mov": "video",
    ".webm": "video",
    ".mp3": "audio",
    ".wav": "audio",
    ".flac": "audio",
    ".m4a": "audio",
    ".jpg": "image",
    ".jpeg": "image",
    ".png": "image",
    ".gif": "image",
    ".webp": "image",
    ".zip": "archive",
    ".rar": "archive",
    ".7z": "archive"
  };

  return typeMap[ext] || "file";
};

const uploadToGridFS = async (buffer, fileName, mimeType) => {
  return new Promise((resolve, reject) => {
    if (!gfsBucket) {
      return reject(new Error("GridFS bucket not initialized"));
    }

    const uploadStream = gfsBucket.openUploadStream(fileName, {
      contentType: mimeType,
      metadata: {
        uploadedAt: new Date()
      }
    });

    uploadStream.on("error", (error) => {
      console.error("GridFS upload error:", error);
      reject(error);
    });

    uploadStream.on("finish", (file) => {
      console.log("GridFS upload successful:", {
        fileId: file._id,
        filename: file.filename,
        size: file.length
      });
      resolve({
        fileId: file._id.toString(), // Ensure it's a string
        fileSize: file.length
      });
    });

    uploadStream.end(buffer);
  });
};

const deleteFromGridFS = async (fileId) => {
  if (!fileId || !gfsBucket) return;

  return new Promise((resolve, reject) => {
    try {
      // Convert fileId to ObjectId if it's a string
      const objectId = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
      
      gfsBucket.delete(objectId, (error) => {
        if (error) {
          console.warn("GridFS delete error:", error);
          resolve(); // don't reject, just warn
        } else {
          console.log("GridFS delete successful:", fileId);
          resolve();
        }
      });
    } catch (e) {
      console.warn("GridFS delete conversion error:", e);
      resolve(); // Don't reject on conversion errors
    }
  });
};

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
 */
router.post("/", authenticate, upload.single("file"), async (req, res) => {
  try {
    const { title, description = "", type = "other", course = "", link, pages } = req.body;
    if (!title) return res.status(400).json({ message: "Title required" });

    let fileId = null;
    let fileMime = "";
    let fileSize = 0;
    let resourceType = "other";
    let parsedPages = [];

    // Parse pages if provided
    if (pages) {
      try {
        parsedPages = typeof pages === 'string' ? JSON.parse(pages) : pages;
      } catch (e) {
        console.warn("Failed to parse pages:", e);
        parsedPages = [];
      }
    }

    if (req.file && req.file.buffer) {
      resourceType = getResourceType(req.file.mimetype, req.file.originalname);

      console.log("Uploading to MongoDB GridFS:", {
        name: req.file.originalname,
        mime: req.file.mimetype,
        resourceType,
        size: req.file.size
      });

      try {
        const uploadResult = await uploadToGridFS(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );

        fileId = uploadResult.fileId;
        fileSize = uploadResult.fileSize;
        fileMime = req.file.mimetype;
      } catch (uploadError) {
        console.error("GridFS upload failed:", uploadError);
        return res.status(500).json({ error: "File upload failed: " + uploadError.message });
      }
    }

    const resource = await Resource.create({
      title,
      description,
      type: resourceType || type,
      course,
      fileId: fileId || undefined,
      fileMime: fileMime || undefined,
      fileSize: fileSize || 0,
      uploadedBy: req.user.id,
      link: link || undefined,
      pages: parsedPages.length > 0 ? parsedPages : undefined
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
    const resource = await Resource.findById(req.params.id)
      .populate("uploadedBy", "fullname username email")
      .lean();
    if (!resource) return res.status(404).json({ message: "Not found" });
    res.json(resource);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/resources/:id/download
 * Stream file directly from GridFS
 */
router.get("/:id/download", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Not found" });

    resource.downloads = (resource.downloads || 0) + 1;
    await resource.save();

    // If external link, redirect to it
    if (resource.link) {
      return res.redirect(resource.link);
    }

    // If file in GridFS, stream it
    if (resource.fileId) {
      if (!gfsBucket) {
        return res.status(500).json({ error: "GridFS not initialized" });
      }

      try {
        const objectId = typeof resource.fileId === 'string' 
          ? new mongoose.Types.ObjectId(resource.fileId) 
          : resource.fileId;

        const downloadStream = gfsBucket.openDownloadStream(objectId);

        downloadStream.on("error", (error) => {
          console.error("GridFS download error:", error);
          res.status(404).json({ message: "File not found" });
        });

        // Set appropriate headers for download
        res.setHeader("Content-Type", resource.fileMime || "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="${resource.title}${path.extname(resource.title) ? "" : ".bin"}"`);

        downloadStream.pipe(res);
      } catch (e) {
        console.error("Download stream error:", e);
        res.status(404).json({ message: "File not found" });
      }
    } else {
      res.status(404).json({ message: "No file available" });
    }
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

/**
 * PUT /api/resources/:id
 */
router.put("/:id", authenticate, upload.single("file"), async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Not found" });
    if (String(resource.uploadedBy) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { title, description, type, course, link, pages } = req.body;
    if (title) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (type) resource.type = type;
    if (course !== undefined) resource.course = course;

    // Parse pages if provided
    if (pages) {
      try {
        resource.pages = typeof pages === 'string' ? JSON.parse(pages) : pages;
      } catch (e) {
        console.warn("Failed to parse pages:", e);
      }
    }

    if (req.file && req.file.buffer) {
      const resourceType = getResourceType(req.file.mimetype, req.file.originalname);

      try {
        const uploadResult = await uploadToGridFS(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );

        // Delete old file from GridFS
        if (resource.fileId) {
          await deleteFromGridFS(resource.fileId);
        }

        resource.fileId = uploadResult.fileId;
        resource.fileSize = uploadResult.fileSize;
        resource.fileMime = req.file.mimetype;
        resource.type = resourceType;
        resource.link = undefined; // clear link if file uploaded
      } catch (uploadError) {
        console.error("GridFS upload failed:", uploadError);
        return res.status(500).json({ error: "File upload failed: " + uploadError.message });
      }
    } else if (link) {
      // Switch to external link: delete GridFS file if present
      if (resource.fileId) {
        await deleteFromGridFS(resource.fileId);
      }
      resource.fileId = null;
      resource.link = link;
      resource.fileMime = "";
      resource.fileSize = 0;
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

    // Delete from GridFS if present
    if (resource.fileId) {
      await deleteFromGridFS(resource.fileId);
    }

    await resource.deleteOne();
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/resources/:id/save
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

/**
 * DELETE /api/resources/:id/save
 */
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

/**
 * GET /api/resources/library/me
 */
router.get("/library/me", authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const lib = await UserLibrary.findOne({ user: req.user.id }).lean();
    const resourcesIds = (lib && lib.resources) ? lib.resources : [];
    const pg = Math.max(1, parseInt(page, 10));
    const lim = Math.max(1, Math.min(200, parseInt(limit, 10)));
    const total = resourcesIds.length;
    const slice = resourcesIds.slice((pg - 1) * lim, (pg - 1) * lim + lim);
    const items = await Resource.find({ _id: { $in: slice } })
      .populate("uploadedBy", "fullname username")
      .lean();
    res.json({ meta: { page: pg, limit: lim, total, pages: Math.ceil(total / lim) }, items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
