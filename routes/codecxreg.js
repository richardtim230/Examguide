import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import CodecxRegistration from "../models/CodecxRegistration.js";

const router = express.Router();

const storage = multer.memoryStorage(); // store files in memory as Buffer
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

        // Convert files to base64
        function fileToBase64(file) {
            if (!file) return "";
            return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
        }

        const passportBase64 = fileToBase64(req.files.passport?.[0]);
        const paymentReceiptBase64 = fileToBase64(req.files.paymentReceipt?.[0]);
        const nassReceiptBase64 = fileToBase64(req.files.nassReceipt?.[0]);

        const registration = new CodecxRegistration({
            fullName,
            email,
            phone,
            matricNumber,
            nassDue: nassDue === "yes" ? "yes" : "no",
            passportBase64,
            paymentReceiptBase64,
            nassReceiptBase64
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
