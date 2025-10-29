import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import SupportTicket from "../models/SupportTicket.js";
import FAQ from "../models/FAQ.js";
const router = express.Router();

// List all tickets for the authenticated user
router.get("/tickets", authenticate, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json({ tickets });
  } catch (e) {
    res.status(500).json({ error: "Could not fetch tickets" });
  }
});

// Get a single ticket + messages
router.get("/tickets/:ticketId", authenticate, async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.ticketId, userId: req.user.id });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json({ ticket });
  } catch (e) {
    res.status(500).json({ error: "Could not fetch ticket" });
  }
});

// Create a new support ticket
router.post("/tickets", authenticate, async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) return res.status(400).json({ error: "Title and message required" });
    const ticket = await SupportTicket.create({
      userId: req.user.id,
      title,
      status: "Open",
      messages: [
        { from: "user", text: message, createdAt: new Date() }
      ]
    });
    res.status(201).json({ ticket });
  } catch (e) {
    res.status(500).json({ error: "Could not create ticket" });
  }
});

// Add a message to a ticket
router.post("/tickets/:ticketId/message", authenticate, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Message text required" });
    const ticket = await SupportTicket.findOne({ _id: req.params.ticketId, userId: req.user.id });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    ticket.messages.push({ from: "user", text, createdAt: new Date() });
    ticket.updatedAt = new Date();
    await ticket.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Could not add message" });
  }
});

// List/search FAQs/help articles
router.get("/faqs", async (req, res) => {
  try {
    const q = req.query.q ? req.query.q.toLowerCase() : "";
    let faqs;
    if (q) {
      faqs = await FAQ.find({ $or: [
        { title: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } }
      ] });
    } else {
      faqs = await FAQ.find({});
    }
    res.json({ faqs });
  } catch (e) {
    res.status(500).json({ error: "Could not fetch FAQs" });
  }
});

// Get a single FAQ/help article
router.get("/faqs/:id", async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ error: "FAQ not found" });
    res.json({ faq });
  } catch (e) {
    res.status(500).json({ error: "Could not fetch FAQ" });
  }
});

export default router;
