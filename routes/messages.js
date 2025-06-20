import express from "express";
import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

// --- 1. List all chats for notification (MUST come BEFORE '/:otherUserId') ---
router.get("/chats", authenticate, async (req, res) => {
  const userId = req.user.id;
  const userObjectId = new mongoose.Types.ObjectId(userId);
  // Find distinct users this user has chatted with
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
  // Attach usernames
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
  // Mark all messages from otherUserId to current user as read
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

// --- 3. Send a message to another user ---
router.post("/:otherUserId", authenticate, async (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.otherUserId;
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ message: "Text required" });
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

export default router;
