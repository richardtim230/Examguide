import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import Cart from "../models/Cart.js";
const router = express.Router();
import mongoose from "mongoose";


// Add item to cart
router.post("/add", authenticate, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: "Missing productId" });
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid productId" });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = new Cart({ user: req.user.id, items: [] });

    const itemIdx = cart.items.findIndex(i => i.productId.toString() === productId);
    if (itemIdx > -1) {
      cart.items[itemIdx].quantity += quantity;
    } else {
      // Cast productId to ObjectId before saving!
      cart.items.push({ productId: new mongoose.Types.ObjectId(productId), quantity });
    }
    await cart.save();
    res.status(201).json(cart);
  } catch (err) {
  console.error("Add to cart error:", err); // <-- Add this line!
  res.status(500).json({ error: "Could not add to cart" });
}
});
router.get("/", authenticate, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate("items.productId");
    if (!cart) return res.json({ items: [] });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch cart" });
  }
});

// Remove item from cart
router.post("/remove", authenticate, async (req, res) => {
  try {
    const { productId } = req.body;
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ error: "Cart not found" });
    cart.items = cart.items.filter(i => i.productId.toString() !== productId);
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: "Could not remove from cart" });
  }
});

export default router;
