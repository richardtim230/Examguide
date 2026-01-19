import express from "express";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

/**
 * GET: All tasks (admin only).
 * Supports optional query:
 *  - status
 *  - activityType
 *  - user (single user id)
 *  - level
 *  - faculty (faculty id)
 *  - department (department id)
 *  - sex (e.g. male/female/other)
 *  - q (search over title/description)
 *  - page, limit (pagination)
 *
 * If any of level/faculty/department/sex are provided they will be used to find matching users
 * and tasks will be returned for those users (combination supported).
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
      if (sex) {
        // try common field names: sex or gender
        // We'll search by either sex or gender (OR)
        // However mongoose find doesn't directly accept OR with other fields; handle below
      }

      let userIds = null;

      // Build user search logic
      if (Object.keys(userFilters).length || sex) {
        const userQuery = { ...userFilters };
        if (sex) {
          // we want users where sex === sex OR gender === sex
          // Use $or
          userQuery.$or = [{ sex }, { gender: sex }];
        }
        // Only return _id to limit payload
        const users = await User.find(userQuery).select("_id").lean();
        userIds = users.map(u => u._id);
        // If no users match the filters, return empty list early
        if (!userIds.length) {
          return res.json([]);
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

    // Pagination
    const pg = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.max(1, Math.min(1000, parseInt(limit, 10) || 100));

    const tasks = await Task.find(taskQuery)
      .sort({ createdAt: -1 })
      .skip((pg - 1) * lim)
      .limit(lim)
      .populate("user", "fullname username email faculty department level sex");

    // Also return meta paging info
    const total = await Task.countDocuments(taskQuery);

    res.json({
      meta: { page: pg, limit: lim, total, pages: Math.ceil(total / lim) },
      tasks
    });
  } catch (e) {
    console.error("GET /api/tasks error:", e);
    res.status(500).json({ error: e.message });
  }
});

// GET: All tasks for a user (optionally filter by status, activityType)
router.get("/user/:id", authenticate, async (req, res) => {
  try {
    // Only allow access to self or admin
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { status, activityType } = req.query;
    const query = { user: req.params.id };
    if (status) query.status = status;
    if (activityType) query.activityType = activityType;

    // Most recent first
    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST: Create Task (user: from JWT or passed field)
router.post("/", authenticate, async (req, res) => {
  try {
    // Only admins can create for others; normal user: only for self
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

// PATCH: Update a task (status, progress, etc.)
router.patch("/:taskId", authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Only owner or admin
    if (task.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    Object.assign(task, req.body);
    // If marking done
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
