/**
 * models/TutorEarnings.js
 * Tracks earnings per tutor transaction (session/completion/bonus).
 */

import mongoose from "mongoose";

const { Schema, model } = mongoose;

const earningsSchema = new Schema({
  tutor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  status: { type: String, enum: ["Pending", "Available", "Withdrawn", "Cancelled"], default: "Pending", index: true },
  source: { type: String, default: "session" }, // e.g., session, assignment, bonus
  referenceId: { type: Schema.Types.ObjectId }, // optional link to session/assignment
  date: { type: Date, default: Date.now, index: true },
  meta: { type: Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
});

earningsSchema.index({ tutor: 1, date: -1 });

export default model("TutorEarnings", earningsSchema);
