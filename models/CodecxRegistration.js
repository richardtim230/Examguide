import mongoose from "mongoose";

const CodecxRegistrationSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email:    { type: String, required: true },
    phone:    { type: String, required: true },
    matricNumber: { type: String, required: true },
    nassDue:  { type: String, enum: ["yes", "no"], default: "no" },
    passportPath: { type: String, default: "" },
    paymentReceiptPath: { type: String, default: "" },
    nassReceiptPath: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now }
}, { collection: "codecxregistrations" });

export default mongoose.model("CodecxRegistration", CodecxRegistrationSchema);
