import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import PastQuestion from "../models/PastQuestion.js";
import { authenticate } from "../middleware/authenticate.js"; // If you want to require login for uploads

const router = express.Router();

const uploadDir = "./uploads/pastquestions";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Allow PDF, image, DOC, DOCX (adjust as desired)
const allowed = [
  "application/pdf",
  "image/jpeg", "image/png", "image/gif",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const cleanBase = path.basename(file.originalname, path.extname(file.originalname)).replace(/\s+/g, '_').replace(/[^\w\-]/g, '');
    cb(null, `${cleanBase}_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("File type not allowed!"));
  }
});


// --- GET: list/filter ---
router.get("/", async (req, res) => {
  // Filter: accept ?course= &year= &type=
  const q = {};
  if (req.query.course) q.course = new RegExp(req.query.course, "i"); // case-insensitive partial match
  if (req.query.year) q.year = +req.query.year;
  if (req.query.type) q.type = req.query.type;
 const backendHost = process.env.BACKEND_HOST || 'https://examguide.onrender.com';
  const results = await PastQuestion.find(q).sort({ createdAt: -1 }).lean();
  results.forEach(x=>{
    x.fileUrl = `${backendHost}/uploads/pastquestions/${path.basename(x.fileUrl||"")}`;
  });
  res.json(results);
});
// --- POST: create -->
router.post("/", upload.single("file"), /* authenticate, */ async (req, res) => {
  try {
    const { course, title, year, type, description } = req.body;
    if (!course || !title || !year || !type || !req.file)
      return res.status(400).json({ message: "All fields and file required" });
    const doc = new PastQuestion({
      course,
      title,
      year,
      type,
      description,
      fileUrl: `/uploads/pastquestions/${req.file.filename}`,
      mimetype: req.file.mimetype,
      uploadedBy: req.user?.id // if using auth
    });
    await doc.save();
    res.status(201).json({ message: "Uploaded!", doc });
  } catch (e) {
    res.status(500).json({ message: "Upload failed", error: e.message });
  }
});

export default router;
