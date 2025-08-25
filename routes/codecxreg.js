import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import CodecxRegistration from "../models/CodecxRegistration.js";

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const router = express.Router();

const storage = multer.memoryStorage(); // store files in memory as Buffer
const upload = multer({ storage });

// Utility functions for login details
function generateUsername(matricNumber, fullName) {
    // Prefer matricNumber, else sanitized fullName + random digits
    if (matricNumber) return matricNumber.trim();
    return (fullName.replace(/\s+/g, "").toLowerCase() + Math.floor(Math.random()*1000));
}
function generatePassword() {
    // Simple random password, improve as needed
    return "Codecx" + Math.floor(10000 + Math.random() * 90000);
}


// Add this route to 
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password)
            return res.status(400).json({ message: "Username and password required." });

        // Find registration by loginUsername, matricNumber, or email
        const candidate = await CodecxRegistration.findOne({
            $or: [
                { loginUsername: username },
                { matricNumber: username },
                { email: username }
            ]
        });

        if (!candidate)
            return res.status(401).json({ message: "Invalid username or password." });

        if (!candidate.active)
            return res.status(403).json({ message: "Account not yet activated. Please contact admin." });

        const isMatch = await bcrypt.compare(password, candidate.loginPasswordHash);
        if (!isMatch)
            return res.status(401).json({ message: "Invalid username or password." });

        // Issue JWT (the payload can be customized as needed)
        const token = jwt.sign(
            {
                id: candidate._id,
                loginUsername: candidate.loginUsername,
                matricNumber: candidate.matricNumber,
                email: candidate.email,
                type: "codecx-candidate"
            },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.json({ token, message: "Login successful!" });
    } catch (e) {
        res.status(500).json({ message: "Server error", error: e.message });
    }
});

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

        // Generate login details
        const loginUsername = generateUsername(matricNumber, fullName);
        const loginPasswordPlain = generatePassword();
        const loginPasswordHash = await bcrypt.hash(loginPasswordPlain, 12);

        // Save to registration DB
        const registration = new CodecxRegistration({
            fullName,
            email,
            phone,
            matricNumber,
            nassDue: nassDue === "yes" ? "yes" : "no",
            passportBase64,
            paymentReceiptBase64,
            nassReceiptBase64,
            loginUsername,
            loginPasswordPlain,
            loginPasswordHash,
            active: true // Not active until marked reviewed
        });

        await registration.save();

        // ******* CREATE USER ACCOUNT IMMEDIATELY *******
        let user = await User.findOne({
            $or: [
                { username: loginUsername },
                { email: email }
            ]
        });
        if (!user) {
            user = new User({
                username: loginUsername,
                password: loginPasswordHash,
                role: "codec",
                email: email,
                fullname: fullName,
                phone: phone,
                active: false // User exists immediately, but is inactive!
            });
            await user.save();
        }
        // ******* END USER CREATION *******

        res.json({
            message: "Registration received successfully!",
            registration,
            login: {
                username: loginUsername,
                password: loginPasswordPlain // show only once to admin/user
            }
        });
    } catch (e) {
        res.status(500).json({ message: "Server error", error: e.message });
    }
});

        

// GET all registrations (for admin dashboard)
// Exclude loginPasswordPlain in list for security
router.get("/", async (req, res) => {
    try {
        const registrations = await CodecxRegistration.find({}, { loginPasswordPlain: 0 }).sort({ submittedAt: -1 });
        res.json(registrations);
    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
});

// GET single registration (admin view, shows login details)
router.get("/:id", async (req, res) => {
    try {
        const reg = await CodecxRegistration.findById(req.params.id);
        if (!reg) return res.status(404).json({ message: "Registration not found" });
        res.json(reg);
    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
});


router.patch("/:id/activate", async (req, res) => {
    try {
        const reg = await CodecxRegistration.findById(req.params.id);
        if (!reg) return res.status(404).json({ message: "Registration not found" });

        reg.active = true;
        await reg.save();

        res.json({ message: "Account activated!", registration: reg });
    } catch (e) {
        console.error("[ACTIVATION ERROR]", e);
        res.status(500).json({ message: "Server error", error: e.message });
    }
});

export default router;
