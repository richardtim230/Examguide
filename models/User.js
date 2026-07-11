import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const { Schema, model } = mongoose;

/**
 * Social Links Schema
 */
const socialSchema = new Schema({
  facebook: { type: String, default: "" },
  twitter: { type: String, default: "" },
  instagram: { type: String, default: "" },
  tiktok: { type: String, default: "" },
  github: { type: String, default: "" },
  behance: { type: String, default: "" },
  pinterest: { type: String, default: "" },
  dribbble: { type: String, default: "" },
  website: { type: String, default: "" }
}, { _id: false });

/**
 * User Schema
 */
const UserSchema = new Schema({

  // ============================================
  // BASIC PROFILE
  // ============================================
  fullname: { type: String, default: "" },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    default: "",
    lowercase: true,
    trim: true,
    index: true
  },
  phone: { type: String, default: "" },
  studentId: { type: String, default: "" },
  level: { type: String, default: "" },
  religion: { type: String, default: "" },

  // ============================================
  // AUTHENTICATION
  // ============================================
  password: {
    type: String,
    required: true
  },

  emailVerified: {
    type: Boolean,
    default: true
  },

  emailVerificationToken: {
    type: String
  },

  resetPasswordToken: {
    type: String
  },

  resetPasswordExpires: {
    type: Date
  },

  resetPasswordCode: {
    type: String
  },

  resetPasswordCodeExpires: {
    type: Date
  },

  // ============================================
  // PROFILE & IDENTITY
  // ============================================
  profilePic: {
    type: String,
    default: ""
  },

  ninSlip: {
    type: String,
    default: ""
  },

  // ============================================
  // REFERRAL SYSTEM
  // ============================================
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },

  referredBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
    set: v => {
      if (v === '' || v === null || typeof v === 'undefined') return undefined;
      if (typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v)) return v;
      return undefined;
    }
  },
  totalReferrals: {
    type: Number,
    default: 0
  },

  referrals: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],

  // ============================================
  // FACULTY / DEPARTMENT
  // ============================================
  faculty: {
    type: Schema.Types.Mixed,
    ref: "Faculty",
    default: null
  },

  department: {
    type: Schema.Types.Mixed,
    ref: "Department",
    default: null
  },

  // ============================================
  // USER TYPE (new)
  // - Separates academic/account type (student/post_utme/alumni/staff/guest) from role/permissions
  // ============================================
  userType: {
    type: String,
    enum: ["student", "post_utme", "alumni", "staff", "guest"],
    default: "student",
    index: true
  },

  // ============================================
  // INSTITUTION (new)
  // - Reference to an Institution document to support multiple institutions
  // ============================================
  institution: {
  type: Schema.Types.ObjectId,
  ref: "Institution",
  default: new mongoose.Types.ObjectId("6a4ce9b3c137e30eefaa5382"),
  index: true,
  set: v => {
    if (v === '' || v === null || typeof v === 'undefined') {
      return new mongoose.Types.ObjectId("6a4ce9b3c137e30eefaa5382");
    }
    if (typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v)) {
      return v;
    }
    return v;
  }
},

  // ============================================
  // ROLES & PERMISSIONS
  // ============================================
  role: {
    type: String,
    enum: [
      "student",
      "tutor",
      "blogger",
      "pending_blogger",
      "pending_marketer",
      "pending_both",
      "uploader",
      "pq-uploader",
      "admin",
      "superadmin",
      "codec"
    ],
    default: "student",
    index: true
  },

  active: {
    type: Boolean,
    default: true
  },

  status: {
    type: String,
    enum: ["pending", "active", "banned"],
    default: "pending"
  },

  approved: {
    type: Boolean,
    default: false
  },

  // ============================================
  // TUTOR / PUBLIC PROFILE
  // ============================================
  specialties: {
    type: [String],
    default: []
  },

  about: {
    type: String,
    default: ""
  },

  achievements: {
    type: [String],
    default: []
  },

  socials: {
    type: socialSchema,
    default: {}
  },

  social: {
    facebook: { type: String, default: "" },
    twitter: { type: String, default: "" },
    instagram: { type: String, default: "" },
    tiktok: { type: String, default: "" },
    github: { type: String, default: "" },
    behance: { type: String, default: "" },
    pinterest: { type: String, default: "" },
    dribbble: { type: String, default: "" }
  },

  // ============================================
  // BANKING / PAYOUT
  // ============================================
  bank: { type: String },
  accountName: { type: String },
  accountNumber: { type: String },
  idType: { type: String },

  // ============================================
  // POINTS & REWARDS
  // ============================================
  creditPoints: {
    type: Number,
    default: 35
  },

  completedArticles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  }],

  isPremium: {
    type: Boolean,
    default: false
  },

  // ============================================
  // ACTIVATION KEYS
  // ============================================
  assignedActivationKey: {
    type: String,
    default: ""
  },

  activationKeyStatus: {
    type: String,
    enum: ["pending", "redeemed", "expired"],
    default: "pending"
  },

  // ============================================
  // OTHER PROFILE DATA
  // ============================================
  location: {
    type: String,
    default: ""
  },

  verification: {
    idDocument: {
      type: String,
      default: ""
    },

    proofOfAddress: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      default: "pending"
    }
  },

  dailyTasks: [{
    date: String,
    done: [String]
  }],

  verified: {
    type: Boolean,
    default: false
  },

  // ============================================
  // OFFERS / WISHLIST
  // ============================================
  offers: [{
    type: Schema.Types.ObjectId,
    ref: "Offer"
  }],

  wishlist: [{
    type: Schema.Types.ObjectId,
    ref: "Listing"
  }],

  points: {
    type: Number,
    default: 0
  },

  address: {
    type: String,
    default: ""
  },

  zip: {
    type: String,
    default: ""
  },

  bio: {
    type: String,
    default: ""
  },

  // ============================================
  // REWARD HISTORY
  // ============================================
  rewardHistory: {
    practiced: [{
      key: String,
      points: Number,
      date: {
        type: Date,
        default: Date.now
      }
    }],

    reading: [{
      postId: String,
      points: Number,
      date: {
        type: Date,
        default: Date.now
      }
    }],

    bonus: [{
      reason: String,
      points: Number,
      date: {
        type: Date,
        default: Date.now
      },
      by: String
    }],

    admin: [{
      reason: String,
      points: Number,
      date: {
        type: Date,
        default: Date.now
      },
      by: String
    }],

    referrals: [{
      referredUser: {
        type: Schema.Types.ObjectId,
        ref: "User"
      },

      points: {
        type: Number,
        default: 10
      },

      date: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // ============================================
  // TRACKING
  // ============================================
  lastLoginAt: {
    type: Date
  },

  meta: {
    type: Schema.Types.Mixed,
    default: {}
  },

  // ============================================
  // LECTURER DASHBOARD FIELDS
  // ============================================
  students: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],

  courses: [{
    _id: Schema.Types.ObjectId,
    title: String,
    code: String,
    description: String,
    level: String,
    students: [{
    type: Schema.Types.ObjectId,
    ref: "User"
}],
    questions: [Schema.Types.ObjectId],
    createdAt: { type: Date, default: Date.now }
  }],

  questions: [{
  _id: Schema.Types.ObjectId,
  course: Schema.Types.ObjectId,
  question: String,
  type: String,
  options: [{
    text: {
      type: String,
      default: ""
    },
    image: {
      type: String,
      default: ""
    }
  }],
  answer: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}],

  exams: [{
    _id: Schema.Types.ObjectId,
    course: Schema.Types.ObjectId,
    title: String,
    startDate: Date,
    endDate: Date,
    duration: Number,
    levels: [String],
    students: [Schema.Types.ObjectId],
    questions: [Schema.Types.ObjectId],
    status: String,
    createdAt: { type: Date, default: Date.now }
  }],

  results: [{
    _id: Schema.Types.ObjectId,
    student: Schema.Types.ObjectId,
    exam: Schema.Types.ObjectId,
    score: Number,
    grade: String,
    submittedAt: Date,
    duration: Number,
    status: String
  }],

  totalSubmissions: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 }

}, {
  timestamps: true
});

/**
 * Virtuals
 */
UserSchema.virtual("isTutor").get(function () {
  return this.role === "tutor";
});

UserSchema.virtual("isAdmin").get(function () {
  return ["admin", "superadmin"].includes(this.role);
});

/**
 * Auto Generate Referral Code
 */
UserSchema.pre("save", function(next) {
  if (!this.referralCode) {
    this.referralCode =
      `EG${crypto.randomBytes(4)
        .toString("hex")
        .toUpperCase()}`;
  }

  next();
});

/**
 * Sanitize Output
 */
UserSchema.methods.toJSON = function () {
  const obj = this.toObject({
    virtuals: true
  });

  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.resetPasswordCode;
  delete obj.resetPasswordCodeExpires;
  delete obj.__v;

  return obj;
};

/**
 * Compare Password
 */
UserSchema.methods.comparePassword = function(candidate) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(
      candidate,
      this.password,
      (err, isMatch) => {
        if (err) return reject(err);
        resolve(isMatch);
      }
    );
  });
};

/**
 * Generate Email Verification Token
 */
UserSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(24).toString("hex");
  this.emailVerificationToken = token;
  return token;
};

/**
 * Backward Compatibility Social Merge
 */
UserSchema.virtual("socialMerged").get(function() {
  const hasSocials =
    this.socials &&
    Object.keys(this.socials || {}).length > 0;

  if (hasSocials) {
    return this.socials;
  }

  return this.social || {};
});

/**
 * Indexes
 */
UserSchema.index(
  { username: 1 },
  { unique: true, background: true }
);

UserSchema.index(
  { email: 1 },
  { background: true }
);

UserSchema.index(
  { referralCode: 1 },
  { unique: true, sparse: true }
);

export default model("User", UserSchema);
