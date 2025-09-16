import mongoose from "mongoose";

// --- Nested Schemas ---

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  text: String,
  date: { type: Date, default: Date.now }
}, { _id: true });

// ... other schema code ...
const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  status: { type: String, enum: ["Draft", "Published"], default: "Draft" },
  imageUrl: String,
  images: { type: [String], default: [] }, // <-- Fix here
  comments: [CommentSchema]
}, { _id: true });

const ListingSchema = new mongoose.Schema({
  title: { type: String },
  item: { type: String }, // synonym for title
  price: { type: Number, default: 0 },
  category: { type: String, default: "" },
  stock: { type: Number, default: 0 },
  status: { type: String, enum: ["Active", "Pending", "Inactive", "Unpublished"], default: "Active" },
  sales: { type: Number, default: 0 },
  description: { type: String, default: "" },
  img: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  orders: { type: Number, default: 0 }
}, { _id: true });

const FollowerSchema = new mongoose.Schema({
  name: String,
  img: String
}, { _id: true });

const CommissionSchema = new mongoose.Schema({
  date: String,
  source: String,
  amount: Number,
  status: String,
  type: String
}, { _id: true });

const MessageSchema = new mongoose.Schema({
  from: String,
  msg: String,
  date: String
}, { _id: true });

// --- Main BloggerDashboard Schema ---

const BloggerDashboardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },

  // Blog Posts
  posts: [PostSchema],

  // Seller Listings
  listings: [ListingSchema],

  // Analytics for dashboard/statistics
  analytics: {
    viewsOverTime: {
      type: [Number],
      default: [0, 0, 0, 0, 0, 0, 0]
    },
    engagements: {
      blog: { type: Number, default: 0 },
      marketplace: { type: Number, default: 0 },
      campaigns: { type: Number, default: 0 },
      referrals: { type: Number, default: 0 }
    }
  },

  // Followers (array of users following this dashboard owner)
  followers: [FollowerSchema],

  // Commissions (earnings from the platform)
  commissions: [CommissionSchema],

  // Messages (inbox, support, chat)
  messages: [MessageSchema]

  // Expand with more dashboard-related fields as needed.
});

export default mongoose.model("BloggerDashboard", BloggerDashboardSchema);
