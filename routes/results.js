import express from "express";
import Result from "../models/Result.js";
import User from "../models/User.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

// Get all student results (admin only)
router.get("/", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const results = await Result.find().populate("user", "username faculty department").sort({ submittedAt: -1 });
  res.json(results);
});

// Get results for a specific examSet (admin only)
router.get("/exam/:examSet", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const results = await Result.find({ examSet: req.params.examSet }).populate("user", "username");
  res.json(results);
});

// Get all results for a specific student (that student)
router.get("/user/:userId", authenticate, async (req, res) => {
  // Only the user themselves or admin/superadmin can access
  if (
    req.user.role !== "admin" &&
    req.user.role !== "superadmin" &&
    req.user.id !== req.params.userId
  ) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const results = await Result.find({ user: req.params.userId }).populate("user", "username");
  res.json(results);
});

// Save a result for the logged-in user
router.post("/", authenticate, async (req, res) => {
  const { examSet, answers, score, timeTaken, questions } = req.body;

  // Prevent duplicate results for same user/examSet
  let result = await Result.findOne({ user: req.user.id, examSet });
  if (result) {
    // Optionally update it instead of failing
    result.answers = answers;
    result.score = score;
    result.timeTaken = timeTaken;
    result.questions = questions;
    result.submittedAt = new Date();
    await result.save();
    return res.json({ message: "Result updated", result });
  }

  // Create new result
  result = new Result({
    user: req.user.id,
    examSet,
    answers,
    score,
    timeTaken,
    questions,
    submittedAt: new Date()
  });

  await result.save();
  res.status(201).json({ message: "Result saved", result });
});

// Get the result for the logged-in user for a given examSet
router.get("/me", authenticate, async (req, res) => {
  // /api/results/me?examSet=xxxx
  const { examSet } = req.query;
  if (!examSet) return res.status(400).json({ error: "Missing examSet" });
  const result = await Result.findOne({ user: req.user.id, examSet }).populate("user", "username");
  if (!result) return res.status(404).json({ error: "No result found" });
  res.json({ result });
});

export default router;
