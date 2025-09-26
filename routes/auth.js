import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import CodecxRegistration from "../models/CodecxRegistration.js";
import { authenticate } from "../middleware/authenticate.js";
import User from "../models/User.js";
const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Find candidate by username, matricNumber, or email
  const candidate = await CodecxRegistration.findOne({
    $or: [
      { loginUsername: username },
      { matricNumber: username },
      { email: username }
    ]
  });

  if (!candidate) {
    return res.status(400).json({ message: "Invalid credentials." });
  }

  // Check password using bcrypt
  const isMatch = await bcrypt.compare(password, candidate.loginPasswordHash);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials." });
  }

  // Check if account is activated
  if (!candidate.active) {
    return res.status(403).json({ message: "Your account is not activated yet. Please wait for admin review." });
  }

  // Generate JWT token with standard payload for frontend
  const token = jwt.sign(
    {
      id: candidate._id,
      role: "codecx-candidate",
      email: candidate.email,
      loginUsername: candidate.loginUsername,
      matricNumber: candidate.matricNumber
    },
    process.env.JWT_SECRET || "your_jwt_secret",
    { expiresIn: "2d" }
  );

  res.json({ token });
});

// Update the /me endpoint to populate faculty and department names for the logged-in user

router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("faculty", "name") // Only pull the name field
      .populate("department", "name")
      .select("-password"); // Exclude password field

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch user profile." });
  }
});

export default router;
