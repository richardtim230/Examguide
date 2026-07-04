import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";
import ChatTopic from "../models/ChatTopic.js";
import CBTExam from "../models/CBTExam.js";
import { authenticate } from "../middleware/authenticate.js";
import GeminiMessage from "../models/GeminiMessage.js";
import { GoogleAuth } from "google-auth-library";

const router = express.Router();

const upload = multer({ dest: "uploads/gemini/" });
const GEMINI_API_URL = process.env.GEMINI_API_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const GEMINI_AUTH_METHOD = (process.env.GEMINI_AUTH_METHOD || "service_account").toLowerCase();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Helper: build headers for Gemini calls (service account or api key)
async function buildGeminiHeaders() {
  const headers = { "Content-Type": "application/json" };

  if (GEMINI_AUTH_METHOD === "api_key") {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_AUTH_METHOD=api_key but GEMINI_API_KEY is not set");
    headers["X-goog-api-key"] = GEMINI_API_KEY;
    console.log("[Gemini] Using API key auth");
    return headers;
  }

  // service_account mode (recommended)
  try {
    const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = typeof tokenResponse === "string" ? tokenResponse : (tokenResponse?.token || tokenResponse?.access_token);
    if (!token) throw new Error("No token returned from getAccessToken");
    headers["Authorization"] = `Bearer ${token}`;
    console.log("[Gemini] Using service account auth - token obtained");
    return headers;
  } catch (err) {
    console.error("[Gemini] Service account auth failed:", err.message);
    if (GEMINI_API_KEY) {
      console.warn("[Gemini] Falling back to API key");
      headers["X-goog-api-key"] = GEMINI_API_KEY;
      return headers;
    }
    throw err;
  }
}

const SYSTEM_PROMPT = `
You are "Professor Adeyemi", a knowledgeable, warm and strict Nigerian university lecturer, guiding students as a true academic mentor.
Your expertise covers a vast range of university disciplines. You teach with organized, precise explanations, never skipping vital steps.
Use relatable, real-world or local examples when explaining ideas. Your teaching is never shallow: dive deep, show your work, and in mathematics/science, format equations with LaTeX for clarity.
Correct mistakes gently but firmly: "Not quite, let me show you the right way." When students make progress, recognize it: "Good attempt—keep it up."
End challenging explanations with a reflective or practical task for the student.
Encourage good study habits: remind students to review notes, ask questions, or avoid shortcuts.
Organize lists, tables, or explanations with markdown for clarity.
You don't refer to yourself as 'an AI' or use robotic wording. Sound like a real Nigerian lecturer.
Your tone is lively, personable, straightforward, and very practical.
After your explanation, immediately generate a CBT test of 20 multiple-choice questions (MCQs), based strictly on this topic.
For each MCQ, provide four options, indicate the correct option as an index (0-3), and provide a one-sentence explanation for the correct answer.
Return your CBT MCQs in valid JSON array format like this:
[
  {
    "text": "...question...",
    "options": ["...", "...", "...", "..."],
    "answer": 2,
    "explanation": "...reason..."
  }
]
ALWAYS give your explanation first, then the MCQs **in JSON**, and nothing else after the JSON block.
`;

function buildPrompt(historyMessages, attachedImage = null, imageRefs = []) {
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

const uploadMCQ = multer({ dest: "uploads/mcq/" });
const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png", ".bmp", ".gif"];

// --- SEND MESSAGE to Gemini endpoint ---
router.post("/send", authenticate, async (req, res) => {
  try {
    const { messages, image, channel = "general" } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ error: "Messages required" });

    let userId = req.user ? req.user.id : null;
    const previousImages = await GeminiMessage.find({ user: userId, channel, image: { $ne: null } }).sort({ date: 1 });
    let imageRefNumber = previousImages.length + 1;
    let attachedImage = image ? { ...image, refNumber: imageRefNumber } : null;

    // Prepare message context
    const recentMsgs = await GeminiMessage.find({ user: userId, channel }).sort({ date: 1 });
    let contextMsgs = [];
    let imageRefs = previousImages.map(imgDoc =>
      imgDoc.image && imgDoc.image.refNumber ? { refNumber: imgDoc.image.refNumber } : null
    ).filter(Boolean);

    contextMsgs = recentMsgs.slice(-9);
    contextMsgs.push({
      messages: messages.map(m => ({
        role: m.role === 'professor' ? 'professor' : 'user',
        content: m.content
      })),
      image: attachedImage,
      professorReply: null
    });

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

    console.log("[Gemini] Sending request to:", GEMINI_API_URL);
    console.log("[Gemini] Auth method:", GEMINI_AUTH_METHOD);

    // Gemini API call for explanation
    const headers = await buildGeminiHeaders();
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log("[Gemini] Response status:", response.status);

    if (!response.ok) {
      console.error("[Gemini] API Error:", responseText);
      return res.status(500).json({ error: "Gemini API error", detail: responseText });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("[Gemini] Failed to parse response:", responseText);
      return res.status(500).json({ error: "Invalid response from Gemini", detail: responseText });
    }

    const profReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!profReply || profReply.trim().length === 0) {
      console.warn("[Gemini] Empty reply received");
      return res.status(500).json({ error: "No response from Gemini", detail: JSON.stringify(data) });
    }

    console.log("[Gemini] Reply received, length:", profReply.length);

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

    // --- CBT AUTO-GENERATION LOGIC ---
    async function generateMCQs(topic, n) {
      let prompt = `Generate ${n} MCQs (multiple choice questions), each with 4 options and answer index, for the topic: "${topic}". Each question should also include a brief explanation for the answer. Return JSON format: [{text, options:[...], answer, explanation}]`;
      let mcqPayload = { contents: [{ parts: [{ text: prompt }] }] };
      const headers2 = await buildGeminiHeaders();
      const mcqResponse = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: headers2,
        body: JSON.stringify(mcqPayload)
      });
      const mcqData = await mcqResponse.json();
      let mcqText = mcqData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      let questions = [];
      try {
        questions = JSON.parse(mcqText);
      } catch (e) {
        console.warn("[Gemini] Failed to parse MCQ JSON, using fallback");
        for(let i=0; i<n; i++) {
          questions.push({
            text: `MCQ #${i+1} about ${topic}?`,
            options: ["Option A","Option B","Option C","Option D"],
            answer: Math.floor(Math.random()*4),
            explanation: `Explanation for MCQ #${i+1} of ${topic}`
          });
        }
      }
      return questions;
    }

    // Generate 20 MCQs for the topic/channel immediately after explanation
    let questions = await generateMCQs(channel, 20);

    // Save CBT exam to DB
    const exam = new CBTExam({
      user: userId,
      channel,
      questions,
      status: "scheduled",
      startedAt: new Date()
    });
    await exam.save();

    // Respond: include explanation AND exam MCQs in same response
    res.json({
      reply: profReply,
      messageId: chatMsg._id,
      cbt: {
        examId: exam._id,
        questions
      }
    });
  } catch (err) {
    console.error("[Gemini] Unexpected error:", err);
    res.status(500).json({ error: "Gemini/CBT error", detail: err.message });
  }
});

// --- SUBMIT CBT: score answers, save result, return explanations ---
router.post("/submit-cbt", authenticate, async (req, res) => {
  const { examId, answers } = req.body;
  const userId = req.user?.id;

  if (!examId || !answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: "Exam ID and answer array required" });
  }

  const exam = await CBTExam.findOne({ _id: examId, user: userId });
  if (!exam) return res.status(404).json({ error: "Exam not found" });
  if (exam.status === "completed") return res.status(400).json({ error: "Exam already submitted" });

  let score = 0, explanations = [];
  for (let i = 0; i < exam.questions.length; i++) {
    const q = exam.questions[i];
    let correct = answers[i] === q.answer;
    if (correct) score++;
    explanations.push({
      correct,
      answer: q.answer,
      yourAnswer: answers[i] ?? null,
      options: q.options,
      explanation: q.explanation || "",
      question: q.text
    });
  }

  exam.answers = answers;
  exam.explanations = explanations;
  exam.score = score;
  exam.status = "completed";
  exam.completedAt = new Date();
  await exam.save();

  res.json({
    score,
    explanations,
    total: exam.questions.length,
    summary: `You scored ${score}/${exam.questions.length}`
  });
});

// --- CBT HISTORY: List completed attempts for a user/topic ---
router.get("/cbt-history", authenticate, async (req, res) => {
  const channel = req.query.channel || "general";
  const userId = req.user?.id;
  const history = await CBTExam.find({ user: userId, channel, status: "completed" }).sort({ completedAt: -1 });
  res.json({ history });
});

// --- GET specific completed exam result ---
router.get("/cbt/:id", authenticate, async (req, res) => {
  const userId = req.user?.id;
  const examId = req.params.id;
  const exam = await CBTExam.findOne({ _id: examId, user: userId });
  if (!exam) return res.status(404).json({ error: "Exam not found" });
  res.json({
    examId,
    channel: exam.channel,
    score: exam.score,
    explanations: exam.explanations,
    startedAt: exam.startedAt,
    completedAt: exam.completedAt
  });
});

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

// --- Paginated message history ---
router.get("/history", authenticate, async (req, res) => {
  try {
    let offset = Math.max(0, parseInt(req.query.offset) || 0);
    let limit = Math.max(1, parseInt(req.query.limit) || 10);
    let channel = req.query.channel || "general";
    let userId = req.user ? req.user.id : null;

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

// --- Upload image endpoint for Gemini -- image gets channel/topic & refNumber
router.post("/upload-image", authenticate, upload.single("image"), async (req, res) => {
  try {
    let channel = req.body.channel || "general";
    if (!req.file) return res.status(400).json({ error: "No image provided" });
    const imageData = fs.readFileSync(req.file.path);
    const base64Image = imageData.toString("base64");
    const mimeType = req.file.mimetype;
    let previousImages = await GeminiMessage.find({ user: req.user?.id, channel, image: { $ne: null } }).sort({ date: 1 });
    let imageRefNumber = previousImages.length + 1;
    const prompt = SYSTEM_PROMPT + `\nStudent: Please analyze the attached image number ${imageRefNumber}. Professor:`;
    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Image } }
        ]
      }]
    };

    const headers = await buildGeminiHeaders();
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    fs.unlinkSync(req.file.path); // remove temporary image

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

// --- Material upload (chatbot compatibility) ---
router.post("/upload", authenticate, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    // This endpoint is a placeholder for the new chatbot material upload
    // In production, integrate with ChatMaterial model if needed
    res.status(201).json({ 
      success: true, 
      materialId: req.file.filename,
      extractedText: "(material uploaded)"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Upload failed", error: String(err.message) });
  }
});

export default router;
