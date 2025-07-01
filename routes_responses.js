import express from "express";
import Response from "../models/Response.js";
import Form from "../models/Form.js";
const router = express.Router();

// Submit a response
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

// Get all responses for a form
router.get("/", async (req, res) => {
  const { formId } = req.query;
  if (!formId) return res.status(400).json({ message: "formId required." });
  const responses = await Response.find({ formId }).sort({ date: -1 });
  res.json({ responses });
});

export default router;