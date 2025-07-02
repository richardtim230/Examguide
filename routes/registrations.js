import express from "express";
import multer from "multer";
import path from "path";
import Registration from "../models/Registration.js";
import Form from "../models/Form.js";
import { authAdmin } from "../middleware/authAdmin.js";

const router = express.Router();

// Multer storage config to save files with original extension
const storage = multer.diskStorage({
  destination: "uploads/registrations/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, filename);
  }
});
const upload = multer({ storage, limits: { fileSize: 6 * 1024 * 1024 } });

// Register (user)
router.post(
  "/",
  upload.fields([
    { name: "passport", maxCount: 1 },
    { name: "receipt", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { fullname, email, phone, gender, formCode } = req.body;
      if (!fullname || !email || !phone || !gender || !req.files?.passport || !req.files?.receipt)
        return res.status(400).json({ success: false, message: "All fields and files required" });

      // Optionally associate with a form
      let form = null,
        admin = null;
      if (formCode) {
        form = await Form.findOne({ code: formCode.toUpperCase() });
        if (form) admin = form.admin;
      }

      const passportFile = req.files.passport[0].filename;
      const receiptFile = req.files.receipt[0].filename;

      await Registration.create({
        fullname,
        email,
        phone,
        gender,
        passport: passportFile,
        receipt: receiptFile,
        formId: form ? form._id : undefined,
        admin: admin ? admin : undefined,
      });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, message: "Failed to submit registration" });
    }
  }
);

// List registrations (admin only, returns registrations for this admin's forms)
router.get("/", authAdmin, async (req, res) => {
  try {
    const { formId } = req.query;
    let query = { admin: req.admin._id };
    if (formId) query.formId = formId;
    const registrations = await Registration.find(query).sort({ createdAt: -1 });
    res.json({ registrations });
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch registrations" });
  }
});

export default router;
