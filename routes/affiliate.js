import express from "express";
import Affiliate from "../models/Affiliate.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticate } from "../middleware/authenticate.js";
import path from "path";
import crypto from "crypto";

const router = express.Router();

/**
 * REGISTER: POST /api/affiliate/register
 * Required: name, email, phone, school, password
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, school, ref, password } = req.body;
    if (!name || !email || !phone || !school || !password) {
      return res.status(400).json({ message: "All fields required" });
    }
    const exists = await Affiliate.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Affiliate already registered" });
    }
    const hashed = await bcrypt.hash(password, 12);
    // --- Generate a unique referral code ---
    const referralCode = crypto.randomBytes(5).toString("hex");

    const affiliate = new Affiliate({
      name,
      email,
      phone,
      school,
      ref,
      password: hashed,
      referralCode,
      referralLink: `https://examguard.com.ng/mock.html?ref=${referralCode}`,
      since: new Date(),
      notify: "email",
      socialLinks: [],
      profilePic: ""
    });
    await affiliate.save();
    return res.status(201).json({ message: "Affiliate registered successfully" });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
});

/**
 * LOGIN: POST /api/affiliate/login
 * Required: email, password
 * Returns: JWT token
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "All fields required" });
    const affiliate = await Affiliate.findOne({ email });
    if (!affiliate)
      return res.status(401).json({ message: "Invalid email or password" });
    const isMatch = await bcrypt.compare(password, affiliate.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });
    const token = jwt.sign(
      { email: affiliate.email, id: affiliate._id },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    return res.json({ token, message: "Login successful" });
  } catch (e) {
    return res.status(500).json({ message: "Server error", error: e.message });
  }
});

/**
 * GET CURRENT AFFILIATE PROFILE: GET /api/affiliate/me
 */
router.get("/me", authenticate, async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.user.id).select("-password");
    if (!affiliate) return res.status(404).json({ message: "Affiliate not found" });
    res.json({ affiliate });
  } catch (e) {
    res.status(500).json({ message: "Could not fetch affiliate info" });
  }
});

/**
 * UPDATE PROFILE: POST /api/affiliate/update-profile
 * Accepts: email, bankAccount, password, notify
 */
router.post("/update-profile", authenticate, async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.user.id);
    if (!affiliate) return res.status(404).json({ message: "Affiliate not found" });
    const { email, bankAccount, password, notify } = req.body;
    if (email) affiliate.email = email;
    if (bankAccount) affiliate.bankAccount = bankAccount;
    if (password && password.length >= 6) affiliate.password = await bcrypt.hash(password, 12);
    if (notify) affiliate.notify = notify;
    await affiliate.save();
    res.json({ message: "Profile updated" });
  } catch (e) {
    res.status(500).json({ message: "Error updating profile", error: e.message });
  }
});

/**
 * DASHBOARD STATS: GET /api/affiliate/stats
 * Returns: { earnings, clicks, conversions, referrals, ... }
 */
router.get("/stats", authenticate, async (req, res) => {
  try {
    // Example logic -- replace with real aggregation
    const affiliate = await Affiliate.findById(req.user.id);
    if (!affiliate) return res.status(404).json({ message: "Not found" });
    res.json({
      earnings: affiliate.earnings || 0,
      clicks: affiliate.clicks || 0,
      conversions: affiliate.conversions || 0,
      referrals: affiliate.referrals?.length || 0,
      earningsTrend: affiliate.earningsTrend || [],
      conversionRate: affiliate.conversionRate || 0,
      earningsPerClick: affiliate.earningsPerClick || 0
    });
  } catch (e) {
    res.status(500).json({ message: "Error loading stats", error: e.message });
  }
});

/**
 * ACTIVITY: GET /api/affiliate/activity
 */
router.get("/activity", authenticate, async (req, res) => {
  try {
    // Should return array of affiliate's activities
    const affiliate = await Affiliate.findById(req.user.id);
    res.json(affiliate.activity || []);
  } catch (e) {
    res.status(500).json({ message: "Error loading activity", error: e.message });
  }
});

/**
 * PAYMENTS: GET /api/affiliate/payments
 */
router.get("/payments", authenticate, async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.user.id);
    res.json(affiliate.payments || []);
  } catch (e) {
    res.status(500).json({ message: "Error loading payments", error: e.message });
  }
});

/**
 * REQUEST PAYOUT: POST /api/affiliate/request-payout
 */
router.post("/request-payout", authenticate, async (req, res) => {
  try {
    // Logic to create payout request
    // Example: mark payout as requested, or insert into a payoutRequests collection
    res.json({ message: "Payout request submitted. Admin will review shortly." });
  } catch (e) {
    res.status(500).json({ message: "Error requesting payout", error: e.message });
  }
});

/**
 * LEADERBOARD: GET /api/affiliate/leaderboard
 */
router.get("/leaderboard", authenticate, async (req, res) => {
  try {
    // Should return top affiliates
    const topAffiliates = await Affiliate.find().sort({ earnings: -1 }).limit(10).select("name earnings referrals");
    res.json(topAffiliates);
  } catch (e) {
    res.status(500).json({ message: "Error loading leaderboard", error: e.message });
  }
});

/**
 * NOTIFICATIONS: GET /api/affiliate/notifications
 */
router.get("/notifications", authenticate, async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.user.id);
    res.json(affiliate.notifications || []);
  } catch (e) {
    res.status(500).json({ message: "Error loading notifications", error: e.message });
  }
});

/**
 * DOCUMENTS/RESOURCES: GET /api/affiliate/documents
 */
router.get("/documents", authenticate, async (req, res) => {
  try {
    // Example: return some resources from DB, or static array
    res.json([
      { title: "Affiliate Guide PDF", url: "/docs/affiliate-guide.pdf" },
      { title: "Banner Pack (ZIP)", url: "/docs/banners.zip" },
      { title: "ExamGuard Brand Assets", url: "/docs/brand-assets.zip" }
    ]);
  } catch (e) {
    res.status(500).json({ message: "Error loading documents", error: e.message });
  }
});

/**
 * REFERRALS TREE: GET /api/affiliate/referrals-tree
 */
router.get("/referrals-tree", authenticate, async (req, res) => {
  try {
    const affiliate = await Affiliate.findById(req.user.id);
    // Example: direct referrals and their referrals (children)
    res.json({
      directReferrals: affiliate.referrals?.length || 0,
      children: affiliate.referrals || []
    });
  } catch (e) {
    res.status(500).json({ message: "Error loading referrals tree", error: e.message });
  }
});

/**
 * FAQ: GET /api/affiliate/faq
 */
router.get("/faq", async (req, res) => {
  res.json([
    { question: "How do I get paid?", answer: "Request payout in the Payments tab. Payments are processed via bank transfer within 3 working days." },
    { question: "How do I refer new users?", answer: "Share your referral link using the Referral Tools tab. Earn when users sign up and activate their account." },
    { question: "Need more help?", answer: "Use the contact form below or start a live chat." }
  ]);
});

/**
 * SUPPORT: POST /api/affiliate/support
 */
router.post("/support", authenticate, async (req, res) => {
  try {
    const { email, subject, message } = req.body;
    if (!email || !subject || !message) {
      return res.status(400).json({ message: "All fields required" });
    }
    // Example: save support message to DB, or send email to admin
    res.json({ message: "Support message sent. We'll respond shortly." });
  } catch (e) {
    res.status(500).json({ message: "Error sending support message", error: e.message });
  }
});

export default router;
