import express from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";
import sendBlogNotification from '../utils/sendBlogNotification.js';
import { awardTaskPoints } from "../utils/awardTaskPoints.js";
const router = express.Router();

// ==========================================
// 1. STATIC/SPECIFIC ROUTES (Put these first)
// ==========================================

router.get("/posts/featured-general", async (req, res) => {
    try {
        const post = await Post.findOne({
            category: "General",
            status: "Published",
            $or: [{ subject: { $exists: false } }, { subject: "" }],
            $or: [{ topic: { $exists: false } }, { topic: "" }]
        }).sort({ date: -1 });

        if (!post) return res.status(404).json({ error: "No featured general post found." });

        await post.populate("author", "fullname username profilePic");
        const obj = post.toObject();
        obj.authorName = post.author?.fullname || post.author?.username || "";
        obj.authorAvatar = post.author?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(obj.authorName || "A")}&background=FFCE45&color=263159&rounded=true`;

        res.json(obj);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch featured general post." });
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

router.get("/public/posts/academics", async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const sortField = req.query.sortBy || "date";
    const sortOrder = req.query.order === "asc" ? 1 : -1;

    const filter = { status: "Published", category: "Academics" };
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

// ==========================================
// 2. PARAMETERIZED ROUTES (Put these last)
// ==========================================

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
router.post(
    "/public/article-tasks/:postId/complete",
    authenticate,
    async (req, res) => {
        try {
            const { postId } = req.params;

            const post = await Post.findById(postId);

            if (!post) {
                return res.status(404).json({
                    error: "Post not found"
                });
            }

            let points = 2;

            switch (post.category) {
                case "Academics":
                    points = 5;
                    break;

                case "Opportunities":
                    points = 5;
                    break;

                case "Tips & Hacks":
                    points = 4;
                    break;

                case "Campus Life":
                    points = 3;
                    break;
            }

            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({
                    error: "User not found"
                });
            }

            if (!user.completedArticles) {
                user.completedArticles = [];
            }

            const alreadyCompleted =
                user.completedArticles.includes(postId);

            if (alreadyCompleted) {
                return res.status(400).json({
                    error: "Article already completed"
                });
            }

            user.completedArticles.push(postId);

const updatedUser = await awardTaskPoints(user, points);

return res.json({
    success: true,
    pointsAwarded: points,
    totalPoints: updatedUser.points,
    totalCreditPoints: updatedUser.creditPoints
});

        } catch (err) {
            console.error(err);

            return res.status(500).json({
                error: "Could not complete article task"
            });
        }
    }
);
router.get("/public/article-tasks", async (req, res) => {
    try {
        const limit = Math.max(1, parseInt(req.query.limit) || 10);

        const posts = await Post.find({
            status: "Published"
        })
        .populate("author", "fullname username profilePic")
        .sort({ date: -1 })
        .limit(limit);

        const articleTasks = posts.map(post => {
            let points = 2;

            switch (post.category) {
                case "Academics":
                    points = 5;
                    break;

                case "Opportunities":
                    points = 5;
                    break;

                case "Tips & Hacks":
                    points = 4;
                    break;

                case "Campus Life":
                    points = 3;
                    break;

                default:
                    points = 2;
            }

            return {
                taskId: `article_${post._id}`,
                postId: post._id,
                title: post.title,
                description: post.content
                    ?.replace(/<[^>]*>/g, "")
                    ?.substring(0, 180) + "...",
                activityType: "article",
                status: "active",
                points,
                category: post.category,
                image: post.imageUrl,
                createdAt: post.date,
                meta: {
                    url: `/campus-news-update?id=${post._id}`,
                    readTime: Math.max(
                        60,
                        Math.ceil(
                            (post.content?.split(" ").length || 200) / 1000
                        ) * 60
                    )
                }
            };
        });

        res.json(articleTasks);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Could not generate article tasks."
        });
    }
});
router.get("/public/posts/latest", async (req, res) => {
  try {
    const posts = await Post.find({
      status: "Published"
    })
      .populate("author", "fullname username profilePic")
      .sort({ date: -1 })
      .limit(3);

    res.json(posts);
  } catch (err) {
    res.status(500).json({
      error: "Could not fetch latest posts"
    });
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

// ==========================================
// 3. AUTH & CRUD ROUTES
// ==========================================

router.post("/posts", authenticate, async (req, res) => {
    try {
        const { title, content, category, subject, topic, images, status = "Draft" } = req.body;
        if (!title || !content) return res.status(400).json({ error: "Title and content required" });

        const allowedCategories = ["Campus Life", "Academics", "Tips & Hacks", "Opportunities", "Events", "General"];
        const safeCategory = allowedCategories.includes(category) ? category : "General";

        const newPost = new Post({
            title, content, category: safeCategory, subject: subject || "", topic: topic || "", status,
            date: new Date(), views: 0, likes: 0, earnings: 0, comments: [],
            images: Array.isArray(images) ? images : [],
            imageUrl: Array.isArray(images) && images.length ? images[0] : undefined,
            author: req.user.id
        });

        await newPost.save();
        await sendBlogNotification({
            title: `New Blog: ${newPost.title}`,
            message: `${newPost.summary || newPost.content.slice(0, 100)}...`,
            url: `https://oau.examguard.com.ng/blog/${newPost._id}`
        });
        res.status(201).json(newPost);
    } catch (err) {
        console.error("Error creating post:", err);
        res.status(500).json({ error: "Could not create post." });
    }
});

router.put("/posts/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid post ID" });
    try {
        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ error: "Post not found" });
        if (post.author.toString() !== req.user.id && !["admin", "superadmin"].includes(req.user.role)) {
            return res.status(403).json({ error: "Not authorized" });
        }
        
        const allowedCategories = ["Campus Life", "Academics", "Tips & Hacks", "Opportunities", "Events", "General"];
        if (req.body.title !== undefined) post.title = req.body.title;
        if (req.body.content !== undefined) post.content = req.body.content;
        if (req.body.status !== undefined) post.status = req.body.status;
        if (req.body.category !== undefined) post.category = allowedCategories.includes(req.body.category) ? req.body.category : "General";
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
        res.status(500).json({ error: "Could not update post." });
    }
});

router.delete("/posts/:id", authenticate, async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid post ID" });
    try {
        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ error: "Post not found" });
        if (post.author.toString() !== req.user.id && !["admin", "superadmin"].includes(req.user.role)) {
            return res.status(403).json({ error: "Not authorized" });
        }
        await Post.deleteOne({ _id: id });
        res.json({ message: "Post deleted" });
    } catch (err) {
        res.status(500).json({ error: "Could not delete post." });
    }
});

// ==========================================
// 4. INTERACTION ROUTES
// ==========================================

router.post("/posts/:postId/comments", async (req, res) => {
    const { postId } = req.params;
    const { name, text, user, parentId } = req.body;
    if (!name || !text) return res.status(400).json({ error: "Name and text required" });
    if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ error: "Invalid post ID" });
    try {
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });
        if (parentId) {
            const parentComment = post.comments.id(parentId);
            if (!parentComment) return res.status(404).json({ error: "Parent comment not found" });
            parentComment.replies.push({ _id: new mongoose.Types.ObjectId(), name, text, user: user || null, date: new Date(), parentId, likes: 0, replies: [] });
        } else {
            post.comments.push({ _id: new mongoose.Types.ObjectId(), name, text, user: user || null, date: new Date(), parentId: null, likes: 0, replies: [] });
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

export default router;
