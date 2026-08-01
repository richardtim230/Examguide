import mongoose from "mongoose";

const ReadAccessSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resources",
      required: true,
      index: true
    },

    paidAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Prevent a user from paying twice for the same resource
ReadAccessSchema.index(
  { user: 1, resource: 1 },
  { unique: true }
);

export default mongoose.models.ReadAccess ||
  mongoose.model("ReadAccess", ReadAccessSchema);
