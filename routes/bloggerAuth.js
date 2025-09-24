import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import User from "../models/User.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

// File storage setup for passport and NIN
const passportDir = "./uploads/blogger/passport";
const ninDir = "./uploads/blogger/nin";
if (!fs.existsSync(passportDir)) fs.mkdirSync(passportDir, { recursive: true });
if (!fs.existsSync(ninDir)) fs.mkdirSync(ninDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "passport") cb(null, passportDir);
    else if (file.fieldname === "nin") cb(null, ninDir);
    else cb(new Error("Invalid field"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base.replace(/\s+/g, "_")}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, true),
});

/**
 * Blogger/Marketer Registration (Pending Approval)
 */
router.post("/register", upload.fields([
  { name: "passport", maxCount: 1 },
  { name: "nin", maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      fullname, email, phone, matric, role, institution, username, password
    } = req.body;
    if (!fullname || !email || !phone || !username || !password)
      return res.status(400).json({ message: "All fields are required" });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ message: "Email or username already exists" });

    const hashed = await bcrypt.hash(password, 12);
    const passportUrl = req.files.passport ? `/uploads/blogger/passport/${req.files.passport[0].filename}` : "";
    const ninUrl = req.files.nin ? `/uploads/blogger/nin/${req.files.nin[0].filename}` : "";

    const user = new User({
      fullname,
      username,
      email,
      phone,
      studentId: matric,
      password: hashed,
      // Account is pending until admin approval
      role: "pending_blogger",
      status: "pending",
      approved: false,
      profilePic: passportUrl,
      ninSlip: ninUrl, // Add this to your schema!
      institution: institution === "other" ? otherInstitution : institution,
      active: false, // Not active until approved
    });
    await user.save();
    res.status(201).json({ message: "Registration submitted. Awaiting admin approval." });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

/**
 * Blogger/Marketer Login (Only if approved and status is "active")
 */
router.post("/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password)
      return res.status(400).json({ message: "All fields required" });

    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });

    if (
      !user ||
      !["blogger", "marketer", "both"].includes(user.role) ||
      user.status !== "active" ||
      user.approved !== true
    ) {
      return res.status(403).json({ message: "Account pending approval by admin." });
    }

    if (!user.active)
      return res.status(403).json({ message: "Account is deactivated" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "2h" });
    res.json({ token, message: "Login successful" });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Admin Approval Endpoint
 * PATCH /api/blogger/approve/:id
 * Body: { role: "blogger" | "marketer" | "both" }
 */
router.patch(
  "/approve/:id",
  authenticate,
  authorizeRole("admin", "superadmin"),
  async (req, res) => {
    const { role } = req.body;
    if (!["blogger", "marketer", "both"].includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.role = role;
    user.status = "active";
    user.approved = true;
    user.active = true;
    await user.save();
    res.json({ message: "User approved and role set.", user });
  }
);

export default router;
