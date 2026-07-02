import mongoose from "mongoose";
const { Schema, model } = mongoose;

/**
 * Institution schema
 *
 * Fields:
 * - name: canonical display name (unique, case-insensitive)
 * - slug: url-friendly slug generated from name (ensured unique)
 * - abbreviation: short code / acronym, e.g. "OAU"
 * - domain: optional primary domain for the institution
 * - isDefault: mark default institution (useful if frontend sends "OAU")
 * - meta: freeform data (campuses, settings, etc)
 */
const InstitutionSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, index: true, trim: true },
  abbreviation: { type: String, default: "", trim: true },
  domain: { type: String, default: "", trim: true },
  isDefault: { type: Boolean, default: false },
  meta: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false, transform: (doc, ret) => { ret.id = ret._id; delete ret._id; } },
  toObject: { virtuals: true }
});

/**
 * Case-insensitive unique index on name.
 * Note: For full case-insensitive uniqueness you must ensure the collection index uses the collation
 * { locale: "en", strength: 2 } (Mongoose will create the index with that collation if possible).
 */
InstitutionSchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

/**
 * Utility: basic slugify that keeps a-z0-9 and uses dashes.
 */
function slugify(text = "") {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFKD")                // normalize accents
    .replace(/[\u0300-\u036F]/g, "")  // remove diacritics
    .replace(/[^a-z0-9]+/g, "-")      // replace non-alphanum with dash
    .replace(/(^-|-$)+/g, "")         // trim leading/trailing dash
    .substr(0, 120);                  // enforce sensible length
}

/**
 * Ensure slug exists and is unique (append numeric suffix when needed).
 */
InstitutionSchema.pre("save", async function(next) {
  if (!this.name) return next();

  if (!this.slug || this.isModified("name")) {
    let base = slugify(this.slug || this.name);
    if (!base) base = `${Date.now()}`;
    let candidate = base;
    let suffix = 0;

    // check uniqueness and increment suffix until free
    // use this.constructor to access the model
    // exclude current doc by _id (for updates)
    // loop with a reasonable safeguard
    const Model = this.constructor;
    while (true) {
      const existing = await Model.findOne({ slug: candidate, _id: { $ne: this._id } }).lean().exec();
      if (!existing) break;
      suffix += 1;
      candidate = `${base}-${suffix}`;
      if (suffix > 1000) break; // safety
    }
    this.slug = candidate;
  }

  // normalize abbreviation (upper-case, trimmed)
  if (this.abbreviation) {
    this.abbreviation = this.abbreviation.trim().toUpperCase();
  }

  next();
});

/**
 * Static helper: find by name (case-insensitive) or create a new institution.
 * Accepts either a name string or an object { name, abbreviation, domain, isDefault }.
 * Returns the Institution document (created or found).
 */
InstitutionSchema.statics.findOrCreateByName = async function(input) {
  const Model = this;
  if (!input) return null;

  let payload;
  if (typeof input === "string") {
    payload = { name: input.trim() };
  } else if (typeof input === "object" && input.name) {
    payload = { name: input.name.trim(), abbreviation: input.abbreviation || "", domain: input.domain || "", isDefault: !!input.isDefault };
  } else {
    throw new Error("Invalid input for findOrCreateByName");
  }

  // case-insensitive search using regex anchored
  const existing = await Model.findOne({ name: { $regex: `^${escapeRegExp(payload.name)}$`, $options: "i" } }).collation({ locale: "en", strength: 2 }).exec();
  if (existing) return existing;

  // create new document
  const created = await Model.create(payload);
  return created;
};

/**
 * Helper to escape regex special chars
 */
function escapeRegExp(string = "") {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default model("Institution", InstitutionSchema);
