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
    if (await Form.exists({ code: code.toUpperCase() }))
      return res.status(409).json({ message: "Code already exists." });
    const form = await Form.create({
      name,
      type,
      code: code.toUpperCase(),
      desc,
      admin: req.admin._id
    });
    res.status(201).json({ success: true, form });
  } catch (e) {
    res.status(500).json({ message: "Could not create form." });
  }
});

// Get all forms for current admin
router.get("/", authAdmin, async (req, res) => {
  const forms = await Form.find({ admin: req.admin._id }).sort({ createdAt: -1 });
  res.json({ forms });
});

// Get single form (must be owned by admin)
router.get("/:id", authAdmin, async (req, res) => {
  const form = await Form.findOne({ _id: req.params.id, admin: req.admin._id });
  if (!form) return res.status(404).json({ message: "Form not found." });
  res.json({ form });
});

// Get form by code (public, for filling out)
router.get("/code/:code", async (req, res) => {
  const form = await Form.findOne({ code: req.params.code.toUpperCase() });
  if (!form) return res.status(404).json({ message: "Form not found." });
  res.json({ form });
});

// Update form (must be owned by admin)
router.patch("/:id", authAdmin, async (req, res) => {
  const form = await Form.findOne({ _id: req.params.id, admin: req.admin._id });
  if (!form) return res.status(404).json({ message: "Not found." });
  Object.assign(form, req.body);
  await form.save();
  res.json({ success: true, form });
});

// Delete form (must be owned by admin)
router.delete("/:id", authAdmin, async (req, res) => {
  const result = await Form.deleteOne({ _id: req.params.id, admin: req.admin._id });
  if (result.deletedCount === 0)
    return res.status(404).json({ message: "Not found or not your form." });
  res.json({ success: true });
});

export default router;
