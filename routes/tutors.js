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
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import Chat from "../models/Chat.js";
const router = express.Router();

/**
 * PRODUCTION-READY UNIVERSAL TUTOR ENDPOINTS
 */

/* ============ Registration & Listing =============== */


router.post("/register", async (req, res) => {
    try {
        const {
            // Basic Information
            fullname,
            username,
            email,
            password,
            phone,
            address,
            location,
            bio,
            about,
            religion,

            // Academic Information
            institution,
            faculty,
            department,
            level,
            specialties = [],
            achievements = [],

            // Profile
            profilePic,
            ninSlip,

            // Banking
            bank,
            accountName,
            accountNumber,
            idType,

            // Socials
            socials = {},

            // Optional Settings
            // Moderation and verification flags are controlled by the server.
            active = true,
            status = "pending"
        } = req.body;

        // ===========================
        // Validation
        // ===========================

        if (!fullname?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Full name is required."
            });
        }

        if (!username?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Username is required."
            });
        }

        if (!email?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

        // ===========================
        // Check duplicates
        // ===========================

        const existingUser = await User.findOne({
            $or: [
                {
                    username: username.trim()
                },
                {
                    email: email.toLowerCase().trim()
                }
            ]
        });

        if (existingUser) {
            if (
                existingUser.username === username.trim()
            ) {
                return res.status(409).json({
                    success: false,
                    message: "Username already exists."
                });
            }

            if (
                existingUser.email === email.toLowerCase().trim()
            ) {
                return res.status(409).json({
                    success: false,
                    message: "Email already exists."
                });
            }
        }

        // ===========================
        // Hash Password
        // ===========================

        const hashedPassword = await bcrypt.hash(password, 12);

        // ===========================
        // Create Tutor
        // ===========================

        const tutor = await User.create({

            // Basic
            fullname: fullname.trim(),
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            phone: phone || "",
            religion: religion || "",

            address: address || "",
            location: location || "",

            bio: bio || "",
            about: about || "",

            // Academic
            institution: institution || null,
            faculty: faculty || null,
            department: department || null,
            level: level || "",

            specialties: Array.isArray(specialties)
                ? specialties
                : [],

            achievements: Array.isArray(achievements)
                ? achievements
                : [],

            // Images
            profilePic: profilePic || "",
            ninSlip: ninSlip || "",

            // Banking
            bank: bank || "",
            accountName: accountName || "",
            accountNumber: accountNumber || "",
            idType: idType || "",

            // Social Links
            socials: {
                facebook: socials.facebook || "",
                twitter: socials.twitter || "",
                instagram: socials.instagram || "",
                tiktok: socials.tiktok || "",
                github: socials.github || "",
                behance: socials.behance || "",
                pinterest: socials.pinterest || "",
                dribbble: socials.dribbble || "",
                website: socials.website || ""
            },

            // Lecturer Settings
            role: "tutor",
            userType: "staff",

            active: true,
            approved: false,
            verified: false,
            emailVerified: false,

            status,

            // Dashboard Defaults
            students: [],
            courses: [],
            questions: [],
            exams: [],
            results: [],

            totalSubmissions: 0,
            averageScore: 0
        });

        return res.status(201).json({
            success: true,
            message: "Tutor registration received. Your profile is pending approval.",
            tutor: {
                _id: tutor._id,
                fullname: tutor.fullname,
                username: tutor.username,
                email: tutor.email,
                role: tutor.role,
                approved: tutor.approved,
                status: tutor.status
            }
        });

    } catch (error) {
        console.error(error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Username or email already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create tutor.",
            error: error.message
        });
    }
});

// Public tutor directory: returns only approved, active tutors and safe profile fields.
router.get("/directory", async (req, res) => {
  try {
    const { search = "", subject = "", institution = "", department = "", level = "", page = "1", limit = "12" } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const filter = { role: "tutor", approved: true, active: true, status: "active" };
    const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    if (subject.trim()) filter.specialties = { $regex: escapeRegex(subject.trim()), $options: "i" };
    if (institution.trim()) filter.institution = { $regex: escapeRegex(institution.trim()), $options: "i" };
    if (department.trim()) filter.department = { $regex: escapeRegex(department.trim()), $options: "i" };
    if (level.trim()) filter.level = { $regex: escapeRegex(level.trim()), $options: "i" };

    if (search.trim()) {
      const term = { $regex: escapeRegex(search.trim()), $options: "i" };
      filter.$or = [
        { fullname: term }, { username: term }, { department: term },
        { institution: term }, { specialties: term }, { bio: term }, { about: term }
      ];
    }

    const [tutors, total] = await Promise.all([
      User.find(filter)
        .select("fullname username bio about institution faculty department level specialties achievements profilePic location verified")
        .sort({ verified: -1, fullname: 1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      User.countDocuments(filter)
    ]);

    res.json({ success: true, tutors, pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) } });
  } catch (error) {
    console.error("Tutor directory error:", error);
    res.status(500).json({ success: false, message: "Unable to load tutors." });
  }
});

router.get("/directory/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid tutor ID." });
    }
    const tutor = await User.findOne({
      _id: req.params.id, role: "tutor", approved: true, active: true, status: "active"
    }).select("fullname username bio about institution faculty department level specialties achievements profilePic location verified").lean();

    if (!tutor) return res.status(404).json({ success: false, message: "Tutor not found." });
    res.json({ success: true, tutor });
  } catch (error) {
    console.error("Tutor profile error:", error);
    res.status(500).json({ success: false, message: "Unable to load tutor profile." });
  }
});

// Tutor updates their profile
router.patch("/me", authenticate, authorizeRole("tutor"), async (req, res) => {
  try {
    const allowed = ["fullname", "about", "specialties", "achievements", "phone", "profilePic", "socials"];
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "tutor") return res.status(404).json({ success: false, message: "Tutor not found." });

    for (const key of allowed) {
      if (req.body?.[key] === undefined) continue;
      if (["fullname", "about", "phone", "profilePic"].includes(key) && typeof req.body[key] !== "string") {
        return res.status(400).json({ success: false, message: key + " must be text." });
      }
      if (["specialties", "achievements"].includes(key) && !Array.isArray(req.body[key])) {
        return res.status(400).json({ success: false, message: key + " must be an array." });
      }
      if (key === "socials" && (!req.body[key] || typeof req.body[key] !== "object" || Array.isArray(req.body[key]))) {
        return res.status(400).json({ success: false, message: "socials must be an object." });
      }
      user[key] = req.body[key];
    }
    await user.save();
    const safeUser = await User.findById(user._id).select("-password -emailVerificationToken -ninSlip -bank -accountName -accountNumber");
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Tutor profile update error:", error);
    res.status(500).json({ success: false, message: "Unable to update tutor profile." });
  }
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
    const { tutorId, message } = req.body || {};
    const studentId = req.user?.id;

    if (!studentId) return res.status(401).json({ success: false, message: "Authentication required." });
    if (!tutorId || !mongoose.Types.ObjectId.isValid(tutorId)) {
      return res.status(400).json({ success: false, message: "A valid tutor ID is required." });
    }
    if (String(tutorId) === String(studentId)) {
      return res.status(400).json({ success: false, message: "You cannot request yourself as a tutor." });
    }
    if (message !== undefined && (typeof message !== "string" || message.trim().length > 1500)) {
      return res.status(400).json({ success: false, message: "Message must be text and no longer than 1500 characters." });
    }

    const tutor = await User.findOne({
      _id: tutorId, role: "tutor", approved: true, active: true, status: "active"
    }).select("_id fullname");
    if (!tutor) return res.status(404).json({ success: false, message: "Tutor not found or not available." });

    const existingRequest = await Notification.findOne({
      recipient: tutorId, type: "tutor_request", "data.student": studentId, read: false
    }).select("_id");
    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending request for this tutor.",
        requestId: existingRequest._id
      });
    }

    const student = await User.findById(studentId).select("fullname username");
    const studentDisplay = student?.fullname || student?.username || "A student";
    const title = `Tutor request from ${studentDisplay}`;
    const notification = await Notification.create({
      recipient: tutorId, title, type: "tutor_request",
      message: message?.trim() || `${title}: Please check the request.`,
      data: { type: "tutor_request", student: studentId, status: "pending" },
      read: false, createdAt: new Date()
    });

    return res.status(201).json({
      success: true, message: "Tutor request sent successfully.",
      requestId: notification._id, status: "pending"
    });
  } catch (error) {
    console.error("Tutor request error:", error);
    return res.status(500).json({ success: false, message: "Unable to send tutor request." });
  }
});

/**
 * FEATURE-RICH STUDENTS ENDPOINTS
 * - Returns students with status: 'active' or 'pending'
 * - Returns requestId (Notification ID) if pending, lastSession, metadata
 */
router.get("/students", authenticate, authorizeRole("tutor"), async (req, res) => {
  // Get sessions (active students)
  const sessionStudentIds = (await Session.find({ tutor: req.user.id }).distinct("student")).map(String);
  // Get all unread tutor-requests (pending requests)
  const pendingRequests = await Notification.find({ recipient: req.user.id, type: "tutor_request", read: false });
  const requestedStudentIds = pendingRequests.map(n => String(n.data?.student)).filter(id => mongoose.Types.ObjectId.isValid(id));
  const allIdsSet = new Set([...sessionStudentIds, ...requestedStudentIds]);
  const allIds = Array.from(allIdsSet);

  // Find all students in either group
  const studentsRaw = await User.find({ _id: { $in: allIds }, role: "student" }).select("-password -emailVerificationToken");

  // Get last session data per student (if any)
  const sessionMap = {};
  const sessions = await Session.find({
    tutor: req.user.id,
    student: { $in: allIds }
  }).sort({ date: -1 });
  sessions.forEach(sess => {
    const id = String(sess.student);
    if (!sessionMap[id]) sessionMap[id] = sess;
  });

  // Compose enhanced response
  const students = studentsRaw.map(stud => {
    const sid = String(stud._id);
    if (sessionStudentIds.includes(sid)) {
      return {
        ...stud.toObject(),
        status: "active",
        lastSession: sessionMap[sid]?.date,
        meta: sessionMap[sid] ? {
          subject: sessionMap[sid].subject,
          level: sessionMap[sid].level,
        } : {},
      };
    } else {
      const note = pendingRequests.find(n => String(n.data?.student) === sid);
      return {
        ...stud.toObject(),
        status: "pending",
        requestId: note?._id,
        meta: note?.data || {},
      };
    }
  });
  res.json(students);
});

/* =============== Accept/Reject Student Request (New Endpoints) =============== */

// Accept student request: marks notification as read, optionally creates "welcome" session, message, and notifies student
router.post("/accept-student", authenticate, authorizeRole("tutor"), async (req, res) => {
  const { studentId, note } = req.body || {};
  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) return res.status(400).json({ success: false, message: "A valid studentId is required." });
  if (note !== undefined && (typeof note !== "string" || note.trim().length > 1500)) return res.status(400).json({ success: false, message: "Note must be text and no longer than 1500 characters." });

  // Find and mark notification as read
  const notif = await Notification.findOneAndUpdate(
    { recipient: req.user.id, "data.student": studentId, type: "tutor_request", read: false },
    { $set: { read: true, "data.accepted": true, "data.status": "accepted" } }
  );
  if (!notif) return res.status(404).json({ success: false, message: "Pending tutor request not found." });

  // Upsert a session if one doesn't exist
  let latestSession = await Session.findOne({ tutor: req.user.id, student: studentId });
  if (!latestSession) {
    latestSession = await Session.create({
      tutor: req.user.id,
      student: studentId,
      title: "Welcome/Onboarding",
      date: new Date(),
      status: "Active",
      subject: "Introductory Session"
    });
  }

  // Send notification and/or message to student
  if (notif) {
    await Notification.create({
      recipient: studentId,
      title: "Tutor request accepted",
      type: "tutor_request_response",
      message: note ? `Tutor's message: "${note}"` : "You have been accepted by the tutor!",
      data: { accepted: true, tutor: req.user.id, session: latestSession._id },
      read: false,
      createdAt: new Date(),
    });
    // Optionally, send a chat message
    if (note) {
      // Find or create chat
      let existingChat = await Chat.findOne({ participants: { $all: [req.user.id, studentId] } });
      if (!existingChat) {
        existingChat = await Chat.create({ participants: [req.user.id, studentId] });
      }
      await Message.create({
        chat: existingChat._id,
        from: req.user.id,
        to: studentId,
        text: note,
        createdAt: new Date()
      });
    }
  }
  res.json({ success: true, message: "Student accepted and notified." });
});

// Reject student request: marks notification as read, notifies student with reason
router.post("/reject-student", authenticate, authorizeRole("tutor"), async (req, res) => {
  const { studentId, note } = req.body || {};
  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) return res.status(400).json({ success: false, message: "A valid studentId is required." });
  if (note !== undefined && (typeof note !== "string" || note.trim().length > 1500)) return res.status(400).json({ success: false, message: "Note must be text and no longer than 1500 characters." });

  // Find and mark notification as read & rejected
  const notif = await Notification.findOneAndUpdate(
    { recipient: req.user.id, "data.student": studentId, type: "tutor_request", read: false },
    { $set: { read: true, "data.accepted": false, "data.status": "rejected" } }
  );
  if (!notif) return res.status(404).json({ success: false, message: "Pending tutor request not found." });

  // Notify student with feedback
  await Notification.create({
    recipient: studentId,
    title: "Tutor request rejected",
    type: "tutor_request_response",
    message: note ? `Tutor's message: "${note}"` : "Your tutor request was rejected.",
    data: { accepted: false, tutor: req.user.id },
    read: false,
    createdAt: new Date(),
  });

  res.json({ success: true, message: "Request rejected, student notified." });
});

/* ============ Assignments CRUD =============== */

router.get("/assignments", authenticate, authorizeRole("tutor"), async (req, res) => {
  const assignments = await Assignment.find({ tutor: req.user.id }).sort({ dueDate: -1 });
  res.json(assignments);
});

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

router.put("/assignments/:id", authenticate, authorizeRole("tutor"), async (req, res) => {
  const assignment = await Assignment.findOne({ _id: req.params.id, tutor: req.user.id });
  if (!assignment) return res.status(404).json({ message: "Assignment not found" });
  const allowed = ["title","subject","instructions","dueDate","assignedTo","status"];
  allowed.forEach(key => { if (req.body[key] !== undefined) assignment[key]=req.body[key]; });
  await assignment.save();
  res.json(assignment);
});

router.delete("/assignments/:id", authenticate, authorizeRole("tutor"), async (req, res) => {
  const removed = await Assignment.deleteOne({ _id: req.params.id, tutor: req.user.id });
  res.json({ success: removed.deletedCount > 0 });
});

router.get("/assignments/:id/submissions", authenticate, authorizeRole("tutor"), async (req, res) => {
  const submissions = await AssignmentSubmission.find({ assignment: req.params.id })
    .populate("student", "fullname username email");
  res.json(submissions);
});

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

router.get("/sessions", authenticate, authorizeRole("tutor"), async (req, res) => {
  const sessions = await Session.find({ tutor: req.user.id }).sort({ date: -1 });
  res.json(sessions);
});

router.post("/sessions", authenticate, authorizeRole("tutor"), async (req, res) => {
  const { title, date, student, subject, description } = req.body;
  if (!title || !date || !student) return res.status(400).json({ message: "All required fields needed" });
  const session = await Session.create({ title, date, student, subject, description, tutor: req.user.id, status: "Active" });
  res.status(201).json(session);
});

router.put("/sessions/:id", authenticate, authorizeRole("tutor"), async (req, res) => {
  const session = await Session.findOne({ _id: req.params.id, tutor: req.user.id });
  if (!session) return res.status(404).json({ message: "Session not found" });
  ["title","date","student","subject","description","status"].forEach(key=>{ 
    if(req.body[key]!==undefined) session[key]=req.body[key];
  });
  await session.save();
  res.json(session);
});

router.delete("/sessions/:id", authenticate, authorizeRole("tutor"), async (req, res) => {
  const rm = await Session.deleteOne({ _id: req.params.id, tutor: req.user.id });
  res.json({ success: rm.deletedCount > 0 });
});

/* ============ Earnings =============== */

router.get("/earnings", authenticate, authorizeRole("tutor"), async (req, res) => {
  const earnings = await TutorEarnings.find({ tutor: req.user.id }).sort({ date: -1 });
  const total = earnings.reduce((t, e) => t + (e.amount || 0), 0);
  const pending = earnings.filter(e=>e.status==="Pending").reduce((t,e)=>t+e.amount,0);
  const withdrawn = earnings.filter(e=>e.status==="Withdrawn").reduce((t,e)=>t+e.amount,0);
  res.json({ earnings, summary: { total, pending, withdrawn } });
});

router.post("/withdraw", authenticate, authorizeRole("tutor"), async (req, res) => {
  const amount = req.body.amount;
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
    return res.status(400).json({ message: "Valid amount required." });
  const withdrawal = await Withdrawal.create({ tutor: req.user.id, amount, status: "Pending", requestedAt: new Date() });
  res.json({ success: true, withdrawal });
});

/* ============ Messaging =============== */

router.get("/messages", authenticate, authorizeRole("tutor"), async (req, res) => {
  const msgs = await Message.find({ $or: [ { to: req.user.id }, { from: req.user.id } ] })
    .sort({ createdAt: -1 }).limit(100)
    .populate("to","fullname username")
    .populate("from","fullname username");
  res.json(msgs);
});

router.post("/messages", authenticate, authorizeRole("tutor"), async (req, res) => {
  const { to, text, chat } = req.body;
  if (!to || !text) return res.status(400).json({ message: "Recipient and message text required" });

  try {
    let chatId = null;
    if (chat) {
      if (!mongoose.Types.ObjectId.isValid(chat)) {
        return res.status(400).json({ message: "Invalid chat id" });
      }
      chatId = chat;
    } else {
      let existing = await Chat.findOne({ participants: { $all: [req.user.id, to] } }).exec();
      if (!existing) {
        existing = await Chat.create({ participants: [req.user.id, to] });
      }
      chatId = existing._id;
    }
    const msg = await Message.create({
      chat: chatId,
      from: req.user.id,
      to,
      text,
      createdAt: new Date()
    });
    await Chat.updateOne({ _id: chatId }, { $set: { lastMessageAt: new Date() } }).catch(()=>{});
    res.json({ success: true, msg });
  } catch (e) {
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
  const notes = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 }).limit(50);
  res.json(notes);
});
router.patch("/notifications/:id/read", authenticate, authorizeRole("tutor"), async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, recipient: req.user.id }, { $set: { read: true, readAt: new Date() } });
  res.json({ message: "Marked as read."});
});

/* ============ Dashboard/Analytics =============== */
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
