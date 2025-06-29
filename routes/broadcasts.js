import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Broadcast from "../models/Broadcast.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

// Ensure upload directory exists at runtime
const uploadDir = "./uploads/broadcasts";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ===== Multer setup for broadcast image uploads =====
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname.replace(/\s/g, "_"));
  }
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 3 * 1024 * 1024 }
});

// Helper to make imageUrl absolute
const backendBaseUrl = process.env.BACKEND_BASE_URL || "https://examguide.onrender.com";
function makeAbsoluteUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return backendBaseUrl.replace(/\/$/, "") + url;
}

// ===== Admin: Send broadcast (with image) =====
router.post("/", authenticate, authorizeRole("admin", "superadmin"), upload.single("image"), async (req, res) => {
  try {
    const { title, message, expiresAt, type, link } = req.body;
    if (!title || !message) return res.status(400).json({ message: "Title and message are required." });
    let imageUrl = undefined;
    if (req.file) {
      imageUrl = "/uploads/broadcasts/" + req.file.filename;
    }
    const broadcast = new Broadcast({
      title,
      message,
      imageUrl,
      expiresAt,
      type,
      link
    });
    await broadcast.save();
    // Respond with absolute image URL
    const obj = broadcast.toObject();
    obj.imageUrl = makeAbsoluteUrl(obj.imageUrl);
    res.status(201).json(obj);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ===== User: Get latest unseen broadcast =====
router.get("/latest", authenticate, async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  let broadcast = await Broadcast.findOne({
    $and: [
      { $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] },
      { seenBy: { $ne: userId } }
    ]
  }).sort({ createdAt: -1 });
  if (broadcast) {
    broadcast = broadcast.toObject();
    broadcast.imageUrl = makeAbsoluteUrl(broadcast.imageUrl);
  }
  res.json(broadcast);
});

// ===== User: Mark broadcast as seen =====
router.post("/ack/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  await Broadcast.findByIdAndUpdate(id, { $addToSet: { seenBy: userId } });
  res.json({ ok: true });
});

// ===== Admin/User: Get all broadcasts (optional) =====
router.get("/", authenticate, async (req, res) => {
  let broadcasts = await Broadcast.find().sort({ createdAt: -1 }).limit(50);
  broadcasts = broadcasts.map(b => {
    const obj = b.toObject();
    obj.imageUrl = makeAbsoluteUrl(obj.imageUrl);
    return obj;
  });
  res.json(broadcasts);
});

// ===== Admin: Delete a broadcast =====
router.delete("/:id", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const b = await Broadcast.findByIdAndDelete(req.params.id);
    if (!b) return res.status(404).json({ message: "Broadcast not found." });
    // Optionally, delete image file from server
    if (b.imageUrl && b.imageUrl.startsWith("/uploads/broadcasts/")) {
      const filePath = path.join(process.cwd(), b.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    res.json({ message: "Broadcast deleted." });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
