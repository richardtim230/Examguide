import express from "express";
import mongoose from "mongoose";
import Schedule from "../models/Schedule.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

// Create a new test schedule
router.post("/", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  const { examSet, faculty, department, start, end } = req.body;
  try {
    const sched = await Schedule.create({
      examSet, // should be ObjectId of QuestionSet
      faculty,
      department,
      start: new Date(start),
      end: new Date(end),
      createdBy: req.user.id
    });
    res.status(201).json(sched);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// List all schedules for the authenticated user's faculty and department
// Only return schedules for future or current tests, and only if examSet is ACTIVE
router.get("/", authenticate, async (req, res) => {
  try {
    // User's faculty and department may be string or ObjectId, normalize to ObjectId
    let { faculty, department } = req.user;
    if (typeof faculty === "string") faculty = mongoose.Types.ObjectId(faculty);
    if (typeof department === "string") department = mongoose.Types.ObjectId(department);

    // Find schedules for this faculty/department, starting now or later
    let schedules = await Schedule.find({
      faculty,
      department,
      start: { $gte: new Date() }
    })
      .sort({ start: 1 })
      .populate({
        path: "examSet",
        select: "title status questions faculty department"
      });

    // Filter out schedules whose examSet is missing or not ACTIVE
    schedules = schedules.filter(
      sch => sch.examSet && sch.examSet.status === "ACTIVE"
    );

    res.json(schedules);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
