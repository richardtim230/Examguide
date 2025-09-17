import express from "express";
import Affiliate from "../models/Affiliate.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// Register affiliate
router.post("/register", async (req, res) => {
  const { name, email, phone, school, ref, password } = req.body;
  if (!name || !email || !phone || !school || !password) {
    return res.status(400).json({ message: "All fields required" });
  }
  const exists = await Affiliate.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: "Affiliate already registered" });
  }
  const hashed = await bcrypt.hash(password, 12);
  const affiliate = new Affiliate({ name, email, phone, school, ref, password: hashed });
  await affiliate.save();
  return res.status(201).json({ message: "Affiliate registered successfully" });
});

// Login affiliate
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "All fields required" });
  const affiliate = await Affiliate.findOne({ email });
  if (!affiliate) return res.status(401).json({ message: "Invalid email or password" });
  const isMatch = await bcrypt.compare(password, affiliate.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });
  // Generate a JWT token
  const token = jwt.sign({ email: affiliate.email, id: affiliate._id }, process.env.JWT_SECRET, { expiresIn: "2h" });
  return res.json({ token, message: "Login successful" });
});

export default router;
