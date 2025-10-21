import express from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/authenticate.js";
import Cart from "../models/Cart.js";
const router = express.Router();

// Add item to cart
router.post("/add", authenticate, async (req, res) => {
  try {
    let { productId, quantity = 1 } = req.body;

    // Validate productId presence
    if (!productId) {
      console.warn("Add to cart called without productId. Body:", req.body);
      return res.status(400).json({ error: "Missing productId" });
    }

    // Normalize productId: accept string ObjectId, and coerce to ObjectId
    if (typeof productId === "object" && productId._id) {
      productId = String(productId._id);
    } else {
      productId = String(productId);
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.warn("Invalid productId provided to /api/cart/add:", productId);
      return res.status(400).json({ error: "Invalid productId" });
    }

    // Construct ObjectId with `new` to avoid "cannot be invoked without 'new'"
    const productObjId = new mongoose.Types.ObjectId(productId);

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = new Cart({ user: req.user.id, items: [] });

    // Find existing item by string compare (safe) or by ObjectId equality
    const itemIdx = cart.items.findIndex(i => String(i.productId) === String(productId));
    if (itemIdx > -1) {
      cart.items[itemIdx].quantity += Number(quantity) || 1;
    } else {
      cart.items.push({ productId: productObjId, quantity: Number(quantity) || 1 });
    }
    await cart.save();
    // Return populated cart for convenience
    const populated = await Cart.findById(cart._id).populate("items.productId");
    res.status(201).json(populated);
  } catch (err) {
    console.error("Could not add to cart:", err, "body:", req.body);
    res.status(500).json({ error: "Could not add to cart" });
  }
});

// GET user's cart (manual population)
// Get user's cart
router.get("/", authenticate, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate("items.productId");
    if (!cart) return res.json({ items: [] });
    res.json(cart);
  } catch (err) {
    console.error("Could not fetch cart:", err);
    res.status(500).json({ error: "Could not fetch cart" });
  }
});

// Remove item from cart
// NOTE: this now maps to POST /api/cart/remove (router mounted at /api/cart)
router.post("/remove", authenticate, async (req, res) => {
  try {
    let { productId } = req.body;
    if (!productId) {
      console.warn("Remove from cart called without productId. Body:", req.body);
      return res.status(400).json({ error: "Missing productId" });
    }
    productId = String(productId);
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    cart.items = cart.items.filter(i => String(i.productId) !== productId);
    await cart.save();
    const populated = await Cart.findById(cart._id).populate("items.productId");
    res.json(populated);
  } catch (err) {
    console.error("Could not remove from cart:", err, "body:", req.body);
    res.status(500).json({ error: "Could not remove from cart" });
  }
});

export default router;
