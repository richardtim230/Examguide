import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import DeviceRegistration from "../models/DeviceRegistration.js";
import Faculty from "../models/Faculty.js";
import Department from "../models/Department.js";
import Institution from "../models/Institution.js";
import { descriptorFromBuffer, loadFaceModels } from "../lib/face-verify-setup.js";
import { euclideanDistance, averageDescriptors, encryptDescriptor, decryptDescriptor } from "../lib/face-verify-helpers.js";
import { uploadMultiple } from "../middleware/multer.js";
import authMiddleware from "../middleware/auth.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();
const DIST_THRESHOLD = Number(process.env.FACE_VERIFY_DISTANCE_THRESHOLD || 0.6);
const REQUIRED_SIMILARITY = Number(process.env.FACE_VERIFY_NORMALIZED_MIN || 0.6);
const FACE_MATCH_THRESHOLD = Number(process.env.FACE_MATCH_THRESHOLD || 0.45);
const MAX_FACE_FAILS = Number(process.env.FACE_MAX_FAILS || 5);
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

function looksLikeObjectId(v) {
  return typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v);
}

router.post("/register", uploadMultiple, async (req, res) => {
  try {
    const deviceId = req.cookies?.device_id;
    if (!deviceId) return res.status(400).json({ message: "Device ID missing. Please enable cookies." });
    const regExists = await DeviceRegistration.findOne({ deviceId });
    if (regExists) return res.status(403).json({ message: "This device has already been used to register an account." });

    const { username, password, role, level, phone, email, faculty, department, fullname, ref, institution, userType } = req.body;
    if (!username || !password) return res.status(400).json({ message: "All fields required" });
    if (username.length < 3) return res.status(400).json({ message: "Username must be at least 3 characters" });

    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ message: "Username already exists" });
    if (email) {
      const emailExists = await User.findOne({ email: (email || "").toLowerCase() });
      if (emailExists) return res.status(409).json({ message: "Email already in use" });
    }

    let facultyId = null;
    let departmentId = null;
    let institutionDoc = null;

    if (faculty && faculty !== "") {
      if (looksLikeObjectId(faculty)) {
        const fac = await Faculty.findById(faculty);
        if (!fac) return res.status(400).json({ message: "Faculty not found." });
        facultyId = fac._id;
      } else {
        let fac = await Faculty.findOne({ name: faculty });
        if (!fac) fac = await Faculty.create({ name: faculty });
        facultyId = fac._id;
      }
    }

    if (department && department !== "") {
      if (looksLikeObjectId(department)) {
        const dept = await Department.findById(department);
        if (!dept) return res.status(400).json({ message: "Department not found." });
        departmentId = dept._id;
      } else {
        let d = await Department.findOne({ name: department });
        if (!d) d = await Department.create({ name: department, faculty: facultyId });
        departmentId = d._id;
      }
    }

    if (institution && institution !== "") {
      if (looksLikeObjectId(institution)) {
        institutionDoc = await Institution.findById(institution);
        if (!institutionDoc) return res.status(400).json({ message: "Institution not found." });
      } else {
        const instName = String(institution).trim();
        if (instName.length > 0) {
          institutionDoc = await Institution.findOne({ name: { $regex: `^${instName}$`, $options: "i" } }).collation({ locale: "en", strength: 2 }).exec();
          if (!institutionDoc) institutionDoc = await Institution.create({ name: instName, abbreviation: instName.toUpperCase() });
        }
      }
    }

    let profilePicUrl = "";
    let profileBuffer = null;
    if (req.files?.profilePic?.[0]) {
      const profileFile = req.files.profilePic[0];
      const profileDir = path.join(process.cwd(), "uploads/profilepics");
      if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });
      const profileFileName = `profile_${Date.now()}_${Math.round(Math.random()*1e9)}${path.extname(profileFile.originalname)}`;
      const profileFilePath = path.join(profileDir, profileFileName);
      fs.writeFileSync(profileFilePath, profileFile.buffer);
      profilePicUrl = `/uploads/profilepics/${profileFileName}`;
      profileBuffer = profileFile.buffer;
    } else if (req.body.profilePic && req.body.profilePic.startsWith("data:image")) {
      const matches = req.body.profilePic.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1];
        const data = matches[2];
        const buffer = Buffer.from(data, "base64");
        const filename = `profile_${Date.now()}.${ext}`;
        const filePath = path.join(process.cwd(), "uploads/profilepics", filename);
        if (!fs.existsSync(path.dirname(filePath))) fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, buffer);
        profilePicUrl = `/uploads/profilepics/${filename}`;
        profileBuffer = buffer;
      }
    }

    const faceFiles = req.files?.faceImage || [];
    if (faceFiles.length === 0) return res.status(400).json({ message: "At least one face capture (faceImage) is required for secure enrollment." });

    const faceDir = path.join(process.cwd(), "uploads/faces");
    if (!fs.existsSync(faceDir)) fs.mkdirSync(faceDir, { recursive: true });
    const faceImageUrls = [];
    const faceBuffers = [];
    for (const f of faceFiles) {
      const faceFileName = `face_${Date.now()}_${Math.round(Math.random()*1e9)}${path.extname(f.originalname)}`;
      const faceFilePath = path.join(faceDir, faceFileName);
      fs.writeFileSync(faceFilePath, f.buffer);
      faceImageUrls.push(`/uploads/faces/${faceFileName}`);
      faceBuffers.push(f.buffer);
    }

    let faceImageUrl = faceImageUrls[0] || "";

// Use the captured face image as the profile picture if none was uploaded.
if (!profilePicUrl && faceImageUrl) {
    profilePicUrl = faceImageUrl;
    profileBuffer = faceBuffers[0];
}

    await loadFaceModels();

    const profileDesc = profileBuffer ? await descriptorFromBuffer(profileBuffer) : null;
    const profileDescriptor = profileDesc || await descriptorFromBuffer(faceBuffers[0]);
    if (!profileDescriptor) return res.status(400).json({ message: "Could not extract face from the profile or captured images. Ensure images clearly show your face." });

    const capturedDescriptors = [];
    for (const buf of faceBuffers) {
      const d = await descriptorFromBuffer(buf);
      if (d) capturedDescriptors.push(d);
    }
    if (capturedDescriptors.length === 0) return res.status(400).json({ message: "Could not extract face descriptors from the captured images." });

    const capturedTemplate = averageDescriptors(capturedDescriptors);
    if (!capturedTemplate) return res.status(500).json({ message: "Failed to create captured face template." });

    const distance = euclideanDistance(profileDescriptor, capturedTemplate);
    const verificationScore = Math.max(0, (DIST_THRESHOLD - distance) / DIST_THRESHOLD);
    const normalizedScore = Math.min(1, verificationScore);
    const passed = normalizedScore >= REQUIRED_SIMILARITY;
    if (!passed) return res.status(400).json({ message: "Face verification failed. Make sure profile and webcam captures are of the same person.", distance, verificationScore: normalizedScore });

    const hashed = await bcrypt.hash(password, 12);
    const encryptedTemplate = encryptDescriptor(JSON.stringify(capturedTemplate));

    const userPayload = {
      username,
      password: hashed,
      role: role || "student",
      faculty: facultyId,
      department: departmentId,
      email: email || "",
      level: level || "",
      phone: phone || "",
      fullname: fullname || "",
      profilePic: profilePicUrl,
      faceImage: faceImageUrl,
      faceDescriptor: [],
      faceDescriptorEncrypted: encryptedTemplate,
      faceVerified: true,
      verificationScore: normalizedScore,
      lastFaceVerification: new Date(),
      emailVerified: false,
      emailVerificationToken: crypto.randomBytes(32).toString("hex"),
      userType: userType || "student",
      institution: institutionDoc ? institutionDoc._id : undefined
    };

    const user = new User(userPayload);
    await user.save();
    await DeviceRegistration.create({ deviceId, userId: user._id });

    // referral and email logic should be executed by caller or re-used here as needed

    return res.status(201).json({ message: "Registration successful. Face enrollment complete.", verificationScore: normalizedScore, profilePic: profilePicUrl, faceRegistered: true });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Missing credentials" });
    const user = await User.findOne({ username }).exec();
    if (!user) return res.status(401).json({ message: "Invalid username or password" });
    const pwOk = await user.comparePassword(password);
    if (!pwOk) return res.status(401).json({ message: "Invalid username or password" });
    const payload = { id: user._id, username: user.username, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).exec();
    return res.json({ token, user: user.toJSON() });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    return res.json({ user: req.user });
  } catch (err) {
    console.error("me error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/verify-face", authMiddleware, uploadMultiple, async (req, res) => {
  try {
    const userObj = req.user;
    if (!userObj || !userObj._id) return res.status(401).json({ message: "Unauthorized" });

    let currentDescriptor = null;
    if (req.body.faceDescriptor) {
      try { currentDescriptor = typeof req.body.faceDescriptor === "string" ? JSON.parse(req.body.faceDescriptor) : req.body.faceDescriptor; } catch (e) { return res.status(400).json({ message: "Invalid faceDescriptor JSON." }); }
    } else if (req.files?.verificationImage?.[0]) {
      currentDescriptor = await descriptorFromBuffer(req.files.verificationImage[0].buffer);
    } else if (req.files?.faceImage?.[0]) {
      currentDescriptor = await descriptorFromBuffer(req.files.faceImage[0].buffer);
    } else if (req.file && req.file.buffer) {
      currentDescriptor = await descriptorFromBuffer(req.file.buffer);
    } else {
      return res.status(400).json({ message: "No face descriptor or image provided." });
    }

    if (!Array.isArray(currentDescriptor) || currentDescriptor.length !== 128) return res.status(400).json({ message: "Invalid face descriptor." });

    const user = await User.findById(userObj._id).exec();
    if (!user) return res.status(404).json({ message: "User not found." });

    let storedDescriptor = null;
    if (Array.isArray(user.faceDescriptor) && user.faceDescriptor.length === 128) {
      storedDescriptor = user.faceDescriptor.map(Number);
    } else if (user.faceDescriptorEncrypted) {
      try {
        const decrypted = decryptDescriptor(user.faceDescriptorEncrypted);
        storedDescriptor = JSON.parse(decrypted);
      } catch (e) {
        return res.status(500).json({ message: "Stored descriptor invalid or decrypt failed." });
      }
    } else {
      return res.status(400).json({ message: "No enrolled face on record." });
    }

    if (!Array.isArray(storedDescriptor) || storedDescriptor.length !== currentDescriptor.length) return res.status(400).json({ message: "Descriptor size mismatch." });

    const distance = euclideanDistance(currentDescriptor.map(Number), storedDescriptor.map(Number));
    const isMatch = distance <= FACE_MATCH_THRESHOLD;
    if (isMatch) {
      user.faceVerificationAttempts = 0;
      user.lastFaceVerification = new Date();
      user.lastLoginWithFace = new Date();
      user.verificationScore = Math.max(0, (FACE_MATCH_THRESHOLD - distance) / FACE_MATCH_THRESHOLD);
      user.faceVerified = true;
      await user.save();
      console.log(`Face verify SUCCESS for user=${user.username} dist=${distance.toFixed(4)}`);
      return res.json({ match: true, distance, verificationScore: user.verificationScore, message: "Face verified successfully" });
    } else {
      user.faceVerificationAttempts = (user.faceVerificationAttempts || 0) + 1;
      user.lastFailedFaceVerification = new Date();
      await user.save();
      console.log(`Face verify FAIL for user=${user.username} dist=${distance.toFixed(4)} attempts=${user.faceVerificationAttempts}`);
      if (user.faceVerificationAttempts >= MAX_FACE_FAILS) return res.status(429).json({ match: false, distance, message: "Too many failed attempts. Try again later." });
      return res.status(403).json({ match: false, distance, attempts: user.faceVerificationAttempts, message: "Face verification failed" });
    }
  } catch (err) {
    console.error("verify-face error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
