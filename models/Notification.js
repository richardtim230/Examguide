import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['live_session_reminder', 'assignment_due', 'grade_posted', 'course_announcement'],
        default: 'course_announcement'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for quick lookup of unread notifications
NotificationSchema.index({ recipient: 1, read: 1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
