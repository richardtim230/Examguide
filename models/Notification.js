/**
 * models/Notification.js
 * Merged Notification model — preserves your existing shape (title, message, imageUrl, sentBy, sentTo)
 * while adding the richer fields and behavior used across the codebase (to, from, type, data, link, read, meta).
 *
 * Backwards-compatible:
 * - Your existing fields `sentBy` and `sentTo` are preserved.
 * - Routes using `to` / `from` (as in routes/tutors.js) continue to work.
 *
 * Includes:
 * - sensible indexes for common queries
 * - a small static helper to create notifications consistently
 * - validation ensuring at least one recipient is present
 * - timestamps and JSON sanitization
 */

import mongoose from "mongoose";

const { Schema, model } = mongoose;

const NotificationSchema = new Schema({
  // Primary user-facing content
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  imageUrl: { type: String, trim: true, default: "" },

  // Backwards-compatible fields from your previous model
  sentBy: { type: Schema.Types.ObjectId, ref: "User" }, // original name for sender
  sentTo: [{ type: Schema.Types.ObjectId, ref: "User" }], // original name for recipients (array)

  // Fields used by other parts of the app / routes/tutors.js
  to: { type: Schema.Types.ObjectId, ref: "User", index: true },   // single recipient (common pattern in your routes)
  from: { type: Schema.Types.ObjectId, ref: "User", index: true }, // single sender

  // Richer metadata & routing
  type: {
    type: String,
    enum: ["tutor-request", "assignment", "session", "message", "system", "payment", "review", "other"],
    default: "other",
    index: true
  },
  data: { type: Schema.Types.Mixed, default: {} }, // arbitrary structured payload (e.g., { type: "tutor_request", student: id })
  link: { type: String, default: "" }, // optional route/path to navigate to in app

  // read / delivery state
  read: { type: Boolean, default: false, index: true },

  // convenience / extensibility
  meta: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Indexes to support the most common query patterns:
 *  - find notifications for a user (both single-recipient `to` and multi-recipient `sentTo`)
 *  - queries by type and read state
 */
NotificationSchema.index({ to: 1, createdAt: -1 });
NotificationSchema.index({ sentTo: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, read: 1, createdAt: -1 });

/**
 * Virtual: recipients
 * Normalizes recipients so calling code can look at .recipients and get an array
 * regardless of whether notification was created with `to` (single) or `sentTo` (array).
 */
NotificationSchema.virtual("recipients").get(function () {
  const arr = [];
  if (this.sentTo && Array.isArray(this.sentTo) && this.sentTo.length) arr.push(...this.sentTo.map(String));
  if (this.to) arr.push(String(this.to));
  // Remove duplicates
  return Array.from(new Set(arr));
});

/**
 * toJSON sanitization: remove __v and keep timestamps/virtuals.
 */
NotificationSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

/**
 * Pre-save validation:
 * Ensure at least one recipient is present (either `to` or non-empty `sentTo`).
 */
NotificationSchema.pre("validate", function (next) {
  if ((!this.to && (!this.sentTo || this.sentTo.length === 0))) {
    return next(new Error("Notification must have at least one recipient in `to` or `sentTo`."));
  }
  // normalize: if sentBy provided but from empty, copy over (and vice versa)
  if (!this.from && this.sentBy) this.from = this.sentBy;
  if (!this.sentBy && this.from) this.sentBy = this.from;
  next();
});

/**
 * Static helper: createFor
 * Usage examples:
 *  Notification.createFor({ to: tutorId, from: userId, type: "tutor-request", title, message, data })
 *  Notification.createFor({ sentTo: [u1,u2], sentBy: adminId, title, message })
 *
 * This helper:
 *  - accepts either `to` (single) or `sentTo` (array) or both
 *  - ensures created document(s) are consistent
 */
NotificationSchema.statics.createFor = async function (opts = {}) {
  // opts: { to, from, sentTo, sentBy, type, title, message, data, link, imageUrl, meta }
  const {
    to, from, sentTo, sentBy, type = "other",
    title, message, data = {}, link = "", imageUrl = "", meta = {}
  } = opts;

  if (!title || !message) throw new Error("title and message are required to create a notification");

  // If sentTo array is provided, create a notification referencing sentTo and sentBy
  if (sentTo && Array.isArray(sentTo) && sentTo.length) {
    const n = new this({
      title, message, imageUrl,
      sentBy: sentBy || from,
      sentTo,
      type,
      data,
      link,
      meta,
      read: false
    });
    return n.save();
  }

  // Otherwise create single-recipient notification with `to`/`from`
  if (to) {
    const n = new this({
      title, message, imageUrl,
      to,
      from: from || sentBy,
      type,
      data,
      link,
      meta,
      read: false
    });
    return n.save();
  }

  throw new Error("No recipients provided (provide `to` or `sentTo`)");
};

/**
 * Convenience instance method to mark as read (and save).
 */
NotificationSchema.methods.markRead = async function () {
  if (!this.read) {
    this.read = true;
    await this.save();
  }
  return this;
};

export default model("Notification", NotificationSchema);
