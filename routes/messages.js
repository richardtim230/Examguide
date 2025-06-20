import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

// --- Multer config for file uploads ---
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    // Optionally restrict mime types
    cb(null, true);
  }
});

// --- 1. List all chats for notification (MUST come BEFORE '/:otherUserId') ---
router.get("/chats", authenticate, async (req, res) => {
  const userId = req.user.id;
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const chats = await Message.aggregate([
    { $match: { $or: [{ from: userObjectId }, { to: userObjectId }] }},
    { $sort: { createdAt: -1 } },
    { $group: {
      _id: {
        $cond: [
          { $eq: ["$from", userObjectId] },
          "$to",
          "$from"
        ]
      },
      lastMsgText: { $first: "$text" },
      lastMsgAt: { $first: "$createdAt" },
      unreadCount: { $sum: { $cond: [ { $and: [ { $eq: ["$to", userObjectId] }, { $eq: ["$read", false] } ] }, 1, 0 ] } }
    }},
    { $sort: { lastMsgAt: -1 } }
  ]);
  for (let chat of chats) {
    if (mongoose.Types.ObjectId.isValid(chat._id)) {
      const user = await User.findById(chat._id);
      chat.otherUserId = chat._id;
      chat.otherUserName = user ? user.username : "Unknown";
    } else {
      chat.otherUserId = chat._id;
      chat.otherUserName = "Unknown";
    }
  }
  res.json(chats);
});

// --- 2. Get chat history between current user and another user ---
router.get("/:otherUserId", authenticate, async (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.otherUserId;
  if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  await Message.updateMany(
    { from: otherUserId, to: userId, read: false },
    { $set: { read: true } }
  );
  const messages = await Message.find({
    $or: [
      { from: userId, to: otherUserId },
      { from: otherUserId, to: userId }
    ]
  }).sort({ createdAt: 1 });
  res.json(messages);
});

// --- 3. Send a text message to another user ---
router.post("/:otherUserId", authenticate, async (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.otherUserId;
  const { text } = req.body;
  if (!text && !req.file) return res.status(400).json({ message: "Text required" });
  if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  const msg = await Message.create({
    from: userId,
    to: otherUserId,
    text,
    read: false
  });
  res.status(201).json(msg);
});

// --- 4. Send a file (optionally with text) ---
router.post("/:otherUserId/file", authenticate, upload.single("file"), async (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.otherUserId;
  const { text } = req.body;
  if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  if (!req.file) return res.status(400).json({ message: "File required" });

  // Save file message
  const fileObj = {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    filename: req.file.filename,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`
  };
  const msg = await Message.create({
    from: userId,
    to: otherUserId,
    text: text || "",
    file: fileObj,
    read: false
  });
  res.status(201).json(msg);
});

// --- Serve uploads statically (should be in main app.js/server.js) ---
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

export default router;
