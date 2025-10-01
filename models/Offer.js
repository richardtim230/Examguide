import mongoose from "mongoose";

const OfferSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
  productTitle: String,
  offerPrice: Number,
  status: { type: String, default: "pending" }, // accepted, rejected, etc.
  ordered: { type: Boolean, default: false },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  createdAt: { type: Date, default: Date.now }
});

const Offer = mongoose.model("Offer", OfferSchema);

export default Offer;
