import express from "express";
import BloggerDashboard from "../models/BloggerDashboard.js";
import multer from "multer";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import mongoose from "mongoose";
const GENERATOR_SCRIPT = path.join(process.cwd(), "generate-static-posts.js");
const router = express.Router();

// Multer setup for multi-image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), "uploads/posts/");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s/g, "_"));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.match(/^image\/(png|jpe?g|gif|svg\+xml)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  }
});

// GET: Fetch dashboard for current user (includes posts, listings, analytics, etc)
router.get("/", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) {
    dashboard = new BloggerDashboard({ user: req.user.id });
    await dashboard.save();
  }
  res.json(dashboard);
});
// GET all blog posts for admin (any status)
router.get("/admin/allposts", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const dashboards = await BloggerDashboard.find({}, 'posts user');
    let allPosts = [];
    dashboards.forEach(dash => {
      (dash.posts || []).forEach(post => {
        let obj = post.toObject ? post.toObject() : post;
        obj.authorId = dash.user;
        // Ensure images array exists for frontend
        if (!obj.images && obj.imageUrl) obj.images = [obj.imageUrl];
        if (!obj.images) obj.images = [];
        allPosts.push(obj);
      });
    });
    // You can choose to sort, or not
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(allPosts);
  } catch (e) {
    res.status(500).json({ error: "Could not fetch blog posts." });
  }
});
// PATCH: Partial update of dashboard (any fields)
router.patch("/", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) {
    dashboard = new BloggerDashboard({ user: req.user.id });
  }
  for (const key of Object.keys(req.body)) {
    dashboard[key] = req.body[key];
  }
  await dashboard.save();
  res.json(dashboard);
});

// GET all posts for the current blogger (for dashboard list)
router.get("/myposts", authenticate, async (req, res) => {
  try {
    let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
    if (!dashboard) return res.json([]);
    res.json((dashboard.posts || []).map(post => {
      const obj = post.toObject ? post.toObject() : post;
      obj._id = post._id?.toString?.() ?? "";
      return obj;
    }));
  } catch (err) {
    res.status(500).json({ error: "Could not fetch posts." });
  }
});


// Allowed categories - you can expand this list if needed
const allowedCategories = [
  "Campus Life",
  "Academics",
  "Tips & Hacks",
  "Opportunities",
  "Events",
  "General"
];

// CREATE blog post (base64 images)
router.post("/posts", authenticate, async (req, res) => {
  try {
    let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
    if (!dashboard) dashboard = new BloggerDashboard({ user: req.user.id });
    const { title, content, status = "Draft", category, images } = req.body;
    if (!title || !content) return res.status(400).json({ error: "Title and content required" });
    // Ensure valid, non-empty category
    const safeCategory = allowedCategories.includes(category) ? category : "General";
    const postData = {
      _id: new mongoose.Types.ObjectId(),
      title,
      content,
      category: safeCategory,
      status,
      date: new Date(),
      views: 0,
      likes: 0,
      earnings: 0,
      comments: [],
      images: Array.isArray(images) ? images : [],
      imageUrl: Array.isArray(images) && images.length ? images[0] : undefined
    };
    dashboard.posts.unshift(postData);
    await dashboard.save();
    exec(`node ${GENERATOR_SCRIPT}`, (error, stdout, stderr)=> {
      if (error) console.error(`Static gen error: ${error.message}`);
      if (stderr) console.error(`Static gen stderr: ${stderr}`);
      if (stdout) console.error(`Static gen output:\n${stdout}`);
    });
      
    res.status(201).json(postData);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: "Could not create post." });
  }
});

// UPDATE blog post (base64 images)
router.put("/posts/:id", authenticate, async (req, res) => {
  try {
    let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
    if (!dashboard) return res.status(404).json({ error: "Dashboard not found" });
    const post = dashboard.posts.id(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (req.body.title !== undefined) post.title = req.body.title;
    if (req.body.content !== undefined) post.content = req.body.content;
    if (req.body.status !== undefined) post.status = req.body.status;
    // Patch: ensure valid, non-empty category
    if (req.body.category !== undefined) {
      post.category = allowedCategories.includes(req.body.category)
        ? req.body.category
        : "General";
    }
    post.date = new Date();
    if (req.body.images && Array.isArray(req.body.images)) {
      post.images = req.body.images;
      post.imageUrl = req.body.images.length ? req.body.images[0] : undefined;
    }
    await dashboard.save();
    exec(`node ${GENERATOR_SCRIPT}`, (error, stdout, stderr)=> {
      if (error) console.error(`Static gen error: ${error.message}`);
      if (stderr) console.error(`Static gen stderr: ${stderr}`);
      if (stdout) console.error(`Static gen output:\n${stdout}`);
    });
    res.json(post);
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({ error: "Could not update post." });
  }
});


// GET all published blog posts (public, paginated)
router.get("/allposts", async (req, res) => {
  try {
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 9; // default 9 per page
    let skip = (page - 1) * limit;

    const dashboards = await BloggerDashboard.find({}, 'posts user');
    let allPosts = [];
    dashboards.forEach(dash => {
      (dash.posts || []).forEach(post => {
        if (post.status === "Published") {
          let obj = post.toObject ? post.toObject() : post;
          obj.authorId = dash.user;
          if (!obj.images && obj.imageUrl) obj.images = [obj.imageUrl];
          if (!obj.images) obj.images = [];
          allPosts.push(obj);
        }
      });
    });
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    const total = allPosts.length;
    const pagedPosts = allPosts.slice(skip, skip + limit);

    res.json({
      posts: pagedPosts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (e) {
    res.status(500).json({ error: "Could not fetch blog posts." });
  }
});

// Accepts: x-visitor-id header for guests, or uses req.user.id for logged-in users
router.patch("/increment-views/:postId", async (req, res) => {
  const { postId } = req.params;
  // Use authenticated user if available, else use visitorId from header
  const userId = (req.user && req.user.id) ? req.user.id : req.headers['x-visitor-id'] || null;
  try {
    const dashboards = await BloggerDashboard.find({});
    for (let dash of dashboards) {
      const post = dash.posts.id(postId);
      if (post) {
        // Deduplication: Only count if not in viewRecords within 2 hours
        if (!post.viewRecords) post.viewRecords = [];
        // Remove records older than 2 hours
        const now = Date.now();
        post.viewRecords = post.viewRecords.filter(vr => now - vr.time < 2 * 60 * 60 * 1000);
        // If no userId, always count (for legacy support)
        let alreadyViewed = false;
        if (userId) {
          alreadyViewed = post.viewRecords.some(vr => vr.userId === userId);
        }
        if (!alreadyViewed) {
          post.views = (post.views || 0) + 1;
          if (userId) post.viewRecords.push({ userId, time: now });
          await dash.save();
          return res.json({ success: true, views: post.views });
        }
        // Already viewed within window; return current count, don't increment
        return res.json({ success: true, views: post.views, skipped: true });
      }
    }
    res.status(404).json({ error: "Post not found" });
  } catch (e) {
    res.status(500).json({ error: "Could not increment views" });
  }
});

// POST a comment
router.post("/add-comment/:postId", async (req, res) => {
  const { postId } = req.params;
  const { name, text, user } = req.body;
  if (!name || !text) return res.status(400).json({ error: "Name and text required" });
  try {
    const dashboards = await BloggerDashboard.find({});
    for (let dash of dashboards) {
      const post = dash.posts.id(postId);
      if (post) {
        post.comments.push({ name, text, user: user || null, date: new Date() });
        await dash.save();
        return res.json({ success: true });
      }
    }
    res.status(404).json({ error: "Post not found" });
  } catch (e) {
    res.status(500).json({ error: "Could not add comment" });
  }
});



router.post("/award-points", authenticate, async (req, res) => {
  const { postId } = req.body;
  if (!postId) return res.status(400).json({ error: "Missing postId" });

  try {
    // Find all dashboards with this post
    let dashboards = await BloggerDashboard.find({});
    let found = false;
    let post = null, dash = null;
    for (const d of dashboards) {
      const p = d.posts.id(postId);
      if (p) { post = p; dash = d; found = true; break; }
    }
    if (!found) return res.status(404).json({ error: "Post not found" });

    // Make sure readers array exists
    if (!post.readers) post.readers = [];

    // Don't allow double-award
    if (post.readers.includes(req.user.id)) {
      return res.status(400).json({ error: "Points already awarded for this post" });
    }
    post.readers.push(req.user.id);

    // Award points to user
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.points = (user.points || 0) + 5;
    await user.save();
    await dash.save();

    res.json({ success: true, points: user.points });
  } catch (e) {
    console.error("Award points error:", e); // <--- see error in logs!
    res.status(500).json({ error: "Failed to award points" });
  }
});

// UPDATE blog post (JSON body or form-data)
router.put("/posts/:id", authenticate, upload.single("image"), async (req, res) => {
  try {
    let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
    if (!dashboard) return res.status(404).json({ error: "Dashboard not found" });
    const post = dashboard.posts.id(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (req.body.title !== undefined) post.title = req.body.title;
    if (req.body.content !== undefined) post.content = req.body.content;
    if (req.body.status !== undefined) post.status = req.body.status;
    post.date = new Date();
    if (req.file) {
      post.imageUrl = "/uploads/posts/" + req.file.filename;
    }
    await dashboard.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Could not update post." });
  }
});

// DELETE blog post
router.delete("/posts/:id", authenticate, async (req, res) => {
  try {
    let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
    if (!dashboard) return res.status(404).json({ error: "Dashboard not found" });
    const post = dashboard.posts.id(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    post.remove();
    await dashboard.save();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ error: "Could not delete post." });
  }
});

// ==== SELLER ENDPOINTS ====

// GET all listings for the seller (for products tab)
router.get("/mylistings", authenticate, async (req, res) => {
  try {
    let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
    if (!dashboard) return res.json([]);
    res.json((dashboard.listings || []).map(listing => {
      const obj = listing.toObject ? listing.toObject() : listing;
      obj._id = listing._id?.toString?.() ?? "";
      return obj;
    }));
  } catch (err) {
    res.status(500).json({ error: "Could not fetch listings." });
  }
});

// CREATE listing
router.post("/listings", authenticate, async (req, res) => {
  try {
    let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
    if (!dashboard) dashboard = new BloggerDashboard({ user: req.user.id });

    // Support both minimal and full product fields
    const { title, item, price, category, stock, status, sales, description, img, imageUrl } = req.body;
    const listingData = {
      _id: new mongoose.Types.ObjectId(),
      title: title || item, // accept either
      item: item || title,
      price: Number(price) || 0,
      category: category || "",
      stock: Number(stock) || 0,
      status: status || "Active",
      sales: Number(sales) || 0,
      description: description || "",
      img: img || imageUrl || "",
      orders: 0
    };
    dashboard.listings.unshift(listingData);
    await dashboard.save();
    res.status(201).json(listingData);
  } catch (err) {
    res.status(500).json({ error: "Could not create listing." });
  }
});

// UPDATE listing
router.patch("/listings/:listingId", authenticate, async (req, res) => {
  try {
    let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
    if (!dashboard) return res.status(404).json({ message: "Dashboard not found" });
    const listing = dashboard.listings.id(req.params.listingId);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    Object.assign(listing, req.body);
    await dashboard.save();
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: "Could not update listing." });
  }
});

// DELETE listing
router.delete("/listings/:listingId", authenticate, async (req, res) => {
  try {
    let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
    if (!dashboard) return res.status(404).json({ message: "Dashboard not found" });
    const listing = dashboard.listings.id(req.params.listingId);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    listing.remove();
    await dashboard.save();
    res.json({ message: "Listing deleted" });
  } catch (err) {
    res.status(500).json({ error: "Could not delete listing." });
  }
});

// ==== COMMISSIONS ====

// CREATE commission
router.post("/commissions", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) dashboard = new BloggerDashboard({ user: req.user.id });
  dashboard.commissions.push(req.body);
  await dashboard.save();
  res.status(201).json(dashboard.commissions[dashboard.commissions.length - 1]);
});

// DELETE commission
router.delete("/commissions/:commissionId", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) return res.status(404).json({ message: "Dashboard not found" });
  const commission = dashboard.commissions.id(req.params.commissionId);
  if (!commission) return res.status(404).json({ message: "Commission not found" });
  commission.remove();
  await dashboard.save();
  res.json({ message: "Commission deleted" });
});
// --- Likes and Reply Endpoints for Blog Posts and Comments ---

// PATCH: Like a blog post
router.patch("/like/:postId", async (req, res) => {
  const { postId } = req.params;
  try {
    const dashboards = await BloggerDashboard.find({});
    for (let dash of dashboards) {
      const post = dash.posts.id(postId);
      if (post) {
        post.likes = (post.likes || 0) + 1;
        await dash.save();
        return res.json({ success: true, likes: post.likes });
      }
    }
    res.status(404).json({ error: "Post not found" });
  } catch (e) {
    res.status(500).json({ error: "Could not like post" });
  }
});

// PATCH: Like a comment on a post
router.patch("/like-comment/:postId/:commentId", async (req, res) => {
  const { postId, commentId } = req.params;
  try {
    const dashboards = await BloggerDashboard.find({});
    for (let dash of dashboards) {
      const post = dash.posts.id(postId);
      if (post && Array.isArray(post.comments)) {
        const comment = post.comments.id(commentId);
        if (comment) {
          comment.likes = (comment.likes || 0) + 1;
          await dash.save();
          return res.json({ success: true, likes: comment.likes });
        }
      }
    }
    res.status(404).json({ error: "Comment not found" });
  } catch (e) {
    res.status(500).json({ error: "Could not like comment" });
  }
});

// POST: Add a comment or reply (supports parentId for replies)
router.post("/add-comment/:postId", async (req, res) => {
  const { postId } = req.params;
  const { name, text, user, parentId } = req.body;
  if (!name || !text) return res.status(400).json({ error: "Name and text required" });
  try {
    const dashboards = await BloggerDashboard.find({});
    for (let dash of dashboards) {
      const post = dash.posts.id(postId);
      if (post) {
        // If parentId is set, this is a reply
        if (parentId) {
          // Find parent comment and push to .replies array (create if not exist)
          const parentComment = post.comments.id(parentId);
          if (!parentComment) return res.status(404).json({ error: "Parent comment not found" });
          if (!parentComment.replies) parentComment.replies = [];
          parentComment.replies.push({
            _id: new mongoose.Types.ObjectId(),
            name,
            text,
            user: user || null,
            date: new Date(),
            parentId, // for easier frontend rendering
            likes: 0,
            replies: [],
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
            replies: [],
          });
        }
        await dash.save();
        return res.json({ success: true });
      }
    }
    res.status(404).json({ error: "Post not found" });
  } catch (e) {
    res.status(500).json({ error: "Could not add comment" });
  }
});
// ==== FOLLOWERS ====

// ADD follower
router.post("/followers", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) dashboard = new BloggerDashboard({ user: req.user.id });
  dashboard.followers.push(req.body);
  await dashboard.save();
  res.status(201).json(dashboard.followers[dashboard.followers.length - 1]);
});

// REMOVE follower
router.delete("/followers/:followerId", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) return res.status(404).json({ message: "Dashboard not found" });
  const follower = dashboard.followers.id(req.params.followerId);
  if (!follower) return res.status(404).json({ message: "Follower not found" });
  follower.remove();
  await dashboard.save();
  res.json({ message: "Follower removed" });
});

// ==== MESSAGES ====

// SEND message
router.post("/messages", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) dashboard = new BloggerDashboard({ user: req.user.id });
  dashboard.messages.push(req.body);
  await dashboard.save();
  res.status(201).json(dashboard.messages[dashboard.messages.length - 1]);
});

// DELETE message
router.delete("/messages/:messageId", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) return res.status(404).json({ message: "Dashboard not found" });
  const msg = dashboard.messages.id(req.params.messageId);
  if (!msg) return res.status(404).json({ message: "Message not found" });
  msg.remove();
  await dashboard.save();
  res.json({ message: "Message deleted" });
});

// ==== ANALYTICS ====
// PATCH analytics object (for updating views, engagements, etc.)
router.patch("/analytics", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) dashboard = new BloggerDashboard({ user: req.user.id });
  dashboard.analytics = { ...dashboard.analytics, ...req.body };
  await dashboard.save();
  res.json(dashboard.analytics);
});

export default router;
