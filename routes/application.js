import express from "express";
import multer from "multer";
import path from "path";
import Application from "../models/market/Application.js";
import fs from "fs";

const router = express.Router();

const uploadDir = "./uploads/applications";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base.replace(/\s+/g,'_')}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }
});

router.post("/", 
  upload.fields([
    { name: "idFile", maxCount: 1 },
    { name: "transcripts", maxCount: 5 }
  ]),
  async (req, res) => {
    try {
      // Validate required fields (server-side)
      const {
        applicantType, firstName, lastName, dob, email, phone,
        nationality, address, intakeTerm, program, currentSchool, currentGrade,
        prevAcademics, languageProof, emergencyName, emergencyPhone
      } = req.body;

      if (![applicantType, firstName, lastName, dob, email, phone, intakeTerm, program].every(Boolean)) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Handle file uploads
      const idFile = req.files.idFile?.[0]?.filename
        ? `/uploads/applications/${req.files.idFile[0].filename}`
        : "";

      const transcripts = (req.files.transcripts || []).map(f => `/uploads/applications/${f.filename}`);

      const application = await Application.create({
        applicantType, firstName, lastName, dob, email, phone, nationality, address,
        intakeTerm, program, currentSchool, currentGrade, prevAcademics, languageProof,
        emergencyName, emergencyPhone, idFile, transcripts
      });

      res.status(201).json({ message: "Application submitted", application });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// (Optional) Admin: list all applications
router.get("/", async (req, res) => {
  const apps = await Application.find().sort({submittedAt: -1});
  res.json(apps);
});

export default router;
