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

    // ===== CHECK EMAIL (excluding deleted) =====
    const normalizedEmail = email.toLowerCase().trim();
    const existingEmail = await Affiliate.findOne({
      email: normalizedEmail,
      isDeleted: false
    });

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
      email: normalizedEmail,
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
      const affiliateEmailHtml = getAffiliateWelcomeEmail(
        fullName,
        company,
        affiliateType,
        newAffiliate.affiliateCode
      );

      // Email to internal team
      const internalEmailHtml = getInternalNotificationEmail(
        fullName,
        email,
        phone,
        company,
        affiliateType,
        country,
        website,
        marketingChannels,
        newAffiliate.affiliateCode
      );

      // Send email to affiliate
      await client.sendEmail({
        From: "affiliates@examguard.com.ng",
        To: normalizedEmail,
        Subject: `Welcome to ExamGuard Affiliate Program - Code: ${newAffiliate.affiliateCode}`,
        HtmlBody: affiliateEmailHtml
      });

      // Send to internal team
      await client.sendEmail({
        From: "affiliates@examguard.com.ng",
        To: process.env.ADMIN_EMAIL || "admin@examguard.com.ng",
        ReplyTo: normalizedEmail,
        Subject: `[NEW AFFILIATE REGISTRATION] ${fullName} (${newAffiliate.affiliateCode})`,
        HtmlBody: internalEmailHtml
      });

      console.log(`✅ Affiliate registered: ${newAffiliate.affiliateCode} (${normalizedEmail})`);
    } catch (emailErr) {
      console.error("⚠️ Email sending error:", emailErr.message);
      // Don't fail registration if email fails
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

    // Handle MongoDB duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      if (field === "email") {
        return res.status(409).json({
          success: false,
          message: "Email already registered. Please use a different email."
        });
      }
      return res.status(409).json({
        success: false,
        message: `${field} already exists. Please use a different value.`
      });
    }

    // Handle validation errors
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

    const normalizedEmail = email.toLowerCase().trim();
    const affiliate = await Affiliate.findOne({
      email: normalizedEmail,
      isDeleted: false
    }).select("+password");

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

    if (affiliate.status === "pending") {
      return res.status(403).json({
        success: false,
        message: "Your application is still under review. You'll be notified once approved."
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
        referrals: affiliate.referrals.slice(0, 10)
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
      const approvalEmail = getApprovalEmail(affiliate);
      await client.sendEmail({
        From: "affiliates@examguard.com.ng",
        To: affiliate.email,
        Subject: `Account Approved! Welcome to ExamGuard Affiliate (${affiliate.affiliateCode})`,
        HtmlBody: approvalEmail
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
      const rejectionEmail = getRejectionEmail(affiliate);
      await client.sendEmail({
        From: "affiliates@examguard.com.ng",
        To: affiliate.email,
        Subject: `ExamGuard Affiliate Application - Update`,
        HtmlBody: rejectionEmail
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

// ==================== EMAIL TEMPLATES ====================

/**
 * Professional welcome email for new affiliate
 */
function getAffiliateWelcomeEmail(fullName, company, affiliateType, affiliateCode) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ExamGuard Affiliate Program</title>
  <style>
    * { margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #2d3748;
      background-color: #f7fafc;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #061728 0%, #0f2847 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .header p {
      font-size: 14px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
      color: #1a202c;
    }
    .code-section {
      background: linear-gradient(135deg, rgba(6, 23, 40, 0.05) 0%, rgba(255, 180, 0, 0.05) 100%);
      border-left: 4px solid #ffb400;
      border-radius: 6px;
      padding: 24px;
      margin: 30px 0;
      text-align: center;
    }
    .code-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #61666c;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .code-display {
      font-family: 'Courier New', monospace;
      font-size: 32px;
      font-weight: 800;
      color: #061728;
      letter-spacing: 3px;
      word-spacing: 8px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 30px 0;
      background: #f8f9fa;
      padding: 20px;
      border-radius: 6px;
    }
    .info-item {
      text-align: center;
    }
    .info-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #718096;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .info-value {
      font-size: 15px;
      color: #1a202c;
      font-weight: 600;
    }
    .section {
      margin: 30px 0;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 16px;
      border-bottom: 2px solid #ffb400;
      padding-bottom: 8px;
    }
    .features-list {
      list-style: none;
    }
    .features-list li {
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
      color: #4a5568;
    }
    .features-list li:before {
      content: "✓ ";
      color: #10b981;
      font-weight: 700;
      margin-right: 10px;
    }
    .features-list li:last-child {
      border-bottom: none;
    }
    .commission-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      margin: 20px 0;
    }
    .tier-card {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 6px;
      text-align: center;
      border-top: 3px solid #e2e8f0;
    }
    .tier-card.active {
      border-top-color: #ffb400;
      background: linear-gradient(135deg, rgba(255, 180, 0, 0.05) 0%, transparent 100%);
    }
    .tier-name {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #718096;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .tier-rate {
      font-size: 20px;
      font-weight: 700;
      color: #061728;
    }
    .tier-label {
      font-size: 11px;
      color: #a0aec0;
      margin-top: 6px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #061728 0%, #0f2847 100%);
      color: #ffffff;
      padding: 14px 32px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 20px 0;
      transition: all 0.3s ease;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }
    .footer {
      background: #f8f9fa;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 13px;
      color: #718096;
      margin-bottom: 12px;
    }
    .footer-links {
      font-size: 12px;
    }
    .footer-links a {
      color: #061728;
      text-decoration: none;
      margin: 0 12px;
      font-weight: 600;
    }
    .divider {
      height: 1px;
      background: #e2e8f0;
      margin: 12px 0;
    }
    @media (max-width: 600px) {
      .container { border-radius: 0; }
      .content { padding: 24px; }
      .header { padding: 30px 20px; }
      .code-display { font-size: 24px; }
      .info-grid { grid-template-columns: 1fr; }
      .commission-grid { grid-template-columns: 1fr; }
      .footer { padding: 18px 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🎉 Welcome Aboard!</h1>
      <p>ExamGuard Affiliate Program</p>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="greeting">
        Dear <strong>${fullName}</strong>,
      </div>

      <p style="margin-bottom: 20px;">
        Congratulations! Your affiliate registration has been received and is now under review. We're excited to welcome <strong>${company}</strong> to our growing partner network.
      </p>

      <!-- Affiliate Code Section -->
      <div class="code-section">
        <div class="code-label">Your Unique Affiliate Code</div>
        <div class="code-display">${affiliateCode}</div>
        <p style="font-size: 12px; color: #718096; margin-top: 12px;">This code tracks your referrals and commissions</p>
      </div>

      <!-- Quick Info -->
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Category</div>
          <div class="info-value">${affiliateType.replace(/_/g, " ")}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Initial Tier</div>
          <div class="info-value">Starter</div>
        </div>
      </div>

      <!-- What Happens Next -->
      <div class="section">
        <div class="section-title">What Happens Next?</div>
        <ul class="features-list">
          <li>Our team will verify your application (usually 24-48 hours)</li>
          <li>You'll receive an approval email with login credentials</li>
          <li>Access your affiliate dashboard immediately</li>
          <li>Download marketing materials and start promoting</li>
          <li>Track referrals and earnings in real-time</li>
        </ul>
      </div>

      <!-- Commission Structure -->
      <div class="section">
        <div class="section-title">Commission Structure</div>
        <p style="margin-bottom: 16px; font-size: 14px; color: #4a5568;">
          Earn recurring commissions based on your tier. Upgrade automatically as you hit referral milestones.
        </p>
        <div class="commission-grid">
          <div class="tier-card active">
            <div class="tier-name">Starter</div>
            <div class="tier-rate">20%</div>
            <div class="tier-label">Your current tier</div>
          </div>
          <div class="tier-card">
            <div class="tier-name">Professional</div>
            <div class="tier-rate">25%</div>
            <div class="tier-label">20+ referrals</div>
          </div>
          <div class="tier-card">
            <div class="tier-name">Elite</div>
            <div class="tier-rate">30%</div>
            <div class="tier-label">50+ referrals</div>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 30px 0;">
        <p style="font-size: 13px; color: #718096; margin-bottom: 16px;">
          Once approved, access your dashboard and marketing materials
        </p>
        <a href="${process.env.FRONTEND_ORIGIN || 'https://examguard.com.ng'}/affiliate-dashboard" class="cta-button">View Dashboard</a>
      </div>

      <!-- Support -->
      <div class="section" style="background: #f0f4ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 6px; margin: 30px 0;">
        <p style="font-size: 14px; color: #2d3748; margin: 0;">
          <strong>Questions?</strong> Contact our affiliate support team at 
          <a href="mailto:affiliates@examguard.com.ng" style="color: #061728; text-decoration: none; font-weight: 600;">affiliates@examguard.com.ng</a>
        </p>
      </div>

      <p style="font-size: 13px; color: #718096; margin-top: 24px;">
        Best regards,<br>
        <strong>The ExamGuard Affiliate Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-text">
        © ${new Date().getFullYear()} ExamGuard. All rights reserved.
      </div>
      <div class="divider"></div>
      <div class="footer-links">
        <a href="https://examguard.com.ng/privacy">Privacy Policy</a>
        <a href="https://examguard.com.ng/terms">Terms & Conditions</a>
        <a href="https://examguard.com.ng/contact">Contact</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Professional notification email for admin/internal team
 */
function getInternalNotificationEmail(fullName, email, phone, company, affiliateType, country, website, marketingChannels, affiliateCode) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Affiliate Registration</title>
  <style>
    * { margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #2d3748;
      background-color: #f7fafc;
    }
    .container {
      max-width: 700px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #061728 0%, #0f2847 100%);
      color: #ffffff;
      padding: 30px;
      text-align: center;
    }
    .header h2 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .header p {
      font-size: 14px;
      opacity: 0.9;
    }
    .alert-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 0;
      font-size: 14px;
      color: #92400e;
    }
    .content {
      padding: 30px;
    }
    .code-badge {
      display: inline-block;
      background: #f3f4f6;
      border: 2px solid #ffb400;
      border-radius: 6px;
      padding: 12px 20px;
      margin: 20px 0;
      text-align: center;
    }
    .code-badge-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #718096;
      display: block;
      margin-bottom: 6px;
    }
    .code-badge-value {
      font-family: 'Courier New', monospace;
      font-size: 18px;
      font-weight: 800;
      color: #061728;
      letter-spacing: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    thead {
      background: #f8f9fa;
      border-bottom: 2px solid #e2e8f0;
    }
    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #1a202c;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    tr:hover {
      background: #f9fafb;
    }
    .label {
      color: #718096;
      font-weight: 600;
    }
    .value {
      color: #1a202c;
      font-weight: 500;
    }
    .action-section {
      background: #f0f4ff;
      border-left: 4px solid #3b82f6;
      border-radius: 6px;
      padding: 16px;
      margin: 24px 0;
    }
    .action-section strong {
      color: #1e3a8a;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #718096;
    }
    @media (max-width: 600px) {
      .container { border-radius: 0; }
      .content { padding: 20px; }
      table { font-size: 12px; }
      th, td { padding: 8px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h2>📌 New Affiliate Registration</h2>
      <p>Pending Review & Approval</p>
    </div>

    <!-- Alert -->
    <div class="alert-box">
      ⚠️ <strong>Action Required:</strong> Review and approve/reject this affiliate registration
    </div>

    <!-- Content -->
    <div class="content">
      <div class="code-badge">
        <span class="code-badge-label">Affiliate Code</span>
        <div class="code-badge-value">${affiliateCode}</div>
      </div>

      <!-- Details Table -->
      <table>
        <thead>
          <tr>
            <th colspan="2">Affiliate Information</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="label">Full Name</td>
            <td class="value">${fullName}</td>
          </tr>
          <tr>
            <td class="label">Email</td>
            <td class="value"><a href="mailto:${email}" style="color: #061728; text-decoration: none; font-weight: 600;">${email}</a></td>
          </tr>
          <tr>
            <td class="label">Phone</td>
            <td class="value">${phone}</td>
          </tr>
          <tr>
            <td class="label">Company</td>
            <td class="value">${company}</td>
          </tr>
          <tr>
            <td class="label">Affiliate Type</td>
            <td class="value"><span style="background: #f0f4ff; padding: 4px 8px; border-radius: 4px; font-weight: 600;">${affiliateType.replace(/_/g, " ").toUpperCase()}</span></td>
          </tr>
          <tr>
            <td class="label">Country</td>
            <td class="value">${country}</td>
          </tr>
          <tr>
            <td class="label">Website</td>
            <td class="value">${website ? `<a href="${website}" target="_blank" style="color: #061728; text-decoration: none; font-weight: 600;">${website}</a>` : "Not provided"}</td>
          </tr>
          <tr>
            <td class="label">Marketing Strategy</td>
            <td class="value">${marketingChannels}</td>
          </tr>
          <tr>
            <td class="label">Registered</td>
            <td class="value">${new Date().toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <!-- Action Section -->
      <div class="action-section">
        <strong>📋 Next Steps:</strong>
        <p style="margin: 8px 0 0 0; font-size: 13px;">
          1. Review the information above<br>
          2. Visit the admin dashboard to approve or reject<br>
          3. Affiliate will be notified of the decision
        </p>
      </div>

      <p style="font-size: 13px; color: #718096; margin-top: 24px;">
        Review details carefully and ensure all information is accurate before approval.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      © ${new Date().getFullYear()} ExamGuard | Affiliate Management System
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Professional approval email
 */
function getApprovalEmail(affiliate) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Approved</title>
  <style>
    * { margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #2d3748;
      background-color: #f7fafc;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .content {
      padding: 40px 30px;
    }
    .success-box {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, transparent 100%);
      border-left: 4px solid #10b981;
      border-radius: 6px;
      padding: 20px;
      margin: 24px 0;
    }
    .code-section {
      background: #f8f9fa;
      border-radius: 6px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .code-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #718096;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .code-display {
      font-family: 'Courier New', monospace;
      font-size: 24px;
      font-weight: 800;
      color: #061728;
      letter-spacing: 2px;
    }
    .features-list {
      list-style: none;
      margin: 20px 0;
    }
    .features-list li {
      padding: 10px 0;
      padding-left: 28px;
      position: relative;
      font-size: 14px;
      color: #4a5568;
    }
    .features-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: 700;
      font-size: 16px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #061728 0%, #0f2847 100%);
      color: #ffffff;
      padding: 14px 32px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 24px 0;
    }
    .footer {
      background: #f8f9fa;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 13px;
      color: #718096;
    }
    @media (max-width: 600px) {
      .container { border-radius: 0; }
      .content { padding: 24px; }
      .header { padding: 30px 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>✅ Account Approved!</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <p>Dear <strong>${affiliate.fullName}</strong>,</p>

      <p style="margin: 16px 0;">
        Great news! Your ExamGuard affiliate application has been <strong>approved</strong>. Your account is now fully activated and ready to start generating revenue.
      </p>

      <!-- Code Section -->
      <div class="code-section">
        <div class="code-label">Your Affiliate Code</div>
        <div class="code-display">${affiliate.affiliateCode}</div>
      </div>

      <!-- Details -->
      <div class="success-box">
        <p style="margin: 0;">
          <strong>Commission Rate:</strong> ${affiliate.commissionRate}%<br>
          <strong>Tier:</strong> ${affiliate.tier.charAt(0).toUpperCase() + affiliate.tier.slice(1)}<br>
          <strong>Status:</strong> Active
        </p>
      </div>

      <!-- Quick Start -->
      <div>
        <h3 style="font-size: 16px; color: #1a202c; margin-bottom: 12px; margin-top: 24px;">Quick Start Guide</h3>
        <ul class="features-list">
          <li>Log in to your affiliate dashboard</li>
          <li>Download marketing materials (banners, templates, etc.)</li>
          <li>Share your affiliate code with your network</li>
          <li>Track referrals and earnings in real-time</li>
          <li>Upgrade tiers as you hit referral milestones</li>
        </ul>
      </div>

      <!-- CTA -->
      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_ORIGIN || 'https://examguard.com.ng'}/affiliate-dashboard" class="cta-button">Go to Dashboard</a>
      </div>

      <!-- Support -->
      <p style="font-size: 13px; color: #718096; margin-top: 24px; background: #f0f4ff; border-left: 4px solid #3b82f6; padding: 12px; border-radius: 4px;">
        Need help? Contact our support team at <a href="mailto:affiliates@examguard.com.ng" style="color: #061728; font-weight: 600; text-decoration: none;">affiliates@examguard.com.ng</a>
      </p>

      <p style="font-size: 13px; color: #718096; margin-top: 24px;">
        Best regards,<br>
        <strong>The ExamGuard Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-text">
        © ${new Date().getFullYear()} ExamGuard. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Professional rejection email
 */
function getRejectionEmail(affiliate) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Status Update</title>
  <style>
    * { margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #2d3748;
      background-color: #f7fafc;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .content {
      padding: 40px 30px;
    }
    .info-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 6px;
      padding: 16px;
      margin: 24px 0;
      font-size: 13px;
      color: #92400e;
    }
    .next-steps {
      background: #f0f4ff;
      border-left: 4px solid #3b82f6;
      border-radius: 6px;
      padding: 16px;
      margin: 24px 0;
    }
    .next-steps strong {
      color: #1e3a8a;
    }
    .footer {
      background: #f8f9fa;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 13px;
      color: #718096;
    }
    @media (max-width: 600px) {
      .container { border-radius: 0; }
      .content { padding: 24px; }
      .header { padding: 30px 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>Application Status Update</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <p>Dear <strong>${affiliate.fullName}</strong>,</p>

      <p style="margin: 16px 0;">
        Thank you for your interest in the ExamGuard Affiliate Program. We've carefully reviewed your application.
      </p>

      <!-- Status -->
      <div class="info-box">
        <strong>Decision:</strong> Unfortunately, we are unable to approve your application at this time.
        ${affiliate.rejectionReason ? `<br><br><strong>Reason:</strong> ${affiliate.rejectionReason}` : ""}
      </div>

      <!-- Feedback -->
      <p style="color: #4a5568; font-size: 14px;">
        We understand this may be disappointing. Please note that this decision is not final. We'd be happy to revisit your application if you'd like to provide additional information or reapply in the future.
      </p>

      <!-- Next Steps -->
      <div class="next-steps">
        <strong>What You Can Do:</strong>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; list-style: none;">
          <li style="margin: 6px 0;">✓ Reach out to us with any questions</li>
          <li style="margin: 6px 0;">✓ Ask for specific feedback on your application</li>
          <li style="margin: 6px 0;">✓ Reapply in the future with updated information</li>
        </ul>
      </div>

      <p style="font-size: 13px; color: #718096; margin-top: 24px;">
        Have questions? Contact us at <a href="mailto:affiliates@examguard.com.ng" style="color: #061728; font-weight: 600; text-decoration: none;">affiliates@examguard.com.ng</a>
      </p>

      <p style="font-size: 13px; color: #718096; margin-top: 24px;">
        Best regards,<br>
        <strong>The ExamGuard Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      © ${new Date().getFullYear()} ExamGuard. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;
}

export default router;
