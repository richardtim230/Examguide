import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const { Schema, model } = mongoose;

const socialSchema = new Schema({
  facebook: { type: String, default: "" },
  twitter: { type: String, default: "" },
  instagram: { type: String, default: "" },
  tiktok: { type: String, default: "" },
  youtube: { type: String, default: "" },
  whatsapp: { type: String, default: "" },
  telegram: { type: String, default: "" },
  website: { type: String, default: "" }
}, { _id: false });

const RCCG_UserSchema = new Schema({
  // Personal Information
  fullName: { 
    type: String, 
    required: true, 
    trim: true,
    index: true 
  },
  email: { 
    type: String, 
    required: true,
    unique: true, 
    lowercase: true, 
    trim: true, 
    index: true,
    match: [/.+@.+\..+/, "Please provide a valid email address"]
  },
  phone: { 
    type: String, 
    required: true,
    trim: true,
    index: true
  },
  dateOfBirth: { 
    type: Date,
    default: null 
  },
  gender: { 
    type: String, 
    enum: ["male", "female", "other"],
    default: null
  },

  // Authentication
  password: { 
    type: String, 
    required: true,
    minlength: 8
  },
  emailVerified: { 
    type: Boolean, 
    default: true 
  },
  emailVerificationToken: { 
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  resetPasswordToken: { 
    type: String,
    default: null
  },
  resetPasswordExpires: { 
    type: Date,
    default: null
  },

  // Church Membership Information
  membershipStatus: {
    type: String,
    enum: ["visitor", "member", "associate_member", "elder", "deacon", "pastor", "staff"],
    default: "visitor",
    index: true
  },
  membershipNumber: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  joinDate: {
    type: Date,
    default: null
  },
  transferFrom: {
    type: String,
    default: ""
  },
  maritalStatus: {
    type: String,
    enum: ["single", "married", "widowed", "divorced"],
    default: null
  },

  // Location Information
  address: { 
    type: String, 
    default: "" 
  },
  city: { 
    type: String, 
    default: "" 
  },
  state: { 
    type: String, 
    default: "Osun",
    index: true
  },
  country: { 
    type: String, 
    default: "Nigeria" 
  },
  zipCode: { 
    type: String, 
    default: "" 
  },

  // Profile Information
  profileImage: { 
    type: String, 
    default: "" 
  },
  profileImagePublicId: {
    type: String,
    default: null
  },
  bio: { 
    type: String, 
    default: "",
    maxlength: 500
  },
  designation: {
    type: String,
    default: ""
  },
  profession: {
    type: String,
    default: ""
  },

  // Church Departments & Ministries
  departments: [{
    type: Schema.Types.ObjectId,
    ref: "RCCG_Department"
  }],
  ministries: [{
    type: Schema.Types.ObjectId,
    ref: "RCCG_Ministry"
  }],
  primaryMinistry: {
    type: Schema.Types.ObjectId,
    ref: "RCCG_Ministry",
    default: null
  },
  roles: [{
    type: String,
    enum: ["member", "usher", "choir", "prayer_warrior", "bible_study_leader", "youth_leader", "women_leader", "men_leader", "volunteer"]
  }],

  // Giving & Financial Information
  givingRecords: [{
    _id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    type: {
      type: String,
      enum: ["tithe", "offering", "seed", "project", "emergency"],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: "NGN"
    },
    method: {
      type: String,
      enum: ["bank_transfer", "card", "cash", "mobile_money", "ussd"],
      default: null
    },
    reference: String,
    description: String,
    date: {
      type: Date,
      default: Date.now
    },
    confirmed: {
      type: Boolean,
      default: false
    },
    confirmedBy: {
      type: Schema.Types.ObjectId,
      ref: "RCCG_User",
      default: null
    }
  }],
  totalGiving: {
    type: Number,
    default: 0
  },
  bankDetails: {
    accountName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    bankName: { type: String, default: "" },
    accountType: { type: String, default: "" }
  },

  // Attendance & Events
  attendanceRecords: [{
    _id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    event: {
      type: Schema.Types.ObjectId,
      ref: "RCCG_Event"
    },
    eventName: String,
    eventType: {
      type: String,
      enum: ["sunday_service", "bible_study", "vigil", "seminar", "training", "other"]
    },
    date: {
      type: Date,
      required: true
    },
    checkedInAt: Date,
    checkedOutAt: Date
  }],

  // Events Registered
  registeredEvents: [{
    type: Schema.Types.ObjectId,
    ref: "RCCG_Event"
  }],

  // Prayer Requests & Follow-up
  prayerRequests: [{
    _id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    title: String,
    description: String,
    category: {
      type: String,
      enum: ["health", "finance", "family", "business", "spiritual", "other"]
    },
    status: {
      type: String,
      enum: ["open", "answered", "closed"],
      default: "open"
    },
    isConfidential: { type: Boolean, default: true },
    submittedAt: { type: Date, default: Date.now },
    prayersOffered: { type: Number, default: 0 }
  }],

  // Referral System
  referralCode: { 
    type: String, 
    unique: true, 
    sparse: true, 
    index: true 
  },
  referredBy: {
    type: Schema.Types.ObjectId,
    ref: "RCCG_User",
    default: null
  },
  referrals: [{
    type: Schema.Types.ObjectId,
    ref: "RCCG_User"
  }],
  totalReferrals: {
    type: Number,
    default: 0
  },

  // Notifications & Preferences
  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: true },
    whatsappNotifications: { type: Boolean, default: true },
    eventReminders: { type: Boolean, default: true },
    sermonUpdates: { type: Boolean, default: true },
    announcementUpdates: { type: Boolean, default: true },
    givingUpdates: { type: Boolean, default: false },
    prayerUpdates: { type: Boolean, default: false }
  },

  // Verification & Security
  verified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    default: null
  },
  verificationCodeExpires: {
    type: Date,
    default: null
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    default: null
  },

  // Admin Information
  userType: {
    type: String,
    enum: ["admin", "staff", "member", "guest"],
    default: "member",
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: "RCCG_User",
    default: null
  },
  approvalDate: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  lastActivityAt: {
    type: Date,
    default: null
  },

  // Saved Items
  savedSermons: [{
    type: Schema.Types.ObjectId,
    ref: "RCCG_Sermon"
  }],
  savedAnnouncements: [{
    type: Schema.Types.ObjectId,
    ref: "RCCG_Announcement"
  }],

  // Social Media
  socialMedia: {
    type: socialSchema,
    default: {}
  },

  // Metadata
  meta: {
    type: Schema.Types.Mixed,
    default: {}
  },
  notes: {
    type: String,
    default: ""
  },
  internalTags: [{
    type: String
  }],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date,
    default: null
  }

}, { timestamps: true });

// Indexes
RCCG_UserSchema.index({ email: 1, deletedAt: 1 });
RCCG_UserSchema.index({ phone: 1, deletedAt: 1 });
RCCG_UserSchema.index({ membershipNumber: 1 }, { unique: true, sparse: true });
RCCG_UserSchema.index({ membershipStatus: 1, deletedAt: 1 });
RCCG_UserSchema.index({ state: 1, deletedAt: 1 });
RCCG_UserSchema.index({ createdAt: -1 });
RCCG_UserSchema.index({ departments: 1 });
RCCG_UserSchema.index({ ministries: 1 });

// Virtual for display name
RCCG_UserSchema.virtual("displayName").get(function() {
  return this.fullName || this.email;
});

// Virtual for is staff
RCCG_UserSchema.virtual("isStaff").get(function() {
  return ["admin", "staff"].includes(this.userType);
});

// Virtual for is admin
RCCG_UserSchema.virtual("isAdmin").get(function() {
  return this.userType === "admin";
});

// Pre-save hooks
RCCG_UserSchema.pre("save", async function(next) {
  try {
    // Generate membership number if not exists
    if (!this.membershipNumber) {
      const count = await mongoose.model("RCCG_User").countDocuments();
      this.membershipNumber = `RCCG-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;
    }

    // Generate referral code if not exists
    if (!this.referralCode) {
      this.referralCode = `RCCG${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
    }

    // Hash password if modified
    if (this.isModified("password")) {
      if (this.password.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    // Update the updatedAt timestamp
    this.updatedAt = new Date();

    next();
  } catch (error) {
    next(error);
  }
});

// Methods
RCCG_UserSchema.methods.toJSON = function() {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.verificationCode;
  delete obj.verificationCodeExpires;
  delete obj.twoFactorSecret;
  delete obj.__v;
  return obj;
};

RCCG_UserSchema.methods.comparePassword = function(candidate) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(candidate, this.password, (err, isMatch) => {
      if (err) return reject(err);
      resolve(isMatch);
    });
  });
};

RCCG_UserSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

RCCG_UserSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = token;
  this.resetPasswordExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
  return token;
};

RCCG_UserSchema.methods.generateVerificationCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCode = code;
  this.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return code;
};

RCCG_UserSchema.methods.addGivingRecord = function(givingData) {
  this.givingRecords.push(givingData);
  this.totalGiving += givingData.amount;
  return this.save();
};

RCCG_UserSchema.methods.markAttendance = function(eventData) {
  this.attendanceRecords.push({
    ...eventData,
    checkedInAt: new Date()
  });
  return this.save();
};

export default mongoose.models.RCCG_User || model("RCCG_User", RCCG_UserSchema);
