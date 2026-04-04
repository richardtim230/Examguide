import express from "express";
import TheoryQuestion from "../models/TheoryQuestion.js";
import ExamSet from "../models/ExamSet.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

/**
 * CREATE a theory question
 * POST /api/theory-questions
 */
router.post("/", async (req, res) => {
  try {
    const { examSet, questionNumber, question, maxMarks, expectedLength, rubric, sampleAnswer } = req.body;

    if (!examSet || !question || questionNumber === undefined) {
      return res.status(400).json({ error: "examSet, questionNumber, and question required" });
    }

    const examSetExists = await ExamSet.findById(examSet);
    if (!examSetExists) return res.status(400).json({ error: "Invalid examSet" });

    // Check if question number already exists for this exam set
    const existing = await TheoryQuestion.findOne({ examSet, questionNumber });
    if (existing) {
      return res.status(409).json({ error: `Question ${questionNumber} already exists for this exam set` });
    }

    const q = await TheoryQuestion.create({
      examSet,
      questionNumber,
      question,
      maxMarks: maxMarks || 10,
      expectedLength,
      rubric: rubric || { scoreBuckets: [] },
      sampleAnswer
    });

    res.status(201).json(q);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET all theory questions for an exam set (sorted by question number)
 * GET /api/theory-questions?examSet=<id>
 */
router.get("/", async (req, res) => {
  try {
    const { examSet } = req.query;
    if (!examSet) return res.status(400).json({ error: "examSet required" });

    const questions = await TheoryQuestion.find({ examSet }).sort({ questionNumber: 1 });
    res.json(questions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET single theory question
 */
router.get("/:id", async (req, res) => {
  try {
    const q = await TheoryQuestion.findById(req.params.id);
    if (!q) return res.status(404).json({ error: "Not found" });
    res.json(q);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * UPDATE theory question
 */
router.put("/:id", authenticate, authorizeRole("admin", "tutor"), async (req, res) => {
  try {
    const q = await TheoryQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!q) return res.status(404).json({ error: "Not found" });
    res.json(q);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * DELETE theory question
 */
router.delete("/:id", authenticate, authorizeRole("admin", "tutor"), async (req, res) => {
  try {
    const q = await TheoryQuestion.findByIdAndDelete(req.params.id);
    if (!q) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
