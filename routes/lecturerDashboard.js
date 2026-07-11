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

router.get("/dashboard/stats", authenticate, isLecturer, async (req, res) => {
  try {
    const lecturerId = req.user.id;

    const lecturer = await User.findById(lecturerId);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    let studentCount = 0;
    if (lecturer.faculty) {
      studentCount = await User.countDocuments({
        faculty: lecturer.faculty,
        role: "student",
        active: true
      });
    }

    const stats = {
      studentCount,
      courseCount: lecturer.courses?.length || 0,
      questionCount: lecturer.questions?.length || 0,
      examCount: lecturer.exams?.length || 0,
      totalSubmissions: lecturer.totalSubmissions || 0,
      averageScore: lecturer.averageScore || 0
    };

    res.json(stats);
  } catch (e) {
    console.error("Dashboard stats error:", e);
    res.status(500).json({
      message: "Server error",
      error: e.message
    });
  }
});

router.get("/students", authenticate, isLecturer, async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { level, search } = req.query;

    let lecturer = await User.findById(lecturerId);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    if (!lecturer.faculty) {
      return res.json({ count: 0, students: [] });
    }

    const query = {
      faculty: lecturer.faculty,
      role: "student",
      active: true
    };

    let students = await User.find(query).lean();

    if (level) {
      students = students.filter(s => s.level === level);
    }

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

router.get("/questions", authenticate, isLecturer, async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { course } = req.query;

    const lecturer = await User.findById(lecturerId);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    const rawQuestions = lecturer.questions || [];
    let questions = [];

    // Helper: regex for 24-hex ObjectId strings
    const idPattern = /^[0-9a-fA-F]{24}$/;

    if (rawQuestions.length === 0) {
      questions = [];
    } else if (typeof rawQuestions[0] === 'string') {
      // Strings: could be question text or question _id strings
      const idStrings = rawQuestions.filter(s => idPattern.test(s));
      const textStrings = rawQuestions.filter(s => !idPattern.test(s));

      if (idStrings.length > 0) {
        try {
          const docs = await Questions.find({ _id: { $in: idStrings } }).lean();
          questions = questions.concat(docs);
        } catch (err) {
          console.warn("Failed to resolve question IDs stored as strings:", err);
        }
      }

      // keep plain text strings as simple objects (no course info)
      questions = questions.concat(textStrings.map(t => ({
        _id: null,
        question: t,
        type: "multiple_choice",
        course: null,
        options: [],
        answer: ""
      })));
    } else if (rawQuestions[0] && typeof rawQuestions[0] === 'object' && rawQuestions[0]._id) {
      // Already embedded subdocuments (or full objects)
      questions = rawQuestions;
    } else {
      // Possibly array of ObjectId objects or mixed values -> try to coerce to string ids and resolve
      const candidateIds = rawQuestions.map(r => {
        try { return String(r); } catch { return null; }
      }).filter(s => s && idPattern.test(s));

      if (candidateIds.length > 0) {
        try {
          const docs = await Questions.find({ _id: { $in: candidateIds } }).lean();
          questions = docs;
        } catch (err) {
          console.warn("Failed to resolve ObjectId-like entries in lecturer.questions:", err);
          questions = rawQuestions;
        }
      } else {
        questions = rawQuestions;
      }
    }

    // Apply course filter after resolution
    if (course) {
      questions = questions.filter(q => {
        try {
          const qCourse = q.course;
          if (!qCourse) return false;
          return String(qCourse) === String(course);
        } catch {
          return false;
        }
      });
    }

    res.json({
      count: questions.length,
      questions: questions.map(q => ({
        _id: q._id || null,
        question: q.question || q.text || '',
        type: q.type || "multiple_choice",
        course: q.course || null,
        answer: q.answer || q.correctAnswer || '',
        options: Array.isArray(q.options) ? q.options : [],
        createdAt: q.createdAt || q.createdAt || new Date()
      }))
    });
  } catch (e) {
    console.error("Get questions error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// Replace the existing router.post("/questions", ...) handler with this:
router.post("/questions", authenticate, isLecturer, async (req, res) => {
  try {
    const {
    course,
    title,
    description,
    question,
    instructions,
    dueDate,
    maxScore,
    type,
    options,
    answer
} = req.body;
    
    if (!question || !course) {
      return res.status(400).json({ message: "Question and course are required" });
    }

    const lecturer = await User.findById(req.user.id);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

const newQuestionData = {
    title: title || "",
    description: description || "",
    question,
    instructions: instructions || "",
    dueDate: dueDate || null,
    maxScore: maxScore || 100,

    type: type || "multiple_choice",
    options: Array.isArray(options)
        ? options.map(o => ({
              text: o.text || "",
              image: o.image || ""
          }))
        : [],
    answer: answer || "",

    course: mongoose.Types.ObjectId.isValid(course)
        ? new mongoose.Types.ObjectId(course)
        : course,

    createdBy: lecturer._id,
    createdAt: new Date()
};

    const questionsPath = User.schema.path('questions');
    let casterInstance = null;
    if (questionsPath) {
      if (questionsPath.caster && questionsPath.caster.instance) casterInstance = questionsPath.caster.instance;
      else if (questionsPath.instance) casterInstance = questionsPath.instance;
    }
    const caster = casterInstance ? String(casterInstance).toLowerCase() : null;

    // CASE A: User.questions is array of strings -> create a Questions doc and store its _id as string
    if (caster === 'string') {
      try {
        const created = await Questions.create(newQuestionData);

        lecturer.questions = lecturer.questions || [];
        lecturer.questions.push(String(created._id)); // store as string to satisfy schema
        await lecturer.save();

        return res.status(201).json({
          message: "Question created and linked (string-id fallback)",
          question: created
        });
      } catch (err) {
        console.error("Failed to create Question document for string-fallback:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
      }
    }

    // CASE B: User.questions is array of ObjectId refs -> create Questions doc and push ObjectId
    if (/objectid/i.test(caster) || caster === 'objectid') {
      try {
        const created = await Questions.create(newQuestionData);

        lecturer.questions = lecturer.questions || [];
        lecturer.questions.push(created._id); // store as ObjectId reference
        await lecturer.save();

        return res.status(201).json({
          message: "Question created and linked (ObjectId reference)",
          question: created
        });
      } catch (err) {
        console.error("Failed to create Question and link as ObjectId:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
      }
    }

    // CASE C: assume embedded subdocuments allowed -> push the full object
    // Build an embedded subdocument structure (match what your UI/clients expect)
    const embeddedQ = {
      _id: new mongoose.Types.ObjectId(),
      question: newQuestionData.question,
      type: newQuestionData.type,
      options: newQuestionData.options,
      answer: newQuestionData.answer,
      course: newQuestionData.course,
      createdAt: newQuestionData.createdAt
    };

    lecturer.questions = lecturer.questions || [];
    lecturer.questions.push(embeddedQ);

    try {
      await lecturer.save();
      return res.status(201).json({
        message: "Question added successfully as subdocument",
        question: embeddedQ
      });
    } catch (saveErr) {
      console.error("Failed to save as embedded subdocument:", saveErr);
      try {
        const created = await Questions.create(newQuestionData);
        const freshLecturer = await User.findById(lecturer._id);
        freshLecturer.questions = freshLecturer.questions || [];
        // try to store as string to be safe
        freshLecturer.questions.push(String(created._id));
        await freshLecturer.save();

        return res.status(201).json({
          message: "Question created and linked (final fallback: stored id as string)",
          question: created
        });
      } catch (finalErr) {
        console.error("Final fallback failed:", finalErr);
        return res.status(500).json({ message: "Server error", error: finalErr.message });
      }
    }

  } catch (e) {
    console.error("Create question error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

router.get("/submissions/:submissionId", authenticate, isLecturer, async (req, res) => {
  try {
    const { submissionId } = req.params;

    // Fetch the result and populate student info
    const result = await Result.findById(submissionId)
      .populate("user", "fullname username studentId matricNumber email")
      .populate("examSet", "title")
      .lean();

    if (!result) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Helper to strip HTML tags and normalize text variations for an accurate match
    const normalizeText = (str) => {
      if (!str) return '';
      return String(str).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    };

    res.json({
      submission: {
        _id: result._id,
        student: result.user,
        examTitle: result.examSetTitle || (result.examSet ? result.examSet.title : "Practice Assessment"),
        score: result.score,
        timeTaken: result.timeTaken,
        submittedAt: result.submittedAt,
        rawAnswers: result.answers || {},
        // Map questions by tracking their unique structural ID properties
        questions: (result.questions || []).map((q) => {
          
          // DEFINITIVE FIX: Lookup the answer using the unique question id (q.id)
          // This ensures accurate mapping regardless of how the array reshuffled.
          const lookupKey = q.id !== undefined ? String(q.id) : String(q._id);
          const studentAnswer = result.answers[lookupKey] || "No answer";
          
          const isAnswerSkipped = studentAnswer === "No answer" || normalizeText(studentAnswer) === 'no answer';
          const isCorrectMatch = !isAnswerSkipped && (normalizeText(studentAnswer) === normalizeText(q.answer));

          return {
            id: q.id,
            question: q.question,
            options: q.options,
            correctAnswer: q.answer, 
            selectedAnswer: studentAnswer,
            isCorrect: isCorrectMatch
          };
        })
      }
    });
  } catch (e) {
    console.error("Get individual submission error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

router.post("/exam-sets/create", authenticate, isLecturer, async (req, res) => {
  try {
    const {
      title,
      courseId,
      faculty,
      department,
      status = "INACTIVE",
      schedule,
      questions = []
    } = req.body;

    // Validation
    if (!title || !courseId || !faculty || !department) {
      return res.status(400).json({
        message: "Missing required fields: title, courseId, faculty, department"
      });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        message: "At least one question is required"
      });
    }

    const lecturerId = req.user.id;

    // Get lecturer
    const lecturer = await User.findById(lecturerId);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    // Verify course exists in lecturer's courses
    const courseExists = lecturer.courses?.some(c =>
      c._id?.toString() === courseId || c._id === courseId
    );

    if (!courseExists) {
      return res.status(403).json({
        message: "Course not found in your courses or access denied"
      });
    }

    // Validate question structure
    const validatedQuestions = questions.map((q, idx) => {
      if (!q.question || !Array.isArray(q.options) || !q.answer) {
        throw new Error(
          `Question ${idx + 1} is missing required fields: question, options, answer`
        );
      }

      return {
        id: q.id || idx + 1,
        question: q.question.trim(),
        options: q.options.map(opt => ({
          text: opt.text?.trim() || "",
          image: opt.image || ""
        })),
        answer: q.answer.trim(),
        explanation: q.explanation || "",
        questionImage: q.questionImage || ""
      };
    });

    // Create the QuestionSet document
    const newQuestionSet = new QuestionSet({
      title: title.trim(),
      faculty: faculty.trim(),
      department: department.trim(),
      status: status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
      questions: validatedQuestions,
      schedule: {
        start: schedule?.start ? new Date(schedule.start) : null,
        end: schedule?.end ? new Date(schedule.end) : null
      },
      createdBy: lecturerId
    });

    // Save the QuestionSet
    const savedQuestionSet = await newQuestionSet.save();

    // Add reference to lecturer's courses (optional - for tracking)
    const course = lecturer.courses.find(c =>
      c._id?.toString() === courseId || c._id === courseId
    );

    if (course) {
      if (!course.questionSets) course.questionSets = [];
      course.questionSets.push(savedQuestionSet._id);
      await lecturer.save();
    }

    res.status(201).json({
      message: "Exam set created successfully with all questions",
      examSet: {
        _id: savedQuestionSet._id,
        title: savedQuestionSet.title,
        faculty: savedQuestionSet.faculty,
        department: savedQuestionSet.department,
        status: savedQuestionSet.status,
        questionsCount: savedQuestionSet.questions.length,
        schedule: savedQuestionSet.schedule,
        createdAt: savedQuestionSet.createdAt,
        createdBy: savedQuestionSet.createdBy
      },
      totalQuestions: validatedQuestions.length
    });
  } catch (e) {
    console.error("Create exam set error:", e);
    res.status(500).json({
      message: "Failed to create exam set",
      error: e.message
    });
  }
});
/**
 * GET /api/lecturer/exam-sets/:examSetId/submissions
 * Fetch all student submissions (Results) for a specific Exam Set
 */
router.get("/exam-sets/:examSetId/submissions", authenticate, isLecturer, async (req, res) => {
  try {
    const { examSetId } = req.params;

    // 1. Verify the exam set exists
    const questionSet = await QuestionSet.findById(examSetId);
    if (!questionSet) {
      return res.status(404).json({ message: "Exam set not found" });
    }

    // 2. Verify the lecturer requesting this actually created the exam set
    if (questionSet.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Access denied. You are not the creator of this exam set"
      });
    }

    // 3. Fetch all results linked to this exam set
    // Populate the 'user' reference to get the student's name and matric number
    const results = await Result.find({ examSet: examSetId })
      .populate("user", "fullname username studentId matricNumber")
      .sort({ submittedAt: -1 }) // Newest submissions first
      .lean();

    // 4. Map the data into the exact format expected by the submissions.html frontend
    const submissions = results.map(r => ({
      _id: r._id,
      studentName: r.user ? (r.user.fullname || r.user.username || "Anonymous") : "Unknown Student",
      matric: r.user ? (r.user.studentId || r.user.matricNumber || "N/A") : "N/A",
      score: r.score || 0,
      timeTaken: Math.round((r.timeTaken || 0) / 60), // Assuming DB stores seconds, UI expects mins. Remove "/ 60" if DB is already in minutes.
      submittedAt: r.submittedAt
    }));

    res.json({
      count: submissions.length,
      submissions: submissions
    });

  } catch (e) {
    console.error("Get submissions error:", e);
    res.status(500).json({
      message: "Failed to retrieve submissions",
      error: e.message
    });
  }
});

/**
 * GET /api/lecturer/exam-sets/:examSetId
 * Retrieve full exam set with all questions
 */
router.get("/exam-sets/:examSetId", authenticate, isLecturer, async (req, res) => {
  try {
    const { examSetId } = req.params;

    const questionSet = await QuestionSet.findById(examSetId).populate(
      "createdBy",
      "fullname email"
    );

    if (!questionSet) {
      return res.status(404).json({ message: "Exam set not found" });
    }

    // Verify lecturer is the creator
    if (questionSet.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Access denied. You are not the creator of this exam set"
      });
    }

    res.json({
      _id: questionSet._id,
      title: questionSet.title,
      faculty: questionSet.faculty,
      department: questionSet.department,
      status: questionSet.status,
      schedule: questionSet.schedule,
      questions: questionSet.questions,
      questionsCount: questionSet.questions.length,
      createdAt: questionSet.createdAt,
      updatedAt: questionSet.updatedAt
    });
  } catch (e) {
    console.error("Get exam set error:", e);
    res.status(500).json({
      message: "Failed to retrieve exam set",
      error: e.message
    });
  }
});

/**
 * PUT /api/lecturer/exam-sets/:examSetId
 * Update exam set and/or questions
 */
router.put("/exam-sets/:examSetId", authenticate, isLecturer, async (req, res) => {
  try {
    const { examSetId } = req.params;
    const { title, status, schedule, questions } = req.body;

    const questionSet = await QuestionSet.findById(examSetId);

    if (!questionSet) {
      return res.status(404).json({ message: "Exam set not found" });
    }

    // Verify lecturer is the creator
    if (questionSet.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Access denied. You are not the creator of this exam set"
      });
    }

    // Update fields
    if (title) questionSet.title = title.trim();
    if (status) questionSet.status = status === "ACTIVE" ? "ACTIVE" : "INACTIVE";
    if (schedule) {
      questionSet.schedule = {
        start: schedule.start ? new Date(schedule.start) : questionSet.schedule?.start,
        end: schedule.end ? new Date(schedule.end) : questionSet.schedule?.end
      };
    }

    // Update questions if provided
    if (Array.isArray(questions) && questions.length > 0) {
      const validatedQuestions = questions.map((q, idx) => {
        if (!q.question || !Array.isArray(q.options) || !q.answer) {
          throw new Error(
            `Question ${idx + 1} is missing required fields`
          );
        }

        return {
          id: q.id || idx + 1,
          question: q.question.trim(),
          options: q.options.map(opt => ({
            text: opt.text?.trim() || "",
            image: opt.image || ""
          })),
          answer: q.answer.trim(),
          explanation: q.explanation || "",
          questionImage: q.questionImage || ""
        };
      });

      questionSet.questions = validatedQuestions;
    }

    const updated = await questionSet.save();

    res.json({
      message: "Exam set updated successfully",
      examSet: {
        _id: updated._id,
        title: updated.title,
        faculty: updated.faculty,
        department: updated.department,
        status: updated.status,
        questionsCount: updated.questions.length,
        schedule: updated.schedule,
        updatedAt: updated.updatedAt
      }
    });
  } catch (e) {
    console.error("Update exam set error:", e);
    res.status(500).json({
      message: "Failed to update exam set",
      error: e.message
    });
  }
});

/**
 * DELETE /api/lecturer/exam-sets/:examSetId
 * Delete an exam set
 */
router.delete("/exam-sets/:examSetId", authenticate, isLecturer, async (req, res) => {
  try {
    const { examSetId } = req.params;

    const questionSet = await QuestionSet.findById(examSetId);

    if (!questionSet) {
      return res.status(404).json({ message: "Exam set not found" });
    }

    // Verify lecturer is the creator
    if (questionSet.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Access denied. You are not the creator of this exam set"
      });
    }

    await QuestionSet.findByIdAndDelete(examSetId);

    res.json({
      message: "Exam set deleted successfully"
    });
  } catch (e) {
    console.error("Delete exam set error:", e);
    res.status(500).json({
      message: "Failed to delete exam set",
      error: e.message
    });
  }
});

/**
 * POST /api/lecturer/exam-sets/:examSetId/add-questions
 * Add additional questions to an existing exam set
 */
router.post("/exam-sets/:examSetId/add-questions", authenticate, isLecturer, async (req, res) => {
  try {
    const { examSetId } = req.params;
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        message: "No questions provided"
      });
    }

    const questionSet = await QuestionSet.findById(examSetId);

    if (!questionSet) {
      return res.status(404).json({ message: "Exam set not found" });
    }

    // Verify lecturer is the creator
    if (questionSet.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Access denied. You are not the creator of this exam set"
      });
    }

    // Validate and prepare new questions
    const newQuestions = questions.map((q, idx) => {
      if (!q.question || !Array.isArray(q.options) || !q.answer) {
        throw new Error(`Question ${idx + 1} is missing required fields`);
      }

      const nextId = Math.max(...questionSet.questions.map(qst => qst.id || 0)) + 1;

      return {
        id: q.id || nextId + idx,
        question: q.question.trim(),
        options: q.options.map(opt => ({
          text: opt.text?.trim() || "",
          image: opt.image || ""
        })),
        answer: q.answer.trim(),
        explanation: q.explanation || "",
        questionImage: q.questionImage || ""
      };
    });

    questionSet.questions.push(...newQuestions);
    const updated = await questionSet.save();

    res.json({
      message: `${newQuestions.length} question(s) added successfully`,
      examSet: {
        _id: updated._id,
        title: updated.title,
        questionsCount: updated.questions.length,
        addedQuestions: newQuestions.length,
        updatedAt: updated.updatedAt
      }
    });
  } catch (e) {
    console.error("Add questions error:", e);
    res.status(500).json({
      message: "Failed to add questions",
      error: e.message
    });
  }
});
router.post("/questions/bulk", authenticate, isLecturer, async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "No questions provided" });
    }

    const lecturerId = req.user.id;
    const lecturer = await User.findById(lecturerId);
    if (!lecturer) return res.status(404).json({ message: "Lecturer not found" });

    // Build canonical question objects we want to persist (but don't attach yet)
    const builtQuestions = questions.map(q => ({
      _id: new mongoose.Types.ObjectId(),
      question: q.question || "",
      type: q.type || "multiple_choice",
      options: Array.isArray(q.options) ? q.options.map(o => ({ text: o.text || "", image: o.image || "" })) : [],
      answer: q.answer || "",
      course: q.course && mongoose.Types.ObjectId.isValid(q.course) ? new mongoose.Types.ObjectId(q.course) : (q.course || null),
      createdAt: new Date(),
      createdBy: lecturerId
    }));

    // Inspect schema for User.questions BEFORE mutating lecturer
    const questionsPath = User.schema.path('questions');
    let casterInstance = null;
    if (questionsPath) {
      // common inspector patterns
      if (questionsPath.caster && questionsPath.caster.instance) casterInstance = questionsPath.caster.instance;
      else if (questionsPath.instance) casterInstance = questionsPath.instance;
      else if (questionsPath.options && questionsPath.options.type === String) casterInstance = 'String';
    }

    // Normalize instance names
    casterInstance = casterInstance ? String(casterInstance).toLowerCase() : null;

    // --- inside router.post("/questions/bulk", ...) after building builtQuestions and determining casterInstance === 'string' ---
if (casterInstance === 'string') {
  try {
    // create Question docs and save their ids as strings (so they fit the string-array field)
    const createdQuestions = await Questions.insertMany(
      builtQuestions.map(bq => ({
        question: bq.question,
        type: bq.type,
        options: bq.options,
        answer: bq.answer,
        course: bq.course,
        createdBy: lecturerId,
        createdAt: bq.createdAt
      }))
    );

    const idStrings = createdQuestions.map(qd => String(qd._id));
    lecturer.questions = lecturer.questions || [];
    lecturer.questions.push(...idStrings);
    await lecturer.save();

    return res.status(201).json({
      message: `${idStrings.length} questions created in Question collection and linked (string-id fallback)`,
      created: idStrings.length,
      mode: "string-id-fallback",
      warning: "User.questions is configured as array of strings in this deployment; storing question._id as string so it can be resolved later."
    });
  } catch (err) {
    console.error("Failed to create Question documents for string-fallback:", err);
    return res.status(500).json({
      message: "Failed to save questions on fallback (creating Question docs)",
      error: err.message
    });
  }
}
    
    // 2) If schema expects ObjectId -> create Question docs and store their _ids
    if (casterInstance === 'objectid' || casterInstance === 'objectid' || casterInstance === 'objectid') {
      try {
        const createdQuestions = await Questions.insertMany(
          builtQuestions.map(bq => ({
            question: bq.question,
            type: bq.type,
            options: bq.options,
            answer: bq.answer,
            course: bq.course,
            createdBy: lecturerId,
            createdAt: bq.createdAt
          }))
        );

        const ids = createdQuestions.map(qd => qd._id);
        lecturer.questions = lecturer.questions || [];
        lecturer.questions.push(...ids);
        await lecturer.save();

        return res.status(201).json({
          message: `${ids.length} questions created in Question collection and linked (fallback)`,
          created: ids.length,
          mode: "reference-fallback",
          warning: "Questions stored as references (ObjectIds) in lecturer.questions."
        });
      } catch (createErr) {
        console.error("Failed to create Question documents during fallback:", createErr);
        return res.status(500).json({
          message: "Failed to save questions on fallback (creating Question docs)",
          error: createErr.message
        });
      }
    }

    // 3) Otherwise assume embedded subdocuments are allowed -> store full objects
    lecturer.questions = lecturer.questions || [];
    lecturer.questions.push(...builtQuestions);

    try {
      await lecturer.save();
      return res.status(201).json({
        message: `${builtQuestions.length} questions added successfully as subdocuments`,
        created: builtQuestions.length,
        mode: "embedded"
      });
    } catch (saveErr) {
      console.warn("Bulk questions error: save of embedded attempt failed:", saveErr.message || saveErr);
      // As a final step, try the safer fallbacks by reloading fresh doc

      const freshLecturer = await User.findById(lecturerId);
      const fallbackPath = User.schema.path('questions');
      let fallbackCaster = fallbackPath && fallbackPath.caster && fallbackPath.caster.instance ? String(fallbackPath.caster.instance).toLowerCase() : null;

      if (fallbackCaster === 'string') {
        const texts = builtQuestions.map(bq => bq.question);
        freshLecturer.questions = freshLecturer.questions || [];
        freshLecturer.questions.push(...texts);
        await freshLecturer.save();
        return res.status(201).json({
          message: `${texts.length} questions saved as strings (fallback)`,
          created: texts.length,
          mode: "string-fallback",
          warning: "User.questions is configured as array of strings in this deployment."
        });
      }

      if (fallbackCaster === 'objectid') {
        try {
          const createdQuestions = await Questions.insertMany(
            builtQuestions.map(bq => ({
              question: bq.question,
              type: bq.type,
              options: bq.options,
              answer: bq.answer,
              course: bq.course,
              createdBy: lecturerId,
              createdAt: bq.createdAt
            }))
          );

          const ids = createdQuestions.map(qd => qd._id);
          freshLecturer.questions = freshLecturer.questions || [];
          freshLecturer.questions.push(...ids);
          await freshLecturer.save();

          return res.status(201).json({
            message: `${ids.length} questions created in Question collection and linked (fallback)`,
            created: ids.length,
            mode: "reference-fallback",
            warning: "Questions stored as references (ObjectIds) in lecturer.questions."
          });
        } catch (createErr) {
          console.error("Failed to create Question documents during fallback:", createErr);
          return res.status(500).json({
            message: "Failed to save questions on fallback (creating Question docs)",
            error: createErr.message
          });
        }
      }

      // unknown caster -> return save error
      console.error("Unrecognized User.questions caster after failed embedded save; returning save error.");
      return res.status(500).json({ message: "Server error", error: saveErr.message });
    }

  } catch (e) {
    console.error("Bulk questions internal error:", e);
    return res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ============================================
// 5. EXAMS SCHEDULING - returns embedded exams and QuestionSet authored by lecturer
// ============================================

/**
 * GET /api/lecturer/exams
 * - Returns embedded lecturer.exams and QuestionSet documents authored by lecturer.
 * - Query params:
 *    - includeQuestions=true -> include full questions array for question-set items
 *    - source=embedded|questionset|all -> filter returned items by source (default all)
 */
router.get("/exams", authenticate, isLecturer, async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const includeQuestions = String(req.query.includeQuestions || '').toLowerCase() === 'true';
    const sourceFilter = (req.query.source || 'all').toLowerCase(); // 'embedded' | 'questionset' | 'all'

    const lecturer = await User.findById(lecturerId);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    // Legacy embedded exams
    const embeddedExams = lecturer.exams || [];
    const mappedEmbedded = embeddedExams.map(e => ({
      _id: e._id,
      course: e.course,
      title: e.title || "Exam",
      startDate: e.startDate,
      endDate: e.endDate,
      duration: e.duration || 0,
      levels: e.levels || [],
      totalStudents: e.students?.length || 0,
      status: e.status || "scheduled",
      questionsCount: e.questions?.length || 0,
      source: 'embedded'
    }));

    // Fetch QuestionSet documents created by this lecturer
    let questionSets = [];
    try {
      questionSets = await QuestionSet.find({ createdBy: lecturerId }).lean();
    } catch (err) {
      console.warn("Failed to fetch QuestionSet documents:", err.message || err);
      questionSets = [];
    }

    const mappedQuestionSets = questionSets.map(qs => {
      const base = {
        _id: qs._id,
        course: qs.department || null,
        title: qs.title,
        startDate: qs.schedule?.start || null,
        endDate: qs.schedule?.end || null,
        duration: null,
        levels: [],
        totalStudents: 0,
        status: qs.status || "INACTIVE",
        questionsCount: Array.isArray(qs.questions) ? qs.questions.length : 0,
        faculty: qs.faculty || null,
        createdAt: qs.createdAt || qs.createdAt,
        source: 'questionset'
      };
      if (includeQuestions) {
        base.questions = qs.questions || [];
      }
      return base;
    });

    // Combine and optionally filter by source
    let exams = [];
    if (sourceFilter === 'embedded') exams = mappedEmbedded;
    else if (sourceFilter === 'questionset') exams = mappedQuestionSets;
    else exams = mappedEmbedded.concat(mappedQuestionSets);

    res.json({
      count: exams.length,
      exams
    });
  } catch (e) {
    console.error("Get exams error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

/**
 * GET /api/lecturer/question-sets
 * - Returns QuestionSet documents createdBy the lecturer.
 * - Query params:
 *    - includeQuestions=true  -> include full questions array
 *    - status=ACTIVE|INACTIVE  -> filter by status
 *    - faculty, department      -> optional filters
 */
router.get("/question-sets", authenticate, isLecturer, async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const includeQuestions = String(req.query.includeQuestions || '').toLowerCase() === 'true';
    const statusFilter = req.query.status;
    const facultyFilter = req.query.faculty;
    const departmentFilter = req.query.department;

    const query = { createdBy: lecturerId };
    if (statusFilter) query.status = statusFilter;
    if (facultyFilter) query.faculty = facultyFilter;
    if (departmentFilter) query.department = departmentFilter;

    const sets = await QuestionSet.find(query).lean();

    const mapped = sets.map(s => {
      const out = {
        _id: s._id,
        title: s.title,
        status: s.status,
        faculty: s.faculty,
        department: s.department,
        questionsCount: Array.isArray(s.questions) ? s.questions.length : 0,
        schedule: s.schedule || null,
        createdBy: s.createdBy || null,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        source: 'questionset'
      };
      if (includeQuestions) out.questions = s.questions || [];
      return out;
    });

    res.json({
      count: mapped.length,
      questionSets: mapped
    });
  } catch (e) {
    console.error("Get question-sets error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// POST /api/lecturer/exams (legacy) and PUT/DELETE operate on embedded lecturer.exams

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
        gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 }
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
// ===========================================
// 1. GET ASSIGNMENT DETAILS
// ===========================================

router.get("/assignments/:assignmentId", authenticate, isLecturer, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const lecturerId = req.user.id;

    const assignment = await Questions.findById(assignmentId)
      .select("title question description dueDate course createdAt type");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const lecturer = await User.findById(lecturerId).select("courses");
    const courseExists = lecturer.courses.some(c => c._id.toString() === assignment.course.toString());

    if (!courseExists) {
      return res.status(403).json({ message: "Access denied. You do not own this assignment." });
    }

    const course = lecturer.courses.id(assignment.course);

    res.json({
      assignment: {
        _id: assignment._id,
        title: assignment.title || "Assignment",
        question: assignment.question,
        description: assignment.description,
        dueDate: assignment.dueDate,
        courseCode: course.code,
        courseName: course.title,
        type: assignment.type,
        createdAt: assignment.createdAt
      }
    });

  } catch (e) {
    console.error("Fetch assignment error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ===========================================
// 2. GET ALL SUBMISSIONS FOR AN ASSIGNMENT
// ===========================================

router.get("/assignments/:assignmentId/submissions", authenticate, isLecturer, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const lecturerId = req.user.id;

    const assignment = await Questions.findById(assignmentId).select("course");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const lecturer = await User.findById(lecturerId).select("courses");
    const courseExists = lecturer.courses.some(c => c._id.toString() === assignment.course.toString());

    if (!courseExists) {
      return res.status(403).json({ message: "Access denied" });
    }

    const submissions = await AssignmentSubmission.find({ assignment: assignmentId })
      .populate('student', 'fullname studentId email')
      .select('_id student textSubmission submissionType attachments attempt isLate status score feedback privateNotes gradedBy gradedAt submittedAt')
      .sort({ submittedAt: -1 })
      .lean();

    const enrichedSubmissions = submissions.map(sub => ({
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
      attempt: sub.attempt,
      isLate: sub.isLate,
      status: sub.status,
      score: sub.score,
      feedback: sub.feedback,
      privateNotes: sub.privateNotes,
      gradedBy: sub.gradedBy,
      gradedAt: sub.gradedAt,
      submittedAt: sub.submittedAt
    }));

    res.json({
      message: "Submissions retrieved successfully",
      submissions: enrichedSubmissions,
      total: enrichedSubmissions.length,
      graded: enrichedSubmissions.filter(s => s.status === 'graded').length,
      pending: enrichedSubmissions.filter(s => s.status === 'submitted').length
    });

  } catch (e) {
    console.error("Fetch submissions error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ===========================================
// 3. GET SINGLE SUBMISSION DETAILS
// ===========================================

router.get("/submission/:submissionId", authenticate, isLecturer, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const lecturerId = req.user.id;

    const submission = await AssignmentSubmission.findById(submissionId)
      .populate('student', 'fullname studentId email')
      .populate('gradedBy', 'fullname');

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
        attempt: submission.attempt,
        isLate: submission.isLate,
        status: submission.status,
        score: submission.score,
        feedback: submission.feedback,
        privateNotes: submission.privateNotes,
        gradedBy: submission.gradedBy?.fullname || 'System',
        gradedAt: submission.gradedAt,
        submittedAt: submission.submittedAt
      }
    });

  } catch (e) {
    console.error("Fetch submission error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ===========================================
// 4. GRADE A SUBMISSION
// ===========================================

router.post("/submission/:submissionId/grade", authenticate, isLecturer, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const lecturerId = req.user.id;
    const { score, feedback, privateNotes } = req.body;

    if (score === undefined || score === null) {
      return res.status(400).json({ message: "Score is required" });
    }

    if (isNaN(score) || score < 0 || score > 100) {
      return res.status(400).json({ message: "Score must be between 0 and 100" });
    }

    if (!feedback || feedback.trim() === "") {
      return res.status(400).json({ message: "Feedback is required" });
    }

    const submission = await AssignmentSubmission.findById(submissionId);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (submission.lecturer.toString() !== lecturerId) {
      return res.status(403).json({ message: "Access denied" });
    }

    submission.score = score;
    submission.feedback = feedback;
    submission.privateNotes = privateNotes || "";
    submission.status = "graded";
    submission.gradedBy = lecturerId;
    submission.gradedAt = new Date();

    await submission.save();

    res.json({
      message: "Grade submitted successfully",
      submission: {
        _id: submission._id,
        score: submission.score,
        feedback: submission.feedback,
        privateNotes: submission.privateNotes,
        status: submission.status,
        gradedAt: submission.gradedAt
      }
    });

  } catch (e) {
    console.error("Grade submission error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ===========================================
// 5. GET SUBMISSION STATISTICS
// ===========================================

router.get("/assignments/:assignmentId/statistics", authenticate, isLecturer, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const lecturerId = req.user.id;

    const assignment = await Questions.findById(assignmentId).select("course");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const lecturer = await User.findById(lecturerId).select("courses");
    const courseExists = lecturer.courses.some(c => c._id.toString() === assignment.course.toString());

    if (!courseExists) {
      return res.status(403).json({ message: "Access denied" });
    }

    const submissions = await AssignmentSubmission.find({ assignment: assignmentId })
      .select('score status submittedAt')
      .lean();

    const total = submissions.length;
    const graded = submissions.filter(s => s.status === 'graded').length;
    const pending = submissions.filter(s => s.status === 'submitted').length;
    const scores = submissions.filter(s => s.score !== null && s.score !== undefined).map(s => s.score);

    const average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const highest = scores.length > 0 ? Math.max(...scores) : 0;
    const lowest = scores.length > 0 ? Math.min(...scores) : 0;

    const distribution = {
      excellent: scores.filter(s => s >= 80).length,
      good: scores.filter(s => s >= 70 && s < 80).length,
      satisfactory: scores.filter(s => s >= 60 && s < 70).length,
      fair: scores.filter(s => s >= 50 && s < 60).length,
      poor: scores.filter(s => s < 50).length
    };

    res.json({
      statistics: {
        total,
        graded,
        pending,
        average: average.toFixed(2),
        highest,
        lowest,
        distribution
      }
    });

  } catch (e) {
    console.error("Fetch statistics error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ===========================================
// 6. BULK EXPORT SUBMISSIONS
// ===========================================

router.get("/assignments/:assignmentId/export", authenticate, isLecturer, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const lecturerId = req.user.id;

    const assignment = await Questions.findById(assignmentId).select("title course");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const lecturer = await User.findById(lecturerId).select("courses");
    const courseExists = lecturer.courses.some(c => c._id.toString() === assignment.course.toString());

    if (!courseExists) {
      return res.status(403).json({ message: "Access denied" });
    }

    const submissions = await AssignmentSubmission.find({ assignment: assignmentId })
      .populate('student', 'fullname studentId email')
      .select('student score status feedback submittedAt')
      .sort({ submittedAt: -1 })
      .lean();

    const csvData = submissions.map(sub => ({
      studentName: sub.student.fullname,
      studentId: sub.student.studentId,
      email: sub.student.email,
      score: sub.score || 'Not Graded',
      status: sub.status,
      submittedAt: new Date(sub.submittedAt).toLocaleString(),
      feedback: normalizeText(sub.feedback)
    }));

    res.json({
      assignment: assignment.title,
      exportDate: new Date().toISOString(),
      totalSubmissions: submissions.length,
      data: csvData
    });

  } catch (e) {
    console.error("Export submissions error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// ===========================================
// 7. SEARCH SUBMISSIONS
// ===========================================

router.post("/assignments/:assignmentId/search", authenticate, isLecturer, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const lecturerId = req.user.id;
    const { query, status, minScore, maxScore } = req.body;

    const assignment = await Questions.findById(assignmentId).select("course");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const lecturer = await User.findById(lecturerId).select("courses");
    const courseExists = lecturer.courses.some(c => c._id.toString() === assignment.course.toString());

    if (!courseExists) {
      return res.status(403).json({ message: "Access denied" });
    }

    let filter = { assignment: assignmentId };

    if (status) {
      filter.status = status;
    }

    if (minScore !== undefined || maxScore !== undefined) {
      filter.score = {};
      if (minScore !== undefined) filter.score.$gte = minScore;
      if (maxScore !== undefined) filter.score.$lte = maxScore;
    }

    let submissions = await AssignmentSubmission.find(filter)
      .populate('student', 'fullname studentId email')
      .select('_id student textSubmission submissionType attachments status score feedback submittedAt')
      .lean();

    if (query) {
      const lowerQuery = query.toLowerCase();
      submissions = submissions.filter(sub =>
        sub.student.fullname.toLowerCase().includes(lowerQuery) ||
        sub.student.studentId.toLowerCase().includes(lowerQuery) ||
        sub.student.email.toLowerCase().includes(lowerQuery) ||
        normalizeText(sub.textSubmission).includes(lowerQuery)
      );
    }

    res.json({
      message: "Search completed",
      total: submissions.length,
      submissions
    });

  } catch (e) {
    console.error("Search submissions error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});
// ============================================
// 8. REPORTS
// ============================================

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
        data: results.map(r => ({ student: r.student, score: r.score, date: r.submittedAt }))
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

      res.json({ type: "Grade Distribution Report", data: gradeDistribution });
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

// Add this route to lecturerDashboard.js
router.get("/courses/:courseId/overview", authenticate, isLecturer, async (req, res) => {
  try {
    const { courseId } = req.params;
    const lecturerId = req.user.id;

    // Find the lecturer's course
    const lecturer = await User.findById(lecturerId);
    
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    const course = lecturer.courses.id(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Count enrolled students
    const enrolledCount = course.students ? course.students.length : 0;

    // Count active assignments
    const assignments = await Questions.countDocuments({
      course: courseId,
      type: "assignment"
    });

    // Count active exam sets
    const examSets = await QuestionSet.countDocuments({
      createdBy: lecturerId,
      status: "ACTIVE"
    });

    // Calculate average performance (if results exist)
    const results = lecturer.results || [];
    const courseResults = results.filter(r => 
      r.course && r.course.toString() === courseId
    );
    
    let averagePerformance = 0;
    if (courseResults.length > 0) {
      const totalScore = courseResults.reduce((sum, r) => sum + (r.score || 0), 0);
      averagePerformance = Math.round(totalScore / courseResults.length);
    }

    res.json({
      message: "Course overview retrieved successfully",
      overview: {
        courseId: course._id,
        courseCode: course.code,
        courseTitle: course.title,
        courseDescription: course.description,
        level: course.level,
        totalEnrolled: enrolledCount,
        activeAssignments: assignments,
        activeExams: examSets,
        averagePerformance: averagePerformance
      }
    });

  } catch (e) {
    console.error("Fetch course overview error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

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

export default router;
