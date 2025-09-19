import mongoose from "mongoose";
const WithdrawalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  bank: { type: String, required: true },
  accountName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected", "paid"], default: "pending" },
  requestedAt: { type: Date, default: Date.now }
});
export default mongoose.model("Withdrawal", WithdrawalSchema);
