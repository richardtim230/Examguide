import express from "express";
import Affiliate from "../models/Affiliate.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import postmark from "postmark";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();
const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN || "");

/**
 * POST /api/affiliates/register
 * Register a new affiliate
 */
router.post("/register", async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      company,
      website,
      country,
      affiliateType,
      marketingChannels,
      affiliateCode,
      password,
      acceptsMarketing
    } = req.body;

    // ===== VALIDATION =====
    const requiredFields = [
      "fullName",
      "email",
      "phone",
      "company",
      "country",
      "affiliateType",
      "marketingChannels",
      "password"
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
      });
    }

    // Check if email already exists
    const existingEmail = await Affiliate.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. Please use a different email or contact support."
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // ===== CREATE AFFILIATE =====
    const newAffiliate = new Affiliate({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      company: company.trim(),
      website: website?.trim() || "",
      country: country.trim(),
      affiliateType,
      marketingChannels: marketingChannels.trim(),
      password: hashedPassword,
      acceptsMarketing: acceptsMarketing !== false,
      emailVerificationToken: verificationToken,
      status: "pending",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      source: "web"
    });

    // Auto-generate affiliate code (handled in pre-save hook)
    await newAffiliate.save();

    // ===== SEND CONFIRMATION EMAILS =====
    try {
      // Email to affiliate
      const affiliateEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Welcome to ExamGuard Affiliate Program</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f7fa; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 10px; box-shadow: 0 6px 32px rgba(6,23,40,0.12); overflow: hidden; }
    .header { background: linear-gradient(135deg, #061728, #0f2847); color: #fff; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; }
    .header p { margin: 10px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9); }
    .content { padding: 30px; }
    .code-box { background: linear-gradient(135deg, rgba(255,180,0,0.05), rgba(61,130,246,0.05)); border: 2px solid #ffb400; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .code-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #ffb400; font-weight: 700; margin-bottom: 8px; }
    .code-display { font-family: 'Courier New', monospace; font-size: 24px; font-weight: 800; color: #061728; letter-spacing: 2px; }
    .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .details p { margin: 8px 0; font-size: 14px; }
    .label { font-weight: 700; color: #061728; min-width: 130px; display: inline-block; }
    .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #061728, #0f2847); color: #fff; text-decoration: none; border-radius: 6px; font-weight: 700; margin: 20px 0; transition: all 0.3s ease; }
    .button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(6,23,40,0.2); }
    .section-title { font-weight: 700; color: #061728; margin: 20px 0 12px 0; font-size: 14px; }
    .list { margin-left: 20px; }
    .list li { margin: 8px 0; font-size: 13px; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e7eb; }
    .footer a { color: #061728; text-decoration: none; font-weight: 600; }
    @media (max-width: 600px) {
      .container { margin: 16px; }
      .header { padding: 30px 20px; }
      .content { padding: 20px; }
      .code-display { font-size: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to ExamGuard Affiliate!</h1>
      <p>Start Earning Recurring Commission Today</p>
    </div>
    <div class="content">
      <p>Dear ${fullName},</p>
      <p>Congratulations! Your affiliate registration has been received. We're excited to have you join our growing partner network.</p>
      
      <div class="code-box">
        <div class="code-label">Your Unique Affiliate Code</div>
        <div class="code-display">${newAffiliate.affiliateCode}</div>
        <p style="font-size: 13px; color: #666; margin: 10px 0 0 0;">Use this code to track your referrals and earn commissions</p>
      </div>

      <div class="details">
        <p><span class="label">Name:</span> ${fullName}</p>
        <p><span class="label">Company:</span> ${company}</p>
        <p><span class="label">Type:</span> ${affiliateType.replace(/_/g, " ").toUpperCase()}</p>
        <p><span class="label">Tier:</span> <strong>STARTER (20% Commission)</strong></p>
      </div>

      <p class="section-title">What Happens Next?</p>
      <ul class="list">
        <li>Our team will review your application (usually within 24 hours)</li>
        <li>You'll receive an email confirming your approval and next steps</li>
        <li>Access your affiliate dashboard to view stats and materials</li>
        <li>Start sharing your unique code and earn commissions!</li>
      </ul>

      <p style="text-align: center;">
        <a href="${process.env.FRONTEND_ORIGIN || 'https://examguard.com'}/affiliate-dashboard" class="button">View Dashboard</a>
      </p>

      <p class="section-title">Your Commission Structure</p>
      <ul class="list">
        <li><strong>Starter Tier:</strong> 20% recurring commission (your current tier)</li>
        <li><strong>Professional Tier:</strong> 25% commission at 20+ referrals</li>
        <li><strong>Elite Tier:</strong> 30% commission + dedicated support at 50+ referrals</li>
      </ul>

      <p style="margin-top: 24px;">If you have any questions, feel free to reach out to our affiliate team at <a href="mailto:affiliate@examguard.com.ng" style="color: #061728; font-weight: 600;">affiliate@examguard.com.ng</a></p>
      
      <p><strong>Best regards,</strong><br>The ExamGuard Affiliate Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ExamGuard. All rights reserved.</p>
      <p>For support: <a href="mailto:affiliate@examguard.com.ng">affiliate@examguard.com.ng</a></p>
    </div>
  </div>
</body>
</html>
      `;

      // Email to internal team
      const internalEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Affiliate Registration - Action Required</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 700px; margin: 20px auto; padding: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #ddd; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #061728; color: #fff; font-weight: 700; }
    tr:nth-child(even) { background: #f9fafb; }
    .code-box { background: #fffbf0; border: 2px solid #ffb400; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
    .code { font-family: monospace; font-size: 18px; font-weight: 700; color: #061728; }
    .action-box { background: #f0f3ff; border: 2px solid #3b82f6; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h2>📌 New Affiliate Registration - Pending Review</h2>
    <p>A new affiliate has registered and requires admin review:</p>
    
    <div class="code-box">
      <p style="margin: 0; font-size: 12px; color: #666; margin-bottom: 8px;">AFFILIATE CODE</p>
      <div class="code">${newAffiliate.affiliateCode}</div>
    </div>

    <table>
      <tr>
        <th colspan="2">Affiliate Information</th>
      </tr>
      <tr>
        <td><strong>Name</strong></td>
        <td>${fullName}</td>
      </tr>
      <tr>
        <td><strong>Email</strong></td>
        <td><a href="mailto:${email}">${email}</a></td>
      </tr>
      <tr>
        <td><strong>Phone</strong></td>
        <td>${phone}</td>
      </tr>
      <tr>
        <td><strong>Company</strong></td>
        <td>${company}</td>
      </tr>
      <tr>
        <td><strong>Type</strong></td>
        <td>${affiliateType.replace(/_/g, " ").toUpperCase()}</td>
      </tr>
      <tr>
        <td><strong>Country</strong></td>
        <td>${country}</td>
      </tr>
      <tr>
        <td><strong>Website</strong></td>
        <td>${website || "Not provided"}</td>
      </tr>
      <tr>
        <td><strong>Marketing Strategy</strong></td>
        <td>${marketingChannels}</td>
      </tr>
      <tr>
        <td><strong>Registered</strong></td>
        <td>${new Date().toLocaleString()}</td>
      </tr>
    </table>

    <div class="action-box">
      <strong>⚠️ Action Required:</strong> Review and approve/reject this affiliate registration in the admin dashboard.
    </div>
  </div>
</body>
</html>
      `;

      // Send email to affiliate
      await client.sendEmail({
        From: "richardochuko@examguard.com.ng",
        To: email,
        Subject: `Welcome to ExamGuard Affiliate - Your Code: ${newAffiliate.affiliateCode}`,
        HtmlBody: affiliateEmailHtml
      });

      // Send to internal team
      await client.sendEmail({
        From: "richardochuko@examguard.com.ng",
        To: process.env.ADMIN_EMAIL || "richardochuko14@gmail.com",
        Subject: `[NEW AFFILIATE] ${fullName} - ${newAffiliate.affiliateCode}`,
        HtmlBody: internalEmailHtml
      });

      console.log(`✅ Confirmation emails sent for affiliate: ${newAffiliate.affiliateCode}`);
    } catch (emailErr) {
      console.error("⚠️ Email sending error:", emailErr.message);
    }

    // ===== SUCCESS RESPONSE =====
    res.status(201).json({
      success: true,
      message: "Registration successful! Check your email for confirmation. Your affiliate code is ready to use.",
      data: {
        affiliateCode: newAffiliate.affiliateCode,
        email: newAffiliate.email,
        tier: newAffiliate.tier,
        commissionRate: newAffiliate.commissionRate,
        status: newAffiliate.status
      }
    });
  } catch (err) {
    console.error("❌ Affiliate registration error:", err);

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists. Please use a different value.`
      });
    }

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation error: " + messages.join(", ")
      });
    }

    res.status(500).json({
      success: false,
      message: "Error registering affiliate",
      error: err.message
    });
  }
});

/**
 * POST /api/affiliates/login
 * Affiliate login
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    const affiliate = await Affiliate.findOne({ email: email.toLowerCase() }).select("+password");

    if (!affiliate || !await bcrypt.compare(password, affiliate.password)) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (affiliate.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Please contact support."
      });
    }

    if (affiliate.status === "rejected") {
      return res.status(403).json({
        success: false,
        message: "Your application was rejected. Please contact support for details."
      });
    }

    const token = jwt.sign(
      {
        id: affiliate._id,
        email: affiliate.email,
        affiliateCode: affiliate.affiliateCode,
        role: "affiliate"
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      affiliate: {
        id: affiliate._id,
        fullName: affiliate.fullName,
        email: affiliate.email,
        affiliateCode: affiliate.affiliateCode,
        status: affiliate.status,
        tier: affiliate.tier,
        totalEarnings: affiliate.totalEarnings
      }
    });
  } catch (err) {
    console.error("Affiliate login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/**
 * GET /api/affiliates/me
 * Get current affiliate profile (protected)
 */
router.get("/me", authenticate, async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.user.id)
      .populate("accountManager", "fullname email");

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: "Affiliate not found"
      });
    }

    res.json({
      success: true,
      data: affiliate
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * PUT /api/affiliates/me
 * Update affiliate profile (protected)
 */
router.put("/me", authenticate, async (req, res) => {
  try {
    const updates = req.body;

    // Remove sensitive fields
    delete updates.affiliateCode;
    delete updates.password;
    delete updates.emailVerificationToken;
    delete updates.totalEarnings;
    delete updates.pendingEarnings;
    delete updates.withdrawnEarnings;
    delete updates.status;
    delete updates.emailVerified;

    const affiliate = await Affiliate.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: affiliate
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/affiliates/dashboard
 * Get affiliate dashboard stats (protected)
 */
router.get("/dashboard", authenticate, async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.user.id);

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: "Affiliate not found"
      });
    }

    const conversionRate = affiliate.clicks > 0
      ? ((affiliate.successfulReferrals / affiliate.clicks) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        affiliateCode: affiliate.affiliateCode,
        tier: affiliate.tier,
        status: affiliate.status,
        commissionRate: affiliate.commissionRate,
        stats: {
          totalClicks: affiliate.clicks,
          totalReferrals: affiliate.totalReferrals,
          successfulReferrals: affiliate.successfulReferrals,
          conversionRate: `${conversionRate}%`
        },
        earnings: {
          total: affiliate.totalEarnings,
          pending: affiliate.pendingEarnings,
          withdrawn: affiliate.withdrawnEarnings
        },
        referrals: affiliate.referrals.slice(0, 10) // Last 10 referrals
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/affiliates/admin/approve/:id
 * Approve pending affiliate (Admin only)
 */
router.post("/admin/approve/:id", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.params.id);

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: "Affiliate not found"
      });
    }

    affiliate.status = "active";
    affiliate.emailVerified = true;
    affiliate.approvedBy = req.user.id;
    affiliate.approvalDate = new Date();
    affiliate.materialsAccess.banners = true;
    affiliate.materialsAccess.emailTemplates = true;
    affiliate.materialsAccess.socialMedia = true;
    await affiliate.save();

    // Send approval email
    try {
      await client.sendEmail({
        From: "richardochuko@examguard.com.ng",
        To: affiliate.email,
        Subject: `Congratulations! Your ExamGuard Affiliate Account is Active - ${affiliate.affiliateCode}`,
        HtmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Account Activated</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 10px; padding: 30px; border: 1px solid #e5e7eb; }
    .header { color: #061728; font-size: 24px; font-weight: 800; margin-bottom: 20px; }
    .info-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #061728, #0f2847); color: #fff; text-decoration: none; border-radius: 6px; font-weight: 700; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">✅ Welcome! Your Account is Active</div>
    <p>Dear ${affiliate.fullName},</p>
    <p>Great news! Your ExamGuard affiliate application has been approved. Your account is now fully active and ready to go!</p>
    
    <div class="info-box">
      <p><strong>Your Affiliate Code:</strong> <span style="font-family: monospace; font-weight: 800; color: #061728;">${affiliate.affiliateCode}</span></p>
      <p><strong>Commission Rate:</strong> ${affiliate.commissionRate}%</p>
      <p><strong>Tier:</strong> ${affiliate.tier.toUpperCase()}</p>
      <p>You can now access your dashboard, view marketing materials, and start earning!</p>
    </div>

    <p><strong>Quick Start:</strong></p>
    <ul>
      <li>Log in to your affiliate dashboard</li>
      <li>Download marketing materials (banners, email templates, etc.)</li>
      <li>Share your affiliate code with your network</li>
      <li>Track your referrals and earnings in real-time</li>
    </ul>

    <p style="text-align: center;">
      <a href="${process.env.FRONTEND_ORIGIN || 'https://examguard.com'}/affiliate-dashboard" class="button">Go to Dashboard</a>
    </p>

    <p>If you need help, our affiliate support team is here to assist: <a href="mailto:affiliate@examguard.com.ng">affiliate@examguard.com.ng</a></p>
    
    <p><strong>Best regards,</strong><br>The ExamGuard Affiliate Team</p>
  </div>
</body>
</html>
        `
      });
    } catch (emailErr) {
      console.warn("⚠️ Email sending error:", emailErr.message);
    }

    res.json({
      success: true,
      message: "Affiliate approved successfully",
      data: affiliate
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/affiliates/admin/reject/:id
 * Reject pending affiliate (Admin only)
 */
router.post("/admin/reject/:id", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const { reason } = req.body;

    const affiliate = await Affiliate.findById(req.params.id);
    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: "Affiliate not found"
      });
    }

    affiliate.status = "rejected";
    affiliate.rejectionReason = reason || "Application did not meet our requirements";
    await affiliate.save();

    // Send rejection email
    try {
      await client.sendEmail({
        From: "richardochuko@examguard.com.ng",
        To: affiliate.email,
        Subject: "ExamGuard Affiliate Application Status",
        HtmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Application Update</title>
</head>
<body>
  <div style="font-family: Arial; max-width: 600px; margin: 20px auto;">
    <h2>Application Status</h2>
    <p>Dear ${affiliate.fullName},</p>
    <p>Thank you for applying to the ExamGuard Affiliate Program. After careful review, we are unable to approve your application at this time.</p>
    
    <p><strong>Reason:</strong> ${affiliate.rejectionReason}</p>

    <p>We appreciate your interest and would be happy to revisit your application in the future. Feel free to contact our team if you have any questions.</p>

    <p>Best regards,<br>The ExamGuard Team</p>
  </div>
</body>
</html>
        `
      });
    } catch (emailErr) {
      console.warn("⚠️ Email sending error:", emailErr.message);
    }

    res.json({
      success: true,
      message: "Affiliate rejected successfully",
      data: affiliate
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
