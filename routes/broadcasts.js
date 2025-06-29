const express = require("express");
const router = express.Router();
const Broadcast = require("../models/Broadcast");
const requireAdmin = require("../middleware/requireAdmin");
const requireAuth = require("../middleware/requireAuth");
const multer = require("multer");
const path = require("path");

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/broadcasts/"); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname.replace(/\s/g, "_"));
  }
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only accept images
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 3 * 1024 * 1024 } // 3MB limit
});

// Admin: Send broadcast (with image)
router.post("/", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const { title, message, expiresAt, type, link } = req.body;
    if (!title || !message) return res.status(400).json({ message: "Title and message are required." });
    let imageUrl = undefined;
    if (req.file) {
      // Save relative path or build URL
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
    res.status(201).json(broadcast);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// User: Get latest unseen broadcast
router.get("/latest", requireAuth, async (req, res) => {
  const userId = req.user._id;
  const now = new Date();
  const broadcast = await Broadcast.findOne({
    $and: [
      { $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] },
      { seenBy: { $ne: userId } }
    ]
  }).sort({ createdAt: -1 });
  res.json(broadcast);
});

// User: Mark broadcast as seen
router.post("/ack/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  await Broadcast.findByIdAndUpdate(id, { $addToSet: { seenBy: userId } });
  res.json({ ok: true });
});

// Admin/User: Get all broadcasts (admin list page)
router.get("/", requireAuth, async (req, res) => {
  const broadcasts = await Broadcast.find().sort({ createdAt: -1 }).limit(50);
  res.json(broadcasts);
});

module.exports = router;
