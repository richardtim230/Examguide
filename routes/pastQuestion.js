import express from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import streamifier from "streamifier";
import PastQuestion from "../models/PastQuestion.js";
import { authenticate } from "../middleware/authenticate.js"; // Optional

const router = express.Router();

// Helper to set how Cloudinary should handle upload type based on mimetype
function getCloudinaryResourceType(mimetype) {
  if (/^image\//.test(mimetype)) return "image";
  if (
    mimetype === "application/pdf" ||
    mimetype === "application/msword" ||
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) return "raw";
  return "auto";
}

// Use memory storage for multer so we never write to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
  fileFilter: (req, file, cb) => {
    // Accept: images, PDF, Word doc/docx
    const allowed = [
      "application/pdf",
      "image/jpeg", "image/png", "image/gif",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("File type not allowed!"));
  }
});

// GET: List/filter past questions
router.get("/", async (req, res) => {
  // Accepts optional filters: ?course= &year= &type=
  const q = {};
  if (req.query.course) q.course = new RegExp(req.query.course, "i");
  if (req.query.year) q.year = +req.query.year;
  if (req.query.type) q.type = req.query.type;
  const results = await PastQuestion.find(q).sort({ createdAt: -1 }).lean();
  res.json(results);
});

// POST: Upload one PDF/Doc OR multiple images as a single "past question"
router.post("/", upload.array("file", 50), /* authenticate, */ async (req, res) => {
  try {
    const { course, title, year, type, description } = req.body;
    const files = req.files;
    if (!course || !title || !year || !type || !files?.length)
      return res.status(400).json({ message: "All fields and file(s) required" });

    // Multiple images upload (scanned booklet)
    const isAllImages = files.length > 1 && files.every(f => /^image\//.test(f.mimetype));
    if (isAllImages) {
      let fileUrls = [];
      let mimetypes = [];
      for (let i = 0; i < files.length; i++) {
        await new Promise((resolve, reject) => {
          cloudinary.v2.uploader.upload_stream(
            {
              folder: "pastquestions/multi-image",
              resource_type: "image"
            },
            (err, result) => {
              if (err) return reject(err);
              fileUrls.push(result.secure_url);
              mimetypes.push(files[i].mimetype);
              resolve();
            }
          ).end(files[i].buffer);
        });
      }
      const doc = new PastQuestion({
        course,
        title,
        year,
        type,
        description,
        fileUrl: fileUrls, // store as array
        mimetype: mimetypes,
        uploadedBy: req.user?.id
      });
      await doc.save();
      return res.status(201).json({ message: "Uploaded!", doc });
    }

    // Handle single file (PDF/image/doc)
    const file = files[0];
    const resourceType = getCloudinaryResourceType(file.mimetype);
    await new Promise((resolve, reject) => {
      cloudinary.v2.uploader.upload_stream(
        {
          folder: "pastquestions",
          public_id: `${course.trim().replace(/\s+/g, "_")}_${title.trim().replace(/\s+/g, "_")}_${Date.now()}`,
          resource_type: resourceType
        },
        async (error, result) => {
          if (error) return reject(error);
          const doc = new PastQuestion({
            course,
            title,
            year,
            type,
            description,
            fileUrl: [result.secure_url], // store as array for consistency
            mimetype: [file.mimetype],
            uploadedBy: req.user?.id
          });
          await doc.save();
          res.status(201).json({ message: "Uploaded!", doc });
          resolve();
        }
      ).end(file.buffer);
    });

  } catch (e) {
    res.status(500).json({ message: "Upload failed", error: e.message });
  }
});

export default router;
