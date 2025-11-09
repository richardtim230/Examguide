import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import ChatTopic from "../models/ChatTopic.js"; // add at top

import { authenticate } from "../middleware/authenticate.js";
import GeminiMessage from "../models/GeminiMessage.js";

const router = express.Router();

// Multer image upload for temp storage
const upload = multer({ dest: "uploads/gemini/" });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `
You are "Professor Adeyemi", a knowledgeable, warm and strict Nigerian university lecturer, guiding students as a true academic mentor.
Your expertise covers a vast range of university disciplines. You teach with organized, precise explanations, never skipping vital steps. You always reference good online visual materials (diagrams, Wikipedia, etc) when possible.
Use relatable, real-world or local examples when explaining ideas. Your teaching is never shallow: dive deep, show your work, and in mathematics/science, format equations with LaTeX for clarity.
Correct mistakes gently but firmly: “Not quite, let me show you the right way. Mistakes help us learn.” When students make progress, recognize it: “Good attempt—keep it up.”
End challenging explanations with a reflective or practical task for the student: “Try applying this to another example,” or “Explain what you understand so far.”
Use occasional traditional wisdom, Nigerianisms, or light proverbs (“Even the best farmer started with one seed,” “You must water your knowledge daily”). Do this only when the context fits naturally.
Encourage good study habits: remind students to review notes, ask questions, or avoid shortcuts (“Do not neglect your own hard work”). Never promote malpractice.
Organize lists, tables, or explanations with markdown for clarity.
Always reference images shared by the student by number (e.g., “As seen in Image 2”), using inline image HTML if a URL is available.
At no point do you refer to yourself as ‘an AI’, ‘a bot’, or use robotic wording of any kind. Never say you’re ‘here at the university’ unless context calls for it.
Your tone is lively, personable, straightforward, and very practical. Avoid clichés or generic encouragement. Address the student directly and respectfully, and sign off as “– Prof. Adeyemi” only on the last reply in each session.
`;

function buildPrompt(historyMessages, attachedImage = null, imageRefs = []) {
  // historyMessages must alternate student/professor for effective context
  let prompt = SYSTEM_PROMPT;

  historyMessages.forEach(msg => {
    (msg.messages || []).forEach(m => {
      prompt += (
        m.role === 'professor' ? `\nProfessor: ${m.content}` : `\nStudent: ${m.content}`
      );
    });
    if (msg.professorReply) {
      prompt += `\nProfessor: ${msg.professorReply}`;
    }
  });

  if (attachedImage) {
    prompt += `\nStudent has also attached image number ${attachedImage.refNumber} for analysis. Please reference it as 'Image ${attachedImage.refNumber}' if relevant.`;
  }
  if (imageRefs.length) {
    prompt += `\nImages available in this session: ${imageRefs.map(v => `Image ${v.refNumber}`).join(', ')}.`;
  }

  prompt += `\nProfessor:`;
  return prompt;
}

// --- GET Topics List ---
router.get("/topics", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    const topics = await ChatTopic.find({ user: userId }).sort({ createdAt: 1 });
    res.json({ topics });
  } catch (err) {
    res.status(500).json({ error: "Error fetching topics", detail: err.message });
  }
});

// --- CREATE Topic ---
router.post("/topics", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Topic name required" });
    }
    // Prevent duplicate topic names for user
    const exist = await ChatTopic.findOne({ user: userId, name: name.trim() });
    if (exist) {
      return res.status(400).json({ error: "Topic name already exists for user" });
    }
    const topic = new ChatTopic({ user: userId, name: name.trim() });
    await topic.save();
    res.json({ topic });
  } catch (err) {
    res.status(500).json({ error: "Error creating topic", detail: err.message });
  }
});

// --- SEND MESSAGE to Gemini endpoint ---
router.post("/send", authenticate, async (req, res) => {
  try {
    const { messages, image, channel = "general" } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ error: "Messages required" });

    let userId = req.user ? req.user.id : null;

    // Session: fetch all previous images referenced so far in this channel
    const previousImages = await GeminiMessage.find({ user: userId, channel, image: { $ne: null } }).sort({ date: 1 });
    let imageRefNumber = previousImages.length + 1;
    let attachedImage = image ? { ...image, refNumber: imageRefNumber } : null;

    // Prepare message context: include N previous messages for continuity
    const recentMsgs = await GeminiMessage.find({ user: userId, channel }).sort({ date: 1 });
    let contextMsgs = [];
    let imageRefs = previousImages.map(imgDoc =>
      imgDoc.image && imgDoc.image.refNumber ? { refNumber: imgDoc.image.refNumber } : null
    ).filter(Boolean);

    // Add full chronologically ordered dialog, including professor replies
    contextMsgs = recentMsgs.slice(-9); // last 9 exchanges for context

    // Then add the new user messages at end
    contextMsgs.push({
      messages: messages.map(m => ({
        role: m.role === 'professor' ? 'professor' : 'user',
        content: m.content
      })),
      image: attachedImage,
      professorReply: null
    });

    // Generate Gemini prompt from correct dialog
    let geminiPrompt = buildPrompt(contextMsgs, attachedImage, imageRefs);

    let payload = {
      contents: [{ parts: [{ text: geminiPrompt }] }]
    };
    if (attachedImage) {
      payload.contents[0].parts.push({
        inlineData: {
          mimeType: attachedImage.mimeType,
          data: attachedImage.data
        }
      });
    }

    // Gemini API call
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );
    const data = await response.json();
    const profReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    if (!profReply) return res.status(500).json({ error: "Gemini API error", detail: data });

    // Save to chat history (with channel/topic)
    const chatMsg = new GeminiMessage({
      user: userId,
      channel,
      messages,
      image: attachedImage ? { mimeType: attachedImage.mimeType, fileName: attachedImage.fileName, refNumber: imageRefNumber } : null,
      professorReply: profReply,
      date: new Date()
    });
    await chatMsg.save();

    res.json({ reply: profReply, messageId: chatMsg._id });
  } catch (err) {
    console.error("Gemini send error:", err);
    res.status(500).json({ error: "Gemini API error", detail: err.message });
  }
});

// --- Paginated message history ---
router.get("/history", authenticate, async (req, res) => {
  try {
    let offset = Math.max(0, parseInt(req.query.offset) || 0);
    let limit = Math.max(1, parseInt(req.query.limit) || 10);
    let channel = req.query.channel || "general";
    let userId = req.user ? req.user.id : null;

    // Only fetch for this channel/topic, sorted by oldest first (for dialog context)
    const totalCount = await GeminiMessage.countDocuments({ user: userId, channel });
    let history = [];
    if (offset < totalCount) {
      history = await GeminiMessage.find({ user: userId, channel })
        .sort({ date: 1 })
        .skip(offset)
        .limit(limit);
    }
    const hasMore = offset + history.length < totalCount;

    res.json({
      history,
      hasMore,
      totalCount
    });
  } catch (err) {
    res.status(500).json({ error: "Error fetching chat history", detail: err.message });
  }
});

// --- Utility: Get total message count per topic/channel ---
router.get("/history/count", authenticate, async (req, res) => {
  try {
    let channel = req.query.channel || "general";
    let userId = req.user ? req.user.id : null;
    const totalCount = await GeminiMessage.countDocuments({ user: userId, channel });
    res.json({ totalCount });
  } catch (err) {
    res.status(500).json({ error: "Error counting chat history", detail: err.message });
  }
});

// --- Upload image endpoint for Gemini -- image gets channel/topic & refNumber
router.post("/upload-image", authenticate, upload.single("image"), async (req, res) => {
  try {
    let channel = req.body.channel || "general";
    if (!req.file) return res.status(400).json({ error: "No image provided" });
    // Read image data
    const imageData = fs.readFileSync(req.file.path);
    const base64Image = imageData.toString("base64");
    const mimeType = req.file.mimetype;
    // Sequential image refNumber in this channel
    let previousImages = await GeminiMessage.find({ user: req.user?.id, channel, image: { $ne: null } }).sort({ date: 1 });
    let imageRefNumber = previousImages.length + 1;
    // Gemini image query
    const prompt = SYSTEM_PROMPT + `\nStudent: Please analyze the attached image number ${imageRefNumber}. Professor:`;
    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Image } }
        ]
      }]
    };
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );
    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    fs.unlinkSync(req.file.path); // remove temporary image

    // Save to history
    const chatMsg = new GeminiMessage({
      user: req.user?.id,
      channel,
      messages: [{ role: 'user', content: `Image ${imageRefNumber} Sent` }],
      image: { mimeType, fileName: req.file.filename, refNumber: imageRefNumber },
      professorReply: reply,
      date: new Date()
    });
    await chatMsg.save();

    res.json({ reply, messageId: chatMsg._id, refNumber: imageRefNumber });
  } catch (err) {
    res.status(500).json({ error: "Image analysis failed", detail: err.message });
  }
});

export default router;
