import mongoose from "mongoose";

/**
 * Simple per-user library to avoid altering the User schema.
 * Stores resource ObjectIds the user has saved/bookmarked.
 */
const UserLibrarySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
  resources: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resource" }]
}, { timestamps: true });

export default mongoose.model("UserLibrary", UserLibrarySchema);
