import mongoose from 'mongoose';

const SessionAttendanceSchema = new mongoose.Schema({
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LiveSession',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    attended: {
        type: Boolean,
        default: false
    },
    joinedAt: {
        type: Date,
        default: null
    },
    leftAt: {
        type: Date,
        default: null
    },
    duration: {
        type: Number,
        default: 0 // in minutes
    },
    ipAddress: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for unique attendance per student per session
SessionAttendanceSchema.index({ session: 1, student: 1 }, { unique: true });

export default mongoose.models.SessionAttendance || mongoose.model('SessionAttendance', SessionAttendanceSchema);
