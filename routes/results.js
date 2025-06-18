import express from "express";
import Result from "../models/Result.js";
import User from "../models/User.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

// Get all student results
router.get("/", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const results = await Result.find().populate("user", "username faculty department").sort({ submittedAt: -1 });
  res.json(results);
});

// Get results for a specific examSet
router.get("/exam/:examSet", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const results = await Result.find({ examSet: req.params.examSet }).populate("user", "username");
  res.json(results);
});

// Get results for a specific student
router.get("/user/:userId", authenticate, async (req, res) => {
  const results = await Result.find({ user: req.params.userId }).populate("user", "username");
  res.json(results);
});

export default router;
