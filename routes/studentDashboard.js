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

// Initialize GridFS when connection is ready
const initializeGridFS = () => {
  if (mongoose.connection.readyState === 1) {
    gfsBucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
  }
};

// Call this after your routes are defined or in your main server file
mongoose.connection.on('connected', () => {
  initializeGridFS();
});

// Also initialize on first request if not ready
router.use((req, res, next) => {
  if (!gfsBucket && mongoose.connection.readyState === 1) {
    initializeGridFS();
  }
  next();
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

    uploadStream.on('finish', () => {
      // Get the file ID from the upload stream
      const fileId = uploadStream.id;
      
      resolve({
        fileId: fileId.toString(),
        url: `https://examguide.onrender.com/api/student/files/${fileId.toString()}/download`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.length || file.size,
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
// ===========================================
// 1. DASHBOARD OVERVIEW & STATS
// ===========================================

router.get("/dashboard/stats", authenticate, isStudent, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Fetch all data needed for stats
    const lecturers = await User.find({
      $or: [
        { "courses.students": studentId },
        { "results.student": studentId }
      ]
    }, "courses results");

    // Get assignment submissions for this student
    const submissions = await AssignmentSubmission.find({
      student: studentId
    }).select("status submittedAt");

    let enrolledCount = 0;
    let totalScore = 0;
    let resultCount = 0;
    const enrolledCourseIds = [];

    // Count enrolled courses and calculate average
    lecturers.forEach(lecturer => {
      lecturer.courses.forEach(course => {
        if (course.students.includes(studentId)) {
          enrolledCount++;
          enrolledCourseIds.push(course._id);
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
    const completedAssessments = submissions.length;

    // ✅ Generate dynamic announcements from new assignments and exams
    const announcements = await generateDynamicAnnouncements(studentId, enrolledCourseIds);

    res.json({
      message: "Dashboard stats retrieved successfully",
      stats: {
        enrolledCourses: enrolledCount,
        pendingTasks: 0,
        upcomingExams: 0,
        averageScore: averageScore,
        completedAssessments: completedAssessments
      },
      announcements: announcements  // ✅ Return dynamic announcements
    });
  } catch (e) {
    console.error("Fetch student stats error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ✅ NEW FUNCTION: Generate dynamic announcements
async function generateDynamicAnnouncements(studentId, enrolledCourseIds) {
  try {
    const announcements = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (enrolledCourseIds.length === 0) {
      return announcements;
    }

    // Fetch new assignments created in the last 30 days for enrolled courses
    const newAssignments = await Questions.find({
      course: { $in: enrolledCourseIds },
      type: "assignment",
      createdAt: { $gte: thirtyDaysAgo }
    })
      .populate("course", "_id")
      .select("title dueDate createdAt course")
      .sort({ createdAt: -1 })
      .limit(10);

    // Fetch new exam sets created in the last 30 days for enrolled courses
    const newExamSets = await QuestionSet.find({
      createdBy: { $in: await User.find({ "courses._id": { $in: enrolledCourseIds } }).select("_id") },
      status: "ACTIVE",
      createdAt: { $gte: thirtyDaysAgo }
    })
      .select("title status createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    // Get course details for assignments
    const courseMap = new Map();
    for (const courseId of enrolledCourseIds) {
      const lecturer = await User.findOne(
        { "courses._id": courseId },
        "courses"
      );
      if (lecturer) {
        const course = lecturer.courses.find(c => c._id.toString() === courseId.toString());
        if (course) {
          courseMap.set(courseId.toString(), {
            code: course.code,
            title: course.title
          });
        }
      }
    }

    // Create announcements for new assignments
    newAssignments.forEach(assignment => {
      const courseId = assignment.course._id.toString();
      const courseInfo = courseMap.get(courseId) || { code: "Course", title: "Unknown" };
      
      const dueDateObj = new Date(assignment.dueDate);
      const dueDateStr = dueDateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });

      announcements.push({
        _id: `assignment-${assignment._id}`,
        type: "assignment",
        title: `New Assignment: ${assignment.title}`,
        message: `📝 A new assignment "${assignment.title}" has been posted in ${courseInfo.code}. Due date: ${dueDateStr}`,
        date: getRelativeTime(assignment.createdAt),
        course: courseInfo.code,
        icon: "ph-clipboard-text"
      });
    });

    // Create announcements for new exam sets
    newExamSets.forEach(examSet => {
      announcements.push({
        _id: `exam-${examSet._id}`,
        type: "exam",
        title: `New Exam Available: ${examSet.title}`,
        message: `📋 A new exam "${examSet.title}" is now available for you to take.`,
        date: getRelativeTime(examSet.createdAt),
        icon: "ph-exam"
      });
    });

    // Sort by date (newest first) and limit to 5 announcements
    return announcements
      .sort((a, b) => {
        const timeA = parseRelativeTime(a.date);
        const timeB = parseRelativeTime(b.date);
        return timeA - timeB;
      })
      .slice(0, 5);

  } catch (e) {
    console.error("Error generating announcements:", e);
    return [];
  }
}

// Helper function: Convert date to relative time string
function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  });
}

// Helper function: Parse relative time back to milliseconds for sorting
function parseRelativeTime(timeStr) {
  const now = new Date().getTime();
  
  if (timeStr === "just now") return now;
  
  const match = timeStr.match(/(\d+)\s+(\w+)\s+ago/);
  if (!match) return now;
  
  const [, value, unit] = match;
  const val = parseInt(value);
  
  switch (unit) {
    case "min":
    case "mins":
      return now - val * 60000;
    case "hour":
    case "hours":
      return now - val * 3600000;
    case "day":
    case "days":
      return now - val * 86400000;
    default:
      return now;
  }
}
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

router.get("/assignments/:assignmentId", authenticate, isStudent, async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const studentId = req.user.id;

        // Fetch full assignment with all fields needed
        const assignment = await Questions.findById(assignmentId);

        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found." });
        }

        // Verify this is actually an assignment (type should be 'assignment')
        if (assignment.type !== "assignment") {
            return res.status(400).json({ message: "This question is not an assignment." });
        }

        let courseCode = "Course";
        let courseName = "Course";

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
                    courseName = course.title || "Course";
                }
            }
        }

        const submission = await AssignmentSubmission.findOne({
            assignment: assignmentId,
            student: studentId
        }).select("status submittedAt grade score");

        // Build response with ALL fields from the Questions model
        res.json({
            assignment: {
                _id: assignment._id,
                title: assignment.title || "Continuous Assessment Task",
                description: assignment.description || "",
                question: assignment.question || "",
                instructions: assignment.instructions || "",  // ✅ Include instructions field
                dueDate: assignment.dueDate || new Date(),    // ✅ Include actual dueDate
                maxScore: assignment.maxScore || 100,
                courseCode: courseCode,
                courseName: courseName,
                type: assignment.type,
                createdAt: assignment.createdAt,
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

router.get("/files/:fileId/download", async (req, res) => {
  try {
    const { fileId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }

    // Initialize GridFS bucket if not already done
    if (!gfsBucket) {
      gfsBucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
    }

    // Download file from GridFS
    const downloadStream = gfsBucket.openDownloadStream(
      new mongoose.Types.ObjectId(fileId)
    );

    // Get file metadata
    const filesCollection = mongoose.connection.collection('uploads.files');
    const fileData = await filesCollection.findOne({
      _id: new mongoose.Types.ObjectId(fileId)
    });

    if (!fileData) {
      return res.status(404).json({ message: "File not found" });
    }

    const mimeType = fileData.metadata?.mimeType || 'application/octet-stream';
    const originalName = fileData.filename || 'download';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
    res.setHeader('Content-Length', fileData.length);

    downloadStream.on('error', (err) => {
      console.error("Download error:", err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Error downloading file" });
      }
    });

    downloadStream.pipe(res);

  } catch (e) {
    console.error("File download error:", e);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error", error: e.message });
    }
  }
});
// ===========================================
// 8. GET ASSIGNMENT RESULT
// ===========================================

router.get(
  "/assignments/:assignmentId/result",
  authenticate,
  isStudent,
  async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const studentId = req.user.id;

      const assignment = await Questions.findById(assignmentId)
        .select("-answer")
        .lean();

      if (!assignment) {
        return res.status(404).json({
          message: "Assignment not found."
        });
      }

      const submission = await AssignmentSubmission.findOne({
        assignment: assignmentId,
        student: studentId
      }).lean();

      if (!submission) {
        return res.status(404).json({
          message: "You have not submitted this assignment."
        });
      }

      const lecturer = await User.findOne(
        {
          "courses._id": assignment.course
        },
        "fullname courses"
      );

      let courseTitle = "";
      let courseCode = "";

      if (lecturer) {
        const course = lecturer.courses.find(
          c => c._id.toString() === assignment.course.toString()
        );

        if (course) {
          courseTitle = course.title;
          courseCode = course.code;
        }
      }

      res.json({
        assignment: {
          _id: assignment._id,
          title: assignment.title || "Continuous Assessment",
          question: assignment.question,
          course: assignment.course,
          courseTitle,
          courseCode
        },

        submission: {
  _id: submission._id,

  status: submission.status,

  score: submission.score,

  maxScore: assignment.maxScore ?? 100,

  percentage:
    submission.score != null
      ? Math.round(
          (submission.score /
            (assignment.maxScore ?? 100)) * 100
        )
      : null,

  feedback: submission.feedback || "",

  feedbackAttachments:
    submission.feedbackAttachments || [],

  gradedBy:
    lecturer?.fullname || "",

  gradedAt:
    submission.gradedAt,

  submittedAt:
    submission.submittedAt,

  submissionType:
    submission.submissionType,

  textSubmission:
    submission.textSubmission,

  attachments:
    submission.attachments || []
}
      });

    } catch (e) {
      console.error("Fetch assignment result error:", e);

      res.status(500).json({
        message: "Server error",
        error: e.message
      });
    }
  }
);
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
