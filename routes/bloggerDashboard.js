import express from "express";
import BloggerDashboard from "../models/BloggerDashboard.js";
import multer from "multer";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";
import path from "path";
import fs from "fs";
import User from "../models/User.js"; // Already imported

import Listing from "../models/Listing.js";
import { exec } from "child_process";
import mongoose from "mongoose";
// Add at the top with other imports
import User from "../models/User.js";
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

// --- Report Listing Schema/Model ---
const ReportSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Listing" },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reason: String,
  description: String,
  date: { type: Date, default: Date.now }
}, { _id: true });

const Report = mongoose.models.Report || mongoose.model("Report", ReportSchema);

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


// --- Report Listing Endpoint ---
router.post("/report/:listingId", authenticate, async (req, res) => {
  const { reason, description } = req.body;
  if (!reason) return res.status(400).json({ error: "Reason required." });
  const report = await Report.create({
    productId: req.params.listingId,
    reporter: req.user.id,
    reason,
    description
  });
  res.status(201).json({ success: true, report });
});

// --- Wishlist Endpoints ---
router.get("/wishlist", authenticate, async (req, res) => {
  const user = await User.findById(req.user.id).populate("wishlist");
  res.json({ wishlist: user.wishlist || [] });
});

router.post("/wishlist/add/:listingId", authenticate, async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { $addToSet: { wishlist: req.params.listingId } });
  res.json({ success: true });
});

router.delete("/wishlist/remove/:listingId", authenticate, async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { $pull: { wishlist: req.params.listingId } });
  res.json({ success: true });
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

// CREATE blog post (with category, subject, topic support)
router.post("/posts", authenticate, async (req, res) => {
  try {
    let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
    if (!dashboard) dashboard = new BloggerDashboard({ user: req.user.id });
    const {
      title,
      content,
      status = "Draft",
      category,
      subject,
      topic,
      images
    } = req.body;
    if (!title || !content) return res.status(400).json({ error: "Title and content required" });

    // Categories - adjust as needed
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
      _id: new mongoose.Types.ObjectId(),
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
      imageUrl: Array.isArray(images) && images.length ? images[0] : undefined
    };

    dashboard.posts.unshift(postData);
    await dashboard.save();

    // Trigger static page generation if you use it:
    if (typeof GENERATOR_SCRIPT !== "undefined") {
      exec(`node ${GENERATOR_SCRIPT}`, (error, stdout, stderr)=> {
        if (error) console.error(`Static gen error: ${error.message}`);
        if (stderr) console.error(`Static gen stderr: ${stderr}`);
        if (stdout) console.error(`Static gen output:\n${stdout}`);
      });
    }

    res.status(201).json(postData);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: "Could not create post." });
  }
});


// In routes/bloggerDashboard.js
router.patch('/admin/posts/:postId/approval', authenticate, authorizeRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { approved, status } = req.body;
    const dashboards = await BloggerDashboard.find({});
    let found = false, post = null, dash = null;
    for (const d of dashboards) {
      const p = d.posts.id(req.params.postId);
      if (p) { post = p; dash = d; found = true; break; }
    }
    if (!found) return res.status(404).json({ message: 'Post not found' });
    if (typeof approved !== 'undefined') post.approved = approved;
    if (status) post.status = status;
    await dash.save();
    return res.json(post);
  } catch (e) {
    res.status(500).json({ error: 'Could not update post approval.' });
  }
});
    

// Helper: Validate ObjectId
function isValidObjectId(id) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

// [1] Get a single published post by ID (with author info)
router.get('/public/posts/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }
  const postId = new mongoose.Types.ObjectId(id);
  const pipeline = [
    { $unwind: "$posts" },
    { $match: { "posts._id": postId, "posts.status": "Published" } },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "authorInfo"
      }
    },
    { $project: {
        _id: "$posts._id",
        title: "$posts.title",
        content: "$posts.content",
        category: "$posts.category",
        date: "$posts.date",
        views: "$posts.views",
        likes: "$posts.likes",
        comments: "$posts.comments",
        images: "$posts.images",
        imageUrl: "$posts.imageUrl",
        authorId: "$user",
        authorName: { $ifNull: [{ $arrayElemAt: ["$authorInfo.fullname", 0] }, { $arrayElemAt: ["$authorInfo.username", 0] }] },
        authorAvatar: { $arrayElemAt: ["$authorInfo.profilePic", 0] }
    }}
  ];
  const [post] = await BloggerDashboard.aggregate(pipeline);
  if (!post) return res.status(404).json({ error: "Post not found" });
  // Fallback avatar if missing
  if (!post.authorAvatar) {
    post.authorAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName || "A")}&background=FFCE45&color=263159&rounded=true`;
  }
  res.json(post);
});

// [2] Get related posts by ID (same category, exclude current, limit param)
router.get('/public/posts/:id/related', async (req, res) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 4;
  if (!isValidObjectId(id)) return res.json([]);
  const postId = new mongoose.Types.ObjectId(id);

  // Get main post's category
  const mainPipeline = [
    { $unwind: "$posts" },
    { $match: { "posts._id": postId, "posts.status": "Published" } },
    { $project: { category: "$posts.category" } }
  ];
  const [main] = await BloggerDashboard.aggregate(mainPipeline);
  if (!main) return res.json([]);
  const category = main.category;

  // Fetch related posts
  const relatedPipeline = [
    { $unwind: "$posts" },
    { $match: { "posts.status": "Published", "posts.category": category, "posts._id": { $ne: postId } } },
    { $sort: { "posts.date": -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "authorInfo"
      }
    },
    { $project: {
        _id: "$posts._id",
        title: "$posts.title",
        imageUrl: "$posts.imageUrl",
        category: "$posts.category",
        authorName: { $ifNull: [{ $arrayElemAt: ["$authorInfo.fullname", 0] }, { $arrayElemAt: ["$authorInfo.username", 0] }] },
        authorAvatar: { $arrayElemAt: ["$authorInfo.profilePic", 0] },
        date: "$posts.date",
        views: "$posts.views",
        likes: "$posts.likes",
        comments: "$posts.comments",
        summary: { $substr: [ "$posts.content", 0, 120 ] }
    }}
  ];
  const related = await BloggerDashboard.aggregate(relatedPipeline);
  related.forEach(post => {
    if (!post.authorAvatar) {
      post.authorAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName || "A")}&background=FFCE45&color=263159&rounded=true`;
    }
  });
  res.json(related);
});

// GET: List all unique categories, subjects, topics (for filters/menus)
router.get("/taxonomy/all", async (req, res) => {
  try {
    const dashboards = await BloggerDashboard.find({}, 'posts');
    const categories = new Set();
    const subjects = new Set();
    const topics = new Set();

    dashboards.forEach(dash => {
      (dash.posts || []).forEach(post => {
        if (post.category) categories.add(post.category);
        if (post.subject) subjects.add(post.subject);
        if (post.topic) topics.add(post.topic);
      });
    });

    res.json({
      categories: Array.from(categories),
      subjects: Array.from(subjects),
      topics: Array.from(topics)
    });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch taxonomy." });
  }
});

// GET: List all unique subjects for a given category
router.get("/taxonomy/subjects", async (req, res) => {
  const { category } = req.query;
  if (!category) return res.status(400).json({ error: "Missing category" });
  try {
    const dashboards = await BloggerDashboard.find({}, 'posts');
    const subjects = new Set();
    dashboards.forEach(dash => {
      (dash.posts || []).forEach(post => {
        if (post.category === category && post.subject) {
          subjects.add(post.subject);
        }
      });
    });
    res.json({ subjects: Array.from(subjects) });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch subjects." });
  }
});
// ADMIN: Update any listing by ID (approve/reject, etc)
router.patch("/admin/listings/:listingId", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    // Find the dashboard that owns this listing
    const dashboards = await BloggerDashboard.find({});
    let found = false, listing = null, dash = null;
    for (const d of dashboards) {
      const l = d.listings.id(req.params.listingId);
      if (l) {
        listing = l;
        dash = d;
        found = true;
        break;
      }
    }
    if (!found) return res.status(404).json({ message: "Listing not found" });
    Object.assign(listing, req.body);
    await dash.save();
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: "Could not update listing." });
  }
});
// GET: List all unique topics for a given subject (and optionally category)
router.get("/taxonomy/topics", async (req, res) => {
  const { category, subject } = req.query;
  if (!subject) return res.status(400).json({ error: "Missing subject" });
  try {
    const dashboards = await BloggerDashboard.find({}, 'posts');
    const topics = new Set();
    dashboards.forEach(dash => {
      (dash.posts || []).forEach(post => {
        if (
          post.subject === subject &&
          (!category || post.category === category) &&
          post.topic
        ) {
          topics.add(post.topic);
        }
      });
    });
    res.json({ topics: Array.from(topics) });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch topics." });
  }
});

// GET: All posts filtered by category, subject, or topic
router.get("/posts/filter", async (req, res) => {
  const { category, subject, topic } = req.query;
  try {
    const dashboards = await BloggerDashboard.find({}, 'posts user');
    let posts = [];
    dashboards.forEach(dash => {
      (dash.posts || []).forEach(post => {
        let match = true;
        if (category && post.category !== category) match = false;
        if (subject && post.subject !== subject) match = false;
        if (topic && post.topic !== topic) match = false;
        if (match) {
          let obj = post.toObject ? post.toObject() : post;
          obj.authorId = dash.user;
          if (!obj.images && obj.imageUrl) obj.images = [obj.imageUrl];
          if (!obj.images) obj.images = [];
          posts.push(obj);
        }
      });
    });
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Could not filter posts." });
  }
});

// ADMIN: Get all listings for moderation (approved or not)
router.get("/admin/alllistings", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const dashboards = await BloggerDashboard.find({}, 'listings user');
    let allListings = [];
    dashboards.forEach(dash => {
      (dash.listings || []).forEach(listing => {
        let obj = listing.toObject ? listing.toObject() : listing;
        obj.sellerId = dash.user;
        allListings.push(obj);
      });
    });
    // Optional: sort newest first
    allListings.sort((a, b) => new Date(b._id.getTimestamp?.() || b._id) - new Date(a._id.getTimestamp?.() || a._id));
    res.json(allListings);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch all listings." });
  }
});
router.get("/public/posts", async (req, res) => {
  // Query params: category, page, limit
  const category = req.query.category;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 20);

  try {
    const pipeline = [
      { $unwind: "$posts" },
      { $match: { "posts.status": "Published", ...(category && category !== "All" ? { "posts.category": category } : {}) } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "authorInfo"
        }
      },
      { $sort: { "posts.date": -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          _id: "$posts._id",
          title: "$posts.title",
          content: "$posts.content",
          category: "$posts.category",
          date: "$posts.date",
          views: "$posts.views",
          likes: "$posts.likes",
          comments: { $size: { $ifNull: ["$posts.comments", []] } },
          images: "$posts.images",
          imageUrl: "$posts.imageUrl",
          authorId: "$user",
          author: { $ifNull: [ { $arrayElemAt: ["$authorInfo.fullname", 0] }, { $arrayElemAt: ["$authorInfo.username", 0] } ] },
          authorAvatar: { $arrayElemAt: ["$authorInfo.profilePic", 0] }
        }
      }
    ];

    const posts = await BloggerDashboard.aggregate(pipeline);

    posts.forEach(post => {
      if (!post.authorAvatar) {
        post.authorAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author || "A")}&background=FFCE45&color=263159&rounded=true`;
      }
    });

    res.json(posts);
  } catch (err) {
    console.error("Paginated fetch error", err);
    res.status(500).json({ error: "Could not fetch posts." });
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
                         
// Get a single public listing by ID (for item detail page)
router.get("/public/listings/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid listing ID" });
  }
  const listingId = new mongoose.Types.ObjectId(id);

  try {
    // Search all dashboards
    const dashboards = await BloggerDashboard.find({}, 'listings user');
    for (const dash of dashboards) {
      const listing = dash.listings.id(listingId);
      if (
        listing &&
        (listing.approved || listing.status === "Active" || listing.status === "Published")
      ) {
        // Optionally add seller info if needed
        let obj = listing.toObject ? listing.toObject() : listing;
        let obj = listing.toObject ? listing.toObject() : listing;
obj.sellerId = dash.user;

// Fetch seller details
const seller = await User.findById(dash.user).select("fullname username profilePic");
obj.sellerName = seller?.fullname || seller?.username || "Unknown";
obj.sellerAvatar = seller?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(obj.sellerName)}&background=eee&color=263159&rounded=true`;

return res.json(obj);
      }
    }
    return res.status(404).json({ error: "Listing not found" });
  } catch (e) {
    return res.status(500).json({ error: "Could not fetch listing." });
  }
});
router.get("/public/posts/count", async (req, res) => {
  const category = req.query.category || "General";
  try {
    const pipeline = [
      { $unwind: "$posts" },
      { $match: { "posts.status": "Published", ...(category !== "All" ? { "posts.category": category } : {}) } },
      { $count: "count" }
    ];
    const result = await BloggerDashboard.aggregate(pipeline);
    res.json({ count: result[0]?.count || 0 });
  } catch (err) {
    res.status(500).json({ count: 0 });
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

router.put("/posts/:id", authenticate, async (req, res) => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
    if (!dashboard) return res.status(404).json({ error: "Dashboard not found" });
    
    // Find the post by its _id (as string)
    let post = dashboard.posts.id(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    
    // Allowed categories (adjust if needed)
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

    await dashboard.save();

    // Trigger static page generation if you use it:
    if (typeof GENERATOR_SCRIPT !== "undefined") {
      exec(`node ${GENERATOR_SCRIPT}`, (error, stdout, stderr) => {
        if (error) console.error(`Static gen error: ${error.message}`);
        if (stderr) console.error(`Static gen stderr: ${stderr}`);
        if (stdout) console.error(`Static gen output:\n${stdout}`);
      });
    }

    res.json(post);
  } catch (err) {
    console.error("Error updating post:", err);
    res.status(500).json({ error: "Could not update post." });
  }
});

router.delete("/posts/:id", authenticate, async (req, res) => {
  try {
    let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
    if (!dashboard) return res.status(404).json({ error: "Dashboard not found" });

    const postId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    // Find index of the post
    const postIndex = dashboard.posts.findIndex(
      p => p._id.toString() === postId
    );
    if (postIndex === -1) {
      return res.status(404).json({ error: "Post not found" });
    }

    dashboard.posts.splice(postIndex, 1); // Remove the post
    await dashboard.save();
    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("Delete post error:", err);
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

    const { title, item, price, category, stock, status, sales, description, img, imageUrl, images } = req.body;
    const imagesArr = Array.isArray(images) ? images : (img || imageUrl ? [img || imageUrl] : []);
    const listingData = {
      _id: new mongoose.Types.ObjectId(),
      title: title || item,
      item: item || title,
      price: Number(price) || 0,
      category: category || "",
      stock: Number(stock) || 0,
      status: status || "Active",
      sales: Number(sales) || 0,
      description: description || "",
      img: imagesArr[0] || "",
      imageUrl: imagesArr[0] || "",
      images: imagesArr,
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
    const update = req.body;
    if (Array.isArray(update.images)) {
      listing.images = update.images;
      listing.img = update.images[0] || "";
      listing.imageUrl = update.images[0] || "";
    }
    Object.assign(listing, update);
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
// Add this to routes/bloggerDashboard.js or your marketplace routes
router.get("/public/listings", async (req, res) => {
  try {
    const dashboards = await BloggerDashboard.find({}, 'listings');
    let listings = [];
    dashboards.forEach(dash => {
      (dash.listings || []).forEach(listing => {
        // Only approved/published/active
        if (listing.approved || listing.status === "Active" || listing.status === "Published") {
          listings.push(listing.toObject ? listing.toObject() : listing);
        }
      });
    });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch listings." });
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

router.delete("/followers/:followerId", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) return res.status(404).json({ message: "Dashboard not found" });
  const follower = dashboard.followers.id(req.params.followerId);
  if (!follower) return res.status(404).json({ message: "Follower not found" });
  follower.remove();
  await dashboard.save();
  res.json({ message: "Follower removed" });
});

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

router.patch("/analytics", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) dashboard = new BloggerDashboard({ user: req.user.id });
  dashboard.analytics = { ...dashboard.analytics, ...req.body };
  await dashboard.save();
  res.json(dashboard.analytics);
});

export default router;
