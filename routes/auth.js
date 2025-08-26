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

// Authenticated user info endpoint
router.get("/me", authenticate, (req, res) => {
  resp.json({ user: req.user });
});

export default router;
