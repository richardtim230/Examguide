import express from "express";
import Schedule from "../models/Schedule.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

// Create a new test schedule (support many departments and levels)
router.post("/", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const { examSet, faculty, departments, levels, start, end } = req.body;
  try {
    const sched = await Schedule.create({
      examSet,
      faculty,
      departments,
      levels, // <-- NEW
      start: new Date(start),
      end: new Date(end),
      createdBy: req.user.id
    });
    res.status(201).json(sched);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
router.get("/", authenticate, async (req, res) => {
  const filter = {};
  if (req.query.faculty) filter.faculty = req.query.faculty;
  if (req.query.department) filter.departments = { $in: [req.query.department] };
  if (req.query.level) filter.levels = { $in: [req.query.level] };
  try {
    const schedules = await Schedule.find(filter)
      .sort({ start: -1 })
      .populate({
        path: "examSet",
        select: "title status questions faculty department schedule"
      });
    res.json(schedules);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get and update endpoints should also include `levels`

router.get("/:id", authenticate, async (req, res) => {
  try {
    const sched = await Schedule.findById(req.params.id)
      .populate({
        path: "examSet",
        select: "title status questions faculty department schedule"
      });
    if (!sched) return res.status(404).json({ error: "Schedule not found" });
    res.json(sched);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/:id", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const { examSet, faculty, departments, levels, start, end } = req.body;
  try {
    const sched = await Schedule.findById(req.params.id);
    if (!sched) return res.status(404).json({ error: "Schedule not found" });
    if (examSet !== undefined) sched.examSet = examSet;
    if (faculty !== undefined) sched.faculty = faculty;
    if (departments !== undefined) sched.departments = departments;
    if (levels !== undefined) sched.levels = levels; // <-- NEW
    if (start !== undefined) sched.start = new Date(start);
    if (end !== undefined) sched.end = new Date(end);
    await sched.save();
    res.json(sched);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


// Delete a schedule by id
router.delete("/:id", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const sched = await Schedule.findByIdAndDelete(req.params.id);
    if (!sched) return res.status(404).json({ error: "Schedule not found" });
    res.json({ message: "Schedule deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
