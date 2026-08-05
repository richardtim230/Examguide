// ============ routes/examSet.js ============

import express from "express";
import ExamSet from "../models/ExamSet.js";
import CbtQuestion from "../models/CbtQuestion.js";
import { authenticate } from "../middleware/authenticate.js";
import { sendNotificationToAllUsers } from "../services/notificationService.js";

const router = express.Router();

/**
 * Create an ExamSet
 * POST /api/exam-set
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { subject, title, accessCode, duration, examType } = req.body;
    let { tags } = req.body;

    if (!subject || !title || !accessCode) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    let tagsArr = [];

    if (Array.isArray(tags)) {
      tagsArr = tags.filter(Boolean);
    } else if (typeof tags === "string" && tags.length) {
      tagsArr = tags
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);
    }

    if (tagsArr.length === 0) {
      tagsArr = ["university"];
    }

    const existing = await ExamSet.findOne({ accessCode });

    if (existing) {
      return res.status(409).json({
        error: "Access code already exists"
      });
    }

    const createdBy = req.user?._id || req.user?.id;

    if (!createdBy) {
      return res.status(401).json({
        error: "Unable to determine authenticated user"
      });
    }

    const set = await ExamSet.create({
      subject: subject.trim(),
      title: title.trim(),
      accessCode: accessCode.trim(),
      duration: duration ? Number(duration) : 3600,
      tags: tagsArr,
      examType: examType || "cbt",
      createdBy
    });

    try {
      const notificationPayload = {
        title: `🎓 New Mock Exam Available!`,
        message: `${subject} - ${title}`,
        image: "https://oau.examguard.com.ng/logo.png",
        icon: "https://oau.examguard.com.ng/logo.png",
        url: `https://oau.examguard.com.ng/tutor/mock.html?accessCode=${set.accessCode}`,
        type: "exam",
        examCode: set.accessCode
      };

      await sendNotificationToAllUsers(notificationPayload);
    } catch (notifErr) {
      console.error(
        "⚠ Notification failed:",
        notifErr.message
      );
    }

    res.status(201).json(set);

  } catch (e) {
    console.error("Create ExamSet error:", e);
    res.status(500).json({
      error: e.message
    });
  }
});


/**
 * Get only ExamSets created by the logged-in user
 *
 * GET /api/exam-set/mine
 */
router.get("/mine", authenticate, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const filter = {
      createdBy: userId
    };

    if (req.query.subject) {
      filter.subject = req.query.subject;
    }

    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    if (req.query.tags) {
      const tagsArr = Array.isArray(req.query.tags)
        ? req.query.tags
        : req.query.tags
            .split(",")
            .map(t => t.trim())
            .filter(Boolean);

      filter.tags = {
        $in: tagsArr
      };
    }

    const sets = await ExamSet
      .find(filter)
      .populate("createdBy", "fullname username email profilePic")
      .sort({ createdAt: -1 });

    res.json(sets);

  } catch (e) {
    console.error("Fetch my ExamSets error:", e);

    res.status(500).json({
      error: e.message
    });
  }
});


/**
 * List all ExamSets
 *
 * GET /api/exam-set
 */
router.get("/", async (req, res) => {
  try {
    const filter = {};

    if (req.query.subject) {
      filter.subject = req.query.subject;
    }

    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    if (req.query.tags) {
      const tagsArr = Array.isArray(req.query.tags)
        ? req.query.tags
        : req.query.tags
            .split(",")
            .map(t => t.trim())
            .filter(Boolean);

      filter.tags = {
        $in: tagsArr
      };
    }

    const sets = await ExamSet
      .find(filter)
      .populate("createdBy", "fullname username email profilePic")
      .sort({ createdAt: -1 });

    res.json(sets);

  } catch (e) {
    console.error("Fetch ExamSets error:", e);

    res.status(500).json({
      error: e.message
    });
  }
});


/**
 * Get random ExamSets for homepage announcements
 *
 * GET /api/exam-set/random?limit=3
 */
router.get("/random", async (req, res) => {
  try {
    let limit = Number(req.query.limit) || 3;

    // Keep the limit reasonable
    limit = Math.min(Math.max(limit, 1), 10);

    const sets = await ExamSet.aggregate([
      {
        $match: {
          examType: { $in: ["cbt", "mock"] }
        }
      },
      {
        $sample: {
          size: limit
        }
      }
    ]);

    // Populate createdBy after aggregation
    const populatedSets = await ExamSet.populate(sets, {
      path: "createdBy",
      select: "fullname username email profilePic"
    });

    res.json(populatedSets);

  } catch (e) {
    console.error("Fetch random ExamSets error:", e);

    res.status(500).json({
      error: e.message
    });
  }
});
router.get("/by-access", async (req, res) => {
  try {
    const {
      accessCode
    } = req.query;

    if (!accessCode) {
      return res.status(400).json({
        error: "accessCode required"
      });
    }

    const examSet = await ExamSet
      .findOne({ accessCode: accessCode.trim() })
      .populate("createdBy", "fullname username email profilePic");

    if (!examSet) {
      return res.status(404).json({
        error: "Exam set not found"
      });
    }

    const questions = await CbtQuestion.find({
      examSet: examSet._id
    });

    res.json({
      examSet,
      questions
    });

  } catch (e) {
    console.error("Get ExamSet by access error:", e);

    res.status(500).json({
      error: e.message
    });
  }
});


/**
 * Get a single ExamSet by ID
 *
 * GET /api/exam-set/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const examSet = await ExamSet
      .findById(req.params.id)
      .populate("createdBy", "fullname username email profilePic");

    if (!examSet) {
      return res.status(404).json({
        error: "Exam set not found"
      });
    }

    const questions = await CbtQuestion.find({
      examSet: examSet._id
    });

    res.json({
      examSet,
      questions
    });

  } catch (e) {
    console.error("Get ExamSet error:", e);

    res.status(500).json({
      error: e.message
    });
  }
});


/**
 * Update ExamSet
 *
 * PUT /api/exam-set/:id
 *
 * Only the owner can update it.
 */
router.put("/:id", authenticate, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const examSet = await ExamSet.findById(req.params.id);

    if (!examSet) {
      return res.status(404).json({
        error: "Exam set not found"
      });
    }

    if (
      !examSet.createdBy ||
      String(examSet.createdBy) !== String(userId)
    ) {
      return res.status(403).json({
        error: "You are not allowed to modify this exam set"
      });
    }

    const update = {
      ...req.body
    };

    delete update.createdBy;
    delete update.accessCode;

    if (update.tags && typeof update.tags === "string") {
      update.tags = update.tags
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);
    }

    const updatedSet = await ExamSet.findByIdAndUpdate(
      req.params.id,
      update,
      {
        new: true,
        runValidators: true
      }
    ).populate(
      "createdBy",
      "fullname username email profilePic"
    );

    res.json(updatedSet);

  } catch (e) {
    console.error("Update ExamSet error:", e);

    res.status(500).json({
      error: e.message
    });
  }
});


/**
 * Delete ExamSet and its questions
 *
 * DELETE /api/exam-set/:id
 *
 * Only the owner can delete it.
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const examSet = await ExamSet.findById(req.params.id);

    if (!examSet) {
      return res.status(404).json({
        error: "Exam set not found"
      });
    }

    if (
      !examSet.createdBy ||
      String(examSet.createdBy) !== String(userId)
    ) {
      return res.status(403).json({
        error: "You are not allowed to delete this exam set"
      });
    }

    await CbtQuestion.deleteMany({
      examSet: examSet._id
    });

    await ExamSet.findByIdAndDelete(examSet._id);

    res.json({
      message: "Exam set and its questions deleted successfully",
      id: examSet._id
    });

  } catch (e) {
    console.error("Delete ExamSet error:", e);

    res.status(500).json({
      error: e.message
    });
  }
});


export default router;
