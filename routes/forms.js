import express from "express";
import mongoose from "mongoose";
import Form from "../models/Form.js";
import FormResponse from "../models/FormResponse.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";

const router = express.Router();

// Create a new form (Admin only)
router.post("/", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const { title, description, fields } = req.body;
    const form = new Form({
      title,
      description,
      fields,
      createdBy: req.user.id,
    });
    await form.save();
    res.status(201).json({ message: "Form created", form });
  } catch (e) {
    res.status(400).json({ message: "Failed to create form", error: e.message });
  }
});

// Get all forms (Admins see all, users see shared forms)
router.get("/", authenticate, async (req, res) => {
  // Optionally: filter forms by role or public/private status
  const forms = await Form.find().sort({ createdAt: -1 });
  res.json(forms);
});

// Get a single form's structure/details
router.get("/:id", authenticate, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).json({ message: "Invalid form id" });
  const form = await Form.findById(req.params.id);
  if (!form) return res.status(404).json({ message: "Form not found" });
  res.json(form);
});

// Update an existing form (Admin only)
router.put("/:id", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).json({ message: "Invalid form id" });
  const { title, description, fields } = req.body;
  const form = await Form.findByIdAndUpdate(
    req.params.id,
    { title, description, fields, updatedAt: new Date() },
    { new: true }
  );
  if (!form) return res.status(404).json({ message: "Form not found" });
  res.json({ message: "Form updated", form });
});

// Delete a form (Admin only)
router.delete("/:id", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).json({ message: "Invalid form id" });
  await Form.findByIdAndDelete(req.params.id);
  await FormResponse.deleteMany({ form: req.params.id }); // Clean up responses
  res.json({ message: "Form and responses deleted" });
});

// Submit a filled form (User or anonymous)
router.post("/:id/responses", authenticate, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).json({ message: "Invalid form id" });
  const form = await Form.findById(req.params.id);
  if (!form) return res.status(404).json({ message: "Form not found" });

  const { answers } = req.body; // Array of { fieldId, value }
  const response = new FormResponse({
    form: req.params.id,
    answers,
    submittedBy: req.user.id, // Or undefined for anonymous
  });
  await response.save();
  res.status(201).json({ message: "Response submitted", response });
});

// Get all responses for a form (Admin only)
router.get("/:id/responses", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).json({ message: "Invalid form id" });
  const responses = await FormResponse.find({ form: req.params.id })
    .populate("submittedBy", "username fullname")
    .sort({ createdAt: -1 });
  res.json(responses);
});

// Get a single response (Admin only)
router.get("/:id/responses/:responseId", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.params.responseId))
    return res.status(400).json({ message: "Invalid form or response id" });
  const response = await FormResponse.findOne({ _id: req.params.responseId, form: req.params.id })
    .populate("submittedBy", "username fullname");
  if (!response) return res.status(404).json({ message: "Response not found" });
  res.json(response);
});

// Delete a response (Admin only)
router.delete("/:id/responses/:responseId", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.params.responseId))
    return res.status(400).json({ message: "Invalid form or response id" });
  await FormResponse.deleteOne({ _id: req.params.responseId, form: req.params.id });
  res.json({ message: "Response deleted" });
});

export default router;
