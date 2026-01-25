
import mongoose from "mongoose";
const { Schema } = mongoose;

const ReviewSchema = new Schema({
  // Target: either a product/listing OR a tutor (user). One of these must be present.
  productId: { type: Schema.Types.ObjectId, ref: "Listing", index: true }, // legacy product/listing reviews
  tutor: { type: Schema.Types.ObjectId, ref: "User", index: true },        // tutor-specific reviews

  // Author: user who left the review. For tutor reviews we may also call this student.
  user: { type: Schema.Types.ObjectId, ref: "User", index: true },
  student: { type: Schema.Types.ObjectId, ref: "User", index: true }, // alias for tutor flows

  // Lightweight denormalized author info (keeps old data if user removed)
  username: { type: String, default: "" },
  avatar: { type: String, default: "" },

  // Rating & comment
  rating: { type: Number, required: true, min: 1, max: 5, index: true },
  comment: { type: String, default: "" },

  // Extensibility
  meta: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ReviewSchema.pre("validate", function (next) {
  if (!this.productId && !this.tutor) {
    return next(new Error("Review must target either a productId (Listing) or a tutor (User)."));
  }
  // normalize: if user set but student empty and tutor is present, set student = user
  if (this.tutor && this.user && !this.student) this.student = this.user;
  next();
});

ReviewSchema.index({ tutor: 1, user: 1 }, { unique: true, sparse: true });
ReviewSchema.index({ productId: 1, user: 1 }, { unique: true, sparse: true });
ReviewSchema.index({ tutor: 1, createdAt: -1 });
ReviewSchema.index({ productId: 1, createdAt: -1 });

ReviewSchema.statics.getAverageRatingForTutor = async function (tutorId) {
  if (!tutorId) return { avg: 0, count: 0 };
  const res = await this.aggregate([
    { $match: { tutor: mongoose.Types.ObjectId(String(tutorId)), rating: { $exists: true } } },
    { $group: { _id: "$tutor", avg: { $avg: "$rating" }, count: { $sum: 1 } } }
  ]);
  return res[0] || { avg: 0, count: 0 };
};

ReviewSchema.statics.getAverageRatingForProduct = async function (productId) {
  if (!productId) return { avg: 0, count: 0 };
  const res = await this.aggregate([
    { $match: { productId: mongoose.Types.ObjectId(String(productId)), rating: { $exists: true } } },
    { $group: { _id: "$productId", avg: { $avg: "$rating" }, count: { $sum: 1 } } }
  ]);
  return res[0] || { avg: 0, count: 0 };
};

ReviewSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

export default mongoose.model("Review", ReviewSchema);
