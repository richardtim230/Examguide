import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import BloggerDashboard from "../models/BloggerDashboard.js";
import mongoose from "mongoose";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";
const router = express.Router();

// GET all users (supports ?role, ?faculty, ?department; populates faculty/department names)
router.get("/", async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.faculty) filter.faculty = req.query.faculty;
  if (req.query.department) filter.department = req.query.department;

  try {
    const users = await User.find(filter)
      .populate("faculty", "name")
      .populate("department", "name")
      .select("-password")
      .sort({ createdAt: -1 });

    const data = users.map(u => {
      const obj = u.toObject();
      obj.facultyName = obj.faculty?.name || "";
      obj.departmentName = obj.department?.name || "";
      return obj;
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});
router.patch("/:id/verify", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.verified = true;
    await user.save();
    res.json({ message: "User verified." });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});
router.patch("/:id/ban", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.active = false;
    await user.save();
    res.json({ message: "User banned." });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});
router.get("/count", async (req, res) => {
  try {
    const count = await User.countDocuments({});
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});
// GET user by id (for author lookup)
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("faculty", "name")
      .populate("department", "name")
      .select("fullname username profilePic faculty department bio");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      user: {
        fullname: user.fullname,
        username: user.username,
        profilePic: user.profilePic,
        faculty: user.faculty?.name || "",
        department: user.department?.name || "",
        bio: user.bio,
      }
    });
  } catch (e) {
    res.status(500).json({ error: "Could not fetch user" });
  }
});

// GET user by id
router.get("/admin/users/:id", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("faculty", "name")
      .populate("department", "name");

    if (!user) return res.status(404).json({ error: "User not found" });

    // If no logged-in user OR role not admin/superadmin → return public info only
    if (!req.user || !["admin", "superadmin"].includes(req.user.role)) {
      return res.json({
        user: {
          fullname: user.fullname,
          username: user.username,
          profilePic: user.profilePic,
          faculty: user.faculty,
          department: user.department,
          bio: user.bio,
        },
      });
    }

    // Admin/superadmin → return full details (excluding password)
    const { password, ...safeUser } = user.toObject();
    res.json(safeUser);

  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

      
// CREATE new user (admin/superadmin only)
router.post("/", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const {
      fullname, username, email, password,
      role = "student", faculty, department, profilePic, active = true
    } = req.body;

    if (!username || !email || !password || !fullname)
      return res.status(400).json({ message: "fullname, username, email, and password are required." });

    const allowedRoles = ["student", "admin", "superadmin", "uploader"];
    if (!allowedRoles.includes(role)) return res.status(400).json({ message: "Invalid role." });

    // Faculty and department are now optional for all roles, including uploader.
    // Validate existence of faculty and department if provided
    if (faculty) {
      if (!faculty.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid faculty ObjectId." });
      }
      const fac = await Faculty.findById(faculty);
      if (!fac) return res.status(400).json({ message: "Faculty not found." });
    }
    if (department) {
      if (!department.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid department ObjectId." });
      }
      const dept = await Department.findById(department);
      if (!dept) return res.status(400).json({ message: "Department not found." });
    }

    // Check duplicate username/email
    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) return res.status(400).json({ message: "Username or email already exists." });

    const hashed = await bcrypt.hash(password, 12);

    const user = new User({
      fullname, username, email, password: hashed, role, faculty, department, profilePic, active
    });
    await user.save();
    const retUser = await User.findById(user._id)
      .populate("faculty", "name")
      .populate("department", "name")
      .select("-password");
    res.status(201).json({ message: "User created.", user: retUser });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});



// UPDATE user profile (admin or superadmin)
router.put("/:id", authenticate, authorizeRole("admin", "blogger", "student", "pq-uploader", "superadmin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    ["fullname", "username", "email", "level", "phone", "faculty", "department", "profilePic", "active", "religion", "role"].forEach(field => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });
    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 12);
    }
    await user.save();
    const retUser = await User.findById(user._id)
      .populate("faculty", "name")
      .populate("department", "name")
      .select("-password");
    res.json({ message: "User updated", user: retUser });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// Activate/deactivate user (shortcut)
router.patch("/:id/status", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.active = !!req.body.active;
    await user.save();
    res.json({ message: "User status updated", active: user.active });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// DELETE user (admin/superadmin)
router.delete("/:id", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

export default router;
