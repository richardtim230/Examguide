// routes/adminPosts.js (new route file for admin post endpoints)
import express from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

router.get("/admin/allposts", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate("author", "fullname username profilePic")
      .sort({ date: -1 });
    res.json(posts.map(post => ({
      ...post.toObject(),
      authorName: post.author?.fullname || post.author?.username || "",
      authorAvatar: post.author?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.fullname || "A")}&background=FFCE45&color=263159&rounded=true`
    })));
  } catch (e) {
    res.status(500).json({ error: "Could not fetch blog posts." });
  }
});

export default router;
