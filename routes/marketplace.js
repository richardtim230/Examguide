import express from "express";
import BloggerDashboard from "../models/BloggerDashboard.js";
const router = express.Router();

// GET all published/active listings from all users (public)
router.get("/listings-public", async (req, res) => {
  try {
    const dashboards = await BloggerDashboard.find({}, 'listings user');
    let allListings = [];
    dashboards.forEach(dash => {
      (dash.listings || []).forEach(listing => {
        // Only include 'Active' or 'Published' listings
        if (listing.status === "Active" || listing.status === "Published") {
          let obj = listing.toObject ? listing.toObject() : listing;
          obj.seller = dash.user; // Optionally add seller ID
          allListings.push(obj);
        }
      });
    });
    // Sort by most recent (if date available)
    allListings.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    res.json(allListings);
  } catch (e) {
    res.status(500).json({ error: "Could not fetch listings." });
  }
});

export default router;
