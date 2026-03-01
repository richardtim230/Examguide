

import express from "express";
import multer from "multer";
import crypto from "crypto";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: (process.env.AI_MAX_FILE_MB ? Number(process.env.AI_MAX_FILE_MB) : 50) * 1024 * 1024 }
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.AI_EXTRACTION_KEY;
const AI_EXTRACTION_URL = process.env.AI_EXTRACTION_URL || null;
const AI_CHAT_URL = process.env.AI_CHAT_URL || null;

/* Helpers */
function uid(len = 6) {
  return crypto.randomBytes(Math.ceil(len / 2)).toString("hex").slice(0, len);
}
function generateKeypoints(name, p, n = 3) {
  const seeds = ["Core concept", "Important formula", "Worked example", "Common pitfall", "Summary"];
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(`${seeds[(p + i) % seeds.length]} — note for page ${p} (${name})`);
  }
  return out;
}
function estimatePagesFromSize(sizeBytes) {
  // heuristic: 1MB ~ 3 pages, clamp 1..50
  const pages = Math.max(1, Math.min(50, Math.round((sizeBytes / (1024 * 1024)) * 3)));
  return pages;
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* Local simulation of extraction (keeps same shape as expected) */
async function simulateProcessingLocal(file) {
  const pagesCount = estimatePagesFromSize(file.size || (1024 * 1024));
  const pages = [];
  for (let p = 1; p <= pagesCount; p++) {
    // small delay to mimic processing
    await sleep(80 + Math.random() * 140);
    pages.push({ page: p, keypoints: generateKeypoints(file.originalname || file.name || "file", p, 3 + Math.floor(Math.random() * 2)) });
  }
  return { pages, extractedAt: new Date().toISOString(), name: file.originalname || file.name || "file" };
}

/* Optional: forward to an external extraction service (best-effort).
   Attempts JSON base64 POST; if upstream requires multipart/form-data you'd add form-data usage. */
async function forwardToExtractionService(file) {
  if (!AI_EXTRACTION_URL) throw new Error("No extraction service configured");
  try {
    const body = {
      filename: file.originalname || file.name || "file",
      content_base64: file.buffer.toString("base64")
    };
    const headers = { "Content-Type": "application/json" };
    if (GEMINI_API_KEY) headers["Authorization"] = `Bearer ${GEMINI_API_KEY}`;
    const resp = await fetch(AI_EXTRACTION_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      // timeout handling could be added here if desired
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      throw new Error(`Upstream extraction error ${resp.status}: ${txt}`);
    }
    const json = await resp.json();
    // Expect upstream to return { pages: [...], extractedAt, name } — validate shape loosely:
    if (!json || !Array.isArray(json.pages)) throw new Error("Upstream returned unexpected shape");
    return json;
  } catch (e) {
    // rethrow so callers can fallback to simulation
    throw e;
  }
}

/* Chat forwarding (best-effort). If AI_CHAT_URL is configured, forward message; otherwise simulate. */
async function forwardToChatService(target, message) {
  if (!AI_CHAT_URL) throw new Error("No chat service configured");
  try {
    const headers = { "Content-Type": "application/json" };
    if (GEMINI_API_KEY) headers["Authorization"] = `Bearer ${GEMINI_API_KEY}`;
    const resp = await fetch(AI_CHAT_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ fileName: target.name, message, context: target.pages || [] })
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      throw new Error(`Upstream chat error ${resp.status}: ${txt}`);
    }
    const json = await resp.json();
    // expect { reply: '...' } or similar
    if (typeof json.reply === "string") return json.reply;
    if (typeof json.answer === "string") return json.answer;
    // fallback: return whole payload as string
    return JSON.stringify(json);
  } catch (e) {
    throw e;
  }
}

/* Endpoint: POST /api/ai/extract
   - field name: file
   - returns: { pages: [{page, keypoints: []}, ...], extractedAt, name }
*/
router.post("/api/ai/extract", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded (field name must be 'file')" });

    // If an upstream extraction service is configured, try to forward first.
    if (AI_EXTRACTION_URL) {
      try {
        const upstream = await forwardToExtractionService(req.file);
        // ensure shape
        const result = {
          pages: Array.isArray(upstream.pages) ? upstream.pages : [],
          extractedAt: upstream.extractedAt || new Date().toISOString(),
          name: upstream.name || req.file.originalname
        };
        return res.json(result);
      } catch (err) {
        // Log and fall back to simulation
        console.warn("AI extraction forwarding failed, falling back to local simulation:", err.message || err);
      }
    }

    // Local simulation fallback
    const simulated = await simulateProcessingLocal(req.file);
    res.json(simulated);
  } catch (e) {
    console.error("Extract error:", e);
    res.status(500).json({ error: e.message || "Extraction failed" });
  }
});

/* Endpoint: POST /api/ai/chat
   - body: { fileName, message }
   - returns: { reply: '...' }
   - If upstream AI_CHAT_URL exists, forward; otherwise simulate using extracted keypoints if provided.
*/
router.post("/api/ai/chat", express.json(), async (req, res) => {
  try {
    const { fileName, message, context } = req.body || {};
    if (!message) return res.status(400).json({ error: "Missing message" });

    const target = { id: uid(8), name: fileName || "unknown", pages: Array.isArray(context) ? context : [] };

    // If upstream chat endpoint provided, forward
    if (AI_CHAT_URL) {
      try {
        const upstreamReply = await forwardToChatService(target, message);
        return res.json({ reply: upstreamReply });
      } catch (err) {
        console.warn("AI chat forwarding failed, falling back to local simulation:", err.message || err);
      }
    }

    // Local simulated reply using available keypoints
    const flat = (target.pages || []).flatMap((p) => Array.isArray(p.keypoints) ? p.keypoints : []);
    if (!flat.length) {
      // no extraction context available — produce a helpful fallback
      return res.json({ reply: `I don't have extracted content for "${target.name}" yet. Try running extraction first (Scan).` });
    }

    // crude relevance: find keypoints containing any token from query
    const qTokens = message.toLowerCase().split(/\s+/).filter(Boolean);
    let matches = flat.filter(k => qTokens.some(t => k.toLowerCase().includes(t)));
    if (!matches.length) matches = flat.slice(0, Math.min(6, flat.length));
    const reply = `Relevant keypoints:\n\n- ${matches.map(s => s.replace(/\n+/g,' ')).join('\n- ')}`;
    return res.json({ reply });
  } catch (e) {
    console.error("Chat error:", e);
    res.status(500).json({ error: e.message || "Chat failed" });
  }
});

/* Optional health/status endpoint for this router */
router.get("/api/ai/status", (req, res) => {
  res.json({
    ok: true,
    extraction: !!AI_EXTRACTION_URL,
    chat: !!AI_CHAT_URL,
    geminiConfigured: !!GEMINI_API_KEY
  });
});

export default router;
