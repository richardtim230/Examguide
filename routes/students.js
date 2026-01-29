import express from "express";
import User from "../models/User.js";
import Session from "../models/TutorSession.js";
const router = express.Router();

// Get all tutors connected to a student (by session or direct assignment)
router.get("/students/:userId/tutors", async (req, res) => {
  try {
    const userId = req.params.userId;
    // Tutors by direct reference, if present:
    let tutors = [];
    const student = await User.findById(userId);
    if (!student || student.role !== "student") {
      return res.status(404).json({ error: "Student not found" });
    }
    // If you have a direct field:
    if (Array.isArray(student.tutors) && student.tutors.length > 0) {
      tutors = await User.find({ _id: { $in: student.tutors }, role: "tutor" }).select("-password -emailVerificationToken");
    }
    // Add tutors by Session (i.e., where tutor has had a session with this student)
    const sessionTutorIds = await Session.find({ student: userId }).distinct("tutor");
    if (sessionTutorIds && sessionTutorIds.length > 0) {
      // Get unique tutors not already in 'tutors'
      const already = new Set(tutors.map(t => String(t._id)));
      const moreTutors = await User.find({ _id: { $in: sessionTutorIds.filter(id => !already.has(String(id))) }, role: "tutor" }).select("-password -emailVerificationToken");
      tutors = [...tutors, ...moreTutors];
    }
    // Format as array
    return res.json({ tutors });
  } catch (err) {
    console.error("Error fetching tutors for student", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
