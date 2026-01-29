import express from "express";
import User from "../models/User.js";
import Session from "../models/TutorSession.js";
const router = express.Router();

// Get all tutors connected to a student by Session records
router.get("/students/:userId/tutors", async (req, res) => {
  try {
    const userId = req.params.userId;
    const student = await User.findById(userId);
    if (!student || student.role !== "student") {
      return res.status(404).json({ error: "Student not found" });
    }
    // Get distinct tutor ObjectIds from session records for the given student 
    const tutorIds = await Session.find({ student: userId }).distinct("tutor");
    if (!tutorIds || tutorIds.length === 0) {
      return res.json({ tutors: [] });
    }
    // Fetch their user profiles (exclude sensitive fields)
    const tutors = await User.find({ _id: { $in: tutorIds }, role: "tutor" }).select("-password -emailVerificationToken");
    return res.json({ tutors });
  } catch (err) {
    console.error("Error fetching tutors for student:", err);
    return res.status(500).json({ error: "Server error." });
  }
});

export default router;
