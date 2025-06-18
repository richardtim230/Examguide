import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import User from "./models/User.js";
import Progress from "./models/Progress.js";
import { authenticate, authorizeRole } from "./middleware/authenticate.js";
import questionSetRoutes from "./routes/questionsets.js";
import resultsRoutes from "./routes/results.js";
import scheduleRoutes from "./routes/schedule.js";
import notificationsRoutes from "./routes/notifications.js";
import adminStatsRoutes from "./routes/adminStats.js";
import superadminRoutes from "./routes/superadmin.js";

// ===== ADD FACULTY & DEPARTMENT MODELS =====
const FacultySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});
const Faculty = mongoose.model("Faculty", FacultySchema);

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true }
});
const Department = mongoose.model("Department", DepartmentSchema);
// ===========================================

dotenv.config();

const {
  MONGODB_URI,
  JWT_SECRET,
  FRONTEND_ORIGIN
} = process.env;
const PORT = process.env.PORT || 10000;

if (!MONGODB_URI || !JWT_SECRET || !FRONTEND_ORIGIN) {
  throw new Error("Missing required environment variables. Check MONGODB_URI, JWT_SECRET, FRONTEND_ORIGIN.");
}

// CORS: explicitly allow your Vercel frontend URL and subpath
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

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log("MongoDB connected"))
  .catch(err=>console.error("MongoDB error", err));

// --- Superadmin bootstrapping (Option 3) ---
// This block creates a superadmin user if none exists, with a sample password.
// REMOVE or comment out this block after first use for security!
(async () => {
  try {
    const exists = await User.findOne({ role: "superadmin" });
    if (!exists) {
      const hashed = await bcrypt.hash("SuperSecret123!", 12); // Sample password
      await User.create({
        username: "superadmin",
        password: hashed,
        role: "superadmin",
      });
      console.log("Superadmin created: username=superadmin, password=SuperSecret123!");
    }
  } catch (e) {
    console.error("Error during superadmin bootstrapping:", e);
  }
})();

// ===== FACULTY ROUTES =====
app.get("/api/faculties", authenticate, async (req, res) => {
  const list = await Faculty.find().sort({ name: 1 });
  res.json(list);
});
app.post("/api/faculties", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const faculty = await Faculty.create({ name: req.body.name });
    res.status(201).json(faculty);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// ===== DEPARTMENT ROUTES =====
app.get("/api/departments", authenticate, async (req, res) => {
  const list = await Department.find().sort({ name: 1 });
  res.json(list);
});
app.post("/api/departments", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const dept = await Department.create({ name: req.body.name, faculty: req.body.faculty });
    res.status(201).json(dept);
  } catch (e) {
    res.status(400).json({ message: e.message });
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
    const token = jwt.sign({username, id: user._id, role: user.role}, JWT_SECRET, {expiresIn: "2h"});
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

// Get user info (protected)
app.get("/api/auth/me", authenticate, (req, res) => {
  res.json({user: req.user});
});

// Health check endpoint for /api/auth (for browser test)
app.get("/api/auth", (req, res) => {
  res.json({ status: "auth API live" });
});

// List users by role/faculty/department (for superadmin)
app.get("/api/users", authenticate, authorizeRole("superadmin"), async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.faculty) filter.faculty = req.query.faculty;
  if (req.query.department) filter.department = req.query.department;
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json(users);
});

// Remove admin (for superadmin)
app.delete("/api/users/:id", authenticate, authorizeRole("superadmin"), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role !== "admin") return res.status(400).json({ message: "Only admins can be removed here" });
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "Admin removed" });
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

// --- Superadmin & Student Profile Updates ---
app.use("/api/superadmin", superadminRoutes);

// --- Main Features ---
app.use("/api/questionsets", questionSetRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/adminstats", adminStatsRoutes);

app.get("/", (req, res) => res.json({status: "ok"}));

app.listen(PORT, () => console.log(`Backend running on port: ${PORT}`));
