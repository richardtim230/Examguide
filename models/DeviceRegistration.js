import mongoose from "mongoose";
const DeviceRegistrationSchema = new mongoose.Schema({
  deviceId: { type: String, index: true, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  registeredAt: { type: Date, default: Date.now }
});
export default mongoose.model("DeviceRegistration", DeviceRegistrationSchema);
