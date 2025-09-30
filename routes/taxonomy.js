import express from "express";
import Post from "../models/Post.js";
const router = express.Router();

router.get("/taxonomy/all", async (req, res) => {
  try {
    const [categories, subjects, topics] = await Promise.all([
      Post.distinct("category"),
      Post.distinct("subject"),
      Post.distinct("topic"),
    ]);
    res.json({
      categories: categories.filter(Boolean),
      subjects: subjects.filter(Boolean),
      topics: topics.filter(Boolean),
    });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch taxonomy." });
  }
});

router.get("/taxonomy/subjects", async (req, res) => {
  const { category } = req.query;
  if (!category) return res.status(400).json({ error: "Missing category" });
  try {
    const subjects = await Post.distinct("subject", { category });
    res.json({ subjects: subjects.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch subjects." });
  }
});

router.get("/taxonomy/topics", async (req, res) => {
  const { category, subject } = req.query;
  if (!subject) return res.status(400).json({ error: "Missing subject" });
  const filter = { subject };
  if (category) filter.category = category;
  try {
    const topics = await Post.distinct("topic", filter);
    res.json({ topics: topics.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch topics." });
  }
});

export default router;
