// routes/discussions.js
import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import cloudinary from "cloudinary";
import streamifier from "streamifier";
import Discussion from "../models/Discussion.js";
import Reply from "../models/Reply.js";
import User from "../models/User.js";
import Group from "../models/GroupChat.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

// ---- Multer memory storage for in-memory uploads (used with Cloudinary stream) ----
const memoryStorage = multer.memoryStorage();
const uploadToMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

// Helper to upload a Buffer to Cloudinary via upload_stream
function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

router.get("/", async (req, res) => {
  try {
    const { category, page = 1, limit = 20, sort = "newest" } = req.query;

    let query = {};
    if (category) query.category = category;

    let sortOption = { createdAt: -1 };
    if (sort === "trending") sortOption = { likeCount: -1, replyCount: -1, views: -1 };
    if (sort === "unanswered") query.replyCount = 0;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const discussions = await Discussion.find(query)
      .populate("author", "fullname username profilePicture")
      .populate("group", "name slug coverImage") // optional group info
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Discussion.countDocuments(query);

    // Calculate whether current user bookmarked or liked each discussion
    const userIdStr = req.user.id;
    const discussionsForClient = discussions.map((d) => {
      const liked = d.likes.some((u) => u.toString() === userIdStr);
      const bookmarked = (d.bookmarks || []).some((u) => u.toString() === userIdStr);
      return {
        ...d.toObject(),
        liked,
        bookmarked,
      };
    });

    res.json({
      discussions: discussionsForClient,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.use(authenticate);

router.post("/", async (req, res) => {
  try {
    const { title, description, category = "general", tags = [], content = "", groupId } = req.body;

    if (!title || !description)
      return res.status(400).json({ error: "Title and description required" });

    const discussion = await Discussion.create({
      title,
      description,
      content,
      category,
      tags,
      author: req.user.id,
      group: groupId || null,
    });

    await discussion.populate("author", "fullname username profilePicture");
    if (discussion.group) await discussion.populate("group", "name slug coverImage");

    res.status(201).json({ success: true, discussion });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/discussions/:id
 * Get a single discussion with replies (replies paginated)
 * Query: replyPage, replyLimit, replySort (newest/mostLiked)
 */
router.get("/:id", async (req, res) => {
  try {
    const {
      replyPage = 1,
      replyLimit = 10,
      replySort = "newest", // newest | mostLiked
    } = req.query;

    const discussion = await Discussion.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true })
      .populate("author", "fullname username profilePicture")
      .populate("group", "name slug coverImage membersCount");

    if (!discussion) return res.status(404).json({ error: "Discussion not found" });

    // Fetch replies separately (paginated + sorted)
    const replySortOption = replySort === "mostLiked" ? { likeCount: -1, createdAt: -1 } : { createdAt: -1 };
    const skip = (parseInt(replyPage) - 1) * parseInt(replyLimit);

    const replies = await Reply.find({ discussion: req.params.id })
      .populate("author", "fullname username profilePicture")
      .sort(replySortOption)
      .skip(skip)
      .limit(parseInt(replyLimit));

    const totalReplies = await Reply.countDocuments({ discussion: req.params.id });

    // compute per-reply flags: isOP, likedByCurrentUser
    const userIdStr = req.user.id;
    const repliesForClient = replies.map((r) => {
      const isOP = r.author && discussion.author && r.author._id.toString() === discussion.author._id.toString();
      const liked = r.likes.some((u) => u.toString() === userIdStr);
      return {
        ...r.toObject(),
        isOP,
        liked,
      };
    });

    // whether current user liked/bookmarked the discussion
    const liked = discussion.likes.some((u) => u.toString() === userIdStr);
    const bookmarked = (discussion.bookmarks || []).some((u) => u.toString() === userIdStr);

    // Optionally include group member count (from populated group or cached field)
    let groupInfo = null;
    if (discussion.group) {
      groupInfo = discussion.group;
    }

    res.json({
      discussion,
      group: groupInfo,
      replies: repliesForClient,
      repliesPagination: {
        page: parseInt(replyPage),
        limit: parseInt(replyLimit),
        total: totalReplies,
        pages: Math.ceil(totalReplies / parseInt(replyLimit)),
      },
      flags: {
        liked,
        bookmarked,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/discussions/:id/reply
 * Reply to a discussion. Accepts attachments (images/GIF) via multipart/form-data
 * fields:
 * - content (text)
 * - attachments[] (files) (optional)
 *
 * This version uploads files directly to Cloudinary (streaming from memory).
 */
router.post("/:id/reply", uploadToMemory.array("attachments", 5), async (req, res) => {
  try {
    const { content = "" } = req.body;

    if (!content && (!req.files || req.files.length === 0))
      return res.status(400).json({ error: "Reply content or attachment required" });

    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ error: "Discussion not found" });

    // If there are files, upload each to Cloudinary
    let attachments = [];
    if (req.files && req.files.length > 0) {
      // Map each file to a Cloudinary upload promise
      const uploadPromises = req.files.map((file) =>
        uploadBufferToCloudinary(file.buffer, {
          folder: "editor-uploads", // change as you prefer
          resource_type: "image",
        }).then((result) => {
          const mimetype = file.mimetype || "";
          const type = mimetype.startsWith("image/") ? "image" : mimetype.startsWith("video/") ? "video" : "file";
          return { url: result.secure_url, type, filename: file.originalname };
        })
      );

      // Wait for all uploads to finish (or fail)
      const uploaded = await Promise.all(uploadPromises);
      attachments = uploaded;
    }

    const reply = await Reply.create({
      discussion: req.params.id,
      author: req.user.id,
      content,
      attachments,
    });

    discussion.replies.push(reply._id);
    discussion.replyCount = discussion.replies.length;
    await discussion.save();

    await reply.populate("author", "fullname username profilePicture");

    // return reply with isOP/liked flags
    const isOP = reply.author && discussion.author && reply.author._id.toString() === discussion.author.toString();
    const liked = (reply.likes || []).some((u) => u.toString() === req.user.id);

    res.status(201).json({ success: true, reply: { ...reply.toObject(), isOP, liked } });
  } catch (e) {
    console.error("Reply creation/upload error:", e);
    res.status(500).json({ error: e.message || "Upload or reply creation failed" });
  }
});

/**
 * POST /api/discussions/:id/like
 * Like a discussion (toggle)
 */
router.post("/:id/like", async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ error: "Discussion not found" });

    const userIndex = discussion.likes.findIndex((l) => l.toString() === req.user.id);

    let likedNow = false;
    if (userIndex > -1) {
      discussion.likes.splice(userIndex, 1);
      likedNow = false;
    } else {
      discussion.likes.push(req.user.id);
      likedNow = true;
    }

    discussion.likeCount = discussion.likes.length;
    await discussion.save();

    res.json({ success: true, likeCount: discussion.likeCount, liked: likedNow });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/discussions/reply/:replyId/like
 * Like a reply (toggle)
 */
router.post("/reply/:replyId/like", async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.replyId);
    if (!reply) return res.status(404).json({ error: "Reply not found" });

    const userIndex = reply.likes.findIndex((l) => l.toString() === req.user.id);

    let likedNow = false;
    if (userIndex > -1) {
      reply.likes.splice(userIndex, 1);
      likedNow = false;
    } else {
      reply.likes.push(req.user.id);
      likedNow = true;
    }

    reply.likeCount = reply.likes.length;
    await reply.save();

    res.json({ success: true, likeCount: reply.likeCount, liked: likedNow });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/discussions/:id/bookmark
 * Toggle bookmark for the current user
 */
router.post("/:id/bookmark", async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ error: "Discussion not found" });

    const userIndex = (discussion.bookmarks || []).findIndex((b) => b.toString() === req.user.id);
    let bookmarkedNow = false;
    if (userIndex > -1) {
      discussion.bookmarks.splice(userIndex, 1);
      bookmarkedNow = false;
    } else {
      discussion.bookmarks.push(req.user.id);
      bookmarkedNow = true;
    }
    discussion.bookmarkedCount = (discussion.bookmarks || []).length;
    await discussion.save();

    res.json({ success: true, bookmarked: bookmarkedNow, bookmarkedCount: discussion.bookmarkedCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/discussions/reply/:replyId/mark-answer
 * Mark a reply as the accepted answer (toggle)
 */
router.post("/reply/:replyId/mark-answer", async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.replyId);
    if (!reply) return res.status(404).json({ error: "Reply not found" });

    const discussion = await Discussion.findById(reply.discussion);
    if (!discussion) return res.status(404).json({ error: "Discussion not found" });

    // Only discussion author can mark an answer
    if (discussion.author.toString() !== req.user.id)
      return res.status(403).json({ error: "Only discussion author can mark an answer" });

    // toggle: unset previous answers for the same discussion, set this one to isAnswer true
    if (reply.isAnswer) {
      reply.isAnswer = false;
      await reply.save();
      // optionally mark discussion as not closed
      discussion.isClosed = false;
      await discussion.save();
      return res.json({ success: true, marked: false });
    } else {
      // unset other replies that were marked
      await Reply.updateMany({ discussion: discussion._id, isAnswer: true }, { $set: { isAnswer: false } });
      reply.isAnswer = true;
      await reply.save();
      discussion.isClosed = true;
      await discussion.save();
      return res.json({ success: true, marked: true });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
