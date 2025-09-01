import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import CodecxRegistration from "../models/CodecxRegistration.js";
import User from "../models/User.js";
dotenv.config();
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// JWT auth middleware
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Missing token" });
    const token = authHeader.replace("Bearer ", "");
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}

// Utility functions for login details
function generateUsername(matricNumber, fullName) {
    if (matricNumber) return matricNumber.trim();
    return (fullName.replace(/\s+/g, "").toLowerCase() + Math.floor(Math.random()*1000));
}
function generatePassword() {
    return "Codecx" + Math.floor(10000 + Math.random() * 90000);
}

// Registration endpoint
router.post("/", upload.fields([
    { name: "passport", maxCount: 1 }
]), async (req, res) => {
    try {
        const { fullName, email, phone, matricNumber } = req.body;

        if (!fullName || !email || !phone || !matricNumber) {
            return res.status(400).json({ message: "All required fields must be provided." });
        }
        function fileToBase64(file) {
            if (!file) return "";
            return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
        }
        const passportBase64 = fileToBase64(req.files.passport?.[0]);

        const loginUsername = generateUsername(matricNumber, fullName);
        const loginPasswordPlain = generatePassword();
        const loginPasswordHash = await bcrypt.hash(loginPasswordPlain, 12);

        const registration = new CodecxRegistration({
            fullName,
            email,
            phone,
            matricNumber,
            passportBase64,
            loginUsername,
            loginPasswordPlain,
            loginPasswordHash,
            active: true,

            // Demo dashboard data: new student, unpaid, no courses, no payments, etc.
            hasPaid: false,
            lastPaymentRef: "",
            courses: [],
            progress: { completed: 0, total: 0, grade: "-" },
            payments: [],
            activities: []
        });

        await registration.save();

        // Create user account immediately
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
                active: true
            });
            await user.save();
        }

        res.json({
            message: "Registration received successfully!",
            registration,
            login: {
                username: loginUsername,
                password: loginPasswordPlain
            }
        });
    } catch (e) {
        res.status(500).json({ message: "Server error", error: e.message });
    }
});

// Login endpoint
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password)
            return res.status(400).json({ message: "Username and password required." });

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

        const token = jwt.sign(
            {
                id: candidate._id,
                role: "codecx-candidate",
                email: candidate.email,
                loginUsername: candidate.loginUsername,
                matricNumber: candidate.matricNumber
            },process.env.JWT_SECRET || "your_jwt_secret",
            { expiresIn: "2h" }
        );

        res.json({ token, message: "Login successful!" });
    } catch (e) {
        res.status(500).json({ message: "Server error", error: e.message });
    }
});

// GET /me dashboard data
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const candidate = await CodecxRegistration.findById(req.user.id);
        if (!candidate) return res.status(404).json({ message: "User not found" });
        res.json({
            fullName: candidate.fullName,
            email: candidate.email,
            passportBase64: candidate.passportBase64,
            hasPaid: candidate.hasPaid,
            lastPaymentRef: candidate.lastPaymentRef,
            courses: candidate.courses,
            progress: candidate.progress,
            payments: candidate.payments,
            activities: candidate.activities
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// Add course for student
router.post("/courses", authMiddleware, async (req, res) => {
    try {
        const { courseName } = req.body;
        if (!courseName) return res.status(400).json({ message: "Course name required" });
        const candidate = await CodecxRegistration.findById(req.user.id);
        if (!candidate) return res.status(404).json({ message: "User not found" });

        candidate.courses.push({ name: courseName });
        candidate.activities.push({ date: new Date(), activity: `Enrolled in course: ${courseName}`, status: "Success" });
        await candidate.save();

        res.json({ message: "Course added!", courses: candidate.courses });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// Remove course for student
router.delete("/courses", authMiddleware, async (req, res) => {
    try {
        const { courseName } = req.body;
        if (!courseName) return res.status(400).json({ message: "Course name required" });
        const candidate = await CodecxRegistration.findById(req.user.id);
        if (!candidate) return res.status(404).json({ message: "User not found" });

        candidate.courses = candidate.courses.filter(c => c.name !== courseName);
        candidate.activities.push({ date: new Date(), activity: `Dropped course: ${courseName}`, status: "Success" });
        await candidate.save();

        res.json({ message: "Course removed!", courses: candidate.courses });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// Update progress
router.put("/progress", authMiddleware, async (req, res) => {
    try {
        const { completed, total, grade } = req.body;
        const candidate = await CodecxRegistration.findById(req.user.id);
        if (!candidate) return res.status(404).json({ message: "User not found" });

        candidate.progress = {
            completed: completed ?? candidate.progress.completed,
            total: total ?? candidate.progress.total,
            grade: grade ?? candidate.progress.grade
        };
        candidate.activities.push({ date: new Date(), activity: `Progress updated`, status: "Success" });
        await candidate.save();

        res.json({ message: "Progress updated!", progress: candidate.progress });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// Record payment
router.post("/payments", authMiddleware, async (req, res) => {
    try {
        const { amount, ref } = req.body;
        if (!amount || !ref) return res.status(400).json({ message: "Amount and reference required" });
        const candidate = await CodecxRegistration.findById(req.user.id);
        if (!candidate) return res.status(404).json({ message: "User not found" });

        candidate.payments.push({
            date: new Date(),
            amount,
            status: "Paid",
            ref
        });
        candidate.hasPaid = true;
        candidate.lastPaymentRef = ref;
        candidate.activities.push({ date: new Date(), activity: `Payment made: ₦${amount}`, status: "Success" });
        await candidate.save();

        res.json({ message: "Payment recorded!", payments: candidate.payments, hasPaid: candidate.hasPaid, lastPaymentRef: candidate.lastPaymentRef });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// Add activity (for custom logs)
router.post("/activities", authMiddleware, async (req, res) => {
    try {
        const { activity, status } = req.body;
        if (!activity) return res.status(400).json({ message: "Activity required" });
        const candidate = await CodecxRegistration.findById(req.user.id);
        if (!candidate) return res.status(404).json({ message: "User not found" });

        candidate.activities.push({
            date: new Date(),
            activity,
            status: status || "Success"
        });
        await candidate.save();

        res.json({ message: "Activity added!", activities: candidate.activities });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
