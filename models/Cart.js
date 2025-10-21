import mongoose from "mongoose";

const { Schema } = mongoose;

const CartItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, required: true }, // references a listing id stored in BloggerDashboard.listings
  quantity: { type: Number, default: 1, min: 1 },
  // Snapshot fields so cart still shows useful data if original listing changes or is deleted
  title: { type: String },
  price: { type: Number },
  image: { type: String },
  sellerName: { type: String },
  addedAt: { type: Date, default: () => new Date() }
}, { _id: false });

const CartSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: { type: [CartItemSchema], default: [] }
}, { timestamps: true });

export default mongoose.model("Cart", CartSchema);
