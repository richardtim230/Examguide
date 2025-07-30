import express from "express";
import BloggerDashboard from "../models/BloggerDashboard.js";
import { authenticate } from "../middleware/authenticate.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Setup multer for image uploads
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.match(/^image\/(png|jpe?g|gif|svg\+xml)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  }
});

// GET: Fetch dashboard for current user
router.get("/", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) {
    dashboard = new BloggerDashboard({ user: req.user.id });
    await dashboard.save();
  }
  res.json(dashboard);
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

// --- POSTS CRUD (array subdocs) ---

// CREATE post (with optional image upload)
router.post("/posts", authenticate, upload.single("image"), async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) {
    dashboard = new BloggerDashboard({ user: req.user.id });
  }
  const { title, content, status } = req.body;
  const postData = {
    title,
    content,
    status,
    date: new Date(),
    views: 0,
    likes: 0
  };
  if (req.file) {
    postData.imageUrl = "/uploads/posts/" + req.file.filename;
  }
  dashboard.posts.push(postData);
  await dashboard.save();
  res.status(201).json(dashboard.posts[dashboard.posts.length - 1]);
});

// UPDATE post
router.patch("/posts/:postId", authenticate, upload.single("image"), async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) return res.status(404).json({ message: "Dashboard not found" });
  const post = dashboard.posts.id(req.params.postId);
  if (!post) return res.status(404).json({ message: "Post not found" });
  // Update fields
  Object.assign(post, req.body);
  // If new image uploaded, update imageUrl
  if (req.file) {
    post.imageUrl = "/uploads/posts/" + req.file.filename;
  }
  await dashboard.save();
  res.json(post);
});

// DELETE post
router.delete("/posts/:postId", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) return res.status(404).json({ message: "Dashboard not found" });
  const post = dashboard.posts.id(req.params.postId);
  if (!post) return res.status(404).json({ message: "Post not found" });
  post.remove();
  await dashboard.save();
  res.json({ message: "Post deleted" });
});

// --- LISTINGS CRUD (array subdocs) ---

// CREATE listing
router.post("/listings", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) {
    dashboard = new BloggerDashboard({ user: req.user.id });
  }
  dashboard.listings.push(req.body);
  await dashboard.save();
  res.status(201).json(dashboard.listings[dashboard.listings.length - 1]);
});

// UPDATE listing
router.patch("/listings/:listingId", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) return res.status(404).json({ message: "Dashboard not found" });
  const listing = dashboard.listings.id(req.params.listingId);
  if (!listing) return res.status(404).json({ message: "Listing not found" });
  Object.assign(listing, req.body);
  await dashboard.save();
  res.json(listing);
});

// DELETE listing
router.delete("/listings/:listingId", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) return res.status(404).json({ message: "Dashboard not found" });
  const listing = dashboard.listings.id(req.params.listingId);
  if (!listing) return res.status(404).json({ message: "Listing not found" });
  listing.remove();
  await dashboard.save();
  res.json({ message: "Listing deleted" });
});

// --- COMMISSIONS CRUD (array subdocs) ---

// CREATE commission
router.post("/commissions", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) {
    dashboard = new BloggerDashboard({ user: req.user.id });
  }
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

// --- FOLLOWERS CRUD (array subdocs) ---

// ADD follower
router.post("/followers", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) {
    dashboard = new BloggerDashboard({ user: req.user.id });
  }
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

// --- MESSAGES CRUD (array subdocs) ---

// SEND message
router.post("/messages", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) {
    dashboard = new BloggerDashboard({ user: req.user.id });
  }
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

// --- ANALYTICS ---
// PATCH analytics object (for updating views, engagements, etc.)
router.patch("/analytics", authenticate, async (req, res) => {
  let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
  if (!dashboard) {
    dashboard = new BloggerDashboard({ user: req.user.id });
  }
  dashboard.analytics = { ...dashboard.analytics, ...req.body };
  await dashboard.save();
  res.json(dashboard.analytics);
});

export default router;
