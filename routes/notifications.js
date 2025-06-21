import express from "express";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Set up multer for image uploads (store in /uploads/notifications/)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join("uploads", "notifications");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Unique name: timestamp + original name
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  }
});
const upload = multer({ storage });

// CREATE notification (support image)
router.post(
  "/",
  authenticate,
  authorizeRole("admin", "superadmin"),
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, message, sentTo } = req.body;
      let recipients = [];
      if (sentTo && sentTo.length > 0) {
        recipients = Array.isArray(sentTo) ? sentTo : [sentTo];
      } else {
        const users = await User.find({ role: "student" }, "_id");
        recipients = users.map(u => u._id);
      }
      let imageUrl = "";
      if (req.file) {
        imageUrl = "/" + req.file.path.replace(/\\/g, "/");
      }
      const notif = await Notification.create({
        title,
        message,
        imageUrl,
        sentBy: req.user.id,
        sentTo: recipients
      });
      res.status(201).json(notif);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

// LIST notifications
router.get("/", authenticate, async (req, res) => {
  const notif = await Notification.find().sort({ createdAt: -1 });
  res.json(notif);
});

// READ one notification by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    res.json(notif);
  } catch (e) {
    res.status(500).json({ message: "Could not fetch notification" });
  }
});

// EDIT notification (support image)
router.put(
  "/:id",
  authenticate,
  authorizeRole("admin", "superadmin"),
  upload.single("image"),
  async (req, res) => {
    try {
      const notif = await Notification.findById(req.params.id);
      if (!notif) return res.status(404).json({ message: "Not found" });

      // Only allow sender or superadmin to edit
      if (
        String(notif.sentBy) !== String(req.user.id) &&
        req.user.role !== "superadmin"
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      notif.title = req.body.title ?? notif.title;
      notif.message = req.body.message ?? notif.message;

      if (req.file) {
        // Optionally delete old file here if you want
        if (notif.imageUrl) {
          const oldPath = path.join(process.cwd(), notif.imageUrl);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        notif.imageUrl = "/" + req.file.path.replace(/\\/g, "/");
      }

      await notif.save();
      res.json(notif);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

// DELETE notification
router.delete(
  "/:id",
  authenticate,
  authorizeRole("admin", "superadmin"),
  async (req, res) => {
    try {
      const notif = await Notification.findById(req.params.id);
      if (!notif) return res.status(404).json({ message: "Notification not found" });

      // Only allow sender or superadmin to delete
      if (
        String(notif.sentBy) !== String(req.user.id) &&
        req.user.role !== "superadmin"
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Optionally delete image file from disk
      if (notif.imageUrl) {
        const filePath = path.join(process.cwd(), notif.imageUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      await notif.deleteOne();
      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ message: "Could not delete notification" });
    }
  }
);

export default router;
