import express from "express";
import { authAdmin } from "../middleware/authAdmin.js";
import fs from "fs";
const router = express.Router();
const SETTINGS_PATH = "./settings.json";

// Get settings
router.get("/", authAdmin, (req, res) => {
  if (fs.existsSync(SETTINGS_PATH)) {
    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8"));
    res.json(settings);
  } else {
    res.json({});
  }
});

// Patch/update settings
router.patch("/", authAdmin, (req, res) => {
  const cur = fs.existsSync(SETTINGS_PATH) ? JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8")) : {};
  const updated = { ...cur, ...req.body };
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2));
  res.json({ success: true, settings: updated });
});

export default router;
