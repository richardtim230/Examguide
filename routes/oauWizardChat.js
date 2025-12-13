import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";

const router = express.Router();
const upload = multer({ dest: "uploads/oauwizard/" });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "<YOUR_GEMINI_API_KEY>";

const SYSTEM_PROMPT = `
You are a lecturer at Obafemi Awolowo University (OAU), Nigeria — your style is distinctly human, direct, lively, and practical, with local university flavor. When students upload or paste exam materials, always reply as a real OAU lecturer.
Always reply without sounding robotic or like an AI. Use OAU local wisdom, light humor, and academic discipline. Format answers with markdown or HTML for clarity (headings, lists, tables, formulas, etc).
Whenever a student uploads a material (PDF, Word, PPT, or image), always reference it precisely and make sure your explanation is based ONLY on the source content provided (summarize main topics; do not hallucinate).
After your main explanation, you must IMMEDIATELY generate a CBT quiz of 20 MCQs strictly drawn from the material/topic, with 4 options each, index of the correct answer, and a brief explanation.
Your CBT output format (as valid JSON array ONLY!):
[
  {
    "text": "...question...",
    "options": ["...", "...", "...", "..."],
    "answer": 2,
    "explanation": "...reason..."
  }
]
Give explanation first (with formatting/diagrams where useful), then the MCQs array (and NOTHING else after the array).
Never refer to yourself as AI or bot.
`;

const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".ppt", ".pptx", ".jpg", ".jpeg", ".png", ".bmp", ".gif"];

async function extractFileText(filePath, ext) {
  try {
    if (ext === ".pdf") {
      const fileData = fs.readFileSync(filePath);
      const pdfData = await pdfParse(fileData);
      return pdfData.text.trim();
    } else if ([".docx", ".doc"].includes(ext)) {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value.trim();
    } else if ([".ppt", ".pptx"].includes(ext)) {
      // Optionally parse PPT with additional libs or skip for now
      // For speed: Use 'ppt-parse' or convert to text elsewhere
      return "PPT/PPTX parsing not implemented yet.";
    } else if ([".jpg", ".jpeg", ".png", ".bmp", ".gif"].includes(ext)) {
      const { data: { text } } = await Tesseract.recognize(filePath, "eng");
      return text.trim();
    }
    return "";
  } catch (err) {
    return "";
  }
}

router.post("/chat", upload.array("files"), async (req, res) => {
  try {
    const message = req.body.message || "";
    const channel = req.body.channel || "oau-wizard";
    // Optionally receive chat history/context if needed
    // const history = req.body.history ? JSON.parse(req.body.history) : [];
    let materialText = "";

    // Concatenate all uploaded files' texts
    if (req.files && req.files.length) {
      for (const file of req.files) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;
        const fileText = await extractFileText(file.path, ext);
        materialText += `\n---[Material: ${file.originalname}]---\n${fileText}\n`;
        fs.unlinkSync(file.path);
      }
    }

    // Compose prompt for Gemini as OAU Lecturer — context is message + materials
    let fullPrompt = SYSTEM_PROMPT;
    if (materialText.trim().length > 0) {
      fullPrompt += `\nThe student has uploaded these materials:\n${materialText.substring(0, 6500)}\n`;
    }
    if (message.trim().length > 0) {
      fullPrompt += `\nStudent's question: "${message.trim()}"\n`;
    }
    fullPrompt += `\nLecturer's reply and then MCQ CBT:\n`;

    // Gemini API call (streamlined for speed: single prompt, one response)
    const payload = {
      contents: [{ parts: [{ text: fullPrompt }] }]
    };

    let aiError = null;
    let text = "";
    let explainText = "";
    let mcqJson = [];

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      const data = await response.json();

      // If Gemini returns error, propagate it
      if (data.error) {
        aiError = data.error.message || "Unknown error from Gemini API";
        text = "";
      } else if (!data.candidates || !data.candidates.length) {
        aiError = "No candidates returned from Gemini API (maybe quota issue or API key problem)";
        text = "";
      } else {
        text = data.candidates[0]?.content?.parts?.[0]?.text || "";
        // Separate explanation and MCQs JSON array (MCQ format as per SYSTEM_PROMPT)
        explainText = text;
        // Find the MCQ JSON block in Gemini's output (should start with [ and end with ])
        const jsonMatch = text.match(/\[\s*{[\s\S]*?\}\s*\]/);
        if (jsonMatch) {
          try {
            mcqJson = JSON.parse(jsonMatch[0]);
            explainText = text.slice(0, jsonMatch.index).trim();
          } catch (e) {
            mcqJson = [];
            aiError = "AI returned MCQ block in invalid JSON format";
          }
        }
      }
    } catch (err) {
      aiError = "Gemini API call failed: " + err.message;
      explainText = "";
      mcqJson = [];
    }

    // Improved error reporting visible to frontend
    if (aiError) {
      return res.json({
        reply: "",
        mcqs: [],
        error: aiError
      });
    }

    // Optionally further clean/format lecturer reply for HTML/markdown:
    // (Can be as simple as passing through, or send as markdown for frontend)
    res.json({
      reply: explainText, // OAU-lecturer explanation (may be Markdown/HTML)
      mcqs: mcqJson,      // MCQs for frontend quiz rendering
      error: null
    });
  } catch (err) {
    res.status(500).json({ error: "OAU Wizard error", detail: err.message });
  }
});

export default router;
