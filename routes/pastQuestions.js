import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

import Question from '../models/Question.js';
import UserAnswer from '../models/UserAnswer.js';

// ========== Multer Setup for Image Upload ==========
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/questions/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files allowed!'), false);
    }
    cb(null, true);
  }
});

// Initialize router
const router = express.Router();

// ========== ENDPOINTS ==========

// GET /api/past-questions - Students: Fetch questions with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { subject, year, count, difficulty } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (year) filter.year = year;
    if (difficulty) filter.difficulty = difficulty;

    let query = Question.find(filter);
    if (count) query = query.limit(Number(count));
    const questions = await query.sort({ createdAt: -1 }).lean();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching past questions', detail: err.message });
  }
});

// POST /api/past-questions/submit - Students: Submit answers for scoring/feedback
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { answers, questionIds, timeSpent } = req.body;
    let score = 0;
    let correctChoices = {};
    let wrongChoices = {};
    let feedback = [];
    const questions = await Question.find({ _id: { $in: questionIds } }).lean();

    // Map for faster lookup
    const questionMap = {};
    questions.forEach(q => { questionMap[q._id] = q; });

    answers.forEach(ans => {
      const q = questionMap[ans.questionId];
      if (!q) return;
      if (ans.answer === q.correctAnswer) {
        score++;
        correctChoices[ans.questionId] = ans.answer;
      } else {
        wrongChoices[ans.questionId] = ans.answer;
        feedback.push(`Question ${q.text}: Correct answer is ${q.correctAnswer}. You answered: ${ans.answer || "No answer"}`);
      }
    });

    // Return all needed data for frontend and stats
    res.json({
      score,
      total: answers.length,
      correctChoices,
      wrongChoices,
      feedback
    });
  } catch (err) {
    res.status(500).json({ error: 'Error submitting answers', detail: err.message });
  }
});

// POST /api/past-questions/save-answers - Students: Save answers/stats/cumulative history
router.post('/save-answers', authenticate, async (req, res) => {
  try {
    const { userId, username, answers, correctChoices, wrongChoices, totalCorrect, totalWrong, timeSpent } = req.body;

    const ua = new UserAnswer({
      userId,
      username,
      answers,
      correctChoices,
      wrongChoices,
      totalCorrect,
      totalWrong,
      timeSpent,
      submittedAt: new Date()
    });

    await ua.save();
    res.json({ message: "Answer session saved successfully." });
  } catch (err) {
    res.status(500).json({ error: 'Error saving user answers', detail: err.message });
  }
});

// ================= ADMIN ENDPOINTS =================

// POST /api/past-questions - Admin: Create a new past question (with optional image)
router.post(
  '/',
  [authenticate, authorizeRole('admin', 'pq-uploader'), upload.single('image')],
  async (req, res) => {
    try {
      const {
        subject,
        year,
        difficulty,
        text,
        options, // Array of choices
        correctAnswer,
        explanation,
        topic,
        tags
      } = req.body;

      // Parse options if sent as JSON string
      let optionsArr = Array.isArray(options) ? options : [];
      if (typeof options === 'string') {
        try {
          optionsArr = JSON.parse(options);
        } catch {
          optionsArr = options.split(',').map(o => o.trim());
        }
      }

      // Parse tags if sent as JSON string
      let tagsArr = Array.isArray(tags) ? tags : [];
      if (typeof tags === 'string') {
        try {
          tagsArr = JSON.parse(tags);
        } catch {
          tagsArr = tags.split(',').map(t => t.trim());
        }
      }

      // Validate required fields
      if (!subject || !year || !difficulty || !text || !optionsArr || !correctAnswer) {
        return res.status(400).json({ error: "Missing required fields." });
      }
      if (!Array.isArray(optionsArr) || optionsArr.length < 2) {
        return res.status(400).json({ error: "Options must be an array with at least 2 choices." });
      }
      if (!optionsArr.includes(correctAnswer)) {
        return res.status(400).json({ error: "Correct answer must be in options." });
      }

      // Handle image upload
      let imageUrl = "";
      if (req.file) {
        imageUrl = '/uploads/questions/' + req.file.filename;
      }

      const newQuestion = new Question({
        subject,
        year,
        difficulty,
        text,
        image: imageUrl, // Save image path
        options: optionsArr,
        correctAnswer,
        explanation: explanation || "",
        topic: topic || "",
        tags: tagsArr
      });

      await newQuestion.save();
      res.status(201).json({ message: "Question created.", question: newQuestion });
    } catch (err) {
      res.status(500).json({ error: 'Error creating question', detail: err.message });
    }
  }
);

// PUT /api/past-questions/:id - Admin: Update a past question (with optional image update)
router.put(
  '/:id',
  [authenticate, authorizeRole('admin', 'pq-uploader'), upload.single('image')],
  async (req, res) => {
    try {
      const updateFields = { ...req.body };

      // If image is uploaded, update image field
      if (req.file) {
        updateFields.image = '/uploads/questions/' + req.file.filename;
      }

      // Parse options/tags if needed
      if (updateFields.options && typeof updateFields.options === 'string') {
        try {
          updateFields.options = JSON.parse(updateFields.options);
        } catch {
          updateFields.options = updateFields.options.split(',').map(o => o.trim());
        }
      }
      if (updateFields.tags && typeof updateFields.tags === 'string') {
        try {
          updateFields.tags = JSON.parse(updateFields.tags);
        } catch {
          updateFields.tags = updateFields.tags.split(',').map(t => t.trim());
        }
      }

      const question = await Question.findByIdAndUpdate(req.params.id, updateFields, { new: true });
      if (!question) return res.status(404).json({ error: "Question not found." });
      res.json({ message: "Question updated.", question });
    } catch (err) {
      res.status(500).json({ error: 'Error updating question', detail: err.message });
    }
  }
);

// DELETE /api/past-questions/:id - Admin: Delete a past question
router.delete('/:id', [authenticate, authorizeRole('admin', 'pq-uploader')], async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ error: "Question not found." });
    res.json({ message: "Question deleted." });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting question', detail: err.message });
  }
});

// GET /api/past-questions/admin/all - Admin: List all questions (with filters)
router.get('/admin/all', [authenticate, authorizeRole('admin')], async (req, res) => {
  try {
    const { subject, year, difficulty, topic, tag } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (year) filter.year = year;
    if (difficulty) filter.difficulty = difficulty;
    if (topic) filter.topic = topic;
    if (tag) filter.tags = tag;

    const questions = await Question.find(filter).sort({ createdAt: -1 }).lean();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching admin questions', detail: err.message });
  }
});

// GET /api/past-questions/:id - Admin: Get a single question
router.get('/:id', [authenticate, authorizeRole('admin', 'pq-uploader')], async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: "Question not found." });
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching question', detail: err.message });
  }
});

export default router;
