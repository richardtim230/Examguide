import express from "express";
import CreditCode from "../models/creditCode.js";
import User from "../models/user.js";
const router = express.Router();

/* === NO ADMIN AUTH on these endpoints! === */

// Generate credit codes (POST: {count, points})
router.post("/generate", async (req, res) => {
  const { count = 1, points = 250 } = req.body;
  function genCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = ""; for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }
  let codes = [];
  for (let i = 0; i < count; i++) {
    let code;
    while (true) {
      code = genCode();
      if (!await CreditCode.exists({ code })) break;
    }
    codes.push(await CreditCode.create({ code, points }));
  }
  res.json({ codes: codes.map(c => ({ code: c.code, points: c.points })) });
});
// Add near the bottom of the file, after your studentAuth endpoint

// ADMIN/STAFF: assign credit by email or username, no login required (use identifier)
router.post("/admin-redeem", async (req, res) => {
  try {
    let { identifier, code } = req.body;
    if (!identifier || !code)
      return res.status(400).json({ message: "identifier and code required." });

    // Find user by email or username (case-insensitive)
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ]
    });
    if (!user) return res.status(404).json({ message: "Student not found for identifier." });

    const credit = await CreditCode.findOne({ code: code.toUpperCase() });
    if (!credit) return res.status(404).json({ message: "Recharge code not found." });
    if (credit.used) return res.status(409).json({ message: "Recharge code already used." });

    // Add points to student, mark credit as used
    const points = credit.points || 250;
    user.creditPoints = (user.creditPoints || 0) + points;
    await user.save();
    credit.used = true;
    credit.usedBy = user._id;
    credit.usedAt = new Date();
    await credit.save();

    res.json({
      success: true,
      message: `Credit points added to ${user.email || user.username}.`,
      creditPoints: user.creditPoints,
      points
    });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});
// List credit codes (GET, filter by used/unused)
router.get("/", async (req, res) => {
  const { status } = req.query; // status=used|unused|all
  let filter = {};
  if (status === "used") filter.used = true;
  else if (status === "unused") filter.used = false;
  const codes = await CreditCode.find(filter).sort({ createdAt: -1 }).populate('usedBy', 'fullName email');
  res.json(codes);
});

// Delete code (single)
router.delete("/:code", async (req, res) => {
  await CreditCode.findOneAndDelete({ code: req.params.code });
  res.json({ success: true });
});

// Optional: to revoke a used code (reset to unused)
router.post("/restore/:code", async (req, res) => {
  await CreditCode.findOneAndUpdate({ 'code': req.params.code }, { used: false, usedBy: null, usedAt: null });
  res.json({ success: true });
});

/* === STUDENT REDEEM ENDPOINT === */
function studentAuth(req, res, next) {
  // JWT Bearer auth
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No authorization token." });
  const token = auth.replace(/^Bearer\s/, '');
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || "devsecret";
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid/expired token." });
  }
}

router.post("/redeem-credit", studentAuth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== "string" || code.length !== 12)
      return res.status(400).json({ message: "Invalid code." });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: "Student not found." });

    const credit = await CreditCode.findOne({ code: code.toUpperCase() });
    if (!credit) return res.status(404).json({ message: "Recharge code not found." });
    if (credit.used) return res.status(409).json({ message: "Recharge code already used." });

    // Add points to student, mark credit as used
    const points = credit.points || 250;
    user.creditPoints = (user.creditPoints || 0) + points;
    await user.save();
    credit.used = true;
    credit.usedBy = user._id;
    credit.usedAt = new Date();
    await credit.save();

    res.json({
      success: true,
      message: "Credit points added.",
      creditPoints: user.creditPoints,
      points
    });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

export default router;
