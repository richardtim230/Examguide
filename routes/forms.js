import express from "express";
import Form from "../models/Form.js";
import { authAdmin } from "../middleware/authAdmin.js";
const router = express.Router();

// Create form
router.post("/", authAdmin, async (req, res) => {
  try {
    const { name, type, code, desc } = req.body;
    if (!name || !type || !code)
      return res.status(400).json({ message: "All required." });
    if (await Form.exists({ code }))
      return res.status(409).json({ message: "Code already exists." });
    const form = await Form.create({ name, type, code, desc });
    res.status(201).json({ success: true, form });
  } catch {
    res.status(500).json({ message: "Could not create form." });
  }
});

// Get all forms
router.get("/", async (req, res) => {
  const forms = await Form.find().sort({ createdAt: -1 });
  res.json({ forms });
});

// Get single form
router.get("/:id", async (req, res) => {
  const form = await Form.findById(req.params.id);
  if (!form) return res.status(404).json({ message: "Form not found." });
  res.json({ form });
});

// Get form by code
router.get("/code/:code", async (req, res) => {
  const form = await Form.findOne({ code: req.params.code.toUpperCase() });
  if (!form) return res.status(404).json({ message: "Form not found." });
  res.json({ form });
});

// Update form
router.patch("/:id", authAdmin, async (req, res) => {
  const form = await Form.findById(req.params.id);
  if (!form) return res.status(404).json({ message: "Not found." });
  Object.assign(form, req.body);
  await form.save();
  res.json({ success: true, form });
});

// Delete form
router.delete("/:id", authAdmin, async (req, res) => {
  await Form.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
