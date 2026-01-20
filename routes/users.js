import express from "express";
import bcrypt from "bcryptjs";
import Users from "../models/Users.js";
import BloggerDashboard from "../models/BloggerDashboard.js";
import mongoose from "mongoose";
import User from '../models/User.js'; 
import Faculty from "../models/Faculty.js";
import Department from "../models/Department.js";
import crypto from "crypto";
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
    const users = await Users.find(filter)
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

    // Only populate faculty/department for users whose field is a valid ObjectId
const usersToPopulate = users.filter(u =>
  mongoose.Types.ObjectId.isValid(u.faculty) ||
  mongoose.Types.ObjectId.isValid(u.department)
);

await Users.populate(usersToPopulate, [
  {
    path: "faculty",
    select: "name"
  },
  {
    path: "department",
    select: "name"
  }
]);

    const data = users.map(u => u.toObject());
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// POST /api/users/:studentId/activation-key (admin)
router.post("/:studentId/activation-key", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const user = await Users.findOne({ studentId });
    if (!user) return res.status(404).json({ message: "Student not found" });

    const key = crypto.randomBytes(8).toString("hex").toUpperCase();
    user.assignedActivationKey = key;
    user.activationKeyStatus = "pending";
    await user.save();
    res.json({ message: "Activation key assigned", studentId, activationKey: key });
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not assign key" });
  }
});

// POST /api/users/redeem-activation (student)
router.post("/redeem-activation", authenticate, async (req, res) => {
  try {
    const { activationKey } = req.body;
    if (!activationKey) return res.status(400).json({ message: "Activation key required." });

    const user = await Users.findOne({ assignedActivationKey: activationKey, activationKeyStatus: "pending", _id: req.user.id });
    if (!user) return res.status(404).json({ message: "Invalid or expired key." });

    user.isPremium = true;
    user.activationKeyStatus = "redeemed";
    await user.save();
    res.json({ message: "Account successfully upgraded to premium!", isPremium: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not redeem key." });
  }
});
router.patch("/:id/verify", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const user = await Users.findById(req.params.id);
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
  const user = await Users.findById(id);
  if (!user) return res.status(404).json({ error: "User not found" });
  const daily = (user.dailyTasks || []).find(d => d.date === date);
  res.json({ done: daily ? daily.done : [] });
});

// POST /api/users/:id/daily-tasks
router.post("/:id/daily-tasks", authenticate, async (req, res) => {
  const { id } = req.params;
  const { date, taskId } = req.body;
  if (!date || !taskId) return res.status(400).json({ error: "Missing date or taskId" });
  const user = await Users.findById(id);
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
    const user = await Users.findById(req.params.id);
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
    const count = await Users.countDocuments({});
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// PATCH user approval (e.g., pending_blogger -> blogger)
router.patch('/:userId/approval', authenticate, authorizeRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { approved } = req.body;
    const user = await Users.findById(req.params.userId);
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

// GET user by id (for author lookup, with account/payment/contact details)
router.get("/:id", async (req, res) => {
  try {
    const user = await Users.findById(req.params.id)
      .populate("faculty", "name")
      .populate("department", "name")
      .select("fullname username profilePic faculty department bio phone bank accountName accountNumber location email");
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
        phone: user.phone || "",
        bank: user.bank || "",
        accountName: user.accountName || "",
        accountNumber: user.accountNumber || "",
        location: user.location || "",
        email: user.email || ""
      }
    });
  } catch (e) {
    res.status(500).json({ error: "Could not fetch user" });
  }
});
// POST /api/users/batch-assign-keys
// { studentIds: [array of studentId strings] }
router.post("/batch-assign-keys", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const { studentIds } = req.body;
  if (!studentIds || !Array.isArray(studentIds)) return res.status(400).json({ message: "studentIds array required" });
  const results = [];
  for (let studentId of studentIds) {
    const user = await Users.findOne({ studentId });
    if (!user) {
      results.push({ studentId, error: "Not found" });
      continue;
    }
    // Only assign if not already premium or has pending key
    if (user.isPremium || (user.activationKeyStatus === "pending" && user.assignedActivationKey)) {
      results.push({ studentId, status: "Already premium or has pending key" });
      continue;
    }
    const key = crypto.randomBytes(8).toString("hex").toUpperCase();
    user.assignedActivationKey = key;
    user.activationKeyStatus = "pending";
    await user.save();
    results.push({ studentId, activationKey: key, status: "Assigned" });
  }
  res.json({ results });
});
// PATCH /api/users/:studentId/expire-key (admin)
// Expires/revokes a key, disables premium if already active
router.patch("/:studentId/expire-key", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const user = await Users.findOne({ studentId: req.params.studentId });
  if (!user) return res.status(404).json({ message: "Student not found" });
  user.activationKeyStatus = "expired";
  user.assignedActivationKey = "";
  user.isPremium = false;
  await user.save();
  res.json({ message: "Activation key expired/revoked", studentId: user.studentId });
});
// GET /api/users/activation-keys?status=&studentId= (admin only)
// Returns all users with activation key info, or filtered by status or studentId
router.get("/activation-keys", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const { status, studentId } = req.query;
  let filter = { assignedActivationKey: { $ne: "" } };
  if (status) filter.activationKeyStatus = status;
  if (studentId) filter.studentId = studentId;
  const users = await Users.find(filter).select("studentId fullname email assignedActivationKey activationKeyStatus isPremium");
  res.json({ data: users });
});
// GET user by id (admin view)
router.get("/admin/users/:id", authenticate, async (req, res) => {
  try {
    const user = await Users.findById(req.params.id)
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
// In routes/auth.js or routes/user.js
// PATCH /auth/me
// Replace this block that uses router.patch(...)
router.patch('/api/auth/me', authenticate, async (req, res) => {
  const updates = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Only allow these keys to be updated
  const allowed = [
    "fullname", "institution", "country", "location", "phone",
    "level", "department", "faculty", "role", "religion",
    "address", "zip", "bio"
  ];

  allowed.forEach(key => {
    if (updates[key] !== undefined) user[key] = updates[key];
  });

  // Handle nested social object
  if (typeof updates.social === "object" && updates.social !== null) {
    user.social = user.social || {};
    for (const [k, v] of Object.entries(updates.social)) {
      user.social[k] = v;
    }
  }
  await user.save();
  res.json(user);
});
router.patch('/:id', authenticate, async (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ error: "Forbidden" });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  Object.assign(user, req.body);
  await user.save();
  res.json(user);
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
    const exists = await Users.findOne({ $or: [{ username }, { email }] });
    if (exists) return res.status(400).json({ message: "Username or email already exists." });

    const hashed = await bcrypt.hash(password, 12);

    const user = new Users({
      fullname, username, email, password: hashed, role,
      faculty: facultyId || faculty, // fallback to string if not resolved
      department: departmentId || department, // fallback to string if not resolved
      profilePic, active
    });
    await user.save();
    const retUser = await Users.findById(user._id)
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
    const user = await Users.findById(req.params.id);
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
    const retUser = await Users.findById(user._id)
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
    const user = await Users.findById(req.params.id);
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
    const user = await Users.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
});

export default router;
