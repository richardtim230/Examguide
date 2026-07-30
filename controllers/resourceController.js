import Resources from "../models/Resources.js";
import path from "path";
import sanitizeHtml from "sanitize-html";

/**
 * Create a resource (multipart form upload)
 * Expects:
 * - mainFile (single) optional — uploaded via resourceUpload.single('mainFile')
 * - coverFile (single) optional — uploaded via coverUpload.single('coverFile')
 * - other form fields (title, subtitle, authors (comma list), tags (comma list or JSON array), contentHtml)
 */
export async function createResource(req, res) {
  try {
    // Basic required validation
    const title = (req.body.title || "").trim();
    if (!title) return res.status(400).json({ error: "Title is required" });

    // Build resource doc
    const resource = {
      title,
      subtitle: req.body.subtitle || "",
      authors: parseListField(req.body.authors || req.body.bookAuthor || ""),
      coauthors: parseListField(req.body.coauthors || req.body.bookCoAuthor || ""),
      publisher: req.body.publisher || req.body.bookPublisher || "",
      edition: req.body.edition || req.body.bookEdition || "",
      isbn10: req.body.isbn10 || "",
      isbn13: req.body.isbn13 || "",
      language: req.body.language || req.body.languageSelect || "English",
      publicationYear: req.body.publicationYear || req.body.pubYearSelect || "",
      pages: parseIntSafe(req.body.pages || req.body.bookPages),
      format: req.body.format || req.body.formatSelect || "",
      faculty: req.body.faculty || req.body.textbookFaculty || req.body.notebookFaculty || "",
      department: req.body.department || req.body.textbookDept || req.body.notebookDept || "",
      level: req.body.level || req.body.textbookLevel || req.body.notebookLevel || "",
      semester: req.body.semester || req.body.textbookSemester || "",
      courseCode: req.body.courseCode || req.body.textbookCourseCode || "",
      courseTitle: req.body.courseTitle || req.body.textbookCourseTitle || "",
      contentHtml: sanitizeHtml(req.body.contentHtml || req.body.notebookContent || req.body.content || "", {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img' ]),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          img: ['src', 'alt', 'width', 'height', 'style']
        }
      }),
      tags: parseListField(req.body.tags || req.body.tagInput || req.body.tagsJson || ""),
      copyrightHolder: req.body.copyrightHolder || "",
      licenseType: req.body.licenseType || req.body.copyrightLicense || "All Rights Reserved",
      visibility: req.body.visibility || "public",
      allowPreview: parseBool(req.body.allowPreview, true),
      allowComments: parseBool(req.body.allowComments, true),
      enableDownload: parseBool(req.body.enableDownload, true),
      published: parseBool(req.body.publishNow, req.body.publishNow === undefined ? (req.body.publishNowCheck === "on" || req.body.publishNowCheck === "true") : false),
      publishDate: null,
    };

    // Attach main uploaded file if present
    resource.files = [];
    if (req.file) {
      resource.files.push({
        name: req.file.originalname,
        label: req.body.fileLabel || req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: buildPublicFileUrl(req.file.path),
        storageType: "local",
        uploadedAt: new Date()
      });
    } else if (req.files && Array.isArray(req.files) && req.files.length) {
      for (const f of req.files) {
        resource.files.push({
          name: f.originalname,
          label: f.fieldname,
          mimeType: f.mimetype,
          size: f.size,
          url: buildPublicFileUrl(f.path),
          storageType: "local",
          uploadedAt: new Date()
        });
      }
    }

    // Attach cover file
    if (req.coverFile) {
      resource.cover = {
        url: buildPublicFileUrl(req.coverFile.path),
        mimeType: req.coverFile.mimetype,
        size: req.coverFile.size
      };
    } else if (req.files && req.files.cover) {
      // If using different field grouping
      const cf = req.files.cover[0];
      if (cf) {
        resource.cover = {
          url: buildPublicFileUrl(cf.path),
          mimeType: cf.mimetype,
          size: cf.size
        };
      }
    }

    if (resource.published) resource.publishDate = new Date();

    // Optionally attach uploader if user is authenticated and present on req.user
    if (req.user && req.user._id) resource.uploader = req.user._id;

    const doc = await Resources.create(resource);
    return res.status(201).json({ success: true, resource: doc });
  } catch (err) {
    console.error("createResource error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

export async function uploadEditorImage(req, res) {
  // Handles Quill image uploads; returns JSON with "url"
  try {
    // multer placed file on req.file
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const publicUrl = buildPublicFileUrl(req.file.path);
    return res.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error("uploadEditorImage error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/* Helpers */
function parseListField(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(s => (s || "").trim()).filter(Boolean);
  // could be JSON array or comma-separated string
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed)) return parsed.map(String).map(s => s.trim()).filter(Boolean);
  } catch (e) {
    // not JSON
  }
  return v.split(",").map(s => s.trim()).filter(Boolean);
}

function parseBool(v, fallback = false) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    return ["1","true","on","yes"].includes(v.toLowerCase());
  }
  return fallback;
}

function parseIntSafe(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}

function buildPublicFileUrl(fsPath) {
  // This function returns a URL path that corresponds to how you serve the uploads folder.
  // By default we'll return a path under /uploads/...
  // Ensure in server you do: app.use('/uploads', express.static(process.env.UPLOAD_DIR || path.join(__dirname, 'uploads')));
  const normalized = fsPath.split(path.sep).join("/");
  const idx = normalized.indexOf("/uploads/");
  if (idx >= 0) return normalized.slice(idx);
  // fallback: return filename
  return `/uploads/${path.basename(fsPath)}`;
}
