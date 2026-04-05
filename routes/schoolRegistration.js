import express from "express";
import School from "../models/School.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";
import postmark from "postmark";

const router = express.Router();

// Initialize Postmark client (same as in index.js)
const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN || "");

/**
 * POST /api/schools/register
 * Public endpoint for schools to self-register
 * No authentication required
 */
router.post("/register", async (req, res) => {
  try {
    const {
      schoolName,
      schoolType,
      studentCount,
      staffCount,
      foundedYear,
      regNumber,
      motto,
      country,
      state,
      city,
      address,
      postalCode,
      email,
      phone,
      secondaryEmail,
      altPhone,
      website,
      principal,
      principalEmail,
      adminName,
      adminEmail,
      adminPhone,
      description,
      programs = [],
      logoUrl
    } = req.body;

    // ===== VALIDATION =====
    const requiredFields = ["schoolName", "schoolType", "studentCount", "country", "email", "phone", "adminName", "adminEmail", "adminPhone"];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: "Invalid email format" });
    }

    if (!emailRegex.test(adminEmail)) {
      return res.status(400).json({ success: false, error: "Invalid admin email format" });
    }

    if (principalEmail && !emailRegex.test(principalEmail)) {
      return res.status(400).json({ success: false, error: "Invalid principal email format" });
    }

    // Check if email already exists
    const existingEmail = await School.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: "Email already registered. Please use a different email or contact support."
      });
    }

    // Check if admin email already exists
    const existingAdminEmail = await School.findOne({ adminEmail: adminEmail.toLowerCase() });
    if (existingAdminEmail) {
      return res.status(409).json({
        success: false,
        error: "This admin email is already associated with another school."
      });
    }

    // ===== CREATE SCHOOL =====
    const newSchool = new School({
      schoolName: schoolName.trim(),
      schoolType: schoolType || "secondary",
      studentCount: parseInt(studentCount) || 0,
      staffCount: parseInt(staffCount) || 0,
      foundedYear: foundedYear ? parseInt(foundedYear) : null,
      regNumber: regNumber?.trim() || "",
      motto: motto?.trim() || "",
      country: country.trim(),
      state: state?.trim() || "",
      city: city?.trim() || "",
      address: address?.trim() || "",
      postalCode: postalCode?.trim() || "",
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      secondaryEmail: secondaryEmail?.toLowerCase().trim() || "",
      altPhone: altPhone?.trim() || "",
      website: website?.trim() || "",
      principal: principal?.trim() || "",
      principalEmail: principalEmail?.toLowerCase().trim() || "",
      adminName: adminName.trim(),
      adminEmail: adminEmail.toLowerCase().trim(),
      adminPhone: adminPhone.trim(),
      description: description?.trim() || "",
      programs: programs && Array.isArray(programs) ? programs : [],
      logoUrl: logoUrl || "",
      // Initial subscription status
      subscriptionPlan: "starter",
      subscriptionStatus: "trial",
      status: "pending" // Pending admin approval
    });

    // Auto-generate schoolId
    newSchool.generateSchoolId();

    // Save to database
    await newSchool.save();

    // ===== SEND CONFIRMATION EMAILS =====
    try {
      // Email template to school admin
      const adminEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>School Registration Confirmation</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f7fa; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 10px; box-shadow: 0 6px 32px rgba(6,23,40,0.12); }
    .header { background: linear-gradient(135deg, #061728, #0f2847); color: #fff; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; }
    .content { padding: 30px; }
    .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffb400; }
    .details p { margin: 10px 0; font-size: 14px; line-height: 1.6; }
    .label { font-weight: 700; color: #061728; display: inline-block; width: 140px; }
    .value { color: #4b5563; }
    .section-title { font-weight: 700; color: #061728; margin: 20px 0 10px 0; font-size: 14px; }
    .list { margin-left: 20px; }
    .list li { margin: 8px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
    .support-link { color: #061728; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Registration Received!</h1>
    </div>
    <div class="content">
      <p>Dear ${adminName},</p>
      <p>Thank you for registering <strong>${schoolName}</strong> with ExamGuard! We've received your registration and are processing it.</p>
      
      <div class="details">
        <p><span class="label">School ID:</span> <span class="value"><strong>${newSchool.schoolId}</strong></span></p>
        <p><span class="label">School Name:</span> <span class="value">${schoolName}</span></p>
        <p><span class="label">Email:</span> <span class="value">${email}</span></p>
        <p><span class="label">Location:</span> <span class="value">${city}, ${state}, ${country}</span></p>
        <p><span class="label">Students:</span> <span class="value">${studentCount}</span></p>
        <p><span class="label">Plan:</span> <span class="value">STARTER (Trial)</span></p>
      </div>

      <p class="section-title">What Happens Next?</p>
      <ul class="list">
        <li>Our team will verify your school information within 24-48 hours</li>
        <li>You'll receive an email with your login credentials and setup guide</li>
        <li>Access all starter features to begin managing your school</li>
        <li>Optional: Upgrade to Professional or Enterprise plan for advanced features</li>
      </ul>

      <p>If you have any questions before activation, feel free to reach out to our support team at <a href="mailto:support@examguard.com.ng" class="support-link">support@examguard.com.ng</a></p>
      
      <p><strong>Best regards,</strong><br>The ExamGuard Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ExamGuard. All rights reserved.</p>
      <p>For support, contact: <a href="mailto:support@examguard.com.ng" class="support-link">support@examguard.com.ng</a></p>
    </div>
  </div>
</body>
</html>
      `;

      // Email to internal admin team
      const internalEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New School Registration - Action Required</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 700px; margin: 20px auto; padding: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #ddd; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #061728; color: #fff; font-weight: 700; }
    tr:nth-child(even) { background: #f9fafb; }
    .action-box { background: #fffbf0; border: 2px solid #ffb400; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .action-box strong { color: #061728; }
  </style>
</head>
<body>
  <div class="container">
    <h2>📌 New School Registration - Pending Approval</h2>
    <p>A new school has registered and requires admin approval:</p>
    
    <table>
      <tr>
        <th colspan="2">School Information</th>
      </tr>
      <tr>
        <td><strong>School ID</strong></td>
        <td><strong style="color: #061728;">${newSchool.schoolId}</strong></td>
      </tr>
      <tr>
        <td><strong>School Name</strong></td>
        <td>${schoolName}</td>
      </tr>
      <tr>
        <td><strong>Type</strong></td>
        <td>${schoolType}</td>
      </tr>
      <tr>
        <td><strong>Students</strong></td>
        <td>${studentCount}</td>
      </tr>
      <tr>
        <td><strong>Location</strong></td>
        <td>${city}, ${state}, ${country}</td>
      </tr>
      <tr>
        <th colspan="2">Contact Information</th>
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
        <th colspan="2">Admin Contact</th>
      </tr>
      <tr>
        <td><strong>Admin Name</strong></td>
        <td>${adminName}</td>
      </tr>
      <tr>
        <td><strong>Admin Email</strong></td>
        <td><a href="mailto:${adminEmail}">${adminEmail}</a></td>
      </tr>
      <tr>
        <td><strong>Admin Phone</strong></td>
        <td>${adminPhone}</td>
      </tr>
      <tr>
        <td><strong>Registered</strong></td>
        <td>${new Date().toLocaleString()}</td>
      </tr>
    </table>

    <div class="action-box">
      <strong>⚠️ Action Required:</strong> Review and approve this registration in the admin dashboard.
    </div>
  </div>
</body>
</html>
      `;

      // Send email to school admin
      await client.sendEmail({
        From: "richardochuko@examguard.com.ng",
        To: adminEmail,
        Subject: `Welcome to ExamGuard - Registration Confirmation [${newSchool.schoolId}]`,
        HtmlBody: adminEmailHtml
      });

      // Send notification to internal team
      await client.sendEmail({
        From: "richardochuko@examguard.com.ng",
        To: process.env.ADMIN_EMAIL || "richardochuko14@gmail.com",
        Subject: `[NEW] School Registration: ${schoolName} [${newSchool.schoolId}]`,
        HtmlBody: internalEmailHtml
      });

      console.log(`✅ Confirmation emails sent for school: ${newSchool.schoolId}`);
    } catch (emailErr) {
      console.error("⚠️ Email sending error:", emailErr.message);
      // Don't fail the registration if emails fail
    }

    // ===== SUCCESS RESPONSE =====
    res.status(201).json({
      success: true,
      message: "School registered successfully! Check your email for confirmation details.",
      data: newSchool.toJSON()
    });

  } catch (err) {
    console.error("❌ School registration error:", err);

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `${field} already exists. Please use a different value.`
      });
    }

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: "Validation error: " + messages.join(", ")
      });
    }

    res.status(500).json({
      success: false,
      message: "Error registering school",
      error: err.message
    });
  }
});

/**
 * GET /api/schools/public/all
 * Get all active schools (public endpoint - limited info)
 */
router.get("/public/all", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const schools = await School.find({ status: "active" })
      .select("schoolId schoolName abbreviation city state country email status")
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await School.countDocuments({ status: "active" });

    res.json({
      success: true,
      data: schools,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching schools:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching schools",
      error: error.message
    });
  }
});

/**
 * GET /api/schools/registration-status/:schoolId
 * Check registration status (public)
 */
router.get("/registration-status/:schoolId", async (req, res) => {
  try {
    const school = await School.findOne({ schoolId: req.params.schoolId })
      .select("schoolId schoolName email subscriptionStatus status createdAt");

    if (!school) {
      return res.status(404).json({
        success: false,
        error: "School not found"
      });
    }

    res.json({
      success: true,
      data: school
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/schools/admin/all
 * Get all schools (Admin only - with all details)
 */
router.get("/admin/all", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const { status, subscriptionStatus, search, page = 1, limit = 10 } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (subscriptionStatus) {
      query.subscriptionStatus = subscriptionStatus;
    }

    if (search) {
      query.$or = [
        { schoolName: { $regex: search, $options: "i" } },
        { schoolId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;

    const schools = await School.find(query)
      .populate("accountManager", "fullname email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await School.countDocuments(query);

    res.json({
      success: true,
      data: schools,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching schools:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching schools",
      error: error.message
    });
  }
});

/**
 * GET /api/schools/admin/:id
 * Get single school details (Admin)
 */
router.get("/admin/:id", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const school = await School.findById(req.params.id)
      .populate("accountManager", "fullname email")
      .populate("createdBy", "fullname email");

    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found"
      });
    }

    res.json({
      success: true,
      data: school
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching school details",
      error: error.message
    });
  }
});

/**
 * PUT /api/schools/admin/:id
 * Update school (Admin)
 */
router.put("/admin/:id", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.schoolId;
    delete updates.apiKey;
    delete updates.createdBy;
    delete updates.createdAt;
    delete updates.isDeleted;
    delete updates.deletedAt;
    delete updates.deletedBy;

    // Validate email if provided
    if (updates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        return res.status(400).json({
          success: false,
          error: "Invalid email format"
        });
      }
      updates.email = updates.email.toLowerCase();

      // Check if email is already used
      const existing = await School.findOne({
        email: updates.email,
        _id: { $ne: req.params.id }
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: "Email already in use"
        });
      }
    }

    updates.lastModifiedBy = req.user._id;

    const school = await School.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate("accountManager", "fullname email");

    if (!school) {
      return res.status(404).json({
        success: false,
        error: "School not found"
      });
    }

    res.json({
      success: true,
      message: "School updated successfully",
      data: school
    });
  } catch (err) {
    console.error("Error updating school:", err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `${field} already exists`
      });
    }
    res.status(500).json({
      success: false,
      message: "Error updating school",
      error: err.message
    });
  }
});

/**
 * POST /api/schools/admin/:id/activate
 * Activate a pending school (Admin)
 */
router.post("/admin/:id/activate", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: "School not found"
      });
    }

    school.status = "active";
    school.subscriptionStatus = "active";
    school.lastModifiedBy = req.user._id;
    await school.save();

    // Send activation email
    try {
      await client.sendEmail({
        From: "richardochuko@examguard.com.ng",
        To: school.adminEmail,
        Subject: `Your ExamGuard School Account is Active! [${school.schoolId}]`,
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
    .school-id { background: #f9fafb; padding: 10px 15px; border-radius: 5px; margin: 10px 0; font-family: monospace; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">✅ Your School Account is Active!</div>
    <p>Dear ${school.adminName},</p>
    <p>Great news! Your ExamGuard account for <strong>${school.schoolName}</strong> has been approved and activated.</p>
    
    <div class="info-box">
      <p><strong>School ID:</strong></p>
      <div class="school-id">${school.schoolId}</div>
      <p>You can now log in and start using ExamGuard to manage your school.</p>
    </div>

    <p>Visit <strong>https://examguard.com.ng</strong> to log in with your admin email credentials.</p>

    <p>If you need help getting started, our support team is here to assist you.</p>
    
    <p><strong>Best regards,</strong><br>The ExamGuard Team</p>
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
      message: "School activated successfully",
      data: school
    });
  } catch (err) {
    console.error("Error activating school:", err);
    res.status(500).json({
      success: false,
      message: "Error activating school",
      error: err.message
    });
  }
});

/**
 * DELETE /api/schools/admin/:id
 * Soft delete a school (Admin)
 */
router.delete("/admin/:id", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({
        success: false,
        error: "School not found"
      });
    }

    await school.softDelete(req.user._id);

    res.json({
      success: true,
      message: "School deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting school:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting school",
      error: err.message
    });
  }
});

export default router;
