import express from "express";
import QuestionSet from "../models/QuestionSet.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

// Create new set
router.post("/", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const { title, status, faculty, department, questions } = req.body;
  try {
    const qset = await QuestionSet.create({ title, status, faculty, department, questions, createdBy: req.user.id });
    res.status(201).json(qset);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get all sets (optionally filter by faculty/department/title)
router.get("/", authenticate, async (req, res) => {
  const filter = {};
  if (req.query.faculty) filter.faculty = req.query.faculty;
  if (req.query.department) filter.department = req.query.department;
  if (req.query.title) filter.title = req.query.title;
  const sets = await QuestionSet.find(filter).sort({ createdAt: -1 });
  res.json(sets);
});

// Get set by ID
router.get("/:id", authenticate, async (req, res) => {
  const set = await QuestionSet.findById(req.params.id);
  if (!set) return res.status(404).json({ error: "Set not found" });
  res.json(set);
});

// Bulk upload: Add questions to set with given title (merges questions, does not create duplicates or replace)
router.post("/bulk", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const { title, status, faculty, department, questions } = req.body;
  if (!title || !questions) {
    return res.status(400).json({ error: "title and questions are required" });
  }
  try {
    // Find set by title
    let set = await QuestionSet.findOne({ title });
    if (!set) {
      // Create if not exists
      set = await QuestionSet.create({ title, status, faculty, department, questions, createdBy: req.user.id });
      return res.status(201).json({ message: "Created new set", set });
    }
    // Merge: Only add questions that don't have duplicate ids
    const existingIds = new Set(set.questions.map(q => q.id));
    const newQuestions = questions.filter(q => !existingIds.has(q.id));
    set.questions.push(...newQuestions);
    // Optionally update status/faculty/department if provided
    if (status) set.status = status;
    if (faculty) set.faculty = faculty;
    if (department) set.department = department;
    await set.save();
    res.json({ message: `Added ${newQuestions.length} new questions to existing set`, set });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Add questions in bulk to an existing set by id
router.post("/:id/questions", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const { id } = req.params;
  const questions = req.body.questions;
  try {
    const set = await QuestionSet.findById(id);
    if (!set) return res.status(404).json({ error: "Set not found" });
    // Only add questions that don't have duplicate ids
    const existingIds = new Set(set.questions.map(q => q.id));
    const newQuestions = questions.filter(q => !existingIds.has(q.id));
    set.questions.push(...newQuestions);
    await set.save();
    res.json(set);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update a single question in a set
router.put("/:id/questions/:qid", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const { id, qid } = req.params;
  try {
    const set = await QuestionSet.findById(id);
    if (!set) return res.status(404).json({ error: "Set not found" });
    const idx = set.questions.findIndex(q => q.id == qid);
    if (idx === -1) return res.status(404).json({ error: "Question not found" });
    set.questions[idx] = { ...set.questions[idx]._doc, ...req.body };
    await set.save();
    res.json(set.questions[idx]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete a question from a set
router.delete("/:id/questions/:qid", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const { id, qid } = req.params;
  try {
    const set = await QuestionSet.findById(id);
    if (!set) return res.status(404).json({ error: "Set not found" });
    set.questions = set.questions.filter(q => q.id != qid);
    await set.save();
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update set status
router.patch("/:id/status", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const set = await QuestionSet.findById(req.params.id);
  if (!set) return res.status(404).json({ error: "Set not found" });
  set.status = req.body.status;
  await set.save();
  res.json(set);
});

// Delete a whole question set
router.delete("/:id", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  await QuestionSet.findByIdAndDelete(req.params.id);
  res.json({ message: "Question set deleted" });
});

export default router;
