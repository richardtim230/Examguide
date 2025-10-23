import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate } from "../middleware/authenticate.js";
import User from "../models/User.js";

const router = express.Router();

// Multer setup for file upload (simple local storage; use cloud for prod)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), "uploads/account_docs/");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s/g, "_"));
  }
});
const upload = multer({ storage });

// POST or PUT /api/account-settings
router.post("/", authenticate, async (req, res) => {
  try {
    const { fullname, email, phone, bank, accountName, accountNumber, idType, idDocument, proofOfAddress } = req.body;
    if (!fullname || !accountName || fullname.trim().toLowerCase() !== accountName.trim().toLowerCase()) {
      return res.status(400).json({ error: "Account Name must match your profile name." });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });
    user.bank = bank;
    user.accountName = accountName;
    user.accountNumber = accountNumber;
    user.idType = idType;
    user.verification = user.verification || {};
    if (idDocument) user.verification.idDocument = idDocument;
    if (proofOfAddress) user.verification.proofOfAddress = proofOfAddress;
    user.verification.status = "pending";
    await user.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Could not save account settings." });
  }
});
router.get("/", authenticate, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({
    fullname: user.fullname,
    email: user.email,
    phone: user.phone,
    bank: user.bank,
    accountName: user.accountName,
    accountNumber: user.accountNumber,
    idType: user.idType,
    verification: user.verification
  });
});
export default router;
