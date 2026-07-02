// routes/chatbot.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import ChatMaterial from "../models/ChatMaterial.js";
import ChatSession from "../models/ChatSession.js";
import ChatMessage from "../models/ChatMessage.js";
import auth from "../middleware/auth.js";
import { checkCreditsMiddleware, globalLimiter } from "../middleware/rateLimitUser.js";
import { extractText } from "../services/extract.js";
import { sendToGemini, streamToGemini } from "../services/gemini.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// upload dir
const uploadDir = path.join(process.cwd(), "uploads", "chatbot");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniq = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || "";
    cb(null, `${uniq}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.CHATBOT_MAX_UPLOAD || String(25 * 1024 * 1024)) }, // default 25MB
});

// --- Upload material ---
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const ownerId = req.user?._id || null;
    const fp = req.file.path;
    const mime = req.file.mimetype;

    const { text, ocrText } = await extractText(fp, mime);

    const material = await ChatMaterial.create({
      owner: ownerId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: mime,
      size: req.file.size,
      text,
      ocrText,
      metadata: { uploadedBy: ownerId, uploadedAt: new Date() }
    });

    return res.status(201).json({ success: true, materialId: material._id, extractedPreview: (text || ocrText || "").slice(0, 800) });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ success: false, message: "Upload failed", error: String(err.message) });
  }
});

// --- Create or resume session ---
router.post("/session", auth, async (req, res) => {
  try {
    const { sessionId, title, materialIds = [] } = req.body;
    if (sessionId) {
      const session = await ChatSession.findOne({ _id: sessionId, owner: req.user._id });
      if (!session) return res.status(404).json({ success: false, message: "Session not found" });
      return res.json({ success: true, session });
    }
    const s = await ChatSession.create({ owner: req.user._id, title: title || "New session", materials: materialIds || [] });
    return res.status(201).json({ success: true, session: s });
  } catch (err) {
    console.error("Session error:", err);
    return res.status(500).json({ success: false, message: "Session error" });
  }
});

/**
 * POST /api/chatbot/generate
 * - body: { sessionId, materialId, action, options }
 * - uses credits via checkCreditsMiddleware
 */
router.post("/generate", auth, globalLimiter, checkCreditsMiddleware({
  costFn: async (req) => {
    // estimate cost: e.g., base 2 credits + 1 credit per 1000 chars in material excerpt
    const chars = ((req.body && req.body.materialId) ? 1000 : 500); // simplified estimate
    const cost = 2 + Math.ceil(chars / 2000);
    return { cost };
  }
}), async (req, res) => {
  try {
    const { materialId, action, options = {}, sessionId } = req.body;
    if (!materialId) return res.status(400).json({ success: false, message: "materialId required" });

    const material = await ChatMaterial.findById(materialId).lean();
    if (!material) return res.status(404).json({ success: false, message: "Material not found" });

    // Build prompt
    const excerpt = (material.text || material.ocrText || "").slice(0, 20000);
    let prompt = "";
    if (action === "summarize") {
      prompt = `Summarize the following material into a clear study guide (5-12 bullets) and include 3 short practice questions:\n\n${excerpt}`;
    } else if (action === "generate_practice") {
      const count = parseInt(options.count || 5, 10);
      prompt = `From the material below, create ${count} practice questions with short answers. Include a mix of MCQ and short-answer questions:\n\n${excerpt}`;
    } else if (action === "explain") {
      const highlight = options.highlight || "";
      prompt = `Explain the following material in simple terms. If a highlight string is provided, focus on that portion.\n\nMaterial:\n${excerpt}\n\nHighlight:\n${highlight}`;
    } else {
      return res.status(400).json({ success: false, message: "Unknown action" });
    }

    const messages = [
      { role: "system", content: "You are ExamGuard AI Tutor. Provide helpful, concise, student-friendly outputs." },
      { role: "user", content: prompt }
    ];

    // call Gemini (non-streaming for generation endpoint)
    const out = await sendToGemini(messages, { temperature: 0.2, maxTokens: 1200 });

    // store session & message history
    let session = null;
    if (sessionId) session = await ChatSession.findOne({ _id: sessionId, owner: req.user._id });
    if (!session) session = await ChatSession.create({ owner: req.user._id, title: `Session ${new Date().toISOString()}`, materials: [material._id] });

    const userMsg = await ChatMessage.create({ session: session._id, role: "user", content: prompt, createdBy: req.user._id, costCredits: 0 });
    const assistantMsg = await ChatMessage.create({ session: session._id, role: "assistant", content: out, createdBy: null, costCredits: req.charge?.cost || 0 });

    session.lastMessageAt = new Date();
    if (!session.materials.includes(material._id)) session.materials.push(material._id);
    await session.save();

    return res.status(200).json({ success: true, result: out, charge: req.charge || { cost: 0 } });
  } catch (err) {
    console.error("Generate error:", err);
    return res.status(500).json({ success: false, message: "Generation failed", error: String(err.message) });
  }
});

/**
 * POST /api/chatbot/message
 * - standard chat (non-stream)
 * - body: { sessionId, message, materialIds }
 */
router.post("/message", auth, globalLimiter, checkCreditsMiddleware({
  costFn: async (req) => {
    // cost proportional to message length (1 credit per 1000 chars, min 1)
    const body = req.body || {};
    const len = (body.message || "").length || 0;
    const cost = Math.max(1, Math.ceil(len / 1000));
    return { cost };
  }
}), async (req, res) => {
  try {
    const { sessionId, message, materialIds = [] } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ success: false, message: "Message required" });

    // Compose context snippets
    let context = "";
    if (Array.isArray(materialIds) && materialIds.length > 0) {
      const ids = materialIds.slice(0, 3);
      const mats = await ChatMaterial.find({ _id: { $in: ids } }).lean();
      context = mats.map(m => `Material: ${m.originalName || m.filename}\nExcerpt:\n${(m.text || m.ocrText || "").slice(0, 2000)}`).join("\n\n---\n\n");
    }

    const fullPrompt = `${context ? `Context:\n${context}\n\n` : ""}User question:\n${message}`;

    const messages = [
      { role: "system", content: "You are ExamGuard AI Tutor. Be concise, accurate, and cite material when appropriate." },
      { role: "user", content: fullPrompt }
    ];

    const responseText = await sendToGemini(messages, { temperature: 0.2, maxTokens: 800 });

    // persist session & messages
    let session = null;
    if (sessionId) session = await ChatSession.findOne({ _id: sessionId, owner: req.user._id });
    if (!session) session = await ChatSession.create({ owner: req.user._id, title: `Session ${new Date().toISOString()}`, materials: materialIds.slice(0,3) });

    const userMsg = await ChatMessage.create({ session: session._id, role: "user", content: message, createdBy: req.user._id, costCredits: 0 });
    const assistantMsg = await ChatMessage.create({ session: session._id, role: "assistant", content: responseText, createdBy: null, costCredits: req.charge?.cost || 0 });

    session.lastMessageAt = new Date();
    if (Array.isArray(materialIds) && materialIds.length) {
      session.materials = Array.from(new Set(session.materials.concat(materialIds.slice(0,3))));
    }
    await session.save();

    return res.status(200).json({ success: true, reply: responseText, charge: req.charge || { cost: 0 } });
  } catch (err) {
    console.error("Message error:", err);
    return res.status(500).json({ success: false, message: "Chat failed", error: String(err.message) });
  }
});

/**
 * Streaming chat endpoint using Server-Sent Events (SSE).
 * Client opens a connection to /api/chatbot/message-stream and sends JSON body via POST (fetch won't allow body on EventSource; we use POST that returns SSE response).
 *
 * Example: fetch('/api/chatbot/message-stream', { method: 'POST', headers: {...}, body: JSON.stringify({ message, materialIds, sessionId })})
 *
 * The server responds with Content-Type: text/event-stream and pushes data chunks as they are received from Gemini via streamToGemini.
 */
router.post("/message-stream", auth, globalLimiter, checkCreditsMiddleware({
  costFn: async (req) => {
    const len = (req.body && req.body.message ? req.body.message.length : 0);
    const cost = Math.max(1, Math.ceil(len / 750)); // smaller divisor for streaming estimate
    return { cost };
  }
}), async (req, res) => {
  // NOTE: express body-parsers typically consume body before we set SSE headers.
  // Ensure you use raw body parsing or place this route before JSON body parser middleware if you want to stream while parsing chunked requests.
  try {
    const { sessionId, message, materialIds = [] } = req.body || {};
    if (!message) return res.status(400).json({ success: false, message: "Message required" });

    // Build context from materials
    let contextParts = [];
    if (Array.isArray(materialIds) && materialIds.length > 0) {
      const ids = materialIds.slice(0, 3);
      const mats = await ChatMaterial.find({ _id: { $in: ids } }).lean();
      for (const m of mats) {
        contextParts.push(`Material: ${m.originalName || m.filename}\nExcerpt:\n${(m.text || m.ocrText || "").slice(0, 2000)}`);
      }
    }

    const systemMsg = "You are ExamGuard AI Tutor. Be helpful and cite material when referencing it.";
    const userPrompt = `${contextParts.length ? `Context:\n${contextParts.join("\n\n---\n\n")}\n\n` : ""}User question:\n${message}`;

    const messages = [
      { role: "system", content: systemMsg },
      { role: "user", content: userPrompt }
    ];

    // Prepare session/message storage before streaming
    let session = null;
    if (sessionId) session = await ChatSession.findOne({ _id: sessionId, owner: req.user._id });
    if (!session) session = await ChatSession.create({ owner: req.user._id, title: `Stream ${new Date().toISOString()}`, materials: materialIds.slice(0,3) });

    // create initial user message record
    const userMsg = await ChatMessage.create({ session: session._id, role: "user", content: message, createdBy: req.user._id, costCredits: 0 });

    // Start SSE response
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    });
    res.flushHeaders && res.flushHeaders();

    // Helper to send SSE events
    const sendEvent = (event, data) => {
      res.write(`event: ${event}\n`);
      // ensure data is single-line chunks by replacing newlines with double newline protocol
      const chunk = typeof data === "string" ? data : JSON.stringify(data);
      res.write(`data: ${chunk}\n\n`);
    };

    // streamToGemini will call onChunk for each chunk
    let accumulated = "";
    const onChunk = (chunk) => {
      try {
        // push chunk to client
        sendEvent("chunk", chunk);
        accumulated += chunk;
      } catch (err) {
        console.warn("onChunk error:", err);
      }
    };

    const streaming = await streamToGemini(messages, { temperature: 0.2, maxTokens: 1200 }, onChunk);

    // wait for final completion
    const finalText = await streaming.wait;

    // store assistant final message
    const assistantMsg = await ChatMessage.create({ session: session._id, role: "assistant", content: finalText, costCredits: req.charge?.cost || 0 });

    session.lastMessageAt = new Date();
    session.materials = Array.from(new Set(session.materials.concat(materialIds.slice(0,3))));
    await session.save();

    // send final event and close
    sendEvent("done", { text: finalText, charge: req.charge || { cost: 0 } });
    res.end();
  } catch (err) {
    console.error("Stream error:", err);
    try {
      res.write(`event: error\ndata: ${JSON.stringify({ message: String(err.message) })}\n\n`);
      res.end();
    } catch (e) {}
  }
});

export default router;
