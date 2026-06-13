import express from "express";
import Resource from "../models/Resource.js";
import UserLibrary from "../models/UserLibrary.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/authenticate.js";
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "cloudinary";

const router = express.Router();

// Cloudinary must already be configured in index.js via cloudinary.v2.config(...)
const cl = cloudinary.v2;

// Use memory storage so we can stream directly to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

const getResourceType = (mimeType = "") => {
  const rawTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/x-rar-compressed",
    "text/plain"
  ];

  return rawTypes.includes(mimeType) ? "raw" : "image";
};

// ============ NON-PARAMETERIZED ROUTES (must come first) ============

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
 * distinct list of courses present in resources
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
 * POST /api/resources/upload-page
 * Upload individual extracted page images to Cloudinary
 * Auth required. Fields (multipart/form-data):
 *  - file (image file - required)
 *  - pageNumber (optional)
 */
router.post("/upload-page", authenticate, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const opts = {
        folder: `${process.env.CLOUDINARY_RESOURCES_FOLDER || "resources"}/pages`,
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        quality: "auto",
        format: "jpg"
      };

      const stream = cl.uploader.upload_stream(opts, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });

      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    res.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      success: true
    });
  } catch (error) {
    console.error("Page upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/resources/upload-file
 * Upload file directly and auto-extract pages if PDF/DOCX
 * Auth required. Fields (multipart/form-data):
 *  - file (required)
 *  - title (required)
 *  - description (optional)
 *  - type (optional)
 *  - course (optional)
 *  - extractPages (optional - "true" to extract pages for PDF/DOCX)
 */
router.post("/upload-file", authenticate, upload.single("file"), async (req, res) => {
  try {
    const { title, description = "", type = "other", course = "", extractPages } = req.body;
    
    if (!title) return res.status(400).json({ message: "Title required" });
    if (!req.file) return res.status(400).json({ message: "File required" });

    let fileUrl = "";
    let cloudinaryPublicId = "";
    let fileMime = "";
    let fileSize = 0;

    const uploadResult = await new Promise((resolve, reject) => {
      const resourceType = getResourceType(req.file.mimetype);

      const opts = {
        folder: process.env.CLOUDINARY_RESOURCES_FOLDER || "resources",
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false
      };

      console.log("Uploading:", {
        name: req.file.originalname,
        mime: req.file.mimetype,
        resourceType
      });

      const stream = cl.uploader.upload_stream(opts, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    fileUrl = uploadResult.secure_url || "";
    cloudinaryPublicId = uploadResult.public_id || "";
    fileSize = uploadResult.bytes || req.file.size || 0;
    fileMime = req.file.mimetype || uploadResult.resource_type || "";

    const resource = await Resource.create({
      title,
      description,
      type,
      course,
      fileUrl,
      cloudinaryPublicId,
      fileMime,
      fileSize,
      uploadedBy: req.user.id,
      pages: [] // Client will handle page extraction
    });

    res.status(201).json(resource);
  } catch (e) {
    console.error("POST /api/resources/upload-file error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/resources/library/me
 * Get current user's saved resources (paginated)
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

// ============ PARAMETERIZED ROUTES (must come last) ============

/**
 * POST /api/resources
 * Auth required. Create resource with pages array or single file/link
 * Fields (application/json):
 *  - title (required)
 *  - description (optional)
 *  - type (optional - pdf, notes, video, etc)
 *  - course (optional)
 *  - pages (optional - array of page objects with imageUrl, cloudinaryPublicId, pageNumber)
 *  - link (optional - external URL)
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { title, description = "", type = "other", course = "", pages = [], link } = req.body;
    
    if (!title) return res.status(400).json({ message: "Title required" });

    // Build resource object
    const resourceData = {
      title,
      description,
      type,
      course,
      uploadedBy: req.user.id,
      fileUrl: link || ""
    };

    // If pages array provided (for PDF/notes), store them
    if (pages && pages.length > 0) {
      resourceData.pages = pages.map((page, idx) => ({
        pageNumber: page.pageNumber || idx + 1,
        imageUrl: page.url || page.imageUrl,
        cloudinaryPublicId: page.publicId || page.cloudinaryPublicId,
        width: page.width || 0,
        height: page.height || 0
      }));
      resourceData.totalPages = pages.length;
      // Set type to pdf or notes if not explicitly set
      if (!type || type === "other") {
        resourceData.type = "pdf";
      }
    }

    const resource = await Resource.create(resourceData);

    res.status(201).json(resource);
  } catch (e) {
    console.error("POST /api/resources error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/resources/:id
 * Details
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
 * Increment downloads and redirect to Cloudinary URL or external link.
 */
router.get("/:id/download", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Not found" });

    resource.downloads = (resource.downloads || 0) + 1;
    await resource.save();

    const url = resource.fileUrl || "";
    if (!url) return res.status(404).json({ message: "No file available" });
    // redirect (Cloudinary or external)
    return res.redirect(url);
  } catch (e) {
    console.error("GET download error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/resources/:id/favorite
 * Toggle favorite for authenticated user
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
 * Body: { rating: 1..5 }
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
 * Edit resource (owner or admin). If file present, upload to Cloudinary and replace.
 */
router.put("/:id", authenticate, upload.single("file"), async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Not found" });
    if (String(resource.uploadedBy) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { title, description, type, course, link, pages = [] } = req.body;
    if (title) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (type) resource.type = type;
    if (course !== undefined) resource.course = course;

    if (req.file && req.file.buffer) {
      // upload new file to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const resourceType = getResourceType(req.file.mimetype);

        const opts = {
          folder: process.env.CLOUDINARY_RESOURCES_FOLDER || "resources",
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
          overwrite: false
        };
        const stream = cl.uploader.upload_stream(opts, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      // delete old Cloudinary asset if present
      if (resource.cloudinaryPublicId) {
        try {
          await cl.uploader.destroy(resource.cloudinaryPublicId, { resource_type: "auto" });
        } catch (er) {
          // ignore deletion errors
        }
      }

      resource.fileUrl = uploadResult.secure_url || "";
      resource.cloudinaryPublicId = uploadResult.public_id || "";
      resource.fileSize = uploadResult.bytes || req.file.size || 0;
      resource.fileMime = req.file.mimetype || uploadResult.resource_type || "";
    } else if (link) {
      // switching to external link: remove old Cloudinary asset if any
      if (resource.cloudinaryPublicId) {
        try { await cl.uploader.destroy(resource.cloudinaryPublicId, { resource_type: "auto" }); } catch (er) {}
        resource.cloudinaryPublicId = "";
      }
      resource.fileUrl = link;
      resource.fileMime = "";
      resource.fileSize = 0;
    }

    // Update pages if provided
    if (pages && pages.length > 0) {
      resource.pages = pages.map((page, idx) => ({
        pageNumber: page.pageNumber || idx + 1,
        imageUrl: page.url || page.imageUrl,
        cloudinaryPublicId: page.publicId || page.cloudinaryPublicId,
        width: page.width || 0,
        height: page.height || 0
      }));
      resource.totalPages = pages.length;
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
 * Owner or admin. Removes resource and Cloudinary asset if present.
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Not found" });
    if (String(resource.uploadedBy) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Delete main file if present
    if (resource.cloudinaryPublicId) {
      try {
        await cl.uploader.destroy(resource.cloudinaryPublicId, { resource_type: "auto" });
      } catch (er) {
        // ignore
      }
    }

    // Delete all page images if present
    if (resource.pages && resource.pages.length > 0) {
      for (const page of resource.pages) {
        try {
          await cl.uploader.destroy(page.cloudinaryPublicId, { resource_type: "image" });
        } catch (er) {
          // ignore individual page deletion errors
        }
      }
    }

    await Resource.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/resources/:id/save
 * Save resource to authenticated user's library (idempotent).
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
 * Remove resource from authenticated user's library.
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

export default router;
