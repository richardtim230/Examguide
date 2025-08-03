import express from "express";
import PracticeSession from "../models/PracticeSession.js";
import { authenticate } from "../middleware/authenticate.js";
const router = express.Router();

// Get user's practice history
router.get("/history", authenticate, async (req, res) => {
  try {
    const sessions = await PracticeSession.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(30);
    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
