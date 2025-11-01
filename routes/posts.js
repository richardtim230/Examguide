import express from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";
import sendBlogNotification from '../utils/sendBlogNotification.js';
const router = express.Router();

router.get("/public/posts", async (req, res) => {
  const category = req.query.category;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 20);
  const filter = { status: "Published" };
  if (category && category !== "All") filter.category = category;
  try {
    const posts = await Post.find(filter)
      .populate("author", "fullname username profilePic")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json(posts.map(post => ({
      ...post.toObject(),
      authorName: post.author?.fullname || post.author?.username || "",
      authorAvatar: post.author?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.fullname || "A")}&background=FFCE45&color=263159&rounded=true`
    })));
  } catch (err) {
    res.status(500).json({ error: "Could not fetch posts." });
  }
});
router.get("/public/posts/academics", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 20);
  // Optional: support sort by date, views, likes, etc.
  const sortField = req.query.sortBy || "date";
  const sortOrder = req.query.order === "asc" ? 1 : -1;

  const filter = { status: "Published", category: "Academics" };
  // Optionally filter by subject or topic
  if (req.query.subject) filter.subject = req.query.subject;
  if (req.query.topic) filter.topic = req.query.topic;

  try {
    const posts = await Post.find(filter)
      .populate("author", "fullname username profilePic")
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json(posts.map(post => ({
      ...post.toObject(),
      authorName: post.author?.fullname || post.author?.username || "",
      authorAvatar: post.author?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.fullname || "A")}&background=FFCE45&color=263159&rounded=true`
    })));
  } catch (err) {
    res.status(500).json({ error: "Could not fetch academics posts." });
  }
});
router.get("/public/posts/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }
  try {
    const post = await Post.findOne({ _id: id, status: "Published" })
      .populate("author", "fullname username profilePic");
    if (!post) return res.status(404).json({ error: "Post not found" });

    const postObj = post.toObject();
    postObj.authorName = post.author?.fullname || post.author?.username || "";
    postObj.authorAvatar = post.author?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(postObj.authorName || "A")}&background=FFCE45&color=263159&rounded=true`;

    res.json(postObj);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch post." });
  }
});

router.get("/posts/featured-general", async (req, res) => {
  try {
    const post = await Post.findOne({
      category: "General",
      status: "Published",
      $or: [{ subject: { $exists: false } }, { subject: "" }],
      $or: [{ topic: { $exists: false } }, { topic: "" }]
    })
      .sort({ date: -1 });

    if (!post) return res.status(404).json({ error: "No featured general post found." });

    // Optionally: populate author if you want to include name/avatar
    await post.populate("author", "fullname username profilePic");

    const obj = post.toObject();
    obj.authorName = post.author?.fullname || post.author?.username || "";
    obj.authorAvatar = post.author?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(obj.authorName || "A")}&background=FFCE45&color=263159&rounded=true`;

    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch featured general post." });
  }
});
router.post("/posts", authenticate, async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      subject,
      topic,
      images,
      status = "Draft"
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content required" });
    }

    // Allowed categories
    const allowedCategories = [
      "Campus Life",
      "Academics",
      "Tips & Hacks",
      "Opportunities",
      "Events",
      "General"
    ];
    const safeCategory = allowedCategories.includes(category) ? category : "General";

    const postData = {
      title,
      content,
      category: safeCategory,
      subject: subject || "",
      topic: topic || "",
      status,
      date: new Date(),
      views: 0,
      likes: 0,
      earnings: 0,
      comments: [],
      images: Array.isArray(images) ? images : [],
      imageUrl: Array.isArray(images) && images.length ? images[0] : undefined,
      author: req.user.id
    };

    const newPost = new Post(postData);
    await newPost.save();
await sendBlogNotification({
  title: `New Blog: ${blog.title}`,
  message: `${blog.summary || blog.content.slice(0, 100)}...`,
  url: `https://oau.examguard.com.ng/blog/${slug}-${blog._id}` // Adjust as needed!
});
    res.status(201).json(newPost);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: "Could not create post." });
  }
});

router.put("/posts/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }
  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Only author or admin/superadmin can edit
    if (post.author.toString() !== req.user.id && !["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Allowed categories
    const allowedCategories = [
      "Campus Life",
      "Academics",
      "Tips & Hacks",
      "Opportunities",
      "Events",
      "General"
    ];

    if (req.body.title !== undefined) post.title = req.body.title;
    if (req.body.content !== undefined) post.content = req.body.content;
    if (req.body.status !== undefined) post.status = req.body.status;
    if (req.body.category !== undefined) {
      post.category = allowedCategories.includes(req.body.category)
        ? req.body.category
        : "General";
    }
    if (req.body.subject !== undefined) post.subject = req.body.subject;
    if (req.body.topic !== undefined) post.topic = req.body.topic;
    if (req.body.images && Array.isArray(req.body.images)) {
      post.images = req.body.images;
      post.imageUrl = req.body.images.length ? req.body.images[0] : undefined;
    }
    post.date = new Date();

    await post.save();
    res.json(post);
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({ error: "Could not update post." });
  }
});
router.delete("/posts/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }
  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Only author or admin/superadmin can delete
    if (post.author.toString() !== req.user.id && !["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Use deleteOne for robust deletion (avoids deprecation and ensures removal)
    await Post.deleteOne({ _id: id });

    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ error: "Could not delete post." });
  }
});

router.post("/posts/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  const { name, text, user, parentId } = req.body;
  if (!name || !text) return res.status(400).json({ error: "Name and text required" });
  if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ error: "Invalid post ID" });

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // If parentId is set, this is a reply
    if (parentId) {
      const parentComment = post.comments.id(parentId);
      if (!parentComment) return res.status(404).json({ error: "Parent comment not found" });
      if (!parentComment.replies) parentComment.replies = [];
      parentComment.replies.push({
        _id: new mongoose.Types.ObjectId(),
        name,
        text,
        user: user || null,
        date: new Date(),
        parentId,
        likes: 0,
        replies: []
      });
    } else {
      // Root comment
      post.comments.push({
        _id: new mongoose.Types.ObjectId(),
        name,
        text,
        user: user || null,
        date: new Date(),
        parentId: null,
        likes: 0,
        replies: []
      });
    }
    await post.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Could not add comment" });
  }
});

router.patch("/posts/:id/like", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid post ID" });
  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    post.likes = (post.likes || 0) + 1;
    await post.save();
    res.json({ success: true, likes: post.likes });
  } catch (e) {
    res.status(500).json({ error: "Could not like post" });
  }
});

router.patch("/public/posts/:id/view", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid post ID" });
  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    post.views = (post.views || 0) + 1;
    await post.save();
    res.json({ success: true, views: post.views });
  } catch (e) {
    res.status(500).json({ error: "Could not increment views" });
  }
});
router.patch("/posts/:postId/comments/:commentId/like", async (req, res) => {
  const { postId, commentId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json({ error: "Invalid IDs" });
  }
  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    comment.likes = (comment.likes || 0) + 1;
    await post.save();
    res.json({ success: true, likes: comment.likes });
  } catch (e) {
    res.status(500).json({ error: "Could not like comment" });
  }
});
router.get("/posts/filter", async (req, res) => {
  const { category, subject, topic, page = 1, limit = 12 } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (subject) filter.subject = subject;
  if (topic) filter.topic = topic;
  filter.status = "Published";
  try {
    const posts = await Post.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Could not filter posts." });
  }
});
export default router;
