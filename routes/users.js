import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import BloggerDashboard from "../models/BloggerDashboard.js";
import mongoose from "mongoose";
import Faculty from "../models/Faculty.js";
import Department from "../models/Department.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";
const router = express.Router();

// Helper to check ObjectId
function isObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

router.get("/", async (req, res) => {
  const filter = {};

  // Accept role filter
  if (req.query.role) filter.role = req.query.role;

  // Accept faculty as either ObjectId or name string or legacy string (allow both)
  if (req.query.faculty) {
    const facultyValue = req.query.faculty.trim();
    if (/^[0-9a-fA-F]{24}$/.test(facultyValue)) {
      // It's an ObjectId
      filter.$or = [
        { faculty: facultyValue },
        { faculty: facultyValue } // for legacy string, but will match only if stored as string
      ];
    } else if (facultyValue !== "") {
      const fac = await Faculty.findOne({ name: facultyValue });
      if (fac) {
        filter.$or = [
          { faculty: fac._id },
          { faculty: facultyValue }
        ];
      } else {
        // No such faculty exists, so return no results
        return res.json([]);
      }
    }
  }

  // Accept department as either ObjectId or name string or legacy string (allow both)
  if (req.query.department) {
    const departmentValue = req.query.department.trim();
    if (/^[0-9a-fA-F]{24}$/.test(departmentValue)) {
      filter.$or = filter.$or || [];
      filter.$or.push({ department: departmentValue }, { department: departmentValue });
    } else if (departmentValue !== "") {
      const dept = await Department.findOne({ name: departmentValue });
      if (dept) {
        filter.$or = filter.$or || [];
        filter.$or.push({ department: dept._id }, { department: departmentValue });
      } else {
        return res.json([]);
      }
    }
  }

  try {
    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    // Defensive patch: ensure faculty/department fields are either ObjectId, string, or null
    for (const user of users) {
      // Patch legacy string
      if (typeof user.faculty === "string") {
        user.faculty = { name: user.faculty };
      }
      if (typeof user.department === "string") {
        user.department = { name: user.department };
      }
      // Patch invalid object (not ObjectId and not a populated Faculty object)
      if (
        typeof user.faculty === "object" &&
        user.faculty !== null &&
        !user.faculty._id &&
        !user.faculty.name
      ) {
        user.faculty = "";
      }
      if (
        typeof user.department === "object" &&
        user.department !== null &&
        !user.department._id &&
        !user.department.name
      ) {
        user.department = "";
      }
      // If faculty is a plain object (legacy patch) but not a valid ObjectId or Faculty document, convert to string or null
      if (
        typeof user.faculty === "object" &&
        user.faculty !== null &&
        !user.faculty._id &&
        typeof user.faculty.name === "string"
      ) {
        // leave as is: { name: ... }
      }
      if (
        typeof user.department === "object" &&
        user.department !== null &&
        !user.department._id &&
        typeof user.department.name === "string"
      ) {
        // leave as is: { name: ... }
      }
    }

    // Only populate users whose faculty/department fields are valid ObjectIds
    // This prevents Cast errors when populating
    await User.populate(users, [
      {
        path: "faculty",
        select: "name",
        match: {
          _id: { $type: "objectId" }
        }
      },
      {
        path: "department",
        select: "name",
        match: {
          _id: { $type: "objectId" }
        }
      }
    ]);

    const data = users.map(u => u.toObject());
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

// GET /api/users/:id/daily-tasks?date=YYYY-MM-DD
router.get("/:id/daily-tasks", authenticate, async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "Missing date" });
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: "User not found" });
  const daily = (user.dailyTasks || []).find(d => d.date === date);
  res.json({ done: daily ? daily.done : [] });
});

// POST /api/users/:id/daily-tasks
router.post("/:id/daily-tasks", authenticate, async (req, res) => {
  const { id } = req.params;
  const { date, taskId } = req.body;
  if (!date || !taskId) return res.status(400).json({ error: "Missing date or taskId" });
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: "User not found" });
  let daily = user.dailyTasks.find(d => d.date === date);
  if (!daily) {
    daily = { date, done: [] };
    user.dailyTasks.push(daily);
  }
  if (!daily.done.includes(taskId)) {
    daily.done.push(taskId);
    await user.save();
  }
  res.json({ success: true, done: daily.done });
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

// PATCH user approval (e.g., pending_blogger -> blogger)
router.patch('/:userId/approval', authenticate, authorizeRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { approved } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.approved = approved;

    // If user is a pending_blogger and is approved, update their role to blogger
    if (user.role === "pending_blogger" && approved === true) {
      user.role = "blogger";
    }

    await user.save();
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Could not update user approval.' });
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

    let faculty = user.faculty;
    let department = user.department;
    if (typeof faculty === "string") faculty = { name: faculty };
    if (typeof department === "string") department = { name: department };

    res.json({
      user: {
        fullname: user.fullname,
        username: user.username,
        profilePic: user.profilePic,
        faculty: faculty?.name || "",
        department: department?.name || "",
        bio: user.bio,
      }
    });
  } catch (e) {
    res.status(500).json({ error: "Could not fetch user" });
  }
});

// GET user by id (admin view)
router.get("/admin/users/:id", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("faculty", "name")
      .populate("department", "name");

    if (!user) return res.status(404).json({ error: "User not found" });

    // If no logged-in user OR role not admin/superadmin → return public info only
    if (!req.user || !["admin", "superadmin"].includes(req.user.role)) {
      let faculty = user.faculty;
      let department = user.department;
      if (typeof faculty === "string") faculty = { name: faculty };
      if (typeof department === "string") department = { name: department };
      return res.json({
        user: {
          fullname: user.fullname,
          username: user.username,
          profilePic: user.profilePic,
          faculty: faculty,
          department: department,
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

    let facultyId = null;
    let departmentId = null;

    // Handle faculty string or ObjectId (allow both)
    if (faculty && faculty !== "") {
      if (isObjectId(faculty)) {
        const fac = await Faculty.findById(faculty);
        if (!fac) return res.status(400).json({ message: "Faculty not found." });
        facultyId = faculty;
      } else {
        // Try to find by name, else create
        let fac = await Faculty.findOne({ name: faculty });
        if (!fac) fac = await Faculty.create({ name: faculty });
        facultyId = fac._id;
      }
    }

    // Handle department string or ObjectId (allow both)
    if (department && department !== "") {
      if (isObjectId(department)) {
        const dept = await Department.findById(department);
        if (!dept) return res.status(400).json({ message: "Department not found." });
        departmentId = department;
      } else {
        // Try to find by name, else create
        let dept = await Department.findOne({ name: department });
        if (!dept) {
          // Try to attach faculty reference if possible
          dept = await Department.create({ name: department, faculty: facultyId });
        }
        departmentId = dept._id;
      }
    }

    // Check duplicate username/email
    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) return res.status(400).json({ message: "Username or email already exists." });

    const hashed = await bcrypt.hash(password, 12);

    const user = new User({
      fullname, username, email, password: hashed, role,
      faculty: facultyId || faculty, // fallback to string if not resolved
      department: departmentId || department, // fallback to string if not resolved
      profilePic, active
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

// UPDATE user profile (admin or superadmin, allow both string/ObjectId & allow legacy)
router.put("/:id", authenticate, authorizeRole("admin", "blogger", "student", "pq-uploader", "superadmin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    for (const field of ["fullname", "username", "email", "level", "phone", "profilePic", "active", "religion", "role"]) {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    }

    // Patch: Accept faculty/department name and auto-create if needed, allow legacy string
    if (req.body.faculty !== undefined) {
      let facultyId = null;
      if (req.body.faculty === "") facultyId = null;
      else if (isObjectId(req.body.faculty)) {
        const fac = await Faculty.findById(req.body.faculty);
        if (!fac) return res.status(400).json({ message: "Faculty not found." });
        facultyId = fac._id;
      } else {
        let fac = await Faculty.findOne({ name: req.body.faculty });
        if (!fac) fac = await Faculty.create({ name: req.body.faculty });
        facultyId = fac._id;
      }
      user.faculty = facultyId || req.body.faculty;
    }
    if (req.body.department !== undefined) {
      let departmentId = null;
      if (req.body.department === "") departmentId = null;
      else if (isObjectId(req.body.department)) {
        const dept = await Department.findById(req.body.department);
        if (!dept) return res.status(400).json({ message: "Department not found." });
        departmentId = dept._id;
      } else {
        let dept = await Department.findOne({ name: req.body.department });
        if (!dept) {
          // Try to attach faculty reference if possible
          dept = await Department.create({ name: req.body.department, faculty: user.faculty });
        }
        departmentId = dept._id;
      }
      user.department = departmentId || req.body.department;
    }

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
