import express from "express";
import Task from "../models/Task.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

// GET: All tasks for a user (optionally filter by status, activityType)
router.get("/user/:id", authenticate, async (req, res) => {
  try {
    // Only allow access to self or admin; (for now, self)
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
