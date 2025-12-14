import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import ExamSet from "../models/ExamSet.js"; // or wherever your exam sets are defined

const router = express.Router();

// JWT secret (set in your .env file)
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

// Multer setup
const passportUploadDir = "./uploads/passports";
if (!fs.existsSync(passportUploadDir)) {
  fs.mkdirSync(passportUploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, passportUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base.replace(/\s+/g, "_")}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed!"));
  }
});

// Middleware to protect routes
function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No authorization token." });
  const token = auth.replace(/^Bearer\s/, '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid/expired token." });
  }
}

router.post("/register", upload.single("passport"), async (req, res) => {
  try {
    let {
      fullName,
      email,
      phone,
      dob,
      gender,
      address,
      program,
      password,
      referral,
      guardianName,
      guardianPhone
    } = req.body;

    // Sanitize and normalize
    fullName = (fullName || "").trim();
    email = (email || "").trim().toLowerCase();
    phone = (phone || "").trim();

    if (!fullName || !email || !phone || !program || !password)
      return res.status(400).json({ message: "All required fields not provided" });
    if (!req.file) return res.status(400).json({ message: "Passport photo required." });

    // Check unique email and phone
    if (await User.findOne({ email })) return res.status(409).json({ message: "Email already registered." });
    if (await User.findOne({ phone })) return res.status(409).json({ message: "Phone already registered." });

    // Password strength check
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password))
      return res.status(400).json({ message: "Password too weak. Minimum 8 characters, letters and at least 1 digit." });

    const hash = await bcrypt.hash(password, 12);
    const user = new User({
      fullName,
      email, // Already sanitized!
      phone,
      dob,
      gender,
      address,
      program,
      password: hash,
      passport: `/uploads/passports/${req.file.filename}`,
      role: "student",
      paymentStatus: "pending",
      referral: referral || "",
      guardianName: guardianName || "",
      guardianPhone: guardianPhone || ""
    });
    await user.save();

    // Fast login after registration: return token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "14d" }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        fullName,
        email,
        program: user.program,
        role: user.role,
        paymentStatus: user.paymentStatus,
        passport: user.passport
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/exam-set/use-credit", authenticate, async (req, res) => {
  try {
    const { accessCode } = req.body;
    if (!accessCode) return res.status(400).json({ message: "Access code required." });

    // Find the student and exam set
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Student not found" });
    const examSet = await ExamSet.findOne({ accessCode });
    if (!examSet) return res.status(404).json({ message: "Invalid/expired Exam Access code." });

    // Check credits
    if ((user.creditPoints || 0) < 10) 
      return res.status(403).json({ message: "Insufficient credit points to access this exam." });

    // Optionally: Prevent students from attempting same exam multiple times w/ one access
    // If needed, add logic here using user.attemptedExams, etc.

    // Deduct 10 credit points and save
    user.creditPoints -= 10;
    await user.save();

    return res.json({
      message: "Exam access granted. 10 credit points deducted.",
      creditPoints: user.creditPoints,
      examSet, // You can send only examSet info! (not questions, if you want)
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
/**
 * Login Route (POST /api/student/login)
 * Body: { emailOrPhone, password }
 */
router.post("/login", async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password)
      return res.status(400).json({ message: "Email/Phone and password required." });

    // Find by email or phone
    const user = await User.findOne({
      $or: [
        { email: emailOrPhone },
        { phone: emailOrPhone }
      ]
    });
    if (!user) return res.status(401).json({ message: "Student not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "14d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        program: user.program,
        role: user.role,
        paymentStatus: user.paymentStatus,
        passport: user.passport
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * Get all students (GET /api/student/)
 * - Admin only
 */
router.get("/", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin")
      return res.status(403).json({ message: "Unauthorized" });
    const students = await User.find({ role: "student" }).select("-password -emailVerificationToken");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * Get my profile (GET /api/student/me)
 */
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -emailVerificationToken");
    if (!user) return res.status(404).json({ message: "Student not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
