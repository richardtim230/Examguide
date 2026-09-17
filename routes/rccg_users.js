import express from "express";
import RCCG_User from "../models/RCCG_User.js";
import RCCG_Sermon from "../models/RCCG_Sermon.js"; // Added Sermon model
import authMiddleware from "../middleware/auth.js";
import { avatarUpload, mediaUpload } from "../middleware/upload.js"; // Added mediaUpload
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import multer from "multer";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "please_set_a_strong_secret";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.warn("Email service not available:", error.message);
  } else {
    console.log("Email service ready");
  }
});

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

async function sendVerificationEmail(email, fullName, verificationCode) {
  try {
    const emailContent = `<!DOCTYPE html><html lang="en" style="background:#f3f7fa;"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Email Verification | RCCG Rehoboth Mega Cathedral</title><style>body {background:#f3f7fa;font-family:'Segoe UI',Roboto,Arial,sans-serif;margin:0;padding:0;color:#1b2541;}.container {max-width:540px;margin:32px auto;background:#fff;border-radius:18px;box-shadow:0 6px 32px rgba(0,51,102,0.1);padding:40px 24px 28px 24px;}.logo {display:block;margin:0 auto 26px auto;width:80px;border-radius:14px;box-shadow:0 2px 8px rgba(0,51,102,0.1);background:#fff;}.title {color:#003366;font-size:2rem;font-weight:800;text-align:center;margin-bottom:12px;}.subtitle {font-size:1.12rem;color:#1b2541;text-align:center;margin-bottom:12px;}.code-box {background:linear-gradient(90deg,#003366 0%,#0047AB 100%);color:#fff;border-radius:12px;padding:24px;text-align:center;margin:24px 0;font-size:2.5rem;font-weight:800;letter-spacing:8px;font-family:monospace;}.info {font-size:.99rem;color:#222;margin:18px 0 18px 0;line-height:1.6;text-align:center;}.warning {background:#E6F4EA;border-left:4px solid #008037;padding:16px;border-radius:6px;margin:18px 0;font-size:.95rem;color:#008037;}.support {margin:16px 0 0 0;text-align:center;font-size:.98rem;color:#555;}.link {word-break:break-all;color:#003366;text-decoration:underline;}.footer {margin-top:32px;color:#bbb;font-size:.93rem;text-align:center;border-top:1px solid #eee;padding-top:16px;}.socials {text-align:center;margin-top:18px;}.socials a {display:inline-block;margin:0 8px;text-decoration:none;}.socials span {color:#003366;font-size:24px;margin:0 4px;}@media (max-width:600px) {.container{padding:16px 3vw;}.title{font-size:1.3rem;}.logo{width:56px;}.code-box{font-size:1.8rem;letter-spacing:4px;}}</style></head><body><div class="container"><div style="text-align:center;margin-bottom:20px;"><div style="font-size:3rem;margin:10px 0;">🙏</div></div><div class="title">Email Verification</div><div class="subtitle">Hi <b>${fullName || "Member"},</b></div><div class="subtitle" style="font-size:1.01rem;">Welcome to RCCG Rehoboth Mega Cathedral! Please verify your email with the code below:</div><div class="code-box">${verificationCode}</div><div class="info">This code will expire in <b>24 hours</b>. Do not share this code with anyone.</div><div class="warning"><strong>✓ Security Notice:</strong> If you did not create this account, please ignore this email and your email will remain unverified.</div><div class="support">Questions? <a class="link" href="mailto:support@rccgrehoboth.com">Contact Support</a></div><div class="socials"><a href="https://facebook.com/RCCGRehoboth" target="_blank"><span>f</span></a><a href="https://twitter.com/RCCGRehoboth" target="_blank"><span>𝕏</span></a><a href="https://instagram.com/RCCGRehoboth" target="_blank"><span>📷</span></a></div><div class="footer">&copy; ${new Date().getFullYear()} RCCG Rehoboth Mega Cathedral, Region 3 HQ<br>Ile-Ife, Osun State, Nigeria</div></div></body></html>`;
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
    return false;
  }
}

async function sendPasswordResetCode(email, fullName, resetCode) {
  try {
    const emailContent = `<!DOCTYPE html><html lang="en" style="background:#f3f7fa;"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Password Reset Code | RCCG Rehoboth Mega Cathedral</title><style>body {background:#f3f7fa;font-family:'Segoe UI',Roboto,Arial,sans-serif;margin:0;padding:0;color:#1b2541;}.container {max-width:540px;margin:32px auto;background:#fff;border-radius:18px;box-shadow:0 6px 32px rgba(0,51,102,0.1);padding:40px 24px 28px 24px;}.logo {display:block;margin:0 auto 26px auto;width:80px;border-radius:14px;box-shadow:0 2px 8px rgba(0,51,102,0.1);background:#fff;}.title {color:#D92525;font-size:2rem;font-weight:800;text-align:center;margin-bottom:12px;}.subtitle {font-size:1.12rem;color:#1b2541;text-align:center;margin-bottom:12px;}.code-box {background:linear-gradient(90deg,#D92525 0%,#B91C1C 100%);color:#fff;border-radius:12px;padding:24px;text-align:center;margin:24px 0;font-size:2.5rem;font-weight:800;letter-spacing:8px;font-family:monospace;}.info {font-size:.99rem;color:#222;margin:18px 0 18px 0;line-height:1.6;text-align:center;}.warning {background:#FCE8E6;border-left:4px solid #D92525;padding:16px;border-radius:6px;margin:18px 0;font-size:.95rem;color:#D92525;}.support {margin:16px 0 0 0;text-align:center;font-size:.98rem;color:#555;}.link {word-break:break-all;color:#D92525;text-decoration:underline;}.footer {margin-top:32px;color:#bbb;font-size:.93rem;text-align:center;border-top:1px solid #eee;padding-top:16px;}.socials {text-align:center;margin-top:18px;}.socials a {display:inline-block;margin:0 8px;text-decoration:none;}.socials span {color:#D92525;font-size:24px;margin:0 4px;}@media (max-width:600px) {.container{padding:16px 3vw;}.title{font-size:1.3rem;}.logo{width:56px;}.code-box{font-size:1.8rem;letter-spacing:4px;}}</style></head><body><div class="container"><div style="text-align:center;margin-bottom:20px;"><div style="font-size:3rem;margin:10px 0;">🔐</div></div><div class="title">Password Reset Code</div><div class="subtitle">Hi <b>${fullName || "Member"},</b></div><div class="subtitle" style="font-size:1.01rem;">We received a request to reset your password. Use the code below to proceed:</div><div class="code-box">${resetCode}</div><div class="info">This code will expire in <b>15 minutes</b>. Do not share this code with anyone.</div><div class="warning"><strong>⚠️ Security Notice:</strong> If you did not request a password reset, please ignore this email and your password will remain unchanged. Your account is secure.</div><div class="support">Need help? <a class="link" href="mailto:support@rccgrehoboth.com">Contact Support</a></div><div class="socials"><a href="https://facebook.com/RCCGRehoboth" target="_blank"><span>f</span></a><a href="https://twitter.com/RCCGRehoboth" target="_blank"><span>𝕏</span></a><a href="https://instagram.com/RCCGRehoboth" target="_blank"><span>📷</span></a></div><div class="footer">&copy; ${new Date().getFullYear()} RCCG Rehoboth Mega Cathedral, Region 3 HQ<br>Ile-Ife, Osun State, Nigeria</div></div></body></html>`;
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

function getNigeriaDateInfo() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(now);
  const get = (type) => parts.find(p => p.type === type)?.value;
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    weekday: get("weekday"),
    hour,
    minute: parseInt(get("minute"), 10),
    second: parseInt(get("second"), 10),
    now
  };
}

function getAttendanceWindow() {
  const info = getNigeriaDateInfo();
  const currentMinutes = info.hour * 60 + info.minute;
  if (info.weekday === "Sunday") {
    const start = 9 * 60;
    const end = 10 * 60 + 30;
    if (currentMinutes >= start && currentMinutes < end) {
      return { active: true, serviceType: "Sunday Service", start: "09:00", end: "10:30" };
    }
    return { active: false, serviceType: "Sunday Service", start: "09:00", end: "10:30" };
  }
  if (info.weekday === "Wednesday") {
    const start = 18 * 60;
    const end = 19 * 60;
    if (currentMinutes >= start && currentMinutes < end) {
      return { active: true, serviceType: "Digging Deep", start: "18:00", end: "19:00" };
    }
    return { active: false, serviceType: "Digging Deep", start: "18:00", end: "19:00" };
  }
  return { active: false, serviceType: null, start: null, end: null };
}

// --- AUTH ROUTES ---

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, phone, password, confirmPassword, dateOfBirth, gender, state, maritalStatus, referralCode } = req.body;
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }
    const existingUser = await RCCG_User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { phone }] 
    });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email or phone number already registered" });
    }
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
      verificationCodeExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      membershipStatus: "visitor"
    });
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
    sendVerificationEmail(email, fullName, verificationCode).catch(err => 
      console.error("Failed to send verification email:", err)
    );
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
    res.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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
    user.lastLogin = new Date();
    user.lastActivityAt = new Date();
    await user.save();
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
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordCode = resetCode;
    user.resetPasswordCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
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

// --- SERMONS (MEDIA) ROUTES ---

// 1. Get Video Sermons (Production-ready)
router.get("/video-sermons", async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const skip = (page - 1) * limit;

    const query = { type: 'video' };
    
    if (category && category !== "all") {
      query.category = category;
    }
    
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { title: searchRegex },
        { pastor: searchRegex },
        { description: searchRegex }
      ];
    }

    const total = await RCCG_Sermon.countDocuments(query);
    const paginatedSermons = await RCCG_Sermon.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

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

// 2. Get Audio Sermons (Production-ready)
router.get("/audio-sermons", async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const skip = (page - 1) * limit;

    const query = { type: 'audio' };
    
    if (category && category !== "all") {
      query.category = category;
    }
    
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { title: searchRegex },
        { pastor: searchRegex },
        { description: searchRegex }
      ];
    }

    const total = await RCCG_Sermon.countDocuments(query);
    const paginatedSermons = await RCCG_Sermon.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

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

// 3. Get Single Video Sermon
router.get("/video-sermons/:sermonId", async (req, res) => {
  try {
    const { sermonId } = req.params;
    const sermon = await RCCG_Sermon.findOne({ _id: sermonId, type: 'video' });
    
    if (!sermon) {
       return res.status(404).json({ success: false, message: "Sermon not found" });
    }

    res.json({ success: true, sermon });
  } catch (error) {
    console.error("Get video sermon error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Get Single Audio Sermon
router.get("/audio-sermons/:sermonId", async (req, res) => {
  try {
    const { sermonId } = req.params;
    const sermon = await RCCG_Sermon.findOne({ _id: sermonId, type: 'audio' });

    if (!sermon) {
       return res.status(404).json({ success: false, message: "Sermon not found" });
    }

    res.json({ success: true, sermon });
  } catch (error) {
    console.error("Get audio sermon error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Upload Sermon via File Upload (Admin Only)
router.post(
  "/sermons/upload",
  authMiddleware,
  (req, res, next) => {
    mediaUpload.single("mediaFile")(req, res, (err) => {
      if (err) {
        console.error("===== MEDIA UPLOAD ERROR =====");
        console.error("Error name:", err.name);
        console.error("Error message:", err.message);
        console.error("Error code:", err.code);
        console.error("Full error:", err);
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            message: `File upload error: ${err.message}`,
            code: err.code
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || "File upload failed"
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      console.log("===== SERMON UPLOAD =====");
      console.log("User ID:", req.user?._id);
      console.log("User type:", req.user?.userType);
      console.log("Received file:", req.file);
      console.log("Received body:", req.body);

      if (!req.user || req.user.userType !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Admin access required to upload sermons"
        });
      }

      if (!req.file) {
        console.error("NO FILE RECEIVED");
        console.error("Expected field name: mediaFile");
        return res.status(400).json({
          success: false,
          message: "No media file was received. Make sure the selected file is attached using the field name 'mediaFile'."
        });
      }

      console.log("File received successfully:");
      console.log({
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        publicUrl: req.file.publicUrl
      });

      const {
        title,
        description,
        pastor,
        category,
        eventType,
        duration,
        type,
        thumbnailUrl
      } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Sermon title is required"
        });
      }

      if (!["video", "audio"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Type must be either 'video' or 'audio'"
        });
      }

      const mediaUrl = req.file.publicUrl;
      if (!mediaUrl) {
        console.error("File was uploaded but no public URL was generated.");
        console.error("req.file:", req.file);
        return res.status(500).json({
          success: false,
          message: "Media was uploaded, but no public URL was generated."
        });
      }

      const newSermon = new RCCG_Sermon({
        title: title.trim(),
        description: description || "",
        pastor: pastor || "",
        category: category || "",
        eventType: eventType || "",
        duration: duration || "",
        type,
        videoUrl: type === "video" ? mediaUrl : undefined,
        audioUrl: type === "audio" ? mediaUrl : undefined,
        thumbnailUrl: thumbnailUrl || "",
        createdBy: req.user._id
      });

      await newSermon.save();

      console.log("===== SERMON SAVED =====");
      console.log("Sermon ID:", newSermon._id);
      console.log("Media URL:", mediaUrl);

      return res.status(201).json({
        success: true,
        message: type === "video" ? "Video sermon uploaded successfully" : "Audio sermon uploaded successfully",
        sermon: newSermon
      });
    } catch (error) {
      console.error("===== SERMON UPLOAD ROUTE ERROR =====");
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      return res.status(500).json({
        success: false,
        message: error.message || "Failed to upload sermon"
      });
    }
  }
);

// 6. Add Sermon via External Link (e.g., YouTube/SoundCloud) (Admin Only)
router.post("/sermons/link", authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.userType !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required to add sermons" });
    }

    const { title, description, pastor, category, eventType, duration, type, mediaUrl, thumbnailUrl } = req.body;

    if (!title || !type || !mediaUrl) {
      return res.status(400).json({ success: false, message: "Title, type, and mediaUrl are required" });
    }

    if (!['video', 'audio'].includes(type)) {
      return res.status(400).json({ success: false, message: "Type must be either 'video' or 'audio'" });
    }

    const newSermon = new RCCG_Sermon({
      title,
      description,
      pastor,
      category,
      eventType,
      duration,
      type,
      videoUrl: type === 'video' ? mediaUrl : undefined,
      audioUrl: type === 'audio' ? mediaUrl : undefined,
      thumbnailUrl,
      createdBy: req.user._id
    });

    await newSermon.save();

    res.status(201).json({
      success: true,
      message: `${type === 'video' ? 'Video' : 'Audio'} sermon linked successfully`,
      sermon: newSermon
    });
  } catch (error) {
    console.error("Link sermon error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- PROFILE ROUTES ---

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
      .populate("savedSermons") // Now fetches the real Sermons from the DB based on IDs
      .populate("savedAnnouncements");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user: user.toJSON() });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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

router.delete("/profile", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }
    await RCCG_User.findByIdAndUpdate(
      req.user._id,
      { deletedAt: new Date(), isActive: false }
    );
    res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete profile error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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

// --- GIVING ROUTES ---

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

router.get("/giving/:recordId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }
    const user = await RCCG_User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const record = user.givingRecords.id(req.params.recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: "Giving record not found" });
    }
    res.json({ success: true, record });
  } catch (error) {
    console.error("Get single giving record error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/giving/:recordId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }
    const { type, amount, currency, method, reference, description, confirmed } = req.body;
    const user = await RCCG_User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const record = user.givingRecords.id(req.params.recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: "Giving record not found" });
    }
    if (type) record.type = type;
    if (amount !== undefined) record.amount = amount;
    if (currency) record.currency = currency;
    if (method) record.method = method;
    if (reference) record.reference = reference;
    if (description) record.description = description;
    if (confirmed !== undefined) record.confirmed = confirmed;
    await user.save();
    res.json({
      success: true,
      message: "Giving record updated successfully",
      user: user.toJSON()
    });
  } catch (error) {
    console.error("Update giving record error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/giving/:recordId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }
    const user = await RCCG_User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.givingRecords.pull({ _id: req.params.recordId });
    await user.save();
    res.json({
      success: true,
      message: "Giving record deleted successfully",
      user: user.toJSON()
    });
  } catch (error) {
    console.error("Delete giving record error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- PRAYER REQUESTS ROUTES ---

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

router.get("/prayer-requests/:requestId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }
    const user = await RCCG_User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const request = user.prayerRequests.id(req.params.requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: "Prayer request not found" });
    }
    res.json({ success: true, request });
  } catch (error) {
    console.error("Get single prayer request error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/prayer-requests/:requestId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }
    const { title, description, category, isConfidential, status } = req.body;
    const user = await RCCG_User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const request = user.prayerRequests.id(req.params.requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: "Prayer request not found" });
    }
    if (title) request.title = title;
    if (description) request.description = description;
    if (category) request.category = category;
    if (isConfidential !== undefined) request.isConfidential = isConfidential;
    if (status) request.status = status;
    await user.save();
    res.json({
      success: true,
      message: "Prayer request updated successfully",
      prayerRequests: user.prayerRequests
    });
  } catch (error) {
    console.error("Update prayer request error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/prayer-requests/:requestId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }
    const user = await RCCG_User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.prayerRequests.pull({ _id: req.params.requestId });
    await user.save();
    res.json({
      success: true,
      message: "Prayer request deleted successfully",
      prayerRequests: user.prayerRequests
    });
  } catch (error) {
    console.error("Delete prayer request error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ATTENDANCE ROUTES ---

router.post("/attendance/check-in", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No user found"
      });
    }
    const nigeriaTime = getNigeriaDateInfo();
    const attendanceWindow = getAttendanceWindow();
    if (!attendanceWindow.active) {
      return res.status(403).json({
        success: false,
        code: "ATTENDANCE_INACTIVE",
        message: "Attendance is not currently active.",
        schedule: {
          sunday: "9:00 AM - 10:30 AM",
          wednesday: "6:00 PM - 7:00 PM"
        },
        currentDay: nigeriaTime.weekday,
        currentTime: `${String(nigeriaTime.hour).padStart(2, "0")}:${String(nigeriaTime.minute).padStart(2, "0")}`
      });
    }
    const user = await RCCG_User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "RCCG user not found"
      });
    }
    if (!Array.isArray(user.attendanceRecords)) {
      user.attendanceRecords = [];
    }
    const alreadyCheckedIn = user.attendanceRecords.some(record => {
      if (!record.date) return false;
      const recordDate = new Date(record.date);
      const recordNigeriaDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Lagos",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(recordDate);
      return recordNigeriaDate === nigeriaTime.date;
    });
    if (alreadyCheckedIn) {
      return res.status(409).json({
        success: false,
        code: "ALREADY_CHECKED_IN",
        message: "You have already marked your attendance today."
      });
    }
    const attendanceRecord = {
      eventName: attendanceWindow.serviceType,
      serviceType: attendanceWindow.serviceType,
      attendanceType: "physical",
      date: nigeriaTime.now,
      checkedIn: true
    };
    user.attendanceRecords.push(attendanceRecord);
    user.lastActivityAt = nigeriaTime.now;
    await user.save();
    const savedRecord = user.attendanceRecords[user.attendanceRecords.length - 1];
    return res.status(201).json({
      success: true,
      message: `Attendance recorded for ${attendanceWindow.serviceType}.`,
      attendance: savedRecord,
      service: {
        name: attendanceWindow.serviceType,
        date: nigeriaTime.date,
        start: attendanceWindow.start,
        end: attendanceWindow.end
      },
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

router.get("/attendance/status", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No user found"
      });
    }
    const nigeriaTime = getNigeriaDateInfo();
    const window = getAttendanceWindow();
    const user = await RCCG_User.findById(req.user._id).select("attendanceRecords");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    const attendanceRecords = Array.isArray(user.attendanceRecords) ? user.attendanceRecords : [];
    const alreadyCheckedIn = attendanceRecords.some(record => {
      if (!record.date) return false;
      const recordDate = new Date(record.date);
      const recordNigeriaDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Lagos",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(recordDate);
      return recordNigeriaDate === nigeriaTime.date;
    });
    return res.json({
      success: true,
      active: window.active && !alreadyCheckedIn,
      alreadyCheckedIn,
      service: window.serviceType,
      currentDay: nigeriaTime.weekday,
      currentTime: `${String(nigeriaTime.hour).padStart(2, "0")}:${String(nigeriaTime.minute).padStart(2, "0")}`,
      window: {
        start: window.start,
        end: window.end
      },
      message: alreadyCheckedIn
        ? "Attendance already recorded today."
        : window.active
          ? `Attendance is currently open for ${window.serviceType}.`
          : "Attendance is currently closed."
    });
  } catch (error) {
    console.error("Attendance status error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get attendance status"
    });
  }
});

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
    const attendance = Array.isArray(user.attendanceRecords) ? user.attendanceRecords : [];
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

router.delete("/attendance/:recordId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }
    const user = await RCCG_User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.attendanceRecords.pull({ _id: req.params.recordId });
    await user.save();
    res.json({ success: true, message: "Attendance record deleted successfully" });
  } catch (error) {
    console.error("Delete attendance record error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- SAVED DATA / EVENTS ROUTES ---

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
    res.json({ success: true, message: "Event registration successful" });
  } catch (error) {
    console.error("Register event error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/unregister-event/:eventId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }
    const { eventId } = req.params;
    await RCCG_User.findByIdAndUpdate(
      req.user._id,
      { 
        $pull: { registeredEvents: eventId },
        lastActivityAt: new Date()
      },
      { new: true }
    );
    res.json({ success: true, message: "Unregistered from event successfully" });
  } catch (error) {
    console.error("Unregister event error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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
    
    // Note: Assuming savedSermons in user schema is simply storing the MongoDB ObjectIds referencing RCCG_Sermon.
    if (user.savedSermons.includes(sermonId)) {
      return res.status(400).json({ success: false, message: "Sermon already saved" });
    }
    user.savedSermons.push(sermonId);
    user.lastActivityAt = new Date();
    await user.save();
    res.json({ success: true, message: "Sermon saved successfully" });
  } catch (error) {
    console.error("Save sermon error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/unsave-sermon/:sermonId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }
    const { sermonId } = req.params;
    await RCCG_User.findByIdAndUpdate(
      req.user._id,
      { 
        $pull: { savedSermons: sermonId },
        lastActivityAt: new Date()
      },
      { new: true }
    );
    res.json({ success: true, message: "Sermon removed from saved" });
  } catch (error) {
    console.error("Unsave sermon error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ADMIN ROUTES ---

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
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/admin/:userId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }
    if (req.user.userType !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }
    const user = await RCCG_User.findById(req.params.userId)
      .populate("departments")
      .populate("ministries")
      .populate("primaryMinistry")
      .populate("referredBy", "fullName email");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user: user.toJSON() });
  } catch (error) {
    console.error("Admin get user error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/admin/:userId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }
    if (req.user.userType !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }
    const user = await RCCG_User.findByIdAndUpdate(
      req.params.userId,
      req.body,
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      message: "User updated successfully by admin",
      user: user.toJSON()
    });
  } catch (error) {
    console.error("Admin update user error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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

router.delete("/admin/:userId", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized - No user found" });
    }
    if (req.user.userType !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }
    const { userId } = req.params;
    await RCCG_User.findByIdAndUpdate(
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

router.use((error, req, res, next) => {
  console.error("===== UPLOAD MIDDLEWARE ERROR =====");
  console.error(error);

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: error.message,
      code: error.code,
      field: error.field || null
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "File upload failed"
    });
  }

  next();
});

export default router;
