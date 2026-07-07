import express from "express";
const router = express.Router();
import { authenticate, authorizeRole } from "../middleware/authenticate.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import multer from "multer";
import cloudinary from "cloudinary";
import streamifier from "streamifier";

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

/**
 * GET /api/lecturer/dashboard/stats
 * Returns: { studentCount, courseCount, questionCount, examCount }
 */
router.get("/dashboard/stats", authenticate, isLecturer, async (req, res) => {
  try {
    const lecturerId = req.user.id;

    let lecturer = await User.findById(lecturerId);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    const stats = {
      studentCount: lecturer.students?.length || 0,
      courseCount: lecturer.courses?.length || 0,
      questionCount: lecturer.questions?.length || 0,
      examCount: lecturer.exams?.length || 0,
      totalSubmissions: lecturer.totalSubmissions || 0,
      averageScore: lecturer.averageScore || 0
    };

    res.json(stats);
  } catch (e) {
    console.error("Dashboard stats error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ============================================
// 2. STUDENTS MANAGEMENT
// ============================================

/**
 * GET /api/lecturer/students
 * Query params: ?level=100&search=name
 * Returns: Array of students
 */
/**
 * GET /api/lecturer/students
 * Query params: ?level=100&search=name
 * Returns: Array of students in the same department as the lecturer
 */
router.get("/students", authenticate, isLecturer, async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { level, search } = req.query;

    // Fetch the lecturer to get their department
    let lecturer = await User.findById(lecturerId);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    // Build query to fetch all students in the same department
    const query = {
      department: lecturer.department,
      userType: "student",
      active: true
    };

    // Fetch all students in the department
    let students = await User.find(query);

    // Apply level filter if provided
    if (level) {
      students = students.filter(s => s.level === level);
    }

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      students = students.filter(s =>
        (s.fullname && s.fullname.toLowerCase().includes(searchLower)) ||
        (s.studentId && s.studentId.toLowerCase().includes(searchLower)) ||
        (s.username && s.username.toLowerCase().includes(searchLower))
      );
    }

    res.json({
      count: students.length,
      students: students.map(s => ({
        _id: s._id,
        name: s.fullname || s.username,
        matricNumber: s.studentId || "N/A",
        level: s.level || "N/A",
        part: s.part || "N/A",
        email: s.email,
        faculty: s.faculty,
        department: s.department,
        status: s.active !== false ? "Active" : "Inactive",
        joinedDate: s.createdAt
      }))
    });
  } catch (e) {
    console.error("Get students error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

/**
 * GET /api/lecturer/students/:id
 * Returns: Single student details
 */
router.get("/students/:id", authenticate, isLecturer, async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      _id: student._id,
      name: student.fullname || student.username,
      email: student.email,
      phone: student.phone,
      matricNumber: student.studentId,
      level: student.level,
      department: student.department,
      faculty: student.faculty,
      status: student.active !== false ? "Active" : "Inactive",
      joinedDate: student.createdAt,
      examAttempts: student.examAttempts || 0,
      averageScore: student.averageScore || 0
    });
  } catch (e) {
    console.error("Get student error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ============================================
// 3. COURSES MANAGEMENT
// ============================================

/**
 * GET /api/lecturer/courses
 * Returns: Array of lecturer's courses
 */
router.get("/courses", authenticate, isLecturer, async (req, res) => {
  try {
    const lecturerId = req.user.id;

    let lecturer = await User.findById(lecturerId);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    const courses = lecturer.courses || [];

    res.json({
      count: courses.length,
      courses: courses.map((c, idx) => ({
        _id: c._id || `course-${idx}`,
        title: c.title || c.name || c,
        code: c.code || "N/A",
        description: c.description || "",
        level: c.level || "N/A",
        students: c.students?.length || 0,
        questions: c.questions?.length || 0,
        createdAt: c.createdAt || new Date()
      }))
    });
  } catch (e) {
    console.error("Get courses error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

/**
 * POST /api/lecturer/courses
 * Body: { title, code, description, level }
 * Returns: Created course
 */
router.post("/courses", authenticate, isLecturer, async (req, res) => {
  try {
    const { title, code, description, level } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Course title is required" });
    }

    const lecturer = await User.findById(req.user.id);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    const newCourse = {
      _id: new mongoose.Types.ObjectId(),
      title,
      code: code || "",
      description: description || "",
      level: level || "",
      students: [],
      questions: [],
      createdAt: new Date()
    };

    lecturer.courses = lecturer.courses || [];
    lecturer.courses.push(newCourse);
    await lecturer.save();

    res.status(201).json({
      message: "Course created successfully",
      course: newCourse
    });
  } catch (e) {
    console.error("Create course error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

/**
 * PUT /api/lecturer/courses/:id
 * Body: { title, code, description, level }
 * Returns: Updated course
 */
router.put("/courses/:id", authenticate, isLecturer, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, code, description, level } = req.body;

    const lecturer = await User.findById(req.user.id);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    const course = lecturer.courses?.find(c => c._id?.toString() === id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (title) course.title = title;
    if (code !== undefined) course.code = code;
    if (description !== undefined) course.description = description;
    if (level !== undefined) course.level = level;

    await lecturer.save();

    res.json({ message: "Course updated", course });
  } catch (e) {
    console.error("Update course error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

/**
 * DELETE /api/lecturer/courses/:id
 * Returns: Success message
 */
router.delete("/courses/:id", authenticate, isLecturer, async (req, res) => {
  try {
    const { id } = req.params;

    const lecturer = await User.findById(req.user.id);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    lecturer.courses = lecturer.courses?.filter(c => c._id?.toString() !== id) || [];
    await lecturer.save();

    res.json({ message: "Course deleted successfully" });
  } catch (e) {
    console.error("Delete course error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ============================================
// 4. QUESTIONS MANAGEMENT
// ============================================

/**
 * GET /api/lecturer/questions
 * Query params: ?course=courseId
 * Returns: Array of questions
 */
router.get("/questions", authenticate, isLecturer, async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { course } = req.query;

    let lecturer = await User.findById(lecturerId);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    let questions = lecturer.questions || [];

    if (course) {
      questions = questions.filter(q => q.course?.toString() === course);
    }

    res.json({
      count: questions.length,
      questions: questions.map(q => ({
        _id: q._id,
        question: q.question || q.text,
        type: q.type || "multiple_choice",
        course: q.course,
        answer: q.answer || q.correctAnswer,
        options: q.options?.length || 0,
        createdAt: q.createdAt || new Date()
      }))
    });
  } catch (e) {
    console.error("Get questions error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

/**
 * POST /api/lecturer/questions
 * Body: { course, question, type, options, answer }
 * Returns: Created question
 */
router.post("/questions", authenticate, isLecturer, async (req, res) => {
  try {
    const { course, question, type, options, answer } = req.body;

    if (!question || !course) {
      return res.status(400).json({ message: "Question and course are required" });
    }

    const lecturer = await User.findById(req.user.id);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    const newQuestion = {
      _id: new mongoose.Types.ObjectId(),
      course: new mongoose.Types.ObjectId(course),
      question,
      type: type || "multiple_choice",
      options: options || [],
      answer: answer || "",
      createdAt: new Date()
    };

    lecturer.questions = lecturer.questions || [];
    lecturer.questions.push(newQuestion);
    await lecturer.save();

    res.status(201).json({
      message: "Question added successfully",
      question: newQuestion
    });
  } catch (e) {
    console.error("Create question error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

/**
 * DELETE /api/lecturer/questions/:id
 * Returns: Success message
 */
router.delete("/questions/:id", authenticate, isLecturer, async (req, res) => {
  try {
    const { id } = req.params;

    const lecturer = await User.findById(req.user.id);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    lecturer.questions = lecturer.questions?.filter(q => q._id?.toString() !== id) || [];
    await lecturer.save();

    res.json({ message: "Question deleted successfully" });
  } catch (e) {
    console.error("Delete question error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ============================================
// 5. EXAMS SCHEDULING
// ============================================

/**
 * GET /api/lecturer/exams
 * Returns: Array of scheduled exams
 */
router.get("/exams", authenticate, isLecturer, async (req, res) => {
  try {
    const lecturerId = req.user.id;

    let lecturer = await User.findById(lecturerId);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    const exams = lecturer.exams || [];

    res.json({
      count: exams.length,
      exams: exams.map(e => ({
        _id: e._id,
        course: e.course,
        title: e.title || "Exam",
        startDate: e.startDate,
        endDate: e.endDate,
        duration: e.duration || 0,
        levels: e.levels || [],
        totalStudents: e.students?.length || 0,
        status: e.status || "scheduled",
        questionsCount: e.questions?.length || 0
      }))
    });
  } catch (e) {
    console.error("Get exams error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

/**
 * POST /api/lecturer/exams
 * Body: { course, title, startDate, endDate, duration, levels }
 * Returns: Created exam schedule
 */
router.post("/exams", authenticate, isLecturer, async (req, res) => {
  try {
    const { course, title, startDate, endDate, duration, levels } = req.body;

    if (!course || !startDate || !endDate) {
      return res.status(400).json({ message: "Course, start date, and end date are required" });
    }

    const lecturer = await User.findById(req.user.id);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    const newExam = {
      _id: new mongoose.Types.ObjectId(),
      course: new mongoose.Types.ObjectId(course),
      title: title || "Exam",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      duration: parseInt(duration) || 60,
      levels: levels || [],
      students: [],
      questions: [],
      status: "scheduled",
      createdAt: new Date()
    };

    lecturer.exams = lecturer.exams || [];
    lecturer.exams.push(newExam);
    await lecturer.save();

    res.status(201).json({
      message: "Exam scheduled successfully",
      exam: newExam
    });
  } catch (e) {
    console.error("Create exam error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

/**
 * PUT /api/lecturer/exams/:id
 * Body: { title, startDate, endDate, duration, levels, status }
 * Returns: Updated exam
 */
router.put("/exams/:id", authenticate, isLecturer, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, startDate, endDate, duration, levels, status } = req.body;

    const lecturer = await User.findById(req.user.id);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    const exam = lecturer.exams?.find(e => e._id?.toString() === id);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    if (title) exam.title = title;
    if (startDate) exam.startDate = new Date(startDate);
    if (endDate) exam.endDate = new Date(endDate);
    if (duration) exam.duration = parseInt(duration);
    if (levels) exam.levels = levels;
    if (status) exam.status = status;

    await lecturer.save();

    res.json({ message: "Exam updated", exam });
  } catch (e) {
    console.error("Update exam error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

/**
 * DELETE /api/lecturer/exams/:id
 * Returns: Success message
 */
router.delete("/exams/:id", authenticate, isLecturer, async (req, res) => {
  try {
    const { id } = req.params;

    const lecturer = await User.findById(req.user.id);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    lecturer.exams = lecturer.exams?.filter(e => e._id?.toString() !== id) || [];
    await lecturer.save();

    res.json({ message: "Exam deleted successfully" });
  } catch (e) {
    console.error("Delete exam error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ============================================
// 6. RESULTS & SUBMISSIONS
// ============================================

/**
 * GET /api/lecturer/results
 * Query params: ?exam=examId
 * Returns: Array of student results
 */
router.get("/results", authenticate, isLecturer, async (req, res) => {
  try {
    const { exam } = req.query;
    const lecturerId = req.user.id;

    let lecturer = await User.findById(lecturerId);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    let results = lecturer.results || [];

    if (exam) {
      results = results.filter(r => r.exam?.toString() === exam);
    }

    res.json({
      count: results.length,
      results: results.map(r => ({
        _id: r._id,
        student: r.student,
        exam: r.exam,
        score: r.score || 0,
        grade: r.grade || "N/A",
        submitted: r.submittedAt,
        duration: r.duration || 0,
        status: r.status || "completed"
      }))
    });
  } catch (e) {
    console.error("Get results error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

/**
 * GET /api/lecturer/results/:id
 * Returns: Single result details
 */
router.get("/results/:id", authenticate, isLecturer, async (req, res) => {
  try {
    const lecturer = await User.findById(req.user.id);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    const result = lecturer.results?.find(r => r._id?.toString() === req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    res.json(result);
  } catch (e) {
    console.error("Get result error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ============================================
// 7. GRADING & ANALYTICS
// ============================================

/**
 * GET /api/lecturer/grading/stats
 * Returns: { averageScore, passRate, totalSubmissions, gradeDistribution }
 */
router.get("/grading/stats", authenticate, isLecturer, async (req, res) => {
  try {
    const lecturer = await User.findById(req.user.id);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    const results = lecturer.results || [];

    if (results.length === 0) {
      return res.json({
        averageScore: 0,
        passRate: 0,
        totalSubmissions: 0,
        gradeDistribution: {
          A: 0,
          B: 0,
          C: 0,
          D: 0,
          F: 0
        }
      });
    }

    const scores = results.map(r => r.score || 0);
    const averageScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
    const passCount = scores.filter(s => s >= 40).length;
    const passRate = ((passCount / scores.length) * 100).toFixed(2);

    const gradeDistribution = {
      A: results.filter(r => (r.score || 0) >= 80).length,
      B: results.filter(r => (r.score || 0) >= 70 && (r.score || 0) < 80).length,
      C: results.filter(r => (r.score || 0) >= 60 && (r.score || 0) < 70).length,
      D: results.filter(r => (r.score || 0) >= 50 && (r.score || 0) < 60).length,
      F: results.filter(r => (r.score || 0) < 50).length
    };

    res.json({
      averageScore: parseFloat(averageScore),
      passRate: parseFloat(passRate),
      totalSubmissions: results.length,
      gradeDistribution
    });
  } catch (e) {
    console.error("Grading stats error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ============================================
// 8. REPORTS
// ============================================

/**
 * GET /api/lecturer/reports
 * Query params: ?type=performance|grades|attendance
 * Returns: Report data
 */
router.get("/reports", authenticate, isLecturer, async (req, res) => {
  try {
    const { type } = req.query;
    const lecturer = await User.findById(req.user.id);

    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    if (type === "performance") {
      const results = lecturer.results || [];
      res.json({
        type: "Performance Report",
        totalExams: lecturer.exams?.length || 0,
        totalStudents: lecturer.students?.length || 0,
        averageScore: lecturer.averageScore || 0,
        submissions: results.length,
        data: results.map(r => ({
          student: r.student,
          score: r.score,
          date: r.submittedAt
        }))
      });
    } else if (type === "grades") {
      const results = lecturer.results || [];
      const gradeDistribution = {
        A: results.filter(r => (r.score || 0) >= 80).length,
        B: results.filter(r => (r.score || 0) >= 70 && (r.score || 0) < 80).length,
        C: results.filter(r => (r.score || 0) >= 60 && (r.score || 0) < 70).length,
        D: results.filter(r => (r.score || 0) >= 50 && (r.score || 0) < 60).length,
        F: results.filter(r => (r.score || 0) < 50).length
      };

      res.json({
        type: "Grade Distribution Report",
        data: gradeDistribution
      });
    } else {
      res.json({
        type: "General Report",
        students: lecturer.students?.length || 0,
        courses: lecturer.courses?.length || 0,
        questions: lecturer.questions?.length || 0,
        exams: lecturer.exams?.length || 0
      });
    }
  } catch (e) {
    console.error("Reports error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

/**
 * POST /api/lecturer/reports/export
 * Body: { type, format }
 * Returns: Export URL or file
 */
router.post("/reports/export", authenticate, isLecturer, async (req, res) => {
  try {
    const { type, format } = req.body;

    res.json({
      message: "Report exported successfully",
      url: "/exports/report.csv",
      format: format || "csv"
    });
  } catch (e) {
    console.error("Export error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ============================================
// 9. PROFILE & SETTINGS
// ============================================

/**
 * GET /api/lecturer/profile
 * Returns: Lecturer profile information
 */
router.get("/profile", authenticate, isLecturer, async (req, res) => {
  try {
    const lecturer = await User.findById(req.user.id);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    res.json({
      _id: lecturer._id,
      name: lecturer.fullname || lecturer.username,
      email: lecturer.email,
      phone: lecturer.phone,
      department: lecturer.department,
      faculty: lecturer.faculty,
      bio: lecturer.bio || "",
      profilePic: lecturer.profilePic || "",
      createdAt: lecturer.createdAt
    });
  } catch (e) {
    console.error("Profile error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

/**
 * PUT /api/lecturer/profile
 * Body: { name, email, phone, bio }
 * Returns: Updated profile
 */
router.put("/profile", authenticate, isLecturer, async (req, res) => {
  try {
    const { name, email, phone, bio } = req.body;

    const lecturer = await User.findById(req.user.id);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    if (name) lecturer.fullname = name;
    if (email) lecturer.email = email;
    if (phone) lecturer.phone = phone;
    if (bio) lecturer.bio = bio;

    await lecturer.save();

    res.json({
      message: "Profile updated successfully",
      profile: {
        name: lecturer.fullname,
        email: lecturer.email,
        phone: lecturer.phone,
        bio: lecturer.bio
      }
    });
  } catch (e) {
    console.error("Update profile error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

/**
 * POST /api/lecturer/profile/avatar
 * Multipart: { avatar (file) }
 * Returns: Updated avatar URL
 */
router.post("/profile/avatar", authenticate, isLecturer, uploadToMemory.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const stream = cloudinary.v2.uploader.upload_stream(
      { folder: "lecturer-avatars", resource_type: "image" },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ error: "Upload failed" });
        }

        const lecturer = await User.findById(req.user.id);
        if (lecturer) {
          lecturer.profilePic = result.secure_url;
          await lecturer.save();
        }

        res.json({ url: result.secure_url, message: "Avatar updated successfully" });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (e) {
    console.error("Avatar upload error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ============================================
// 10. BULK OPERATIONS
// ============================================

/**
 * POST /api/lecturer/questions/bulk
 * Body: { questions: [{ question, type, options, answer }] }
 * Returns: { created: count }
 */
router.post("/questions/bulk", authenticate, isLecturer, async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "No questions provided" });
    }

    const lecturer = await User.findById(req.user.id);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    const newQuestions = questions.map(q => ({
      _id: new mongoose.Types.ObjectId(),
      question: q.question,
      type: q.type || "multiple_choice",
      options: q.options || [],
      answer: q.answer || "",
      course: q.course,
      createdAt: new Date()
    }));

    lecturer.questions = lecturer.questions || [];
    lecturer.questions.push(...newQuestions);
    await lecturer.save();

    res.status(201).json({
      message: `${newQuestions.length} questions added successfully`,
      created: newQuestions.length
    });
  } catch (e) {
    console.error("Bulk questions error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ============================================
// 11. SEARCH & FILTER
// ============================================

/**
 * GET /api/lecturer/search
 * Query params: ?q=query&type=students|courses|questions|exams
 * Returns: Search results
 */
router.get("/search", authenticate, isLecturer, async (req, res) => {
  try {
    const { q, type } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Query parameter required" });
    }

    const lecturer = await User.findById(req.user.id);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    const queryLower = q.toLowerCase();
    let results = [];

    if (!type || type === "students") {
      const students = lecturer.students || [];
      results.push(
        ...students
          .filter(
            s =>
              (s.fullname && s.fullname.toLowerCase().includes(queryLower)) ||
              (s.email && s.email.toLowerCase().includes(queryLower)) ||
              (s.studentId && s.studentId.toLowerCase().includes(queryLower))
          )
          .map(s => ({ type: "student", ...s }))
      );
    }

    if (!type || type === "courses") {
      const courses = lecturer.courses || [];
      results.push(
        ...courses
          .filter(c => (c.title && c.title.toLowerCase().includes(queryLower)) || (c.code && c.code.toLowerCase().includes(queryLower)))
          .map(c => ({ type: "course", ...c }))
      );
    }

    if (!type || type === "questions") {
      const questions = lecturer.questions || [];
      results.push(
        ...questions
          .filter(q => q.question && q.question.toLowerCase().includes(queryLower))
          .map(q => ({ type: "question", ...q }))
      );
    }

    if (!type || type === "exams") {
      const exams = lecturer.exams || [];
      results.push(...exams.filter(e => (e.title && e.title.toLowerCase().includes(queryLower))).map(e => ({ type: "exam", ...e })));
    }

    res.json({
      query: q,
      count: results.length,
      results: results.slice(0, 50)
    });
  } catch (e) {
    console.error("Search error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

export default router;
