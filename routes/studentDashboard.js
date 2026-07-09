import express from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/authenticate.js";
import User from "../models/User.js"; 
import Questions from "../models/Questions.js";
import QuestionSet from "../models/QuestionSet.js";
const router = express.Router();
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import multer from "multer";
import streamifier from "streamifier";
import cloudinary from "cloudinary";
const memStorage = multer.memoryStorage();
const uploadToMemory = multer({ storage: memStorage });



// ===========================================
// MIDDLEWARE
// ===========================================

const isStudent = (req, res, next) => {
  // Accommodate your userType schema logic
  if (req.user.userType !== "student" && req.user.role !== "student") {
    return res.status(403).json({ message: "Access denied. Student role required." });
  }
  next();
};

// ===========================================
// 1. DASHBOARD OVERVIEW & STATS
// ===========================================

router.get("/dashboard/stats", authenticate, isStudent, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find all users (lecturers) who have this student in any of their courses or results
    const lecturers = await User.find({
      $or: [
        { "courses.students": studentId },
        { "results.student": studentId }
      ]
    }, "courses results");

    let enrolledCount = 0;
    let totalScore = 0;
    let resultCount = 0;

    // Calculate totals across all lecturers
    lecturers.forEach(lecturer => {
      lecturer.courses.forEach(course => {
        if (course.students.includes(studentId)) {
          enrolledCount++;
        }
      });

      lecturer.results.forEach(result => {
        if (result.student && result.student.toString() === studentId) {
          totalScore += (result.score || 0);
          resultCount++;
        }
      });
    });

    const averageScore = resultCount > 0 ? Math.round(totalScore / resultCount) : 0;

    res.json({
      message: "Dashboard stats retrieved successfully",
      stats: {
        enrolledCourses: enrolledCount,
        pendingTasks: 0, // Implement based on your assignment/question deadline logic
        upcomingExams: 0, // Implement based on exam startDate
        averageScore: averageScore
      }
    });
  } catch (e) {
    console.error("Fetch student stats error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ===========================================
// 2. COURSE CATALOG (View all available courses)
// ===========================================

router.get("/courses/catalog", authenticate, isStudent, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find all users who have at least one course created
    const lecturers = await User.find(
      { "courses.0": { $exists: true } }, 
      "fullname title courses"
    );

    const catalog = [];

    // Flatten courses from all lecturers into a single catalog array
    lecturers.forEach(lecturer => {
      lecturer.courses.forEach(course => {
        const isEnrolled = course.students.some(sId => sId.toString() === studentId);
        
        catalog.push({
          _id: course._id,
          code: course.code,
          title: course.title,
          desc: course.description,
          level: course.level,
          lecturer: lecturer.fullname || "Unknown Lecturer",
          enrolled: isEnrolled
        });
      });
    });

    res.json({ catalog });
  } catch (e) {
    console.error("Fetch course catalog error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ===========================================
// 3. MY ENROLLMENTS (View registered courses)
// ===========================================

router.get("/courses/enrolled", authenticate, isStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Find lecturers where this student is inside the courses.students array
    const lecturers = await User.find(
      { "courses.students": studentId },
      "fullname courses"
    );

    const enrolledCourses = [];

    lecturers.forEach(lecturer => {
      lecturer.courses.forEach(course => {
        if (course.students.includes(studentId)) {
          enrolledCourses.push({
            _id: course._id,
            code: course.code,
            title: course.title,
            desc: course.description,
            level: course.level,
            lecturer: lecturer.fullname
          });
        }
      });
    });

    res.json({ enrolledCourses });
  } catch (e) {
    console.error("Fetch enrolled courses error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ===========================================
// 4. ENROLL IN A COURSE
// ===========================================

router.post("/courses/:courseId/enroll", authenticate, isStudent, async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    // Verify course exists and add the student to the course's students array
    // using MongoDB's $ (positional) operator and $addToSet to prevent duplicates
    const updatedLecturer = await User.findOneAndUpdate(
      { "courses._id": courseId },
      { $addToSet: { "courses.$.students": studentId } },
      { new: true }
    );

    if (!updatedLecturer) {
      return res.status(404).json({ message: "Course not found" });
    }

    const enrolledCourse = updatedLecturer.courses.find(c => c._id.toString() === courseId);

    res.json({ 
        message: `Successfully enrolled in ${enrolledCourse.code}`
    });
  } catch (e) {
    console.error("Course enrollment error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ===========================================
// 5. ENTER COURSE WORKSPACE (UPDATED)
// ===========================================

router.get("/courses/:courseId/workspace", authenticate, isStudent, async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    // 1. Find the lecturer holding this course
    const lecturer = await User.findOne(
      { "courses._id": courseId },
      "fullname email courses exams" // No need to fetch raw question IDs here anymore
    );

    if (!lecturer) {
      return res.status(404).json({ message: "Course not found." });
    }

    // 2. Extract the specific course
    const course = lecturer.courses.find(c => c._id.toString() === courseId);

    // 3. Verify the student is registered
    if (!course.students.includes(studentId)) {
        return res.status(403).json({ message: "Access denied. You must register for this course first." });
    }

    // 4. Fetch Modern Exam Sets
const activeExamSets = await QuestionSet.find({
    createdBy: lecturer._id,
    status: "ACTIVE"
})
.select("-questions")
.lean();

    // 5. Fetch Legacy Embedded Exams (Fallback just in case)
    const activeLegacyExams = (lecturer.exams || []).filter(exam => 
      exam.course && exam.course.toString() === courseId && exam.status === "ACTIVE"
    );

    // 6. Fetch Assignments/Questions (Querying the Questions collection directly)
    const activeQuestions = await Questions.find({ 
        course: courseId 
    }).select("-answer"); // Hide the correct answers from the payload

    res.json({ 
        course: {
          _id: course._id,
          code: course.code,
          title: course.title,
          description: course.description,
          lecturer: lecturer.fullname,
          lecturerEmail: lecturer.email
        },
        activeExamSets,
        activeLegacyExams,
        activeQuestions,
        message: "Welcome to the course workspace" 
    });
  } catch (e) {
    console.error("Fetch workspace error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

router.get("/assignments/:assignmentId", authenticate, isStudent, async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const studentId = req.user.id;

        const assignment = await Questions.findById(assignmentId).select("-answer");

        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found." });
        }

        let courseCode = "Course";

        if (assignment.course) {
            const lecturer = await User.findOne(
                { "courses._id": assignment.course },
                "courses"
            );

            if (lecturer) {
                const course = lecturer.courses.find(
                    c => c._id.toString() === assignment.course.toString()
                );

                if (course) {
                    courseCode = course.code || course.title;
                }
            }
        }

        const submission = await AssignmentSubmission.findOne({
            assignment: assignmentId,
            student: studentId
        }).select("status submittedAt grade");

        res.json({
            assignment: {
                _id: assignment._id,
                title: assignment.title || "Continuous Assessment Task",
                instructions: assignment.question,
                dueDate: assignment.createdAt,
                courseCode,
                hasSubmitted: !!submission,
                submission: submission || null
            }
        });

    } catch (e) {
        console.error("Fetch assignment details error:", e);
        res.status(500).json({
            message: "Server error",
            error: e.message
        });
    }
});


router.post(
  "/assignments/:assignmentId/submit",
  authenticate,
  isStudent,
  uploadToMemory.array("files", 10),
  async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const studentId = req.user.id;
      const { content } = req.body;

      const assignment = await Questions.findById(assignmentId);

      if (!assignment || assignment.type !== "assignment") {
        return res.status(404).json({
          message: "Assignment not found."
        });
      }

      const lecturer = await User.findOne({
        "courses._id": assignment.course
      });

      if (!lecturer) {
        return res.status(404).json({
          message: "Course not found."
        });
      }

      const course = lecturer.courses.id(assignment.course);

      if (
        !course ||
        !course.students.some(
          id => id.toString() === studentId.toString()
        )
      ) {
        return res.status(403).json({
          message: "You are not enrolled in this course."
        });
      }

      const existingSubmission = await AssignmentSubmission.findOne({
        assignment: assignmentId,
        student: studentId
      });

      if (existingSubmission) {
        return res.status(409).json({
          message: "You have already submitted this assignment."
        });
      }

      let attachments = [];

      if (req.files?.length) {
        attachments = await Promise.all(
          req.files.map(file => {
            return new Promise((resolve, reject) => {
              const stream = cloudinary.v2.uploader.upload_stream(
                {
                  folder: "assignment-submissions",
                  resource_type: "auto"
                },
                (err, result) => {
                  if (err) return reject(err);

                  resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size
                  });
                }
              );

              streamifier.createReadStream(file.buffer).pipe(stream);
            });
          })
        );
      }

      const submission = await AssignmentSubmission.create({
        assignment: assignment._id,
        course: assignment.course,
        lecturer: lecturer._id,
        student: studentId,
        submissionType:
          attachments.length > 0 && content
            ? "mixed"
            : attachments.length > 0
            ? "file"
            : "text",
        textSubmission: content || "",
        attachments,
        submittedAt: new Date(),
        status: "submitted"
      });

      res.status(201).json({
        message: "Assignment submitted successfully.",
        submission
      });

    } catch (e) {
      console.error("Assignment submission error:", e);

      res.status(500).json({
        message: "Server error",
        error: e.message
      });
    }
  }
);


export default router;
