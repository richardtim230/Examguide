import mongoose from "mongoose";

// --- Subschemas ---

const OrderSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // Optional, for reference
  title: String,
  img: String,
  price: Number,
  seller: String,
  status: { type: String, default: "Processing" },
  date: { type: Date, default: Date.now },
  tracking: String,
  points: { type: Number, default: 0 }
}, { _id: true });

const WishlistSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  title: String,
  img: String,
  price: Number,
  author: String,
  category: String,
  date: { type: Date, default: Date.now }
}, { _id: true });

const MessageSchema = new mongoose.Schema({
  from: String,
  msg: String,
  date: { type: Date, default: Date.now }
}, { _id: true });

// --- Main BuyerDashboard Schema ---

const BuyerDashboardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },

  // Orders array (purchases)
  orders: [OrderSchema],

  // Wishlist array
  wishlist: [WishlistSchema],

  // Messages array (support, sellers, etc)
  messages: [MessageSchema],

  // Reward points
  points: { type: Number, default: 0 },

  // Cashback/coupons
  cashback: { type: Number, default: 0 },
  coupons: [{ type: String }]
  
  // You may expand with shipping addresses, reviews, etc.
});

export default mongoose.model("BuyerDashboard", BuyerDashboardSchema);
