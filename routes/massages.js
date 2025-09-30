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

// Get chat history between logged-in user and seller
router.get("/massages/:sellerId", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const sellerId = req.params.sellerId;
    const msgs = await Massage.find({
      $or: [
        { senderId: userId, receiverId: sellerId },
        { senderId: sellerId, receiverId: userId }
      ]
    }).sort({ date: 1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch messages" });
  }
});
export default router;
