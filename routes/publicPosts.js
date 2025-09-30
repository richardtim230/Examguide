import express from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";

const router = express.Router();

// Paginated public posts
router.get("/", async (req, res) => {
  const { category, page = 1, limit = 20 } = req.query;
  const filter = { status: "Published" };
  if (category && category !== "All") filter.category = category;

  try {
    const posts = await Post.find(filter)
      .populate("author", "fullname username profilePic")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
      
    res.json(posts.map(post => ({
      ...post.toObject(),
      authorName: post.author.fullname || post.author.username,
      authorAvatar: post.author.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.fullname || "A")}&background=FFCE45&color=263159&rounded=true`
    })));
  } catch (err) {
    res.status(500).json({ error: "Could not fetch posts." });
  }
});

export default router;
