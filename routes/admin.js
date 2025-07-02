import express from "express";
import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authAdmin } from "../middleware/authAdmin.js";
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Register
router.post("/register", async (req, res) => {
  try {
    const { fullname, email, username, password } = req.body;
    if (!fullname || !email || !username || !password)
      return res.status(400).json({ success: false, message: "All fields required." });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });

    const lcEmail = email.toLowerCase();
    const exists = await Admin.findOne({ $or: [{ email: lcEmail }, { username }] });
    if (exists)
      return res.status(409).json({ success: false, message: "Email or username already registered." });

    const hash = await bcrypt.hash(password, 12);

    let admin;
    try {
      admin = await Admin.create({ fullname, email: lcEmail, username, password: hash });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ success: false, message: "Email or username already registered." });
      }
      throw err;
    }

    const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET, { expiresIn: "6h" });
    return res.status(201).json({ success: true, token });
  } catch (e) {
    console.error("Admin registration error:", e);
    return res.status(500).json({ success: false, message: "Registration failed. Please try again later." });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "All fields required." });

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) return res.status(401).json({ success: false, message: "Invalid credentials." });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ success: false, message: "Invalid credentials." });

    const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET, { expiresIn: "6h" });
    res.json({ success: true, token });
  } catch (e) {
    console.error("Admin login error:", e);
    res.status(500).json({ success: false, message: "Login failed. Please try again later." });
  }
});

// Check email
router.get("/check-email", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ exists: false });
  const exists = await Admin.exists({ email: email.toLowerCase() });
  res.json({ exists: !!exists });
});

// Get profile
router.get("/me", authAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

export default router;
