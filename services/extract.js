// 
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

// Tesseract OCR (optional)
let tesseract;
try { tesseract = await import("node-tesseract-ocr"); } catch (e) { /* optional */ }

let visionClient;
if (process.env.OCR_PROVIDER === "gcv") {
  // Google Cloud Vision client
  const { ImageAnnotatorClient } = await import('@google-cloud/vision');
  visionClient = new ImageAnnotatorClient(); // uses GOOGLE_APPLICATION_CREDENTIALS
}

/**
 * extractText(filePath, mimeType) => { text, ocrText }
 * - attempts PDF extraction first, then DOCX, then plaintext,
 * - uses OCR for images and scanned PDFs (if enabled)
 */
export async function extractText(filePath, mimeType) {
  const lower = (mimeType || "").toLowerCase();
  let text = "";
  let ocrText = "";

  if (lower === "application/pdf") {
    try {
      const buf = fs.readFileSync(filePath);
      const pdf = await pdfParse(buf);
      text = pdf.text || "";
      // if text is very short and PDF likely scanned, run OCR if configured
      if ((!text || text.trim().length < 50) && (process.env.OCR_ENABLED === "true")) {
        ocrText = await runOCR(filePath);
      }
    } catch (err) {
      console.warn("PDF parse failed:", err);
      if (process.env.OCR_ENABLED === "true") ocrText = await runOCR(filePath);
    }
  } else if (lower === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || path.extname(filePath).toLowerCase() === ".docx") {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value || "";
    } catch (err) {
      console.warn("Mammoth extraction failed:", err);
      if (process.env.OCR_ENABLED === "true") ocrText = await runOCR(filePath);
    }
  } else if (lower === "text/plain") {
    text = fs.readFileSync(filePath, "utf8");
  } else if (lower.startsWith("image/")) {
    if (process.env.OCR_ENABLED === "true") ocrText = await runOCR(filePath);
  } else {
    // fallback: try mammoth for docx-like files, else OCR if enabled
    try {
      const res = await mammoth.extractRawText({ path: filePath });
      text = res.value || "";
    } catch (err) {
      if (process.env.OCR_ENABLED === "true") ocrText = await runOCR(filePath);
    }
  }

  return { text: text || "", ocrText: ocrText || "" };
}

/**
 * runOCR(filePath) -> string
 * - supports OCR_PROVIDER env var: "tesseract" or "gcv"
 */
async function runOCR(filePath) {
  const provider = (process.env.OCR_PROVIDER || "tesseract").toLowerCase();
  if (provider === "gcv" && visionClient) {
    try {
      const [result] = await visionClient.textDetection(filePath);
      const annotations = result.textAnnotations || [];
      return annotations.length ? annotations[0].description || "" : "";
    } catch (err) {
      console.warn("GCV OCR failed:", err);
      return "";
    }
  } else {
    // tesseract fallback
    if (!tesseract) {
      console.warn("Tesseract not available. Install node-tesseract-ocr and system tesseract.");
      return "";
    }
    try {
      const config = {
        lang: process.env.TESSERACT_LANG || "eng",
        oem: 1,
        psm: 3
      };
      const text = await tesseract.recognize(filePath, config);
      return text || "";
    } catch (err) {
      console.warn("Tesseract OCR failed:", err);
      return "";
    }
  }
}
