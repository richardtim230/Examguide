// routes/theoryAnswers.js
import express from "express";
import TheoryAnswer from "../models/TheoryAnswer.js";
import TheoryAttempt from "../models/TheoryAttempt.js";
import TheoryQuestion from "../models/TheoryQuestion.js";
import { authenticate, authorizeRole } from "../middleware/authenticate.js";
import Tesseract from "tesseract.js";
import fetch from "node-fetch";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AUTO-GRADE: Extract text and match keywords
 */
function autoGradeAnswer(answerText, rubric) {
  const text = answerText.toLowerCase();
  let matchedKeywords = [];
  let rubricMatches = [];
  let highestScore = 0;

  const buckets = rubric.scoreBuckets || [];

  buckets.forEach((bucket, idx) => {
    const keywords = bucket.keywords || [];
    const threshold = bucket.matchThreshold || 1;
    const matchedInBucket = [];

    keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        matchedInBucket.push(keyword);
        if (!matchedKeywords.includes(keyword)) {
          matchedKeywords.push(keyword);
        }
      }
    });

    if (matchedInBucket.length >= threshold) {
      rubricMatches.push({
        bucketIndex: idx,
        score: bucket.score,
        matchedKeywords: matchedInBucket
      });
      highestScore = Math.max(highestScore, bucket.score);
    }
  });

  return {
    autoScore: highestScore,
    matchedKeywords,
    rubricMatches
  };
}

/**
 * GEMINI AI AUTO-GRADE: Use AI for intelligent grading
 */
async function geminiAutoGrade(answerText, question, maxMarks, rubric) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are an expert academic grader. Grade the following student answer based on the rubric provided.

Question: ${question}

Student Answer: ${answerText}

Rubric Scoring Guide:
${rubric.scoreBuckets
  .map(
    (bucket, idx) => `
Score ${bucket.score}/${maxMarks}: ${bucket.description || `Level ${idx + 1}`}
Required keywords/concepts: ${(bucket.keywords || []).join(", ")}
`
  )
  .join("\n")}

Please provide:
1. A score out of ${maxMarks}
2. The matched keywords/concepts from the rubric
3. A brief explanation of why this score
4. Constructive feedback

Format your response as JSON:
{
  "score": <number>,
  "matched_keywords": [<keywords from rubric>],
  "explanation": "<why this score>",
  "feedback": "<constructive feedback>"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    const gradeResult = JSON.parse(jsonMatch[0]);

    return {
      aiScore: Math.min(gradeResult.score, maxMarks),
      aiMatchedKeywords: gradeResult.matched_keywords || [],
      aiExplanation: gradeResult.explanation || "",
      aiFeedback: gradeResult.feedback || "",
      aiGradingAttempted: true
    };
  } catch (err) {
    console.error("Gemini grading error:", err.message);
    return {
      aiScore: null,
      aiMatchedKeywords: [],
      aiExplanation: "AI grading failed",
      aiFeedback: "",
      aiGradingAttempted: false
    };
  }
}

/**
 * START a theory exam attempt
 * POST /api/theory-answers/attempt/start
 * Body: { examSet }
 */
router.post("/attempt/start", authenticate, async (req, res) => {
  try {
    const { examSet } = req.body;
    if (!examSet) return res.status(400).json({ error: "examSet required" });

    // Get all questions for this exam set
    const questions = await TheoryQuestion.find({ examSet }).sort({ questionNumber: 1 });
    if (questions.length === 0) {
      return res.status(400).json({ error: "No questions in this exam set" });
    }

    // Calculate max score
    const maxScore = questions.reduce((sum, q) => sum + (q.maxMarks || 0), 0);

    // Create attempt
    const attempt = await TheoryAttempt.create({
      examSet,
      student: req.user.id,
      maxScore,
      answers: []
    });

    res.status(201).json({
      attemptId: attempt._id,
      questions: questions.map(q => ({
        _id: q._id,
        questionNumber: q.questionNumber,
        question: q.question,
        maxMarks: q.maxMarks,
        expectedLength: q.expectedLength
      })),
      totalQuestions: questions.length,
      maxScore
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * SUBMIT answer for a single question (text or image)
 * POST /api/theory-answers
 * Body: { examSet, question, attempt, answerType, answerText?, answerImageUrl?, useAI? }
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { examSet, question, attempt, answerType, answerText, answerImageUrl, useAI = true } = req.body;

    if (!examSet || !question || !attempt || !answerType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (answerType === "text" && !answerText) {
      return res.status(400).json({ error: "Answer text required" });
    }

    if (answerType === "image" && !answerImageUrl) {
      return res.status(400).json({ error: "Image URL required" });
    }

    // Verify attempt belongs to student
    const attemptDoc = await TheoryAttempt.findById(attempt);
    if (!attemptDoc || attemptDoc.student.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized attempt" });
    }

    // Get question details
    const theoryQuestion = await TheoryQuestion.findById(question);
    if (!theoryQuestion) return res.status(400).json({ error: "Question not found" });

    // Create answer document
    const answer = await TheoryAnswer.create({
      examSet,
      question,
      student: req.user.id,
      answerType,
      answerText: answerType === "text" ? answerText : "",
      answerImageUrl: answerType === "image" ? answerImageUrl : ""
    });

    // Auto-grade if text submission
    if (answerType === "text" && answerText) {
      // Keyword-based grading
      const keywordGrading = autoGradeAnswer(answerText, theoryQuestion.rubric);
      answer.autoScore = keywordGrading.autoScore;
      answer.matchedKeywords = keywordGrading.matchedKeywords;
      answer.rubricMatches = keywordGrading.rubricMatches;

      // AI-based grading (if enabled and GEMINI_API_KEY exists)
      if (useAI && process.env.GEMINI_API_KEY) {
        const aiGrading = await geminiAutoGrade(
          answerText,
          theoryQuestion.question,
          theoryQuestion.maxMarks,
          theoryQuestion.rubric
        );

        answer.aiScore = aiGrading.aiScore;
        answer.aiMatchedKeywords = aiGrading.aiMatchedKeywords;
        answer.aiExplanation = aiGrading.aiExplanation;
        answer.aiFeedback = aiGrading.aiFeedback;
        answer.aiGradingAttempted = aiGrading.aiGradingAttempted;

        // Use AI score if available, otherwise use keyword score
        answer.finalScore = aiGrading.aiScore !== null ? aiGrading.aiScore : keywordGrading.autoScore;
      } else {
        answer.finalScore = keywordGrading.autoScore;
      }

      answer.isGraded = true;
      answer.gradedAt = new Date();
      await answer.save();
    }

    // Add to attempt
    attemptDoc.answers.push({
      question,
      answer: answer._id
    });

    // If all questions answered, mark as submitted
    const allQuestions = await TheoryQuestion.countDocuments({ examSet });
    if (attemptDoc.answers.length === allQuestions) {
      attemptDoc.status = "submitted";
      attemptDoc.submittedAt = new Date();
    }

    await attemptDoc.save();

    res.status(201).json({
      answerId: answer._id,
      autoScore: answer.autoScore,
      aiScore: answer.aiScore || null,
      finalScore: answer.finalScore,
      isGraded: answer.isGraded,
      matchedKeywords: answer.matchedKeywords,
      aiMatchedKeywords: answer.aiMatchedKeywords,
      message: answerType === "text" ? "Auto-graded successfully" : "Awaiting OCR processing"
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * PROCESS OCR for image-based answer
 * POST /api/theory-answers/:answerId/process-ocr
 */
router.post("/:answerId/process-ocr", authenticate, async (req, res) => {
  try {
    const { useAI = true } = req.body;

    const answer = await TheoryAnswer.findById(req.params.answerId);
    if (!answer) return res.status(404).json({ error: "Answer not found" });

    if (answer.answerType !== "image") {
      return res.status(400).json({ error: "Not an image submission" });
    }

    // Fetch and OCR
    const imageRes = await fetch(answer.answerImageUrl);
    const imageBuffer = await imageRes.buffer();

    const { data } = await Tesseract.recognize(imageBuffer, "eng");
    answer.ocrExtractedText = data.text;
    answer.answerText = data.text;

    // Keyword-based grading
    const theoryQuestion = await TheoryQuestion.findById(answer.question);
    const keywordGrading = autoGradeAnswer(data.text, theoryQuestion.rubric);

    answer.autoScore = keywordGrading.autoScore;
    answer.matchedKeywords = keywordGrading.matchedKeywords;
    answer.rubricMatches = keywordGrading.rubricMatches;

    // AI-based grading (if enabled)
    if (useAI && process.env.GEMINI_API_KEY) {
      const aiGrading = await geminiAutoGrade(
        data.text,
        theoryQuestion.question,
        theoryQuestion.maxMarks,
        theoryQuestion.rubric
      );

      answer.aiScore = aiGrading.aiScore;
      answer.aiMatchedKeywords = aiGrading.aiMatchedKeywords;
      answer.aiExplanation = aiGrading.aiExplanation;
      answer.aiFeedback = aiGrading.aiFeedback;
      answer.aiGradingAttempted = aiGrading.aiGradingAttempted;

      answer.finalScore = aiGrading.aiScore !== null ? aiGrading.aiScore : keywordGrading.autoScore;
    } else {
      answer.finalScore = keywordGrading.autoScore;
    }

    answer.isGraded = true;
    answer.gradedAt = new Date();

    await answer.save();

    res.json({
      message: "OCR processed and auto-graded",
      autoScore: answer.autoScore,
      aiScore: answer.aiScore || null,
      finalScore: answer.finalScore,
      extractedText: data.text.substring(0, 200) + "...",
      matchedKeywords: answer.matchedKeywords,
      aiMatchedKeywords: answer.aiMatchedKeywords
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * MANUAL GRADE a single answer (with feedback)
 * PUT /api/theory-answers/:answerId/grade
 * Body: { manualScore, manualFeedback }
 */
router.put("/:answerId/grade", authenticate, authorizeRole("admin", "tutor"), async (req, res) => {
  try {
    const { manualScore, manualFeedback } = req.body;

    if (typeof manualScore !== "number") {
      return res.status(400).json({ error: "Manual score must be a number" });
    }

    const answer = await TheoryAnswer.findById(req.params.answerId);
    if (!answer) return res.status(404).json({ error: "Not found" });

    answer.manualScore = manualScore;
    answer.manualFeedback = manualFeedback || "";
    answer.manualGradedBy = req.user.id;
    answer.finalScore = manualScore;
    answer.isGraded = true;
    answer.gradedAt = new Date();

    await answer.save();

    // Check if all answers in attempt are graded
    const attempt = await TheoryAttempt.findOne({
      student: answer.student,
      examSet: answer.examSet
    });

    if (attempt) {
      const allAnswers = await TheoryAnswer.find({
        _id: { $in: attempt.answers.map(a => a.answer) }
      });

      const allGraded = allAnswers.every(a => a.isGraded);

      if (allGraded) {
        const totalScore = allAnswers.reduce((sum, a) => sum + a.finalScore, 0);
        attempt.totalScore = totalScore;
        attempt.percentage = Math.round((totalScore / attempt.maxScore) * 100);
        attempt.status = "graded";
        attempt.allQuestionsGraded = true;
        attempt.gradedAt = new Date();
        await attempt.save();
      }
    }

    res.json({ message: "Graded", answer });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET single answer with student/question details
 * GET /api/theory-answers/:answerId
 */
router.get("/:answerId", authenticate, async (req, res) => {
  try {
    const answer = await TheoryAnswer.findById(req.params.answerId)
      .populate("student", "username fullname")
      .populate({
        path: "question",
        select: "question maxMarks rubric sampleAnswer expectedLength"
      });

    if (!answer) return res.status(404).json({ error: "Not found" });

    // Authorization check
    if (
      answer.student._id.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "tutor"
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json(answer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET all answers for a question (grading dashboard)
 * GET /api/theory-answers?question=<id>
 */
router.get("/", authenticate, authorizeRole("admin", "tutor"), async (req, res) => {
  try {
    const { question, examSet } = req.query;
    const filter = {};

    if (question) filter.question = question;
    if (examSet) filter.examSet = examSet;

    const answers = await TheoryAnswer.find(filter)
      .populate("student", "username fullname email")
      .populate("question", "questionNumber maxMarks")
      .sort({ submittedAt: -1 });

    res.json(answers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
