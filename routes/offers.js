import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import mongoose from "mongoose";
import BloggerDashboard from "../models/BloggerDashboard.js";
import User from "../models/User.js";
import Listing from "../models/Listing.js";
const router = express.Router();

// Offer Schema (should be moved to models/Offer.js for scalability)
const offerSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productTitle: { type: String },
  offerPrice: { type: Number, required: true },
  originalPrice: { type: Number }, // New: Store original price for reference
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
  createdAt: { type: Date, default: Date.now },
  orderUnlocked: { type: Boolean, default: false }, // New: flag when order button is unlocked
  ordered: { type: Boolean, default: false }, // New: flag if order has been placed
  orderId: { type: String } // Optional: link to order
});
const Offer = mongoose.models.Offer || mongoose.model("Offer", offerSchema);

// Utility: Find sellerId and product details
async function getProductDetails(productId) {
  const dashboards = await BloggerDashboard.find({});
  for (const dash of dashboards) {
    const post = dash.posts?.id(productId);
    if (post) return { sellerId: dash.user?.toString(), productTitle: post.title, originalPrice: post.price || 0 };
    const listing = dash.listings?.id(productId);
    if (listing) return { sellerId: dash.user?.toString(), productTitle: listing.title || listing.item || "", originalPrice: listing.price || 0 };
  }
  return { sellerId: null, productTitle: "", originalPrice: 0 };
}

// Create Offer (must be logged in)
router.post("/", authenticate, async (req, res) => {
  try {
    const { productId, offerPrice, message, buyer } = req.body;
    if (!productId || !offerPrice || !message || !buyer) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Find seller and product details
    const { sellerId, productTitle, originalPrice } = await getProductDetails(productId);

    // Save offer for seller and buyer follow-up
    const offer = new Offer({
      productId,
      productTitle,
      offerPrice,
      originalPrice,
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

    // Track on buyer profile
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { offers: offer._id } },
      { new: true }
    );

    // Notify seller
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

// Get offers for logged-in buyer
router.get("/mine", authenticate, async (req, res) => {
  try {
    const offers = await Offer.find({ "buyer.id": req.user.id }).sort({ createdAt: -1 });
    res.json({ offers });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch offers." });
  }
});

// Get offers for seller (by their user ID)
router.get("/seller", authenticate, async (req, res) => {
  try {
    const offers = await Offer.find({ sellerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ offers });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch seller offers." });
  }
});

// Accept or reject an offer (seller only)
router.patch("/:offerId/status", authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["accepted", "rejected"];
    if (!valid.includes(status)) return res.status(400).json({ error: "Invalid status." });

    const offer = await Offer.findById(req.params.offerId);
    if (!offer) return res.status(404).json({ error: "Offer not found." });
    if (offer.sellerId !== req.user.id) return res.status(403).json({ error: "Not allowed." });

    offer.status = status;
    // Unlock order button if accepted
    offer.orderUnlocked = status === "accepted";
    await offer.save();
    res.json({ success: true, offer });
  } catch (err) {
    res.status(500).json({ error: "Could not update offer status." });
  }
});

// Buyer places order after offer is accepted (order button unlocked)
router.post("/:offerId/order", authenticate, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.offerId);
    if (!offer) return res.status(404).json({ error: "Offer not found." });
    if (offer.buyer.id !== req.user.id) return res.status(403).json({ error: "Not allowed." });
    if (!offer.orderUnlocked || offer.status !== "accepted") {
      return res.status(400).json({ error: "Offer is not accepted yet." });
    }
    if (offer.ordered) return res.status(400).json({ error: "Offer already ordered." });

    // Create order (assume you have an Order model)
    const Order = (await import("../models/Order.js")).default;
    const order = await Order.create({
      buyer: req.user.id,
      productId: offer.productId,
      productTitle: offer.productTitle,
      price: offer.offerPrice,
      quantity: req.body.quantity || 1,
      offerId: offer._id,
      status: "pending_payment"
    });

    offer.ordered = true;
    offer.orderId = order._id;
    await offer.save();

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error("Error placing order from offer:", err);
    res.status(500).json({ error: "Could not place order from offer." });
  }
});

export default router;
