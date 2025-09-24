import express from "express";
import Newsletter from "../models/Newsletter.js";

const router = express.Router();

// Add a new subscription
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }
    const exists = await Newsletter.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: "Email already subscribed" });
    }
    const news = await Newsletter.create({ name, email, phone, message });
    res.status(201).json({ message: "Subscribed successfully", news });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// Get all subscriptions (Admin)
router.get("/", async (req, res) => {
  try {
    const list = await Newsletter.find().sort({ date: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

export default router;
