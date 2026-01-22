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
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
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
// DELETE: Only user who uploaded may delete (backend protection!)
router.delete("/:id", authenticate, async (req, res) => {
  const pq = await PastQuestion.findById(req.params.id);
  if (!pq) return res.status(404).json({ message: "Not found" });
  if (!pq.uploadedBy || pq.uploadedBy.toString() !== req.user.id)
    return res.status(403).json({ message: "Forbidden" });
  await pq.deleteOne();
  res.json({ message: "Deleted" });
});
// POST: Upload a new past question file (PDF/IMG/DOCX) to Cloudinary (with correct resource_type)
router.post("/", upload.single("file"), /* authenticate, */ async (req, res) => {
  try {
    const { course, title, year, type, description } = req.body;
    if (!course || !title || !year || !type || !req.file)
      return res.status(400).json({ message: "All fields and file required" });

    const resourceType = getCloudinaryResourceType(req.file.mimetype);

    cloudinary.v2.uploader.upload_stream(
      {
        folder: "pastquestions",
        public_id: `${course.trim().replace(/\s+/g, "_")}_${title.trim().replace(/\s+/g, "_")}_${Date.now()}`,
        resource_type: resourceType
      },
      async (error, result) => {
        if (error) return res.status(500).json({ message: "Cloudinary upload failed", error });

        const doc = new PastQuestion({
          course,
          title,
          year,
          type,
          description,
          fileUrl: result.secure_url,
          mimetype: req.file.mimetype,
          uploadedBy: req.user?.id
        });
        await doc.save();
        res.status(201).json({ message: "Uploaded!", doc });
      }
    ).end(req.file.buffer);
  } catch (e) {
    res.status(500).json({ message: "Upload failed", error: e.message });
  }
});

export default router;
