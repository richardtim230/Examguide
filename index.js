import express from "express";
const app = express();
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import DeviceRegistration from "./models/DeviceRegistration.js";
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import tutorsRoutes from "./routes/tutors.js";
import Faculty from "./models/Faculty.js";
import Department from "./models/Department.js";
const router = express.Router();
import cloudinary from 'cloudinary';
import streamifier from 'streamifier';
import nodemailer from 'nodemailer';
import crypto from 'crypto';  
import postmark from "postmark";
import liveclassRoutes, { setupLiveClassSocket } from './routes/liveclass.js';
import { Server } from 'socket.io';
import http from "http";
const server = http.createServer(app);
const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);
dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

import multer from "multer";

// Profile pic uploads
import pastQuestionsRoutes from "./routes/pastQuestions.js";
import fs from "fs";
const profilePicsDir = "./uploads/profilepics";
if (!fs.existsSync(profilePicsDir)) {
  fs.mkdirSync(profilePicsDir, { recursive: true });
}
const theoryAnswersDir = "./uploads/theory-answers";

const profilePicStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profilePicsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base.replace(/\s+/g,'_')}_${Date.now()}${ext}`);
  }
});
const uploadProfilePic = multer({
  storage: profilePicStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed!"));
  }
});
// Editor image uploads
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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed!"));
  }
});
const theoryAnswersStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, theoryAnswersDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const theoryAnswersFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image (JPEG, PNG, WebP) and PDF files allowed for theory answers!"));
  }
};
export const uploadTheoryAnswers = multer({
  storage: theoryAnswersStorage,
  fileFilter: theoryAnswersFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB for theory answers
});

async function sendBlogNotification({ title, message, url }) {
  const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
  const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

  const payload = {
    app_id: ONESIGNAL_APP_ID,
    included_segments: ["Subscribed Users"],
    headings: { en: title },
    contents: { en: message },
    url: url,
    chrome_web_image: "https://oau.examguard.com.ng/logo.png" // Or your blog's main image
  };

  await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${ONESIGNAL_API_KEY}`
    },
    body: JSON.stringify(payload)
  });
}
// Broadcast image uploads
const uploadDir = "./uploads/broadcasts";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

import newsletterRoutes from "./routes/newsletter.js";
import Broadcast from "./models/Broadcast.js";
import broadcastsRoutes from "./routes/broadcasts.js";
import adminRoutes from "./routes/admin.js";
import responsesRoutes from "./routes/responses.js";
import settingsRoutes from "./routes/settings.js";
import marketplaceRoutes from "./routes/marketplace.js";
import bloggerAuthRoutes from "./routes/bloggerAuth.js";
import offerRoutes from "./routes/offers.js";
import postsRoutes from './routes/posts.js';
import adminPostsRoutes from './routes/adminPosts.js';
import myPostsRoutes from './routes/myPosts.js';
import accountSettingsRouter from './routes/accountSettings.js';
import taxonomyRoutes from './routes/taxonomy.js';
import buyerDashboardRoutes from "./routes/buyerDashboard.js";
import User from "./models/User.js";
import resourcesRoutes from "./routes/resources.js";
import Progress from "./models/Progress.js";
import { authenticate, authorizeRole } from "./middleware/authenticate.js";
import affiliateRoutes from "./routes/affiliate.js";
import massagesRoutes from './routes/massages.js';
import cartRoutes from './routes/cart.js';
import schoolRegistrationRoutes from "./routes/schoolRegistration.js";
import ordersRoutes from './routes/orders.js';
import studypadiRoutes from "./routes/studypadi.js";
import studypadiAiRoutes from "./routes/studypadi-ai.js";
import studentsRouter from './routes/students.js';
import assignmentsRouter from './routes/assignments.js';
import resourcesGridFSRoutes from "./routes/resources-gridfs.js";
// add near other imports
import aiMaterialRoutes from "./routes/aiMaterial.js";
import theoryAnswersRoutes from "./routes/theoryAnswers.js";
import theoryAttemptsRoutes from "./routes/theoryAttempts.js";
import theoryQuestionsRoutes from "./routes/theoryQuestions.js";
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
import formsRoutes from "./routes/forms.js";
import tasksRoutes from './routes/tasks.js';
import registrationsRoutes from "./routes/registrations.js";
import applicationsRoutes from "./routes/applications.js";
import bloggerDashboardRoutes from "./routes/bloggerDashboard.js";
import BloggerDashboard from "./models/BloggerDashboard.js";
import reviewsRoutes from "./routes/reviews.js";
import supportRoutes from "./routes/support.js";
import Ad from "./models/Ad.js";
import affiliateAuthRoutes from "./routes/affiliateAuth.js";
import creditRoutes from "./routes/credit.js";
import kiaChatEndpoint from "./routes/kiaChatEndpoint.js";
import lectureNotesRoutes from "./routes/lectureNotes.js";
import aiChatRoutes from "./routes/aiChat.js";
import studentAuthRoutes from "./routes/studentAuth.js";
import oauWizardChatRoutes from "./routes/oauWizardChat.js";
import examSetRoutes from "./routes/examSet.js";
import cbtQuestionsRoutes from "./routes/cbtQuestions.js";
const memStorage = multer.memoryStorage();
import pastQuestionsRoute from "./routes/pastQuestion.js";
const uploadToMemory = multer({ storage: memStorage });

const {
  MONGODB_URI,
  JWT_SECRET,
  FRONTEND_ORIGIN,
  FROTEND_ORIGIN
} = process.env;
const PORT = process.env.PORT || 10000;

if (!MONGODB_URI || !JWT_SECRET || !FRONTEND_ORIGIN) {
  throw new Error("Missing required environment variables. Check MONGODB_URI, JWT_SECRET, FRONTEND_ORIGIN.");
}

const rawOrigins = (process.env.ALLOWED_ORIGINS || "https://oau.examguard.com.ng").split(",").map(s => s.trim()).filter(Boolean);
const devOrigins = ["http://drich.examguard.com.ng", "https://www.examguard.com.ng/", "https://drich.examguard.com.ng", "https://www.examguard.com.ng"];
const ALLOWED_ORIGINS = Array.from(new Set([...rawOrigins, ...devOrigins]));
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error("CORS policy: This origin is not allowed: " + origin));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
  exposedHeaders: ["Authorization"], // expose if your API returns auth headers
  credentials: true,
  optionsSuccessStatus: 204
};

// Register middleware (make sure this runs BEFORE route registrations)
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); 
// Increase limits for JSON and urlencoded bodies
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());

// Set device_id cookie if not present
app.use((req, res, next) => {
  if (!req.cookies.device_id) {
    const deviceId = uuidv4();
    res.cookie('device_id', deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // only over HTTPS in prod
      maxAge: 1000 * 60 * 60 * 24 * 365 * 5 // 5 years
    });
    req.cookies.device_id = deviceId; // so it's available during this request
  }
  next();
});
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/forms", formsRoutes);
app.use("/api/credit", creditRoutes);
app.use("/uploads/broadcasts", express.static(path.join(process.cwd(), "uploads/broadcasts")));
app.use("/api/broadcasts", broadcastsRoutes);
app.use("/api/oau-wizard", oauWizardChatRoutes);
mongoose.connect(MONGODB_URI)
  .then(()=>console.log("MongoDB connected"))
  .catch(err=>console.error("MongoDB error", err));

app.use("/api/users", usersRoutes);

// ===== FACULTY ROUTES =====
app.get("/api/faculties", async (req, res) => {
  const list = await Faculty.find().sort({ name: 1 });
  res.json(list);
});
app.post("/api/faculties", async (req, res) => {
  try {
    const faculty = await Faculty.create({ name: req.body.name });
    res.status(201).json(faculty);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});
app.put("/api/faculties/:id", async (req, res) => {
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


// CREATE Ad
app.post("/api/ads", async (req, res) => {
  try {
    const ad = await Ad.create(req.body);
    res.status(201).json(ad);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// READ all Ads
app.get("/api/ads", async (req, res) => {
  const ads = await Ad.find().sort({ createdAt: -1 });
  res.json(ads);
});

// READ one Ad by ID
app.get("/api/ads/:id", async (req, res) => {
  const ad = await Ad.findById(req.params.id);
  if (!ad) return res.status(404).json({ error: "Ad not found" });
  res.json(ad);
});

// UPDATE Ad
app.put("/api/ads/:id", async (req, res) => {
  try {
    const ad = await Ad.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ad) return res.status(404).json({ error: "Ad not found" });
    res.json(ad);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE Ad
app.delete("/api/ads/:id", async (req, res) => {
  const ad = await Ad.findByIdAndDelete(req.params.id);
  if (!ad) return res.status(404).json({ error: "Ad not found" });
  res.json({ success: true });
});

// GET random ad (for frontend)
app.get("/api/random-ad", async (req, res) => {
  const count = await Ad.countDocuments();
  if (count === 0) return res.status(404).json({ error: "No ads in database" });
  const random = Math.floor(Math.random() * count);
  const ad = await Ad.findOne().skip(random);
  res.json(ad);
});
// Get all departments (optionally filter by faculty)
app.get("/api/departments", async (req, res) => {
  const { faculty } = req.query;
  let query = {};
  if (faculty) query.faculty = faculty;
  const list = await Department.find(query).sort({ name: 1 });
  res.json(list);
});

// Get department by ID
app.get("/api/departments/:id", async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: "Department not found" });
    res.json(dept);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Create department
app.post("/api/departments", async (req, res) => {
  try {
    const dept = await Department.create({
      name: req.body.name,
      faculty: req.body.faculty,
      subtitle: req.body.subtitle || "",
      backgroundImage: req.body.backgroundImage || "",
      courses: req.body.courses || []
    });
    res.status(201).json(dept);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Edit department (name, faculty)
app.put("/api/departments/:id", async (req, res) => {
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

// PATCH department details (backgroundImage, subtitle, courses, etc.)
app.patch("/api/departments/:id", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: "Department not found" });
    if (req.body.name !== undefined) dept.name = req.body.name;
    if (req.body.faculty !== undefined) dept.faculty = req.body.faculty;
    if (req.body.backgroundImage !== undefined) dept.backgroundImage = req.body.backgroundImage;
    if (req.body.subtitle !== undefined) dept.subtitle = req.body.subtitle;
    if (req.body.courses !== undefined) dept.courses = req.body.courses;
    await dept.save();
    res.json(dept);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Delete department
app.delete("/api/departments/:id", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const result = await Department.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Department not found" });
    res.json({ message: "Department deleted" });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Add a course to department
app.post("/api/departments/:id/courses", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const { course } = req.body;
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: "Department not found" });
    if (!course || typeof course !== 'string') return res.status(400).json({ message: "Course required" });
    if (!dept.courses.includes(course)) dept.courses.push(course);
    await dept.save();
    res.json(dept);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Remove a course from department
app.delete("/api/departments/:id/courses", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const { course } = req.body;
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: "Department not found" });
    dept.courses = dept.courses.filter(c => c !== course);
    await dept.save();
    res.json(dept);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// Upload department image to Cloudinary and save to department
app.post("/api/departments/:id/image", uploadToMemory.single("image"), authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const dept = await Department.findById(req.params.id);
  if (!dept) return res.status(404).json({ message: "Department not found" });
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  try {
    const stream = cloudinary.v2.uploader.upload_stream(
      { folder: "department-images", resource_type: "image" },
      async (error, result) => {
        if (error) return res.status(500).json({ error: "Cloudinary upload failed" });
        dept.backgroundImage = result.secure_url;
        await dept.save();
        res.json({ url: result.secure_url, dept });
      }
    );
    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (e) {
    res.status(500).json({ error: "Upload failed" });
  }
});

app.get('/blog/:slug-:id', async (req, res) => {
  const { id, slug } = req.params;
  // Fetch post data from DB or API
  const postRes = await fetch(`https://examguard-jmvj.onrender.com/api/public/posts/${id}`);
  if (!postRes.ok) return res.status(404).send('Post not found');
  const post = await postRes.json();

  // Read the HTML template
  const templatePath = path.join(process.cwd(), 'views', 'blog-details.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  // Prepare dynamic meta tag values
  const title = post.title || 'Blog Post';
  const description = post.summary || (post.content ? post.content.replace(/<[^>]+>/g, '').substring(0, 150) : '');
  const image = (post.images && post.images[0]) || post.imageUrl || '/default.jpg';
  const author = post.authorName || 'Author';
  const date = post.date || new Date().toISOString();
  const canonicalUrl = `https://oau.examguard.com.ng/blog/${slug}-${id}`;

  // Replace meta tags and placeholders
  html = html
    .replace(/<title>.*?<\/title>/, `<title>${title} | OAU ExamGuard</title>`)
    .replace(/<meta name="description" content=".*?"/, `<meta name="description" content="${description}"`)
    .replace(/<meta property="og:title" content=".*?"/, `<meta property="og:title" content="${title}"`)
    .replace(/<meta property="og:description" content=".*?"/, `<meta property="og:description" content="${description}"`)
    .replace(/<meta property="og:image" content=".*?"/, `<meta property="og:image" content="${image}"`)
    .replace(/<meta property="og:url" content=".*?"/, `<meta property="og:url" content="${canonicalUrl}"`)
    .replace(/<meta name="twitter:title" content=".*?"/, `<meta name="twitter:title" content="${title}"`)
    .replace(/<meta name="twitter:description" content=".*?"/, `<meta name="twitter:description" content="${description}"`)
    .replace(/<meta name="twitter:image" content=".*?"/, `<meta name="twitter:image" content="${image}"`)
    .replace(/<link rel="canonical" href=".*?"/, `<link rel="canonical" href="${canonicalUrl}"`);

  // Optionally, replace the article content, title, author, etc. in the body if you use placeholders (e.g., {{postTitle}})
  // html = html.replace('{{postTitle}}', title).replace('{{postContent}}', post.content);

  res.send(html);
});

app.post("/api/auth/change-password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Current and new password required." });

    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Current password is incorrect." });

    const hashed = await bcrypt.hash(newPassword, 12);
    user.password = hashed;
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (e) {
    console.error("Change password error:", e);
    res.status(500).json({ message: "Server error" });
  }
});
// Replace this block that uses router.patch(...)
app.patch('/api/auth/me', authenticate, async (req, res) => {
  const updates = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Only allow these keys to be updated
  const allowed = [
    "fullname", "institution", "country", "location", "phone",
    "level", "department", "faculty", "role", "religion",
    "address", "zip", "bio"
  ];

  allowed.forEach(key => {
    if (updates[key] !== undefined) user[key] = updates[key];
  });

  // Handle nested social object
  if (typeof updates.social === "object" && updates.social !== null) {
    user.social = user.social || {};
    for (const [k, v] of Object.entries(updates.social)) {
      user.social[k] = v;
    }
  }
  await user.save();
  res.json(user);
});
app.patch('/users/:id', authenticate, async (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ error: "Forbidden" });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  Object.assign(user, req.body);
  await user.save();
  res.json(user);
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



// Registration endpoint with auto-create for faculty/department
// Registration endpoint with auto-create for faculty/department
app.post("/api/auth/register", uploadProfilePic.single("profilePic"), async (req, res) => {
  try {
    // DEVICE CHECK START
    const deviceId = req.cookies.device_id;
    if (!deviceId) {
      return res.status(400).json({ message: "Device ID missing. Please enable cookies." });
    }
    const regExists = await DeviceRegistration.findOne({ deviceId });
    if (regExists) {
      // Optionally, you could even look up the user:
      // await User.findById(regExists.userId)
      return res.status(403).json({ message: "This device has already been used to register an account. Multiple registrations per device are not permitted." });
    }

    const {
      username,
      password,
      role,
      level,
      phone,
      email,
      faculty,
      department,
      fullname,
      ref
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
      profilePicUrl = `/uploads/profilepics/${req.file.filename}`;
    }
    if (!req.file && req.body.profilePic && req.body.profilePic.startsWith("data:image")) {
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

    // --- PATCH: Auto-create faculty/department if string name given ---
    function isObjectId(v) {
      return typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v);
    }
    let facultyId = null;
    let departmentId = null;

    if (faculty && faculty !== "") {
      if (isObjectId(faculty)) {
        const fac = await Faculty.findById(faculty);
        if (!fac) return res.status(400).json({ message: "Faculty not found." });
        facultyId = faculty;
      } else {
        let fac = await Faculty.findOne({ name: faculty });
        if (!fac) fac = await Faculty.create({ name: faculty });
        facultyId = fac._id;
      }
    }
    if (department && department !== "") {
      if (isObjectId(department)) {
        const dept = await Department.findById(department);
        if (!dept) return res.status(400).json({ message: "Department not found." });
        departmentId = department;
      } else {
        let dept = await Department.findOne({ name: department });
        if (!dept) {
          dept = await Department.create({ name: department, faculty: facultyId });
        }
        departmentId = dept._id;
      }
    }

    // --- EMAIL VERIFICATION LOGIC ---
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = new User({
      username,
      password: hashed,
      role: role || "student",
      faculty: facultyId,
      department: departmentId,
      email: email || "",
      level: level || "",
      phone: phone || "",
      fullname: fullname || "",
      profilePic: profilePicUrl,
      emailVerified: false, // <-- NEW
      emailVerificationToken: verificationToken // <-- NEW
    });

    await user.save();
    await DeviceRegistration.create({ deviceId, userId: user._id });

    // ---- AFFILIATE REFERRAL LOGIC ----
    if (ref && typeof ref === "string" && ref.trim().length > 0) {
      let Affiliate;
      try {
        Affiliate = require("../models/Affiliate.js").default || require("../models/Affiliate.js");
      } catch (err) {
        Affiliate = null;
      }
      if (Affiliate) {
        const affiliate = await Affiliate.findOne({ referralCode: ref.trim() });
        if (affiliate) {
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
    if (email) {
      const verifyUrl = `https//oau.examguard.com.ng/verify-email?token=${verificationToken}&id=${user._id}`;
      try {
        await client.sendEmail({
  From: "richardochuko@examguard.com.ng",
  To: user.email,
  Subject: "Verify your Email - Welcome to OAU ExamGuard",
  HtmlBody: `
<!DOCTYPE html>
<html lang="en" style="background:#f3f7fb;">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Verify Your Email | OAU ExamGuard</title>
  <style>
    body {background:#f3f7fb;font-family:'Segoe UI',Roboto,Arial,sans-serif;margin:0;padding:0;color:#1b2541;}
    .container {max-width:540px;margin:32px auto;background:#fff;border-radius:18px;box-shadow:0 6px 32px #276ef11a;padding:40px 24px 28px 24px;}
    .logo {display:block;margin:0 auto 26px auto;width:80px;border-radius:14px;box-shadow:0 2px 8px #276ef11a;background:#fff;}
    .title {color:#276EF1;font-size:2rem;font-weight:800;text-align:center;margin-bottom:12px;}
    .subtitle {font-size:1.12rem;color:#1b2541;text-align:center;margin-bottom:12px;}
    .button {display:block;margin:38px auto 15px auto;padding:16px 0;width:90%;max-width:330px;background:linear-gradient(90deg,#276EF1 60%,#003366 100%);color:#fff;text-align:center;text-decoration:none;font-size:1.13rem;font-weight:bold;border-radius:999px;letter-spacing:0.02em;box-shadow:0 2px 10px #276ef140;}
    .button:hover {background:linear-gradient(90deg,#003366 60%,#276EF1 100%);}
    .info {font-size:.99rem;color:#222;margin:18px 0 18px 0;line-height:1.6;text-align:center;}
    .support {margin:16px 0 0 0;text-align:center;font-size:.98rem;color:#555;}
    .link {word-break:break-all;color:#276EF1;text-decoration:underline;}
    .footer {margin-top:32px;color:#bbb;font-size:.93rem;text-align:center;border-top:1px solid #eee;padding-top:16px;}
    .socials {text-align:center;margin-top:18px;}
    .socials a {display:inline-block;margin:0 8px;}
    .socials img {width:32px;height:32px;}
    @media (max-width:600px) {.container{padding:16px 3vw;}.title{font-size:1.3rem;}.logo{width:56px;}}
  </style>
</head>
<body>
  <div class="container">
    <img class="logo" src="https://oau.examguard.com.ng/logo.png" alt="OAU ExamGuard Logo">
    <div class="title">Verify your Email Address</div>
    <div class="subtitle">
      Hi <b>${user.fullname || user.username},</b>
    </div>
    <div class="subtitle" style="font-size:1.01rem;">
      Thank you for registering with <b>OAU ExamGuard Nigeria</b>!<br>
      Please verify your email to activate your account and access all features.
    </div>
    <a href="${verifyUrl}" class="button" target="_blank">Verify My Email</a>
    <div class="info">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <span class="link">${verifyUrl}</span>
    </div>
    <div class="support">
      Need help? <a class="link" style="color:#276EF1;" href="mailto:support@examguard.com.ng">Contact Support</a>
    </div>
    <div class="socials">
      <a href="https://facebook.com/OAUExamGuard" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg" alt="Facebook"></a>
      <a href="https://twitter.com/OAUExamGuard" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/twitter.svg" alt="Twitter"></a>
      <a href="https://instagram.com/OAUExamGuard" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg" alt="Instagram"></a>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} OAU ExamGuard. All rights reserved.<br>
      123 ExamGuard Ave, OAU Campus, Ile-Ife, Nigeria
    </div>
  </div>
</body>
</html>
`
});
        console.log("Verification email sent to " + user.email);
      } catch (err) {
        console.error("Error sending verification email via Postmark:", err);
      }
    }

    res.status(201).json({
      message: "Registration successful. Please check your email for a verification link before logging in. Check you spam folder if not found in Inbox",
      profilePic: profilePicUrl
    });
  } catch (e) {
    console.error("Register error:", e);
    res.status(500).json({message: "Server error"});
  }
}); 

// --- AI Question Generator/Converter Endpoint using Gemini API ---
app.post('/api/ai-questions', async (req, res) => {
  const { type, topic, number, faculty, department, text } = req.body;
  if (!GEMINI_API_KEY) return res.status(500).json({ error: "Missing Gemini API key" });

  let SYSTEM_PROMPT = "";
  if (type === "generate") {
    if (!topic || !number || !faculty || !department) {
      return res.status(400).json({ error: "Missing required fields for question generation" });
    }
    SYSTEM_PROMPT = `
You are an expert assessment designer for university-level exams.
Generate exactly ${number} multiple-choice questions for the topic "${topic}" under the faculty "${faculty}" and department "${department}".
The questions must not be too simple or too hard and must not use too complicated terms because it is for 100level OAU students, use html tags for highlighting where and when necessary, but should be tricky and nuanced.
For each question, provide 4 options with almost equal lengths and nuances but shouldn't be too long—don't make the correct answer obvious or easy to guess.
Format the output as a JSON object only, with this structure:

{
  "title": "${topic}",
  "status": "ACTIVE",
  "faculty": "${faculty}",
  "department": "${department}",
  "questions": [
    {
      "id": 1,
      "question": "Your question text here",
      "options": [
        {"text": "Option A"},
        {"text": "Option B"},
        {"text": "Option C"},
        {"text": "Option D"}
      ],
      "answer": "One of the above options",
      "explanation": "Short explanation for the correct answer. Use good HTML tags for breaking words into new lines where necessary for neatness and clarity, also try explain why other options are wrong. Use the actual multiplication sign (×) for multiplication instead of using asterisk.",
      "questionImage": ""
    }
    // ... repeat for all questions
  ]
}

- Do not add any comments, explanations, or text outside the JSON object.
- Use only the JSON file as your output, no code block markers, and no extra commentary.
`;
  } else if (type === "convert") {
    if (!text) return res.status(400).json({ error: "Missing text for conversion" });
    SYSTEM_PROMPT = `
You are a university exam question parser.
Convert the following pasted questions (may be in free form or exam-style) into a clean JSON file using this structure:

{
  "title": "Inferred or best topic",
  "status": "ACTIVE",
  "faculty": "Inferred or leave blank if not known",
  "department": "Inferred or leave blank if not known",
  "questions": [
    {
      "id": 1,
      "question": "Question text",
      "options": [
        {"text": "Option A"},
        {"text": "Option B"},
        {"text": "Option C"},
        {"text": "Option D"}
      ],
      "answer": "Correct option text",
      "explanation": "Short explanation for the correct answer. Use good HTML tags for breaking words into new lines where necessary for neatness and clarity, also try explain why other options are wrong. Use the actual multiplication sign (×) for multiplication instead of using asterisk.",
      "questionImage": ""
    }
    // ... for each question
  ]
}

The response must be valid JSON only. Do not add any code block markers, comments, or extra explanation—just the JSON file.
Here are the questions to convert:
${text}
`;
  } else {
    return res.status(400).json({ error: "Invalid type. Must be 'generate' or 'convert'." });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: SYSTEM_PROMPT }] }] })
      }
    );
    const data = await response.json();
    if (data.error || !data.candidates) {
      return res.status(400).json({ error: data.error?.message || "Gemini API error", raw: data });
    }
    // Gemini returns JSON as plain text
    const result = data.candidates[0]?.content?.parts[0]?.text || "";
    // Optionally: validate that it's valid JSON, else send as plain text
    try {
      JSON.parse(result); // Throws if not valid JSON
      res.type('application/json').send(result.trim());
    } catch {
      // If not valid JSON, but still Gemini's best try, just return as text
      res.type('text/plain').send(result.trim());
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
// --- EMAIL VERIFICATION ENDPOINT ---
app.get("/api/auth/verify-email", async (req, res) => {
  const { token, id } = req.query;
  if (!token || !id) return res.status(400).json({ message: "Invalid verification link" });
  const user = await User.findById(id);
  if (!user || user.emailVerificationToken !== token) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }
  user.emailVerified = true;
  user.emailVerificationToken = "";
  await user.save();
  res.json({ message: "Email verified successfully! You can now log in." });
});
// --- LOGIN ENDPOINT: BLOCK NON-VERIFIED EMAILS ---
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
      { expiresIn: "7d" }
    );
    res.json({ token, message: "Login successful" });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ message: "Server error" });
  }
});
// --- SEND PASSWORD RESET CODE via EMAIL ---
app.post("/api/auth/send-reset-code", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email address is required." });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found with this email address." });
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 15 minutes from now
    user.resetPasswordCode = resetCode;
    user.resetPasswordCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // Send email with reset code
    const emailContent = `
<!DOCTYPE html>
<html lang="en" style="background:#f3f7fb;">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Password Reset Code | OAU ExamGuard</title>
  <style>
    body {background:#f3f7fb;font-family:'Segoe UI',Roboto,Arial,sans-serif;margin:0;padding:0;color:#1b2541;}
    .container {max-width:540px;margin:32px auto;background:#fff;border-radius:18px;box-shadow:0 6px 32px #276ef11a;padding:40px 24px 28px 24px;}
    .logo {display:block;margin:0 auto 26px auto;width:80px;border-radius:14px;box-shadow:0 2px 8px #276ef11a;background:#fff;}
    .title {color:#276EF1;font-size:2rem;font-weight:800;text-align:center;margin-bottom:12px;}
    .subtitle {font-size:1.12rem;color:#1b2541;text-align:center;margin-bottom:12px;}
    .code-box {background:linear-gradient(90deg,#276EF1 0%,#003366 100%);color:#fff;border-radius:12px;padding:24px;text-align:center;margin:24px 0;font-size:2.5rem;font-weight:800;letter-spacing:8px;font-family:monospace;}
    .info {font-size:.99rem;color:#222;margin:18px 0 18px 0;line-height:1.6;text-align:center;}
    .warning {background:#fff3cd;border-left:4px solid #ffc107;padding:16px;border-radius:6px;margin:18px 0;font-size:.95rem;color:#856404;}
    .support {margin:16px 0 0 0;text-align:center;font-size:.98rem;color:#555;}
    .link {word-break:break-all;color:#276EF1;text-decoration:underline;}
    .footer {margin-top:32px;color:#bbb;font-size:.93rem;text-align:center;border-top:1px solid #eee;padding-top:16px;}
    .socials {text-align:center;margin-top:18px;}
    .socials a {display:inline-block;margin:0 8px;}
    .socials img {width:32px;height:32px;}
    @media (max-width:600px) {.container{padding:16px 3vw;}.title{font-size:1.3rem;}.logo{width:56px;}.code-box{font-size:1.8rem;letter-spacing:4px;}}
  </style>
</head>
<body>
  <div class="container">
    <img class="logo" src="https://oau.examguard.com.ng/logo.png" alt="OAU ExamGuard Logo">
    <div class="title">Password Reset Code</div>
    <div class="subtitle">
      Hi <b>${user.fullname || user.username},</b>
    </div>
    <div class="subtitle" style="font-size:1.01rem;">
      We received a request to reset your password. Use the code below to proceed:
    </div>
    <div class="code-box">${resetCode}</div>
    <div class="info">
      This code will expire in <b>15 minutes</b>. Do not share this code with anyone.
    </div>
    <div class="warning">
      <strong>⚠️ Security Notice:</strong> If you did not request a password reset, please ignore this email and your password will remain unchanged. Your account is secure.
    </div>
    <div class="support">
      Need help? <a class="link" style="color:#276EF1;" href="mailto:support@examguard.com.ng">Contact Support</a>
    </div>
    <div class="socials">
      <a href="https://facebook.com/OAUExamGuard" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg" alt="Facebook"></a>
      <a href="https://twitter.com/OAUExamGuard" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/twitter.svg" alt="Twitter"></a>
      <a href="https://instagram.com/OAUExamGuard" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg" alt="Instagram"></a>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} OAU ExamGuard. All rights reserved.<br>
      123 ExamGuard Ave, OAU Campus, Ile-Ife, Nigeria
    </div>
  </div>
</body>
</html>
`;

    try {
      await client.sendEmail({
        From: "richardochuko@examguard.com.ng",
        To: user.email,
        Subject: "Your Password Reset Code - OAU ExamGuard",
        HtmlBody: emailContent
      });
      res.status(200).json({ message: "Verification code sent to your email. Please check your inbox (and spam/promotions folders)." });
    } catch (err) {
      console.error("Error sending reset code email:", err);
      res.status(500).json({ message: "Failed to send email. Please try again." });
    }
  } catch (e) {
    console.error("Send reset code error:", e);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});


app.post("/api/auth/reset-with-email", async (req, res) => {
  try {
    const { email, code, password } = req.body;
    
    if (!email || !code || !password) {
      return res.status(400).json({ message: "Email, code, and password are required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if code matches and hasn't expired
    if (user.resetPasswordCode !== code) {
      return res.status(400).json({ message: "Invalid verification code." });
    }

    if (!user.resetPasswordCodeExpires || new Date() > user.resetPasswordCodeExpires) {
      return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
    }

    // Hash new password
    const hashed = await bcrypt.hash(password, 12);
    user.password = hashed;
    
    // Clear reset code fields
    user.resetPasswordCode = undefined;
    user.resetPasswordCodeExpires = undefined;
    
    await user.save();

    // Send confirmation email
 const confirmationEmailContent = `

<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Password Reset Confirmation | OAU ExamGuard</title>
  <style type="text/css">
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      width: 100%;
      background-color: #f5f7fa;
    }

    body {
      width: 100%;
      background-color: #f5f7fa;
      font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1b2541;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    table {
      border-collapse: collapse;
      border-spacing: 0;
      width: 100%;
    }

    td {
      padding: 0;
      vertical-align: top;
    }

    img {
      border: 0;
      outline: none;
      text-decoration: none;
      display: block;
    }

    a {
      color: #1e5ba8;
      text-decoration: none;
    }

    /* Main container */
    .email-wrapper {
      width: 100%;
      background: #f5f7fa;
      padding: 30px 0;
    }

    .email-container {
      width: 100%;
      max-width: 620px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    /* HEADER SECTION */
    .header {
      background: linear-gradient(135deg, #1e5ba8 0%, #0d3d7a 50%, #003d66 100%);
      padding: 50px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .header-inner {
      position: relative;
      z-index: 2;
    }

    .logo-circle {
      width: 110px;
      height: 110px;
      background: #ffffff;
      border-radius: 50%;
      margin: 0 auto 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    .logo-circle img {
      width: 85px;
      height: 85px;
      object-fit: contain;
    }

    .header-title {
      font-size: 28px;
      font-weight: 900;
      color: #ffffff;
      margin: 16px 0 12px;
      line-height: 1.3;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .header-subtitle {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.95);
      font-weight: 500;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }

    /* CONTENT SECTION */
    .content-wrapper {
      padding: 48px 40px;
    }

    .greeting {
      font-size: 20px;
      font-weight: 700;
      color: #1e5ba8;
      margin-bottom: 28px;
    }

    /* Success Message */
    .success-message {
      text-align: center;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.03) 100%);
      border: 1px solid rgba(16, 185, 129, 0.15);
      border-radius: 12px;
      padding: 32px 24px;
      margin-bottom: 32px;
    }

    .success-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 50%;
      margin: 0 auto 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 36px;
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.25);
    }

    .success-text {
      font-size: 18px;
      font-weight: 700;
      color: #059669;
      margin-bottom: 8px;
    }

    .success-subtext {
      font-size: 14px;
      color: #475569;
      margin: 0;
    }

    /* Info Cards */
    .info-card {
      background: linear-gradient(135deg, #f0f6ff 0%, #e8f1ff 100%);
      border: 1px solid rgba(39, 110, 241, 0.1);
      border-left: 4px solid #1e5ba8;
      border-radius: 12px;
      padding: 28px;
      margin-bottom: 24px;
    }

    .card-title {
      font-size: 14px;
      font-weight: 700;
      color: #003d66;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 18px;
      display: block;
    }

    .card-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .card-list li {
      color: #1b2541;
      padding: 10px 0 10px 28px;
      position: relative;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.5;
    }

    .card-list li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
      font-size: 16px;
    }

    /* Security Warning */
    .security-warning {
      background: linear-gradient(135deg, #fff8e6 0%, #fffbf0 100%);
      border: 1px solid rgba(255, 152, 0, 0.15);
      border-left: 4px solid #ff9800;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .warning-title {
      color: #e65100;
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 10px;
      display: block;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }

    .warning-text {
      color: #d84315;
      font-size: 13px;
      line-height: 1.6;
      margin: 0;
    }

    /* Button */
    .button-container {
      text-align: center;
      margin: 36px 0;
    }

    .button {
      display: inline-block;
      background: linear-gradient(90deg, #1e5ba8 0%, #0d3d7a 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 15px 50px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 15px;
      box-shadow: 0 6px 24px rgba(30, 91, 168, 0.35);
      border: none;
      transition: all 0.3s ease;
    }

    .button:hover {
      background: linear-gradient(90deg, #154a8a 0%, #0a2d66 100%);
      box-shadow: 0 8px 32px rgba(30, 91, 168, 0.45);
      text-decoration: none;
    }

    /* Account Details */
    .account-details {
      background: linear-gradient(135deg, #f8fbff 0%, #f0f6ff 100%);
      border: 1px solid rgba(39, 110, 241, 0.1);
      border-radius: 12px;
      padding: 28px;
      margin-bottom: 24px;
    }

    .details-title {
      font-size: 14px;
      font-weight: 700;
      color: #003d66;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 18px;
      display: block;
    }

    .detail-item {
      display: block;
      padding: 12px 0;
      border-bottom: 1px solid rgba(39, 110, 241, 0.08);
      font-size: 13px;
    }

    .detail-item:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-weight: 700;
      color: #003d66;
      display: inline-block;
      min-width: 100px;
    }

    .detail-value {
      color: #475569;
    }

    /* Support Section */
    .support-section {
      text-align: center;
      padding: 28px 0;
      margin-bottom: 24px;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
    }

    .support-title {
      font-size: 15px;
      font-weight: 700;
      color: #1b2541;
      margin-bottom: 12px;
    }

    .support-text {
      color: #64748b;
      font-size: 13px;
      line-height: 1.6;
      margin: 0 0 14px 0;
    }

    .support-link {
      color: #1e5ba8;
      text-decoration: none;
      font-weight: 700;
    }

    .support-link:hover {
      text-decoration: underline;
    }

    /* Socials */
    .socials {
      text-align: center;
      padding: 28px 0;
      border-top: 1px solid #e2e8f0;
    }

    .socials-title {
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 16px;
      display: block;
    }

    .social-links {
      display: inline-block;
    }

    .social-link {
      display: inline-block;
      margin: 0 10px;
      text-decoration: none;
      transition: all 0.3s ease;
    }

    .social-link img {
      width: 32px;
      height: 32px;
      filter: brightness(0.7);
      transition: all 0.3s ease;
    }

    .social-link:hover img {
      transform: scale(1.15);
      filter: brightness(0.9);
    }

    /* FOOTER */
    .footer {
      background: linear-gradient(135deg, #f5f7fa 0%, #eef2ff 100%);
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }

    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.8;
      margin: 0;
    }

    .footer-brand {
      font-weight: 700;
      color: #1e5ba8;
    }

    .footer-divider {
      color: #cbd5e1;
      margin: 0 4px;
    }

    /* RESPONSIVE */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        border-radius: 12px;
      }

      .content-wrapper {
        padding: 32px 24px !important;
      }

      .header {
        padding: 40px 24px !important;
      }

      .logo-circle {
        width: 95px;
        height: 95px;
        margin-bottom: 20px;
      }

      .logo-circle img {
        width: 75px;
        height: 75px;
      }

      .header-title {
        font-size: 24px;
      }

      .greeting {
        font-size: 18px;
      }

      .info-card {
        padding: 20px;
      }

      .security-warning {
        padding: 20px;
      }

      .account-details {
        padding: 20px;
      }

      .button {
        padding: 14px 40px;
        font-size: 14px;
        width: 100%;
      }

      .support-section {
        padding: 20px 0;
      }

      .footer {
        padding: 24px;
      }
    }

    @media only screen and (max-width: 480px) {
      .content-wrapper {
        padding: 24px 16px !important;
      }

      .header {
        padding: 32px 16px !important;
      }

      .logo-circle {
        width: 85px;
        height: 85px;
      }

      .logo-circle img {
        width: 65px;
        height: 65px;
      }

      .header-title {
        font-size: 20px;
      }

      .header-subtitle {
        font-size: 12px;
      }

      .greeting {
        font-size: 16px;
      }

      .success-message {
        padding: 24px 16px;
      }

      .success-icon {
        width: 56px;
        height: 56px;
        font-size: 32px;
      }

      .info-card {
        padding: 16px;
      }

      .card-title {
        font-size: 13px;
      }

      .footer {
        padding: 20px 16px;
        font-size: 11px;
      }
    }
  </style>
</head>
<body>
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" bgcolor="#f5f7fa" style="padding: 20px 0;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);">
          
          <!-- HEADER -->
          <tr>
            <td bgcolor="#1e5ba8" style="padding: 50px 30px; text-align: center;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="#ffffff" style="border-radius: 50%; width: 110px; height: 110px; padding: 0;">
                          <img src="https://oau.examguard.com.ng/logo.png" alt="OAU ExamGuard Logo" width="85" height="85" style="display: block; border-radius: 50%; object-fit: contain;">
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #ffffff; line-height: 1.3; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);">Password Reset Successful</h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 12px;">
                    <p style="margin: 0; font-size: 14px; color: rgba(255, 255, 255, 0.95); font-weight: 500; letter-spacing: 0.3px; text-transform: uppercase;">Your ExamGuard Account Is Secure</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding: 48px 40px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                
                <!-- Greeting -->
                <tr>
                  <td style="padding-bottom: 28px;">
                    <p style="margin: 0; font-size: 20px; font-weight: 700; color: #1e5ba8;">Hi ${user.fullname || user.username},</p>
                  </td>
                </tr>

                <!-- Success Message -->
                <tr>
                  <td style="padding-bottom: 32px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.03) 100%); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 12px; padding: 32px 24px;">
                      <tr>
                        <td align="center" style="padding-bottom: 16px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" bgcolor="#10b981" style="border-radius: 50%; width: 64px; height: 64px; padding: 0;">
                                <p style="margin: 0; font-size: 36px; color: #ffffff; line-height: 64px; text-align: center;">✓</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom: 8px;">
                          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #059669;">Your password has been successfully reset!</p>
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <p style="margin: 0; font-size: 14px; color: #475569;">You can now log in using your new credentials</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Info Card 1 -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f0f6ff 0%, #e8f1ff 100%); border: 1px solid rgba(39, 110, 241, 0.1); border-left: 4px solid #1e5ba8; border-radius: 12px; padding: 28px;">
                      <tr>
                        <td style="padding-bottom: 18px;">
                          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #003d66; text-transform: uppercase; letter-spacing: 0.3px;">📋 What Just Happened</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="padding: 10px 0 10px 28px; position: relative; font-size: 14px; font-weight: 500; color: #1b2541; line-height: 1.5;">
                                <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 16px;">✓</span>
                                We have successfully updated your ExamGuard account password
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0 10px 28px; position: relative; font-size: 14px; font-weight: 500; color: #1b2541; line-height: 1.5;">
                                <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 16px;">✓</span>
                                Your account is now protected with your new password
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0 0 28px; position: relative; font-size: 14px; font-weight: 500; color: #1b2541; line-height: 1.5;">
                                <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 16px;">✓</span>
                                You can now log in using your new credentials
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Info Card 2 -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f0f6ff 0%, #e8f1ff 100%); border: 1px solid rgba(39, 110, 241, 0.1); border-left: 4px solid #1e5ba8; border-radius: 12px; padding: 28px;">
                      <tr>
                        <td style="padding-bottom: 18px;">
                          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #003d66; text-transform: uppercase; letter-spacing: 0.3px;">🔐 Security Tips</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="padding: 10px 0 10px 28px; position: relative; font-size: 14px; font-weight: 500; color: #1b2541; line-height: 1.5;">
                                <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 16px;">✓</span>
                                Keep your password secure and private
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0 10px 28px; position: relative; font-size: 14px; font-weight: 500; color: #1b2541; line-height: 1.5;">
                                <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 16px;">✓</span>
                                Do not share your credentials with anyone
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0 0 28px; position: relative; font-size: 14px; font-weight: 500; color: #1b2541; line-height: 1.5;">
                                <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 16px;">✓</span>
                                Consider changing your password regularly
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Security Warning -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #fff8e6 0%, #fffbf0 100%); border: 1px solid rgba(255, 152, 0, 0.15); border-left: 4px solid #ff9800; border-radius: 12px; padding: 24px;">
                      <tr>
                        <td style="padding-bottom: 10px;">
                          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #e65100; text-transform: uppercase; letter-spacing: 0.2px;">🔒 Important Security Notice</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="margin: 0; font-size: 13px; color: #d84315; line-height: 1.6;">If you did not request this password reset, please secure your account immediately by contacting our support team. Change your password again using a unique code we'll send you.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Button -->
                <tr>
                  <td align="center" style="padding: 36px 0;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="#1e5ba8" style="border-radius: 8px; padding: 15px 50px;">
                          <a href="https://oau.examguard.com.ng/login" style="display: block; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px;">Go to Login</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Account Details -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f8fbff 0%, #f0f6ff 100%); border: 1px solid rgba(39, 110, 241, 0.1); border-radius: 12px; padding: 28px;">
                      <tr>
                        <td style="padding-bottom: 18px;">
                          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #003d66; text-transform: uppercase; letter-spacing: 0.3px;">ℹ️ Account Information</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid rgba(39, 110, 241, 0.08); font-size: 13px;">
                          <strong style="color: #003d66;">Username:</strong> <span style="color: #475569;">${user.username}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid rgba(39, 110, 241, 0.08); font-size: 13px;">
                          <strong style="color: #003d66;">Email:</strong> <span style="color: #475569;">${user.email}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px;">
                          <strong style="color: #003d66;">Reset Time:</strong> <span style="color: #475569;">${new Date().toLocaleString()}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Support Section -->
                <tr>
                  <td style="padding: 28px 0; text-align: center; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #1b2541;">Need Further Assistance?</p>
                    <p style="margin: 0 0 14px 0; font-size: 13px; color: #64748b; line-height: 1.6;">If you have any questions or concerns about your account, our support team is here to help.</p>
                    <p style="margin: 0;"><a href="mailto:support@examguard.com.ng" style="color: #1e5ba8; text-decoration: none; font-weight: 700;">📧 Contact Support</a></p>
                  </td>
                </tr>

                <!-- Socials -->
                <tr>
                  <td style="padding: 28px 0; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 16px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px;">Follow Us</p>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                      <tr>
                        <td style="padding: 0 10px;">
                          <a href="https://facebook.com/OAUExamGuard" target="_blank" style="text-decoration: none; display: inline-block;">
                            <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg" alt="Facebook" width="32" height="32" style="filter: brightness(0.7); display: block;">
                          </a>
                        </td>
                        <td style="padding: 0 10px;">
                          <a href="https://twitter.com/OAUExamGuard" target="_blank" style="text-decoration: none; display: inline-block;">
                            <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/twitter.svg" alt="Twitter" width="32" height="32" style="filter: brightness(0.7); display: block;">
                          </a>
                        </td>
                        <td style="padding: 0 10px;">
                          <a href="https://instagram.com/OAUExamGuard" target="_blank" style="text-decoration: none; display: inline-block;">
                            <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg" alt="Instagram" width="32" height="32" style="filter: brightness(0.7); display: block;">
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td bgcolor="#f5f7fa" style="padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #94a3b8;"><span style="font-weight: 700; color: #1e5ba8;">© ${new Date().getFullYear()} OAU ExamGuard</span> <span style="color: #cbd5e1;">|</span> All rights reserved</p>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8;">Your Exam, Our Priority</p>
              <p style="margin: 0; font-size: 12px; color: #cbd5e1;">123 ExamGuard Ave, OAU Campus, Ile-Ife, Nigeria</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    try {
      console.log(`Attempting to send reset confirmation email to: ${user.email}`);
      await client.sendEmail({
        From: "richardochuko@examguard.com.ng",
        To: user.email,
        Subject: "Password Reset Confirmation - OAU ExamGuard",
        HtmlBody: confirmationEmailContent
      });
      console.log("✓ Reset confirmation email sent successfully to " + user.email);
    } catch (emailErr) {
      console.error("✗ Error sending reset confirmation email:", emailErr);
      // Still return success for password reset, but log the email error
      return res.json({ 
        message: "Password reset successful, but confirmation email could not be sent. Please contact support if needed.",
        warning: "Email delivery failed"
      });
    }

    res.json({ message: "Password reset successfully. Confirmation email sent to your account." });
  } catch (e) {
    console.error("Reset with email error:", e);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});
app.post("/api/auth/resend-verification", async (req, res) => {
  try {
    const { usernameOrEmail } = req.body;
    if (!usernameOrEmail) {
      return res.status(400).json({ message: "Username or email is required." });
    }

    // Find user by username OR email
    const user = await User.findOne({
      $or: [
        { username: usernameOrEmail },
        { email: usernameOrEmail }
      ]
    });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.emailVerified) {
      return res.status(200).json({ message: "Email already verified. You can log in." });
    }

    if (!user.email) {
      return res.status(400).json({ message: "This account does not have an email address. Please contact support." });
    }

    // Generate a new token and save
    user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
    await user.save();

    // Construct verify URL
    const verifyUrl = `${process.env.FROTEND_ORIGIN}/verify-email?token=${user.emailVerificationToken}&id=${user._id}`;

    // Send a rich HTML email
    await client.sendEmail({
      From: "richardochuko@examguard.com.ng",
      To: user.email,
      Subject: "Verify your email - OAU ExamGuard",
      HtmlBody: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Verify your Email | OAU ExamGuard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { background: #f5f7fa; margin: 0; padding: 0; }
          .container { max-width: 540px; margin: 32px auto; background: #fff; border-radius: 14px; box-shadow: 0 6px 32px rgba(39,110,241,.11); padding: 32px 24px; font-family: 'Roboto', Arial, sans-serif; }
          .logo { display: block; margin: 0 auto 21px auto; width: 90px; }
          .title { color: #276EF1; font-size: 1.75rem; font-weight: 800; text-align: center; margin-bottom: 12px; }
          .description { font-size: 1.08rem; color: #222; text-align: center; margin-bottom: 22px; }
          .button { display: block; width: 90%; max-width: 330px; margin: 18px auto 24px auto; background: linear-gradient(90deg, #276EF1 60%, #003366 100%); color: #fff; text-align: center; text-decoration: none; font-size: 1.11rem; font-weight: 700; padding: 1rem 0; border-radius: 9px; letter-spacing: 1px; box-shadow: 0 4px 18px rgba(39,110,241,.19); }
          .greeting { margin-bottom: 17px; color: #003366; font-size: 1.09rem; }
          .info { font-size: .97rem; color: #222; margin-bottom: 17px; line-height: 1.6; }
          .support { margin: 28px 0 0 0; text-align: center; font-size: .97rem; color: #555; }
          .link { word-break: break-all; color: #276EF1; }
          .footer { margin-top: 36px; color: #bbb; font-size: .91rem; text-align: center; }
          .socials img { width: 30px; margin: 0 6px; }
          @media (max-width:600px) {
            .container { padding: 18px 3vw; }
            .title { font-size: 1.2rem; }
            .logo { width: 60px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img class="logo" src="https://oau.examguard.com.ng/logo.png" alt="OAU ExamGuard Logo">
          <div class="title">Verify your Email Address</div>
          <div class="description">
            Hi <strong>${user.fullname || user.username}</strong>,<br>
            You're almost ready to access secure exams, resources, and more.
          </div>
          <div class="greeting">Please verify your email address to activate your ExamGuard account:</div>
          <a href="${verifyUrl}" class="button">Verify My Email</a>
          <div class="info">
            Can't click? Copy and paste the link below into your browser:<br>
            <span class="link">${verifyUrl}</span>
          </div>
          <div class="support">
            If you did not sign up for OAU ExamGuard, you can safely ignore this email.<br>
            Need help? Contact us at <a href="mailto:support@examguard.com.ng" style="color:#276EF1;">support@examguard.com.ng</a>
          </div>
          <div class="socials" style="text-align:center;margin-top:28px;">
            <a href="https://facebook.com/examguard" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg" alt="Facebook" title="Facebook"></a>
            <a href="https://twitter.com/examguard" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/twitter.svg" alt="Twitter" title="Twitter"></a>
            <a href="https://instagram.com/examguard" target="_blank"><img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg" alt="Instagram" title="Instagram"></a>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} OAU ExamGuard. All rights reserved.<br>
            123 ExamGuard Ave, OAU Campus, Ile-Ife, Nigeria
          </div>
        </div>
      </body>
      </html>
      `
    });

    res.status(200).json({ message: "Verification email sent! Please check your email inbox (and spam/promotions folders)." });
  } catch (e) {
    console.error("Resend verification error:", e);
    res.status(500).json({ message: "Something went wrong. Please try again or contact support." });
  }
});
app.post("/api/auth/reset", async (req, res) => {
  try {
    const { studentId, password } = req.body;
    if (!studentId || !password)
      return res.status(400).json({ message: "Student ID and new password required" });

    const user = await User.findOne({ studentId });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    // Check if user has email
    if (!user.email) {
      console.warn(`User ${user.username} has no email address. Skipping email send.`);
      const hashed = await bcrypt.hash(password, 12);
      user.password = hashed;
      await user.save();
      return res.json({ message: "Password reset successful, but no email address on file to send confirmation." });
    }

    const hashed = await bcrypt.hash(password, 12);
    user.password = hashed;
    await user.save();

    // Send password reset confirmation email
const emailContent = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Password Reset Confirmation | OAU ExamGuard</title>
  <style type="text/css">
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      width: 100%;
      background-color: #f5f7fa;
    }

    body {
      width: 100%;
      background-color: #f5f7fa;
      font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1b2541;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    table {
      border-collapse: collapse;
      border-spacing: 0;
      width: 100%;
    }

    td {
      padding: 0;
      vertical-align: top;
    }

    img {
      border: 0;
      outline: none;
      text-decoration: none;
      display: block;
    }

    a {
      color: #1e5ba8;
      text-decoration: none;
    }

    /* Main container */
    .email-wrapper {
      width: 100%;
      background: #f5f7fa;
      padding: 30px 0;
    }

    .email-container {
      width: 100%;
      max-width: 620px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    /* HEADER SECTION */
    .header {
      background: linear-gradient(135deg, #1e5ba8 0%, #0d3d7a 50%, #003d66 100%);
      padding: 50px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .header-inner {
      position: relative;
      z-index: 2;
    }

    .logo-circle {
      width: 110px;
      height: 110px;
      background: #ffffff;
      border-radius: 50%;
      margin: 0 auto 24px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    .logo-circle img {
      width: 85px;
      height: 85px;
      object-fit: contain;
    }

    .header-title {
      font-size: 28px;
      font-weight: 900;
      color: #ffffff;
      margin: 16px 0 12px;
      line-height: 1.3;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .header-subtitle {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.95);
      font-weight: 500;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }

    /* CONTENT SECTION */
    .content-wrapper {
      padding: 48px 40px;
    }

    .greeting {
      font-size: 20px;
      font-weight: 700;
      color: #1e5ba8;
      margin-bottom: 28px;
    }

    /* Success Message */
    .success-message {
      text-align: center;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.03) 100%);
      border: 1px solid rgba(16, 185, 129, 0.15);
      border-radius: 12px;
      padding: 32px 24px;
      margin-bottom: 32px;
    }

    .success-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 50%;
      margin: 0 auto 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 36px;
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.25);
    }

    .success-text {
      font-size: 18px;
      font-weight: 700;
      color: #059669;
      margin-bottom: 8px;
    }

    .success-subtext {
      font-size: 14px;
      color: #475569;
      margin: 0;
    }

    /* Info Cards */
    .info-card {
      background: linear-gradient(135deg, #f0f6ff 0%, #e8f1ff 100%);
      border: 1px solid rgba(39, 110, 241, 0.1);
      border-left: 4px solid #1e5ba8;
      border-radius: 12px;
      padding: 28px;
      margin-bottom: 24px;
    }

    .card-title {
      font-size: 14px;
      font-weight: 700;
      color: #003d66;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 18px;
      display: block;
    }

    .card-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .card-list li {
      color: #1b2541;
      padding: 10px 0 10px 28px;
      position: relative;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.5;
    }

    .card-list li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
      font-size: 16px;
    }

    /* Security Warning */
    .security-warning {
      background: linear-gradient(135deg, #fff8e6 0%, #fffbf0 100%);
      border: 1px solid rgba(255, 152, 0, 0.15);
      border-left: 4px solid #ff9800;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }

    .warning-title {
      color: #e65100;
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 10px;
      display: block;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }

    .warning-text {
      color: #d84315;
      font-size: 13px;
      line-height: 1.6;
      margin: 0;
    }

    /* Button */
    .button-container {
      text-align: center;
      margin: 36px 0;
    }

    .button {
      display: inline-block;
      background: linear-gradient(90deg, #1e5ba8 0%, #0d3d7a 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 15px 50px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 15px;
      box-shadow: 0 6px 24px rgba(30, 91, 168, 0.35);
      border: none;
      transition: all 0.3s ease;
    }

    .button:hover {
      background: linear-gradient(90deg, #154a8a 0%, #0a2d66 100%);
      box-shadow: 0 8px 32px rgba(30, 91, 168, 0.45);
      text-decoration: none;
    }

    /* Account Details */
    .account-details {
      background: linear-gradient(135deg, #f8fbff 0%, #f0f6ff 100%);
      border: 1px solid rgba(39, 110, 241, 0.1);
      border-radius: 12px;
      padding: 28px;
      margin-bottom: 24px;
    }

    .details-title {
      font-size: 14px;
      font-weight: 700;
      color: #003d66;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 18px;
      display: block;
    }

    .detail-item {
      display: block;
      padding: 12px 0;
      border-bottom: 1px solid rgba(39, 110, 241, 0.08);
      font-size: 13px;
    }

    .detail-item:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-weight: 700;
      color: #003d66;
      display: inline-block;
      min-width: 100px;
    }

    .detail-value {
      color: #475569;
    }

    /* Support Section */
    .support-section {
      text-align: center;
      padding: 28px 0;
      margin-bottom: 24px;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
    }

    .support-title {
      font-size: 15px;
      font-weight: 700;
      color: #1b2541;
      margin-bottom: 12px;
    }

    .support-text {
      color: #64748b;
      font-size: 13px;
      line-height: 1.6;
      margin: 0 0 14px 0;
    }

    .support-link {
      color: #1e5ba8;
      text-decoration: none;
      font-weight: 700;
    }

    .support-link:hover {
      text-decoration: underline;
    }

    /* Socials */
    .socials {
      text-align: center;
      padding: 28px 0;
      border-top: 1px solid #e2e8f0;
    }

    .socials-title {
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 16px;
      display: block;
    }

    .social-links {
      display: inline-block;
    }

    .social-link {
      display: inline-block;
      margin: 0 10px;
      text-decoration: none;
      transition: all 0.3s ease;
    }

    .social-link img {
      width: 32px;
      height: 32px;
      filter: brightness(0.7);
      transition: all 0.3s ease;
    }

    .social-link:hover img {
      transform: scale(1.15);
      filter: brightness(0.9);
    }

    /* FOOTER */
    .footer {
      background: linear-gradient(135deg, #f5f7fa 0%, #eef2ff 100%);
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }

    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.8;
      margin: 0;
    }

    .footer-brand {
      font-weight: 700;
      color: #1e5ba8;
    }

    .footer-divider {
      color: #cbd5e1;
      margin: 0 4px;
    }

    /* RESPONSIVE */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        border-radius: 12px;
      }

      .content-wrapper {
        padding: 32px 24px !important;
      }

      .header {
        padding: 40px 24px !important;
      }

      .logo-circle {
        width: 95px;
        height: 95px;
        margin-bottom: 20px;
      }

      .logo-circle img {
        width: 75px;
        height: 75px;
      }

      .header-title {
        font-size: 24px;
      }

      .greeting {
        font-size: 18px;
      }

      .info-card {
        padding: 20px;
      }

      .security-warning {
        padding: 20px;
      }

      .account-details {
        padding: 20px;
      }

      .button {
        padding: 14px 40px;
        font-size: 14px;
        width: 100%;
      }

      .support-section {
        padding: 20px 0;
      }

      .footer {
        padding: 24px;
      }
    }

    @media only screen and (max-width: 480px) {
      .content-wrapper {
        padding: 24px 16px !important;
      }

      .header {
        padding: 32px 16px !important;
      }

      .logo-circle {
        width: 85px;
        height: 85px;
      }

      .logo-circle img {
        width: 65px;
        height: 65px;
      }

      .header-title {
        font-size: 20px;
      }

      .header-subtitle {
        font-size: 12px;
      }

      .greeting {
        font-size: 16px;
      }

      .success-message {
        padding: 24px 16px;
      }

      .success-icon {
        width: 56px;
        height: 56px;
        font-size: 32px;
      }

      .info-card {
        padding: 16px;
      }

      .card-title {
        font-size: 13px;
      }

      .footer {
        padding: 20px 16px;
        font-size: 11px;
      }
    }
  </style>
</head>
<body>
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" bgcolor="#f5f7fa" style="padding: 20px 0;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);">
          
          <!-- HEADER -->
          <tr>
            <td bgcolor="#1e5ba8" style="padding: 50px 30px; text-align: center;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="#ffffff" style="border-radius: 50%; width: 110px; height: 110px; padding: 0;">
                          <img src="https://oau.examguard.com.ng/logo.png" alt="OAU ExamGuard Logo" width="85" height="85" style="display: block; border-radius: 50%; object-fit: contain;">
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #ffffff; line-height: 1.3; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);">Password Reset Successful</h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 12px;">
                    <p style="margin: 0; font-size: 14px; color: rgba(255, 255, 255, 0.95); font-weight: 500; letter-spacing: 0.3px; text-transform: uppercase;">Your ExamGuard Account Is Secure</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding: 48px 40px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                
                <!-- Greeting -->
                <tr>
                  <td style="padding-bottom: 28px;">
                    <p style="margin: 0; font-size: 20px; font-weight: 700; color: #1e5ba8;">Hi ${user.fullname || user.username},</p>
                  </td>
                </tr>

                <!-- Success Message -->
                <tr>
                  <td style="padding-bottom: 32px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.03) 100%); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 12px; padding: 32px 24px;">
                      <tr>
                        <td align="center" style="padding-bottom: 16px;">
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" bgcolor="#10b981" style="border-radius: 50%; width: 64px; height: 64px; padding: 0;">
                                <p style="margin: 0; font-size: 36px; color: #ffffff; line-height: 64px; text-align: center;">✓</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom: 8px;">
                          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #059669;">Your password has been successfully reset!</p>
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <p style="margin: 0; font-size: 14px; color: #475569;">You can now log in using your new credentials</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Info Card 1 -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f0f6ff 0%, #e8f1ff 100%); border: 1px solid rgba(39, 110, 241, 0.1); border-left: 4px solid #1e5ba8; border-radius: 12px; padding: 28px;">
                      <tr>
                        <td style="padding-bottom: 18px;">
                          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #003d66; text-transform: uppercase; letter-spacing: 0.3px;">📋 What Just Happened</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="padding: 10px 0 10px 28px; position: relative; font-size: 14px; font-weight: 500; color: #1b2541; line-height: 1.5;">
                                <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 16px;">✓</span>
                                We have successfully updated your ExamGuard account password
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0 10px 28px; position: relative; font-size: 14px; font-weight: 500; color: #1b2541; line-height: 1.5;">
                                <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 16px;">✓</span>
                                Your account is now protected with your new password
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0 0 28px; position: relative; font-size: 14px; font-weight: 500; color: #1b2541; line-height: 1.5;">
                                <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 16px;">✓</span>
                                You can now log in using your new credentials
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Info Card 2 -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f0f6ff 0%, #e8f1ff 100%); border: 1px solid rgba(39, 110, 241, 0.1); border-left: 4px solid #1e5ba8; border-radius: 12px; padding: 28px;">
                      <tr>
                        <td style="padding-bottom: 18px;">
                          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #003d66; text-transform: uppercase; letter-spacing: 0.3px;">🔐 Security Tips</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="padding: 10px 0 10px 28px; position: relative; font-size: 14px; font-weight: 500; color: #1b2541; line-height: 1.5;">
                                <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 16px;">✓</span>
                                Keep your password secure and private
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0 10px 28px; position: relative; font-size: 14px; font-weight: 500; color: #1b2541; line-height: 1.5;">
                                <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 16px;">✓</span>
                                Do not share your credentials with anyone
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0 0 28px; position: relative; font-size: 14px; font-weight: 500; color: #1b2541; line-height: 1.5;">
                                <span style="position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 16px;">✓</span>
                                Consider changing your password regularly
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Security Warning -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #fff8e6 0%, #fffbf0 100%); border: 1px solid rgba(255, 152, 0, 0.15); border-left: 4px solid #ff9800; border-radius: 12px; padding: 24px;">
                      <tr>
                        <td style="padding-bottom: 10px;">
                          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #e65100; text-transform: uppercase; letter-spacing: 0.2px;">🔒 Important Security Notice</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p style="margin: 0; font-size: 13px; color: #d84315; line-height: 1.6;">If you did not request this password reset, please secure your account immediately by contacting our support team. Change your password again using a unique code we'll send you.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Button -->
                <tr>
                  <td align="center" style="padding: 36px 0;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="#1e5ba8" style="border-radius: 8px; padding: 15px 50px;">
                          <a href="https://oau.examguard.com.ng/login" style="display: block; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px;">Go to Login</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Account Details -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f8fbff 0%, #f0f6ff 100%); border: 1px solid rgba(39, 110, 241, 0.1); border-radius: 12px; padding: 28px;">
                      <tr>
                        <td style="padding-bottom: 18px;">
                          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #003d66; text-transform: uppercase; letter-spacing: 0.3px;">ℹ️ Account Information</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid rgba(39, 110, 241, 0.08); font-size: 13px;">
                          <strong style="color: #003d66;">Username:</strong> <span style="color: #475569;">${user.username}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid rgba(39, 110, 241, 0.08); font-size: 13px;">
                          <strong style="color: #003d66;">Email:</strong> <span style="color: #475569;">${user.email}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px;">
                          <strong style="color: #003d66;">Reset Time:</strong> <span style="color: #475569;">${new Date().toLocaleString()}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Support Section -->
                <tr>
                  <td style="padding: 28px 0; text-align: center; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #1b2541;">Need Further Assistance?</p>
                    <p style="margin: 0 0 14px 0; font-size: 13px; color: #64748b; line-height: 1.6;">If you have any questions or concerns about your account, our support team is here to help.</p>
                    <p style="margin: 0;"><a href="mailto:support@examguard.com.ng" style="color: #1e5ba8; text-decoration: none; font-weight: 700;">📧 Contact Support</a></p>
                  </td>
                </tr>

                <!-- Socials -->
                <tr>
                  <td style="padding: 28px 0; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 16px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px;">Follow Us</p>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                      <tr>
                        <td style="padding: 0 10px;">
                          <a href="https://facebook.com/OAUExamGuard" target="_blank" style="text-decoration: none; display: inline-block;">
                            <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg" alt="Facebook" width="32" height="32" style="filter: brightness(0.7); display: block;">
                          </a>
                        </td>
                        <td style="padding: 0 10px;">
                          <a href="https://twitter.com/OAUExamGuard" target="_blank" style="text-decoration: none; display: inline-block;">
                            <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/twitter.svg" alt="Twitter" width="32" height="32" style="filter: brightness(0.7); display: block;">
                          </a>
                        </td>
                        <td style="padding: 0 10px;">
                          <a href="https://instagram.com/OAUExamGuard" target="_blank" style="text-decoration: none; display: inline-block;">
                            <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg" alt="Instagram" width="32" height="32" style="filter: brightness(0.7); display: block;">
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td bgcolor="#f5f7fa" style="padding: 32px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #94a3b8;"><span style="font-weight: 700; color: #1e5ba8;">© ${new Date().getFullYear()} OAU ExamGuard</span> <span style="color: #cbd5e1;">|</span> All rights reserved</p>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8;">Your Exam, Our Priority</p>
              <p style="margin: 0; font-size: 12px; color: #cbd5e1;">123 ExamGuard Ave, OAU Campus, Ile-Ife, Nigeria</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    try {
      console.log(`Attempting to send reset email to: ${user.email}`);
      const emailResponse = await client.sendEmail({
        From: "richardochuko@examguard.com.ng",
        To: user.email,
        Subject: "Password Reset Confirmation - OAU ExamGuard",
        HtmlBody: emailContent
      });
      console.log("✓ Password reset confirmation email sent successfully to " + user.email, emailResponse);
    } catch (emailErr) {
      console.error("✗ Error sending password reset confirmation email:", emailErr);
      return res.json({ 
        message: "Password reset successful, but confirmation email could not be sent. Please contact support if needed.",
        warning: "Email delivery failed"
      });
    }

    res.json({ message: "Password reset successful. Confirmation email sent to your account." });
  } catch (e) {
    console.error("Reset error:", e);
    res.status(500).json({ message: "Server error" });
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

app.post("/api/apk", uploadToMemory.single("apk"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  try {
    // Extract the original filename (with .apk extension)
    let originalName = req.file.originalname;
    // Remove spaces or weird chars if needed:
    originalName = originalName.replace(/\s+/g, "_");

    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder: "apks",
        resource_type: "raw",
        public_id: originalName // Remove extension: Cloudinary will add it back for serving
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary APK upload error:", error);
          return res.status(500).json({ error: "Cloudinary upload failed" });
        }
        // The URL will now end with .apk!
        res.json({ url: result.secure_url });
      }
    );
    streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (e) {
    res.status(500).json({ error: "Upload failed" });
  }
});

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
// Add this to index.js (or a separate route file)
app.post('/api/ai-lecture', async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'Missing topic' });
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Missing Gemini API key' });

  const SYSTEM_PROMPT = `
You are an expert and professional university lecturer and instructional designer.  
Generate a comprehensive, well-formatted lecture note for the given topic, tailored for university students preparing for standard examination boards worldwide. The note must provide clear explanations, intelligent reasoning, logical breakdowns, and practical, good examples for all key concepts. It should be well-organized, detailed, and universally accessible to students in any country and any level.
You must sound completely humanly and a passionate one, avoid unnecessary greetings and unnecessary welcoming, make sure not to use regular AI terms such as crucial, explore and the likes, be good at teaching and using accurate materials for teaching. 
you are the best at your field, do not use too big grammars and unnecessary examples.
Your response must be a single valid JSON object, with no code block markers or commentary. Use this structure:
{
  "outlines": [ "Section 1 Title", "Section 2 Title", ... ],
  "introduction": "An engaging, clear introduction (80-150 words) that motivates students and previews the topic.",
  "introQuote": "A relevant, inspiring quote for students, if available.",
  "notes": {
    "Section 1 Title": "<detailed, logically organized content with explanatory paragraphs, breakdowns, sub-lists, and at least one smart, illustrative example per section. Each section must be at least 250 words. Provide notes that could probably not be found on the net and explain clearly to an average student.>",
    ... 
  },
  "flashcards": [
    {"term": "Key Term", "def": "Simple definition"},
    ...
  ] (5-10 items),
  "summary": "A clear, concise summary of the topic (about 80-120 words) highlighting the most important insights.",
  "examTips": [
    "Exam tip 1",
    "Exam tip 2",
    ...
  ] (4-7 items, focused on answering university exam questions effectively),
  "likelyExamQuestions": [
    "Likely exam question 1",
    "Likely exam question 2",
    ...
  ] (5-7 items, covering a range of cognitive levels such as explain, describe, compare, analyze, apply, evaluate)
}
Instructions:
- Structure the outlines to cover the topic logically from foundational concepts to advanced ideas, ensuring each section is detailed and well-explained.
- For each outline section, write a detailed, easy-to-read note in good English so that any university student can understand. Use clear explanations, stepwise breakdowns, and practical examples that are common and relatable.
- Use HTML formatting for subscripts, superscripts, highlights, formulas and others(e.g., headings, <ul>, <ol>, <b>, etc.) where appropriate for readability.
- Avoid using terms that makes sound robotic such as "In conclusion...", "Delve into...", "Understanding...", "Fascinating..." and the likes.
- Try as much as possible to be humanly and use common human terms and not regular AI terms.
- Search widely, use deep thinking and possible online resources to cover every major aspects of the topic and if possible, generate images.
- Do NOT mention that the lecture is AI-generated and ensure to give humanized lectures.
- The introduction and summary must be clear, friendly, and professional.
- At the end, provide 5-7 likely exam questions that test both basic understanding and higher-order thinking skills.
- The response must be valid JSON only. Do not add commentary or code block markers. The only output should be the JSON object.
Topic: ${topic}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: SYSTEM_PROMPT }] }] })
      }
    );
    const data = await response.json();
    if (data.error || !data.candidates) {
      return res.status(400).json({ error: data.error?.message || "Gemini API error", raw: data });
    }
    const result = data.candidates[0]?.content?.parts[0]?.text || "No response";
    res.json({ response: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
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

const io = new Server(server, { cors: { origin: "*", credentials: true }, path: "/liveclass" });
setupLiveClassSocket(io);
server.listen(process.env.PORT || 10000, ()=>console.log("Server with live class running!"));

app.use("/api/ai", aiMaterialRoutes);
app.use("/api/superadmin", superadminRoutes);
app.use("/api/blogger", bloggerAuthRoutes);
app.use("/uploads/blogger", express.static(path.join(process.cwd(), "uploads/blogger")));
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/codecxreg", codecxregRoutes);
app.use("/api/rewards", rewardsRoutes);
app.use("/uploads/pastquestions", express.static(path.join(process.cwd(), "uploads/pastquestions"))); // Serve files public
app.use("/api/pastquestions", pastQuestionsRoute);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/blogger-dashboard", bloggerDashboardRoutes);
app.use("/uploads/profilepics", express.static(path.join(process.cwd(), "uploads/profilepics")));
app.use("/api/questionsets", questionSetRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/past-questions", pastQuestionsRoutes);
app.use("/uploads/questions", express.static(path.join(process.cwd(), "uploads/questions")));
app.use("/api/schedules", scheduleRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/tutors", tutorsRoutes);
app.use("/api/adminstats", adminStatsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/registrations", registrationsRoutes);
app.use("/api/responses", responsesRoutes);
app.use("/api/affiliate", affiliateRoutes);
// Add this route registration with other routes
app.use("/api/affiliates", affiliateAuthRoutes);

app.use("/api/buyer-dashboard", buyerDashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/massages", massagesRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/applications", applicationsRoutes);
app.get("/", (req, res) => res.json({ status: "form platform api ok" }));
app.use("/api/reviews", reviewsRoutes);
app.use("/api/orders", ordersRoutes);
 app.use("/api", taxonomyRoutes);
app.use("/api", postsRoutes);
app.use("/api/studypadi/ai", studypadiAiRoutes);
app.use("/api/exam-set", examSetRoutes);
app.use("/api/cbt-questions", cbtQuestionsRoutes);
app.use("/api/theory-answers", theoryAnswersRoutes);
app.use("/api/theory-attempts", theoryAttemptsRoutes);
app.use("/api/theory-questions", theoryQuestionsRoutes);
app.use("/api/student", studentAuthRoutes);
app.use("/uploads/liveclass", express.static(path.join(process.cwd(), "uploads/liveclass"))); // Serve files publicly
app.use("/api/liveclass", liveclassRoutes);
app.use("/api/lecturenotes", lectureNotesRoutes);
app.use("/api/ai-chat", aiChatRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/studypadi", studypadiRoutes);
app.use("/api/resources", resourcesGridFSRoutes);
app.use('/api', studentsRouter);
app.use("/api/schools", schoolRegistrationRoutes);
app.use('/api', assignmentsRouter);
app.use("/api/admin", adminPostsRoutes);    // For /api/admin/allposts
app.use("/api/myposts", myPostsRoutes); // For /api/blogger-dashboard/myposts
app.get("/", (req, res) => res.json({status: "ok"}));
app.use("/api/account-settings", accountSettingsRouter);
app.use("/api/messages", messagesRoutes);
