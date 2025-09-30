import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
  productTitle: { type: String },
  price: { type: Number },
  quantity: { type: Number, default: 1 },
  status: { type: String, enum: ["pending_payment", "paid", "cancelled"], default: "pending_payment" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Order", OrderSchema);
