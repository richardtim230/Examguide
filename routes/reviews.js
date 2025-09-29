import express from "express";
import Review from "../models/Review.js";
import { authenticate } from "../middleware/authenticate.js";
const router = express.Router();

// Get all reviews for a product
router.get("/product/:productId", async (req, res) => {
  const reviews = await Review.find({ productId: req.params.productId }).sort({ date: -1 });
  res.json({ reviews });
});

// Add a review
router.post("/product/:productId", authenticate, async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || !comment) return res.status(400).json({ error: "Rating and comment required." });
 const userDoc = await User.findById(req.user.id);
  const avatar = userDoc.profilePic || "";
  const username = req.user.fullname || req.user.username || "User";
  // Prevent duplicate review by same user per product
  const existing = await Review.findOne({ productId: req.params.productId, user: req.user.id });
  if (existing) return res.status(400).json({ error: "You already reviewed this item." });

  const review = await Review.create({
    productId: req.params.productId,
    user: req.user.id,
    username,
    avatar,
    rating,
    comment
  });
  res.status(201).json(review);
});

export default router;
