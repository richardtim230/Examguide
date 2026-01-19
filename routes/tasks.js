import express from "express";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

/**
 * GET: All tasks (admin only) - supports filters (status, activityType, user, level, faculty, department, sex, q)
 * This endpoint returns paginated tasks and populates basic user info.
 */
router.get("/", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const {
      status,
      activityType,
      user, // explicit user id
      level,
      faculty,
      department,
      sex,
      q, // free text search on title/description
      page = 1,
      limit = 100
    } = req.query;

    const taskQuery = {};
    if (status) taskQuery.status = status;
    if (activityType) taskQuery.activityType = activityType;

    // If explicit user ID provided, use it directly
    if (user) {
      taskQuery.user = user;
    } else {
      // If any user-related filters provided, find matching users first.
      const userFilters = {};
      if (level) userFilters.level = level;
      if (faculty) userFilters.faculty = faculty;
      if (department) userFilters.department = department;

      let userIds = null;

      if (Object.keys(userFilters).length || sex) {
        const userQuery = { ...userFilters };
        if (sex) {
          // accept sex or gender field names
          userQuery.$or = [{ sex }, { gender: sex }];
        }
        const users = await User.find(userQuery).select("_id").lean();
        userIds = users.map(u => u._id);
        if (!userIds.length) {
          return res.json({ meta: { page: 1, limit: 0, total: 0, pages: 0 }, tasks: [] });
        }
        taskQuery.user = { $in: userIds };
      }
    }

    // Text search on title/description (simple regex)
    if (q && q.trim()) {
      const reg = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      taskQuery.$or = taskQuery.$or || [];
      taskQuery.$or.push({ title: reg }, { description: reg });
    }

    const pg = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.max(1, Math.min(1000, parseInt(limit, 10) || 100));

    const [tasks, total] = await Promise.all([
      Task.find(taskQuery)
        .sort({ createdAt: -1 })
        .skip((pg - 1) * lim)
        .limit(lim)
        .populate("user", "fullname username email faculty department level sex")
        .lean(),
      Task.countDocuments(taskQuery)
    ]);

    res.json({
      meta: { page: pg, limit: lim, total, pages: Math.ceil(total / lim) },
      tasks
    });
  } catch (e) {
    console.error("GET /api/tasks error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /match-users
 * Admin-only. Return number (and optional sample) of users matching filters:
 * Query params: level, faculty, department, sex, q (search by name/email/username), limitSample
 */
router.get("/match-users", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

    const { level, faculty, department, sex, q, limitSample = 20 } = req.query;
    const userQuery = {};
    if (level) userQuery.level = level;
    if (faculty) userQuery.faculty = faculty;
    if (department) userQuery.department = department;
    if (sex) userQuery.$or = [{ sex }, { gender: sex }];

    if (q && q.trim()) {
      const reg = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      userQuery.$or = userQuery.$or || [];
      userQuery.$or.push({ fullname: reg }, { username: reg }, { email: reg });
    }

    const total = await User.countDocuments(userQuery);
    const sample = await User.find(userQuery).limit(parseInt(limitSample, 10)).select("_id fullname username email level faculty department sex").lean();

    res.json({ total, sample });
  } catch (e) {
    console.error("GET /api/tasks/match-users error:", e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST: Create a single Task (existing behavior)
 * If body.user provided, must be same as req.user or admin.
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const userId = req.body.user || req.user.id;
    if (userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const task = await Task.create({ ...req.body, user: userId });
    res.status(201).json(task);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/**
 * POST /bulk
 * Admin-only endpoint - create the same task for many users selected by:
 *  - explicit userIds array OR
 *  - filters object (level, faculty, department, sex, q) to match users
 *
 * Body:
 * {
 *   title, description, points, activityType, meta, dueDate,
 *   userIds: [ "...", ... ] OR filters: { level, faculty, department, sex, q },
 *   skipIfExists: boolean (default false)  // skip creating if a task with same title exists for that user (status not 'done')
 * }
 *
 * Response includes counts and any errors.
 */
router.post("/bulk", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

    const {
      title,
      description = "",
      points = 0,
      activityType = "custom",
      meta = {},
      dueDate,
      userIds,
      filters,
      skipIfExists = false,
      maxUsers = process.env.MAX_BULK_USERS ? parseInt(process.env.MAX_BULK_USERS, 10) : 2000
    } = req.body;

    if (!title) return res.status(400).json({ message: "title is required" });

    // Resolve target users
    let targets = [];
    if (Array.isArray(userIds) && userIds.length) {
      // sanitize and unique
      const uniq = [...new Set(userIds.map(String))];
      targets = await User.find({ _id: { $in: uniq } }).select("_id").lean();
    } else if (filters && Object.keys(filters).length) {
      const { level, faculty, department, sex, q } = filters;
      const userQuery = {};
      if (level) userQuery.level = level;
      if (faculty) userQuery.faculty = faculty;
      if (department) userQuery.department = department;
      if (sex) userQuery.$or = [{ sex }, { gender: sex }];
      if (q && q.trim()) {
        const reg = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        userQuery.$or = userQuery.$or || [];
        userQuery.$or.push({ fullname: reg }, { username: reg }, { email: reg });
      }
      targets = await User.find(userQuery).select("_id").lean();
    } else {
      return res.status(400).json({ message: "Provide userIds array or filters object to select users" });
    }

    if (!targets.length) return res.status(200).json({ message: "No users matched filters", totalMatched: 0, created: 0 });

    if (targets.length > maxUsers) {
      return res.status(413).json({ message: `Matched ${targets.length} users which exceeds max allowed (${maxUsers}). Narrow your filters.` });
    }

    const targetIds = targets.map(u => u._id);

    // If skipIfExists: find existing tasks with same title
    let existingMap = {};
    if (skipIfExists) {
      const existing = await Task.find({ user: { $in: targetIds }, title: title }).select("user title status").lean();
      existing.forEach(e => {
        // only consider non-done as "exists"
        if (!e.status || e.status !== "done") existingMap[String(e.user)] = true;
      });
    }

    // Build docs
    const docs = [];
    for (const uid of targetIds) {
      if (skipIfExists && existingMap[String(uid)]) continue;
      docs.push({
        user: uid,
        title,
        description,
        points,
        activityType,
        meta,
        dueDate,
        status: "active"
      });
    }

    if (!docs.length) {
      return res.status(200).json({ message: "No tasks to create after applying skipIfExists", totalMatched: targetIds.length, created: 0 });
    }

    // Insert many (unordered to continue on errors)
    const inserted = await Task.insertMany(docs, { ordered: false });
    res.status(201).json({
      message: "Bulk tasks created",
      totalMatched: targetIds.length,
      created: inserted.length,
      skipped: targetIds.length - docs.length,
      createdSample: inserted.slice(0, 10)
    });
  } catch (e) {
    console.error("POST /api/tasks/bulk error:", e);
    // If insertMany threw a BulkWriteError, try to extract insertedCount
    if (e && e.insertedDocs) {
      return res.status(201).json({
        message: "Bulk partial success",
        created: e.insertedDocs.length,
        error: e.message
      });
    }
    res.status(500).json({ error: e.message });
  }
});

// GET: All tasks for a user (optionally filter by status, activityType)
router.get("/user/:id", authenticate, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { status, activityType } = req.query;
    const query = { user: req.params.id };
    if (status) query.status = status;
    if (activityType) query.activityType = activityType;

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH: Update a task (status, progress, etc.)
router.patch("/:taskId", authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (task.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    Object.assign(task, req.body);
    if (req.body.status === "done" && !task.completedAt) task.completedAt = new Date();
    await task.save();
    res.json(task);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE: Remove a task (owner or admin)
router.delete("/:taskId", authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (task.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    await task.remove();
    res.json({ message: "Task deleted" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// [OPTIONAL] GET: Single task details
router.get("/:taskId", authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
