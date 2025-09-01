import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["Paid", "Unpaid"], default: "Unpaid" },
    ref: { type: String, default: "" }
}, { _id: false });

const ActivitySchema = new mongoose.Schema({
    date: { type: Date, required: true },
    activity: { type: String, required: true },
    status: { type: String, enum: ["Success", "Failed"], default: "Success" }
}, { _id: false });

const CourseSchema = new mongoose.Schema({
    name: { type: String, required: true }
}, { _id: false });

const ProgressSchema = new mongoose.Schema({
    completed: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    grade: { type: String, default: "-" }
}, { _id: false });

const CodecxRegistrationSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email:    { type: String, required: true },
    phone:    { type: String, required: true },
    matricNumber: { type: String, required: true },
    passportBase64: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },

    loginUsername: { type: String, default: "" },
    loginPasswordPlain: { type: String, default: "" },
    loginPasswordHash: { type: String, default: "" },

    active: { type: Boolean, default: true },

    // Dashboard fields
    hasPaid: { type: Boolean, default: false },
    lastPaymentRef: { type: String, default: "" },
    courses: [CourseSchema],
    progress: ProgressSchema,
    payments: [PaymentSchema],
    activities: [ActivitySchema]
}, { collection: "codecxregistrations" });

export default mongoose.model("CodecxRegistration", CodecxRegistrationSchema);
