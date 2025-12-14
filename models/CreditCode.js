import mongoose from "mongoose";
const creditCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  points: { type: Number, required: true, default: 250 },
  used: { type: Boolean, default: false },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  usedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('CreditCode', creditCodeSchema);
