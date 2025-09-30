import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import Order from "../models/Order.js";
import Listing from "../models/Listing.js";
const router = express.Router();

// Create new order (pending payment)
router.post("/", authenticate, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: "Missing productId" });

    // Find product details
    const product = await Listing.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const order = await Order.create({
      buyer: req.user.id,
      productId,
      productTitle: product.title,
      price: product.price,
      quantity,
      status: "pending_payment"
    });
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

export default router;
