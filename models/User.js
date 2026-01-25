
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const { Schema, model } = mongoose;

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

const UserSchema = new Schema({
  // Basic profile
  fullname: { type: String, default: "" },
  username: { type: String, required: true, unique: true, trim: true, index: true },
  email: { type: String, default: "", lowercase: true, trim: true, index: true },
  phone: { type: String, default: "" },
  studentId: { type: String, default: "" },
  level: { type: String, default: "" },
  religion: { type: String, default: "" },

  // Authentication
  password: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  // Profile picture & identity
  profilePic: { type: String, default: "" },
  ninSlip: { type: String, default: "" },

  // Relational / legacy mixed fields
  faculty: { type: Schema.Types.Mixed, ref: "Faculty", default: null },
  department: { type: Schema.Types.Mixed, ref: "Department", default: null },

  // Role / permissions
  role: {
    type: String,
    enum: [
      "student", "tutor", "blogger", "pending_blogger", "pending_marketer",
      "pending_both", "uploader", "pq-uploader", "admin", "superadmin", "codec"
    ],
    default: "student",
    index: true
  },
  active: { type: Boolean, default: true },
  status: { type: String, enum: ["pending", "active", "banned"], default: "pending" },
  approved: { type: Boolean, default: false }, // used for tutors

  // Tutor-specific / public profile fields (added)
  specialties: { type: [String], default: [] },
  about: { type: String, default: "" },
  achievements: { type: [String], default: [] },
  socials: { type: socialSchema, default: {} }, // alias/duplicate of `social` for compatibility

  // Legacy 'social' kept
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

  // Financial / payouts
  bank: { type: String },
  accountName: { type: String },
  accountNumber: { type: String },
  idType: { type: String },
  creditPoints: { type: Number, default: 35 },
  isPremium: { type: Boolean, default: false },

  // Activation keys / verification
  assignedActivationKey: { type: String, default: "" },
  activationKeyStatus: { type: String, enum: ["pending", "redeemed", "expired"], default: "pending" },

  // Other profile
  location: { type: String, default: "" },
  verification: {
    idDocument: { type: String, default: "" },
    proofOfAddress: { type: String, default: "" },
    status: { type: String, default: "pending" }
  },
  dailyTasks: [
    {
      date: { type: String }, // "YYYY-MM-DD"
      done: [String]
    }
  ],
  verified: { type: Boolean, default: false },

  // Meta fields used elsewhere
  offers: [{ type: Schema.Types.ObjectId, ref: "Offer" }],
  wishlist: [{ type: Schema.Types.ObjectId, ref: "Listing" }],
  institution: { type: String, default: "" },
  points: { type: Number, default: 0 },
  address: { type: String, default: "" },
  zip: { type: String, default: "" },
  bio: { type: String, default: "" },

  // Reward history
  rewardHistory: {
    practiced: [{ key: String, points: Number, date: { type: Date, default: Date.now } }],
    reading: [{ postId: String, points: Number, date: { type: Date, default: Date.now } }],
    bonus: [{ reason: String, points: Number, date: { type: Date, default: Date.now }, by: String }],
    admin: [{ reason: String, points: Number, date: { type: Date, default: Date.now }, by: String }]
  },

  // tracking
  lastLoginAt: { type: Date },
  meta: { type: Schema.Types.Mixed, default: {} },

}, {
  timestamps: true
});

/**
 * Virtuals
 */
UserSchema.virtual("isTutor").get(function () { return this.role === "tutor"; });
UserSchema.virtual("isAdmin").get(function () { return ["admin","superadmin"].includes(this.role); });

/**
 * Sanitize JSON output: remove sensitive fields
 */
UserSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.__v;
  return obj;
};

/**
 * Password hashing (bcryptjs)
 */
const SALT_ROUNDS = 10;
UserSchema.pre("save", function (next) {
  try {
    if (!this.isModified("password")) return next();
    const salt = bcrypt.genSaltSync(SALT_ROUNDS);
    this.password = bcrypt.hashSync(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

/**
 * Compare candidate password with stored hash
 * Returns a Promise<boolean> to keep compatibility with async usage
 */
UserSchema.methods.comparePassword = function (candidate) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(candidate, this.password, (err, isMatch) => {
      if (err) return reject(err);
      resolve(isMatch);
    });
  });
};

/**
 * Generate email verification token
 */
UserSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(24).toString("hex");
  this.emailVerificationToken = token;
  return token;
};

/**
 * Keep backwards-compatible `socials` mapping to/from `social`.
 */
UserSchema.virtual("socialMerged").get(function () {
  const hasSocials = this.socials && Object.keys(this.socials || {}).length > 0;
  if (hasSocials) return this.socials;
  return this.social || {};
});

/**
 * Indexes
 */
UserSchema.index({ username: 1 }, { unique: true, background: true });
UserSchema.index({ email: 1 }, { background: true });

export default model("User", UserSchema);
