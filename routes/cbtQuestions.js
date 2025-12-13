import express from "express";
import CbtQuestion from "../models/CbtQuestion.js";
import ExamSet from "../models/ExamSet.js";

const router = express.Router();

/**
 * Create Question
 * POST /api/cbt-questions
 * Body: { examSet, question, options, answer, explanation, image }
 */
router.post("/", async (req, res) => {
  try {
    const { examSet, question, options, answer, explanation, image } = req.body;
    if (!examSet || !question || !options || !answer) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!(await ExamSet.findById(examSet))) {
      return res.status(400).json({ error: "Invalid examSet ID" });
    }
    const q = await CbtQuestion.create({ examSet, question, options, answer, explanation, image });
    res.status(201).json(q);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * List Questions for an ExamSet
 * GET /api/cbt-questions?examSet=<id>
 */
router.get("/", async (req, res) => {
  try {
    const { examSet, limit = 50 } = req.query;
    if (!examSet) return res.status(400).json({ error: "examSet param required" });
    const questions = await CbtQuestion.find({ examSet }).limit(Number(limit));
    res.json(questions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * CRUD single question (GET, PUT, DELETE)
 */
router.get("/:id", async (req, res) => {
  try {
    const q = await CbtQuestion.findById(req.params.id);
    if (!q) return res.status(404).json({ error: "Not found" });
    res.json(q);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router.put("/:id", async (req, res) => {
  try {
    const q = await CbtQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!q) return res.status(404).json({ error: "Not found" });
    res.json(q);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const q = await CbtQuestion.findByIdAndDelete(req.params.id);
    if (!q) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted", id: q._id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
