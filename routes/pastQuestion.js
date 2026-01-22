import express from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import streamifier from "streamifier";
import PastQuestion from "../models/PastQuestion.js";
import { authenticate } from "../middleware/authenticate.js"; // Optional: uncomment if you want upload protection

const router = express.Router();

// Use memory storage: no files written to disk, upload directly to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // up to 20MB
  fileFilter: (req, file, cb) => {
    // Accept PDF, images, Word doc
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

// GET: Past questions list/filter endpoint
router.get("/", async (req, res) => {
  // Optional filters: ?course= &year= &type=
  const q = {};
  if (req.query.course) q.course = new RegExp(req.query.course, "i");
  if (req.query.year) q.year = +req.query.year;
  if (req.query.type) q.type = req.query.type;
  const results = await PastQuestion.find(q).sort({ createdAt: -1 }).lean();
  res.json(results);
});

// POST: Upload a new past question (file goes to Cloudinary)
router.post("/", upload.single("file"), /* authenticate, */ async (req, res) => {
  try {
    const { course, title, year, type, description } = req.body;
    if (!course || !title || !year || !type || !req.file)
      return res.status(400).json({ message: "All fields and file required" });

    // Upload to Cloudinary (auto-detect any file type)
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder: "pastquestions",
        resource_type: "auto",
        public_id: `${course.trim().replace(/\s+/g, "_")}_${title.trim().replace(/\s+/g, "_")}_${Date.now()}`
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
    );
    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (e) {
    res.status(500).json({ message: "Upload failed", error: e.message });
  }
});

export default router;
