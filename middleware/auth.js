// 
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "please_set_a_strong_secret";

export default async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization || req.cookies?.token || "";
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : (auth || null);
    if (!token) return res.status(401).json({ success: false, message: "Authentication required" });

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // attach full user document
    const user = await User.findById(payload.id || payload.sub).select("-password -resetPasswordToken -emailVerificationToken").lean();
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ success: false, message: "Auth error" });
  }
}
