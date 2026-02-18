import express from "express";
import multer from "multer";
import path from "path";
import Applications from "../models/market/Application.js";
import fs from "fs";
import bcrypt from "bcryptjs"; // Add this

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
      const {
        applicantType, username, password, firstName, lastName, dob, email, phone,
        nationality, address, intakeTerm, program, currentSchool, currentGrade,
        prevAcademics, languageProof, emergencyName, emergencyPhone
      } = req.body;

      if (![applicantType, username, password, firstName, lastName, dob, email, phone, intakeTerm, program].every(Boolean)) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Username should be unique
      const exists = await Applications.findOne({ username });
      if (exists) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Hash password (recommended for security)
      const hashedPassword = await bcrypt.hash(password, 12);

      const idFile = req.files.idFile?.[0]?.filename
        ? `/uploads/applications/${req.files.idFile[0].filename}`
        : "";

      const transcripts = (req.files.transcripts || []).map(f => `/uploads/applications/${f.filename}`);

      const application = await Applications.create({
        applicantType,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        dob,
        email,
        phone,
        nationality,
        address,
        intakeTerm,
        program,
        currentSchool,
        currentGrade,
        prevAcademics,
        languageProof,
        emergencyName,
        emergencyPhone,
        idFile,
        transcripts
      });

      res.status(201).json({ message: "Application submitted", application });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.get("/", async (req, res) => {
  const apps = await Applications.find().sort({submittedAt: -1}).select("-password");
  res.json(apps);
});

export default router;
