import express from "express";
const router = express.Router();
import LectureNote from "../models/LectureNote.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";
import User from "../models/User.js";
// GET all notes (optionally filter by author or course)
router.get("/", authenticate, async (req, res) => {
  try {
    const { course, author } = req.query;
    let query = {};
    if (course) query.course = course;
    if (author) query.author = author;
    const notes = await LectureNote.find(query).sort({ updatedAt: -1 }).populate('author', 'username fullname');
    res.json(notes);
  } catch (e) {
    res.status(500).json({ error: "Could not fetch notes" });
  }
});

// GET single note by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const note = await LectureNote.findById(req.params.id).populate('author', 'username fullname');
    if (!note) return res.status(404).json({ error: "Note not found" });
    res.json(note);
  } catch (e) {
    res.status(500).json({ error: "Could not fetch note" });
  }
});

// CREATE a new note
router.post("/", authenticate, authorizeRole("tutor", "admin", "superadmin"), async (req, res) => {
  try {
    const { title, course, content } = req.body;
    if (!title || !course || !content) return res.status(400).json({ error: "Missing fields" });
    const note = await LectureNote.create({
      title,
      course,
      author: req.user.id,
      content
    });
    res.status(201).json(note);
  } catch (e) {
    res.status(500).json({ error: "Could not create note" });
  }
});

// EDIT note
router.put("/:id", authenticate, authorizeRole("tutor", "admin", "superadmin"), async (req, res) => {
  try {
    const note = await LectureNote.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    if (String(note.author) !== String(req.user.id)) return res.status(403).json({ error: "Not allowed" });
    note.title = req.body.title || note.title;
    note.course = req.body.course || note.course;
    note.content = req.body.content || note.content;
    await note.save();
    res.json(note);
  } catch (e) {
    res.status(500).json({ error: "Could not update note" });
  }
});

// DELETE note
router.delete("/:id", authenticate, authorizeRole("tutor", "admin", "superadmin"), async (req, res) => {
  try {
    const note = await LectureNote.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    if (String(note.author) !== String(req.user.id)) return res.status(403).json({ error: "Not allowed" });
    await note.delete();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Could not delete note" });
  }
});

export default router;
