import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import Order from "../models/Order.js";
import Listing from "../models/Listing.js";
import Offer from "../models/Offer.js";
import Cart from "../models/Cart.js"; // <-- Add import for Cart model

const router = express.Router();

// Create new order (supports offer-based and regular)
router.post("/", authenticate, async (req, res) => {
  try {
    const { productId, quantity = 1, price, offerId } = req.body;

    if (!productId) return res.status(400).json({ error: "Missing productId" });

    let orderPrice, productTitle, usedOffer = false;
    // If offerId is provided, validate offer
    if (offerId) {
      const offer = await Offer.findById(offerId);
      if (!offer) return res.status(404).json({ error: "Offer not found" });
      if (offer.buyer.id !== req.user.id) return res.status(403).json({ error: "Not allowed" });
      if (offer.status !== "accepted") return res.status(400).json({ error: "Offer not accepted" });
      if (offer.ordered) return res.status(400).json({ error: "Order already placed for offer" });

      orderPrice = offer.offerPrice;
      productTitle = offer.productTitle;
      usedOffer = true;
    } else {
      // Regular product order
      const product = await Listing.findById(productId);
      if (!product) return res.status(404).json({ error: "Product not found" });

      orderPrice = price || product.price;
      productTitle = product.title;
    }

    const order = await Order.create({
      buyer: req.user.id,
      productId,
      productTitle,
      price: orderPrice,
      quantity,
      status: "pending_payment",
      offerId: offerId || undefined
    });

    // If this was an offer-based order, mark the offer as ordered and link orderId
    if (usedOffer) {
      await Offer.findByIdAndUpdate(offerId, {
        ordered: true,
        orderId: order._id
      });
    }

    // --- NEW: Remove product from user's cart after ordering, for neatness ---
    await Cart.updateOne(
      { user: req.user.id },
      { $pull: { items: { productId } } }
    );

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: "Could not create order." });
  }
});

// Get all orders for logged-in user
router.get("/", authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch orders." });
  }
});

// Mark order as paid
router.patch("/:orderId/pay", authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, buyer: req.user.id });
    if (!order) return res.status(404).json({ error: "Order not found" });
    order.status = "paid";
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: "Could not update order." });
  }
});

// Remove/cancel an order (before payment)
router.delete("/:orderId", authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, buyer: req.user.id });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Optionally, block removal if already paid
    if (order.status === "paid") {
      return res.status(400).json({ error: "Cannot remove a paid order." });
    }

    // If this was an offer-based order, update the Offer document
    if (order.offerId) {
      await Offer.findByIdAndUpdate(order.offerId, {
        ordered: false,
        orderId: null
      });
    }

    await order.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Could not remove order." });
  }
});

export default router;
