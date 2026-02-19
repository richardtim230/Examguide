import express from "express";
import multer from "multer";
import path from "path";
import Applications from "../models/market/Application.js";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    // Find user
    const user = await Applications.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        applicantType: user.applicantType
      },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        applicantType: user.applicantType
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
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

      // Handle duplicate username
      const existingUser = await Applications.findOne({ username });
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists. Please choose another." });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

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
  const apps = await Applications.find().sort({submittedAt: -1});
  res.json(apps);
});

export default router;
