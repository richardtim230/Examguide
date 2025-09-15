import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import BuyerDashboard from "../models/BuyerDashboard.js";
import BloggerDashboard from "../models/BloggerDashboard.js"; // For accessing listings/products, orders
import mongoose from "mongoose";

const router = express.Router();

// GET: Fetch buyer dashboard (all fields)
router.get("/", authenticate, async (req, res) => {
  let dashboard = await BuyerDashboard.findOne({ user: req.user.id });
  if (!dashboard) {
    dashboard = new BuyerDashboard({ user: req.user.id });
    await dashboard.save();
  }
  res.json(dashboard);
});

// PATCH: Partial update of dashboard (any fields)
router.patch("/", authenticate, async (req, res) => {
  let dashboard = await BuyerDashboard.findOne({ user: req.user.id });
  if (!dashboard) {
    dashboard = new BuyerDashboard({ user: req.user.id });
  }
  for (const key of Object.keys(req.body)) {
    dashboard[key] = req.body[key];
  }
  await dashboard.save();
  res.json(dashboard);
});

// ========== ORDERS ==========

// GET: All orders for this buyer
router.get("/orders", authenticate, async (req, res) => {
  let dashboard = await BuyerDashboard.findOne({ user: req.user.id });
  if (!dashboard) return res.json([]);
  res.json((dashboard.orders || []).map(order => ({
    ...order.toObject(),
    _id: order._id?.toString?.() ?? ""
  })));
});

// POST: Add a new order (when buyer purchases an item)
router.post("/orders", authenticate, async (req, res) => {
  let dashboard = await BuyerDashboard.findOne({ user: req.user.id });
  if (!dashboard) dashboard = new BuyerDashboard({ user: req.user.id });

  // Typically: { productId, sellerId, ... }
  const orderData = {
    _id: new mongoose.Types.ObjectId(),
    ...req.body,
    date: new Date(),
    status: req.body.status || "Processing"
  };
  dashboard.orders.unshift(orderData);
  await dashboard.save();
  res.status(201).json(orderData);
});

// PATCH: Update order (status, tracking, etc)
router.patch("/orders/:orderId", authenticate, async (req, res) => {
  let dashboard = await BuyerDashboard.findOne({ user: req.user.id });
  if (!dashboard) return res.status(404).json({ message: "Dashboard not found" });
  const order = dashboard.orders.id(req.params.orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });
  Object.assign(order, req.body);
  await dashboard.save();
  res.json(order);
});

// DELETE: Remove an order (rare, for admin/cancel)
router.delete("/orders/:orderId", authenticate, async (req, res) => {
  let dashboard = await BuyerDashboard.findOne({ user: req.user.id });
  if (!dashboard) return res.status(404).json({ message: "Dashboard not found" });
  const order = dashboard.orders.id(req.params.orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });
  order.remove();
  await dashboard.save();
  res.json({ message: "Order deleted" });
});

// ========== WISHLIST ==========

// GET: Wishlist items for this buyer
router.get("/wishlist", authenticate, async (req, res) => {
  let dashboard = await BuyerDashboard.findOne({ user: req.user.id });
  if (!dashboard) return res.json([]);
  res.json((dashboard.wishlist || []).map(item => ({
    ...item.toObject(),
    _id: item._id?.toString?.() ?? ""
  })));
});

// POST: Add to wishlist
router.post("/wishlist", authenticate, async (req, res) => {
  let dashboard = await BuyerDashboard.findOne({ user: req.user.id });
  if (!dashboard) dashboard = new BuyerDashboard({ user: req.user.id });
  const wishlistItem = {
    _id: new mongoose.Types.ObjectId(),
    ...req.body,
    date: new Date()
  };
  dashboard.wishlist.unshift(wishlistItem);
  await dashboard.save();
  res.status(201).json(wishlistItem);
});

// DELETE: Remove from wishlist
router.delete("/wishlist/:wishlistId", authenticate, async (req, res) => {
  let dashboard = await BuyerDashboard.findOne({ user: req.user.id });
  if (!dashboard) return res.status(404).json({ message: "Dashboard not found" });
  const item = dashboard.wishlist.id(req.params.wishlistId);
  if (!item) return res.status(404).json({ message: "Wishlist item not found" });
  item.remove();
  await dashboard.save();
  res.json({ message: "Wishlist item removed" });
});

// ========== MESSAGES ==========

// GET: All messages
router.get("/messages", authenticate, async (req, res) => {
  let dashboard = await BuyerDashboard.findOne({ user: req.user.id });
  if (!dashboard) return res.json([]);
  res.json((dashboard.messages || []).map(msg => ({
    ...msg.toObject(),
    _id: msg._id?.toString?.() ?? ""
  })));
});

// POST: Send a message (to seller or support)
router.post("/messages", authenticate, async (req, res) => {
  let dashboard = await BuyerDashboard.findOne({ user: req.user.id });
  if (!dashboard) dashboard = new BuyerDashboard({ user: req.user.id });
  const msg = {
    _id: new mongoose.Types.ObjectId(),
    ...req.body,
    date: new Date()
  };
  dashboard.messages.push(msg);
  await dashboard.save();
  res.status(201).json(msg);
});

// DELETE: Delete a message
router.delete("/messages/:msgId", authenticate, async (req, res) => {
  let dashboard = await BuyerDashboard.findOne({ user: req.user.id });
  if (!dashboard) return res.status(404).json({ message: "Dashboard not found" });
  const msg = dashboard.messages.id(req.params.msgId);
  if (!msg) return res.status(404).json({ message: "Message not found" });
  msg.remove();
  await dashboard.save();
  res.json({ message: "Message deleted" });
});

// ========== REWARDS/POINTS ==========

// GET: Rewards/points summary
router.get("/rewards", authenticate, async (req, res) => {
  let dashboard = await BuyerDashboard.findOne({ user: req.user.id });
  if (!dashboard) return res.json({ points: 0, cashback: 0, coupons: [] });
  res.json({
    points: dashboard.points || 0,
    cashback: dashboard.cashback || 0,
    coupons: dashboard.coupons || []
  });
});

// PATCH: Update rewards/points (on purchase, admin, etc)
router.patch("/rewards", authenticate, async (req, res) => {
  let dashboard = await BuyerDashboard.findOne({ user: req.user.id });
  if (!dashboard) dashboard = new BuyerDashboard({ user: req.user.id });
  if (typeof req.body.points === "number") dashboard.points = req.body.points;
  if (typeof req.body.cashback === "number") dashboard.cashback = req.body.cashback;
  if (Array.isArray(req.body.coupons)) dashboard.coupons = req.body.coupons;
  await dashboard.save();
  res.json({
    points: dashboard.points,
    cashback: dashboard.cashback,
    coupons: dashboard.coupons
  });
});

export default router;
