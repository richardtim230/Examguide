import express from "express";
import multer from "multer";
import Registration from "../models/Registration.js";

const router = express.Router();
const upload = multer({ dest: "uploads/registrations/", limits: { fileSize: 6 * 1024 * 1024 } });

// Register (user)
router.post("/", upload.fields([
  { name: "passport", maxCount: 1 },
  { name: "receipt", maxCount: 1 }
]), async (req, res) => {
  try {
    const { fullname, email, phone, gender } = req.body;
    if (!fullname || !email || !phone || !gender || !req.files?.passport || !req.files?.receipt)
      return res.status(400).json({ success: false, message: "All fields and files required" });

    const passportFile = req.files.passport[0].filename;
    const receiptFile = req.files.receipt[0].filename;

    await Registration.create({
      fullname, email, phone, gender,
      passport: passportFile,
      receipt: receiptFile
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to submit registration" });
  }
});

// List registrations (admin only)
import { authAdmin } from "../middleware/authAdmin.js";
router.get("/", authAdmin, async (req, res) => {
  try {
    const registrations = await Registration.find().sort({ createdAt: -1 });
    res.json({ registrations });
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch registrations" });
  }
});

export default router;