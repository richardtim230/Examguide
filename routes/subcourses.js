import express from "express";
import mongoose from "mongoose";
import Subcourse from "../models/Subcourse.js";
import Course from "../models/Course.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

function escapeRegex(text = "") {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, q, level, parentCourse, published, sort } = req.query;
    const pg = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.max(1, Math.min(1000, parseInt(limit, 10) || 20));
    const filter = {};

    if (parentCourse && mongoose.Types.ObjectId.isValid(parentCourse)) filter.parentCourse = parentCourse;
    if (typeof published !== "undefined") {
      if (published === "true" || published === "false") filter.published = published === "true";
    }
    if (level) filter.level = level;
    if (q && q.trim()) {
      const reg = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [{ title: reg }, { description: reg }, { tags: reg }];
    }

    const sortOption = {};
    if (sort) {
      const [field, dir] = String(sort).split(":");
      if (field) sortOption[field] = parseInt(dir, 10) || -1;
    } else {
      sortOption.createdAt = -1;
    }

    const [subcourses, total] = await Promise.all([
      Subcourse.find(filter)
        .sort(sortOption)
        .skip((pg - 1) * lim)
        .limit(lim)
        .populate("parentCourse", "title level")
        .lean(),
      Subcourse.countDocuments(filter)
    ]);

    res.json({ meta: { page: pg, limit: lim, total, pages: Math.ceil(total / lim) }, subcourses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const allowed = ["admin", "publisher", "superadmin"];
    if (!allowed.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });

    const { title, code, description, level, parentCourse, imageUrl, resources, tags, meta } = req.body;
    if (!parentCourse || !mongoose.Types.ObjectId.isValid(parentCourse)) {
      return res.status(400).json({ error: "Valid parentCourse id required" });
    }

    const courseExists = await Course.findById(parentCourse).select("_id");
    if (!courseExists) return res.status(404).json({ error: "Parent course not found" });

    const payload = {
      title,
      code,
      description,
      level,
      parentCourse,
      imageUrl: imageUrl || "",
      resources: Number(resources) || 0,
      tags: Array.isArray(tags) ? tags : [],
      meta: meta || {},
      createdBy: req.user.id
    };

    const sub = await Subcourse.create(payload);
    await Course.findByIdAndUpdate(parentCourse, { $inc: { subcoursesCount: 1 } }).exec();
    res.status(201).json(sub);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });

    const sub = await Subcourse.findById(id).populate("parentCourse", "title level").populate("createdBy", "fullname username email").lean();
    if (!sub) return res.status(404).json({ error: "Subcourse not found" });
    res.json(sub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });

    const sub = await Subcourse.findById(id);
    if (!sub) return res.status(404).json({ error: "Subcourse not found" });

    const isAdmin = ["admin", "superadmin"].includes(req.user.role);
    const isCreator = String(sub.createdBy) === String(req.user.id);
    if (!isAdmin && !isCreator) return res.status(403).json({ message: "Forbidden" });

    const oldParent = String(sub.parentCourse);
    const updates = req.body;

    Object.keys(updates).forEach(k => {
      sub[k] = updates[k];
    });

    await sub.save();

    if (updates.parentCourse && mongoose.Types.ObjectId.isValid(updates.parentCourse) && String(updates.parentCourse) !== oldParent) {
      await Course.findByIdAndUpdate(oldParent, { $inc: { subcoursesCount: -1 } }).exec();
      await Course.findByIdAndUpdate(updates.parentCourse, { $inc: { subcoursesCount: 1 } }).exec();
    }

    res.json(sub);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });

    const sub = await Subcourse.findById(id);
    if (!sub) return res.status(404).json({ error: "Subcourse not found" });

    const isAdmin = ["admin", "superadmin"].includes(req.user.role);
    const isCreator = String(sub.createdBy) === String(req.user.id);
    if (!isAdmin && !isCreator) return res.status(403).json({ message: "Forbidden" });

    const oldParent = String(sub.parentCourse);
    Object.assign(sub, req.body);
    await sub.save();

    if (req.body.parentCourse && mongoose.Types.ObjectId.isValid(req.body.parentCourse) && String(req.body.parentCourse) !== oldParent) {
      await Course.findByIdAndUpdate(oldParent, { $inc: { subcoursesCount: -1 } }).exec();
      await Course.findByIdAndUpdate(req.body.parentCourse, { $inc: { subcoursesCount: 1 } }).exec();
    }

    res.json(sub);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid id" });

    const sub = await Subcourse.findById(id);
    if (!sub) return res.status(404).json({ error: "Subcourse not found" });

    const isAdmin = ["admin", "superadmin"].includes(req.user.role);
    const isCreator = String(sub.createdBy) === String(req.user.id);
    if (!isAdmin && !isCreator) return res.status(403).json({ message: "Forbidden" });

    const parentId = sub.parentCourse;
    await sub.remove();
    if (parentId && mongoose.Types.ObjectId.isValid(parentId)) {
      await Course.findByIdAndUpdate(parentId, { $inc: { subcoursesCount: -1 } }).exec();
    }

    res.json({ message: "Subcourse deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
