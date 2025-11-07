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
You are "OAU Professor", a knowledgeable, experienced university lecturer at Obafemi Awolowo University (OAU), Nigeria.
Your teaching style is a blend of warmth, wit, and disciplined academic thoroughness, typical of OAU professors: you are kind, approachable, but demand serious effort and clear thinking from your students.
Always teach with practical, real-world examples and analogies, and reference recent or classic materials as a learned scholar would.
Structure your answers with stepwise explanations, using organized breakdowns. For mathematical or technical concepts, always use clear, handwritten-style LaTeX for formulas, and tables in markdown or HTML for clarity.
Frequently reference high-quality online images or diagrams relevant to the subject, especially from authoritative sources like Wikipedia, Brittanica, or trusted educational sites; include a direct image link and attribution, e.g.,: "See this diagram from Wikipedia: ![Link description](URL)".
Avoid all AI-related or robotic language. Never say you are AI, never reference being a bot or artificial, or mention any programming, training, or model. Your tone should be distinctly human, professorial, Nigerian–with subtle ‘Nigerianisms’ (like “My dear student,” “Let’s break this down,” “Are you following?”), but always fit for a university classroom.
If a student sends an image, number it ("Image 2", "Image 3" etc.) and refer to it naturally in explanations (“As you can see in Image 2…”).
For all questions, dive deep: do not give shallow answers. Push the student with follow-ups or thought-provoking challenges when appropriate. Never skip vital steps.
If you organize lists or points, use clear markdown formatting.
Your language must sound as if you are a living person present in a Nigerian university lecture hall. Never use stock phrases or clichés.
You may “sign off” your answers with a touch of OAU scholarly authority if your message is long (“- Prof. [Fictional Name], OAU”).
`;

function buildPrompt(userMessages, attachedImage = null, imageRefs = []) {
  let prompt = SYSTEM_PROMPT;
  userMessages.forEach(msg => {
    prompt += `\nStudent: ${msg.content}`;
  });
  if (attachedImage) {
    prompt += `\nStudent has also attached image number ${attachedImage.refNumber} for analysis. Please reference it as 'Image ${attachedImage.refNumber}' if relevant.`;
  }
  if (imageRefs && imageRefs.length) {
    prompt += `\nImages available in this session: ${imageRefs.map(v=>`Image ${v.refNumber}`).join(', ')}.`;
  }
  prompt += `\nProfessor:`;
  return prompt;
}



// --- Send message to Gemini endpoint ---
router.post("/send", authenticate, async (req, res) => {
  try {
    const { messages, image, channel = "general" } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ error: "Messages required" });
    let userId = req.user ? req.user.id : null;
    // Session: fetch all previous images referenced so far in this channel
    const previousImages = await GeminiMessage.find({ user: userId, channel, image: {$ne: null} }).sort({ date: 1 });
    // Assign refNumber for any new image
    let imageRefNumber = previousImages.length + 1;
    let attachedImage = image ? { ...image, refNumber: imageRefNumber } : null;
    // Prepare message context for Gemini: include N previous user/professor messages from this channel for continuity
    const recentMsgs = await GeminiMessage.find({ user: userId, channel })
      .sort({ date: -1 }).limit(9); // get up to 9 previous messages for context
    let contextMsgs = [], imageRefs = [];
    recentMsgs.reverse().forEach(msgDoc => {
      contextMsgs.push(...msgDoc.messages.map(m => ({
        role: m.role === 'professor' ? 'professor' : 'user',
        content: m.content
      })));
      if (msgDoc.image && msgDoc.image.refNumber) imageRefs.push({ refNumber: msgDoc.image.refNumber });
    });
    // User message is always last
    contextMsgs.push(...messages.map(m => ({
      role: m.role === 'professor' ? 'professor' : 'user',
      content: m.content
    })));
    // Generate Gemini prompt
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
    let offset = parseInt(req.query.offset) || 0;
    let limit = parseInt(req.query.limit) || 10;
    let channel = req.query.channel || "general";
    let userId = req.user ? req.user.id : null;

    // Only fetch for this channel/topic
    const history = await GeminiMessage.find({ user: userId, channel })
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

// --- Upload image endpoint for Gemini -- image gets channel/topic & refNumber
router.post("/upload-image", authenticate, upload.single("image"), async (req, res) => {
  try {
    let channel = req.body.channel || "general";
    if (!req.file) return res.status(400).json({ error: "No image provided" });
    // Read image data
    const imageData = fs.readFileSync(req.file.path);
    const base64Image = imageData.toString("base64");
    const mimeType = req.file.mimetype;
    // Assign sequential image refNumber in this channel
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
