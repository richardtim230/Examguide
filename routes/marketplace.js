import express from "express";
import BloggerDashboard from "../models/BloggerDashboard.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";
const router = express.Router();

/**
 * GET /api/marketplace/listings-public
 * Returns only admin-approved marketplace listings with status "Active" or "Published"
 */
router.get("/listings-public", async (req, res) => {
  try {
    const dashboards = await BloggerDashboard.find({}, 'listings user');
    let allListings = [];
    dashboards.forEach(dash => {
      (dash.listings || []).forEach(listing => {
        // Only include items that are admin approved and active/published
        if ((listing.status === "Active" || listing.status === "Published") && listing.approved === true) {
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

/**
 * PATCH /api/marketplace/approve-listing/:dashboardId/:listingId
 * Admin approves or rejects a marketplace listing
 * Body: { approved: true } or { approved: false }
 * Requires admin/superadmin role
 */
router.patch("/approve-listing/:dashboardId/:listingId", authenticate, authorizeRole("admin", "superadmin"), async (req, res) => {
  try {
    const { dashboardId, listingId } = req.params;
    const { approved } = req.body;
    const dashboard = await BloggerDashboard.findById(dashboardId);
    if (!dashboard) return res.status(404).json({ message: "Dashboard not found" });
    const listing = dashboard.listings.id(listingId);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    listing.approved = !!approved;
    await dashboard.save();
    res.json({ success: true, approved: listing.approved, listing });
  } catch (err) {
    res.status(500).json({ error: "Could not update approval status." });
  }
});

/**
 * GET /api/marketplace/mylistings
 * Authenticated user's own listings
 */
router.get("/mylistings", authenticate, async (req, res) => {
  try {
    let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
    if (!dashboard) return res.json([]);
    res.json((dashboard.listings || []).map(listing => {
      const obj = listing.toObject ? listing.toObject() : listing;
      obj._id = listing._id?.toString?.() ?? "";
      return obj;
    }));
  } catch (err) {
    res.status(500).json({ error: "Could not fetch listings." });
  }
});

/**
 * POST /api/marketplace/listings
 * Create a listing (approved: false by default)
 */
router.post("/listings", authenticate, async (req, res) => {
  try {
    let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
    if (!dashboard) dashboard = new BloggerDashboard({ user: req.user.id });

    // Support both minimal and full product fields
    const { title, item, price, category, stock, status, sales, description, img, imageUrl } = req.body;
    const listingData = {
      _id: new mongoose.Types.ObjectId(),
      title: title || item, // accept either
      item: item || title,
      price: Number(price) || 0,
      category: category || "",
      stock: Number(stock) || 0,
      status: status || "Active",
      sales: Number(sales) || 0,
      description: description || "",
      img: img || imageUrl || "",
      orders: 0,
      approved: false // <-- always false on create
    };
    dashboard.listings.unshift(listingData);
    await dashboard.save();
    res.status(201).json(listingData);
  } catch (err) {
    res.status(500).json({ error: "Could not create listing." });
  }
});

/**
 * PATCH /api/marketplace/listings/:listingId
 * Seller can update their own listing (cannot approve)
 */
router.patch("/listings/:listingId", authenticate, async (req, res) => {
  try {
    let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
    if (!dashboard) return res.status(404).json({ message: "Dashboard not found" });
    const listing = dashboard.listings.id(req.params.listingId);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    // Never allow sellers to set 'approved' themselves!
    const { approved, ...updateFields } = req.body;
    Object.assign(listing, updateFields);
    await dashboard.save();
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: "Could not update listing." });
  }
});

/**
 * DELETE /api/marketplace/listings/:listingId
 * Seller can delete their own listing
 */
router.delete("/listings/:listingId", authenticate, async (req, res) => {
  try {
    let dashboard = await BloggerDashboard.findOne({ user: req.user.id });
    if (!dashboard) return res.status(404).json({ message: "Dashboard not found" });
    const listing = dashboard.listings.id(req.params.listingId);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    listing.remove();
    await dashboard.save();
    res.json({ message: "Listing deleted" });
  } catch (err) {
    res.status(500).json({ error: "Could not delete listing." });
  }
});

export default router;
