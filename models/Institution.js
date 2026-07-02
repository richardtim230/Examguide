import mongoose from "mongoose";
const { Schema, model } = mongoose;

const InstitutionSchema = new Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, index: true, trim: true },
  domain: { type: String, default: "" }, // optional: primary domain for the institution
  meta: { type: Schema.Types.Mixed, default: {} } // extra data (campuses, default settings, etc)
}, {
  timestamps: true
});

InstitutionSchema.pre("save", function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, "-");
  }
  next();
});

export default model("Institution", InstitutionSchema);
