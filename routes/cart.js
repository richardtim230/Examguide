import express from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/authenticate.js";
import Cart from "../models/Cart.js";
const router = express.Router();

// Add item to cart
router.post("/add", authenticate, async (req, res) => {
  try {
    let { productId, quantity = 1 } = req.body;

    if (!productId) {
      console.warn("Add to cart called without productId. Body:", req.body);
      return res.status(400).json({ error: "Missing productId" });
    }

    // Normalize to string
    if (typeof productId === "object" && productId._id) {
      productId = String(productId._id);
    } else {
      productId = String(productId);
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.warn("Invalid productId provided to /api/cart/add:", productId);
      return res.status(400).json({ error: "Invalid productId" });
    }

    // Use `new` to construct ObjectId (or you can leave as string; Mongoose will cast)
    const productObjId = new mongoose.Types.ObjectId(productId);

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = new Cart({ user: req.user.id, items: [] });

    // Find existing item by string compare
    const itemIdx = cart.items.findIndex(i => String(i.productId) === String(productId));
    if (itemIdx > -1) {
      cart.items[itemIdx].quantity += Number(quantity) || 1;
      cart.items[itemIdx].addedAt = new Date();
    } else {
      cart.items.push({ productId: productObjId, quantity: Number(quantity) || 1, addedAt: new Date() });
    }

    // Log what we are about to save (raw ObjectIds)
    console.log("Before save - cart items (to save):", cart.items.map(i => ({ productId: String(i.productId), quantity: i.quantity })));

    await cart.save();

    // Query raw saved cart (no populate) to inspect the actual stored ids
    const rawCart = await Cart.findById(cart._id).lean();
    console.log("Raw cart after save:", JSON.stringify(rawCart?.items?.map(i => ({ productId: i.productId, quantity: i.quantity })), null, 2));

    // Now populate for convenience — if populate returns null for productId it means the referenced listing wasn't found
    const populated = await Cart.findById(cart._id).populate("items.productId");

    // Also return the raw productId strings alongside the populated cart to help debug client-side
    const rawIds = (rawCart?.items || []).map(i => String(i.productId));

    res.status(201).json({ cart: populated, rawProductIds: rawIds });
  } catch (err) {
    console.error("Could not add to cart:", err, "body:", req.body);
    res.status(500).json({ error: "Could not add to cart" });
  }
});

export default router;
