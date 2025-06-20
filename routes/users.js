import express from "express";
import User from "../models/User.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

// GET all users (open to all authenticated users, for chat)
router.get("/", authenticate, async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.faculty) filter.faculty = req.query.faculty;
  if (req.query.department) filter.department = req.query.department;
  // Only return public fields needed for chat
  const users = await User.find(filter)
    .select("username role faculty department _id profilePic active")
    .sort({ createdAt: -1 });
  res.json(users);
});

// GET single user by ID (still admin/superadmin only)
router.get("/:id", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// UPDATE user profile (admin or superadmin)
router.put("/:id", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  // Update allowed fields
  ["username", "faculty", "department", "profilePic", "active"].forEach(field => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });
  await user.save();
  res.json({ message: "User updated", user: user.toObject() });
});

// Activate/deactivate user (shortcut)
router.patch("/:id/status", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  user.active = !!req.body.active;
  await user.save();
  res.json({ message: "User status updated", active: user.active });
});

export default router;
