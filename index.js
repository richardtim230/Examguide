import express from "express";
const app = express();
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fetch from 'node-fetch';
import Faculty from "./models/Faculty.js";
import Department from "./models/Department.js";
const router = express.Router();
import cloudinary from 'cloudinary';
import streamifier from 'streamifier';

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ...other code...


import pastQuestionsRoutes from "./routes/pastQuestions.js";
import fs from "fs";
const profilePicsDir = "./uploads/profilepics";
if (!fs.existsSync(profilePicsDir)) {
  fs.mkdirSync(profilePicsDir, { recursive: true });
}
const profilePicStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profilePicsDir);
  },
  filename: function (req, file, cb) {
    // Use timestamp+originalname to prevent duplicates
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base.replace(/\s+/g,'_')}_${Date.now()}${ext}`);
  }
});
const uploadProfilePic = multer({
  storage: profilePicStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed!"));
  }
});
// 1. Setup a directory for editor uploads
const editorUploadsDir = "./uploads/editor";
if (!fs.existsSync(editorUploadsDir)) {
  fs.mkdirSync(editorUploadsDir, { recursive: true });
}
const editorImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, editorUploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base.replace(/\s+/g,'_')}_${Date.now()}${ext}`);
  }
});
const uploadEditorImage = multer({
  storage: editorImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed!"));
  }
});


const uploadDir = "./uploads/broadcasts";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Set in your .env

import multer from "multer";
// ...existing imports...
import newsletterRoutes from "./routes/newsletter.js";
import Broadcast from "./models/Broadcast.js"; // NEW: broadcast model (see below)
import broadcastsRoutes from "./routes/broadcasts.js"; // NEW: broadcasts API route
import adminRoutes from "./routes/admin.js";
import responsesRoutes from "./routes/responses.js";
import settingsRoutes from "./routes/settings.js";
 import marketplaceRoutes from "./routes/marketplace.js";
import bloggerAuthRoutes from "./routes/bloggerAuth.js";
import offerRoutes from "./routes/offers.js";
  

import buyerDashboardRoutes from "./routes/buyerDashboard.js";



// ===== Models and Middleware =====
import User from "./models/User.js";
import Progress from "./models/Progress.js";
import { authenticate, authorizeRole } from "./middleware/authenticate.js";
import affiliateRoutes from "./routes/affiliate.js";
import massagesRoutes from './routes/massages.js';
import cartRoutes from './routes/cart.js';
import ordersRoutes from './routes/orders.js';

import codecxregRoutes from "./routes/codecxreg.js";
import withdrawalRoutes from "./routes/withdrawals.js";
import rewardsRoutes from "./routes/rewards.js";
import questionSetRoutes from "./routes/questionsets.js";
import resultsRoutes from "./routes/results.js";
import scheduleRoutes from "./routes/schedule.js";
import notificationsRoutes from "./routes/notifications.js";
import adminStatsRoutes from "./routes/adminStats.js";
import superadminRoutes from "./routes/superadmin.js";
import messagesRoutes from "./routes/messages.js";
import usersRoutes from "./routes/users.js";
import formsRoutes from "./routes/forms.js"; // <-- add this line
import registrationsRoutes from "./routes/registrations.js";
import applicationsRoutes from "./routes/applications.js";
import bloggerDashboardRoutes from "./routes/bloggerDashboard.js";
import BloggerDashboard from "./models/BloggerDashboard.js";
import reviewsRoutes from "./routes/reviews.js";

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

// Increase limits for JSON and urlencoded bodies
app.use(express.json({ limit: '20mb' }));      // or more if needed
app.use(express.urlencoded({ limit: '20mb', extended: true }));
// ===== CORS Config =====
app.use(cors({
  origin: true, // Reflects the request origin
  credentials: true,
}));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/forms", formsRoutes); 

// ===== Add after notifications/multer setup =====
app.use("/uploads/broadcasts", express.static(path.join(process.cwd(), "uploads/broadcasts"))); // NEW: serve broadcast images

// ===== Register broadcasts API route =====
app.use("/api/broadcasts", broadcastsRoutes); // NEW: broadcasts API

// ===== MongoDB Connect =====
mongoose.connect(MONGODB_URI)
  .then(()=>console.log("MongoDB connected"))
  .catch(err=>console.error("MongoDB error", err));

// ===== Main User Routes =====
app.use("/api/users", usersRoutes);

// ===== FACULTY ROUTES =====
// Get all faculties
app.get("/api/faculties", async (req, res) => {
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




router.post('/api/ai', async (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Missing Gemini API key' });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    const data = await response.json();
    // Log raw Gemini response for troubleshooting
    console.log("Gemini response:", data);

    // Handle Gemini NOT_FOUND error
    if (data.error || !data.candidates) {
      return res.status(400).json({ error: data.error?.message || "Gemini API error", raw: data });
    }

    const result = data.candidates[0]?.content?.parts[0]?.text || "No response";
    res.json({ response: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ===== DEPARTMENT ROUTES =====
// Get all departments
app.get("/api/departments", async (req, res) => {
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


app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing url query param' });
  try {
    const response = await fetch(targetUrl);
    const data = await response.text();
    res.status(response.status).send(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.post("/api/auth/register", uploadProfilePic.single("profilePic"), async (req, res) => {
  try {
    const {
      username,
      password,
      role,
      level,
      phone,
      email,
      faculty,
      department,
      fullname, // <-- added fullname!
      ref // <-- NEW: referral code from frontend, if any
    } = req.body;

    if (!username || !password)
      return res.status(400).json({message: "All fields required"});
    if (username.length < 3)
      return res.status(400).json({message: "Username must be at least 3 characters"});
    const exists = await User.findOne({username});
    if (exists)
      return res.status(409).json({message: "Username already exists"});
    const hashed = await bcrypt.hash(password, 12);

    let profilePicUrl = "";
    if (req.file) {
      // Use URL path for the uploaded profile pic
      profilePicUrl = `/uploads/profilepics/${req.file.filename}`;
    }
    // Handle base64 profilePic if provided
    if (!req.file && req.body.profilePic && req.body.profilePic.startsWith("data:image")) {
      // Extract file extension (png/jpg/jpeg)
      const matches = req.body.profilePic.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1];
        const data = matches[2];
        const buffer = Buffer.from(data, 'base64');
        const filename = `profile_${Date.now()}.${ext}`;
        const filePath = path.join(profilePicsDir, filename);
        fs.writeFileSync(filePath, buffer);
        profilePicUrl = `/uploads/profilepics/${filename}`;
      }
    }
    const user = new User({
      username,
      password: hashed,
      role: role || "student",
      faculty,
      department,
      email: email || "",
      level: level || "",
      phone: phone || "",
      fullname: fullname || "",
      profilePic: profilePicUrl
    });

    await user.save();

    // ---- AFFILIATE REFERRAL LOGIC ----
    if (ref && typeof ref === "string" && ref.trim().length > 0) {
      // Dynamically require Affiliate model
      let Affiliate;
      try {
        Affiliate = require("../models/Affiliate.js").default || require("../models/Affiliate.js");
      } catch (err) {
        Affiliate = null;
      }
      if (Affiliate) {
        // Find affiliate by referralCode
        const affiliate = await Affiliate.findOne({ referralCode: ref.trim() });
        if (affiliate) {
          // Prevent double-count for the same user (by email or username)
          affiliate.referrals = affiliate.referrals || [];
          const alreadyReferred = affiliate.referrals.some(
            r => (r.email && r.email === user.email) || (r.username && r.username === user.username)
          );
          if (!alreadyReferred) {
            affiliate.clicks = (affiliate.clicks || 0) + 1;
            affiliate.referrals.push({
              name: user.fullname,
              email: user.email,
              username: user.username,
              referrals: 0
            });
            await affiliate.save();
          }
        }
      }
    }

    const token = jwt.sign({username, id: user._id, role: user.role}, JWT_SECRET, {expiresIn: "1h"});
    res.status(201).json({token, message: "Registration successful", profilePic: profilePicUrl});
  } catch (e) {
    console.error("Register error:", e);
    res.status(500).json({message: "Server error"});
  }
});

// In routes/auth.js or index.js
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "All fields required" });

    // Try to find matching user by username or matricNumber
    const user = await User.findOne({
      $or: [
        { username: username },
        { matricNumber: username },
        { loginUsername: username }
      ]
    });

    if (!user)
      return res.status(401).json({ message: "Invalid username or password" });

    // Optionally, check if user is active
    if (user.active === false)
      return res.status(403).json({ message: "Account not yet activated. Contact admin." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid username or password" });

    // ---- AUTO-GENERATE studentId IF MISSING ----
    function generateStudentId() {
      const letters = Array.from({length: 3}, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
      const digits = Math.floor(1000 + Math.random() * 9000);
      return `STU/${letters}${digits}`;
    }
    if (user.role === "student" && (!user.studentId || user.studentId.trim() === "")) {
      let newId, exists;
      do {
        newId = generateStudentId();
        exists = await User.findOne({studentId: newId});
      } while (exists);
      user.studentId = newId;
      await user.save();
    }

    const token = jwt.sign(
      { username: user.username, id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    res.json({ token, message: "Login successful" });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ message: "Server error" });
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

// 2. Serve editor uploads statically
app.use("/uploads/editor", express.static(path.join(process.cwd(), "uploads/editor")));

// Use memoryStorage for Cloudinary as we upload the image buffer directly
const memStorage = multer.memoryStorage();
const uploadToMemory = multer({ storage: memStorage });

app.post("/api/images", uploadToMemory.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  try {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder: "editor-uploads", // (Optional) change folder as needed
        resource_type: "image"
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ error: "Cloudinary upload failed" });
        }
        // Return the secure Cloudinary URL
        res.json({ url: result.secure_url });
      }
    );
    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (e) {
    res.status(500).json({ error: "Upload failed" });
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


// Total registered students
app.get("/api/users/count", async (req, res) => {
  try {
    const count = await User.countDocuments({});
    res.json({ count });
  } catch (e) {
    res.status(500).json({ count: 0 });
  }
});

// Total blog posts shared (all users)
app.get("/api/posts/count", async (req, res) => {
  try {
    // Aggregate sum of all posts arrays
    const dashboards = await BloggerDashboard.find({}, 'posts');
    const totalPosts = dashboards.reduce((sum, dash) => sum + (dash.posts ? dash.posts.length : 0), 0);
    res.json({ count: totalPosts });
  } catch (e) {
    res.status(500).json({ count: 0 });
  }
});

// Total marketplace items listed (all users)
app.get("/api/listings/count", async (req, res) => {
  try {
    const dashboards = await BloggerDashboard.find({}, 'listings');
    const totalListings = dashboards.reduce((sum, dash) => sum + (dash.listings ? dash.listings.length : 0), 0);
    res.json({ count: totalListings });
  } catch (e) {
    res.status(500).json({ count: 0 });
  }
});
// --- Superadmin & Student Profile Updates ---
app.use("/api/superadmin", superadminRoutes);
app.use("/api/blogger", bloggerAuthRoutes);
app.use("/uploads/blogger", express.static(path.join(process.cwd(), "uploads/blogger")));
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/codecxreg", codecxregRoutes);
app.use("/api/rewards", rewardsRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/blogger-dashboard", bloggerDashboardRoutes);
app.use("/uploads/profilepics", express.static(path.join(process.cwd(), "uploads/profilepics")));
app.use("/api/questionsets", questionSetRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/past-questions", pastQuestionsRoutes);
app.use("/uploads/questions", express.static(path.join(process.cwd(), "uploads/questions")));
app.use("/api/schedules", scheduleRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/adminstats", adminStatsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/registrations", registrationsRoutes);
app.use("/api/responses", responsesRoutes);
app.use("/api/affiliate", affiliateRoutes);
app.use("/api/buyer-dashboard", buyerDashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/blogger-dashboard", massagesRoutes);
app.use("/api", cartRoutes);
app.use("/api/applications", applicationsRoutes);
app.get("/", (req, res) => res.json({ status: "form platform api ok" }));
app.use("/api/reviews", reviewsRoutes);
app.use("/api/orders", ordersRoutes);
  
app.get("/", (req, res) => res.json({status: "ok"}));

app.listen(PORT, () => console.log(`Backend running on port: ${PORT}`));
