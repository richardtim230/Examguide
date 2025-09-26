import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import mongoose from "mongoose";
import BloggerDashboard from "../models/BloggerDashboard.js";
import User from "../models/User.js";

const router = express.Router();

// Offer Schema (can be moved to models/Offer.js for scalability)
const offerSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productTitle: { type: String },
  offerPrice: { type: Number, required: true },
  message: { type: String },
  buyer: {
    id: { type: String },
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    faculty: { type: String },
    department: { type: String }
  },
  sellerId: { type: String },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});
const Offer = mongoose.models.Offer || mongoose.model("Offer", offerSchema);

// Utility: Find sellerId from product/listing/post
async function getSellerIdFromProduct(productId) {
  // Try to find a post or listing by productId in dashboards
  const dashboards = await BloggerDashboard.find({});
  for (const dash of dashboards) {
    // Posts (for public posts/products)
    const post = dash.posts?.id(productId);
    if (post) return dash.user?.toString();
    // Listings (for marketplace products)
    const listing = dash.listings?.id(productId);
    if (listing) return dash.user?.toString();
  }
  return null;
}

// Create Offer (must be logged in)
router.post("/", authenticate, async (req, res) => {
  try {
    const { productId, offerPrice, message, buyer } = req.body;
    if (!productId || !offerPrice || !message || !buyer) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Find sellerId (for communication)
    const sellerId = await getSellerIdFromProduct(productId);

    // Optionally, get product title for easier reference
    let productTitle = "";
    const dashboards = await BloggerDashboard.find({});
    for (const dash of dashboards) {
      const post = dash.posts?.id(productId);
      if (post) productTitle = post.title;
      const listing = dash.listings?.id(productId);
      if (listing) productTitle = listing.title || listing.item || "";
    }

    // Save offer for seller and buyer follow-up
    const offer = new Offer({
      productId,
      productTitle,
      offerPrice,
      message,
      buyer: {
        id: req.user.id,
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
        faculty: buyer.faculty,
        department: buyer.department
      },
      sellerId,
      status: "pending"
    });
    await offer.save();

    // Optionally, push offer reference to buyer's User document for tracking (offers array)
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { offers: offer._id } },
      { new: true }
    );

    // Optionally, send notification to seller (e.g., via dashboard/messages array)
    if (sellerId) {
      let sellerDashboard = await BloggerDashboard.findOne({ user: sellerId });
      if (sellerDashboard) {
        sellerDashboard.messages = sellerDashboard.messages || [];
        sellerDashboard.messages.push({
          from: buyer.name,
          msg: `New offer for "${productTitle}": ₦${offerPrice}\n${message}`,
          date: new Date().toISOString()
        });
        await sellerDashboard.save();
      }
    }

    res.status(201).json({ success: true, offer });
  } catch (err) {
    console.error("Offer endpoint error:", err);
    res.status(500).json({ error: "Could not submit offer." });
  }
});

// Optional: Get offers for logged-in buyer
router.get("/mine", authenticate, async (req, res) => {
  try {
    const offers = await Offer.find({ "buyer.id": req.user.id }).sort({ createdAt: -1 });
    res.json({ offers });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch offers." });
  }
});

// Optional: Get offers for seller (by their user ID)
router.get("/seller", authenticate, async (req, res) => {
  try {
    const offers = await Offer.find({ sellerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ offers });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch seller offers." });
  }
});

// Optional: Accept or reject an offer (seller only)
router.patch("/:offerId/status", authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["accepted", "rejected"];
    if (!valid.includes(status)) return res.status(400).json({ error: "Invalid status." });

    const offer = await Offer.findById(req.params.offerId);
    if (!offer) return res.status(404).json({ error: "Offer not found." });
    if (offer.sellerId !== req.user.id) return res.status(403).json({ error: "Not allowed." });

    offer.status = status;
    await offer.save();
    res.json({ success: true, offer });
  } catch (err) {
    res.status(500).json({ error: "Could not update offer status." });
  }
});

export default router;
