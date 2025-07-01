import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
const JWT_SECRET = process.env.JWT_SECRET;

export async function authAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const admin = await Admin.findById(payload.id);
    if (!admin) return res.status(401).json({ message: "Unauthorized" });
    req.admin = admin;
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
      }
