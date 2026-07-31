import express from "express";
import mongoose from "mongoose";
import Resources from "../models/Resources.js";
import ResourceChapter from "../models/ResourceChapter.js";

const router = express.Router();

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(String(id));
}

async function refreshResourceStats(resourceId) {
  const total = await ResourceChapter.countDocuments({ resource: resourceId });
  const lastChapter = await ResourceChapter.findOne({ resource: resourceId }).sort({ chapterNumber: -1 }).select("chapterNumber").lean();
  const lastChapterNumber = lastChapter ? lastChapter.chapterNumber : 0;
  const totalWordsAgg = await ResourceChapter.aggregate([
    { $match: { resource: mongoose.Types.ObjectId(resourceId) } },
    { $group: { _id: null, words: { $sum: "$wordCount" } } }
  ]);
  const totalWords = (totalWordsAgg[0] && totalWordsAgg[0].words) || 0;
  await Resources.findByIdAndUpdate(resourceId, { totalChapters: total, lastChapterNumber, totalWords }).catch(()=>{});
}

const BookmarkSchema = new mongoose.Schema({
  resource: { type: mongoose.Schema.Types.ObjectId, ref: "Resources", required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });
const Bookmark = mongoose.models.Bookmark || mongoose.model("Bookmark", BookmarkSchema);

const ProgressSchema = new mongoose.Schema({
  resource: { type: mongoose.Schema.Types.ObjectId, ref: "Resources", required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: "ResourceChapter", default: null },
  page: { type: Number, default: 1 },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });
const Progress = mongoose.models.ReaderProgress || mongoose.model("ReaderProgress", ProgressSchema);

router.get("/resources", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "25", 10)));
    const skip = (page - 1) * limit;
    const q = (req.query.q || "").trim();
    const filter = {};
    if (req.query.faculty) filter.faculty = req.query.faculty;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.visibility) filter.visibility = req.query.visibility;
    if (req.query.published) filter.published = req.query.published === "true";
    if (q) filter.$text = { $search: q };
    const [items, total] = await Promise.all([
      Resources.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Resources.countDocuments(filter)
    ]);
    res.json({ success: true, page, limit, total, resources: items });
  } catch (err) { next(err); }
});

router.post("/resources", async (req, res, next) => {
  try {
    const payload = {
      resourceType: req.body.resourceType || "textbook",
      title: req.body.title,
      subtitle: req.body.subtitle || "",
      authors: Array.isArray(req.body.authors) ? req.body.authors : (req.body.authors ? [req.body.authors] : []),
      coauthors: Array.isArray(req.body.coauthors) ? req.body.coauthors : [],
      publisher: req.body.publisher || "",
      edition: req.body.edition || "",
      isbn10: req.body.isbn10 || "",
      isbn13: req.body.isbn13 || "",
      language: req.body.language || "English",
      publicationYear: req.body.publicationYear || "",
      pages: req.body.pages || 0,
      format: req.body.format || "",
      faculty: req.body.faculty || "",
      department: req.body.department || "",
      level: req.body.level || "",
      semester: req.body.semester || "",
      courseCode: req.body.courseCode || "",
      courseTitle: req.body.courseTitle || "",
      lecturer: req.body.lecturer || "",
      description: req.body.description || "",
      introduction: req.body.introduction || "",
      files: Array.isArray(req.body.files) ? req.body.files : (req.body.files ? [req.body.files] : []),
      cover: req.body.cover || {},
      tags: Array.isArray(req.body.tags) ? req.body.tags : []
    };
    const resource = new Resources(payload);
    await resource.save();
    res.status(201).json({ success: true, resource });
  } catch (err) { next(err); }
});

router.get("/resources/:resourceId", async (req, res, next) => {
  try {
    const id = req.params.resourceId;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid id" });
    const resource = await Resources.findById(id).lean();
    if (!resource) return res.status(404).json({ error: "Resource not found" });
    res.json({ success: true, resource });
  } catch (err) { next(err); }
});

router.put("/resources/:resourceId", async (req, res, next) => {
  try {
    const id = req.params.resourceId;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid id" });
    const allowed = ["resourceType","title","subtitle","authors","coauthors","publisher","edition","isbn10","isbn13","language","publicationYear","pages","format","faculty","department","level","semester","courseCode","courseTitle","lecturer","description","introduction","files","cover","tags","visibility","allowPreview","enableDownload","published","publishDate"];
    const update = {};
    allowed.forEach(k => { if (typeof req.body[k] !== "undefined") update[k] = req.body[k]; });
    const resource = await Resources.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!resource) return res.status(404).json({ error: "Resource not found" });
    res.json({ success: true, resource });
  } catch (err) { next(err); }
});

router.delete("/resources/:resourceId", async (req, res, next) => {
  try {
    const id = req.params.resourceId;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid id" });
    const resource = await Resources.findByIdAndDelete(id);
    if (!resource) return res.status(404).json({ error: "Resource not found" });
    await ResourceChapter.deleteMany({ resource: id }).catch(()=>{});
    await Bookmark.deleteMany({ resource: id }).catch(()=>{});
    await Progress.deleteMany({ resource: id }).catch(()=>{});
    res.json({ success: true, message: "Resource and related data removed", resourceId: id });
  } catch (err) { next(err); }
});

router.get("/resources/:resourceId/chapters", async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    if (!isValidId(resourceId)) return res.status(400).json({ error: "Invalid resource id" });
    const resource = await Resources.findById(resourceId).select("_id");
    if (!resource) return res.status(404).json({ error: "Resource not found" });
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || "50", 10)));
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "chapterNumber";
    const [chapters, total] = await Promise.all([
      ResourceChapter.find({ resource: resourceId }).sort(sort).skip(skip).limit(limit).lean(),
      ResourceChapter.countDocuments({ resource: resourceId })
    ]);
    res.json({ success: true, page, limit, total, chapters });
  } catch (err) { next(err); }
});

router.post("/resources/:resourceId/chapters", async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    if (!isValidId(resourceId)) return res.status(400).json({ error: "Invalid resource id" });
    const resource = await Resources.findById(resourceId).select("_id");
    if (!resource) return res.status(404).json({ error: "Resource not found" });
    const payload = {
      resource: resourceId,
      chapterNumber: req.body.chapterNumber,
      title: req.body.title,
      slug: req.body.slug || "",
      description: req.body.description || "",
      contentHtml: req.body.contentHtml || "",
      isLocked: req.body.isLocked || false,
      allowComments: typeof req.body.allowComments === "boolean" ? req.body.allowComments : true,
      status: req.body.status || "draft",
      publishedAt: req.body.publishedAt || null,
      lastEditedBy: req.body.lastEditedBy || null
    };
    const chapter = new ResourceChapter(payload);
    await chapter.save();
    await refreshResourceStats(resourceId);
    res.status(201).json({ success: true, chapter });
  } catch (err) {
    if (err && err.code === 11000) return res.status(409).json({ error: "Chapter number already exists for this resource" });
    next(err);
  }
});

router.get("/resources/:resourceId/chapters/latest", async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    if (!isValidId(resourceId)) return res.status(400).json({ error: "Invalid resource id" });
    const resource = await Resources.findById(resourceId).select("_id");
    if (!resource) return res.status(404).json({ error: "Resource not found" });
    let chapter = await ResourceChapter.findOne({ resource: resourceId, status: "published" }).sort({ chapterNumber: -1 }).lean();
    if (!chapter) chapter = await ResourceChapter.findOne({ resource: resourceId }).sort({ chapterNumber: -1 }).lean();
    if (!chapter) return res.status(404).json({ error: "No chapters found" });
    res.json({ success: true, chapter });
  } catch (err) { next(err); }
});

router.get("/resources/:resourceId/chapters/:chapterId", async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    const chapterId = req.params.chapterId;
    if (!isValidId(resourceId) || !isValidId(chapterId)) return res.status(400).json({ error: "Invalid id(s)" });
    const chapter = await ResourceChapter.findOne({ _id: chapterId, resource: resourceId }).lean();
    if (!chapter) return res.status(404).json({ error: "Chapter not found" });
    res.json({ success: true, chapter });
  } catch (err) { next(err); }
});

router.put("/resources/:resourceId/chapters/:chapterId", async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    const chapterId = req.params.chapterId;
    if (!isValidId(resourceId) || !isValidId(chapterId)) return res.status(400).json({ error: "Invalid id(s)" });
    const chapter = await ResourceChapter.findOne({ _id: chapterId, resource: resourceId });
    if (!chapter) return res.status(404).json({ error: "Chapter not found" });
    const allowed = ["chapterNumber","title","slug","description","contentHtml","isLocked","allowComments","status","publishedAt","lastEditedBy"];
    allowed.forEach(k => { if (typeof req.body[k] !== "undefined") chapter[k] = req.body[k]; });
    await chapter.save();
    await refreshResourceStats(resourceId);
    res.json({ success: true, chapter });
  } catch (err) {
    if (err && err.code === 11000) return res.status(409).json({ error: "Chapter number conflict" });
    next(err);
  }
});

router.delete("/resources/:resourceId/chapters/:chapterId", async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    const chapterId = req.params.chapterId;
    if (!isValidId(resourceId) || !isValidId(chapterId)) return res.status(400).json({ error: "Invalid id(s)" });
    const chapter = await ResourceChapter.findOneAndDelete({ _id: chapterId, resource: resourceId });
    if (!chapter) return res.status(404).json({ error: "Chapter not found" });
    const remaining = await ResourceChapter.find({ resource: resourceId }).sort({ chapterNumber: 1 }).lean();
    for (let i = 0; i < remaining.length; i++) {
      const desired = i + 1;
      if (remaining[i].chapterNumber !== desired) await ResourceChapter.updateOne({ _id: remaining[i]._id }, { chapterNumber: desired });
    }
    await refreshResourceStats(resourceId);
    res.json({ success: true, message: "Chapter deleted", chapterId });
  } catch (err) { next(err); }
});

router.patch("/resources/:resourceId/chapters/:chapterId/autosave", async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    const chapterId = req.params.chapterId;
    if (!isValidId(resourceId) || !isValidId(chapterId)) return res.status(400).json({ error: "Invalid id(s)" });
    const chapter = await ResourceChapter.findOne({ _id: chapterId, resource: resourceId });
    if (!chapter) return res.status(404).json({ error: "Chapter not found" });
    if (typeof req.body.contentHtml !== "undefined") chapter.contentHtml = req.body.contentHtml;
    if (typeof req.body.title !== "undefined") chapter.title = req.body.title;
    chapter.lastEditedBy = req.body.lastEditedBy || chapter.lastEditedBy || null;
    await chapter.save();
    res.json({ success: true, chapter, autosavedAt: chapter.updatedAt });
  } catch (err) { next(err); }
});

router.put("/resources/:resourceId/chapters/:chapterId/publish", async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    const chapterId = req.params.chapterId;
    if (!isValidId(resourceId) || !isValidId(chapterId)) return res.status(400).json({ error: "Invalid id(s)" });
    const chapter = await ResourceChapter.findOne({ _id: chapterId, resource: resourceId });
    if (!chapter) return res.status(404).json({ error: "Chapter not found" });
    chapter.status = "published";
    if (!chapter.publishedAt) chapter.publishedAt = new Date();
    await chapter.save();
    res.json({ success: true, chapter });
  } catch (err) { next(err); }
});

router.put("/resources/:resourceId/chapters/:chapterId/unpublish", async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    const chapterId = req.params.chapterId;
    if (!isValidId(resourceId) || !isValidId(chapterId)) return res.status(400).json({ error: "Invalid id(s)" });
    const chapter = await ResourceChapter.findOne({ _id: chapterId, resource: resourceId });
    if (!chapter) return res.status(404).json({ error: "Chapter not found" });
    chapter.status = "draft";
    await chapter.save();
    res.json({ success: true, chapter });
  } catch (err) { next(err); }
});

router.post("/resources/:resourceId/chapters/:chapterId/duplicate", async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    const chapterId = req.params.chapterId;
    if (!isValidId(resourceId) || !isValidId(chapterId)) return res.status(400).json({ error: "Invalid id(s)" });
    const original = await ResourceChapter.findOne({ _id: chapterId, resource: resourceId });
    if (!original) return res.status(404).json({ error: "Chapter not found" });
    const toShift = await ResourceChapter.find({ resource: resourceId, chapterNumber: { $gt: original.chapterNumber } }).sort({ chapterNumber: -1 });
    const bulk = toShift.map(c => ({ updateOne: { filter: { _id: c._id }, update: { $inc: { chapterNumber: 1 } } } }));
    if (bulk.length) await ResourceChapter.bulkWrite(bulk);
    const dup = new ResourceChapter({
      resource: resourceId,
      chapterNumber: original.chapterNumber + 1,
      title: (original.title || "") + " (Copy)",
      slug: "",
      description: original.description || "",
      contentHtml: original.contentHtml || "",
      isLocked: original.isLocked,
      allowComments: original.allowComments,
      status: "draft",
      lastEditedBy: req.body.lastEditedBy || null
    });
    await dup.save();
    await refreshResourceStats(resourceId);
    res.status(201).json({ success: true, chapter: dup });
  } catch (err) { next(err); }
});

router.get("/resources/:resourceId/chapters/:chapterId/navigation", async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    const chapterId = req.params.chapterId;
    if (!isValidId(resourceId) || !isValidId(chapterId)) return res.status(400).json({ error: "Invalid id(s)" });
    const chapter = await ResourceChapter.findOne({ _id: chapterId, resource: resourceId }).lean();
    if (!chapter) return res.status(404).json({ error: "Chapter not found" });
    const prev = await ResourceChapter.findOne({ resource: resourceId, chapterNumber: { $lt: chapter.chapterNumber } }).sort({ chapterNumber: -1 }).select("_id chapterNumber title slug").lean();
    const next = await ResourceChapter.findOne({ resource: resourceId, chapterNumber: { $gt: chapter.chapterNumber } }).sort({ chapterNumber: 1 }).select("_id chapterNumber title slug").lean();
    res.json({ success: true, navigation: { previous: prev || null, next: next || null } });
  } catch (err) { next(err); }
});

router.put("/resources/:resourceId/chapters/reorder", async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    const order = req.body.order;
    if (!isValidId(resourceId)) return res.status(400).json({ error: "Invalid resource id" });
    if (!Array.isArray(order) || order.length === 0) return res.status(400).json({ error: "Order must be non-empty array" });
    const invalid = order.find(id => !isValidId(id));
    if (invalid) return res.status(400).json({ error: "Order contains invalid id" });
    const existing = await ResourceChapter.find({ resource: resourceId }).select("_id").lean();
    if (order.length !== existing.length) return res.status(400).json({ error: "Order length mismatch" });
    const existingIds = new Set(existing.map(c => String(c._id)));
    for (const id of order) if (!existingIds.has(String(id))) return res.status(400).json({ error: "Order contains chapter not belonging to resource" });
    const bulkOps = order.map((chapterId, idx) => ({ updateOne: { filter: { _id: chapterId, resource: resourceId }, update: { chapterNumber: idx + 1 } } }));
    if (bulkOps.length) await ResourceChapter.bulkWrite(bulkOps);
    await refreshResourceStats(resourceId);
    res.json({ success: true, order });
  } catch (err) { next(err); }
});

router.get("/resources/:resourceId/search", async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    const q = (req.query.q || "").trim();
    if (!isValidId(resourceId)) return res.status(400).json({ error: "Invalid resource id" });
    if (!q) return res.status(400).json({ error: "Query parameter q is required" });
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "25", 10)));
    const skip = (page - 1) * limit;
    const chapters = await ResourceChapter.find({ resource: resourceId, $text: { $search: q } }, { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } }).skip(skip).limit(limit).lean();
    const total = await ResourceChapter.countDocuments({ resource: resourceId, $text: { $search: q } });
    res.json({ success: true, q, page, limit, total, chapters });
  } catch (err) { next(err); }
});

router.get("/resources/:resourceId/statistics", async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    if (!isValidId(resourceId)) return res.status(400).json({ error: "Invalid resource id" });
    const resource = await Resources.findById(resourceId).lean();
    if (!resource) return res.status(404).json({ error: "Resource not found" });
    const chapters = await ResourceChapter.find({ resource: resourceId }).select("chapterNumber wordCount").lean();
    const totalChapters = chapters.length;
    const totalWords = chapters.reduce((s, c) => s + (c.wordCount || 0), 0);
    const lastChapterNumber = chapters.length ? Math.max(...chapters.map(c => c.chapterNumber || 0)) : 0;
    const bookmarksCount = await Bookmark.countDocuments({ resource: resourceId });
    res.json({ success: true, statistics: { totalChapters, totalWords, lastChapterNumber, bookmarksCount, resourceCreatedAt: resource.createdAt } });
  } catch (err) { next(err); }
});

router.post("/resources/:resourceId/bookmarks", async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    const userId = req.body.userId;
    if (!isValidId(resourceId) || !isValidId(userId)) return res.status(400).json({ error: "Invalid id(s)" });
    const resource = await Resources.findById(resourceId).select("_id");
    if (!resource) return res.status(404).json({ error: "Resource not found" });
    const existing = await Bookmark.findOne({ resource: resourceId, user: userId });
    if (existing) return res.status(200).json({ success: true, bookmark: existing });
    const bm = new Bookmark({ resource: resourceId, user: userId });
    await bm.save();
    res.status(201).json({ success: true, bookmark: bm });
  } catch (err) { next(err); }
});

router.get("/resources/:resourceId/continue", async (req, res, next) => {
  try {
    const resourceId = req.params.resourceId;
    const userId = req.query.userId;
    if (!isValidId(resourceId) || !isValidId(userId)) return res.status(400).json({ error: "Invalid id(s)" });
    const prog = await Progress.findOne({ resource: resourceId, user: userId }).sort({ updatedAt: -1 }).populate("chapter").lean();
    if (!prog) return res.status(404).json({ error: "No reading progress found" });
    res.json({ success: true, continue: { chapter: prog.chapter || null, page: prog.page || 1, updatedAt: prog.updatedAt } });
  } catch (err) { next(err); }
});

router.get("/resources/recent", async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const items = await Resources.find({}).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ success: true, resources: items });
  } catch (err) { next(err); }
});

router.get("/resources/favourites", async (req, res, next) => {
  try {
    const userId = req.query.userId;
    if (!isValidId(userId)) return res.status(400).json({ error: "Invalid userId" });
    const bookmarks = await Bookmark.find({ user: userId }).populate("resource").sort({ createdAt: -1 }).lean();
    const resources = bookmarks.map(b => b.resource).filter(Boolean);
    res.json({ success: true, resources });
  } catch (err) { next(err); }
});

export default router;
