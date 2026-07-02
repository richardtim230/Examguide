// 
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const ChatMaterialSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: "User", default: null },
  filename: { type: String, required: true },
  originalName: { type: String },
  mimeType: { type: String },
  size: { type: Number },
  text: { type: String, default: "" },        // main extracted text (pdf/mammoth/txt)
  ocrText: { type: String, default: "" },     // OCR fallback for images/scanned PDFs
  summary: { type: String, default: "" },     // cached summary
  metadata: { type: Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false }
});

ChatMaterialSchema.virtual("textLength").get(function() {
  return (this.text || "").length + (this.ocrText || "").length;
});

export default model("ChatMaterial", ChatMaterialSchema);
