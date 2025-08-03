import express from "express";
import mongoose from "mongoose";
import QuestionSet from "../models/QuestionSet.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

// If you add a PracticeSession model, import it here
// import PracticeSession from "../models/PracticeSession.js";

const router = express.Router();

// ===================== CRUD & ADMIN ========================

// Create new set (topic)
router.post("/", authenticate, authorizeRole("admin", "uploader", "superadmin"), async (req, res) => {
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
router.post("/bulk", authenticate, authorizeRole("admin", "uploader", "superadmin"), async (req, res) => {
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
router.post("/:id/questions", authenticate, authorizeRole("admin", "uploader", "superadmin"), async (req, res) => {
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
router.put("/:id/questions/:qid", authenticate, authorizeRole("admin", "uploader", "superadmin"), async (req, res) => {
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

// General update for set (PUT or PATCH /:id)
router.put("/:id", authenticate, authorizeRole("admin", "uploader", "superadmin"), async (req, res) => {
  const { title, faculty, department, status } = req.body;
  try {
    const set = await QuestionSet.findById(req.params.id);
    if (!set) return res.status(404).json({ error: "Set not found" });
    if (title !== undefined) set.title = title;
    if (faculty !== undefined) set.faculty = faculty;
    if (department !== undefined) set.department = department;
    if (status !== undefined) set.status = status;
    await set.save();
    res.json(set);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Delete a whole question set
router.delete("/:id", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  await QuestionSet.findByIdAndDelete(req.params.id);
  res.json({ message: "Question set deleted" });
});

// ===================== PRACTICE FEATURE ========================

// Get all available topics (as QuestionSets), filterable by faculty/department
router.get("/topics", authenticate, async (req, res) => {
  const filter = {};
  if (req.query.faculty) filter.faculty = req.query.faculty;
  if (req.query.department) filter.department = req.query.department;
  // If you add level to QuestionSet, filter.level = req.query.level;
  try {
    const sets = await QuestionSet.find(filter).sort({ title: 1 });
    res.json(
      sets.map(set => ({
        _id: set._id,
        name: set.title,
        faculty: set.faculty,
        department: set.department,
      }))
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Start a practice session (random/topic)
router.post("/practice", authenticate, async (req, res) => {
  const { numQuestions = 20, mode = "random", time = 30, topics = [] } = req.body;

  try {
    let questionSets = [];

    if (mode === "topic" && Array.isArray(topics) && topics.length > 0) {
      // Find sets by IDs in 'topics'
      questionSets = await QuestionSet.find({ _id: { $in: topics.map(id => new mongoose.Types.ObjectId(id)) } });
    } else {
      // Random mode: get all sets for the student's faculty/department (optional: restrict here)
      const filter = {};
      // If you want to restrict to student's faculty/department, uncomment:
       //if (req.user.faculty) filter.faculty = req.user.faculty;
      //if (req.user.department) filter.department = req.user.department;
      questionSets = await QuestionSet.find(filter);
    }

    // Gather all questions from selected sets
    let allQuestions = questionSets.flatMap(set =>
      set.questions.map(q => ({
        ...q.toObject ? q.toObject() : q,
        topic: set.title,
        setId: set._id
      }))
    );
    if (allQuestions.length === 0) {
      return res.status(404).json({ error: "No questions found for the selected topics." });
    }

    // Shuffle and pick numQuestions
    allQuestions = allQuestions.sort(() => Math.random() - 0.5).slice(0, Number(numQuestions));

    // Optionally: Create a session in DB (for review/history)
     const session = await PracticeSession.create({
     user: req.user.id,
      questions: allQuestions,
     topics: mode === "topic" ? topics : [],
     numQuestions,
    time,
    mode
   });

    res.json({
      questions: allQuestions,
      time,
       sessionId: session?._id || null
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
