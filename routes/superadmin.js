import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

// Update superadmin or student details
router.put("/me", authenticate, async (req, res) => {
  const { username, password, profilePic } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (username) user.username = username;
  if (profilePic) user.profilePic = profilePic;
  if (password) user.password = await bcrypt.hash(password, 12);
  await user.save();
  res.json({ message: "Profile updated", username: user.username, profilePic: user.profilePic });
});

export default router;
