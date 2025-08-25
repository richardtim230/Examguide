import mongoose from "mongoose";

const CodecxRegistrationSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email:    { type: String, required: true },
    phone:    { type: String, required: true },
    matricNumber: { type: String, required: true },
    nassDue:  { type: String, enum: ["yes", "no"], default: "no" },
    passportBase64: { type: String, default: "" },
    paymentReceiptBase64: { type: String, default: "" },
    nassReceiptBase64: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },

    // Login details for candidate (created after registration)
    loginUsername: { type: String, default: "" },
    loginPasswordPlain: { type: String, default: "" }, // Display only to admin after registration
    loginPasswordHash: { type: String, default: "" },  // For future authentication

    // Activation status
    active: { type: Boolean, default: true }
}, { collection: "codecxregistrations" });

export default mongoose.model("CodecxRegistration", CodecxRegistrationSchema);
