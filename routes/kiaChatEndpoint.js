// Express endpoint for KIA Chat by ExamGuard Team
import express from "express";
import multer from "multer";
import fetch from "node-fetch";
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Set in .env
const IMAGE_LIMIT_PER_SEND = 3;
const IMAGE_LIMIT_3HRS = 6;
const IMAGE_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours

// In-memory image usage cache (userId → timestamps). Replace with Redis/db for production
const imageUsage = {};

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB per file

router.post("/", upload.fields([
  { name: "voice", maxCount: 1 },
  { name: "images", maxCount: IMAGE_LIMIT_PER_SEND }
]), async (req, res) => {
  try {
    const userName = req.body.userName?.trim() || "Student";
    const msg = req.body.msg?.trim() || "";
    if (!msg && !req.files["voice"] && !req.files["images"])
      return res.status(400).send("Empty message.");

    // --- IMAGE LIMITING ---
    const userKey = req.headers.authorization?.split(" ")[1] || userName; // For demo; use JWT user id if available
    const now = Date.now();
    imageUsage[userKey] = (imageUsage[userKey] || []).filter(ts => now - ts < IMAGE_WINDOW_MS);
    const images = Array.isArray(req.files["images"]) ? req.files["images"] : [];
    if (images.length > IMAGE_LIMIT_PER_SEND)
      return res.status(429).send(`Max ${IMAGE_LIMIT_PER_SEND} images per message.`);
    if ((imageUsage[userKey].length + images.length) > IMAGE_LIMIT_3HRS)
      return res.status(429).send(`Max ${IMAGE_LIMIT_3HRS} images in 3hrs exceeded.`);

    // Mark new usage
    for (let i = 0; i < images.length; i++) imageUsage[userKey].push(now);

    // --- VOICE ---
    let voiceTranscript = "";
    if (req.files["voice"] && req.files["voice"][0]) {
      // Use a speech-to-text API here (Google, AWS, etc.). For demo, fake transcript.
      voiceTranscript = "[Voice message not transcribed yet.]";
      // Example call: (Replace this with a real service)
      // voiceTranscript = await transcribeAudio(req.files["voice"][0].buffer);
    }

    // --- Images: feed filenames/summaries ---
    let imagesSummary = "";
    if (images.length) {
      imagesSummary = `User has uploaded ${images.length} image${images.length > 1 ? "s" : ""}.`;
      // You may use a vision API to summarize or describe images here for Gemini.
      // For demo: imagesSummary stays generic.
    }

    // --- Build Gemini prompt/persona/context ---
    let conversationInput = `
Your name is KIA. You are a friendly educational assistant built by the ExamGuard Team for Nigerian students. 
You know the user's name is "${userName}". Greet them by name naturally, and always make your responses helpful, clear, and educational. 
If the user sends a voice note, you should respond in text only. 
If images are uploaded, mention that you received them and offer relevant help.
Messages:
- User's message: "${msg}"
- (Transcript of voice note, if any): "${voiceTranscript}"
- (Images context): "${imagesSummary}"
Your response must always be in friendly, educational text aimed at the student's needs. 
Do not use code blocks, and never break persona. Stay as KIA, built by ExamGuard Team.
`;

    // --- Call Gemini API ---
    // Gemini expects the `contents` array for the conversational context.
    const apiPayload = {
      contents: [{ parts: [{ text: conversationInput }] }]
    };
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiPayload)
    });
    const data = await resp.json();
    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Sorry, I couldn't reply right now.";

    res.send(aiReply);
  } catch (e) {
    console.error("KIA Chat Endpoint error:", e);
    res.status(500).send("KIA is offline.");
  }
});

export default router;
