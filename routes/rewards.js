import express from "express";
import User from "../models/User.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

// PRACTICED QUESTIONS REWARD
// POST /api/rewards/practiced
router.post("/practiced", authenticate, async (req, res) => {
  // Body: { testType: "mock"|"past", examSetId, score, total }
  const { testType, examSetId, score, total } = req.body;
  if (!testType || !["mock", "past"].includes(testType)) {
    return res.status(400).json({ error: "Invalid or missing testType" });
  }
  if (!examSetId || typeof score !== "number" || typeof total !== "number" || total === 0) {
    return res.status(400).json({ error: "Missing fields" });
  }
  const percent = (score / total) * 100;
  let points = 0;
  if (percent >= 60 && percent < 80) points = 20;
  else if (percent >= 80) points = 30;
  else return res.json({ awarded: false, message: "Score not high enough for points" });

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!user.rewardHistory) user.rewardHistory = {};
  if (!user.rewardHistory.practiced) user.rewardHistory.practiced = [];

  const awardKey = `${testType}:${examSetId}`;
  if (user.rewardHistory.practiced.some(r => r.key === awardKey)) {
    return res.json({ awarded: false, message: "Already awarded for this test" });
  }

  user.points = (user.points || 0) + points;
  user.rewardHistory.practiced.push({ key: awardKey, points, date: new Date() });
  await user.save();

  res.json({ awarded: true, pointsAwarded: points, totalPoints: user.points });
});
// PRODUCT REVIEW REWARD (for reviewing a product/listing - goes to bonus)
router.post("/review-product", authenticate, async (req, res) => {
  // Body: { listingId, points }
  const { listingId, points } = req.body;
  if (!listingId || typeof points !== "number" || points <= 0) {
    return res.status(400).json({ error: "Invalid listingId or points" });
  }
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (!user.rewardHistory) user.rewardHistory = {};
  if (!user.rewardHistory.bonus) user.rewardHistory.bonus = [];

  // Prevent double-award for same listing review
  if (user.rewardHistory.bonus.some(b => b.reason === `Reviewed listing ${listingId}`)) {
    return res.json({ awarded: false, message: "Already awarded for reviewing this listing" });
  }

  user.points = (user.points || 0) + points;
  user.rewardHistory.bonus.push({
    reason: `Reviewed listing ${listingId}`,
    points,
    date: new Date(),
    by: req.user.username
  });
  await user.save();

  res.json({ awarded: true, pointsAwarded: points, totalPoints: user.points });
});
// READING REWARD (for reading posts; should be called by post-read logic, already existing)
router.post("/reading", authenticate, async (req, res) => {
  // Body: { postId, points }
  const { postId, points } = req.body;
  if (!postId || typeof points !== "number" || points <= 0) {
    return res.status(400).json({ error: "Invalid postId or points" });
  }
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (!user.rewardHistory) user.rewardHistory = {};
  if (!user.rewardHistory.reading) user.rewardHistory.reading = [];

  if (user.rewardHistory.reading.some(r => r.postId === postId)) {
    return res.json({ awarded: false, message: "Already awarded for this post" });
  }

  user.points = (user.points || 0) + points;
  user.rewardHistory.reading.push({ postId, points, date: new Date() });
  await user.save();

  res.json({ awarded: true, pointsAwarded: points, totalPoints: user.points });
});

// BONUS REWARD (admin/superadmin only)
router.post("/bonus", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  // Body: { userId, points, reason }
  const { userId, points, reason } = req.body;
  if (!userId || typeof points !== "number" || points === 0) {
    return res.status(400).json({ error: "Missing userId or invalid points" });
  }
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!user.rewardHistory) user.rewardHistory = {};
  if (!user.rewardHistory.bonus) user.rewardHistory.bonus = [];
  user.points = (user.points || 0) + points;
  user.rewardHistory.bonus.push({
    reason: reason || "",
    points,
    date: new Date(),
    by: req.user.username
  });
  await user.save();
  res.json({ awarded: true, pointsAwarded: points, totalPoints: user.points });
});

// ADMIN REWARD (admin/superadmin only, for manual adjustments)
router.post("/admin", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  // Body: { userId, points, reason }
  const { userId, points, reason } = req.body;
  if (!userId || typeof points !== "number" || points === 0) {
    return res.status(400).json({ error: "Missing userId or invalid points" });
  }
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!user.rewardHistory) user.rewardHistory = {};
  if (!user.rewardHistory.admin) user.rewardHistory.admin = [];
  user.points = (user.points || 0) + points;
  user.rewardHistory.admin.push({
    reason: reason || "",
    points,
    date: new Date(),
    by: req.user.username
  });
  await user.save();
  res.json({ awarded: true, pointsAwarded: points, totalPoints: user.points });
});

// GET REWARD BREAKDOWN for logged-in user (all sources, for dashboard)
router.get("/breakdown", authenticate, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const breakdown = {
    practiced: (user.rewardHistory?.practiced || []).reduce((sum, r) => sum + (r.points || 0), 0),
    reading: (user.rewardHistory?.reading || []).reduce((sum, r) => sum + (r.points || 0), 0),
    bonus: (user.rewardHistory?.bonus || []).reduce((sum, r) => sum + (r.points || 0), 0),
    admin: (user.rewardHistory?.admin || []).reduce((sum, r) => sum + (r.points || 0), 0),
    total: user.points || 0
  };
  res.json(breakdown);
});

export default router;
