
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
const router = express.Router();

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
You don't need to engage in casual welcoming and avoid using terms like "Lets dive into" or the likes. Sound like a real Nigerian lecturer and use some not so funny Nigeria vibe, avoid too formal words. Also, make sure your notes are well detailed, perfect and standard definitions, explanations and standard notes on key components, not a too brief or short note, you could take it a component at a time.
Always reference images shared by the student by number (e.g., “As seen in Image 2”), using inline image HTML if a URL is available.
At no point do you refer to yourself as ‘an AI’, ‘a bot’, or use robotic wording of any kind. Never say you’re ‘here at the university’ unless context calls for it.
Your tone is lively, personable, straightforward, and very practical. Avoid clichés or generic encouragement. Address the student directly and respectfully, and sign off as “– Prof. Adeyemi” only on the last reply in each session.
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
// --- MCQ GENERATION FROM FILE ENDPOINT ---
const uploadMCQ = multer({ dest: "uploads/mcq/" });

const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png", ".bmp", ".gif"];
// Add this endpoint:
router.post("/schedule-cbt", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { channel = "general", n = 20 } = req.body;

    const prompt = `Generate ${n} MCQs (multiple choice questions), each with 4 options and answer index, for the topic: "${channel}". 
Each question should also include a brief explanation for the answer. 
Return ONLY valid JSON array: [ {text, options:[...], answer, explanation} ]`;

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }]
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
    let mcqText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let questions = [];
    try {
      questions = JSON.parse(mcqText);
    } catch (e) {
      // Try to extract a JSON array if Gemini is messy
      const jsonMatch = mcqText.match(/\[.*\{[\s\S]*?\}\s*\]/);
      if(jsonMatch){
        try { questions = JSON.parse(jsonMatch[0]); }
        catch { questions = []; }
      }
    }

    // Save to CBTExam
    const exam = new CBTExam({
      user: userId,
      channel,
      questions,
      status: "scheduled",
      startedAt: new Date()
    });
    await exam.save();

    res.json({ examId: exam._id, questions });
  } catch (err) {
    res.status(500).json({ error: "Failed to schedule CBT exam", detail: err.message });
  }
});
router.post("/generate-questions", authenticate, uploadMCQ.single("file"), async (req, res) => {
  try {
    const userId = req.user?.id;
    const { difficulty = "medium", numQuestions = 20, instructions = "" } = req.body;
    if (!req.file) return res.status(400).json({ error: "No file provided" });
    const ext = path.extname(req.file.originalname).toLowerCase();

    if (!SUPPORTED_EXTENSIONS.includes(ext))
      return res.status(400).json({ error: `File format not supported (${ext}). Supported: ${SUPPORTED_EXTENSIONS.join(", ")}` });

    let fileText = "";

    // --- PDF ---
    if (ext === ".pdf") {
      const fileData = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(fileData);
      fileText = pdfData.text;
    }
    // --- Word DOCX/DOC ---
    else if ([".docx", ".doc"].includes(ext)) {
      const result = await mammoth.extractRawText({ path: req.file.path });
      fileText = result.value;
    }
    // --- Image (OCR)—jpg, jpeg, png, bmp, gif ---
    else if ([".jpg", ".jpeg", ".png", ".bmp", ".gif"].includes(ext)) {
      const imgPath = req.file.path;
      const { data: { text } } = await Tesseract.recognize(imgPath, "eng");
      fileText = text;
    } else {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Unsupported file format" });
    }

    fs.unlinkSync(req.file.path);

    if (!fileText || fileText.trim().length < 20)
      return res.status(400).json({ error: "File content could not be read or is too short." });

    // --- New session/channel name based on file/time
    const channelName = `Generated Quiz – ${req.file.originalname.replace(/\.[^/.]+$/, "")} – ${Date.now()}`;

    // Compose Prompt for Gemini
    const prompt = `
Based strictly on the content below, generate ${numQuestions} ${difficulty} level multiple choice questions (MCQs).
Provide four options per question, mark the correct option as "answer" (0-based index), and a one-sentence explanation per correct answer.
IMPORTANT: Respond with NOTHING except the pure JSON array below—no commentary, no markdown, no explanation. The output MUST start with "[" and end with "]".

[
  { "text": "...", "options":["...","...","...","..."], "answer":2, "explanation":"..." }
]
${instructions && instructions.trim().length > 0 ? "Extra instructions: " + instructions : ""}
Material for questions (summarize where appropriate, but do not hallucinate content):

${fileText.substring(0, 6500)}

`;

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };

    // --- Gemini API CALL
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    let mcqText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let questions = [];
    try {
      questions = JSON.parse(mcqText);
    } catch (e) {
      // If Gemini's output is not valid JSON, show user
      return res.status(500).json({ error: "Could not parse MCQ response.", raw: mcqText });
    }

    // Create new CBTExam in DB
    const exam = new CBTExam({
      user: userId,
      channel: channelName,
      questions,
      status: "scheduled",
      startedAt: new Date()
    });
    await exam.save();

    res.json({
      message: `MCQ quiz generated from file "${req.file.originalname}".`,
      channel: channelName,
      examId: exam._id,
      questions
    });
  } catch (err) {
    res.status(500).json({ error: "MCQ generation failed.", detail: err.message });
  }
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

// --- SEND MESSAGE to Gemini endpoint ---
// Auto-triggers CBT generation if explanation -- sends MCQs in the same response!
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

    // Gemini API call for explanation
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

    // --- CBT AUTO-GENERATION LOGIC ---
    // Gemini MCQ generation on topic (channel)
    async function generateMCQs(topic, n) {
      // This should be a Gemini API call for production!
      // Example prompt:
      // "Generate {n} MCQs (multiple choice questions), each with 4 options and answer index, for the topic: {topic}. Return JSON format: [{text, options:[...], answer, explanation}]"
      let prompt = `Generate ${n} MCQs (multiple choice questions), each with 4 options and answer index, for the topic: "${topic}". Each question should also include a brief explanation for the answer. Please return your reply in valid JSON array as:
[
  {
    "text": "...question...",
    "options": ["...", "...", "...", "..."],
    "answer": 0,
    "explanation": "...why this answer is correct..."
  }
]
`;
      let mcqPayload = {
        contents: [{ parts: [{ text: prompt }] }]
      };
      const mcqResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mcqPayload)
        }
      );
      const mcqData = await mcqResponse.json();
      let mcqText = mcqData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      let questions = [];
      try {
        questions = JSON.parse(mcqText);
      } catch (e) {
        // Gemini's output might not be pure JSON; fallback: sample
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
        questions // MCQs
      }
    });
  } catch (err) {
    console.error("Gemini send/CBT error:", err);
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
