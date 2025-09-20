import mongoose from "mongoose";
const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  text: String,
  date: { type: Date, default: Date.now },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
  likes: { type: Number, default: 0 }
}, { _id: true });

CommentSchema.add({
  replies: [CommentSchema]
});
const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  status: { type: String, enum: ["Draft", "Pending", "pending", "Published"], default: "Draft" },
  category: { type: String, default: "General" }, // <------ ADD THIS LINE
  imageUrl: String,
  readers: { type: [String], default: [] }, 
  images: { type: [String], default: [] },
  comments: [CommentSchema],
  viewRecords: [{
    userId: String,
    time: Number
  }]
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
  approved: { type: Boolean, default: false },
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

const BloggerDashboardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
  posts: [PostSchema],
  listings: [ListingSchema],
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
  followers: [FollowerSchema],
  commissions: [CommissionSchema],
  messages: [MessageSchema]
});
export default mongoose.model("BloggerDashboard", BloggerDashboardSchema);
