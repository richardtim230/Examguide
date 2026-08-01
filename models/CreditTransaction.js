import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resource"
  },
  amount: Number,
  uploaderReward: Number,
  type: {
    type: String,
    default: "resource_read"
  }
}, {
  timestamps: true
});

export default mongoose.model("CreditTransaction", transactionSchema);
