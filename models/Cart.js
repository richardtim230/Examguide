import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
  quantity: { type: Number, default: 1 },
  addedAt: { type: Date, default: Date.now }
});
const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: [CartItemSchema]
});
export default mongoose.model("Cart", CartSchema);
