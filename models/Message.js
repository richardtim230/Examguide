import mongoose from "mongoose";
const FileSchema = new mongoose.Schema({
  originalname: String,
  mimetype: String,
  filename: String,
  size: Number,
  url: String
}, { _id: false });

const MessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  text: { type: String, required: false }, // now allow empty for pure file messages
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  type: { type: String, enum: ["user", "system", "group"], default: "user" },
  file: { type: FileSchema, required: false } // Add file support!
});
export default mongoose.model("Message", MessageSchema);
