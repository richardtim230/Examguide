import mongoose from "mongoose";
const ReviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  username: String,
  avatar: String,
  rating: Number,
  comment: String,
  date: { type: Date, default: Date.now }
});
export default mongoose.model("Review", ReviewSchema);
