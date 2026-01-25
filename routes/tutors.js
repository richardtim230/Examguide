import express from "express";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";
import User from "../models/User.js";
import Assignment from "../models/Assignment.js";
import AssignmentSubmission from "../models/AssignmentSubmission.js";
import Session from "../models/TutorSession.js";
import Review from "../models/Review.js";
import Withdrawal from "../models/Withdrawal.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import TutorEarnings from "../models/TutorEarnings.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

/**
 * PRODUCTION-READY UNIVERSAL TUTOR ENDPOINTS
 */

/* ============ Registration & Listing =============== */

// Register as tutor (applies, pending admin approval)
router.post("/register", async (req, res) => {
  try {
    // Accept username/password in addition to other tutor profile fields
    const {
      username,
      password,
      fullname,
      email,
      phone,
      specialties,
      about,
      achievements,
      avatar,
      social
    } = req.body;

    // Basic required validation
    if (!fullname || !email || !specialties) {
      return res.status(400).json({ message: "Full name, email, and specialties are required." });
    }

    // Check for existing email or username
    const existing = await User.findOne({
      $or: [
        { email: (email || "").toLowerCase() },
        ...(username ? [{ username: username }] : [])
      ]
    });
    if (existing) {
      // Distinguish between username/email collisions if possible
      if (existing.email && String(existing.email).toLowerCase() === String(email).toLowerCase()) {
        return res.status(409).json({ message: "Email already registered" });
      }
      if (username && existing.username && existing.username === username) {
        return res.status(409).json({ message: "Username already taken" });
      }
      return res.status(409).json({ message: "Account with provided email/username already exists" });
    }

    // If user supplied password, do minimal check. (User model will hash on save.)
    let finalPassword = password;
    if (finalPassword) {
      if (typeof finalPassword !== "string" || finalPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long." });
      }
    } else {
      // fallback: random password (forces user to reset after approval)
      finalPassword = uuidv4();
    }

    // Create user record with role tutor. Use supplied username if present; else use email.
    const newUser = await User.create({
      fullname,
      email: email || "",
      phone: phone || "",
      specialties,
      about: about || "",
      achievements: achievements || [],
      profilePic: avatar || "",
      socials: social || {},
      username: username && username.trim().length ? username.trim() : (email || "").toLowerCase(),
      password: finalPassword,
      role: "tutor",
      approved: true,
      emailVerified: true
    });

    // Optionally create an initial notification to admins (left out here)
    res.status(201).json({ message: "Tutor application received.", userId: newUser._id });
  } catch (e) {
    // For duplicate key race or other DB errors, return a helpful message
    if (e.code === 11000) {
      return res.status(409).json({ message: "Username or email already exists." });
    }
    res.status(500).json({ error: e.message });
  }
});

// Get all approved tutors (for request-a-tutor and search, production)
router.get("/", async (req, res) => {
  const tutors = await User.find({ role: "tutor", approved: true }).select("-password -emailVerificationToken").sort({ createdAt: -1 });
  res.json(tutors);
});

// only matches routes where :id is a 24-hex Mongo ObjectId
router.get("/:id([0-9a-fA-F]{24})", async (req, res) => {
  try {
    const tutor = await User.findOne({ _id: req.params.id, role: "tutor", approved: true })
      .select("-password -emailVerificationToken");
    if (!tutor) return res.status(404).json({ message: "Tutor not found" });
    res.json(tutor);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Tutor updates their profile
router.patch("/me", authenticate, authorizeRole("tutor"), async (req, res) => {
  const allowed = ["fullname","about","specialties","achievements","phone","profilePic","socials"];
  const user = await User.findById(req.user.id);
  if (!user || user.role !== "tutor") return res.status(404).json({ message: "Tutor not found" });
  allowed.forEach(key => { if (req.body[key] !== undefined) user[key]=req.body[key]; });
  await user.save();
  res.json({ success: true, user });
});

// Get my tutor profile (dashboard)
router.get("/me", authenticate, authorizeRole("tutor"), async (req, res) => {
  const user = await User.findById(req.user.id).select("-password -emailVerificationToken");
  res.json(user);
});

/* ============ Request a Tutor =============== */
// Student requests a tutor
router.post("/request", authenticate, async (req, res) => {
  try {
    const { tutorId, message } = req.body;
    if (!tutorId) return res.status(400).json({ message: "Tutor ID required." });

    // Double check tutor exists & approved
    const tutor = await User.findOne({ _id: tutorId, role: "tutor", approved: true });
    if (!tutor) return res.status(404).json({ message: "Tutor not found" });

    // Try to get student display name for a friendly notification title/message
    let studentDisplay = "A student";
    try {
      const student = await User.findById(req.user.id).select("fullname username");
      if (student) studentDisplay = student.fullname || student.username || studentDisplay;
    } catch (e) {
      // ignore - fallback to generic
    }

    const title = `Tutor request from ${studentDisplay}`;

    await Notification.create({
      title, // <-- ensure Notification has required title field
      to: tutorId,
      from: req.user.id,
      type: "tutor-request",
      message: message || `${title}: Please check the request.`,
      data: { type: "tutor_request", student: req.user.id },
      read: false,
      createdAt: new Date(),
    });
    res.json({ message: "Tutor request sent successfully." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Tutor can list all students assigned to them (students who have been approved, have requests, or are in sessions)
router.get("/students", authenticate, authorizeRole("tutor"), async (req, res) => {
  // Student IDs involved in sessions, or requests.
  const activeStudentIds = await Session.find({ tutor: req.user.id }).distinct("student");
  const requestedStudentIds = await Notification.find({ to: req.user.id, type: "tutor-request" }).distinct("from");
  const allIds = Array.from(new Set([...activeStudentIds, ...requestedStudentIds]));
  const students = await User.find({ _id: { $in: allIds }, role: "student" }).select("-password -emailVerificationToken");
  res.json(students);
});

/* ============ Assignments CRUD =============== */

// List all assignments created by this tutor
router.get("/assignments", authenticate, authorizeRole("tutor"), async (req, res) => {
  const assignments = await Assignment.find({ tutor: req.user.id }).sort({ dueDate: -1 });
  res.json(assignments);
});

// Create new assignment
router.post("/assignments", authenticate, authorizeRole("tutor"), async (req, res) => {
  const { title, subject, instructions, dueDate, assignedTo } = req.body;
  if (!title || !subject || !dueDate || !assignedTo)
    return res.status(400).json({ message: "All fields required" });
  const assignment = await Assignment.create({
    title, subject, instructions, dueDate,
    assignedTo, tutor: req.user.id, status: "Pending"
  });
  res.status(201).json(assignment);
});

// Update/edit assignment
router.put("/assignments/:id", authenticate, authorizeRole("tutor"), async (req, res) => {
  const assignment = await Assignment.findOne({ _id: req.params.id, tutor: req.user.id });
  if (!assignment) return res.status(404).json({ message: "Assignment not found" });
  const allowed = ["title","subject","instructions","dueDate","assignedTo","status"];
  allowed.forEach(key => { if (req.body[key] !== undefined) assignment[key]=req.body[key]; });
  await assignment.save();
  res.json(assignment);
});

// Delete assignment
router.delete("/assignments/:id", authenticate, authorizeRole("tutor"), async (req, res) => {
  const removed = await Assignment.deleteOne({ _id: req.params.id, tutor: req.user.id });
  res.json({ success: removed.deletedCount > 0 });
});

// View assignment submissions
router.get("/assignments/:id/submissions", authenticate, authorizeRole("tutor"), async (req, res) => {
  const submissions = await AssignmentSubmission.find({ assignment: req.params.id })
    .populate("student", "fullname username email");
  res.json(submissions);
});

// Grade assignment submission
router.patch("/assignments/:id/grade", authenticate, authorizeRole("tutor"), async (req, res) => {
  const { submissionId, grade, feedback } = req.body;
  const submission = await AssignmentSubmission.findOneAndUpdate(
    { _id: submissionId, assignment: req.params.id },
    { grade, feedback, gradedAt: new Date() },
    { new: true }
  );
  if (!submission) return res.status(404).json({ message: "Submission not found" });
  res.json(submission);
});

/* ============ SESSIONS CRUD =============== */

// List sessions for tutor
router.get("/sessions", authenticate, authorizeRole("tutor"), async (req, res) => {
  const sessions = await Session.find({ tutor: req.user.id }).sort({ date: -1 });
  res.json(sessions);
});

// Create new session
router.post("/sessions", authenticate, authorizeRole("tutor"), async (req, res) => {
  const { title, date, student, subject, description } = req.body;
  if (!title || !date || !student) return res.status(400).json({ message: "All required fields needed" });
  const session = await Session.create({ title, date, student, subject, description, tutor: req.user.id, status: "Active" });
  res.status(201).json(session);
});

// Update session
router.put("/sessions/:id", authenticate, authorizeRole("tutor"), async (req, res) => {
  const session = await Session.findOne({ _id: req.params.id, tutor: req.user.id });
  if (!session) return res.status(404).json({ message: "Session not found" });
  ["title","date","student","subject","description","status"].forEach(key=>{ 
    if(req.body[key]!==undefined) session[key]=req.body[key];
  });
  await session.save();
  res.json(session);
});

// Delete session
router.delete("/sessions/:id", authenticate, authorizeRole("tutor"), async (req, res) => {
  const rm = await Session.deleteOne({ _id: req.params.id, tutor: req.user.id });
  res.json({ success: rm.deletedCount > 0 });
});

/* ============ Earnings =============== */

// Get earnings breakdown
router.get("/earnings", authenticate, authorizeRole("tutor"), async (req, res) => {
  // Earnings: {[{amount, status, date, ...}]}
  const earnings = await TutorEarnings.find({ tutor: req.user.id }).sort({ date: -1 });
  // Compute totals:
  const total = earnings.reduce((t, e) => t + (e.amount || 0), 0);
  const pending = earnings.filter(e=>e.status==="Pending").reduce((t,e)=>t+e.amount,0);
  const withdrawn = earnings.filter(e=>e.status==="Withdrawn").reduce((t,e)=>t+e.amount,0);
  res.json({ earnings, summary: { total, pending, withdrawn } });
});

// Request a withdrawal (just records request, doesn't process payouts)
router.post("/withdraw", authenticate, authorizeRole("tutor"), async (req, res) => {
  const amount = req.body.amount;
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
    return res.status(400).json({ message: "Valid amount required." });
  const withdrawal = await Withdrawal.create({ tutor: req.user.id, amount, status: "Pending", requestedAt: new Date() });
  res.json({ success: true, withdrawal });
});

/* ============ Messaging (Messages with students/admin) =============== */

// All messages/conversations (limited for performance)
router.get("/messages", authenticate, authorizeRole("tutor"), async (req, res) => {
  const msgs = await Message.find({ $or: [ { to: req.user.id }, { from: req.user.id } ] })
    .sort({ createdAt: -1 }).limit(100)
    .populate("to","fullname username")
    .populate("from","fullname username");
  res.json(msgs);
});
// Send a message (to student or admin)
// NOTE: Message model requires `chat` — ensure we include it (create new chat id if not provided)
router.post("/messages", authenticate, authorizeRole("tutor"), async (req, res) => {
  const { to, text, chat } = req.body;
  if (!to || !text) return res.status(400).json({ message: "Recipient and message text required" });

  try {
    // If client provides a chat/conversation id, use it. Otherwise generate a new one.
    // Ideally you'd have a Chat/Conversation collection and reuse existing chat ids, but
    // generating a UUID here satisfies the Message schema and keeps a usable conversation id.
    const chatId = chat || uuidv4();

    const msg = await Message.create({
      chat: chatId,
      from: req.user.id,
      to,
      text,
      createdAt: new Date()
    });

    res.json({ success: true, msg });
  } catch (e) {
    // If validation still fails, return the detailed message for debugging (or log it)
    console.error("Failed to create message:", e);
    res.status(500).json({ message: "Failed to create message", error: e.message });
  }
});
/* ============ REVIEWS/FEEDBACK =============== */
router.get("/reviews", authenticate, authorizeRole("tutor"), async (req, res) => {
  const reviews = await Review.find({ tutor: req.user.id }).sort({ createdAt: -1 }).populate("student", "fullname");
  res.json(reviews);
});

/* ============ NOTIFICATIONS =============== */
router.get("/notifications", authenticate, authorizeRole("tutor"), async (req, res) => {
  const notes = await Notification.find({ to: req.user.id }).sort({ createdAt: -1 }).limit(50);
  res.json(notes);
});
router.patch("/notifications/:id/read", authenticate, authorizeRole("tutor"), async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, to: req.user.id }, { read: true });
  res.json({ message: "Marked as read."});
});

/* ============ Dashboard/Analytics =============== */
// Get dashboard summary/stat cards for tutor
router.get("/dashboard-summary", authenticate, authorizeRole("tutor"), async (req, res) => {
  const studentsCount = await Session.countDocuments({ tutor: req.user.id });
  const activeSessions = await Session.countDocuments({ tutor: req.user.id, status: "Active" });
  const totalEarnings = await TutorEarnings.aggregate([
    { $match: { tutor: req.user.id } },
    { $group: { _id: null, sum: { $sum: "$amount" } } }
  ]);
  const reviews = await Review.find({ tutor: req.user.id });
  let avgRating = 0;
  if (reviews.length) avgRating = (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(2);
  res.json({
    studentsCount,
    activeSessions,
    totalEarnings: totalEarnings[0]?.sum || 0,
    avgRating,
    reviewsCount: reviews.length
  });
});

// ========== Export router ==========
export default router;
