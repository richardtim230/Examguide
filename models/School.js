import mongoose from "mongoose";
import crypto from "crypto";

const { Schema, model } = mongoose;

const schoolSchema = new Schema({
  // School Identification
  schoolId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
    trim: true
    // Format: SCH-ABBREV-XXXXXX (auto-generated)
  },

  abbreviation: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: 5,
    sparse: true
  },

  // Basic School Information
  schoolName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  schoolType: {
    type: String,
    required: true,
    enum: ["primary", "secondary", "tertiary", "private", "other"],
    default: "secondary"
  },

  foundedYear: {
    type: Number,
    min: 1900,
    max: 2099,
    sparse: true
  },

  regNumber: {
    type: String,
    trim: true,
    sparse: true
  },

  motto: {
    type: String,
    trim: true,
    default: ""
  },

  // Student & Staff Info
  studentCount: {
    type: Number,
    required: true,
    min: 1
  },

  staffCount: {
    type: Number,
    default: 0,
    min: 0
  },

  classCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Location Information
  country: {
    type: String,
    required: true,
    trim: true
  },

  state: {
    type: String,
    trim: true,
    default: ""
  },

  city: {
    type: String,
    trim: true,
    default: ""
  },

  address: {
    type: String,
    trim: true,
    default: ""
  },

  postalCode: {
    type: String,
    trim: true,
    default: ""
  },

  // Contact Information
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    index: true
  },

  phone: {
    type: String,
    required: true,
    trim: true
  },

  secondaryEmail: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true
  },

  altPhone: {
    type: String,
    trim: true,
    default: ""
  },

  website: {
    type: String,
    trim: true,
    sparse: true
  },

  // Leadership Information
  principal: {
    type: String,
    trim: true,
    default: ""
  },

  principalEmail: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true
  },

  // Admin Contact Information
  adminName: {
    type: String,
    required: true,
    trim: true
  },

  adminEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
    index: true
  },

  adminPhone: {
    type: String,
    required: true,
    trim: true
  },

  // Branding
  logoUrl: {
    type: String,
    default: ""
  },

  logoFileName: {
    type: String,
    default: ""
  },

  description: {
    type: String,
    trim: true,
    default: ""
  },

  // Academic Programs/Offerings
  programs: [
    {
      type: String,
      enum: ["english", "mathematics", "sciences", "arts", "vocational", "sports"]
    }
  ],

  // Account Information
  subscriptionPlan: {
    type: String,
    enum: ["starter", "professional", "enterprise"],
    default: "starter"
  },

  subscriptionStatus: {
    type: String,
    enum: ["trial", "active", "inactive", "suspended"],
    default: "trial"
  },

  subscriptionStartDate: {
    type: Date,
    default: Date.now
  },

  subscriptionEndDate: {
    type: Date,
    sparse: true
  },

  // Features Enabled (based on subscription plan)
  featuresEnabled: {
    studentManagement: { type: Boolean, default: true },
    grading: { type: Boolean, default: true },
    feeManagement: { type: Boolean, default: false },
    attendance: { type: Boolean, default: true },
    parentPortal: { type: Boolean, default: false },
    staffManagement: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
    mobileApps: { type: Boolean, default: false }
  },

  // Storage & Limits
  storageUsed: {
    type: Number,
    default: 0 // in MB
  },

  storageLimit: {
    type: Number,
    default: 5000 // in MB
  },

  maxUsers: {
    type: Number,
    default: 100
  },

  currentUsers: {
    type: Number,
    default: 0
  },

  // Status
  status: {
    type: String,
    enum: ["active", "inactive", "suspended", "pending"],
    default: "active",
    index: true
  },

  suspensionReason: {
    type: String,
    trim: true,
    default: ""
  },

  // API Access
  apiKey: {
    type: String,
    sparse: true,
    unique: true,
    index: true
  },

  isApiEnabled: {
    type: Boolean,
    default: false
  },

  // Account Manager Reference
  accountManager: {
    type: Schema.Types.ObjectId,
    ref: "User",
    sparse: true
  },

  // Audit Trail
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    sparse: true
  },

  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    sparse: true
  },

  // Tags & Notes
  tags: [String],

  internalNotes: {
    type: String,
    trim: true,
    default: ""
  },

  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },

  deletedAt: {
    type: Date,
    sparse: true
  },

  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    sparse: true
  }
}, {
  timestamps: true
});

// ===== INDEXES =====
schoolSchema.index({ schoolName: 1, email: 1 });
schoolSchema.index({ subscriptionStatus: 1 });
schoolSchema.index({ status: 1 });
schoolSchema.index({ schoolId: 1, status: 1 });
schoolSchema.index({ createdAt: -1 });

// ===== VIRTUALS =====
schoolSchema.virtual("displayName").get(function () {
  return `${this.schoolName}${this.abbreviation ? ` (${this.abbreviation})` : ""}`;
});

// ===== METHODS =====

/**
 * Generate School ID
 * Format: SCH-ABBREV-RANDOM
 */
schoolSchema.methods.generateSchoolId = function () {
  if (!this.abbreviation && !this.schoolName) {
    throw new Error("School name or abbreviation is required to generate ID");
  }

  const abbrev = (this.abbreviation || this.schoolName.substring(0, 3)).toUpperCase();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  this.schoolId = `SCH-${abbrev}-${random}`;
  return this.schoolId;
};

/**
 * Generate API Key
 */
schoolSchema.methods.generateApiKey = function () {
  this.apiKey = `sch_${crypto.randomBytes(32).toString("hex")}`;
  this.isApiEnabled = true;
  return this.apiKey;
};

/**
 * Soft Delete
 */
schoolSchema.methods.softDelete = function (userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.status = "inactive";
  return this.save();
};

/**
 * Convert to JSON (remove sensitive fields)
 */
schoolSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.apiKey;
  delete obj.__v;
  return obj;
};

// ===== HOOKS =====

/**
 * Pre-save: Auto-generate schoolId if not present
 */
schoolSchema.pre("save", function (next) {
  if (!this.schoolId) {
    try {
      this.generateSchoolId();
    } catch (err) {
      return next(err);
    }
  }
  next();
});

/**
 * Pre-find: Exclude deleted schools by default
 */
schoolSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

/**
 * Pre-countDocuments: Exclude deleted schools by default
 */
schoolSchema.pre(/^countDocuments/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

export default model("School", schoolSchema);
