// routes/examReports.js

import express from "express";
import ExamReport from "../models/ExamReport.js";
import ExamSet from "../models/ExamSet.js";
import { authenticateToken } from "../middleware/authenticate.js";

const router = express.Router();

/**
 * Save Exam Report
 * POST /api/exam-reports
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      examSetId,
      attemptId,
      subject,
      title,
      examType,
      totalQuestions,
      attemptedQuestions,
      correctAnswers,
      wrongAnswers,
      skippedQuestions,
      score,
      percentage,
      totalDuration,
      timeSpent,
      startTime,
      endTime,
      answers,
      theoryAnswers
    } = req.body;

    if (!examSetId || !attemptId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const report = await ExamReport.create({
      userId: req.user.id,
      examSetId,
      attemptId,
      subject,
      title,
      examType,
      totalQuestions,
      attemptedQuestions,
      correctAnswers,
      wrongAnswers,
      skippedQuestions,
      score,
      percentage,
      totalDuration,
      timeSpent,
      startTime,
      endTime,
      answers: answers || [],
      theoryAnswers: theoryAnswers || [],
      status: "submitted"
    });

    // Update lightweight attempt summary on the ExamSet
    try {
      const examSet = await ExamSet.findById(report.examSetId);

      if (examSet) {
        const now = new Date();
        const timeNum = Number(timeSpent) || 0;

        // Initialize attemptSummary if missing
        if (!examSet.attemptSummary) {
          examSet.attemptSummary = {
            attempts: 0,
            scoredAttempts: 0,
            totalScore: 0,
            averageScore: 0,
            bestScore: 0,
            worstScore: 0,
            totalTimeSpent: 0,
            lastAttemptAt: null
          };
        }

        // Always increment total attempts and totalTimeSpent
        examSet.attemptSummary.attempts = (examSet.attemptSummary.attempts || 0) + 1;
        examSet.attemptSummary.totalTimeSpent = (examSet.attemptSummary.totalTimeSpent || 0) + timeNum;
        examSet.attemptSummary.lastAttemptAt = now;

        // If percentage is a numeric value, update scored aggregates
        const scoreProvided = typeof percentage === "number" && !Number.isNaN(percentage);

        if (scoreProvided) {
          const pct = Number(percentage);

          examSet.attemptSummary.scoredAttempts = (examSet.attemptSummary.scoredAttempts || 0) + 1;
          examSet.attemptSummary.totalScore = (examSet.attemptSummary.totalScore || 0) + pct;

          // recompute averageScore
          const sa = examSet.attemptSummary.scoredAttempts;
          examSet.attemptSummary.averageScore = sa > 0
            ? Number((examSet.attemptSummary.totalScore / sa).toFixed(2))
            : 0;

          // best/worst
          if (examSet.attemptSummary.bestScore == null || pct > examSet.attemptSummary.bestScore) {
            examSet.attemptSummary.bestScore = pct;
          }
          if (examSet.attemptSummary.worstScore == null || sa === 1 || pct < examSet.attemptSummary.worstScore) {
            // if this is the first scored attempt, set worstScore to pct
            examSet.attemptSummary.worstScore = pct;
          }
        }

        // Save updated examSet summary
        await examSet.save();
      }
    } catch (summaryErr) {
      // Log but do not break the main response
      console.error("Could not update ExamSet attempt summary:", summaryErr);
    }

    res.status(201).json({
      message: "Report saved successfully",
      report
    });
  } catch (e) {
    console.error("Error saving report:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * Get All Reports for Current User
 * GET /api/exam-reports
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, examSetId } = req.query;

    const filter = { userId: req.user.id };
    if (examSetId) filter.examSetId = examSetId;

    const skip = (page - 1) * limit;

    const reports = await ExamReport.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("examSetId", "subject title accessCode");

    const total = await ExamReport.countDocuments(filter);

    res.json({
      reports,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    console.error("Error fetching reports:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * Get Single Report
 * GET /api/exam-reports/:id
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const report = await ExamReport.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate("examSetId", "subject title");

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(report);
  } catch (e) {
    console.error("Error fetching report:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * Get Report by Attempt ID
 * GET /api/exam-reports/attempt/:attemptId
 */
router.get("/attempt/:attemptId", authenticateToken, async (req, res) => {
  try {
    const report = await ExamReport.findOne({
      attemptId: req.params.attemptId,
      userId: req.user.id
    }).populate("examSetId", "subject title");

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(report);
  } catch (e) {
    console.error("Error fetching report:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * Get User Statistics
 * GET /api/exam-reports/stats/summary
 */
router.get("/stats/summary", authenticateToken, async (req, res) => {
  try {
    const reports = await ExamReport.find({ userId: req.user.id });

    const stats = {
      totalAttempts: reports.length,
      averageScore: reports.length > 0
        ? (reports.reduce((sum, r) => sum + (r.percentage || 0), 0) / reports.length).toFixed(2)
        : 0,
      totalTimeSpent: reports.reduce((sum, r) => sum + (r.timeSpent || 0), 0),
      bestScore: reports.length > 0
        ? Math.max(...reports.map(r => r.percentage || 0))
        : 0,
      worstScore: reports.length > 0
        ? Math.min(...reports.map(r => r.percentage || 0))
        : 0,
      examsAttempted: new Set(reports.map(r => r.examSetId.toString())).size
    };

    res.json(stats);
  } catch (e) {
    console.error("Error fetching stats:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * DELETE Report
 * DELETE /api/exam-reports/:id
 */
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const report = await ExamReport.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ message: "Report deleted successfully" });
  } catch (e) {
    console.error("Error deleting report:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
