import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  from: { type: String, enum: ["user", "support"], required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const SupportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ["Open", "Resolved", "Closed"], default: "Open" },
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

SupportTicketSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("SupportTicket", SupportTicketSchema);
