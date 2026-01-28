
import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import fetch from "node-fetch";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();
router.use(authenticate);

// memory multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// utility extractors
async function extractTextFromBuffer(buffer, mimetype, originalname) {
  if (/pdf$/i.test(originalname) || mimetype === "application/pdf") {
    const data = await pdfParse(buffer);
    return data.text || "";
  }
  if (/\.docx$/i.test(originalname) || mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const r = await mammoth.extractRawText({ buffer });
    return r.value || "";
  }
  // plaintext types
  if (mimetype === "text/plain" || /\.txt$/i.test(originalname) || /\.md$/i.test(originalname)) {
    return buffer.toString("utf8");
  }
  // fallback - try as utf8
  return buffer.toString("utf8");
}

// POST /api/studypadi/ai/convert-file
// fields: file (file), qtype (mcq|short|mixed), count (<=40), format (json|plain|gpt-examset), instructions (optional)
router.post("/convert-file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const qtype = (req.body.qtype || "mcq").toLowerCase();
    let count = parseInt(req.body.count) || 10;
    if (count < 1) count = 1;
    if (count > 40) count = 40; // enforce max
    const fmt = (req.body.format || "json").toLowerCase();
    const instructions = req.body.instructions || "";

    // extract text
    const text = await extractTextFromBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: "Could not extract meaningful text from file" });
    }

    if (!GEMINI_API_KEY) return res.status(500).json({ error: "Missing Gemini API key on server" });

    // build prompt: instruct to return JSON according to format choice
    let systemPrompt = "";
    // base instructions
    systemPrompt += `You are a university exam designer. Convert the provided document text into exactly ${count} ${qtype === 'mcq' ? 'multiple-choice' : (qtype==='short' ? 'short-answer' : 'questions (mixed MCQ and short-answer)')} questions. `;
    systemPrompt += `Output must be a single JSON object only. `;
    if (fmt === "json") {
      systemPrompt += `Return JSON with structure: { "title": "<inferred topic>", "questions": [ { "id": 1, "question": "...", "options": [{"text":"A"}, ...] (only for MCQ), "answer": "correct option or answer", "explanation": "short explanation" }, ... ] }. `;
    } else if (fmt === "gpt-examset") {
      systemPrompt += `Return JSON shaped for exam import: { "title":"<topic>", "status":"ACTIVE", "questions":[ { "id":1, "question":"...", "options":[{"text":"A"},...], "answer":"...", "explanation":"..." } ] }. `;
    } else {
      systemPrompt += `Return a JSON with a single key "raw" containing the text output in readable plain format. `;
    }
    if (instructions) systemPrompt += `Additional instructions: ${instructions}. `;
    systemPrompt += `Do not include any commentary or text outside the JSON. Ensure the JSON is valid.`;

    // request body to Gemini
    const apiBody = {
      contents: [
        {
          parts: [
            {
              text: systemPrompt + "\n\nDocument Text:\n" + text.slice(0, 20000) // limit text length if huge
            }
          ]
        }
      ]
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody)
      }
    );

    const data = await response.json();
    if (data.error || !data.candidates) {
      return res.status(500).json({ error: data.error?.message || "AI provider error", raw: data });
    }
    const rawText = data.candidates[0]?.content?.parts[0]?.text || "";

    // Try to parse JSON out of response; fallback to raw
    let parsed = null;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      // try to extract a JSON substring
      const m = rawText.match(/\{[\s\S]*\}$/m);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch(err) { parsed = null; }
      }
    }

    return res.json({ success: true, questions: parsed || null, raw: parsed ? null : rawText });
  } catch (err) {
    console.error("AI convert-file error:", err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
