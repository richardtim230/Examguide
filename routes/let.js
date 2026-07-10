import express from "express";
const router = express.Router();
import { authenticate, authorizeRole } from "../middleware/authenticate.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import multer from "multer";
import cloudinary from "cloudinary";
import Questions from "../models/Questions.js";
import QuestionSet from "../models/QuestionSet.js"; 
import Result from "../models/Result.js";
import streamifier from "streamifier";
import AssignmentSubmission from "../models/AssignmentSubmission.js";

// ============================================
// LECTURER DASHBOARD API ROUTES
// ============================================

// Middleware to ensure user is a lecturer
const isLecturer = (req, res, next) => {
  if (req.user.role !== "lecturer" && req.user.role !== "tutor" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Lecturer role required." });
  }
  next();
};

const memStorage = multer.memoryStorage();
const uploadToMemory = multer({ storage: memStorage });

// ============================================
// 1. DASHBOARD STATS
// ============================================
// ============================================
// ASSIGNMENT SUBMISSIONS GRADING ENDPOINTS
// ============================================

/**
 * GET /api/lecturer/assignments/:assignmentId
 * Fetch assignment details
 */
router.get("/assignments/:assignmentId", authenticate, isLecturer, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const lecturerId = req.user.id;

    const assignment = await Questions.findById(assignmentId)
      .select("title question course createdAt");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Verify lecturer owns this assignment
    const lecturer = await User.findOne({
      _id: lecturerId,
      "courses._id": assignment.course
    });

    if (!lecturer) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get course code
    const course = lecturer.courses.find(c => c._id.toString() === assignment.course.toString());

    res.json({
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        question: assignment.question,
        courseCode: course?.code || "Course",
        createdAt: assignment.createdAt
      }
    });

  } catch (error) {
    console.error("Fetch assignment error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * GET /api/lecturer/assignments/:assignmentId/submissions
 * Fetch all submissions for an assignment with student details
 */
router.get("/assignments/:assignmentId/submissions", authenticate, isLecturer, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const lecturerId = req.user.id;

    // Verify assignment exists and belongs to lecturer
    const assignment = await Questions.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const lecturer = await User.findOne({
      _id: lecturerId,
      "courses._id": assignment.course
    });

    if (!lecturer) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Fetch all submissions for this assignment
    const submissions = await AssignmentSubmission.find({
      assignment: assignmentId,
      lecturer: lecturerId
    })
      .populate({
        path: "student",
        select: "fullname studentId email"
      })
      .sort({ submittedAt: -1 });

    // Format response
    const formattedSubmissions = submissions.map(sub => ({
      _id: sub._id,
      student: {
        _id: sub.student._id,
        fullname: sub.student.fullname,
        studentId: sub.student.studentId,
        email: sub.student.email
      },
      textSubmission: sub.textSubmission,
      submissionType: sub.submissionType,
      attachments: sub.attachments,
      submittedAt: sub.submittedAt,
      status: sub.status,
      score: sub.score,
      feedback: sub.feedback,
      privateNotes: sub.privateNotes,
      gradedBy: sub.gradedBy,
      gradedAt: sub.gradedAt,
      isLate: sub.isLate,
      attempt: sub.attempt
    }));

    res.json({
      message: "Submissions fetched successfully",
      submissions: formattedSubmissions,
      total: formattedSubmissions.length,
      graded: formattedSubmissions.filter(s => s.status === 'graded').length,
      pending: formattedSubmissions.filter(s => s.status === 'submitted').length
    });

  } catch (error) {
    console.error("Fetch submissions error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * POST /api/lecturer/submissions/:submissionId/grade
 * Submit grade and feedback for a submission
 */
router.post("/submissions/:submissionId/grade", authenticate, isLecturer, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const lecturerId = req.user.id;
    const { score, feedback, privateNotes } = req.body;

    // Validate input
    if (score === undefined || score === null) {
      return res.status(400).json({ message: "Score is required" });
    }

    if (typeof score !== 'number' || score < 0 || score > 100) {
      return res.status(400).json({ message: "Score must be a number between 0 and 100" });
    }

    if (!feedback || feedback.trim() === '') {
      return res.status(400).json({ message: "Feedback is required" });
    }

    // Find submission
    const submission = await AssignmentSubmission.findById(submissionId);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Verify lecturer owns this submission
    if (submission.lecturer.toString() !== lecturerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update submission with grade
    submission.score = score;
    submission.feedback = feedback;
    submission.privateNotes = privateNotes || '';
    submission.status = 'graded';
    submission.gradedBy = lecturerId;
    submission.gradedAt = new Date();

    await submission.save();

    res.json({
      message: "Submission graded successfully",
      submission: {
        _id: submission._id,
        score: submission.score,
        feedback: submission.feedback,
        status: submission.status,
        gradedAt: submission.gradedAt
      }
    });

  } catch (error) {
    console.error("Grade submission error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * GET /api/lecturer/submissions/:submissionId
 * Fetch a single submission with all details
 */
router.get("/submissions/:submissionId", authenticate, isLecturer, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const lecturerId = req.user.id;

    const submission = await AssignmentSubmission.findById(submissionId)
      .populate({
        path: "student",
        select: "fullname studentId email"
      })
      .populate({
        path: "gradedBy",
        select: "fullname"
      });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (submission.lecturer.toString() !== lecturerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({
      submission: {
        _id: submission._id,
        student: {
          _id: submission.student._id,
          fullname: submission.student.fullname,
          studentId: submission.student.studentId,
          email: submission.student.email
        },
        textSubmission: submission.textSubmission,
        submissionType: submission.submissionType,
        attachments: submission.attachments,
        submittedAt: submission.submittedAt,
        status: submission.status,
        score: submission.score,
        feedback: submission.feedback,
        privateNotes: submission.privateNotes,
        gradedBy: submission.gradedBy?.fullname,
        gradedAt: submission.gradedAt,
        isLate: submission.isLate,
        attempt: submission.attempt
      }
    });

  } catch (error) {
    console.error("Fetch submission error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * PUT /api/lecturer/submissions/:submissionId
 * Update a submission (for re-grading or updates)
 */
router.put("/submissions/:submissionId", authenticate, isLecturer, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const lecturerId = req.user.id;
    const { score, feedback, privateNotes } = req.body;

    const submission = await AssignmentSubmission.findById(submissionId);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (submission.lecturer.toString() !== lecturerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update fields
    if (score !== undefined && score !== null) {
      if (typeof score !== 'number' || score < 0 || score > 100) {
        return res.status(400).json({ message: "Score must be between 0 and 100" });
      }
      submission.score = score;
    }

    if (feedback) {
      submission.feedback = feedback;
    }

    if (privateNotes !== undefined) {
      submission.privateNotes = privateNotes;
    }

    if (score !== undefined && submission.status !== 'graded') {
      submission.status = 'graded';
      submission.gradedBy = lecturerId;
      submission.gradedAt = new Date();
    }

    await submission.save();

    res.json({
      message: "Submission updated successfully",
      submission
    });

  } catch (error) {
    console.error("Update submission error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * GET /api/lecturer/assignments/:assignmentId/statistics
 * Get submission statistics for an assignment
 */
router.get("/assignments/:assignmentId/statistics", authenticate, isLecturer, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const lecturerId = req.user.id;

    const assignment = await Questions.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const lecturer = await User.findOne({
      _id: lecturerId,
      "courses._id": assignment.course
    });

    if (!lecturer) {
      return res.status(403).json({ message: "Access denied" });
    }

    const submissions = await AssignmentSubmission.find({
      assignment: assignmentId,
      lecturer: lecturerId
    });

    const gradedSubmissions = submissions.filter(s => s.status === 'graded');
    const scores = gradedSubmissions.map(s => s.score);

    const stats = {
      total: submissions.length,
      submitted: submissions.filter(s => s.status === 'submitted').length,
      graded: gradedSubmissions.length,
      pending: submissions.filter(s => s.status !== 'graded').length,
      averageScore: scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      passRate: scores.length > 0 ? ((scores.filter(s => s >= 40).length / scores.length) * 100).toFixed(2) : 0
    };

    res.json({
      message: "Statistics retrieved successfully",
      statistics: stats
    });

  } catch (error) {
    console.error("Fetch statistics error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * POST /api/lecturer/submissions/bulk-grade
 * Grade multiple submissions at once
 */
router.post("/submissions/bulk-grade", authenticate, isLecturer, async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { grades } = req.body; // Array of { submissionId, score, feedback }

    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({ message: "Grades array is required and must not be empty" });
    }

    const results = [];
    const errors = [];

    for (const gradeData of grades) {
      const { submissionId, score, feedback } = gradeData;

      try {
        if (!submissionId || score === undefined || !feedback) {
          errors.push({
            submissionId,
            error: "Missing required fields"
          });
          continue;
        }

        const submission = await AssignmentSubmission.findById(submissionId);

        if (!submission) {
          errors.push({
            submissionId,
            error: "Submission not found"
          });
          continue;
        }

        if (submission.lecturer.toString() !== lecturerId) {
          errors.push({
            submissionId,
            error: "Access denied"
          });
          continue;
        }

        submission.score = score;
        submission.feedback = feedback;
        submission.status = 'graded';
        submission.gradedBy = lecturerId;
        submission.gradedAt = new Date();

        await submission.save();

        results.push({
          submissionId,
          success: true,
          score
        });

      } catch (err) {
        errors.push({
          submissionId,
          error: err.message
        });
      }
    }

    res.json({
      message: "Bulk grading completed",
      results,
      errors,
      successful: results.length,
      failed: errors.length
    });

  } catch (error) {
    console.error("Bulk grade error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
export default router;
