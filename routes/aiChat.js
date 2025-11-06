import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import { authenticate } from "../middleware/authenticate.js";
import GeminiMessage from "../models/GeminiMessage.js";

const router = express.Router();

// Multer image upload for temp storage
const upload = multer({ dest: "uploads/gemini/" });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `
You are "Student Professor", a friendly, expert university tutor who specializes in academic help for students. 
Always answer with deeply knowledgeable, stepwise teaching, explanations, and examples — like a caring professor tutoring a student.
For math questions, format all equations and formulas between \$...\$ for inline math, and within \\[ ... \\] for block math, so they can be rendered by MathJax/KaTeX on the frontend.
Use clear, human-friendly language. Organize complex academic topics logically, and never skip steps in explanations. Avoid generic AI phrases.
You can analyze attached images (such as diagrams, questions, equations) and factor them into your answers.
If requested, provide references, further reading, and practice questions.
Never disclose that you are an AI; act just as a highly skilled professor.
`;

function buildPrompt(userMessages, attachedImage = null) {
  // User messages: [{ role: 'user', content: '...' }, ...]
  let prompt = SYSTEM_PROMPT;
  userMessages.forEach(msg => {
    prompt += `\nStudent: ${msg.content}`;
  });
  if (attachedImage) {
    prompt += `\nStudent has also attached an image for analysis. Please refer to it in your response, and include any diagrams/equations if present.`;
  }
  prompt += `\nProfessor:`;
  return prompt;
}

// --- Send message to Gemini endpoint ---
router.post("/send", authenticate, async (req, res) => {
  try {
    const { messages, image } = req.body;
    /*
      messages: [{role:'user',content:'...'}], could add role:'professor' if needed
      image: (OPTIONAL) base64 data, if present
    */
    if (!messages || !Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ error: "Messages required" });

    let userId = req.user ? req.user.id : null; // Optional: anonymous allowed if desired

    // Prepare request for Gemini
    let geminiInput = [];
    messages.forEach(m => {
      geminiInput.push({ parts: [{ text: m.content }] });
    });

    // If image sent, attach actual image content for Gemini
    if (image) {
      geminiInput.push({
        parts: [
          { text: "The attached image may contain math, text, or diagrams. Please analyze it and reference it as needed." },
          { inlineData: { mimeType: image.mimeType, data: image.data } } // data: base64
        ]
      });
    }

    let payload = {
      contents: [{ parts: [{ text: buildPrompt(messages, image) }] }]
    };
    if (image) {
      payload.contents[0].parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data
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

    // Save to chat history (user, latest query, AI reply, image if sent)
    const chatMsg = new GeminiMessage({
      user: userId,
      messages,
      image: image ? { mimeType: image.mimeType, fileName: image.fileName } : null,
      professorReply: profReply,
      date: new Date()
    });
    await chatMsg.save();

    res.json({
      reply: profReply,
      messageId: chatMsg._id
    });
  } catch (err) {
    console.error("Gemini send error:", err);
    res.status(500).json({ error: "Gemini API error", detail: err.message });
  }
});

// --- Paginated message history ---
router.get("/history", authenticate, async (req, res) => {
  try {
    let offset = parseInt(req.query.offset) || 0;
    let limit = parseInt(req.query.limit) || 10;
    let userId = req.user ? req.user.id : null;

    // Query last chats (newest first), for this student
    const history = await GeminiMessage.find({ user: userId })
      .sort({ date: -1 })
      .skip(offset)
      .limit(limit);

    res.json({
      history,
      hasMore: history.length === limit
    });
  } catch (err) {
    res.status(500).json({ error: "Error fetching chat history", detail: err.message });
  }
});

// --- Upload image endpoint for Gemini ---
router.post("/upload-image", authenticate, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image provided" });

    // Read image data
    const imageData = fs.readFileSync(req.file.path);
    const base64Image = imageData.toString("base64");
    const mimeType = req.file.mimetype;

    // Gemini image query (could be combined in /send, but allows standalone analysis)
    const prompt = SYSTEM_PROMPT + "\nStudent: Please analyze the attached image (could be diagram, math, or text). Professor:";
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

    // Save to history if desired
    const chatMsg = new GeminiMessage({
      user: req.user?.id,
      messages: [{ role: 'user', content: 'Image Sent' }],
      image: { mimeType, fileName: req.file.filename },
      professorReply: reply,
      date: new Date()
    });
    await chatMsg.save();

    res.json({ reply, messageId: chatMsg._id });
  } catch (err) {
    res.status(500).json({ error: "Image analysis failed", detail: err.message });
  }
});

export default router;
