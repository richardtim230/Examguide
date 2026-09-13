import express from "express";
import RCCG_User from "../models/RCCG_User.js";
import authMiddleware from "../middleware/auth.js";
import { avatarUpload } from "../middleware/upload.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "please_set_a_strong_secret";

// ============ EMAIL CONFIGURATION ============
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Test transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.warn("Email service not available:", error.message);
  } else {
    console.log("Email service ready");
  }
});

// ============ HELPER FUNCTIONS ============

/**
 * Generate JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email,
      userType: user.userType
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * Send verification email with code
 */
async function sendVerificationEmail(email, fullName, verificationCode) {
  try {
    const emailContent = `
<!DOCTYPE html>
<html lang="en" style="background:#f3f7fa;">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Email Verification | RCCG Rehoboth Mega Cathedral</title>
  <style>
    body {background:#f3f7fa;font-family:'Segoe UI',Roboto,Arial,sans-serif;margin:0;padding:0;color:#1b2541;}
    .container {max-width:540px;margin:32px auto;background:#fff;border-radius:18px;box-shadow:0 6px 32px rgba(0,51,102,0.1);padding:40px 24px 28px 24px;}
    .logo {display:block;margin:0 auto 26px auto;width:80px;border-radius:14px;box-shadow:0 2px 8px rgba(0,51,102,0.1);background:#fff;}
    .title {color:#003366;font-size:2rem;font-weight:800;text-align:center;margin-bottom:12px;}
    .subtitle {font-size:1.12rem;color:#1b2541;text-align:center;margin-bottom:12px;}
    .code-box {background:linear-gradient(90deg,#003366 0%,#0047AB 100%);color:#fff;border-radius:12px;padding:24px;text-align:center;margin:24px 0;font-size:2.5rem;font-weight:800;letter-spacing:8px;font-family:monospace;}
    .info {font-size:.99rem;color:#222;margin:18px 0 18px 0;line-height:1.6;text-align:center;}
    .warning {background:#E6F4EA;border-left:4px solid #008037;padding:16px;border-radius:6px;margin:18px 0;font-size:.95rem;color:#008037;}
    .support {margin:16px 0 0 0;text-align:center;font-size:.98rem;color:#555;}
    .link {word-break:break-all;color:#003366;text-decoration:underline;}
    .footer {margin-top:32px;color:#bbb;font-size:.93rem;text-align:center;border-top:1px solid #eee;padding-top:16px;}
    .socials {text-align:center;margin-top:18px;}
    .socials a {display:inline-block;margin:0 8px;text-decoration:none;}
    .socials span {color:#003366;font-size:24px;margin:0 4px;}
    @media (max-width:600px) {.container{padding:16px 3vw;}.title{font-size:1.3rem;}.logo{width:56px;}.code-box{font-size:1.8rem;letter-spacing:4px;}}
  </style>
</head>
<body>
  <div class="container">
    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-size:3rem;margin:10px 0;">🙏</div>
    </div>
    <div class="title">Email Verification</div>
    <div class="subtitle">
      Hi <b>${fullName || "Member"},</b>
    </div>
    <div class="subtitle" style="font-size:1.01rem;">
      Welcome to RCCG Rehoboth Mega Cathedral! Please verify your email with the code below:
    </div>
    <div class="code-box">${verificationCode}</div>
    <div class="info">
      This code will expire in <b>24 hours</b>. Do not share this code with anyone.
    </div>
    <div class="warning">
      <strong>✓ Security Notice:</strong> If you did not create this account, please ignore this email and your email will remain unverified.
    </div>
    <div class="support">
      Questions? <a class="link" href="mailto:support@rccgrehoboth.com">Contact Support</a>
    </div>
    <div class="socials">
      <a href="https://facebook.com/RCCGRehoboth" target="_blank"><span>f</span></a>
      <a href="https://twitter.com/RCCGRehoboth" target="_blank"><span>𝕏</span></a>
      <a href="https://instagram.com/RCCGRehoboth" target="_blank"><span>📷</span></a>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} RCCG Rehoboth Mega Cathedral, Region 3 HQ<br>
      Ile-Ife, Osun State, Nigeria
    </div>
  </div>
</body>
</html>
`;

    await transporter.sendMail({
      from: `"RCCG Rehoboth" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Email Verification - RCCG Rehoboth Mega Cathedral",
      html: emailContent
    });

    console.log("Verification email sent to:", email);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error.message);
    // Don't throw - allow registration to proceed
    return false;
  }
}

/**
 * Send password reset code email
 */
async function sendPasswordResetCode(email, fullName, resetCode) {
  try {
    const emailContent = `
<!DOCTYPE html>
<html lang="en" style="background:#f3f7fa;">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Password Reset Code | RCCG Rehoboth Mega Cathedral</title>
  <style>
    body {background:#f3f7fa;font-family:'Segoe UI',Roboto,Arial,sans-serif;margin:0;padding:0;color:#1b2541;}
    .container {max-width:540px;margin:32px auto;background:#fff;border-radius:18px;box-shadow:0 6px 32px rgba(0,51,102,0.1);padding:40px 24px 28px 24px;}
    .logo {display:block;margin:0 auto 26px auto;width:80px;border-radius:14px;box-shadow:0 2px 8px rgba(0,51,102,0.1);background:#fff;}
    .title {color:#D92525;font-size:2rem;font-weight:800;text-align:center;margin-bottom:12px;}
    .subtitle {font-size:1.12rem;color:#1b2541;text-align:center;margin-bottom:12px;}
    .code-box {background:linear-gradient(90deg,#D92525 0%,#B91C1C 100%);color:#fff;border-radius:12px;padding:24px;text-align:center;margin:24px 0;font-size:2.5rem;font-weight:800;letter-spacing:8px;font-family:monospace;}
    .info {font-size:.99rem;color:#222;margin:18px 0 18px 0;line-height:1.6;text-align:center;}
    .warning {background:#FCE8E6;border-left:4px solid #D92525;padding:16px;border-radius:6px;margin:18px 0;font-size:.95rem;color:#D92525;}
    .support {margin:16px 0 0 0;text-align:center;font-size:.98rem;color:#555;}
    .link {word-break:break-all;color:#D92525;text-decoration:underline;}
    .footer {margin-top:32px;color:#bbb;font-size:.93rem;text-align:center;border-top:1px solid #eee;padding-top:16px;}
    .socials {text-align:center;margin-top:18px;}
    .socials a {display:inline-block;margin:0 8px;text-decoration:none;}
    .socials span {color:#D92525;font-size:24px;margin:0 4px;}
    @media (max-width:600px) {.container{padding:16px 3vw;}.title{font-size:1.3rem;}.logo{width:56px;}.code-box{font-size:1.8rem;letter-spacing:4px;}}
  </style>
</head>
<body>
  <div class="container">
    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-size:3rem;margin:10px 0;">🔐</div>
    </div>
    <div class="title">Password Reset Code</div>
    <div class="subtitle">
      Hi <b>${fullName || "Member"},</b>
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
      Need help? <a class="link" href="mailto:support@rccgrehoboth.com">Contact Support</a>
    </div>
    <div class="socials">
      <a href="https://facebook.com/RCCGRehoboth" target="_blank"><span>f</span></a>
      <a href="https://twitter.com/RCCGRehoboth" target="_blank"><span>𝕏</span></a>
      <a href="https://instagram.com/RCCGRehoboth" target="_blank"><span>📷</span></a>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} RCCG Rehoboth Mega Cathedral, Region 3 HQ<br>
      Ile-Ife, Osun State, Nigeria
    </div>
  </div>
</body>
</html>
`;

    await transporter.sendMail({
      from: `"RCCG Rehoboth" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Password Reset Code - RCCG Rehoboth Mega Cathedral",
      html: emailContent
    });

    console.log("Password reset code sent to:", email);
    return true;
  } catch (error) {
    console.error("Error sending reset code email:", error.message);
    return false;
  }
}

// ============ PUBLIC ROUTES ============

/**
 * @route   POST /api/rccg/users/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, phone, password, confirmPassword, dateOfBirth, gender, state, maritalStatus, referralCode } = req.body;

    // Validation
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    // Check if user already exists
    const existingUser = await RCCG_User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { phone }] 
    });

    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email or phone number already registered" });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const newUser = new RCCG_User({
      fullName,
      email: email.toLowerCase(),
      phone,
      password,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      state: state || "Osun",
      maritalStatus: maritalStatus || null,
      verificationCode,
      verificationCodeExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      membershipStatus: "visitor"
    });

    // Add referral if provided
    if (referralCode) {
      const referrer = await RCCG_User.findOne({ referralCode });
      if (referrer) {
        newUser.referredBy = referrer._id;
        referrer.referrals.push(newUser._id);
        referrer.totalReferrals += 1;
        await referrer.save();
      }
    }

    await newUser.save();

    // Send verification email (non-blocking)
    sendVerificationEmail(email, fullName, verificationCode).catch(err => 
      console.error("Failed to send verification email:", err)
    );

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email for verification code.",
      token,
      user: newUser.toJSON()
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// ============ ATTENDANCE ROUTES ============

/**
 * @route   POST /api/rccg/users/attendance/check-in
 * @desc    Record user's attendance for a service
 * @access  Private
 */
router.post("/attendance/check-in", authMiddleware, async (req, res) => {
  try {
    // Make sure authentication worked
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No user found"
      });
    }

    const {
      eventId,
      eventName,
      serviceType,
      attendanceType
    } = req.body;

    // Find the RCCG user
    const user = await RCCG_User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "RCCG user not found"
      });
    }

    // Current date/time
    const now = new Date();

    // Start and end of today
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Make sure attendanceRecords exists
    if (!Array.isArray(user.attendanceRecords)) {
      user.attendanceRecords = [];
    }

    // Prevent duplicate attendance for the same service/event today
    const alreadyCheckedIn = user.attendanceRecords.some(record => {
      const recordDate = record.date || record.createdAt;

      if (!recordDate) return false;

      const date = new Date(recordDate);

      const sameDay =
        date >= startOfDay &&
        date <= endOfDay;

      const sameEvent =
        eventId
          ? String(record.eventId || "") === String(eventId)
          : true;

      const sameService =
        serviceType
          ? String(record.serviceType || "").toLowerCase() ===
            String(serviceType).toLowerCase()
          : true;

      return sameDay && sameEvent && sameService;
    });

    if (alreadyCheckedIn) {
      return res.status(409).json({
        success: false,
        message: "You have already checked in for this service today."
      });
    }

    // Create attendance record
    const attendanceRecord = {
      eventId: eventId || null,
      eventName: eventName || "Today's Service",
      serviceType: serviceType || "Sunday Service",
      attendanceType: attendanceType || "physical",
      date: now,
      checkedIn: true
    };

    // Add attendance
    user.attendanceRecords.push(attendanceRecord);

    // Update activity
    user.lastActivityAt = now;

    await user.save();

    // Get the newly-created record
    const savedRecord =
      user.attendanceRecords[user.attendanceRecords.length - 1];

    return res.status(201).json({
      success: true,
      message: "Attendance successfully checked in!",
      attendance: savedRecord,
      attendanceCount: user.attendanceRecords.length
    });

  } catch (error) {
    console.error("Attendance check-in error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to record attendance"
    });
  }
});
/**
 * @route   POST /api/rccg/users/verify-email
 * @desc    Verify user email with code
 * @access  Public
 */
router.post("/verify-email", async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({ success: false, message: "Email and verification code required" });
    }

    const user = await RCCG_User.findOne({
      email: email.toLowerCase(),
      verificationCode,
      verificationCodeExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
    }

    user.emailVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully"
    });

  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/rccg/users/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = await RCCG_User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ 
        success: false, 
        message: "Please verify your email first",
        requiresVerification: true
      });
    }

    // Update last login
    user.lastLogin = new Date();
    user.lastActivityAt = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/rccg/users/send-reset-code
 * @desc    Send password reset code
 * @access  Public
 */
router.post("/send-reset-code", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email address is required" });
    }

    const user = await RCCG_User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found with this email address" });
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetPasswordCode = resetCode;
    user.resetPasswordCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // Send reset code email (non-blocking)
    sendPasswordResetCode(email, user.fullName, resetCode).catch(err => 
      console.error("Failed to send reset code:", err)
    );

    res.status(200).json({ 
      success: true,
      message: "Reset code sent to your email. Please check your inbox (and spam/promotions folders). Code expires in 15 minutes."
    });

  } catch (error) {
    console.error("Send reset code error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/rccg/users/verify-reset-code
 * @desc    Verify reset code and reset password
 * @access  Public
 */
router.post("/verify-reset-code", async (req, res) => {
  try {
    const { email, resetCode, newPassword, confirmPassword } = req.body;

    if (!email || !resetCode || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const user = await RCCG_User.findOne({
      email: email.toLowerCase(),
      resetPasswordCode: resetCode,
      resetPasswordCodeExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset code" });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordCode = null;
    user.resetPasswordCodeExpires = null;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully. You can now log in with your new password."
    });

  } catch (error) {
    console.error("Verify reset code error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ PUBLIC VIDEO & AUDIO SERMONS ROUTES ============

/**
 * @route   GET /api/rccg/users/video-sermons
 * @desc    Get all video sermons with pagination
 * @access  Public
 */
router.get("/video-sermons", async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const skip = (page - 1) * limit;

    // Mock video sermons data
    const allVideoSermons = [
      {
        _id: "video-101",
        title: "The Power of Unshakable Faith",
        description: "Experience a powerful message of empowerment, spiritual growth, and absolute trust in the Almighty.",
        pastor: "Pastor E.A. Adeboye",
        category: "sunday",
        eventType: "Sunday Service",
        duration: "46:32",
        views: 12400,
        videoUrl: "https://www.youtube.com/embed/live_stream?channel=RCCG",
        thumbnailUrl: "https://images.unsplash.com/photo-1548625361-185d9560a8e1?auto=format&fit=crop&q=80&w=600",
        createdAt: new Date()
      },
      {
        _id: "video-102",
        title: "Walking in Daily Divine Victory",
        description: "Learn how to walk in divine victory daily through faith and God's word.",
        pastor: "Ministerial Team",
        category: "digging",
        eventType: "Digging Deep",
        duration: "42:15",
        views: 8900,
        videoUrl: "https://www.youtube.com/embed/live_stream?channel=RCCG",
        thumbnailUrl: "https://images.unsplash.com/photo-1509021436471-181cf93012a3?auto=format&fit=crop&q=80&w=600",
        createdAt: new Date()
      },
      {
        _id: "video-103",
        title: "Understanding God's Destiny for You",
        description: "Discover God's purpose and destiny for your life.",
        pastor: "Resident Pastor",
        category: "youth",
        eventType: "Youth Service",
        duration: "38:47",
        views: 15100,
        videoUrl: "https://www.youtube.com/embed/live_stream?channel=RCCG",
        thumbnailUrl: "https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&q=80&w=600",
        createdAt: new Date()
      },
      {
        _id: "video-104",
        title: "Kingdom Stewardship and Divine Covenant",
        description: "Learn about true stewardship and God's covenant with His people.",
        pastor: "Regional Overseer",
        category: "special",
        eventType: "Holy Ghost Service",
        duration: "51:04",
        views: 22800,
        videoUrl: "https://www.youtube.com/embed/live_stream?channel=RCCG",
        thumbnailUrl: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=600",
        createdAt: new Date()
      },
      {
        _id: "video-105",
        title: "Supernatural Breakthroughs and Grace",
        description: "Experience supernatural breakthroughs through God's amazing grace.",
        pastor: "Pastor E.A. Adeboye",
        category: "sunday",
        eventType: "Sunday Service",
        duration: "48:10",
        views: 18300,
        videoUrl: "https://www.youtube.com/embed/live_stream?channel=RCCG",
        thumbnailUrl: "https://images.unsplash.com/photo-1499209974431-9dac3cea0047?auto=format&fit=crop&q=80&w=600",
        createdAt: new Date()
      },
      {
        _id: "video-106",
        title: "The Weapon of Praise and Worship",
        description: "Discover how praise and worship are weapons in spiritual warfare.",
        pastor: "Ministerial Team",
        category: "digging",
        eventType: "Digging Deep",
        duration: "35:50",
        views: 11600,
        videoUrl: "https://www.youtube.com/embed/live_stream?channel=RCCG",
        thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600",
        createdAt: new Date()
      }
    ];

    // Filter by category
    let filteredSermons = allVideoSermons;
    if (category && category !== "all") {
      filteredSermons = filteredSermons.filter(s => s.category === category);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSermons = filteredSermons.filter(s =>
        s.title.toLowerCase().includes(searchLower) ||
        s.pastor.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower)
      );
    }

    const total = filteredSermons.length;
    const paginatedSermons = filteredSermons.slice(skip, skip + limit);

    res.json({
      success: true,
      videoSermons: paginatedSermons,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error("Get video sermons error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/rccg/users/audio-sermons
 * @desc    Get all audio sermons with pagination
 * @access  Public
 */
router.get("/audio-sermons", async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const skip = (page - 1) * limit;

    // Mock audio sermons data
    const allAudioSermons = [
      {
        _id: "audio-101",
        title: "The Power of Unshakable Faith",
        pastor: "Pastor E.A. Adeboye",
        category: "sunday",
        duration: "46:32",
        durationSec: 2792,
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        createdAt: new Date()
      },
      {
        _id: "audio-102",
        title: "Walking in Daily Divine Victory",
        pastor: "Ministerial Team",
        category: "digging",
        duration: "42:15",
        durationSec: 2535,
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        createdAt: new Date()
      },
      {
        _id: "audio-103",
        title: "Understanding God's Destiny for You",
        pastor: "Resident Pastor",
        category: "youth",
        duration: "38:47",
        durationSec: 2327,
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        createdAt: new Date()
      },
      {
        _id: "audio-104",
        title: "Kingdom Stewardship and Divine Covenant",
        pastor: "Regional Overseer",
        category: "special",
        duration: "51:04",
        durationSec: 3064,
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        createdAt: new Date()
      },
      {
        _id: "audio-105",
        title: "Supernatural Breakthroughs and Grace",
        pastor: "Pastor E.A. Adeboye",
        category: "sunday",
        duration: "48:10",
        durationSec: 2890,
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        createdAt: new Date()
      },
      {
        _id: "audio-106",
        title: "The Weapon of Praise and Worship",
        pastor: "Ministerial Team",
        category: "digging",
        duration: "35:50",
        durationSec: 2150,
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        createdAt: new Date()
      }
    ];

    // Filter by category
    let filteredSermons = allAudioSermons;
    if (category && category !== "all") {
      filteredSermons = filteredSermons.filter(s => s.category === category);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSermons = filteredSermons.filter(s =>
        s.title.toLowerCase().includes(searchLower) ||
        s.pastor.toLowerCase().includes(searchLower)
      );
    }

    const total = filteredSermons.length;
    const paginatedSermons = filteredSermons.slice(skip, skip + limit);

    res.json({
      success: true,
      audioSermons: paginatedSermons,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error("Get audio sermons error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/rccg/users/video-sermons/:sermonId
 * @desc    Get single video sermon details
 * @access  Public
 */
router.get("/video-sermons/:sermonId", async (req, res) => {
  try {
    const { sermonId } = req.params;

    // Mock sermon data - TODO: Replace with database query
    const sermon = {
      _id: sermonId,
      title: "The Power of Unshakable Faith",
      description: "Experience a powerful message of empowerment, spiritual growth, and absolute trust in the Almighty.",
      pastor: "Pastor E.A. Adeboye",
      category: "sunday",
      eventType: "Sunday Service",
      duration: "46:32",
      views: 12400,
      videoUrl: "https://www.youtube.com/embed/live_stream?channel=RCCG",
      thumbnailUrl: "https://images.unsplash.com/photo-1548625361-185d9560a8e1?auto=format&fit=crop&q=80&w=600",
      createdAt: new Date()
    };

    res.json({
      success: true,
      sermon
    });

  } catch (error) {
    console.error("Get video sermon error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/rccg/users/audio-sermons/:sermonId
 * @desc    Get single audio sermon details
 * @access  Public
 */
router.get("/audio-sermons/:sermonId", async (req, res) => {
  try {
    const { sermonId } = req.params;

    // Mock sermon data - TODO: Replace with database query
    const sermon = {
      _id: sermonId,
      title: "The Power of Unshakable Faith",
      pastor: "Pastor E.A. Adeboye",
      category: "sunday",
      duration: "46:32",
      durationSec: 2792,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      createdAt: new Date()
    };

    res.json({
      success: true,
      sermon
    });

  } catch (error) {
    console.error("Get audio sermon error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ PROTECTED ROUTES ============

/**
 * @route   GET /api/rccg/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }

    const user = await RCCG_User.findById(req.user._id)
      .populate("departments")
      .populate("ministries")
      .populate("primaryMinistry")
      .populate("referredBy", "fullName email")
      .populate("savedSermons")
      .populate("savedAnnouncements");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user: user.toJSON()
    });

  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/rccg/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }

    const { fullName, phone, dateOfBirth, gender, address, city, state, zipCode, bio, profession, maritalStatus, designation } = req.body;

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (gender) updateData.gender = gender;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (zipCode) updateData.zipCode = zipCode;
    if (bio) updateData.bio = bio;
    if (profession) updateData.profession = profession;
    if (maritalStatus) updateData.maritalStatus = maritalStatus;
    if (designation) updateData.designation = designation;

    updateData.lastActivityAt = new Date();

    const user = await RCCG_User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: user.toJSON()
    });

  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/rccg/users/profile-image
 * @desc    Upload profile image
 * @access  Private
 */
router.post("/profile-image", authMiddleware, avatarUpload.single("profileImage"), async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const user = await RCCG_User.findByIdAndUpdate(
      req.user._id,
      {
        profileImage: req.file.publicUrl,
        profileImagePublicId: req.file.key,
        lastActivityAt: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Profile image uploaded successfully",
      user: user.toJSON()
    });

  } catch (error) {
    console.error("Upload profile image error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/rccg/users/giving
 * @desc    Add giving record
 * @access  Private
 */
router.post("/giving", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }

    const { type, amount, currency, method, reference, description } = req.body;

    if (!type || !amount) {
      return res.status(400).json({ success: false, message: "Type and amount required" });
    }

    const user = await RCCG_User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const givingRecord = {
      type,
      amount,
      currency: currency || "NGN",
      method: method || null,
      reference,
      description,
      date: new Date(),
      confirmed: false
    };

    await user.addGivingRecord(givingRecord);

    res.status(201).json({
      success: true,
      message: "Giving record added successfully",
      user: user.toJSON()
    });

  } catch (error) {
    console.error("Add giving record error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/rccg/users/giving
 * @desc    Get user giving history
 * @access  Private
 */
router.get("/giving", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }

    const user = await RCCG_User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      totalGiving: user.totalGiving,
      givingRecords: user.givingRecords
    });

  } catch (error) {
    console.error("Get giving history error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/rccg/users/prayer-request
 * @desc    Submit prayer request
 * @access  Private
 */
router.post("/prayer-request", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }

    const { title, description, category, isConfidential } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Title and description required" });
    }

    const user = await RCCG_User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.prayerRequests.push({
      title,
      description,
      category: category || "other",
      isConfidential: isConfidential !== false,
      createdAt: new Date()
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Prayer request submitted successfully"
    });

  } catch (error) {
    console.error("Submit prayer request error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/rccg/users/prayer-requests
 * @desc    Get user prayer requests
 * @access  Private
 */
router.get("/prayer-requests", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }

    const user = await RCCG_User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      prayerRequests: user.prayerRequests
    });

  } catch (error) {
    console.error("Get prayer requests error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/rccg/users/attendance
 * @desc    Get user attendance history
 * @access  Private
 */
router.get("/attendance", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No user found"
      });
    }

    const user = await RCCG_User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const attendance = Array.isArray(user.attendanceRecords)
      ? user.attendanceRecords
      : [];

    return res.json({
      success: true,
      attendance,
      total: attendance.length
    });

  } catch (error) {
    console.error("Get attendance error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get attendance"
    });
  }
});
router.post("/register-event/:eventId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }

    const { eventId } = req.params;

    const user = await RCCG_User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.registeredEvents.includes(eventId)) {
      return res.status(400).json({ success: false, message: "Already registered for this event" });
    }

    user.registeredEvents.push(eventId);
    user.lastActivityAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Event registration successful"
    });

  } catch (error) {
    console.error("Register event error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/rccg/users/unregister-event/:eventId
 * @desc    Unregister from event
 * @access  Private
 */
router.delete("/unregister-event/:eventId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }

    const { eventId } = req.params;

    const user = await RCCG_User.findByIdAndUpdate(
      req.user._id,
      { 
        $pull: { registeredEvents: eventId },
        lastActivityAt: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Unregistered from event successfully"
    });

  } catch (error) {
    console.error("Unregister event error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/rccg/users/save-sermon/:sermonId
 * @desc    Save a sermon
 * @access  Private
 */
router.post("/save-sermon/:sermonId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }

    const { sermonId } = req.params;

    const user = await RCCG_User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.savedSermons.includes(sermonId)) {
      return res.status(400).json({ success: false, message: "Sermon already saved" });
    }

    user.savedSermons.push(sermonId);
    user.lastActivityAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Sermon saved successfully"
    });

  } catch (error) {
    console.error("Save sermon error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/rccg/users/unsave-sermon/:sermonId
 * @desc    Unsave a sermon
 * @access  Private
 */
router.delete("/unsave-sermon/:sermonId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }

    const { sermonId } = req.params;

    const user = await RCCG_User.findByIdAndUpdate(
      req.user._id,
      { 
        $pull: { savedSermons: sermonId },
        lastActivityAt: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Sermon removed from saved"
    });

  } catch (error) {
    console.error("Unsave sermon error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ ADMIN ROUTES ============

/**
 * @route   GET /api/rccg/users/admin/all
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get("/admin/all", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }

    if (req.user.userType !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const { page = 1, limit = 20, membershipStatus, state, userType } = req.query;

    const filter = { deletedAt: null };
    if (membershipStatus) filter.membershipStatus = membershipStatus;
    if (state) filter.state = state;
    if (userType) filter.userType = userType;

    const users = await RCCG_User.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await RCCG_User.countDocuments(filter);

    res.json({
      success: true,
      users: users.map(u => u.toJSON()),
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      }
    });

  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/rccg/users/admin/:userId/approve
 * @desc    Approve user account
 * @access  Private/Admin
 */
router.put("/admin/:userId/approve", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }

    if (req.user.userType !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const { userId } = req.params;

    const user = await RCCG_User.findByIdAndUpdate(
      userId,
      {
        isApproved: true,
        approvedBy: req.user._id,
        approvalDate: new Date()
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "User approved successfully",
      user: user.toJSON()
    });

  } catch (error) {
    console.error("Approve user error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/rccg/users/admin/:userId
 * @desc    Soft delete user
 * @access  Private/Admin
 */
router.delete("/admin/:userId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }

    if (req.user.userType !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const { userId } = req.params;

    const user = await RCCG_User.findByIdAndUpdate(
      userId,
      { deletedAt: new Date(), isActive: false },
      { new: true }
    );

    res.json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
