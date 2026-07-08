import express from "express";
import mongoose from "mongoose";
import Result from "../models/Result.js";
import User from "../models/User.js";
import QuestionSet from "../models/QuestionSet.js"; // Added for review endpoint
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

// Global utility helper to strip HTML tags and normalize spaces for accurate evaluation
const normalizeText = (str) => {
  if (!str) return '';
  return String(str).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
};

// Get all student results (admin only) — with pagination
router.get("/", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    // Parse pagination params, with defaults
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 20;
    const skip = (page - 1) * limit;

    // Query total count for frontend pagination
    const total = await Result.countDocuments();

    // Fetch paginated results
    const results = await Result.find()
      .populate("user", "username fullname faculty department")
      .populate("examSet", "title")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      total,       // total number of results in the collection
      page,        // current page
      limit,       // results per page
      results      // paginated list
    });
  } catch (e) {
    console.error("Error fetching all results:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// Get results for a specific examSet (admin only)
router.get("/exam/:examSet", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const results = await Result.find({ examSet: req.params.examSet })
      .populate("user", "username fullname")
      .populate("examSet", "title");
    res.json(results);
  } catch (e) {
    console.error("Error fetching exam results:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// Get all results for a specific student (that student, admin, or superadmin)
router.get("/user/:userId", authenticate, async (req, res) => {
  try {
    // Only the user themselves or admin/superadmin can access
    if (
      req.user.role !== "admin" &&
      req.user.role !== "superadmin" &&
      req.user.id !== req.params.userId
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const results = await Result.find({ user: req.params.userId })
      .populate("user", "username fullname")
      .populate("examSet", "title");
    res.json(results);
  } catch (e) {
    console.error("Error fetching user results:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// Save a result for the logged-in user
router.post("/", authenticate, async (req, res) => {
  try {
    const { examSet, answers, score, timeTaken, questions } = req.body;

    // Prevent duplicate results for same user/examSet
    let result = await Result.findOne({ user: req.user.id, examSet });
    if (result) {
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
  } catch (e) {
    console.error("Error saving result:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// Get the result for the logged-in user for a given examSet
router.get("/me", authenticate, async (req, res) => {
  try {
    const { examSet } = req.query;
    if (!examSet) return res.status(400).json({ error: "Missing examSet" });
    const result = await Result.findOne({ user: req.user.id, examSet })
      .populate("user", "username fullname")
      .populate("examSet", "title");
    if (!result) return res.status(404).json({ error: "No result found" });
    res.json({ result });
  } catch (e) {
    console.error("Error fetching my result:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
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

// Get result by resultId (for admin/student)
router.get("/:resultId", authenticate, async (req, res) => {
  try {
    const { resultId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(resultId)) {
      return res.status(400).json({ message: "Invalid result id" });
    }

    const result = await Result.findById(resultId)
      .populate("user", "username fullname faculty department")
      .populate({
        path: "examSet",
        select: "title questions"
      });

    if (!result) return res.status(404).json({ message: "Result not found" });

    if (
      req.user.role !== "admin" &&
      req.user.role !== "superadmin" &&
      req.user.id !== String(result.user._id)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Reconstruct questionsAnswered array cleanly with resilient key mapping
    let questionsAnswered = [];
    if (result.examSet && Array.isArray(result.examSet.questions)) {
      let answers = result.answers;
      if (answers instanceof Map) answers = Object.fromEntries(answers);
      answers = answers || {};
      
      questionsAnswered = result.examSet.questions.map(q => {
        // Resolve target tracking key based securely on individual database structural id parameters
        const lookupKey = q.id !== undefined ? String(q.id) : String(q._id);
        const studentAnswer = answers[lookupKey] || "No answer";

        const isAnswerSkipped = studentAnswer === "No answer" || normalizeText(studentAnswer) === 'no answer';
        const isCorrect = !isAnswerSkipped && (normalizeText(studentAnswer) === normalizeText(q.answer));

        return {
          id: q.id || q._id,
          questionText: q.question,
          studentAnswer: studentAnswer,
          correctAnswer: q.answer,
          isCorrect: isCorrect
        };
      });
    }

    res.json({
      ...result.toObject(),
      questionsAnswered
    });
  } catch (e) {
    console.error("Error in individual result lookup:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// REVIEW ENDPOINT: Unified answer tracker ignoring array indices variations
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
    
    const sessionQuestions = Array.isArray(result.questions) ? result.questions : [];
    
    let answers = result.answers;
    if (answers instanceof Map) answers = Object.fromEntries(answers);
    answers = answers || {};

    // Map through the snapshot of questions exactly as shown during their session
    const questions = sessionQuestions.map(q => {
      const lookupKey = q.id !== undefined ? String(q.id) : String(q._id);
      const studentAnswer = answers[lookupKey] || "No answer";

      const isAnswerSkipped = studentAnswer === "No answer" || normalizeText(studentAnswer) === 'no answer';
      const isCorrect = !isAnswerSkipped && (normalizeText(studentAnswer) === normalizeText(q.answer || q.correctAnswer));

      return {
        id: q.id || q._id,
        question: q.question,
        options: q.options,
        correct: q.answer || q.correctAnswer,
        selected: studentAnswer,
        isCorrect: isCorrect, // Exposed to keep frontend components performant
        explanation: q.explanation || "",
        questionImage: q.questionImage || null
      };
    });

    res.json({
      sessionId: result._id,
      examTitle: result.examSetTitle || "",
      questions
    });
  } catch (e) {
    console.error("Error in review endpoint:", e);
    res.status(500).json({ message: "Could not load review", error: e.message });
  }
});

router.post("/practice", authenticate, async (req, res) => {
  try {
    const { answers, score, timeTaken, questions, subject, year, courseCode } = req.body;
    
    // Modernized instantiation using standard "new" keyword syntax
    const result = new Result({
      user: new mongoose.Types.ObjectId(req.user.id),
      answers,
      score,
      timeTaken,
      questions,
      subject,
      year,
      courseCode,
      type: "practice",
      examSetTitle: `${subject || ''} ${courseCode || ''} ${year || ''}`.trim(),
      submittedAt: new Date()
    });
    
    await result.save();
    res.status(201).json({ message: "Practice result saved", result });
  } catch (e) {
    console.error("Error saving practice session:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

export default router;
