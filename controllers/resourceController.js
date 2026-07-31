import Resources from "../models/Resources.js";
import path from "path";
import sanitizeHtml from "sanitize-html";
import { createClient } from "@supabase/supabase-js";

// Supabase client (server-side key recommended)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY).");
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

// Buckets (configurable via env)
const RESOURCES_BUCKET = process.env.SUPABASE_RESOURCES_BUCKET || "resources";
const COVERS_BUCKET = process.env.SUPABASE_COVERS_BUCKET || "covers";
const EDITOR_BUCKET = process.env.SUPABASE_EDITOR_BUCKET || "editor";

// Helpers
function sanitizeFilename(filename) {
  return filename.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-\.]/g, "");
}
function makeKey(prefix, originalName) {
  const ext = path.extname(originalName) || "";
  const base = path.basename(originalName, ext);
  const name = sanitizeFilename(base).slice(0, 100);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}/${name}-${unique}${ext}`;
}

async function uploadBufferToSupabase(buffer, bucket, destinationPath, contentType) {
  // supabase-js upload accepts Buffer
  const { data, error } = await supabase.storage.from(bucket).upload(destinationPath, buffer, {
    contentType,
    cacheControl: "3600",
    upsert: false
  });
  if (error) throw error;
  // get public url
  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(destinationPath);
  return {
    path: data?.path || destinationPath,
    publicUrl: publicData?.publicUrl || `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURIComponent(destinationPath)}`
  };
}

function parseListField(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(s => (s || "").trim()).filter(Boolean);
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

function buildPublicFileUrlFromSupabase(bucket, key, publicUrl) {
  if (publicUrl) return publicUrl;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURIComponent(key)}`;
}

/**
 * Create a resource (multipart form upload)
 * Expects:
 * - mainFile (single) optional — multer memory storage provides req.file or req.files
 * - coverFile (single) optional — multer memory storage provides req.coverFile
 * - form fields as before
 */
export async function createResource(req, res) {
  try {
    const title = (req.body.title || "").trim();
    if (!title) return res.status(400).json({ error: "Title is required" });

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
      semester: req.body.semester || req.body.textbookSemester || req.body.notebookSemester || "",
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

    // Attach main uploaded file(s)
    resource.files = [];

    // Helper to consume a multer file (memory or pre-uploaded)
    async function processIncomingFile(f, targetBucketPrefix = RESOURCES_BUCKET) {
      if (!f) return null;

      // If middleware already uploaded to supabase and attached bucket/key/publicUrl, use it.
      if (f.bucket && f.key) {
        const url = f.publicUrl || buildPublicFileUrlFromSupabase(f.bucket, f.key);
        return {
          name: f.originalname || f.name || "",
          label: f.fieldname || f.label || "",
          mimeType: f.mimetype || f.type || "",
          size: f.size || 0,
          url,
          storageType: "supabase",
          bucket: f.bucket,
          publicId: f.key,
          fileId: f.key,
          uploadedAt: new Date()
        };
      }

      // Expect buffer (multer memoryStorage)
      if (f.buffer && Buffer.isBuffer(f.buffer)) {
        // destination key
        const key = makeKey(targetBucketPrefix, f.originalname || f.name || "file");
        const { path: uploadedPath, publicUrl } = await uploadBufferToSupabase(f.buffer, targetBucketPrefix, key, f.mimetype || undefined);
        return {
          name: f.originalname || f.name || "",
          label: f.fieldname || f.label || "",
          mimeType: f.mimetype || f.type || "",
          size: f.size || (f.buffer ? f.buffer.length : 0),
          url: publicUrl,
          storageType: "supabase",
          bucket: targetBucketPrefix,
          publicId: uploadedPath,
          fileId: uploadedPath,
          uploadedAt: new Date()
        };
      }

      // fallback: cannot handle
      return null;
    }

    // Single main file (req.file) preferred; else check req.files arrays
    if (req.file) {
      const fileObj = await processIncomingFile(req.file, RESOURCES_BUCKET);
      if (fileObj) resource.files.push(fileObj);
    } else if (req.files && Array.isArray(req.files) && req.files.length) {
      for (const f of req.files) {
        const fo = await processIncomingFile(f, RESOURCES_BUCKET);
        if (fo) resource.files.push(fo);
      }
    } else if (req.files && typeof req.files === "object") {
      // multer may provide keyed object: { mainFile: [..], other: [..] }
      const arr = Object.values(req.files).flat();
      for (const f of arr) {
        const targetBucket = (f.fieldname === "coverFile") ? COVERS_BUCKET : RESOURCES_BUCKET;
        const fo = await processIncomingFile(f, targetBucket);
        if (fo) resource.files.push(fo);
      }
    }

    // Attach cover file (req.coverFile or req.files.coverFile[0])
    let coverFileCandidate = null;
    if (req.coverFile) coverFileCandidate = req.coverFile;
    else if (req.files && req.files.coverFile && Array.isArray(req.files.coverFile)) coverFileCandidate = req.files.coverFile[0];
    else if (req.files && typeof req.files === "object" && req.files.coverFile) coverFileCandidate = req.files.coverFile[0];

    if (coverFileCandidate) {
      const coverObj = await processIncomingFile(coverFileCandidate, COVERS_BUCKET);
      if (coverObj) {
        resource.cover = {
          url: coverObj.url,
          mimeType: coverObj.mimeType,
          size: coverObj.size,
          storageType: "supabase",
          bucket: coverObj.bucket,
          publicId: coverObj.publicId
        };
      }
    }

    if (resource.published) resource.publishDate = new Date();
    if (req.user && req.user._id) resource.uploader = req.user._id;

    const doc = await Resources.create(resource);
    return res.status(201).json({ success: true, resource: doc });
  } catch (err) {
    console.error("createResource error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

export async function uploadEditorImage(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // If middleware already uploaded to Supabase
    if (req.file.bucket && req.file.key) {
      const publicUrl = req.file.publicUrl || buildPublicFileUrlFromSupabase(req.file.bucket, req.file.key);
      return res.json({ success: true, url: publicUrl });
    }

    if (!req.file.buffer || !Buffer.isBuffer(req.file.buffer)) {
      return res.status(400).json({ error: "Invalid editor file payload" });
    }

    const key = makeKey("editor", req.file.originalname || "editor-image");
    const { path: uploadedPath, publicUrl } = await uploadBufferToSupabase(req.file.buffer, EDITOR_BUCKET, key, req.file.mimetype || undefined);

    return res.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error("uploadEditorImage error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/* Expose helper to delete files from Supabase (used by routes) */
export async function deleteSupabaseFile(bucket, key) {
  if (!bucket || !key) return;
  try {
    await supabase.storage.from(bucket).remove([key]);
  } catch (e) {
    // don't throw — best-effort
    console.warn("deleteSupabaseFile error", e);
  }
}
