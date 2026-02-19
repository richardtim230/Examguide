import express from "express";
import multer from "multer";
import path from "path";
import Applications from "../models/market/Application.js";
import fs from "fs";
import bcrypt from "bcryptjs";

// --- Express Setup ---
const router = express.Router();

// --- File Upload Setup ---
const uploadDir = "./uploads/applications";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base.replace(/\s+/g, '_')}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }
});

function stripSensitiveFields(app) {
  if (!app) return app;
  const obj = app.toObject ? app.toObject() : { ...app };
  delete obj.password;
  return obj;
}


// --- CREATE application ---
router.post(
  "/",
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

      // Validate required fields
      if (![
        applicantType, username, password, firstName, lastName, dob, email, phone, intakeTerm, program
      ].every(Boolean)) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Handle duplicate username
      const existingUser = await Applications.findOne({ username });
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists. Please choose another." });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // File uploads
      const idFile = req.files.idFile?.[0]?.filename
        ? `/uploads/applications/${req.files.idFile[0].filename}` : "";
      const transcripts = (req.files.transcripts || []).map(f => `/uploads/applications/${f.filename}`);

      // Create application
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
        transcripts,
        submittedAt: new Date()
      });

      res.status(201).json({ message: "Application submitted", application: stripSensitiveFields(application) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// --- LOGIN (username/password) ---
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "Username and password required." });

    const application = await Applications.findOne({ username });
    if (!application)
      return res.status(404).json({ message: "Application not found." });

    const isMatch = await bcrypt.compare(password, application.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid username or password." });

    res.json({ message: "Login successful", application: stripSensitiveFields(application) });
  } catch (e) {
    console.error("Application login error:", e);
    res.status(500).json({ message: "Server error" });
  }
});


// --- READ ALL Applications (optionally dashboard usage, sorted newest first) ---
router.get("/", async (req, res) => {
  try {
    const apps = await Applications.find().sort({ submittedAt: -1 });
    res.json(apps.map(stripSensitiveFields));
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

// --- READ ONE Application by ID (dashboard/detail view) ---
router.get("/:id", async (req, res) => {
  try {
    const application = await Applications.findById(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found" });
    res.json(stripSensitiveFields(application));
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

// --- UPDATE Application by ID (dashboard/user edit) ---
router.put(
  "/:id",
  upload.fields([
    { name: "idFile", maxCount: 1 },
    { name: "transcripts", maxCount: 5 }
  ]),
  async (req, res) => {
    try {
      const application = await Applications.findById(req.params.id);
      if (!application) return res.status(404).json({ message: "Application not found" });

      // Allow patching most fields except username (unless you want to support that too)
      const updatableFields = [
        "applicantType", "firstName", "lastName", "dob", "email", "phone", "nationality", "address",
        "intakeTerm", "program", "currentSchool", "currentGrade", "prevAcademics", "languageProof",
        "emergencyName", "emergencyPhone"
      ];
      for (const key of updatableFields) {
        if (req.body[key] !== undefined) application[key] = req.body[key];
      }

      // --- Update password if present
      if (req.body.password && req.body.password.length > 0) {
        application.password = await bcrypt.hash(req.body.password, 10);
      }

      // Optionally: replace uploaded files (delete old files if needed)
      if (req.files.idFile && req.files.idFile[0]?.filename) {
        // todo: delete old file if desired (fs.unlinkSync)
        application.idFile = `/uploads/applications/${req.files.idFile[0].filename}`;
      }
      if (req.files.transcripts && req.files.transcripts.length) {
        // todo: delete old transcript files if desired
        application.transcripts = req.files.transcripts.map(f => `/uploads/applications/${f.filename}`);
      }
      await application.save();
      res.json({ message: "Application updated", application: stripSensitiveFields(application) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// --- DELETE Application by ID (dashboard) ---
router.delete("/:id", async (req, res) => {
  try {
    const application = await Applications.findByIdAndDelete(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found" });
    // TODO: delete uploaded files from filesystem if needed!
    res.json({ message: "Application deleted" });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

// --- Application COUNT/dashboard stats ---
router.get("/dashboard/summary/count", async (req, res) => {
  try {
    const count = await Applications.countDocuments();
    res.json({ count });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

// --- Application SEARCH (by username, name, program etc, for dashboard/autocomplete) ---
router.get("/search", async (req, res) => {
  // Search query: ?q=term
  const q = req.query.q?.trim();
  if (!q) return res.status(400).json({ message: "Missing q parameter" });
  try {
    // Searches username, firstName, lastName, program, email (add more as needed)
    const regex = new RegExp(q, "i");
    const results = await Applications.find({
      $or: [
        { username: regex },
        { firstName: regex },
        { lastName: regex },
        { program: regex },
        { email: regex },
      ]
    }).limit(20).sort({ submittedAt: -1 });
    res.json(results.map(stripSensitiveFields));
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

/*
  --- Optionally ADD authentication /role restriction to dashboard-only endpoints.
  Example:
    import { authenticate, authorizeRole } from "../middleware/authenticate.js";
    router.put("/:id", authenticate, authorizeRole("admin"), ...)
*/

// --- Export router ---
export default router;
