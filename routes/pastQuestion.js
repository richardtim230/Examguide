import express from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import streamifier from "streamifier";
import PastQuestion from "../models/PastQuestion.js";
import { authenticate } from "../middleware/authenticate.js"; // Optional

const router = express.Router();

function getCloudinaryResourceType(mimetype) {
  if (/^image\//.test(mimetype)) return "image";
  if (
    mimetype === "application/pdf" ||
    mimetype === "application/msword" ||
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) return "raw";
  return "auto";
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("File type not allowed!"));
  }
});

router.get("/", async (req, res) => {
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
router.post("/", upload.single("file"), /* authenticate, */ async (req, res) => {
  try {
    const { course, title, year, type, description } = req.body;
    if (!course || !title || !year || !type || !req.file)
      return res.status(400).json({ message: "All fields and file required" });

    const resourceType = getCloudinaryResourceType(req.file.mimetype);
    // Ensure extension is included in public_id!
    const originalExt = req.file.originalname.split('.').pop();
    const cleanedExt = originalExt && originalExt.length < 8 ? '.' + originalExt.replace(/[^a-zA-Z0-9]/g, '') : '';
    const safeTitle = title.trim().replace(/\s+/g, "_").replace(/[^\w-]/g,'');
    const safeCourse = course.trim().replace(/\s+/g, "_").replace(/[^\w-]/g,'');
    const now = Date.now();
    const publicId = `${safeCourse}_${safeTitle}_${now}${cleanedExt}`; // include .pdf/.docx/etc

    cloudinary.v2.uploader.upload_stream(
      {
        folder: "pastquestions",
        public_id: publicId,
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
