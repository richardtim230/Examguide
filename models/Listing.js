import mongoose from "mongoose";

const ListingSchema = new mongoose.Schema({
  title: String,
  item: String,
  price: Number,
  category: String,
  stock: Number,
  status: String,
  sales: Number,
  description: String,
  img: String,
  imageUrl: String,
  images: [String],
  approved: Boolean,
  orders: Number
  // Add any other fields your app uses
}, { timestamps: true });

export default mongoose.model("Listing", ListingSchema);
