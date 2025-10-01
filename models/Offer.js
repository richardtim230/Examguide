import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productTitle: { type: String },
  offerPrice: { type: Number, required: true },
  originalPrice: { type: Number },
  message: { type: String },
  buyer: {
    id: { type: String },
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    faculty: { type: String },
    department: { type: String }
  },
  sellerId: { type: String },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  orderUnlocked: { type: Boolean, default: false },
  ordered: { type: Boolean, default: false },
  orderId: { type: String }
});

// Fix OverwriteModelError by using mongoose.models.Offer if already compiled
const Offer = mongoose.models.Offer || mongoose.model("Offer", offerSchema);

export default Offer;
