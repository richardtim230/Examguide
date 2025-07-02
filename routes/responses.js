import express from "express";
import Response from "../models/Response.js";

import { authAdmin } from "../middleware/authAdmin.js";
const router = express.Router();

// Submit a response (public)
router.post("/", async (req, res) => {
  const { formId, data } = req.body;
  if (!formId || !data) return res.status(400).json({ message: "Missing formId or data." });
  try {
    const form = await Form.findById(formId);
    if (!form) return res.status(404).json({ message: "Form not found." });
    const response = await Response.create({ formId, data });
    res.status(201).json({ success: true, response });
  } catch {
    res.status(500).json({ message: "Failed to submit response." });
  }
});

// Get all responses for a form (admin only, must own form)
router.get("/", authAdmin, async (req, res) => {
  const { formId } = req.query;
  if (!formId) return res.status(400).json({ message: "formId required." });
  const form = await Form.findById(formId);
  if (!form) return res.status(404).json({ message: "Form not found." });
  if (form.admin.toString() !== req.admin._id.toString())
    return res.status(403).json({ message: "Forbidden. Not your form." });
  const responses = await Response.find({ formId }).sort({ createdAt: -1 });
  res.json({ responses });
});

export default router;
