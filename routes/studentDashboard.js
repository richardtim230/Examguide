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
import { GridFSBucket } from "mongodb";

const memStorage = multer.memoryStorage();
const uploadToMemory = multer({ storage: memStorage });

// GridFS bucket for file storage
let gfsBucket;
mongoose.connection.once('open', () => {
  gfsBucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
});

// ===========================================
// MIDDLEWARE
// ===========================================

const isStudent = (req, res, next) => {
  if (req.user.userType !== "student" && req.user.role !== "student") {
    return res.status(403).json({ message: "Access denied. Student role required." });
  }
  next();
};

// Helper function to check if file is an image
const isImage = (mimeType) => {
  return mimeType.startsWith('image/');
};

// Helper function to check if file is document
const isDocument = (mimeType) => {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ];
  return documentTypes.includes(mimeType);
};

// Helper function to check if file is media (video/audio)
const isMedia = (mimeType) => {
  return mimeType.startsWith('video/') || mimeType.startsWith('audio/');
};

// Upload image to Cloudinary
const uploadImageToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder: "assignment-submissions/images",
        resource_type: "auto"
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          storageType: 'cloudinary'
        });
      }
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

// Upload file to GridFS
const uploadFileToGridFS = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = gfsBucket.openUploadStream(file.originalname, {
      metadata: {
        mimeType: file.mimetype,
        uploadedAt: new Date(),
        originalSize: file.size
      }
    });

    uploadStream.on('finish', (file) => {
      resolve({
        fileId: file._id.toString(),
        url: `/api/student/files/${file._id.toString()}/download`,
        originalName: file.filename,
        mimeType: file.metadata.mimeType,
        size: file.length,
        storageType: 'gridfs'
      });
    });

    uploadStream.on('error', (err) => {
      reject(err);
    });

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

// ===========================================
// 1. DASHBOARD OVERVIEW & STATS
// ===========================================

router.get("/dashboard/stats", authenticate, isStudent, async (req, res) => {
  try {
    const studentId = req.user.id;

    const lecturers = await User.find({
      $or: [
        { "courses.students": studentId },
        { "results.student": studentId }
      ]
    }, "courses results");

    let enrolledCount = 0;
    let totalScore = 0;
    let resultCount = 0;

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
        pendingTasks: 0,
        upcomingExams: 0,
        averageScore: averageScore
      }
    });
  } catch (e) {
    console.error("Fetch student stats error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ===========================================
// 2. COURSE CATALOG
// ===========================================

router.get("/courses/catalog", authenticate, isStudent, async (req, res) => {
  try {
    const studentId = req.user.id;

    const lecturers = await User.find(
      { "courses.0": { $exists: true } }, 
      "fullname title courses"
    );

    const catalog = [];

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
// 3. MY ENROLLMENTS
// ===========================================

router.get("/courses/enrolled", authenticate, isStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    
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
// 5. ENTER COURSE WORKSPACE
// ===========================================

router.get("/courses/:courseId/workspace", authenticate, isStudent, async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    const lecturer = await User.findOne(
      { "courses._id": courseId },
      "fullname email courses exams"
    );

    if (!lecturer) {
      return res.status(404).json({ message: "Course not found." });
    }

    const course = lecturer.courses.find(c => c._id.toString() === courseId);

    if (!course.students.includes(studentId)) {
        return res.status(403).json({ message: "Access denied. You must register for this course first." });
    }

    const activeExamSets = await QuestionSet.find({
        createdBy: lecturer._id,
        status: "ACTIVE"
    })
    .select("-questions")
    .lean();

    const activeLegacyExams = (lecturer.exams || []).filter(exam => 
      exam.course && exam.course.toString() === courseId && exam.status === "ACTIVE"
    );

    const questions = await Questions.find({
        course: courseId
    }).select("-answer").lean();

    const submissions = await AssignmentSubmission.find({
        student: studentId,
        assignment: {
            $in: questions.map(q => q._id)
        }
    }).select("assignment status submittedAt grade");

    const submissionMap = {};

    submissions.forEach(sub => {
        submissionMap[sub.assignment.toString()] = sub;
    });

    const activeQuestions = questions.map(question => ({
        ...question,
        hasSubmitted: !!submissionMap[question._id.toString()],
        submission: submissionMap[question._id.toString()] || null
    }));

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

// ===========================================
// 6. GET ASSIGNMENT DETAILS
// ===========================================

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

// ===========================================
// 7. SUBMIT ASSIGNMENT (WITH GRIDFS & CLOUDINARY)
// ===========================================

router.post(
  "/assignments/:assignmentId/submit",
  authenticate,
  isStudent,
  uploadToMemory.single("file"),
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

      // Process file upload if provided
      if (req.file) {
        try {
          let attachment;

          if (isImage(req.file.mimetype)) {
            // Upload images to Cloudinary
            attachment = await uploadImageToCloudinary(req.file);
          } else if (isDocument(req.file.mimetype) || isMedia(req.file.mimetype)) {
            // Upload documents and media to GridFS
            attachment = await uploadFileToGridFS(req.file);
          } else {
            return res.status(400).json({
              message: "Unsupported file type. Please upload images, documents (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX), or media files (MP4, MP3, WebM)."
            });
          }

          attachments.push(attachment);
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
          return res.status(500).json({
            message: "Failed to upload file",
            error: uploadError.message
          });
        }
      }

      // Validate submission
      const hasText = content && content.trim() !== "";
      const hasFile = attachments.length > 0;

      if (!hasText && !hasFile) {
        return res.status(400).json({
          message: "Please provide either text content or upload a file."
        });
      }

      // Determine submission type
      let submissionType = "text";
      if (hasFile && hasText) {
        submissionType = "mixed";
      } else if (hasFile) {
        submissionType = attachments[0].storageType === 'cloudinary' ? "file" : 
                        (attachments[0].mimeType.startsWith('video/') || attachments[0].mimeType.startsWith('audio/')) ? "media" : "file";
      }

      const submission = await AssignmentSubmission.create({
        assignment: assignment._id,
        course: assignment.course,
        lecturer: lecturer._id,
        student: studentId,
        submissionType,
        textSubmission: content || "",
        attachments,
        submittedAt: new Date(),
        status: "submitted"
      });

      res.status(201).json({
        message: "Assignment submitted successfully.",
        submission: {
          _id: submission._id,
          submissionType: submission.submissionType,
          attachments: submission.attachments,
          status: submission.status,
          submittedAt: submission.submittedAt
        }
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

// ===========================================
// 8. DOWNLOAD FILE FROM GRIDFS
// ===========================================

router.get("/files/:fileId/download", authenticate, isStudent, async (req, res) => {
  try {
    const { fileId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }

    // Check if file exists and user has access
    const submission = await AssignmentSubmission.findOne({
      "attachments.fileId": fileId,
      student: req.user.id
    });

    if (!submission) {
      return res.status(403).json({ message: "Access denied. File not found." });
    }

    const attachment = submission.attachments.find(a => a.fileId === fileId);

    // Download file from GridFS
    const downloadStream = gfsBucket.openDownloadStream(
      new mongoose.Types.ObjectId(fileId)
    );

    downloadStream.on('error', (err) => {
      console.error("Download error:", err);
      res.status(500).json({ message: "Error downloading file" });
    });

    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    downloadStream.pipe(res);

  } catch (e) {
    console.error("File download error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ===========================================
// 9. DELETE SUBMISSION FILE (CLEANUP FROM GRIDFS)
// ===========================================

router.delete("/files/:fileId", authenticate, isStudent, async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }

    // Verify ownership
    const submission = await AssignmentSubmission.findOne({
      "attachments.fileId": fileId,
      student: req.user.id
    });

    if (!submission) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Delete from GridFS
    await gfsBucket.delete(new mongoose.Types.ObjectId(fileId));

    // Remove from submission
    submission.attachments = submission.attachments.filter(a => a.fileId !== fileId);
    await submission.save();

    res.json({ message: "File deleted successfully" });

  } catch (e) {
    console.error("File deletion error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

export default router;
