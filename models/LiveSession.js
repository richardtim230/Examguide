import mongoose from 'mongoose';

const LiveSessionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    scheduledAt: {
        type: Date,
        required: true
    },
    startedAt: {
        type: Date,
        default: null
    },
    endedAt: {
        type: Date,
        default: null
    },
    duration: {
        type: Number,
        default: 60, // in minutes
        min: 15,
        max: 480
    },
    platform: {
        type: String,
        enum: ['youtube', 'zoom', 'google_meet', 'microsoft_teams', 'custom'],
        required: true
    },
    link: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'active', 'completed'],
        default: 'scheduled'
    },
    allowRecording: {
        type: Boolean,
        default: true
    },
    recordingUrl: {
        type: String,
        default: null
    },
    requireAttendance: {
        type: Boolean,
        default: true
    },
    notifyStudents: {
        type: Boolean,
        default: true
    },
    notificationTime: {
        type: Number,
        default: 15 // in minutes before session
    },
    meetingId: {
        type: String,
        default: null // for Zoom
    },
    passcode: {
        type: String,
        default: null // for Zoom
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.models.LiveSession || mongoose.model('LiveSession', LiveSessionSchema);
