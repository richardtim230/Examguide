import express from "express";
import User from "../models/User.js";
import Result from "../models/Result.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

router.get("/", authenticate, authorizeRole("superadmin"), async (req, res) => {
  const totalStudents = await User.countDocuments({ role: "student" });
  const totalAdmins = await User.countDocuments({ role: "admin" });
  const totalAttempts = await Result.countDocuments();
  res.json({ totalStudents, totalAdmins, totalAttempts });
});

export default router;
