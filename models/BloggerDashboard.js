import mongoose from "mongoose";

const BloggerDashboardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },

  posts: [{
    title: String,
    content: String,
    date: { type: Date, default: Date.now },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    status: { type: String, enum: ["Draft", "Published"], default: "Draft" }
  }],

  listings: [{
    item: String,
    price: Number,
    stock: Number,
    status: { type: String, enum: ["Active", "Pending", "Inactive"], default: "Active" },
    sales: { type: Number, default: 0 }
  }],

  analytics: {
    viewsOverTime: {
      type: [Number], // e.g. [500, 600, 700, ...]
      default: [0, 0, 0, 0, 0, 0, 0]
    },
    engagements: {
      blog: { type: Number, default: 0 },
      marketplace: { type: Number, default: 0 },
      campaigns: { type: Number, default: 0 },
      referrals: { type: Number, default: 0 }
    }
  },

  followers: [{
    name: String,
    img: String
  }],

  commissions: [{
    date: String,
    source: String,
    amount: Number,
    status: String,
    type: String
  }],

  messages: [{
    from: String,
    msg: String,
    date: String
  }]

  // You can expand with more dashboard-related fields as needed.
});

export default mongoose.model("BloggerDashboard", BloggerDashboardSchema);
