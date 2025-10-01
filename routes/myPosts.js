// routes/myPosts.js (new route file for personal posts)
import express from "express";
import Post from "../models/Post.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.get("/posts", authenticate, async (req, res) => {
  try {
    const myPosts = await Post.find({ author: req.user.id }).sort({ date: -1 });
    res.json(myPosts.map(post => ({
      ...post.toObject(),
      _id: post._id?.toString() ?? ""
    })));
  } catch (err) {
    res.status(500).json({ error: "Could not fetch posts." });
  }
});
// routes/posts.js
router.get("/myposts", authenticate, async (req, res) => {
  const { author, page = 1, limit = 20 } = req.query;
  let filter = {};
  if (author === "me" && req.user && req.user.id) {
    filter.author = req.user.id;
  } else if (author) {
    filter.author = author;
  }
  // Add other filters if needed (status, etc.)
  const posts = await Post.find(filter)
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  res.json(posts);
});
export default router;
