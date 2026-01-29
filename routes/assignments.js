import express from "express";
import Assignment from "../models/Assignment.js";
import { authenticate } from "../middleware/authenticate.js"; // if you want auth
const router = express.Router();

/**
 * GET /assignments/user/:userId
 * Returns all assignments assigned to a particular student
 */
router.get("/assignments/user/:userId", authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;
    // Find assignments where assignedTo array includes userId
    const assignments = await Assignment.find({ assignedTo: userId })
      .populate("tutor", "fullname username")               // optional: populate tutor info
      .sort({ dueDate: -1 });
    res.json({ assignments });
  } catch (err) {
    console.error("Error fetching assignments for user:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
