import mongoose from "mongoose";

const WithdrawalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },  // For students and tutors
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // If explicitly a tutor withdrawal
  amount: { type: Number, required: true },
  bank: { type: String, required: true },
  accountName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected", "paid"], default: "pending" },
  requestedAt: { type: Date, default: Date.now }
});

// Index for quick lookup per user/tutor
WithdrawalSchema.index({ user: 1 });
WithdrawalSchema.index({ tutor: 1 });

export default mongoose.model("Withdrawal", WithdrawalSchema);
