import express from "express";
import mongoose from "mongoose";
import Result from "../models/Result.js";
import User from "../models/User.js";
import QuestionSet from "../models/QuestionSet.js"; // Added for review endpoint
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

// Get all student results (admin only)
router.get("/", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const results = await Result.find()
    .populate("user", "username faculty department")
    .populate("examSet", "title")
    .sort({ submittedAt: -1 });
  res.json(results);
});

// Get results for a specific examSet (admin only)
router.get("/exam/:examSet", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const results = await Result.find({ examSet: req.params.examSet })
    .populate("user", "username")
    .populate("examSet", "title");
  res.json(results);
});

// Get all results for a specific student (that student, admin, or superadmin)
router.get("/user/:userId", authenticate, async (req, res) => {
  // Only the user themselves or admin/superadmin can access
  if (
    req.user.role !== "admin" &&
    req.user.role !== "superadmin" &&
    req.user.id !== req.params.userId
  ) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const results = await Result.find({ user: req.params.userId })
    .populate("user", "username")
    .populate("examSet", "title");
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
  const result = await Result.findOne({ user: req.user.id, examSet })
    .populate("user", "username")
    .populate("examSet", "title");
  if (!result) return res.status(404).json({ error: "No result found" });
  res.json({ result });
});

// Leaderboard endpoint: Returns top students by total cumulative score.
router.get("/leaderboard/top", authenticate, async (req, res) => {
  try {
    // Aggregate results: sum total score for each user
    const aggregation = await Result.aggregate([
      { $group: {
          _id: "$user",
          totalScore: { $sum: "$score" }
        }
      },
      { $sort: { totalScore: -1 } },
      { $limit: 10 }
    ]);
    // Populate user info
    const userIds = aggregation.map(e => e._id);
    const users = await User.find({ _id: { $in: userIds } })
      .select("username fullname profilePic faculty department");
    // Merge users and scores
    const leaderboard = aggregation.map(entry => {
      const user = users.find(u => u._id.toString() === entry._id.toString()) || {};
      return {
        userId: user._id,
        username: user.username,
        fullname: user.fullname,
        profilePic: user.profilePic,
        faculty: user.faculty,
        department: user.department,
        totalScore: entry.totalScore
      };
    });
    res.json(leaderboard);
  } catch (e) {
    console.error("Leaderboard error:", e);
    res.status(500).json({ message: "Could not fetch leaderboard", error: e.message });
  }
});
// Get a specific result by ID (admin, superadmin, or result owner)
router.get("/:resultId", authenticate, async (req, res) => {
  const { resultId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(resultId)) {
    return res.status(400).json({ message: "Invalid result id" });
  }
  const result = await Result.findById(resultId)
    .populate("user", "username fullname faculty department")
    .populate("examSet", "title");
  if (!result) return res.status(404).json({ message: "Result not found" });

  if (
    req.user.role !== "admin" &&
    req.user.role !== "superadmin" &&
    req.user.id !== String(result.user._id)
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }

  res.json(result);
});
router.get("/:sessionId/review", authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session id" });
    }
    const result = await Result.findById(sessionId);
    if (!result) return res.status(404).json({ message: "Result not found" });
    if (
      req.user.role !== "admin" &&
      req.user.role !== "superadmin" &&
      req.user.id !== String(result.user)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const questionSet = await QuestionSet.findById(result.examSet);
    if (!questionSet) return res.status(404).json({ message: "Question set not found" });

    // Defensive: Convert Map to object if needed
    let answers = result.answers;
    if (answers instanceof Map) {
      answers = Object.fromEntries(answers);
    }
    answers = answers || {};
    // Debug logs (optional, can be removed in production)
     console.log("answers keys:", Object.keys(answers));
    if (questionSet.questions.length > 0) {
    console.log("first question id:", questionSet.questions[0].id);
    }
    questionSet.questions.forEach(q => {
     console.log("question id:", q.id, "selected:", answers[String(q.id)]);
    });

    const questions = questionSet.questions.map((q) => ({
      question: q.question,
      options: q.options,
      correct: q.answer,
      selected: answers[String(q.id)] ?? "",
      explanation: q.explanation || ""
    }));

    res.json({
      sessionId: result._id,
      examTitle: questionSet.title,
      questions
    });
  } catch (e) {
    console.log("Error in review endpoint:", e);
    res.status(500).json({ message: "Could not load review", error: e.message });
  }
});

export default router;
