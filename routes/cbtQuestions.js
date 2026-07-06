// ============ routes/cbtQuestions.js ============

import express from "express";
import CbtQuestion from "../models/CbtQuestion.js";
import ExamSet from "../models/ExamSet.js";
import { sendNotificationToAllUsers } from "../services/notificationService.js";

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
    const examSetDoc = await ExamSet.findById(examSet);
    if (!examSetDoc) {
      return res.status(400).json({ error: "Invalid examSet ID" });
    }

    const q = await CbtQuestion.create({ examSet, question, options, answer, explanation, image });
    res.status(201).json(q);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Bulk Upload Questions
 * POST /api/cbt-questions/bulk
 * Body: { examSet, questions: [...] }
 */
router.post("/bulk", async (req, res) => {
  try {
    const { examSet, questions } = req.body;
    if (!examSet || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "Invalid examSet or questions array" });
    }

    const examSetDoc = await ExamSet.findById(examSet);
    if (!examSetDoc) {
      return res.status(400).json({ error: "Invalid examSet ID" });
    }

    // Add examSet to each question
    const questionsToInsert = questions.map(q => ({
      ...q,
      examSet
    }));

    const createdQuestions = await CbtQuestion.insertMany(questionsToInsert);

    // ============ SEND PUSH NOTIFICATION ============
    try {
      const notificationPayload = {
        title: `📝 Questions Added: ${examSetDoc.subject}`,
        message: `${createdQuestions.length} new questions ready to practice!`,
        image: "https://oau.examguard.com.ng/logo.png",
        icon: "https://oau.examguard.com.ng/logo.png",
        url: `https://oau.examguard.com.ng/tutor/mock.html?accessCode=${examSetDoc.accessCode}`,
        type: "exam",
        examCode: examSetDoc.accessCode
      };

      await sendNotificationToAllUsers(notificationPayload);
      console.log("✓ Notification sent for bulk upload:", createdQuestions.length, "questions");
    } catch (notifErr) {
      console.error("⚠ Notification failed (non-blocking):", notifErr.message);
    }

    res.status(201).json({
      message: `✓ ${createdQuestions.length} questions added`,
      count: createdQuestions.length,
      questions: createdQuestions
    });
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
    const { examSet, limit = 150 } = req.query;
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
