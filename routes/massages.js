import express from "express";
import mongoose from "mongoose";

import { authenticate } from "../middleware/authenticate.js";
import Massage from "../models/Massage.js";
import User from "../models/User.js";
const router = express.Router();

// Send a message (buyer <-> seller)
router.post("/massages", authenticate, async (req, res) => {
  try {
    const { sellerId, text, productId } = req.body;
    if (!sellerId || !text) return res.status(400).json({ error: "Missing sellerId or text" });
    const sender = req.user;
    const receiver = await User.findById(sellerId);
    if (!receiver) return res.status(404).json({ error: "Seller not found" });

    const msg = new Massage({
      senderId: sender.id,
      senderName: sender.fullname || sender.username,
      receiverId: sellerId,
      receiverName: receiver.fullname || receiver.username,
      productId,
      text
    });
    await msg.save();
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: "Could not send message" });
  }
});
router.get("/massages", authenticate, async (req, res) => {
  const userId = req.user.id;
  const msgs = await Massage.find({
    $or: [
      { senderId: userId },
      { receiverId: userId }
    ]
  }).sort({ date: 1 });
  res.json(msgs);
});

router.get("/massages/:sellerId", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const sellerId = req.params.sellerId;
    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ error: "Invalid user or seller id" });
    }
    const msgs = await Massage.find({
      $or: [
        { senderId: userId, receiverId: sellerId },
        { senderId: sellerId, receiverId: userId }
      ]
    }).sort({ date: 1 });
    res.json(msgs);
  } catch (err) {
    console.error("Error fetching messages:", err); // helpful log
    res.status(500).json({ error: "Could not fetch messages" });
  }
});

// --- Wishlist Endpoints ---
router.get("/wishlist", authenticate, async (req, res) => {
  const user = await User.findById(req.user.id).populate("wishlist");
  res.json({ wishlist: user.wishlist || [] });
});

router.post("/wishlist/add/:listingId", authenticate, async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { $addToSet: { wishlist: req.params.listingId } });
  res.json({ success: true });
});

router.delete("/wishlist/remove/:listingId", authenticate, async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { $pull: { wishlist: req.params.listingId } });
  res.json({ success: true });
});
export default router;
