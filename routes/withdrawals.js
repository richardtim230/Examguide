import express from "express";
import Withdrawal from "../models/Withdrawal.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

// POST /api/withdrawals
router.post("/", authenticate, async (req, res) => {
  try {
    const { amount, bank, accountName, accountNumber } = req.body;
    if (!amount || !bank || !accountName || !accountNumber) {
      return res.status(400).json({ error: "All fields required." });
    }
    const user = await User.findById(req.user.id);
    const points = user.points || 0;
    const naira = Math.floor(points / 100) * 500;
    if (amount > naira) return res.status(400).json({ error: "Insufficient balance." });
    // Optionally: deduct points immediately or on approval
    // For now, lock points
    user.points -= Math.ceil((amount / 500) * 100); // convert naira to points, round up
    await user.save();
    const withdrawal = new Withdrawal({
      user: user._id,
      amount,
      bank,
      accountName,
      accountNumber
    });
    await withdrawal.save();
    res.json({ success: true, withdrawal });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
