import express from "express";
import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Register
router.post("/register", async (req, res) => {
  try {
    const { fullname, email, username, password } = req.body;
    if (!fullname || !email || !username || !password)
      return res.status(400).json({ message: "All fields required." });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    const exists = await Admin.findOne({ $or: [ { email }, { username } ] });
    if (exists)
      return res.status(409).json({ message: "Email or username already registered." });
    const hash = await bcrypt.hash(password, 12);
    const admin = await Admin.create({ fullname, email, username, password: hash });
    const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET, { expiresIn: "6h" });
    res.status(201).json({ success: true, token });
  } catch (e) {
    res.status(500).json({ message: "Registration failed." });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "All fields required." });
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: "Invalid credentials." });
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials." });
    const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET, { expiresIn: "6h" });
    res.json({ success: true, token });
  } catch {
    res.status(500).json({ message: "Login failed." });
  }
});

// Check email
router.get("/check-email", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ exists: false });
  const exists = await Admin.exists({ email });
  res.json({ exists: !!exists });
});

// Get profile
import { authAdmin } from "../middleware/authAdmin.js";
router.get("/me", authAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

export default router;
