import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import CodecxRegistration from "../models/CodecxRegistration.js";
import User from "../models/User.js";

dotenv.config();
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// JWT Middleware
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
function generateUsername(email, fullName) {
  if (email) return email.trim().toLowerCase();
  return (fullName.replace(/\s+/g, "").toLowerCase() + Math.floor(Math.random()*1000));
}
function generatePassword() {
  return "Codecx" + Math.floor(10000 + Math.random() * 90000);
}

// Registration endpoint - students sign up with fullName, email, phone
router.post("/", upload.fields([
  { name: "passport", maxCount: 1 }
]), async (req, res) => {
  try {
    const { fullName, email, phone } = req.body;
    if (!fullName || !email || !phone) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }
    function fileToBase64(file) {
      if (!file) return "";
      return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    }
    const passportBase64 = fileToBase64(req.files.passport?.[0]);
    const loginUsername = generateUsername(email, fullName);
    const loginPasswordPlain = generatePassword();
    const loginPasswordHash = await bcrypt.hash(loginPasswordPlain, 12);

    const registration = new CodecxRegistration({
      fullName,
      email: email.trim().toLowerCase(),
      phone,
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
      activities: []
    });

    await registration.save();

    // Create user account immediately (using email as username for uniqueness)
    let user = await User.findOne({
      $or: [
        { username: loginUsername },
        { email: email.trim().toLowerCase() }
      ]
    });
    if (!user) {
      user = new User({
        username: loginUsername,
        password: loginPasswordHash,
        role: "codec",
        email: email.trim().toLowerCase(),
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

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "Username and password required." });

    const candidate = await CodecxRegistration.findOne({
      $or: [
        { loginUsername: username.trim().toLowerCase() },
        { email: username.trim().toLowerCase() }
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
        loginUsername: candidate.loginUsername
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

// Update progress
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

// Record payment (manual verification from frontend)
router.post("/payments", authMiddleware, async (req, res) => {
  try {
    const { amount, ref } = req.body;
    if (!amount || !ref) return res.status(400).json({ message: "Amount and reference required" });
    const candidate = await CodecxRegistration.findById(req.user.id);
    if (!candidate) return res.status(404).json({ message: "User not found" });

    // Prevent duplicate payment records
    const alreadyPaid = candidate.payments.some(p => p.ref === ref);
    if (alreadyPaid) return res.status(200).json({ message: "Payment already recorded", payments: candidate.payments, hasPaid: candidate.hasPaid, lastPaymentRef: candidate.lastPaymentRef });

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

// Add activity (for custom logs)
router.post("/activities", authMiddleware, async (req, res) => {
  try {
    const { activity, status } = req.body;
    if (!activity) return res.status(400).json({ message: "Activity required" });
    const candidate = await CodecxRegistration.findById(req.user.id);
    if (!candidate) return res.status(404).json({ message: "User not found" });

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

// (Optional) Chat messages
router.post("/chat", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Text required" });
    const candidate = await CodecxRegistration.findById(req.user.id);
    if (!candidate) return res.status(404).json({ message: "User not found" });

    candidate.chatMessages = candidate.chatMessages || [];
    candidate.chatMessages.push({
      me: true,
      sender: candidate.fullName,
      avatar: candidate.passportBase64,
      text,
      date: new Date()
    });
    await candidate.save();
    res.json({ success: true, chatMessages: candidate.chatMessages });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/paystack-webhook", express.json({ type: "application/json" }), async (req, res) => {
  // Your Paystack secret key (never use public key for webhook validation!)
  const secret = process.env.PAYSTACK_SECRET_KEY || process.env.SECRET_KEY || "sk_test_xxx";
  const signature = req.headers["x-paystack-signature"];
  const hash = crypto.createHmac('sha512', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  if (hash !== signature) {
    console.error("Paystack webhook: Invalid signature");
    return res.sendStatus(401);
  }

  const event = req.body;
  // Only handle successful charge events
  if (event.event === "charge.success" && event.data && event.data.status === "success") {
    const email = event.data.customer.email?.trim().toLowerCase();
    
    let student = null;
    if (email) {
      student = await CodecxRegistration.findOne({ email });
    }
    if (!student) {
      console.error("Webhook: Student not found for", email);
      return res.status(404).json({ message: "Student not found" });
    }

    // Prevent duplicate payment records
    const alreadyPaid = student.payments.some(p => p.ref === event.data.reference);
    if (alreadyPaid) {
      console.log("Webhook: Duplicate payment for", student.email);
      return res.status(200).json({ message: "Payment already recorded" });
    }

    student.hasPaid = true;
    student.lastPaymentRef = event.data.reference;
    student.payments.push({
      date: new Date(),
      amount: event.data.amount / 100, // Paystack sends amount in kobo
      status: "Paid",
      ref: event.data.reference
    });
    student.activities.push({ date: new Date(), activity: `Payment made via Paystack: ₦${event.data.amount / 100}`, status: "Success" });
    await student.save();
    console.log("Webhook: Student payment updated for", student.email);
    return res.status(200).json({ message: "Student payment updated" });
  }
  // Always respond quickly to all events (Paystack expects 2xx)
  return res.sendStatus(200);
});

export default router;
