import express from "express";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import JSZip from "jszip";
import fetch from "node-fetch";

let tesseract = null;
try {
  // optional: only require if installed. OCR can be heavy.
  // npm i tesseract.js
  // eslint-disable-next-line import/no-extraneous-dependencies
  // dynamic import to avoid throwing when not installed
  // (in ESM we can use await import, but top-level await not used here)
  // We'll require lazily when needed.
} catch (e) {
  // ignore
}

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: (process.env.AI_MAX_FILE_MB ? Number(process.env.AI_MAX_FILE_MB) : 50) * 1024 * 1024 }
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.AI_EXTRACTION_KEY;

// Helpers
function uid(len = 6) {
  return crypto.randomBytes(Math.ceil(len / 2)).toString("hex").slice(0, len);
}

function estimatePagesFromSize(sizeBytes) {
  // heuristic: 1MB ~ 3 pages, clamp 1..50
  const pages = Math.max(1, Math.min(50, Math.round((sizeBytes / (1024 * 1024 || 1)) * 3)));
  return pages;
}

function chunkText(text, approxChars = 1500) {
  const out = [];
  if (!text) return out;
  let i = 0;
  while (i < text.length) {
    let chunk = text.slice(i, i + approxChars);
    // try to break at newline or sentence end
    const lastNewline = chunk.lastIndexOf("\n");
    const lastPeriod = chunk.lastIndexOf(". ");
    const splitAt = Math.max(lastNewline, lastPeriod);
    if (splitAt > Math.floor(approxChars * 0.5)) {
      chunk = chunk.slice(0, splitAt + 1);
      i += splitAt + 1;
    } else {
      i += approxChars;
    }
    out.push(chunk.trim());
  }
  return out;
}

function sanitizeXmlText(s) {
  return s.replace(/<a?:?[^>]+>/g, "").replace(/<\/[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function simulateKeypointsForChunk(text, chunkIndex, filename) {
  const seeds = ["Core concept", "Important formula", "Worked example", "Common pitfall", "Summary"];
  const n = 3 + Math.floor(Math.random() * 3);
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(`${seeds[(chunkIndex + i) % seeds.length]} — auto note for page ${chunkIndex + 1}`);
  }
  return out;
}

async function extractTextFromPdf(buffer) {
  try {
    const data = await pdfParse(buffer);
    // pdf-parse returns text; it may include page separators as '\f' in some cases but not reliable.
    const raw = data.text || "";
    return raw;
  } catch (e) {
    console.warn("PDF parse failed:", e.message || e);
    return "";
  }
}

async function extractTextFromDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (e) {
    console.warn("DOCX parse failed:", e.message || e);
    return "";
  }
}

async function extractTextFromPptx(buffer) {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files).filter(fn => fn.startsWith("ppt/slides/slide") && fn.endsWith(".xml")).sort();
    const texts = [];
    for (const slideFile of slideFiles) {
      const content = await zip.file(slideFile).async("string");
      // strip tags and collect
      const text = sanitizeXmlText(content);
      if (text) texts.push(text);
    }
    return texts.join("\n\n");
  } catch (e) {
    console.warn("PPTX parse failed:", e.message || e);
    return "";
  }
}

async function extractTextFromPlain(buffer) {
  try {
    return buffer.toString("utf8");
  } catch (e) {
    return "";
  }
}

async function extractTextFromImage(buffer) {
  // lazy require tesseract.js if available
  try {
    if (!tesseract) {
      // eslint-disable-next-line no-undef
      const mod = await import("tesseract.js");
      tesseract = mod;
    }
    const { createWorker } = tesseract;
    const worker = createWorker();
    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");
    const { data } = await worker.recognize(buffer);
    await worker.terminate();
    return data?.text || "";
  } catch (e) {
    console.warn("Tesseract OCR not available or failed:", e.message || e);
    return "";
  }
}

// Call Gemini generative API for a chunk and ask for keypoints
async function callGeminiForKeypoints(chunkText, fileName, pageIndex) {
  if (!GEMINI_API_KEY) throw new Error("No GEMINI_API_KEY configured");

  const systemPrompt = `
Extract concise page-level keypoints from the input content. Return JSON ONLY in this exact shape:
{ "keypoints": ["point 1", "point 2", ...] }
Each keypoint should be short (max 140 characters), focused, and phrased as educational bullet points suitable for study notes.
Do not include any extra commentary.
`;

  const userContent = `Filename: ${fileName}\nPage: ${pageIndex}\nContent:\n${chunkText}`;

  // Use the Generative Language (Gemini) text generation endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        parts: [
          { text: systemPrompt + "\n\n" + userContent }
        ]
      }
    ]
  };

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      throw new Error(`Gemini API error ${resp.status}: ${txt}`);
    }
    const json = await resp.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // attempt to extract JSON object from returned text
    // find first { and last } and parse substring
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const substr = text.slice(firstBrace, lastBrace + 1);
      try {
        const parsed = JSON.parse(substr);
        if (Array.isArray(parsed.keypoints)) return parsed.keypoints.map(k => String(k));
      } catch (e) {
        // fallback continue
      }
    }
    // fallback: attempt to parse lines as bullets
    const lines = text.split(/\r?\n/).map(l => l.replace(/^[\-\*\u2022]\s*/, "").trim()).filter(Boolean);
    if (lines.length) return lines.slice(0, 10);
    return [];
  } catch (e) {
    console.warn("Gemini call failed:", e.message || e);
    throw e;
  }
}

async function processFileAndExtract(file) {
  // file: multer file object (buffer, originalname, mimetype, size)
  const name = file.originalname || file.name || "file";
  const mimetype = (file.mimetype || "").toLowerCase();
  let rawText = "";

  // Determine handler by mimetype or extension
  try {
    if (mimetype === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
      rawText = await extractTextFromPdf(file.buffer);
    } else if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || name.toLowerCase().endsWith(".docx")) {
      rawText = await extractTextFromDocx(file.buffer);
    } else if (mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation" || name.toLowerCase().endsWith(".pptx")) {
      rawText = await extractTextFromPptx(file.buffer);
    } else if (mimetype.startsWith("text/") || name.toLowerCase().endsWith(".txt")) {
      rawText = await extractTextFromPlain(file.buffer);
    } else if (mimetype.startsWith("image/") || /\.(jpe?g|png|bmp|tiff|gif)$/i.test(name)) {
      // try OCR if tesseract available; else return empty
      rawText = await extractTextFromImage(file.buffer);
    } else {
      // fallback: try plain text read
      rawText = await extractTextFromPlain(file.buffer);
    }
  } catch (e) {
    console.warn("Extraction error:", e.message || e);
    rawText = "";
  }

  // If no text extracted, create an empty placeholder so simulation still works
  if (!rawText || rawText.trim().length === 0) {
    // create a placeholder page based on size
    const pagesCount = estimatePagesFromSize(file.size || 1024 * 1024);
    const pages = [];
    for (let p = 1; p <= pagesCount; p++) {
      pages.push({ page: p, content: `No textual content extracted from this file. (page ${p})` });
    }
    return { name, pages };
  }

  // Chunk the raw text into approximate pages
  const chunks = chunkText(rawText, 1600);
  const pages = chunks.map((c, idx) => ({ page: idx + 1, content: c }));
  return { name, pages };
}

// POST /extract  (expects to be mounted under /api/ai or /)
router.post("/extract", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded (field name must be 'file')" });

    // 1) Extract text locally into chunks/pages
    const extracted = await processFileAndExtract(req.file);
    const pages = extracted.pages || [];

    // 2) For each page chunk, send to Gemini (if configured) to get keypoints
    const resultsPages = [];
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      let keypoints = [];
      // Attempt to call Gemini if API key present
      if (GEMINI_API_KEY) {
        try {
          keypoints = await callGeminiForKeypoints(p.content, extracted.name, i + 1);
          // sometimes Gemini may return empty; fallback to simulation
          if (!Array.isArray(keypoints) || keypoints.length === 0) {
            keypoints = simulateKeypointsForChunk(p.content, i, extracted.name);
          }
        } catch (e) {
          // on any Gemini error, fallback to simulation
          keypoints = simulateKeypointsForChunk(p.content, i, extracted.name);
        }
      } else {
        // no API key: simulate
        keypoints = simulateKeypointsForChunk(p.content, i, extracted.name);
      }
      resultsPages.push({ page: p.page, keypoints });
    }

    const response = { pages: resultsPages, extractedAt: new Date().toISOString(), name: extracted.name };
    return res.json(response);
  } catch (e) {
    console.error("Extraction endpoint error:", e);
    return res.status(500).json({ error: e.message || "Extraction failed" });
  }
});

// POST /chat  (body: { fileName, message, context })
router.post("/chat", express.json(), async (req, res) => {
  try {
    const { fileName, message, context } = req.body || {};
    if (!message) return res.status(400).json({ error: "Missing message" });
    const pages = Array.isArray(context) ? context : [];
    // If GEMINI_API_KEY present, forward message with context to Gemini
    if (GEMINI_API_KEY) {
      try {
        const systemPrompt = `You are an expert tutor. Answer the user's question concisely using the provided extracted keypoints when relevant. If you cannot find relevant points, say you don't have that information. Return plain text.`;
        const content = `Filename: ${fileName || "unknown"}\nContext keypoints:\n${pages.flatMap(p => (p.keypoints || []).map(k => `- ${k}`)).join("\n")}\n\nUser question: ${message}`;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const body = {
          contents: [
            { parts: [{ text: systemPrompt + "\n\n" + content }] }
          ]
        };
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        if (!resp.ok) {
          const txt = await resp.text().catch(() => "");
          throw new Error(`Gemini chat error ${resp.status}: ${txt}`);
        }
        const j = await resp.json();
        const replyText = j?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return res.json({ reply: replyText });
      } catch (e) {
        console.warn("Gemini chat failed:", e.message || e);
        // fallback to simple simulated chat using keypoints
      }
    }

    // Fallback (no GEMINI or error): produce simple reply from keypoints
    const flat = pages.flatMap(p => (p.keypoints || []).map(k => k));
    if (!flat.length) {
      return res.json({ reply: `I don't have extracted content for "${fileName || 'this file'}". Run extraction first.` });
    }
    const qTokens = String(message || "").toLowerCase().split(/\s+/).filter(Boolean);
    let matches = flat.filter(k => qTokens.some(t => k.toLowerCase().includes(t)));
    if (!matches.length) matches = flat.slice(0, Math.min(6, flat.length));
    const reply = `Relevant keypoints:\n\n- ${matches.join("\n- ")}`;
    return res.json({ reply });
  } catch (e) {
    console.error("Chat endpoint error:", e);
    return res.status(500).json({ error: e.message || "Chat failed" });
  }
});

router.get("/status", (req, res) => {
  res.json({
    ok: true,
    geminiConfigured: !!GEMINI_API_KEY
  });
});

export default router;
