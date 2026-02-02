import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import fetch from "node-fetch";
import mongoose from "mongoose";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();
router.use(authenticate);

// =================== SavedSet Model ===================
const SavedSetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, default: "" },
  questions: { type: mongoose.Schema.Types.Mixed, default: null }, // array or string or object
  raw: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });
const SavedSet = mongoose.models.SavedSet || mongoose.model("SavedSet", SavedSetSchema);

// =================== Multer Config ====================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ============ Document Text Extraction ================
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

function normalizeOptions(rawOptions) {
  if (!rawOptions) return null;
  if (Array.isArray(rawOptions)) {
    // array of strings or objects
    return rawOptions.map(o => {
      if (typeof o === 'string') return o;
      if (o && typeof o === 'object') {
        // common keys: text, option, value
        return String(o.text ?? o.option ?? o.value ?? o.label ?? JSON.stringify(o));
      }
      return String(o);
    });
  }
  if (typeof rawOptions === 'object') {
    // map keyed object (A,B,C -> text)
    const keys = Object.keys(rawOptions).sort();
    return keys.map(k => rawOptions[k]);
  }
  return null;
}

// Normalize single question into { id, question, options:[], answer, explanation }
function normalizeQuestion(q, index = 0) {
  if (!q || typeof q !== 'object') {
    return { id: index + 1, question: String(q || ''), options: null, answer: null, explanation: null };
  }
  const id = q.id ?? q._id ?? (index + 1);
  const questionText = q.question ?? q.text ?? q.prompt ?? q.title ?? q.stem ?? '';
  const options = normalizeOptions(q.options ?? q.choices ?? q.answers ?? q.options_list ?? q.opts);
  // Accept answer in many shapes: letter "A", index 0, value string matching option, or object
  let answer = q.answer ?? q.correct ?? q.key ?? q.solution ?? q.answerKey ?? null;
  if (answer && typeof answer === 'object') {
    // try common shapes
    answer = answer.value ?? answer.text ?? answer.label ?? null;
  }
  // If answer is index encoded as string "0" or "1", keep as number
  if (typeof answer === 'string' && answer.trim().match(/^[0-9]+$/)) {
    answer = parseInt(answer.trim(), 10);
  }
  // If answer is a single uppercase letter A/B/C map to index
  if (typeof answer === 'string' && /^[A-Z]$/i.test(answer.trim())) {
    const letter = answer.trim().toUpperCase();
    answer = letter.charCodeAt(0) - 65; // A->0
  }
  const explanation = q.explanation ?? q.expl ?? q.reason ?? q.hint ?? q.meta?.explanation ?? null;
  return { id, question: String(questionText), options, answer, explanation };
}

// Normalize parsed AI object into { title, questions: [..] | null, raw: string | null }
function normalizeAiParsed(parsed) {
  const result = { title: '', questions: null, raw: null };

  if (!parsed) return result;

  // Title heuristics
  result.title = parsed.title ?? parsed.examTitle ?? parsed.setTitle ?? parsed.topic ?? '';

  // Try to extract questions from common properties
  let rawQuestions = null;
  if (Array.isArray(parsed.questions)) rawQuestions = parsed.questions;
  else if (Array.isArray(parsed.items)) rawQuestions = parsed.items;
  else if (Array.isArray(parsed.data)) rawQuestions = parsed.data;
  else if (Array.isArray(parsed.raw)) rawQuestions = parsed.raw;

  // Some providers return questions as an object with numeric keys or letters
  if (!rawQuestions && parsed.questions && typeof parsed.questions === 'object') {
    const maybe = parsed.questions;
    // if keys are numeric or lettered -> convert to array
    if (Object.keys(maybe).length) {
      const arr = Object.values(maybe);
      if (Array.isArray(arr) && arr.length) rawQuestions = arr;
    }
  }

  // If parsed is an array itself (rare, but handle)
  if (!rawQuestions && Array.isArray(parsed)) rawQuestions = parsed;

  // If rawQuestions is an array -> normalize each item
  if (rawQuestions && Array.isArray(rawQuestions) && rawQuestions.length) {
    try {
      result.questions = rawQuestions.map((qq, idx) => normalizeQuestion(qq, idx));
    } catch (_e) {
      result.questions = rawQuestions;
    }
    return result;
  }

  // If parsed.raw is a string - return as raw text
  if (typeof parsed.raw === 'string' && parsed.raw.trim().length) {
    result.raw = parsed.raw;
    return result;
  }

  // If parsed is a string (AI returned text) try JSON parse -> if fails treat as raw
  if (typeof parsed === 'string') {
    try {
      const p = JSON.parse(parsed);
      return normalizeAiParsed(p);
    } catch (e) {
      result.raw = parsed;
      return result;
    }
  }

  // Fallbacks: if parsed contains text-like fields e.g. text/content/answerText
  if (typeof parsed.content === 'string' && parsed.content.trim()) {
    result.raw = parsed.content;
  } else if (parsed.text && typeof parsed.text === 'string') {
    result.raw = parsed.text;
  } else {
    // last resort: store pretty JSON as raw
    result.raw = JSON.stringify(parsed, null, 2);
  }

  return result;
}

// ========= Convert File =============
// POST /api/studypadi/ai/convert-file
// fields: file (file), qtype (mcq|short|mixed), count (<=40), format (json|plain|gpt-examset), instructions (optional)
router.post("/convert-file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const qtype = (req.body.qtype || "mcq").toLowerCase();
    let count = parseInt(req.body.count) || 10;
    if (count < 1) count = 1;
    if (count > 40) count = 40;
    const fmt = (req.body.format || "json").toLowerCase();
    const instructions = req.body.instructions || "";

    // extract text
    const text = await extractTextFromBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: "Could not extract meaningful text from file" });
    }

    if (!GEMINI_API_KEY) return res.status(500).json({ error: "Missing Gemini API key on server" });

    // build prompt
    let systemPrompt = "";
    systemPrompt += `You are a university exam designer. Convert the provided document text into exactly ${count} ${qtype === 'mcq' ? 'multiple-choice' : (qtype==='short' ? 'short-answer' : 'questions')} questions. `;
    systemPrompt += `Output must be a single JSON object only. `;
    if (fmt === "json") {
      systemPrompt += `Return JSON with structure: { "title": "<inferred topic>", "questions": [ { "id": 1, "question": "...", "options": ["A text", "B text"...] (only for MCQ), "answer": "A" or 0 , "explanation": "..." } ] } `;
    } else if (fmt === "gpt-examset") {
      systemPrompt += `Return JSON shaped for exam import: { "title":"<topic>", "status":"ACTIVE", "questions":[ { "id":1, "question":"...", "options":[ "A", "B", ...], "answer":"...", "explanation":"..." } ] }`;
    } else {
      systemPrompt += `Return a JSON with a single key "raw" containing the text output in readable plain format. `;
    }
    if (instructions) systemPrompt += `Additional instructions: ${instructions}. `;
    systemPrompt += `Do not include any commentary or text outside the JSON. Ensure the JSON is valid and fully OAU CBT EXAM STANDARD, your questions should be as a renowned examiner and direct questions, tricky and intellectual, dont reference the material or document by saying acccording to the material or the like, be smart.`;

    // request body to Gemini
    const apiBody = {
      contents: [
        {
          parts: [
            {
              text: systemPrompt + "\n\nDocument Text:\n" + text.slice(0, 20000) // trim if too long
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
        try { parsed = JSON.parse(m[0]); } catch (err) { parsed = null; }
      }
    }

    // Persist this set for the user (for history/saved sets)
    let setTitle = "";
    let setQuestions = null, setRaw = null;
    if (parsed) {
      const normalized = normalizeAiParsed(parsed);
      setTitle = normalized.title || req.file.originalname || "Untitled";
      // store normalized questions array if available, otherwise null
      setQuestions = normalized.questions && normalized.questions.length ? normalized.questions : null;
      setRaw = normalized.raw || null;
    } else {
      setTitle = req.file.originalname || "Untitled";
      setRaw = rawText;
    }

    const savedSet = await SavedSet.create({
      user: req.user.id,
      title: setTitle,
      questions: setQuestions,
      raw: setRaw,
      createdAt: new Date()
    });

    // Return normalized shape to client
    const returnObj = parsed ? normalizeAiParsed(parsed) : { title: setTitle, questions: null, raw: setRaw };
    return res.json({ success: true, title: returnObj.title || setTitle, questions: returnObj.questions, raw: returnObj.raw, setId: savedSet._id });

  } catch (err) {
    console.error("AI convert-file error:", err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

// =================== Saved Sets List & Aliases =====================

// Helper: list sets for user
async function listSavedSets(userId) {
  // Return saved sets without __v and limited to 100
  const sets = await SavedSet.find({ user: userId }).sort({ createdAt: -1 }).limit(100).select("-__v");
  // Map to stable client-friendly shape
  return sets.map(s => ({
    _id: s._id,
    title: s.title,
    questions: s.questions || null,
    raw: s.raw || null,
    createdAt: s.createdAt
  }));
}
function setsListHandler(req, res) {
  listSavedSets(req.user.id)
    .then(sets => res.json(sets))
    .catch(err => {
      console.error("Error fetching AI saved sets:", err);
      res.status(500).json({ error: "Server error" });
    });
}

// Aliased list endpoints
router.get("/sets", setsListHandler);
router.get("/history", setsListHandler);
router.get("/list", setsListHandler);
router.get("/previous", setsListHandler);

// =================== Single Set Fetching ========================
async function getSingleSet(req, res) {
  try {
    const set = await SavedSet.findOne({ _id: req.params.id, user: req.user.id });
    if (!set) return res.status(404).json({ error: "Not found" });
    // Normalize before return
    const normalized = {
      _id: set._id,
      title: set.title,
      createdAt: set.createdAt,
      questions: Array.isArray(set.questions) ? set.questions.map((q, i) => normalizeQuestion(q, i)) : null,
      raw: typeof set.raw === 'string' && set.raw.length ? set.raw : null
    };
    res.json(normalized);
  } catch (err) {
    console.error("Error fetching single saved set:", err);
    res.status(500).json({ error: "Server error" });
  }
}
router.get("/sets/:id", getSingleSet);
router.get("/history/:id", getSingleSet);
router.get("/get/:id", getSingleSet);
router.get("/:id", getSingleSet);

export default router;
