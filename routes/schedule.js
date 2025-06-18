import express from "express";
import Schedule from "../models/Schedule.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

// Create a new test schedule
router.post("/", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const { examSet, faculty, department, start, end } = req.body;
  try {
    const sched = await Schedule.create({
      examSet, faculty, department,
      start: new Date(start),
      end: new Date(end),
      createdBy: req.user.id
    });
    res.status(201).json(sched);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// List all schedules (optionally filter by faculty/department)
router.get("/", authenticate, async (req, res) => {
  const filter = {};
  if (req.query.faculty) filter.faculty = req.query.faculty;
  if (req.query.department) filter.department = req.query.department;
  const schedules = await Schedule.find(filter).sort({ start: -1 });
  res.json(schedules);
});

export default router;
