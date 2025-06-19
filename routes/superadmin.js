import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

// Update user profile (superadmin, admin, or student)
router.put("/me", authenticate, async (req, res) => {
  try {
    const { username, password, profilePic, faculty, department } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (username) user.username = username;
    if (typeof profilePic !== "undefined") user.profilePic = profilePic;
    if (faculty) user.faculty = faculty;
    if (department) user.department = department;
    if (password && password.trim() !== "") {
      user.password = await bcrypt.hash(password, 12);
    }

    await user.save();

    // Return the updated user object (excluding password)
    const { password: _, ...userObj } = user.toObject();
    res.json({ message: "Profile updated", user: userObj });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Could not update profile" });
  }
});

export default router;
