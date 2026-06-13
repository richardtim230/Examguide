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

const initializeGridFS = () => {
  const conn = mongoose.connection;
  
  if (conn.readyState === 1) { // 1 = connected
    gfsBucket = new mongoose.mongo.GridFSBucket(conn.db, { 
      bucketName: "resources" 
    });
    console.log("✅ GridFS bucket initialized successfully");
  }
};

// Initialize on connection
mongoose.connection.on("connected", () => {
  console.log("MongoDB connected, initializing GridFS...");
  initializeGridFS();
});

// If already connected when route loads
if (mongoose.connection.readyState === 1) {
  initializeGridFS();
}

// Use memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }
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
        uploadedAt: new Date(),
        originalName: fileName
      }
    });

    uploadStream.on("error", (error) => {
      console.error("❌ GridFS upload stream error:", error);
      reject(error);
    });

    uploadStream.on("finish", (file) => {
      console.log("✅ GridFS upload successful:", {
        fileId: file._id,
        filename: file.filename,
        size: file.length,
        contentType: file.contentType
      });
      resolve({
        fileId: file._id,
        fileSize: file.length
      });
    });

    // Write buffer to stream
    uploadStream.write(buffer);
    uploadStream.end();
  });
};

const deleteFromGridFS = async (fileId) => {
  if (!fileId) return;

  return new Promise((resolve, reject) => {
    if (!gfsBucket) {
      console.warn("⚠️ GridFS bucket not initialized, skipping delete");
      return resolve();
    }

    gfsBucket.delete(fileId, (error) => {
      if (error) {
        console.warn("⚠️ GridFS delete error:", error.message);
        resolve(); // don't reject, just warn
      } else {
        console.log("✅ GridFS delete successful:", fileId);
        resolve();
      }
    });
  });
};

/**
 * GET /api/resources
 * List all resources with filters and pagination
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
        .populate("uploadedBy", "fullname username email")
        .lean()
    ]);

    res.json({ meta: { page: pg, limit: lim, total, pages: Math.ceil(total / lim) }, items });
  } catch (e) {
    console.error("❌ GET /api/resources error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/resources/courses
 * Get distinct list of courses
 */
router.get("/courses", async (req, res) => {
  try {
    const courses = await Resource.distinct("course", { course: { $ne: "" } });
    res.json(courses.sort());
  } catch (e) {
    console.error("❌ GET /api/resources/courses error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/resources
 * Create new resource with file upload
 */
router.post("/", authenticate, upload.single("file"), async (req, res) => {
  try {
    const { title, description = "", type = "other", course = "", link } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: "Title required" });
    }

    let fileId = null;
    let fileMime = "";
    let fileSize = 0;
    let resourceType = "other";

    if (req.file && req.file.buffer) {
      resourceType = getResourceType(req.file.mimetype, req.file.originalname);

      console.log("📤 Uploading to MongoDB GridFS:", {
        name: req.file.originalname,
        mime: req.file.mimetype,
        resourceType,
        size: req.file.size,
        bufferLength: req.file.buffer.length
      });

      if (!gfsBucket) {
        return res.status(500).json({ error: "GridFS not initialized. Please try again." });
      }

      try {
        const uploadResult = await uploadToGridFS(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );

        fileId = uploadResult.fileId;
        fileSize = uploadResult.fileSize;
        fileMime = req.file.mimetype;

        console.log("✅ File uploaded successfully:", {
          fileId: fileId,
          fileSize: fileSize
        });
      } catch (uploadError) {
        console.error("❌ GridFS upload failed:", uploadError);
        return res.status(500).json({ error: "File upload failed: " + uploadError.message });
      }
    }

    const resource = await Resource.create({
      title,
      description,
      type: resourceType || type,
      course,
      fileId,
      fileMime,
      fileSize,
      uploadedBy: req.user.id,
      link: link || ""
    });

    console.log("✅ Resource created with fileId:", resource.fileId);
    res.status(201).json(resource);
  } catch (e) {
    console.error("❌ POST /api/resources error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/resources/:id
 * Get resource details
 */
router.get("/:id", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate("uploadedBy", "fullname username email")
      .lean();
    
    if (!resource) {
      return res.status(404).json({ message: "Not found" });
    }
    
    res.json(resource);
  } catch (e) {
    console.error("❌ GET /api/resources/:id error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/resources/:id/download
 * Download/stream file from GridFS
 */
router.get("/:id/download", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: "Not found" });
    }

    // Increment downloads
    resource.downloads = (resource.downloads || 0) + 1;
    await resource.save();

    // If external link, redirect to it
    if (resource.link && resource.link.trim()) {
      console.log("📎 Redirecting to external link:", resource.link);
      return res.redirect(resource.link);
    }

    // If file in GridFS, stream it
    if (resource.fileId) {
      if (!gfsBucket) {
        return res.status(500).json({ error: "GridFS not available" });
      }

      const downloadStream = gfsBucket.openDownloadStream(resource.fileId);

      downloadStream.on("error", (error) => {
        console.error("❌ GridFS download error:", error);
        if (!res.headersSent) {
          res.status(404).json({ message: "File not found" });
        }
      });

      // Set appropriate headers for download
      res.setHeader("Content-Type", resource.fileMime || "application/octet-stream");
      res.setHeader(
        "Content-Disposition", 
        `inline; filename="${resource.title}${path.extname(resource.title) ? "" : ".bin"}"`
      );
      res.setHeader("Content-Length", resource.fileSize);

      console.log("📥 Streaming file:", {
        fileId: resource.fileId,
        filename: resource.title,
        size: resource.fileSize,
        type: resource.fileMime
      });

      downloadStream.pipe(res);
    } else {
      res.status(404).json({ message: "No file available" });
    }
  } catch (e) {
    console.error("❌ GET /api/resources/:id/download error:", e);
    if (!res.headersSent) {
      res.status(500).json({ error: e.message });
    }
  }
});

/**
 * POST /api/resources/:id/favorite
 * Toggle favorite for authenticated user
 */
router.post("/:id/favorite", authenticate, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: "Not found" });
    }

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
    console.error("❌ POST /api/resources/:id/favorite error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/resources/:id/rate
 * Rate a resource (1-5)
 */
router.post("/:id/rate", authenticate, async (req, res) => {
  try {
    const { rating } = req.body;
    const r = Math.max(1, Math.min(5, parseInt(rating, 10) || 0));
    
    if (!r) {
      return res.status(400).json({ message: "Invalid rating" });
    }

    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: "Not found" });
    }

    const existing = resource.ratings.find(rt => String(rt.user) === String(req.user.id));
    
    if (existing) {
      existing.rating = r;
    } else {
      resource.ratings.push({ user: req.user.id, rating: r });
    }
    
    await resource.save();
    res.json({ ratingAvg: resource.ratingAvg, ratingCount: resource.ratings.length });
  } catch (e) {
    console.error("❌ POST /api/resources/:id/rate error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * PUT /api/resources/:id
 * Update resource (owner or admin)
 */
router.put("/:id", authenticate, upload.single("file"), async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: "Not found" });
    }
    
    if (String(resource.uploadedBy) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { title, description, type, course, link } = req.body;
    
    if (title) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (type) resource.type = type;
    if (course !== undefined) resource.course = course;

    if (req.file && req.file.buffer) {
      const resourceType = getResourceType(req.file.mimetype, req.file.originalname);

      console.log("📤 Updating file in GridFS:", {
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

        // Delete old file from GridFS
        if (resource.fileId) {
          await deleteFromGridFS(resource.fileId);
        }

        resource.fileId = uploadResult.fileId;
        resource.fileSize = uploadResult.fileSize;
        resource.fileMime = req.file.mimetype;
        resource.type = resourceType;
        resource.link = ""; // clear link if file uploaded
      } catch (uploadError) {
        console.error("❌ GridFS upload failed:", uploadError);
        return res.status(500).json({ error: "File upload failed: " + uploadError.message });
      }
    } else if (link && link.trim()) {
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
    console.error("❌ PUT /api/resources/:id error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * DELETE /api/resources/:id
 * Delete resource and file (owner or admin)
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: "Not found" });
    }
    
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
    console.error("❌ DELETE /api/resources/:id error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/resources/:id/save
 * Save resource to user's library
 */
router.post("/:id/save", authenticate, async (req, res) => {
  try {
    const resourceId = req.params.id;
    const resource = await Resource.findById(resourceId).select("_id title");
    
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const lib = await UserLibrary.findOneAndUpdate(
      { user: req.user.id },
      { $addToSet: { resources: resourceId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ saved: true, libraryCount: lib.resources.length });
  } catch (e) {
    console.error("❌ POST /api/resources/:id/save error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * DELETE /api/resources/:id/save
 * Remove resource from user's library
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
    console.error("❌ DELETE /api/resources/:id/save error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/resources/library/me
 * Get current user's saved resources
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
    console.error("❌ GET /api/resources/library/me error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
