import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import CodecxRegistration from "../models/CodecxRegistration.js";
import User from "../models/User.js";
import Quiz from "../models/Quiz.js";

dotenv.config();
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- Helper middlewares ---
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Missing token" });
  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Utility functions
function generateUsername(matricNumber, fullName) {
  if (matricNumber) return matricNumber.trim();
  return (fullName.replace(/\s+/g, "").toLowerCase() + Math.floor(Math.random()*1000));
}
function generatePassword() {
  return "Codecx" + Math.floor(10000 + Math.random() * 90000);
}

// --- ENROLL NEW STUDENT (ADMIN) ---
router.post('/admin/enroll', upload.fields([{ name: "passport", maxCount: 1 }]), async (req, res) => {
  try {
    const { fullName, email, phone, matricNumber } = req.body;
    if (!fullName || !email || !phone || !matricNumber) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }
    // Prevent duplicate registration
    const existing = await CodecxRegistration.findOne({
      $or: [
        { email },
        { phone },
        { matricNumber }
      ]
    });
    if (existing) {
      let field = '';
      if (existing.email === email) field = 'email';
      else if (existing.matricNumber === matricNumber) field = 'matric number';
      else if (existing.phone === phone) field = 'phone number';
      return res.status(409).json({ message: `Registration failed: This ${field} has already been used.` });
    }
    function fileToBase64(file) {
      if (!file) return "";
      return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    }
    const passportBase64 = fileToBase64(req.files.passport?.[0]);
    const loginUsername = generateUsername(matricNumber, fullName);
    const loginPasswordPlain = generatePassword();
    const loginPasswordHash = await bcrypt.hash(loginPasswordPlain, 12);

    const registration = new CodecxRegistration({
      fullName,
      email,
      phone,
      matricNumber,
      passportBase64,
      loginUsername,
      loginPasswordPlain,
      loginPasswordHash,
      active: true,
      hasPaid: false,
      lastPaymentRef: "",
      courses: [],
      progress: { completed: 0, total: 0, grade: "-" },
      payments: [],
      activities: [],
      chatMessages: []
    });

    await registration.save();

    // Create user account immediately
    let user = await User.findOne({
      $or: [
        { username: loginUsername },
        { email }
      ]
    });
    if (!user) {
      user = new User({
        username: loginUsername,
        password: loginPasswordHash,
        role: "student",
        email,
        fullname: fullName,
        phone,
        active: true
      });
      await user.save();
    }

    res.json({
      message: "Student enrolled successfully!",
      registration,
      login: {
        username: loginUsername,
        password: loginPasswordPlain
      }
    });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// --- ALL SUBMITTED ASSIGNMENTS (ADMIN) ---
router.get('/admin/assignments', async (req, res) => {
  try {
    const students = await CodecxRegistration.find({ assignments: { $exists: true, $not: { $size: 0 } } });
    let assignments = [];
    students.forEach(student => {
      (student.assignments || []).forEach((a, idx) => {
        assignments.push({
          studentId: student._id,
          fullName: student.fullName,
          matricNumber: student.matricNumber,
          passportBase64: student.passportBase64,
          assignmentIndex: idx,
          assignment: a
        });
      });
    });
    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// --- VIEW ASSIGNMENT CODE/FILE (ADMIN) ---
router.get('/admin/assignment/:studentId/:assignmentIndex', async (req, res) => {
  try {
    const { studentId, assignmentIndex } = req.params;
    const student = await CodecxRegistration.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });
    const idx = parseInt(assignmentIndex);
    const assignment = (student.assignments || [])[idx];
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    // If file is a URL, try to fetch it (if stored remotely)
    if (assignment.url && /^https?:/.test(assignment.url)) {
      // If you want to proxy remote code, use node-fetch (optional)
      // If not, just respond with the URL
      return res.json({ url: assignment.url });
    } else {
      // Return code/content property if available
      return res.json({ code: assignment.code || '', ...assignment });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// --- QUIZ QUESTIONS CRUD (ADMIN) ---

// Create a new quiz day (with questions)
router.post('/admin/quiz', async (req, res) => {
  try {
    const { day, topic, questions } = req.body;
    if (!day || !topic || !questions || !Array.isArray(questions) || !questions.length) {
      return res.status(400).json({ message: "All fields required (day, topic, questions[])" });
    }
    let quiz = await Quiz.findOne({ day });
    if (quiz) {
      // Update existing quiz
      quiz.topic = topic;
      quiz.questions = questions;
      await quiz.save();
      res.json({ message: "Quiz updated", quiz });
    } else {
      quiz = new Quiz({ day, topic, questions });
      await quiz.save();
      res.json({ message: "Quiz created", quiz });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get all quizzes (all days)
router.get('/admin/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find({}).sort({ day: 1 });
    res.json({ quizzes });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get quiz for a specific day
router.get('/admin/quiz/:day', async (req, res) => {
  try {
    const day = parseInt(req.params.day);
    const quiz = await Quiz.findOne({ day });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json({ quiz });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Add a single question to a day/topic
router.post('/admin/quiz/:day/question', async (req, res) => {
  try {
    const day = parseInt(req.params.day);
    const { topic, question, options, answer } = req.body;
    if (!question || !options || !answer) {
      return res.status(400).json({ message: "All fields required" });
    }
    let quiz = await Quiz.findOne({ day });
    if (!quiz) {
      quiz = new Quiz({ day, topic, questions: [] });
    }
    quiz.questions.push({ day, topic, question, options, answer });
    await quiz.save();
    res.json({ message: "Question added", quiz });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Edit a question (by index in questions[])
router.put('/admin/quiz/:day/question/:qIdx', async (req, res) => {
  try {
    const day = parseInt(req.params.day);
    const qIdx = parseInt(req.params.qIdx);
    const { question, options, answer } = req.body;
    let quiz = await Quiz.findOne({ day });
    if (!quiz || !quiz.questions[qIdx]) return res.status(404).json({ message: "Question not found" });
    if (question) quiz.questions[qIdx].question = question;
    if (options) quiz.questions[qIdx].options = options;
    if (answer) quiz.questions[qIdx].answer = answer;
    await quiz.save();
    res.json({ message: "Question updated", quiz });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete a question (by index)
router.delete('/admin/quiz/:day/question/:qIdx', async (req, res) => {
  try {
    const day = parseInt(req.params.day);
    const qIdx = parseInt(req.params.qIdx);
    let quiz = await Quiz.findOne({ day });
    if (!quiz || !quiz.questions[qIdx]) return res.status(404).json({ message: "Question not found" });
    quiz.questions.splice(qIdx, 1);
    await quiz.save();
    res.json({ message: "Question deleted", quiz });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// QUIZ: Fetch quiz for a given day (loads real questions from DB)
router.get("/quiz/:day", authMiddleware, async (req, res) => {
  try {
    const day = parseInt(req.params.day);
    if (!day || day < 1 || day > 60) return res.status(400).json({ message: "Invalid day" });

    // Find quiz for this day
    const quiz = await Quiz.findOne({ day });
    if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      return res.status(404).json({ message: "No quiz found for this day." });
    }
    // Only send questions (do not include answers)
    const questions = quiz.questions.map(q => ({
      question: q.question,
      options: q.options,
      // Don't send correct answer to frontend!
      // answer: q.answer // <-- OMITTED
    }));
    res.json({ questions, topic: quiz.topic || "" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/admin', async (req, res) => {
  try {
    const students = await CodecxRegistration.aggregate([
      { $match: { active: true } },           // Only active students
      { $sort: { fullName: 1 } },             // Sort by name
      { $project: {                           // Select fields to show
        _id: 1,
        fullName: 1,
        email: 1,
        phone: 1,
        matricNumber: 1,
        hasPaid: 1,
        payments: 1,
        activities: 1,
        assignments: 1,
        attendance: 1,
        attendanceMarked: 1,
        quizzes: 1,
        courses: 1,
        progress: 1,
        passportBase64: 1
      } }
    ], { allowDiskUse: true });
    const totalStudents = students.length;
    const paidCount = students.filter(s => s.hasPaid).length;
    const unpaidCount = totalStudents - paidCount;
    const assignmentCount = students.reduce((c, s) => c + (s.assignments ? s.assignments.length : 0), 0);

    res.json({
      students,
      stats: { totalStudents, paidCount, unpaidCount, assignmentCount }
    });
  } catch (err) {
    console.error("Admin /all error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET: Get full details ("folder") for a student by id (accessible to any logged-in user for testing)
router.get('/student/:id', async (req, res) => {
  try {
    const candidate = await CodecxRegistration.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Student not found" });
    res.json({
      _id: candidate._id,
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone,
      matricNumber: candidate.matricNumber,
      passportBase64: candidate.passportBase64,
      hasPaid: candidate.hasPaid,
      lastPaymentRef: candidate.lastPaymentRef,
      courses: candidate.courses || [],
      progress: candidate.progress || {},
      payments: candidate.payments || [],
      activities: candidate.activities || [],
      assignments: candidate.assignments || [],
      attendance: candidate.attendance || [],
      attendanceMarked: candidate.attendanceMarked || (candidate.attendance ? candidate.attendance.length : 0),
      quizzes: candidate.quizzes || [],
      adminNote: candidate.adminNote || "",
      chatMessages: candidate.chatMessages || []
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});



router.post('/student/:id/assignment', upload.single("assignment"), async (req, res) => {
  try {
    const { title, mark, date } = req.body;
    const candidate = await CodecxRegistration.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Student not found" });

    let assignmentObj = {
      title: title || (req.file?.originalname || "Assignment"),
      date: date ? new Date(date) : new Date(),
      mark: mark || ""
    };
    if (req.file) {
      // Store as base64 for retrieval
      assignmentObj.fileName = req.file.originalname;
      assignmentObj.fileType = req.file.mimetype;
      assignmentObj.fileData = req.file.buffer.toString("base64");
    }
    candidate.assignments = candidate.assignments || [];
    candidate.assignments.push(assignmentObj);
    candidate.activities.push({ date: new Date(), activity: `Assignment uploaded: ${assignmentObj.title}`, status: "Test" });
    await candidate.save();
    res.json({ message: "Assignment added", assignments: candidate.assignments });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST: Mark attendance for student (accessible to any logged-in user for testing)
router.post('/student/:id/attendance', async (req, res) => {
  try {
    const { status, date } = req.body; // status: Present/Absent/Late
    const candidate = await CodecxRegistration.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Student not found" });
    candidate.attendance = candidate.attendance || [];
    candidate.attendance.push({
      status: status || "Present",
      date: date ? new Date(date) : new Date()
    });
    candidate.attendanceMarked = candidate.attendance.length;
    candidate.activities.push({ date: new Date(), activity: `Attendance marked - ${status || "Present"}`, status: "Test" });
    await candidate.save();
    res.json({ message: "Attendance marked", attendance: candidate.attendance, attendanceMarked: candidate.attendanceMarked });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST: Add quiz result for student (accessible to any logged-in user for testing)
router.post('/student/:id/quiz', async (req, res) => {
  try {
    const { day, score, status } = req.body;
    if (!day) return res.status(400).json({ message: "Quiz day required" });
    const candidate = await CodecxRegistration.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Student not found" });
    candidate.quizzes = candidate.quizzes || [];
    // Prevent duplicate quiz for a day
    if (candidate.quizzes.some(q => String(q.day) === String(day))) {
      return res.status(400).json({ message: "Quiz already exists for this day" });
    }
    candidate.quizzes.push({
      day,
      score: score || 0,
      status: status || "Submitted"
    });
    candidate.activities.push({ date: new Date(), activity: `Quiz completed - Day ${day}`, status: "Test" });
    await candidate.save();
    res.json({ message: "Quiz added", quizzes: candidate.quizzes });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE: Delete candidate by id (accessible to any logged-in user for testing)
router.delete('/admin/candidate/:id', async (req, res) => {
  try {
    const candidate = await CodecxRegistration.findByIdAndDelete(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Student not found" });
    await User.deleteOne({ username: candidate.loginUsername });
    res.json({ message: "Candidate deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});






router.post("/", upload.fields([
  { name: "passport", maxCount: 1 }
]), async (req, res) => {
  try {
    const { fullName, email, phone, matricNumber } = req.body;
    if (!fullName || !email || !phone || !matricNumber) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    // --- Prevent duplicate registration ---
    const existing = await CodecxRegistration.findOne({
      $or: [
        { email: email },
        { phone: phone },
        { matricNumber: matricNumber }
      ]
    });
    if (existing) {
      // Find which field is duplicated
      let field = '';
      if (existing.email === email) field = 'email';
      else if (existing.matricNumber === matricNumber) field = 'matric number';
      else if (existing.phone === phone) field = 'phone number';
      return res.status(409).json({ message: `Registration failed: This ${field} has already been used for registration.` });
    }

    function fileToBase64(file) {
      if (!file) return "";
      return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    }
    const passportBase64 = fileToBase64(req.files.passport?.[0]);
    const loginUsername = generateUsername(matricNumber, fullName);
    const loginPasswordPlain = generatePassword();
    const loginPasswordHash = await bcrypt.hash(loginPasswordPlain, 12);

    const registration = new CodecxRegistration({
      fullName,
      email,
      phone,
      matricNumber,
      passportBase64,
      loginUsername,
      loginPasswordPlain,
      loginPasswordHash,
      active: true,
      hasPaid: false,
      lastPaymentRef: "",
      courses: [],
      progress: { completed: 0, total: 0, grade: "-" },
      payments: [],
      activities: [],
      chatMessages: []
    });

    await registration.save();

    // Create user account immediately
    let user = await User.findOne({
      $or: [
        { username: loginUsername },
        { email: email }
      ]
    });
    if (!user) {
      user = new User({
        username: loginUsername,
        password: loginPasswordHash,
        role: "admin",
        email: email,
        fullname: fullName,
        phone: phone,
        active: true
      });
      await user.save();
    }

    res.json({
      message: "Registration received successfully!",
      registration,
      login: {
        username: loginUsername,
        password: loginPasswordPlain
      }
    });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// Score a quiz for a given day
router.post("/quiz/score/:day", async (req, res) => {
  try {
    const day = parseInt(req.params.day);
    const { answers } = req.body;
    if (!day || day < 1 || day > 60) return res.status(400).json({ message: "Invalid day" });
    if (!answers || !Array.isArray(answers)) return res.status(400).json({ message: "Answers required as array" });

    const quiz = await Quiz.findOne({ day });
    if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      return res.status(404).json({ message: "No quiz found for this day." });
    }

    let score = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] && answers[idx] === q.answer) score++;
    });

    res.json({ score, total: quiz.questions.length });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// POST: Add quiz result for student (accessible to any logged-in user for testing)
router.post('/student/:id/quiz', async (req, res) => {
  try {
    const { day, score, status } = req.body;
    if (!day) return res.status(400).json({ message: "Quiz day required" });
    const candidate = await CodecxRegistration.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Student not found" });
    candidate.quizzes = candidate.quizzes || [];
    // Prevent duplicate quiz for a day
    if (candidate.quizzes.some(q => String(q.day) === String(day))) {
      return res.status(400).json({ message: "Quiz already exists for this day" });
    }
    candidate.quizzes.push({
      day,
      score: score || 0,
      status: status || "Submitted"
    });
    candidate.activities.push({ date: new Date(), activity: `Quiz completed - Day ${day}`, status: "Test" });
    await candidate.save();
    res.json({ message: "Quiz added", quizzes: candidate.quizzes });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "Username and password required." });

    const candidate = await CodecxRegistration.findOne({
      $or: [
        { loginUsername: username },
        { matricNumber: username },
        { email: username }
      ]
    });

    if (!candidate)
      return res.status(401).json({ message: "Invalid username or password." });

    if (!candidate.active)
      return res.status(403).json({ message: "Account not yet activated. Please contact admin." });

    const isMatch = await bcrypt.compare(password, candidate.loginPasswordHash);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid username or password." });

    const token = jwt.sign(
      {
        id: candidate._id,
        role: "codecx-candidate",
        email: candidate.email,
        loginUsername: candidate.loginUsername,
        matricNumber: candidate.matricNumber
      },process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "2h" }
    );

    res.json({ token, message: "Login successful!" });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

// GET /me dashboard data
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const candidate = await CodecxRegistration.findById(req.user.id);
    if (!candidate) return res.status(404).json({ message: "User not found" });
    res.json({
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone,
      matricNumber: candidate.matricNumber,
      loginUsername: candidate.loginUsername,
      username: candidate.loginUsername,
      passportBase64: candidate.passportBase64,
      hasPaid: candidate.hasPaid,
      lastPaymentRef: candidate.lastPaymentRef,
      courses: candidate.courses,
      progress: candidate.progress,
      payments: candidate.payments,
      activities: candidate.activities,
      adminNote: candidate.adminNote || "",
      chatMessages: candidate.chatMessages || []
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add course for student (dropdown enforced on frontend)
router.post("/courses", authMiddleware, async (req, res) => {
  try {
    const { courseName } = req.body;
    if (!courseName) return res.status(400).json({ message: "Course name required" });
    const candidate = await CodecxRegistration.findById(req.user.id);
    if (!candidate) return res.status(404).json({ message: "User not found" });

    if (candidate.courses.some(c => c.name === courseName)) {
      return res.status(400).json({ message: "Course already added!" });
    }
    candidate.courses.push({ name: courseName });
    candidate.activities.push({ date: new Date(), activity: `Enrolled in course: ${courseName}`, status: "Success" });
    await candidate.save();

    res.json({ message: "Course added!", courses: candidate.courses });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Remove course for student
router.delete("/courses", authMiddleware, async (req, res) => {
  try {
    const { courseName } = req.body;
    if (!courseName) return res.status(400).json({ message: "Course name required" });
    const candidate = await CodecxRegistration.findById(req.user.id);
    if (!candidate) return res.status(404).json({ message: "User not found" });

    candidate.courses = candidate.courses.filter(c => c.name !== courseName);
    candidate.activities.push({ date: new Date(), activity: `Dropped course: ${courseName}`, status: "Success" });
    await candidate.save();

    res.json({ message: "Course removed!", courses: candidate.courses });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update progress summary (not daily progress, handled by activities)
router.put("/progress", authMiddleware, async (req, res) => {
  try {
    const { completed, total, grade } = req.body;
    const candidate = await CodecxRegistration.findById(req.user.id);
    if (!candidate) return res.status(404).json({ message: "User not found" });

    candidate.progress = {
      completed: completed ?? candidate.progress.completed,
      total: total ?? candidate.progress.total,
      grade: grade ?? candidate.progress.grade
    };
    candidate.activities.push({ date: new Date(), activity: `Progress updated`, status: "Success" });
    await candidate.save();

    res.json({ message: "Progress updated!", progress: candidate.progress });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Record payment (can be called from verification page or webhook)
router.post("/payments", authMiddleware, async (req, res) => {
  try {
    const { amount, ref } = req.body;
    if (!amount || !ref) return res.status(400).json({ message: "Amount and reference required" });
    const candidate = await CodecxRegistration.findById(req.user.id);
    if (!candidate) return res.status(404).json({ message: "User not found" });

    candidate.payments.push({
      date: new Date(),
      amount,
      status: "Paid",
      ref
    });
    candidate.hasPaid = true;
    candidate.lastPaymentRef = ref;
    candidate.activities.push({ date: new Date(), activity: `Payment made: ₦${amount}`, status: "Success" });
    await candidate.save();

    res.json({ message: "Payment recorded!", payments: candidate.payments, hasPaid: candidate.hasPaid, lastPaymentRef: candidate.lastPaymentRef });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add activity (for daily quiz completion, attendance, assignment, etc.)
router.post("/activities", authMiddleware, async (req, res) => {
  try {
    const { activity, status } = req.body;
    if (!activity) return res.status(400).json({ message: "Activity required" });
    const candidate = await CodecxRegistration.findById(req.user.id);
    if (!candidate) return res.status(404).json({ message: "User not found" });

    // Prevent duplicate attendance/quiz for a day
    if (/^Attendance marked - Day (\d+)$/.test(activity)) {
      const day = activity.match(/^Attendance marked - Day (\d+)$/)[1];
      if (candidate.activities.some(a => a.activity === activity)) {
        return res.status(400).json({ message: "Attendance already marked for day " + day });
      }
    }
    if (/^Quiz completed - Day (\d+)$/.test(activity)) {
      const day = activity.match(/^Quiz completed - Day (\d+)$/)[1];
      if (candidate.activities.some(a => a.activity === activity)) {
        return res.status(400).json({ message: "Quiz already completed for day " + day });
      }
    }

    candidate.activities.push({
      date: new Date(),
      activity,
      status: status || "Success"
    });
    await candidate.save();

    res.json({ message: "Activity added!", activities: candidate.activities });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// QUIZ: Fetch quiz for a given day (example demo; replace with dynamic if needed)
router.get("/quiz/:day", authMiddleware, async (req, res) => {
  const day = parseInt(req.params.day);
  if (!day || day < 1 || day > 60) return res.status(400).json({ message: "Invalid day" });
  // Demo: generate 10 sample quiz questions per day
  let topic = "";
  if (day <= 20) topic = "HTML";
  else if (day <= 40) topic = "CSS";
  else topic = "JavaScript";
  const questions = [];
  for (let i = 1; i <= 10; i++) {
    questions.push({
      question: `${topic} Sample Question ${i} (Day ${day})`,
      options: [
        `${topic} Option A`,
        `${topic} Option B`,
        `${topic} Option C`,
        `${topic} Option D`
      ],
      answer: `${topic} Option A`
    });
  }
  res.json({ questions });
});

// COMMUNITY CHAT - Get all messages
router.get("/chat", authMiddleware, async (req, res) => {
  try {
    const candidate = await CodecxRegistration.findById(req.user.id);
    if (!candidate) return res.status(404).json({ message: "User not found" });

    // Fetch all messages for all users (global chat)
    // For demo, we'll use all chatMessages from all students
    const allStudents = await CodecxRegistration.find({}, { chatMessages: 1, fullName: 1, passportBase64: 1 });
    let allMessages = [];
    allStudents.forEach(s => {
      if (Array.isArray(s.chatMessages)) {
        s.chatMessages.forEach(m => {
          allMessages.push({
            ...m,
            sender: s.fullName,
            avatar: s.passportBase64 || "",
            me: String(s._id) === String(candidate._id) && m.me === true
          });
        });
      }
    });
    // Sort by date ascending
    allMessages.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json({ chatMessages: allMessages });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// COMMUNITY CHAT - Post a new message
router.post("/chat", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: "Text required" });
    const candidate = await CodecxRegistration.findById(req.user.id);
    if (!candidate) return res.status(404).json({ message: "User not found" });

    // Add to this student's chatMessages
    candidate.chatMessages = candidate.chatMessages || [];
    candidate.chatMessages.push({
      me: true,
      sender: candidate.fullName,
      avatar: candidate.passportBase64,
      text,
      date: new Date()
    });
    await candidate.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// --- Paystack Webhook for automatic payment update ---
router.post("/paystack-webhook", express.json({ type: "application/json" }), async (req, res) => {
  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "sk_test_xxx";
  const signature = req.headers["x-paystack-signature"];
  const hash = crypto.createHmac("sha512", PAYSTACK_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");
  if (hash !== signature) return res.status(401).send("Invalid signature");

  const event = req.body;
  if (event.event === "charge.success" && event.data && event.data.status === "success") {
    const email = event.data.customer.email;
    const matricNumber = event.data.metadata ? event.data.metadata.matricNumber : null;
    let student = null;
    if (matricNumber) {
      student = await CodecxRegistration.findOne({ matricNumber });
    } else {
      student = await CodecxRegistration.findOne({ email });
    }
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Prevent duplicate payment records
    const alreadyPaid = student.payments.some(p => p.ref === event.data.reference);
    if (alreadyPaid) return res.status(200).json({ message: "Payment already recorded" });

    student.hasPaid = true;
    student.lastPaymentRef = event.data.reference;
    student.payments.push({
      date: new Date(),
      amount: event.data.amount / 100,
      status: "Paid",
      ref: event.data.reference
    });
    student.activities.push({ date: new Date(), activity: `Payment made via Paystack: ₦${event.data.amount / 100}`, status: "Success" });
    await student.save();
    return res.status(200).json({ message: "Student payment updated" });
  }
  // Respond quickly to all events (Paystack expects 2xx)
  return res.status(200).json({ received: true });
});

export default router;
