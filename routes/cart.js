import express from "express";
const router = express.Router();
import mongoose from "mongoose";

import authenticate from "../middleware/authenticate.js"; // assumes default export or adjust if named export
import Cart from "../models/Cart.js";
import BloggerDashboard from "../models/BloggerDashboard.js"; // used to find listings for validation/enrichment

// Utility: find listing by listing _id across blogger dashboards
async function findListingById(listingId) {
  if (!mongoose.Types.ObjectId.isValid(listingId)) return null;
  // Try to find a matching listing inside BloggerDashboard.listings array
  const dashboard = await BloggerDashboard.findOne(
    { "listings._id": listingId },
    { "listings.$": 1 } // projection returns only the matched listing in array
  ).lean();
  if (!dashboard || !dashboard.listings || !dashboard.listings.length) return null;
  return dashboard.listings[0];
}

// GET /api/cart
// Returns the user's cart (includes snapshot fields stored on cart items)
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ user: userId }).lean();
    if (!cart) {
      return res.json({ items: [] });
    }

    // Optionally enrich items with fresh data if available
    const enriched = await Promise.all(cart.items.map(async item => {
      const listing = await findListingById(item.productId);
      if (listing) {
        return {
          ...item,
          // do not overwrite snapshot fields by default, but provide latest values
          latestTitle: listing.title || item.title,
          latestPrice: listing.price || item.price,
          latestImage: (listing.images && listing.images[0]) || item.image,
          latestSellerName: listing.sellerName || item.sellerName,
          available: listing.status ? (listing.status === "Published" || listing.status === "Active") : true
        };
      }
      return { ...item, available: false };
    }));

    res.json({ items: enriched });
  } catch (e) {
    console.error("GET /api/cart error:", e);
    res.status(500).json({ message: "Could not fetch cart" });
  }
});

// POST /api/cart/add
// body: { productId, quantity }
router.post("/add", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ message: "productId is required" });
    if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).json({ message: "Invalid productId" });

    // Try to fetch listing to fill snapshot fields
    const listing = await findListingById(productId);

    // Prepare snapshot
    const snapshot = {
      title: listing?.title || req.body.title || "",
      price: listing?.price != null ? Number(listing.price) : (req.body.price ? Number(req.body.price) : 0),
      image: (listing?.images && listing.images[0]) || req.body.image || "",
      sellerName: listing?.sellerName || req.body.sellerName || ""
    };

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // If item already exists, increment or set quantity
    const existingIndex = cart.items.findIndex(it => String(it.productId) === String(productId));
    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity = Math.max(1, (cart.items[existingIndex].quantity || 0) + Number(quantity));
      cart.items[existingIndex].addedAt = new Date();
      // Update snapshots if we found fresh data
      if (listing) {
        cart.items[existingIndex].title = snapshot.title;
        cart.items[existingIndex].price = snapshot.price;
        cart.items[existingIndex].image = snapshot.image;
        cart.items[existingIndex].sellerName = snapshot.sellerName;
      }
    } else {
      cart.items.push({
        productId,
        quantity: Math.max(1, Number(quantity)),
        title: snapshot.title,
        price: snapshot.price,
        image: snapshot.image,
        sellerName: snapshot.sellerName,
        addedAt: new Date()
      });
    }

    await cart.save();
    return res.status(200).json({ message: "Added to cart", cart });
  } catch (e) {
    console.error("POST /api/cart/add error:", e);
    res.status(500).json({ message: "Could not add to cart" });
  }
});

// POST /api/cart/remove
// body: { productId }  OR body: { productId, removeAll: true }
// If removeAll flagged, remove all occurrences (we store only one item per product anyway)
router.post("/remove", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: "productId is required" });

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(it => String(it.productId) !== String(productId));
    await cart.save();
    res.json({ message: "Item removed", cart });
  } catch (e) {
    console.error("POST /api/cart/remove error:", e);
    res.status(500).json({ message: "Could not remove item" });
  }
});

// POST /api/cart/update
// body: { productId, quantity }
// updates the quantity of the product in the cart
router.post("/update", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;
    if (!productId || typeof quantity === "undefined") return res.status(400).json({ message: "productId and quantity are required" });
    const qty = Math.max(1, Number(quantity));

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const found = cart.items.find(it => String(it.productId) === String(productId));
    if (!found) return res.status(404).json({ message: "Item not in cart" });

    found.quantity = qty;
    await cart.save();
    res.json({ message: "Cart updated", cart });
  } catch (e) {
    console.error("POST /api/cart/update error:", e);
    res.status(500).json({ message: "Could not update cart" });
  }
});

// POST /api/cart/clear
router.post("/clear", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    await Cart.deleteOne({ user: userId });
    res.json({ message: "Cart cleared" });
  } catch (e) {
    console.error("POST /api/cart/clear error:", e);
    res.status(500).json({ message: "Could not clear cart" });
  }
});

export default router;
