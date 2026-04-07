import mongoose from "mongoose";
import crypto from "crypto";

const affiliateSchema = new mongoose.Schema(
  {
    // Personal Information
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [3, "Full name must be at least 3 characters"]
    },
    email: {
  type: String,
  required: [true, "Email is required"],
  unique: true,
  lowercase: true,
  match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
  sparse: true,  // Allow multiple null values
  trim: true
},
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true
    },

    // Company Information
    company: {
      type: String,
      required: [true, "Company/Organization name is required"],
      trim: true,
      minlength: [2, "Company name must be at least 2 characters"]
    },
    website: {
      type: String,
      trim: true,
      default: ""
    },
    affiliateType: {
      type: String,
      enum: [
        "education_consultant",
        "agency",
        "education_partner",
        "technology_partner",
        "reseller",
        "other"
      ],
      required: [true, "Affiliate type is required"]
    },
    marketingChannels: {
      type: String,
      required: [true, "Marketing strategy is required"],
      minlength: [10, "Please describe your marketing strategy in detail"]
    },

    // Affiliate Code (Unique)
    affiliateCode: {
      type: String,
      unique: true,
      required: false,
      uppercase: true,
      sparse: true
    },

    // Account Settings
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false // Don't return password by default
    },

    // Status & Verification
    status: {
      type: String,
      enum: ["pending", "active", "suspended", "rejected", "inactive"],
      default: "pending"
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String,
      select: false
    },

    // Commission & Payment
    commissionRate: {
      type: Number,
      enum: [20, 25, 30],
      default: 20,
      description: "Commission percentage for referrals"
    },
    tier: {
      type: String,
      enum: ["starter", "professional", "elite"],
      default: "starter"
    },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "paypal", "stripe", "none"],
      default: "none"
    },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      swiftCode: String,
      routingNumber: String
    },
    paypalEmail: String,
    stripeConnect: {
      accountId: String,
      verified: Boolean
    },

    // Performance Metrics
    totalReferrals: {
      type: Number,
      default: 0
    },
    successfulReferrals: {
      type: Number,
      default: 0
    },
    referrals: [
      {
        name: String,
        email: String,
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
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    },

    // Financial Info
    totalEarnings: {
      type: Number,
      default: 0
    },
    pendingEarnings: {
      type: Number,
      default: 0
    },
    withdrawnEarnings: {
      type: Number,
      default: 0
    },
    withdrawalHistory: [
      {
        amount: Number,
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

    // Marketing Materials Access
    materialsAccess: {
      banners: {
        type: Boolean,
        default: false
      },
      emailTemplates: {
        type: Boolean,
        default: false
      },
      socialMedia: {
        type: Boolean,
        default: false
      },
      caseStudies: {
        type: Boolean,
        default: false
      },
      customMaterials: {
        type: Boolean,
        default: false
      }
    },

    // Support & Communication
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

    // Admin Fields
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    approvalDate: Date,
    rejectionReason: String,
    notes: String,
    lastActivityDate: Date,
    ipAddress: String,
    userAgent: String,

    // Metadata
    source: {
      type: String,
      enum: ["web", "mobile", "api", "admin"],
      default: "web"
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
affiliateSchema.index({ affiliateCode: 1 });
affiliateSchema.index({ email: 1 });
affiliateSchema.index({ status: 1 });
affiliateSchema.index({ tier: 1 });
affiliateSchema.index({ createdAt: -1 });

// Generate unique affiliate code before saving
affiliateSchema.pre("save", async function (next) {
  if (!this.affiliateCode) {
    let code, exists;
    do {
      code = `EXAM-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
      exists = await mongoose.model("Affiliate").findOne({ affiliateCode: code });
    } while (exists);
    this.affiliateCode = code;
  }
  next();
});

// Virtual for conversion rate calculation
affiliateSchema.virtual("calculatedConversionRate").get(function () {
  if (this.clicks === 0) return 0;
  return ((this.successfulReferrals / this.clicks) * 100).toFixed(2);
});

// Method to soft delete
affiliateSchema.methods.softDelete = async function (deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// Method to calculate expected commission
affiliateSchema.methods.calculatePendingEarnings = function () {
  const monthlySubscriptionPrice = 99; // Adjust based on your pricing
  return this.successfulReferrals * monthlySubscriptionPrice * (this.commissionRate / 100);
};

// Method to update tier based on referrals
affiliateSchema.methods.updateTier = async function () {
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
  return this.save();
};

// Don't include soft deleted records by default
affiliateSchema.query.active = function () {
  return this.find({ isDeleted: false });
};

export default mongoose.model("Affiliate", affiliateSchema);
