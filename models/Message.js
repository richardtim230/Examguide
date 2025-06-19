import mongoose from "mongoose";
const MessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  type: { type: String, enum: ["user", "system", "group"], default: "user" }
});
export default mongoose.model("Message", MessageSchema);
