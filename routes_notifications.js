import express from "express";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

// Send notification to all students or selected ones
router.post("/", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const { title, message, sentTo } = req.body;
  let recipients = [];
  if (sentTo && sentTo.length > 0) {
    recipients = sentTo;
  } else {
    const users = await User.find({ role: "student" }, "_id");
    recipients = users.map(u => u._id);
  }
  const notif = await Notification.create({
    title,
    message,
    sentBy: req.user.id,
    sentTo: recipients
  });
  res.status(201).json(notif);
});

// List all notifications
router.get("/", authenticate, async (req, res) => {
  const notif = await Notification.find().sort({ createdAt: -1 });
  res.json(notif);
});

export default router;