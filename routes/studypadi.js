import express from "express";
import StudyPadiGoal from "../models/StudyPadiGoal.js";
import StudyPadiSession from "../models/StudyPadiSession.js";
import StudyPadiTimeline from "../models/StudyPadiTimeline.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GOALS
 */

// GET /api/studypadi/goals
// Returns goals belonging to the authenticated user
router.get("/goals", async (req, res) => {
  try {
    const list = await StudyPadiGoal.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/studypadi/goals
// Create a new goal
router.post("/goals", async (req, res) => {
  try {
    const { title, course, description, due, durationMin } = req.body;
    if (!title) return res.status(400).json({ error: "title required" });
    const goal = await StudyPadiGoal.create({
      title: title.trim(),
      course: course || "General",
      description: description || "",
      due: due || null,
      durationMin: durationMin || null,
      createdBy: req.user.id
    });
    await StudyPadiTimeline.create({ type: "goal", title: "Added goal", msg: goal.title, user: req.user.id, time: Date.now() });
    res.status(201).json(goal);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/studypadi/goals/:id
// Update a goal (owner only)
router.put("/goals/:id", async (req, res) => {
  try {
    const goal = await StudyPadiGoal.findById(req.params.id);
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    if (goal.createdBy.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "superadmin")
      return res.status(403).json({ error: "Forbidden" });

    const allowed = ["title","course","description","due","durationMin","completed"];
    allowed.forEach(k => {
      if (req.body[k] !== undefined) goal[k] = req.body[k];
    });
    await goal.save();
    await StudyPadiTimeline.create({ type: "goal", title: "Updated goal", msg: goal.title, user: req.user.id, time: Date.now() });
    res.json(goal);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/studypadi/goals/:id
// Delete a goal (owner or admin)
router.delete("/goals/:id", async (req, res) => {
  try {
    const goal = await StudyPadiGoal.findById(req.params.id);
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    if (goal.createdBy.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "superadmin")
      return res.status(403).json({ error: "Forbidden" });
    await StudyPadiGoal.deleteOne({ _id: goal._id });
    // Optionally remove sessions tied to this goal
    await StudyPadiSession.deleteMany({ goalId: goal._id });
    await StudyPadiTimeline.create({ type: "goal", title: "Deleted goal", msg: goal.title, user: req.user.id, time: Date.now() });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * SESSIONS
 */

// GET /api/studypadi/sessions
// Returns sessions created by the user OR sessions the user participates in
router.get("/sessions", async (req, res) => {
  try {
    const list = await StudyPadiSession.find({
      $or: [
        { createdBy: req.user.id },
        { participants: req.user.id }
      ]
    }).sort({ start: 1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/studypadi/sessions
// Create a new session (scheduled or immediate)
// body: { goalId, start, durationMin }
router.post("/sessions", async (req, res) => {
  try {
    const { goalId, start, durationMin } = req.body;
    if (!start) return res.status(400).json({ error: "start datetime required" });
    const s = await StudyPadiSession.create({
      goalId: goalId || null,
      createdBy: req.user.id,
      start: new Date(start),
      durationMin: durationMin || 30,
      status: "scheduled",
      participants: []
    });
    await StudyPadiTimeline.create({ type: "session", title: "Scheduled session", msg: `${s.durationMin} mins`, user: req.user.id, time: Date.now() });
    res.status(201).json(s);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/studypadi/sessions/:id
// Actions: { action: 'join'|'end'|'cancel' }
router.patch("/sessions/:id", async (req, res) => {
  try {
    const { action } = req.body;
    const session = await StudyPadiSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (action === "join") {
      // add participant if not present
      if (!session.participants.map(String).includes(req.user.id)) {
        session.participants.push(req.user.id);
      }
      // mark start
      if (!session.startedAt) session.startedAt = Date.now();
      session.status = "in-progress";
      await session.save();
      await StudyPadiTimeline.create({ type: "session", title: "Joined session", msg: `User joined session`, user: req.user.id, time: Date.now() });
      return res.json(session);
    }

    if (action === "end") {
      // Only allow creator or participant to end
      if (session.createdBy.toString() !== req.user.id && !session.participants.map(String).includes(req.user.id) && req.user.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      session.endedAt = session.endedAt || Date.now();
      // compute durationMin from startedAt if possible
      if (session.startedAt) {
        const minutes = Math.max(1, Math.round((new Date(session.endedAt) - new Date(session.startedAt)) / 60000));
        session.durationMin = minutes;
      }
      session.status = "done";
      await session.save();
      await StudyPadiTimeline.create({ type: "session", title: "Completed session", msg: `Session ended`, user: req.user.id, time: Date.now() });
      return res.json(session);
    }

    if (action === "cancel") {
      // Allow creator or admin to cancel
      if (session.createdBy.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "superadmin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      session.status = "cancelled";
      session.endedAt = session.endedAt || Date.now();
      await session.save();
      await StudyPadiTimeline.create({ type: "session", title: "Cancelled session", msg: `Session cancelled`, user: req.user.id, time: Date.now() });
      return res.json(session);
    }

    // Allow partial update (e.g., modify start/duration) - owner or admin
    if (session.createdBy.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const allowed = ["start","durationMin","status"];
    allowed.forEach(k => {
      if (req.body[k] !== undefined) session[k] = req.body[k];
    });
    await session.save();
    res.json(session);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * TIMELINE
 */

// GET /api/studypadi/timeline
router.get("/timeline", async (req, res) => {
  try {
    // return timeline entries relevant to user (all entries are returned here; you can filter by user if desired)
    const list = await StudyPadiTimeline.find({ $or: [{ user: null }, { user: req.user.id }] }).sort({ time: -1 }).limit(200);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/studypadi/timeline
router.post("/timeline", async (req, res) => {
  try {
    const { type, title, msg } = req.body;
    if (!title) return res.status(400).json({ error: "title required" });
    const entry = await StudyPadiTimeline.create({
      type: type || "other",
      title,
      msg: msg || "",
      user: req.user.id,
      time: Date.now()
    });
    res.status(201).json(entry);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
