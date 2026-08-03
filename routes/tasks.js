import express from "express";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { awardTaskPoints } from "../utils/awardTaskPoints.js";
import { authenticate } from "../middleware/authenticate.js";
import Post from "../models/Post.js";
import Resources from "../models/Resources.js";
import ExamSet from "../models/ExamSet.js";
import CbtQuestion from "../models/CbtQuestion.js";
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


    router.get("/user/:id", authenticate, async (req, res) => {
    try {
        if (req.user.id !== req.params.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }

        const user = await User.findById(req.params.id).lean();
        if (!user) return res.status(404).json({ message: "User not found" });

        const { status, activityType } = req.query;
        const manualTasks = await Task.find({
            user: user._id,
            ...(status && { status }),
            ...(activityType && { activityType })
        }).lean();

        const generatedTasks = [];
        const completedArticles = new Set((user.completedArticles || []).map(String));
        const completedRewards = new Set([
            ...(user.rewardHistory?.reading || []).map(r => r.postId || r.key),
            ...(user.rewardHistory?.practiced || []).map(r => r.key),
            ...(user.rewardHistory?.bonus || []).map(r => r.key)
        ]);

        const today = new Date().toISOString().split("T")[0];
        const todayTask = (user.dailyTasks || []).find(d => d.date === today);
        const completedToday = new Set(todayTask?.done || []);

        const profileFields = [user.fullname, user.username, user.email, user.profilePic, user.faculty, user.department, user.level, user.bio];
        const profilePercent = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

        if (!completedToday.has("daily_login")) {
            generatedTasks.push({
                _id: "daily_login",
                title: "Daily Login",
                description: "Open the app today.",
                activityType: "login",
                status: "active",
                points: 5,
                priority: 1,
                createdAt: new Date(),
                meta: { icon: "login", key: "daily_login" }
            });
        }

        if (profilePercent < 100 && !completedRewards.has("profile_complete")) {
            generatedTasks.push({
                _id: "profile_complete",
                title: "Complete your profile",
                description: `Your profile is ${profilePercent}% complete.`,
                activityType: "profile",
                status: "active",
                points: 30,
                priority: 2,
                createdAt: new Date(),
                meta: { progress: profilePercent, key: "profile_complete" }
            });
        }

        if ((user.totalReferrals || 0) < 1) {
            generatedTasks.push({
                _id: "refer_friend",
                title: "Invite your first friend",
                description: "Refer a friend and earn bonus points.",
                activityType: "referral",
                status: "active",
                points: 50,
                priority: 3,
                createdAt: new Date(),
                meta: { referralCode: user.referralCode, key: "refer_friend" }
            });
        }

        const posts = await Post.find({ status: "Published", rewardEnabled: true })
            .sort({ createdAt: -1 })
            .limit(20)
            .select("title content category imageUrl rewardPoints minimumReadTime createdAt")
            .lean();

        for (const post of posts) {
            if (completedArticles.has(String(post._id)) || completedRewards.has(`article:${post._id}`)) continue;

            let points = post.rewardPoints || 20;
            if (post.category === "Academics") points = Math.max(points, 30);
            if (post.category === "Opportunities") points = Math.max(points, 25);
            if (post.category === "Scholarships") points = Math.max(points, 35);
            if (post.category === "Tips & Hacks") points = Math.max(points, 20);

            generatedTasks.push({
                _id: `article_${post._id}`,
                title: `Read: ${post.title}`,
                description: (post.content || "").replace(/<[^>]+>/g, "").substring(0, 180),
                activityType: "article",
                status: "active",
                points,
                priority: 5,
                createdAt: post.createdAt,
                image: post.imageUrl,
                meta: {
                    key: `article:${post._id}`,
                    postId: post._id,
                    readTime: post.minimumReadTime || 60,
                    url: `/campus-news-update?id=${post._id}`
                }
            });
        }

        const resources = await Resources.find({
            published: true,
            $or: [
                { visibility: "public" },
                { visibility: "campus", institution: user.institution },
                { visibility: "department", faculty: user.faculty, department: user.department }
            ]
        }).sort({ createdAt: -1 }).limit(20).lean();

        for (const resource of resources) {
            if (completedRewards.has(`resource:${resource._id}`)) continue;

            let score = 25;
            if (resource.level && resource.level === user.level) score += 10;

            generatedTasks.push({
                _id: `resource_${resource._id}`,
                title: `Study ${resource.title}`,
                description: resource.description || resource.subtitle || "",
                activityType: "resource",
                status: "active",
                points: score,
                priority: 6,
                createdAt: resource.createdAt,
                image: resource.cover?.url,
                meta: {
                    key: `resource:${resource._id}`,
                    resourceId: resource._id,
                    resourceType: resource.resourceType,
                    faculty: resource.faculty,
                    department: resource.department,
                    level: resource.level
                }
            });
        }

        const examSets = await ExamSet.find({ examType: "cbt" })
            .sort({ createdAt: -1 })
            .limit(15)
            .lean();

        for (const exam of examSets) {
            if (completedRewards.has(`quiz:${exam._id}`)) continue;

            const totalQuestions = await CbtQuestion.countDocuments({ examSet: exam._id });
            if (!totalQuestions) continue;

            generatedTasks.push({
                _id: `quiz_${exam._id}`,
                title: `Practice ${exam.subject}`,
                description: exam.title,
                activityType: "quiz",
                status: "active",
                points: Math.min(100, totalQuestions),
                priority: 7,
                createdAt: exam.createdAt,
                meta: {
                    key: `quiz:${exam._id}`,
                    examSetId: exam._id,
                    subject: exam.subject,
                    questions: totalQuestions,
                    duration: exam.duration
                }
            });
        }

        const manualIds = new Set();
        for (const task of manualTasks) {
            manualIds.add(String(task._id));
            if (task.meta?.key) manualIds.add(task.meta.key);
            if (task.status === "done") completedRewards.add(task.meta?.key || String(task._id));
        }

        const merged = [...manualTasks];
        for (const task of generatedTasks) {
            if (task.meta?.key && completedRewards.has(task.meta.key)) continue;

            const exists = merged.some(existing => {
                if (existing.meta?.key && task.meta?.key) return existing.meta.key === task.meta.key;
                return existing.activityType === task.activityType && existing.title === task.title;
            });

            if (!exists) merged.push(task);
        }

        merged.sort((a, b) => {
            const pa = a.priority || 999;
            const pb = b.priority || 999;
            if (pa !== pb) return pa - pb;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });



const filtered = merged.filter(task => {
    if (status && task.status !== status) return false;
    if (activityType && task.activityType !== activityType) return false;
    return true;
});

// Return today's saved task list if it already exists
if (
    user.dailyTaskPool &&
    user.dailyTaskPool.date === today &&
    Array.isArray(user.dailyTaskPool.taskIds)
) {
    const todaysTasks = user.dailyTaskPool.taskIds
        .map(id => filtered.find(task => String(task._id) === String(id)))
        .filter(Boolean);

    return res.json(todaysTasks);
}

// First request today: create today's task list
const todaysTasks = filtered.slice(0, 10);

// Save it
await User.findByIdAndUpdate(user._id, {
    dailyTaskPool: {
        date: today,
        taskIds: todaysTasks.map(task => String(task._id))
    }
});

return res.json(todaysTasks);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
// PATCH: Update a task (status, progress, etc.)
router.patch("/:taskId", authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (
      task.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const wasCompleted = task.status === "done";

    Object.assign(task, req.body);

    if (req.body.status === "done" && !task.completedAt) {
      task.completedAt = new Date();
    }

    await task.save();

    // Award points only once
    if (!wasCompleted && task.status === "done") {
      const user = await User.findById(task.user);

      if (user) {
        await awardTaskPoints(user, task.points || 0, {
  key: `task:${task._id}`,
  type: 'task',
  reason: task.title || 'Task completed',
  by: String(req.user.id)
});
      }
    }

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
