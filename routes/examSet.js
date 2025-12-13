import express from "express";
import ExamSet from "../models/ExamSet.js";
import CbtQuestion from "../models/CbtQuestion.js";

const router = express.Router();

/**
 * Create an ExamSet
 * POST /api/exam-set
 * Body: {subject, title, accessCode, duration}
 */
router.post("/", async (req, res) => {
  try {
    const { subject, title, accessCode, duration } = req.body;
    if (!subject || !title || !accessCode) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    // Ensure unique access code
    if (await ExamSet.findOne({ accessCode })) {
      return res.status(409).json({ error: "Access code already exists" });
    }
    const set = await ExamSet.create({
      subject,
      title,
      accessCode,
      duration: duration || 3600,
      createdBy: req.user?.id
    });
    res.status(201).json(set);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * List ExamSets (optionally filter by subject)
 * GET /api/exam-set?subject=MTH101
 */
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.subject) filter.subject = req.query.subject;
    const sets = await ExamSet.find(filter).sort({ createdAt: -1 });
    res.json(sets);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Get or auto-create a specific ExamSet and its questions by access code
 * GET /api/exam-set/by-access?accessCode=xxxx[&subject=...&title=...&duration=...]
 */
router.get("/by-access", async (req, res) => {
  try {
    const { accessCode, subject, title, duration } = req.query;

    if (!accessCode) return res.status(400).json({ error: "accessCode required" });

    // Try to find an existing ExamSet
    let examSet = await ExamSet.findOne({ accessCode });

    // If not found, auto-create using provided info (subject required for create)
    if (!examSet) {
      if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
        return res.status(400).json({ error: "Exam set not found and subject parameter required to create new set." });
      }
      examSet = await ExamSet.create({
        subject: subject.trim(),
        title: (title && typeof title === "string" && title.trim().length > 0) ? title.trim() : `${subject.trim()} Exam`,
        accessCode: accessCode.trim(),
        duration: duration ? Number(duration) : 3600
      });
    }

    // Always get latest questions for this set
    const questions = await CbtQuestion.find({ examSet: examSet._id });
    res.json({ examSet, questions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Update ExamSet
 * PUT /api/exam-set/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const set = await ExamSet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!set) return res.status(404).json({ error: "Not found" });
    res.json(set);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Delete ExamSet (& cascade-delete questions)
 * DELETE /api/exam-set/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    await CbtQuestion.deleteMany({ examSet: req.params.id });
    const set = await ExamSet.findByIdAndDelete(req.params.id);
    if (!set) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted", id: set._id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
