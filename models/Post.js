import mongoose from "mongoose";

/* =========================
   REPLY SCHEMA
========================= */
const ReplySchema = new mongoose.Schema(
{
    name: String,

    text: {
        type: String,
        required: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    date: {
        type: Date,
        default: Date.now
    },

    parentId: mongoose.Schema.Types.ObjectId,

    likes: {
        type: Number,
        default: 0
    },

    replies: []
},
{
    _id: true
}
);

/* =========================
   COMMENT SCHEMA
========================= */
const CommentSchema = new mongoose.Schema(
{
    name: String,

    text: {
        type: String,
        required: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    date: {
        type: Date,
        default: Date.now
    },

    parentId: mongoose.Schema.Types.ObjectId,

    likes: {
        type: Number,
        default: 0
    },

    replies: [ReplySchema]
},
{
    _id: true
}
);

/* =========================
   POST SCHEMA
========================= */
const PostSchema = new mongoose.Schema(
{
    title: {
        type: String,
        required: true,
        trim: true
    },

    content: {
        type: String,
        required: true
    },

    category: String,

    subject: String,

    topic: String,

    status: {
        type: String,
        enum: ["Draft", "Published", "Archived"],
        default: "Draft"
    },

    date: {
        type: Date,
        default: Date.now
    },

    views: {
        type: Number,
        default: 0
    },

    likes: {
        type: Number,
        default: 0
    },

    earnings: {
        type: Number,
        default: 0
    },

    /* =========================
       READING TASK SETTINGS
       Every published post can
       automatically become a task
    ========================= */

    rewardEnabled: {
        type: Boolean,
        default: true
    },

    rewardPoints: {
        type: Number,
        default: 20
    },

    minimumReadTime: {
        type: Number,
        default: 60
    },

    /* =========================
       MEDIA
    ========================= */

    images: [
        {
            type: String
        }
    ],

    imageUrl: {
        type: String
    },

    /* =========================
       AUTHOR
    ========================= */

    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    approved: {
        type: Boolean,
        default: false
    },

    /* =========================
       ENGAGEMENT
    ========================= */

    comments: [CommentSchema],

    readers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    viewRecords: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },

            time: {
                type: Number,
                default: 0
            },

            viewedAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
},
{
    timestamps: true
}
);

/* =========================
   INDEXES
========================= */

PostSchema.index({ category: 1 });

PostSchema.index({ subject: 1 });

PostSchema.index({ topic: 1 });

PostSchema.index({
    status: 1,
    category: 1,
    subject: 1,
    topic: 1
});

PostSchema.index({
    author: 1,
    date: -1
});

PostSchema.index({
    date: -1
});

PostSchema.index({
    rewardEnabled: 1,
    status: 1,
    approved: 1
});

/* =========================
   EXPORT
========================= */

export default mongoose.model(
    "Post",
    PostSchema
);
