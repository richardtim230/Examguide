import express from "express";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import Subcourse from "../models/Subcourse.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

function escapeRegex(text = "") {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.get("/public", async (req, res) => {
  try {
    const { page = 1, limit = 20, q, level, faculty, department, visibility, sort } = req.query;
    const pg = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.max(1, Math.min(1000, parseInt(limit, 10) || 20));
    const filter = { published: true };

    if (visibility) filter.visibility = visibility;
    if (level) filter.level = level;
    if (faculty) filter.faculty = faculty;
    if (department) filter.department = department;

    if (q && q.trim()) {
      const escaped = escapeRegex(q.trim());
      const reg = new RegExp(escaped, "i");
      filter.$or = [{ title: reg }, { description: reg }, { tags: reg }];
    }

    const sortOption = {};
    if (sort) {
      const [field, dir] = String(sort).split(":");
      if (field) sortOption[field] = parseInt(dir, 10) || -1;
    } else {
      sortOption.createdAt = -1;
    }

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .sort(sortOption)
        .skip((pg - 1) * lim)
        .limit(lim)
        .select("title slug description level faculty department booksCount imageUrl cover rewardPoints minimumReadTime tags createdAt subcoursesCount")
        .lean(),
      Course.countDocuments(filter)
    ]);

    res.json({ meta: { page: pg, limit: lim, total, pages: Math.ceil(total / lim) }, courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, q, level, faculty, department, published, visibility, sort } = req.query;
    const pg = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.max(1, Math.min(1000, parseInt(limit, 10) || 20));
    const filter = {};

    if (typeof published !== "undefined") {
      if (published === "true" || published === "false") filter.published = published === "true";
    }
    if (visibility) filter.visibility = visibility;
    if (level) filter.level = level;
    if (faculty) filter.faculty = faculty;
    if (department) filter.department = department;

    if (q && q.trim()) {
      const escaped = escapeRegex(q.trim());
      const reg = new RegExp(escaped, "i");
      filter.$or = [{ title: reg }, { description: reg }, { tags: reg }];
    }

    const sortOption = {};
    if (sort) {
      const [field, dir] = String(sort).split(":");
      if (field) sortOption[field] = parseInt(dir, 10) || -1;
    } else {
      sortOption.createdAt = -1;
    }

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .sort(sortOption)
        .skip((pg - 1) * lim)
        .limit(lim)
        .populate("createdBy", "fullname username email")
        .lean(),
      Course.countDocuments(filter)
    ]);

    res.json({ meta: { page: pg, limit: lim, total, pages: Math.ceil(total / lim) }, courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const allowed = ["admin", "publisher", "superadmin"];
    if (!allowed.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });

    const payload = { ...req.body };
    payload.createdBy = req.user.id;

    const course = await Course.create(payload);
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/:id/subcourses", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });

    const { page = 1, limit = 50, q, level, published, sort } = req.query;
    const pg = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.max(1, Math.min(1000, parseInt(limit, 10) || 50));
    const filter = { parentCourse: id };

    if (typeof published !== "undefined") {
      if (published === "true" || published === "false") filter.published = published === "true";
    }
    if (level) filter.level = level;
    if (q && q.trim()) {
      const escaped = escapeRegex(q.trim());
      const reg = new RegExp(escaped, "i");
      filter.$or = [{ title: reg }, { description: reg }, { tags: reg }];
    }

    const sortOption = {};
    if (sort) {
      const [field, dir] = String(sort).split(":");
      if (field) sortOption[field] = parseInt(dir, 10) || -1;
    } else {
      sortOption.createdAt = -1;
    }

    const [subs, total] = await Promise.all([
      Subcourse.find(filter).sort(sortOption).skip((pg - 1) * lim).limit(lim).lean(),
      Subcourse.countDocuments(filter)
    ]);

    res.json({ meta: { page: pg, limit: lim, total, pages: Math.ceil(total / lim) }, subcourses: subs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });

    const course = await Course.findById(id).populate("createdBy", "fullname username email").lean();
    if (!course) return res.status(404).json({ error: "Course not found" });

    const subcourses = await Subcourse.find({ parentCourse: course._id }).sort({ createdAt: -1 }).limit(100).lean();
    course.subcourses = subcourses;
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const isAdmin = ["admin", "superadmin"].includes(req.user.role);
    const isCreator = String(course.createdBy) === String(req.user.id);
    if (!isAdmin && !isCreator) return res.status(403).json({ message: "Forbidden" });

    Object.keys(req.body).forEach(k => {
      course[k] = req.body[k];
    });

    await course.save();
    res.json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const isAdmin = ["admin", "superadmin"].includes(req.user.role);
    const isCreator = String(course.createdBy) === String(req.user.id);
    if (!isAdmin && !isCreator) return res.status(403).json({ message: "Forbidden" });

    Object.assign(course, req.body);
    await course.save();
    res.json(course);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const isAdmin = ["admin", "superadmin"].includes(req.user.role);
    const isCreator = String(course.createdBy) === String(req.user.id);
    if (!isAdmin && !isCreator) return res.status(403).json({ message: "Forbidden" });

    await Subcourse.deleteMany({ parentCourse: course._id }).exec();
    await course.remove();
    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
