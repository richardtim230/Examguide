import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import fs from "fs";
const uploadDir = "./uploads/broadcasts";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
import multer from "multer";
// ...existing imports...
import Broadcast from "./models/Broadcast.js"; // NEW: broadcast model (see below)
import broadcastsRoutes from "./routes/broadcasts.js"; // NEW: broadcasts API route
import adminRoutes from "./routes/admin.js";
import responsesRoutes from "./routes/responses.js";
import settingsRoutes from "./routes/settings.js";
  
// ===== Models and Middleware =====
import User from "./models/User.js";
import Progress from "./models/Progress.js";
import { authenticate, authorizeRole } from "./middleware/authenticate.js";

// ===== Routes =====
import questionSetRoutes from "./routes/questionsets.js";
import resultsRoutes from "./routes/results.js";
import scheduleRoutes from "./routes/schedule.js";
import notificationsRoutes from "./routes/notifications.js";
import adminStatsRoutes from "./routes/adminStats.js";
import superadminRoutes from "./routes/superadmin.js";
import messagesRoutes from "./routes/messages.js";
import usersRoutes from "./routes/users.js";
import formsRoutes from "./routes/forms.js"; // <-- add this line
dotenv.config();

// ===== FACULTY & DEPARTMENT MODELS =====
const FacultySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});
const Faculty = mongoose.model("Faculty", FacultySchema);

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true }
});
const Department = mongoose.model("Department", DepartmentSchema);

const {
  MONGODB_URI,
  JWT_SECRET,
  FRONTEND_ORIGIN
} = process.env;
const PORT = process.env.PORT || 10000;

if (!MONGODB_URI || !JWT_SECRET || !FRONTEND_ORIGIN) {
  throw new Error("Missing required environment variables. Check MONGODB_URI, JWT_SECRET, FRONTEND_ORIGIN.");
}

// ===== CORS Config =====
const allowedOrigins = [
  "https://examguide.vercel.app",
  "https://examguide.vercel.app/mock-icthallb"
];
const app = express();
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS not allowed from this origin: " + origin), false);
  },
  credentials: true,
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/forms", formsRoutes); 

// ===== Add after notifications/multer setup =====
app.use("/uploads/broadcasts", express.static(path.join(process.cwd(), "uploads/broadcasts"))); // NEW: serve broadcast images

// ===== Register broadcasts API route =====
app.use("/api/broadcasts", broadcastsRoutes); // NEW: broadcasts API

// ===== MongoDB Connect =====
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log("MongoDB connected"))
  .catch(err=>console.error("MongoDB error", err));

// ===== Main User Routes =====
app.use("/api/users", usersRoutes);

// ===== FACULTY ROUTES =====
// Get all faculties
app.get("/api/faculties", authenticate, async (req, res) => {
  const list = await Faculty.find().sort({ name: 1 });
  res.json(list);
});
// Create faculty
app.post("/api/faculties", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const faculty = await Faculty.create({ name: req.body.name });
    res.status(201).json(faculty);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});
// Edit faculty
app.put("/api/faculties/:id", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });
    if (req.body.name !== undefined) faculty.name = req.body.name;
    await faculty.save();
    res.json(faculty);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// ===== DEPARTMENT ROUTES =====
// Get all departments
app.get("/api/departments", authenticate, async (req, res) => {
  const list = await Department.find().sort({ name: 1 });
  res.json(list);
});
// Create department
app.post("/api/departments", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const dept = await Department.create({ name: req.body.name, faculty: req.body.faculty });
    res.status(201).json(dept);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});
// Edit department
app.put("/api/departments/:id", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: "Department not found" });
    if (req.body.name !== undefined) dept.name = req.body.name;
    if (req.body.faculty !== undefined) dept.faculty = req.body.faculty;
    await dept.save();
    res.json(dept);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

app.use("/api/messages", messagesRoutes);

// DEBUG: List schedules for the logged-in user's faculty/department
app.get("/api/debug/schedules", authenticate, async (req, res) => {
  try {
    // Get the logged-in user's faculty and department
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Find schedules for that faculty/department and populate examSet
    const schedules = await mongoose.model("Schedule").find({
      faculty: user.faculty,
      department: user.department
    }).populate({
      path: "examSet",
      select: "title status questions faculty department"
    });

    res.json({ faculty: user.faculty, department: user.department, schedules });
  } catch (e) {
    res.status(500).json({ message: "Debug schedules error", error: e.message });
  }
});

// --- Auth Endpoints ---
// Register (students by default, admins/superadmins must be promoted manually or via superadmin)
app.post("/api/auth/register", async (req, res) => {
  try {
    const {username, password, role, faculty, department} = req.body;
    if (!username || !password)
      return res.status(400).json({message: "All fields required"});
    if (username.length < 3)
      return res.status(400).json({message: "Username must be at least 3 characters"});
    const exists = await User.findOne({username});
    if (exists)
      return res.status(409).json({message: "Username already exists"});
    const hashed = await bcrypt.hash(password, 12);
    const user = new User({username, password: hashed, role: role || "student", faculty, department});
    await user.save();
    const token = jwt.sign({username, id: user._id, role: user.role}, JWT_SECRET, {expiresIn: "1h"});
    res.status(201).json({token, message: "Registration successful"});
  } catch (e) {
    console.error("Register error:", e);
    res.status(500).json({message: "Server error"});
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const {username, password} = req.body;
    if (!username || !password)
      return res.status(400).json({message: "All fields required"});
    const user = await User.findOne({username});
    if (!user)
      return res.status(401).json({message: "Invalid username or password"});
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({message: "Invalid username or password"});
    const token = jwt.sign({username, id: user._id, role: user.role}, JWT_SECRET, {expiresIn: "2h"});
    res.json({token, message: "Login successful"});
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({message: "Server error"});
  }
});

// Password reset
app.post("/api/auth/reset", async (req, res) => {
  try {
    const {username, password} = req.body;
    if (!username || !password)
      return res.status(400).json({message: "Username and new password required"});
    const user = await User.findOne({username});
    if (!user)
      return res.status(404).json({message: "User not found"});
    const hashed = await bcrypt.hash(password, 12);
    user.password = hashed;
    await user.save();
    res.json({message: "Password reset successful"});
  } catch (e) {
    console.error("Reset error:", e);
    res.status(500).json({message: "Server error"});
  }
});

// Get user info (protected) -- now returns full user document, not just JWT claims!
app.get("/api/auth/me", authenticate, async (req, res) => {
  try {
    // Fetch full user info by ID
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ message: "Could not fetch user info" });
  }
});

// Health check endpoint for /api/auth (for browser test)
app.get("/api/auth", (req, res) => {
  res.json({ status: "auth API live" });
});

// --- Progress Endpoints (for students) ---
app.post("/api/progress/save", authenticate, async (req, res) => {
  const { examSet, answers, answeredIds, currentQuestionIndex, timeRemaining, completed } = req.body;
  if (!examSet) return res.status(400).json({ message: "examSet is required" });
  try {
    const progress = await Progress.findOneAndUpdate(
      { user: req.user.id, examSet },
      { $set: { answers, answeredIds, currentQuestionIndex, timeRemaining, completed } },
      { upsert: true, new: true }
    );
    res.json({ message: "Progress saved", progress });
  } catch (e) {
    res.status(500).json({ message: "Could not save progress" });
  }
});

app.get("/api/progress", authenticate, async (req, res) => {
  const examSet = req.query.examSet;
  if (!examSet) return res.status(400).json({ message: "examSet query param required" });
  try {
    const progress = await Progress.findOne({ user: req.user.id, examSet });
    res.json({ progress });
  } catch (e) {
    res.status(500).json({ message: "Could not get progress" });
  }
});
// Delete progress for a user and examSet
app.delete("/api/progress", authenticate, async (req, res) => {
  const examSet = req.query.examSet;
  if (!examSet) return res.status(400).json({ message: "examSet query param required" });
  try {
    await Progress.deleteOne({ user: req.user.id, examSet });
    res.json({ message: "Progress deleted" });
  } catch (e) {
    res.status(500).json({ message: "Could not delete progress" });
  }
});
// --- Superadmin & Student Profile Updates ---
app.use("/api/superadmin", superadminRoutes);

// --- Main Features ---
app.use("/api/questionsets", questionSetRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/adminstats", adminStatsRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/responses", responsesRoutes);
app.use("/api/settings", settingsRoutes);

app.get("/", (req, res) => res.json({ status: "form platform api ok" }));

app.get("/", (req, res) => res.json({status: "ok"}));

app.listen(PORT, () => console.log(`Backend running on port: ${PORT}`));
