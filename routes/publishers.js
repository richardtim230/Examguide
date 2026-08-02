import express from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";

const router = express.Router();

function safePublic(userDoc) {
  if (!userDoc) return null;
  const u = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  return {
    _id: u._id,
    username: u.username,
    fullname: u.fullname || "",
    profilePic: u.profilePic || "",
    about: u.about || "",
    bio: u.bio || "",
    specialties: u.specialties || [],
    institution: u.institution || null,
    role: u.role || "",
    approved: Boolean(u.approved),
    createdAt: u.createdAt || null,
    updatedAt: u.updatedAt || null
  };
}

function safeOwner(userDoc) {
  if (!userDoc) return null;
  const u = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete u.password;
  delete u.emailVerificationToken;
  delete u.resetPasswordToken;
  delete u.resetPasswordExpires;
  delete u.resetPasswordCode;
  delete u.resetPasswordCodeExpires;
  delete u.__v;
  return u;
}

function isAdmin(req) {
  return req && req.user && (req.user.role === "admin" || req.user.role === "superadmin");
}

function isOwner(req, user) {
  if (!req || !req.user || !user) return false;
  try {
    const reqId = String(req.user._id || req.user.id || req.user);
    const userId = String(user._id || user.id);
    return reqId === userId;
  } catch {
    return false;
  }
}

router.get("/check-handle/:username", async (req, res) => {
  try {
    const { username } = req.params;
    if (!username || typeof username !== "string" || !username.trim()) {
      return res.status(400).json({ ok: false, message: "Invalid username" });
    }
    const exists = await User.findOne({ username: username.trim() }).select("_id");
    return res.json({ ok: true, available: !Boolean(exists) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const {
      fullname = "",
      username = "",
      email = "",
      password = "",
      phone = "",
      country = "",
      address = "",
      bank = "",
      accountNumber = "",
      accountName = ""
    } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ ok: false, message: "username, email and password are required" });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(cleanEmail)) {
      return res.status(400).json({ ok: false, message: "Invalid email address" });
    }

    if (accountNumber && !/^\d{6,40}$/.test(String(accountNumber).trim())) {
      return res.status(400).json({ ok: false, message: "Invalid account number format" });
    }

    const existing = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }]
    }).select("username email");

    if (existing) {
      return res.status(409).json({ ok: false, message: "Username or email already in use" });
    }

    const saltRounds = 10;
    const hashed = await bcrypt.hash(password, saltRounds);

    const user = new User({
      fullname: String(fullname).trim(),
      username: cleanUsername,
      email: cleanEmail,
      password: hashed,
      phone: String(phone).trim(),
      country: String(country).trim(),
      address: String(address).trim(),
      bank: String(bank).trim() || undefined,
      accountNumber: accountNumber ? String(accountNumber).trim() : undefined,
      accountName: accountName ? String(accountName).trim() : undefined,
      role: "pending_publisher",
      approved: false
    });

    await user.save();

    return res.status(201).json({
      ok: true,
      message: "Publisher registration successful. Your account is pending approval.",
      user: safePublic(user)
    });
  } catch (err) {
    console.error(err);
    if (err && err.code === 11000) {
      return res.status(409).json({ ok: false, message: "Duplicate field detected" });
    }
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

router.get("/public", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const q = { approved: true, role: { $in: ["blogger", "publisher", "uploader", "pq-uploader"] } };

    if (req.query.search) {
      const s = String(req.query.search).trim();
      q.$or = [
        { username: { $regex: s, $options: "i" } },
        { fullname: { $regex: s, $options: "i" } },
        { about: { $regex: s, $options: "i" } },
        { bio: { $regex: s, $options: "i" } }
      ];
    }

    const [items, total] = await Promise.all([
      User.find(q).select("username fullname profilePic about bio specialties institution role approved createdAt updatedAt").skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      User.countDocuments(q)
    ]);

    const payload = items.map(i => ({
      _id: i._id,
      username: i.username,
      fullname: i.fullname || "",
      profilePic: i.profilePic || "",
      about: i.about || "",
      bio: i.bio || "",
      specialties: i.specialties || [],
      institution: i.institution || null,
      role: i.role || "",
      approved: Boolean(i.approved),
      createdAt: i.createdAt || null,
      updatedAt: i.updatedAt || null
    }));

    return res.json({ ok: true, total, page, limit, data: payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || "50", 10)));
    const skip = (page - 1) * limit;

    const q = {};
    if (req.query.approved) q.approved = String(req.query.approved) === "true";
    if (req.query.role) q.role = String(req.query.role);

    if (req.query.search) {
      const s = String(req.query.search).trim();
      q.$or = [
        { username: { $regex: s, $options: "i" } },
        { fullname: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } }
      ];
    }

    const [items, total] = await Promise.all([
      User.find(q).select("-password -resetPasswordToken -emailVerificationToken -resetPasswordCode -__v").skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      User.countDocuments(q)
    ]);

    return res.json({ ok: true, total, page, limit, data: items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let user;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id);
    }
    if (!user) user = await User.findOne({ username: id });
    if (!user) return res.status(404).json({ ok: false, message: "Publisher not found" });

    if (user.approved) {
      return res.json({ ok: true, data: safePublic(user) });
    }

    if (isAdmin(req) || isOwner(req, user)) {
      return res.json({ ok: true, data: safeOwner(user) });
    }

    return res.status(403).json({ ok: false, message: "Not allowed to view this publisher" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let user;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id);
    }
    if (!user) user = await User.findOne({ username: id });
    if (!user) return res.status(404).json({ ok: false, message: "Publisher not found" });

    if (!isAdmin(req) && !isOwner(req, user)) {
      return res.status(403).json({ ok: false, message: "Not authorized" });
    }

    const updates = {};
    const allowedOwnerFields = ["fullname", "about", "bio", "specialties", "profilePic", "phone", "address", "country", "institution"];
    const allowedAdminFields = ["role", "approved", "bank", "accountNumber", "accountName", "email", "username"];

    for (const k of allowedOwnerFields) {
      if (k in req.body) updates[k] = req.body[k];
    }

    if (isAdmin(req)) {
      for (const k of allowedAdminFields) {
        if (k in req.body) updates[k] = req.body[k];
      }
      if (req.body.password) {
        const saltRounds = 10;
        updates.password = await bcrypt.hash(String(req.body.password), saltRounds);
      }
    }

    Object.keys(updates).forEach(k => {
      if (typeof updates[k] === "string") updates[k] = updates[k].trim();
    });

    Object.assign(user, updates);
    await user.save();

    return res.json({ ok: true, message: "Publisher updated", data: isAdmin(req) ? safeOwner(user) : safePublic(user) });
  } catch (err) {
    console.error(err);
    if (err && err.code === 11000) {
      return res.status(409).json({ ok: false, message: "Duplicate field detected" });
    }
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let user;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id);
    }
    if (!user) user = await User.findOne({ username: id });
    if (!user) return res.status(404).json({ ok: false, message: "Publisher not found" });

    if (!isAdmin(req) && !isOwner(req, user)) {
      return res.status(403).json({ ok: false, message: "Not authorized" });
    }

    await User.deleteOne({ _id: user._id });

    return res.json({ ok: true, message: "Publisher removed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

router.post("/:id/approve", async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ ok: false, message: "Not authorized" });

    const { id } = req.params;
    let user;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id);
    }
    if (!user) user = await User.findOne({ username: id });
    if (!user) return res.status(404).json({ ok: false, message: "Publisher not found" });

    user.approved = true;
    if (!["blogger", "uploader", "pq-uploader"].includes(user.role)) {
      user.role = "blogger";
    }
    await user.save();

    return res.json({ ok: true, message: "Publisher approved", data: safeOwner(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
});

export default router;
