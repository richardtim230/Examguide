/**
 * Affiliate Model V2 - Clean Schema
 * This is a fresh model without legacy field conflicts
 * Use this if you need to migrate to a new collection
 */

import mongoose from "mongoose";
import crypto from "crypto";

const affiliateSchemaV2 = new mongoose.Schema(
  {
    // ==================== PERSONAL INFO ====================
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [3, "Full name must be at least 3 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"]
    },
    
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
      sparse: true
    },
    
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      minlength: [7, "Phone number is too short"]
    },
    
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true
    },

    // ==================== COMPANY INFO ====================
    company: {
      type: String,
      required: [true, "Company/Organization name is required"],
      trim: true,
      minlength: [2, "Company name must be at least 2 characters"],
      maxlength: [150, "Company name cannot exceed 150 characters"]
    },
    
    website: {
      type: String,
      trim: true,
      default: null
    },
    
    affiliateType: {
      type: String,
      enum: {
        values: [
          "education_consultant",
          "agency",
          "education_partner",
          "technology_partner",
          "reseller",
          "other"
        ],
        message: "Invalid affiliate type"
      },
      required: [true, "Affiliate type is required"]
    },
    
    marketingChannels: {
      type: String,
      required: [true, "Marketing strategy is required"],
      trim: true,
      minlength: [10, "Please describe your marketing strategy in detail"]
    },

    // ==================== AFFILIATE CODE ====================
    affiliateCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      index: true
    },

    // ==================== AUTHENTICATION ====================
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false
    },
    
    emailVerified: {
      type: Boolean,
      default: false
    },
    
    emailVerificationToken: {
      type: String,
      select: false,
      default: null
    },

    // ==================== STATUS ====================
    status: {
      type: String,
      enum: {
        values: ["pending", "active", "suspended", "rejected", "inactive"],
        message: "Invalid status"
      },
      default: "pending",
      index: true
    },

    // ==================== COMMISSION & PAYMENT ====================
    commissionRate: {
      type: Number,
      enum: {
        values: [20, 25, 30],
        message: "Commission rate must be 20, 25, or 30"
      },
      default: 20
    },
    
    tier: {
      type: String,
      enum: {
        values: ["starter", "professional", "elite"],
        message: "Invalid tier"
      },
      default: "starter",
      index: true
    },
    
    paymentMethod: {
      type: String,
      enum: {
        values: ["bank_transfer", "paypal", "stripe", "none"],
        message: "Invalid payment method"
      },
      default: "none"
    },
    
    bankDetails: {
      accountName: { type: String, default: null },
      accountNumber: { type: String, default: null },
      bankName: { type: String, default: null },
      swiftCode: { type: String, default: null },
      routingNumber: { type: String, default: null }
    },
    
    paypalEmail: {
      type: String,
      default: null
    },
    
    stripeConnect: {
      accountId: { type: String, default: null },
      verified: { type: Boolean, default: false }
    },

    // ==================== PERFORMANCE METRICS ====================
    totalReferrals: {
      type: Number,
      default: 0,
      min: 0
    },
    
    successfulReferrals: {
      type: Number,
      default: 0,
      min: 0
    },
    
    referrals: [
      {
        name: String,
        email: { type: String, lowercase: true },
        username: String,
        registrationDate: {
          type: Date,
          default: Date.now
        },
        status: {
          type: String,
          enum: ["pending", "active", "inactive"],
          default: "pending"
        }
      }
    ],
    
    clicks: {
      type: Number,
      default: 0,
      min: 0
    },

    // ==================== FINANCIAL INFO ====================
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0
    },
    
    pendingEarnings: {
      type: Number,
      default: 0,
      min: 0
    },
    
    withdrawnEarnings: {
      type: Number,
      default: 0,
      min: 0
    },
    
    withdrawalHistory: [
      {
        amount: { type: Number, required: true, min: 0 },
        method: String,
        date: {
          type: Date,
          default: Date.now
        },
        status: {
          type: String,
          enum: ["pending", "completed", "failed"],
          default: "pending"
        },
        transactionId: String
      }
    ],

    // ==================== MARKETING MATERIALS ====================
    materialsAccess: {
      banners: { type: Boolean, default: false },
      emailTemplates: { type: Boolean, default: false },
      socialMedia: { type: Boolean, default: false },
      caseStudies: { type: Boolean, default: false },
      customMaterials: { type: Boolean, default: false }
    },

    // ==================== SUPPORT ====================
    dedicatedSupport: {
      type: Boolean,
      default: false
    },
    
    accountManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    
    coMarketingOpportunities: {
      type: Boolean,
      default: false
    },
    
    acceptsMarketing: {
      type: Boolean,
      default: true
    },

    // ==================== ADMIN FIELDS ====================
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    
    approvalDate: Date,
    
    rejectionReason: String,
    
    notes: String,
    
    lastActivityDate: Date,
    
    ipAddress: String,
    
    userAgent: String,

    // ==================== SOFT DELETE ====================
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    
    deletedAt: Date,
    
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // ==================== METADATA ====================
    source: {
      type: String,
      enum: {
        values: ["web", "mobile", "api", "admin"],
        message: "Invalid source"
      },
      default: "web"
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ==================== INDEXES ====================
// Compound indexes for better query performance
affiliateSchemaV2.index({ email: 1 }, { unique: true, sparse: true });
affiliateSchemaV2.index({ affiliateCode: 1 }, { unique: true, sparse: true });
affiliateSchemaV2.index({ status: 1, isDeleted: 1 });
affiliateSchemaV2.index({ tier: 1, isDeleted: 1 });
affiliateSchemaV2.index({ createdAt: -1 });
affiliateSchemaV2.index({ email: 1, isDeleted: 1 });

// ==================== VIRTUALS ====================
affiliateSchemaV2.virtual("conversionRate").get(function () {
  if (this.clicks === 0) return 0;
  return parseFloat(((this.successfulReferrals / this.clicks) * 100).toFixed(2));
});

affiliateSchemaV2.virtual("totalEarningsStr").get(function () {
  return `$${this.totalEarnings.toFixed(2)}`;
});

// ==================== PRE-SAVE HOOKS ====================
affiliateSchemaV2.pre("save", async function (next) {
  try {
    // Generate unique affiliate code if not exists
    if (!this.affiliateCode) {
      let code, exists;
      let attempts = 0;
      const maxAttempts = 20;

      do {
        code = `EXAM-${crypto.randomBytes(6).toString("hex").toUpperCase().slice(0, 10)}`;
        exists = await mongoose.model("AffiliateV2").findOne({
          affiliateCode: code,
          isDeleted: false
        });
        attempts++;
      } while (exists && attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        throw new Error("Failed to generate unique affiliate code after multiple attempts");
      }

      this.affiliateCode = code;
    }

    // Update last activity date
    this.lastActivityDate = new Date();

    next();
  } catch (error) {
    next(error);
  }
});

// ==================== INSTANCE METHODS ====================
affiliateSchemaV2.methods.softDelete = async function (deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

affiliateSchemaV2.methods.restore = async function () {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  return this.save();
};

affiliateSchemaV2.methods.calculateExpectedEarnings = function (monthlyPrice = 99) {
  return this.successfulReferrals * monthlyPrice * (this.commissionRate / 100);
};

affiliateSchemaV2.methods.updateTier = async function () {
  const oldTier = this.tier;
  const oldRate = this.commissionRate;

  if (this.successfulReferrals >= 50) {
    this.tier = "elite";
    this.commissionRate = 30;
  } else if (this.successfulReferrals >= 20) {
    this.tier = "professional";
    this.commissionRate = 25;
  } else {
    this.tier = "starter";
    this.commissionRate = 20;
  }

  if (oldTier !== this.tier) {
    console.log(`Affiliate ${this._id}: tier upgraded from ${oldTier} to ${this.tier}`);
  }

  return this.save();
};

affiliateSchemaV2.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  return obj;
};

// ==================== STATIC METHODS ====================
affiliateSchemaV2.statics.findActive = function () {
  return this.find({ isDeleted: false, status: "active" });
};

affiliateSchemaV2.statics.findPending = function () {
  return this.find({ status: "pending" });
};

affiliateSchemaV2.statics.findByCode = async function (code) {
  return this.findOne({
    affiliateCode: code,
    isDeleted: false
  });
};

affiliateSchemaV2.statics.findByEmail = async function (email) {
  return this.findOne({
    email: email.toLowerCase(),
    isDeleted: false
  });
};

// ==================== QUERY HELPERS ====================
affiliateSchemaV2.query.active = function () {
  return this.find({ isDeleted: false });
};

affiliateSchemaV2.query.withoutPassword = function () {
  return this.select("-password -emailVerificationToken");
};

affiliateSchemaV2.query.byStatus = function (status) {
  return this.find({ status, isDeleted: false });
};

// ==================== EXPORT ====================
export default mongoose.model("AffiliateV2", affiliateSchemaV2);
