import express from "express";
import TheoryAttempt from "../models/TheoryAttempt.js";
import TheoryAnswer from "../models/TheoryAnswer.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

/**
 * GET student's attempt(s) for an exam set
 * GET /api/theory-attempts?examSet=<id>
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const { examSet } = req.query;
    if (!examSet) return res.status(400).json({ error: "examSet required" });

    const attempts = await TheoryAttempt.find({
      examSet,
      student: req.user.id
    }).populate({
      path: "answers.question",
      select: "questionNumber question maxMarks"
    }).populate({
      path: "answers.answer",
      select: "autoScore finalScore isGraded"
    });

    res.json(attempts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET single attempt (detailed view)
 * GET /api/theory-attempts/:attemptId
 */
router.get("/:attemptId", authenticate, async (req, res) => {
  try {
    const attempt = await TheoryAttempt.findById(req.params.attemptId)
      .populate({
        path: "answers.question",
        select: "questionNumber question maxMarks expectedLength"
      })
      .populate({
        path: "answers.answer",
        select: "answerType answerText autoScore finalScore isGraded matchedKeywords"
      });

    if (!attempt) return res.status(404).json({ error: "Not found" });

    // Authorization
    if (attempt.student.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(attempt);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET all attempts for an exam set (admin/tutor grading)
 * GET /api/theory-attempts/admin/all?examSet=<id>
 */
router.get("/admin/all", authenticate, authorizeRole("admin", "tutor"), async (req, res) => {
  try {
    const { examSet } = req.query;
    if (!examSet) return res.status(400).json({ error: "examSet required" });

    const attempts = await TheoryAttempt.find({ examSet })
      .populate("student", "username fullname email studentId")
      .sort({ submittedAt: -1 });

    res.json(attempts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * FINALIZE/SUBMIT attempt (once all questions answered)
 * PUT /api/theory-attempts/:attemptId/submit
 */
router.put("/:attemptId/submit", authenticate, async (req, res) => {
  try {
    const attempt = await TheoryAttempt.findById(req.params.attemptId);
    if (!attempt) return res.status(404).json({ error: "Not found" });

    if (attempt.student.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    attempt.status = "submitted";
    attempt.submittedAt = new Date();
    await attempt.save();

    res.json({ message: "Attempt submitted for grading", attempt });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
