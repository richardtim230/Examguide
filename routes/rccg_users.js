import express from "express";
import RCCG_User from "../models/RCCG_User.js";
import authMiddleware from "../middleware/auth.js";
import { avatarUpload } from "../middleware/upload.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "please_set_a_strong_secret";

// ============ CONFIGURATION ============
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
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
 * Send verification email
 */
async function sendVerificationEmail(email, verificationToken) {
  try {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification - RCCG Rehoboth Mega Cathedral",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #003366;">Welcome to RCCG Rehoboth Mega Cathedral</h2>
          <p>Thank you for registering with us. Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="display: inline-block; background-color: #008037; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Verify Email</a>
          <p>Or copy and paste this link: ${verificationUrl}</p>
          <p>This link expires in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">If you didn't register for this account, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, resetToken) {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset - RCCG Rehoboth Mega Cathedral",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #003366;">Password Reset Request</h2>
          <p>You requested to reset your password. Click the link below to proceed:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #D92525; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
          <p>This link expires in 1 hour.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
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

    // Create new user
    const verificationToken = crypto.randomBytes(32).toString("hex");
    
    const newUser = new RCCG_User({
      fullName,
      email: email.toLowerCase(),
      phone,
      password,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      state: state || "Osun",
      maritalStatus: maritalStatus || null,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
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

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
      token,
      user: newUser.toJSON()
    });

  } catch (error) {
    console.error("Registration error:", error);
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
      return res.status(403).json({ success: false, message: "Please verify your email first" });
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
 * @route   POST /api/rccg/users/verify-email
 * @desc    Verify user email
 * @access  Public
 */
router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "Verification token required" });
    }

    const user = await RCCG_User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification token" });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
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
 * @route   POST /api/rccg/users/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    const user = await RCCG_User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
      return res.status(500).json({ success: false, message: "Failed to send reset email" });
    }

    res.json({
      success: true,
      message: "Password reset link sent to your email"
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/rccg/users/reset-password
 * @desc    Reset user password
 * @access  Public
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const user = await RCCG_User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error("Reset password error:", error);
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
      isConfidential: isConfidential !== false
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
    const user = await RCCG_User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      attendance: user.attendanceRecords
    });

  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/rccg/users/register-event/:eventId
 * @desc    Register for event
 * @access  Private
 */
router.post("/register-event/:eventId", authMiddleware, async (req, res) => {
  try {
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
      message: "Unregistered from event successfully",
      user: user.toJSON()
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
    // Check if user is admin
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
