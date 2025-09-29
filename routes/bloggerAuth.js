import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";
import path from "path";
import fs from "fs";

// Helper to handle base64 data URLs and save to disk
async function saveBase64File(dataUrl, destDir, prefix = "") {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return "";
  const matches = dataUrl.match(/^data:([a-zA-Z0-9\/\+]+);base64,(.+)$/);
  if (!matches) return "";
  const ext = matches[1].split("/")[1] || "png";
  const buffer = Buffer.from(matches[2], "base64");
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const filename = `${prefix}${Date.now()}_${Math.floor(Math.random()*10000)}.${ext}`;
  const filePath = path.join(destDir, filename);
  fs.writeFileSync(filePath, buffer);
  // The URL as served by express.static for /uploads/blogger
  return `/uploads/blogger/${path.basename(destDir)}/${filename}`;
}

const router = express.Router();

/**
 * Blogger/Marketer Registration (Base64 submission, pending approval)
 */
router.post("/register", async (req, res) => {
  try {
    const {
      fullname,
      email,
      phone,
      matric,
      role,
      institution,
      username,
      password,
      passport,
      nin,
      otherInstitution,
    } = req.body;

    if (
      !fullname ||
      !email ||
      !phone ||
      !matric ||
      !role ||
      !institution ||
      !username ||
      !password ||
      !passport ||
      !nin
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists)
      return res.status(400).json({ message: "Email or username already exists" });

    const hashed = await bcrypt.hash(password, 12);

    // Save base64 files
    const passportUrl = await saveBase64File(
      passport,
      "./uploads/blogger/passport",
      "passport_"
    );
    const ninUrl = await saveBase64File(
      nin,
      "./uploads/blogger/nin",
      "nin_"
    );

    const user = new User({
      fullname,
      username,
      email,
      phone,
      studentId: matric,
      password: hashed,
      role: "pending_blogger", // must be approved to become "blogger" etc.
      status: "pending",
      approved: false,
      profilePic: passportUrl,
      ninSlip: ninUrl,
      institution: institution === "other" ? otherInstitution : institution,
      active: false, // Not active until approved
    });
    await user.save();
    res
      .status(201)
      .json({
        message:
          "Registration submitted. Awaiting admin approval. You will receive an email when approved.",
      });
  } catch (e) {
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password)
      return res.status(400).json({ message: "All fields required" });

    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    // Reject if role is pending_blogger
    if (!user || user.role === "pending_blogger") {
      return res
        .status(403)
        .json({ message: "Account pending approval by admin." });
    }

    // Only allow blogger/marketer/both
    if (!["blogger", "marketer", "both"].includes(user.role)) {
      return res
        .status(403)
        .json({ message: "Account type not permitted for this login." });
    }

    // Password check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    res.json({ token, message: "Login successful" });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Admin Approval Endpoint
 * PATCH /api/blogger/approve/:id
 * Body: { role: "blogger" | "marketer" | "both" }
 */
router.patch(
  "/approve/:id",
  authenticate,
  authorizeRole("admin", "superadmin"),
  async (req, res) => {
    const { role } = req.body;
    if (!["blogger", "marketer", "both"].includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.role = role;
    user.status = "active";
    user.approved = true;
    user.active = true;
    await user.save();
    res.json({ message: "User approved and role set.", user });
  }
);

export default router;
