import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import CodecxRegistration from "../models/CodecxRegistration.js";

const router = express.Router();

const uploadsDir = "./uploads/codecxreg";
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext);
        cb(null, `${base.replace(/\s+/g,'_')}_${Date.now()}${ext}`);
    }
});
const upload = multer({ storage });

// Registration endpoint
router.post("/", upload.fields([
    { name: "passport", maxCount: 1 },
    { name: "paymentReceipt", maxCount: 1 },
    { name: "nassReceipt", maxCount: 1 }
]), async (req, res) => {
    try {
        const {
            fullName, email, phone, matricNumber, nassDue
        } = req.body;

        if (!fullName || !email || !phone || !matricNumber) {
            return res.status(400).json({ message: "All required fields must be provided." });
        }

        const registration = new CodecxRegistration({
            fullName,
            email,
            phone,
            matricNumber,
            nassDue: nassDue === "yes" ? "yes" : "no",
            passportPath: req.files.passport?.[0]?.path || "",
            paymentReceiptPath: req.files.paymentReceipt?.[0]?.path || "",
            nassReceiptPath: req.files.nassReceipt?.[0]?.path || ""
        });

        await registration.save();

        res.json({ message: "Registration received successfully!", registration });
    } catch (e) {
        res.status(500).json({ message: "Server error", error: e.message });
    }
});

// Optionally: GET all registrations (for admin dashboard)
router.get("/", async (req, res) => {
    try {
        const registrations = await CodecxRegistration.find().sort({ submittedAt: -1 });
        res.json(registrations);
    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
