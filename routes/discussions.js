// File: routes/ (NEW)
import express from "express";
import Discussion from "../models/Discussion.js";
import Reply from "../models/Reply.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/discussions
 * Get all discussions (paginated)
 * ?category=&page=1&limit=20&sort=newest
 */
router.get("/", async (req, res) => {
  try {
    const { category, page = 1, limit = 20, sort = "newest" } = req.query;
    
    let query = {};
    if (category) query.category = category;
    
    let sortOption = { createdAt: -1 };
    if (sort === "trending") sortOption = { likeCount: -1, replyCount: -1 };
    if (sort === "unanswered") query.replyCount = 0;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const discussions = await Discussion.find(query)
      .populate("author", "fullname username profilePicture")
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Discussion.countDocuments(query);
    
    res.json({
      discussions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/discussions
 * Create a new discussion
 * { title, description, category?, tags?, content? }
 */
router.post("/", async (req, res) => {
  try {
    const { title, description, category = "general", tags = [], content = "" } = req.body;
    
    if (!title || !description) 
      return res.status(400).json({ error: "Title and description required" });
    
    const discussion = await Discussion.create({
      title,
      description,
      content,
      category,
      tags,
      author: req.user.id
    });
    
    await discussion.populate("author", "fullname username profilePicture");
    
    res.status(201).json({ success: true, discussion });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/discussions/:id
 * Get a single discussion with replies
 */
router.get("/:id", async (req, res) => {
  try {
    const discussion = await Discussion.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate("author", "fullname username profilePicture")
      .populate({
        path: "replies",
        populate: { path: "author", select: "fullname username profilePicture" }
      });
    
    if (!discussion) 
      return res.status(404).json({ error: "Discussion not found" });
    
    res.json(discussion);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/discussions/:id/reply
 * Reply to a discussion
 * { content }
 */
router.post("/:id/reply", async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) return res.status(400).json({ error: "Reply content required" });
    
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ error: "Discussion not found" });
    
    const reply = await Reply.create({
      discussion: req.params.id,
      author: req.user.id,
      content
    });
    
    discussion.replies.push(reply._id);
    discussion.replyCount = discussion.replies.length;
    await discussion.save();
    
    await reply.populate("author", "fullname username profilePicture");
    
    res.status(201).json({ success: true, reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/discussions/:id/like
 * Like a discussion
 */
router.post("/:id/like", async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ error: "Discussion not found" });
    
    const userIndex = discussion.likes.findIndex(l => l.toString() === req.user.id);
    
    if (userIndex > -1) {
      discussion.likes.splice(userIndex, 1);
    } else {
      discussion.likes.push(req.user.id);
    }
    
    discussion.likeCount = discussion.likes.length;
    await discussion.save();
    
    res.json({ success: true, likeCount: discussion.likeCount, liked: userIndex === -1 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/discussions/reply/:replyId/like
 * Like a reply
 */
router.post("/reply/:replyId/like", async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.replyId);
    if (!reply) return res.status(404).json({ error: "Reply not found" });
    
    const userIndex = reply.likes.findIndex(l => l.toString() === req.user.id);
    
    if (userIndex > -1) {
      reply.likes.splice(userIndex, 1);
    } else {
      reply.likes.push(req.user.id);
    }
    
    reply.likeCount = reply.likes.length;
    await reply.save();
    
    res.json({ success: true, likeCount: reply.likeCount, liked: userIndex === -1 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
