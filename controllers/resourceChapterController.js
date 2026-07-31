// controllers/resourceChapterController.js
import mongoose from "mongoose";
import Resources from "../models/Resources.js";
import ResourceChapter from "../models/ResourceChapter.js";

/**
 * Controller for resource chapters (create, read, update, delete, reorder)
 */

/** Helper: validate ObjectId */
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(String(id));
}

/** Helper: refresh resource chapter stats (totalChapters, lastChapterNumber) */
async function refreshResourceStats(resourceId) {
  const total = await ResourceChapter.countDocuments({ resource: resourceId });
  const lastChapter = await ResourceChapter.findOne({ resource: resourceId })
    .sort({ chapterNumber: -1 })
    .select("chapterNumber")
    .lean();
  const lastChapterNumber = lastChapter ? lastChapter.chapterNumber : 0;
  await Resources.findByIdAndUpdate(resourceId, {
    totalChapters: total,
    lastChapterNumber
  }).catch(() => {});
}

/**
 * createChapter
 * POST /resource/:resourceId/chapters
 */
export async function createChapter(req, res, next) {
  try {
    const { resourceId } = req.params;
    if (!isValidId(resourceId)) return res.status(400).json({ error: "Invalid resourceId" });

    const resource = await Resources.findById(resourceId).select("_id");
    if (!resource) return res.status(404).json({ error: "Resource not found" });

    const payload = {
      resource: resourceId,
      chapterNumber: req.body.chapterNumber,
      title: req.body.title,
      slug: req.body.slug || "",
      description: req.body.description || "",
      contentHtml: req.body.contentHtml || "",
      isLocked: typeof req.body.isLocked === "boolean" ? req.body.isLocked : false,
      allowComments: typeof req.body.allowComments === "boolean" ? req.body.allowComments : true,
      status: req.body.status || "draft",
      publishedAt: req.body.publishedAt || null,
      lastEditedBy: req.body.lastEditedBy || null
    };

    const chapter = new ResourceChapter(payload);
    await chapter.save();

    // refresh resource stats
    await refreshResourceStats(resourceId);

    return res.status(201).json({ success: true, chapter });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: "Chapter number already exists for this resource", details: err.keyValue || null });
    }
    next(err);
  }
}

/**
 * getBookChapters
 * GET /resource/:resourceId/chapters
 * supports pagination: ?page=1&limit=50 and sort (field)
 */
export async function getBookChapters(req, res, next) {
  try {
    const { resourceId } = req.params;
    if (!isValidId(resourceId)) return res.status(400).json({ error: "Invalid resourceId" });

    const resource = await Resources.findById(resourceId).select("_id");
    if (!resource) return res.status(404).json({ error: "Resource not found" });

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "50", 10)));
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "chapterNumber";

    const [chapters, total] = await Promise.all([
      ResourceChapter.find({ resource: resourceId })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      ResourceChapter.countDocuments({ resource: resourceId })
    ]);

    return res.json({
      success: true,
      page,
      limit,
      total,
      chapters
    });
  } catch (err) {
    next(err);
  }
}

/**
 * getChapter
 * GET /resource/:resourceId/chapters/:chapterId
 */
export async function getChapter(req, res, next) {
  try {
    const { resourceId, chapterId } = req.params;
    if (!isValidId(resourceId) || !isValidId(chapterId)) return res.status(400).json({ error: "Invalid id(s)" });

    const chapter = await ResourceChapter.findOne({ _id: chapterId, resource: resourceId }).lean();
    if (!chapter) return res.status(404).json({ error: "Chapter not found for this resource" });

    return res.json({ success: true, chapter });
  } catch (err) {
    next(err);
  }
}

/**
 * updateChapter
 * PUT /resource/:resourceId/chapters/:chapterId
 */
export async function updateChapter(req, res, next) {
  try {
    const { resourceId, chapterId } = req.params;
    if (!isValidId(resourceId) || !isValidId(chapterId)) return res.status(400).json({ error: "Invalid id(s)" });

    const chapter = await ResourceChapter.findOne({ _id: chapterId, resource: resourceId });
    if (!chapter) return res.status(404).json({ error: "Chapter not found for this resource" });

    const allowed = [
      "chapterNumber",
      "title",
      "slug",
      "description",
      "contentHtml",
      "isLocked",
      "allowComments",
      "status",
      "publishedAt",
      "lastEditedBy"
    ];
    allowed.forEach((k) => {
      if (typeof req.body[k] !== "undefined") chapter[k] = req.body[k];
    });

    await chapter.save();

    // refresh stats if chapterNumber may have changed
    await refreshResourceStats(resourceId);

    return res.json({ success: true, chapter });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: "Chapter number already exists for this resource", details: err.keyValue || null });
    }
    next(err);
  }
}

/**
 * deleteChapter
 * DELETE /resource/:resourceId/chapters/:chapterId
 */
export async function deleteChapter(req, res, next) {
  try {
    const { resourceId, chapterId } = req.params;
    if (!isValidId(resourceId) || !isValidId(chapterId)) return res.status(400).json({ error: "Invalid id(s)" });

    const chapter = await ResourceChapter.findOneAndDelete({ _id: chapterId, resource: resourceId });
    if (!chapter) return res.status(404).json({ error: "Chapter not found for this resource" });

    // refresh stats
    await refreshResourceStats(resourceId);

    return res.json({ success: true, message: "Chapter deleted", chapterId });
  } catch (err) {
    next(err);
  }
}

/**
 * reorderChapters
 * PUT /resource/:resourceId/reorder
 * body: { order: [ "chapterId1", "chapterId2", ... ] }
 */
export async function reorderChapters(req, res, next) {
  try {
    const { resourceId } = req.params;
    const { order } = req.body;

    if (!isValidId(resourceId)) return res.status(400).json({ error: "Invalid resourceId" });
    if (!Array.isArray(order) || order.length === 0) return res.status(400).json({ error: "Order must be a non-empty array of chapterIds" });

    // validate chapter ids
    const invalid = order.find((id) => !isValidId(id));
    if (invalid) return res.status(400).json({ error: "Order contains invalid chapterId", invalid });

    // fetch existing chapters for resource
    const existing = await ResourceChapter.find({ resource: resourceId }).select("_id chapterNumber").lean();
    const existingIds = new Set(existing.map((c) => String(c._id)));
    if (order.length !== existing.length) {
      return res.status(400).json({ error: "Order length must match number of existing chapters", existingCount: existing.length, provided: order.length });
    }
    for (const id of order) {
      if (!existingIds.has(String(id))) {
        return res.status(400).json({ error: "Order contains chapter that does not belong to the resource", invalidId: id });
      }
    }

    // perform updates in bulk
    const bulkOps = order.map((chapterId, idx) => {
      return {
        updateOne: {
          filter: { _id: chapterId, resource: resourceId },
          update: { chapterNumber: idx + 1 }
        }
      };
    });

    if (bulkOps.length) {
      await ResourceChapter.bulkWrite(bulkOps);
    }

    // refresh stats
    await refreshResourceStats(resourceId);

    return res.json({ success: true, message: "Reordered chapters", order });
  } catch (err) {
    next(err);
  }
}
