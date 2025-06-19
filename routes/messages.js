import express from "express";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

// Get chat history between current user and another user
router.get("/:otherUserId", authenticate, async (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.otherUserId;
  const messages = await Message.find({
    $or: [
      { from: userId, to: otherUserId },
      { from: otherUserId, to: userId }
    ]
  }).sort({ createdAt: 1 });
  res.json(messages);
});

// Send a message to another user
router.post("/:otherUserId", authenticate, async (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.otherUserId;
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ message: "Text required" });
  const msg = await Message.create({
    from: userId,
    to: otherUserId,
    text
  });
  res.status(201).json(msg);
});

// List all chats for notification
router.get("/chats", authenticate, async (req, res) => {
  const userId = req.user.id;
  // Find distinct users this user has chatted with
  const chats = await Message.aggregate([
    { $match: { $or: [{ from: mongoose.Types.ObjectId(userId) }, { to: mongoose.Types.ObjectId(userId) }] }},
    { $sort: { createdAt: -1 } },
    { $group: {
      _id: {
        $cond: [
          { $eq: ["$from", mongoose.Types.ObjectId(userId)] },
          "$to",
          "$from"
        ]
      },
      lastMsgText: { $first: "$text" },
      lastMsgAt: { $first: "$createdAt" },
      unreadCount: { $sum: { $cond: [ { $and: [ { $eq: ["$to", mongoose.Types.ObjectId(userId)] }, { $eq: ["$read", false] } ] }, 1, 0 ] } }
    }},
    { $sort: { lastMsgAt: -1 } }
  ]);
  // Attach usernames
  for (let chat of chats) {
    const user = await User.findById(chat._id);
    chat.otherUserId = chat._id;
    chat.otherUserName = user ? user.username : "Unknown";
  }
  res.json(chats);
});

export default router;
