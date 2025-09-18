import mongoose from "mongoose";

const AffiliateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  school: { type: String, required: true },
  ref: { type: String },
  password: { type: String, required: true }, // store hashed!
  createdAt: { type: Date, default: Date.now },
  referralLink: { type: String }, // full URL, for sharing
  referralCode: { type: String, required: true, unique: true }, // unique code for sharing (e.g. '5a2f1c9bde')
  since: { type: Date, default: Date.now },
  notify: { type: String, default: "email" }, // notification preference
  profilePic: { type: String, default: "" },
  bankAccount: { type: String, default: "" },
  socialLinks: [{ platform: String, url: String }],
  earnings: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 }, // counts successful registrations via this affiliate
  conversions: { type: Number, default: 0 }, // can be used for other purposes (e.g. paid conversions)
  earningsTrend: [{ date: Date, amount: Number }],
  conversionRate: { type: Number, default: 0 },
  earningsPerClick: { type: Number, default: 0 },
  referrals: [{
    name: String,
    email: String,
    username: String,
    referrals: { type: Number, default: 0 }
  }],
  activity: [{
    date: String,
    action: String,
    user: String,
    reward: Number,
    status: String
  }],
  payments: [{
    date: String,
    amount: Number,
    method: String,
    status: String
  }],
  notifications: [{
    type: String,
    message: String,
    timeAgo: String
  }]
});

export default mongoose.model("Affiliate", AffiliateSchema);
