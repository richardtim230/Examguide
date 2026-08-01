import Resources from "../models/Resources.js";
import path from "path";
import sanitizeHtml from "sanitize-html";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY).");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const RESOURCES_BUCKET = process.env.SUPABASE_RESOURCES_BUCKET || "resources";
const COVERS_BUCKET = process.env.SUPABASE_COVERS_BUCKET || "covers";
const EDITOR_BUCKET = process.env.SUPABASE_EDITOR_BUCKET || "editor";

// Story/Genre categories for notebooks
const NOTEBOOK_CATEGORIES = [
  "Science Fiction",
  "Fantasy",
  "Mystery",
  "Romance",
  "Thriller",
  "Horror",
  "Adventure",
  "Drama",
  "Historical Fiction",
  "Biography",
  "Self-Help",
  "Education",
  "Poetry",
  "Short Stories",
  "Memoirs",
  "Other"
];

function sanitizeFilename(filename) {
  return filename.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-\.]/g, "");
}

function makeKey(originalName, folderPrefix = "") {
  const ext = path.extname(originalName) || "";
  const base = path.basename(originalName, ext);
  const name = sanitizeFilename(base).slice(0, 100) || "file";
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return folderPrefix ? `${folderPrefix}/${name}-${unique}${ext}` : `${name}-${unique}${ext}`;
}

/**
 * Generate a unique ISBN-13 for notebooks
 * Format: 978-YYMM-RRRR-C where:
 * YY = year, MM = month, RRRR = random, C = check digit
 */
function generateISBN13() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  
  // Base: 978 + YYMM + RRRR
  const baseIsbn = `978${year}${month}${random}`;
  
  // Calculate check digit (ISBN-13 mod 10)
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(baseIsbn[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return `${baseIsbn}${checkDigit}`;
}

/**
 * Generate ISBN-10 from ISBN-13
 */
function generateISBN10() {
  const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, "0");
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(random[i]) * (10 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 11;
  const check = checkDigit === 10 ? "X" : checkDigit.toString();
  
  return `${random}${check}`;
}

async function uploadBufferToSupabase(buffer, bucket, destinationPath, contentType) {
  const { data, error } = await supabase.storage.from(bucket).upload(destinationPath, buffer, {
    contentType,
    cacheControl: "3600",
    upsert: false
  });
  if (error) throw error;

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(destinationPath);
  return {
    path: data?.path || destinationPath,
    publicUrl: publicData?.publicUrl || `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURIComponent(destinationPath)}`
  };
}

export async function deleteSupabaseFile(bucket, key) {
  if (!bucket || !key) return;
  try {
    await supabase.storage.from(bucket).remove([key]);
  } catch (e) {
    console.warn("deleteSupabaseFile error:", e);
  }
}

function parseListField(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(s => (s || "").trim()).filter(Boolean);
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed)) return parsed.map(String).map(s => s.trim()).filter(Boolean);
  } catch (e) {
  }
  return String(v).split(",").map(s => s.trim()).filter(Boolean);
}

function parseBool(v, fallback = false) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    return ["1", "true", "on", "yes"].includes(v.toLowerCase());
  }
  return fallback;
}

function parseIntSafe(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}

async function processIncomingFile(f, targetBucket, cleanupTracker = []) {
  if (!f) return null;

  if (f.bucket && f.key) {
    const url = f.publicUrl || `${SUPABASE_URL}/storage/v1/object/public/${f.bucket}/${encodeURIComponent(f.key)}`;
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

  if (f.buffer && Buffer.isBuffer(f.buffer)) {
    const key = makeKey(f.originalname || "file");
    const { path: uploadedPath, publicUrl } = await uploadBufferToSupabase(f.buffer, targetBucket, key, f.mimetype || undefined);

    cleanupTracker.push({ bucket: targetBucket, key: uploadedPath });

    return {
      name: f.originalname || f.name || "",
      label: f.fieldname || f.label || "",
      mimeType: f.mimetype || f.type || "",
      size: f.size || f.buffer.length,
      url: publicUrl,
      storageType: "supabase",
      bucket: targetBucket,
      publicId: uploadedPath,
      fileId: uploadedPath,
      uploadedAt: new Date()
    };
  }

  return null;
}

export async function createResource(req, res) {
  const uploadedFilesToCleanup = [];

  try {
    const title = (req.body.title || "").trim();
    if (!title) return res.status(400).json({ error: "Title is required" });

    const resourceType = req.body.resourceType || "textbook";
    const isNotebook = resourceType === "notebook";

    // For notebooks, auto-assign ISBN, publisher, and author
    let isbn13 = req.body.isbn13 || "";
    let isbn10 = req.body.isbn10 || "";
    let publisher = req.body.publisher || req.body.bookPublisher || "";
    let authors = parseListField(req.body.authors || req.body.bookAuthor || "");
    let edition = req.body.edition || req.body.bookEdition || "";

    if (isNotebook) {
      // Auto-generate ISBNs for notebooks
      if (!isbn13) isbn13 = generateISBN13();
      if (!isbn10) isbn10 = generateISBN10();

      // Set uploader as publisher and author
      if (req.user) {
        publisher = req.user.fullname || req.user.username || "Author";
        if (!authors.includes(publisher)) {
          authors = [publisher, ...authors];
        }
      }

      // Set edition to "First Edition" if not provided
      if (!edition) edition = "First Edition";
    }

    const resource = {
      title,
      resourceType,
      subtitle: req.body.subtitle || "",
      authors: isNotebook ? authors : parseListField(req.body.authors || req.body.bookAuthor || ""),
      coauthors: isNotebook ? [] : parseListField(req.body.coauthors || req.body.bookCoAuthor || ""),
      publisher,
      edition,
      isbn10,
      isbn13,
      language: req.body.language || req.body.languageSelect || "English",
      publicationYear: isNotebook 
        ? new Date().getFullYear().toString() 
        : (req.body.publicationYear || req.body.pubYearSelect || ""),
      pages: isNotebook ? 0 : parseIntSafe(req.body.pages || req.body.bookPages),
      format: req.body.format || req.body.formatSelect || (isNotebook ? "Notebook" : ""),
      faculty: req.body.faculty || req.body.textbookFaculty || req.body.notebookFaculty || "",
      department: req.body.department || req.body.textbookDept || req.body.notebookDept || "",
      level: req.body.level || req.body.textbookLevel || req.body.notebookLevel || "",
      semester: req.body.semester || req.body.textbookSemester || req.body.notebookSemester || "",
      courseCode: req.body.courseCode || req.body.textbookCourseCode || "",
      courseTitle: req.body.courseTitle || req.body.textbookCourseTitle || "",
      course: req.body.course || req.body.notebookCourse || "",
      week: req.body.week || req.body.notebookWeek || "",
      lecturer: req.body.lecturer || req.body.notebookLecturer || "",
      description: (req.body.description || "").trim(),
      introduction: (req.body.introduction || "").trim(),
      tags: parseListField(req.body.tags || req.body.tagInput || req.body.tagsJson || ""),
      category: isNotebook 
        ? (req.body.category || req.body.notebookCategory || "Other")
        : (req.body.category || ""),
      copyrightHolder: req.body.copyrightHolder || (isNotebook && req.user ? req.user.fullname || req.user.username : ""),
      licenseType: req.body.licenseType || req.body.copyrightLicense || "All Rights Reserved",
      visibility: req.body.visibility || "public",
      allowPreview: parseBool(req.body.allowPreview, true),
      allowComments: parseBool(req.body.allowComments, true),
      enableDownload: parseBool(req.body.enableDownload, true),
      published: parseBool(req.body.publishNow, req.body.publishNow === undefined ? (req.body.publishNowCheck === "on" || req.body.publishNowCheck === "true") : false),
      publishDate: null,
      files: [],
      notesCount: 0, // Will be updated when chapters are added
      totalChapters: 0,
      lastChapterNumber: 0,
      totalWords: 0
    };

    let mainFilesCandidates = [];
    let coverFileCandidate = req.coverFile || null;

    if (req.file) {
      if (req.file.fieldname === "coverFile") coverFileCandidate = req.file;
      else mainFilesCandidates.push(req.file);
    } else if (Array.isArray(req.files)) {
      for (const f of req.files) {
        if (f.fieldname === "coverFile") coverFileCandidate = f;
        else mainFilesCandidates.push(f);
      }
    } else if (req.files && typeof req.files === "object") {
      if (req.files.coverFile && req.files.coverFile.length > 0) {
        coverFileCandidate = req.files.coverFile[0];
      }
      for (const key of Object.keys(req.files)) {
        if (key !== "coverFile" && Array.isArray(req.files[key])) {
          mainFilesCandidates.push(...req.files[key]);
        }
      }
    }

    if (mainFilesCandidates.length > 0) {
      const processedFiles = await Promise.all(
        mainFilesCandidates.map(f => processIncomingFile(f, RESOURCES_BUCKET, uploadedFilesToCleanup))
      );
      resource.files = processedFiles.filter(Boolean);
    }

    if (coverFileCandidate) {
      const coverObj = await processIncomingFile(coverFileCandidate, COVERS_BUCKET, uploadedFilesToCleanup);
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

    if (resource.resourceType === "textbook" && resource.files.length === 0) {
      await cleanupUploadedFiles(uploadedFilesToCleanup);
      return res.status(400).json({ error: "A textbook requires at least one file attachment." });
    }

    if (resource.published) resource.publishDate = new Date();
    if (req.user && req.user._id) resource.uploader = req.user._id;

    const doc = await Resources.create(resource);
    return res.status(201).json({ success: true, resource: doc });

  } catch (err) {
    console.error("createResource error:", err);
    await cleanupUploadedFiles(uploadedFilesToCleanup);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

export async function updateResource(req, res) {
  const uploadedFilesToCleanup = [];

  try {
    const { id } = req.params;
    const resourceDoc = await Resources.findById(id);

    if (!resourceDoc) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (req.body.title) resourceDoc.title = req.body.title.trim();
    if (req.body.resourceType) resourceDoc.resourceType = req.body.resourceType;
    if (req.body.subtitle !== undefined) resourceDoc.subtitle = req.body.subtitle;
    if (req.body.description !== undefined) {
      resourceDoc.description = req.body.description.trim();
    }
    if (req.body.introduction !== undefined) {
      resourceDoc.introduction = req.body.introduction.trim();
    }
    if (req.body.course !== undefined) resourceDoc.course = req.body.course;
    if (req.body.week !== undefined) resourceDoc.week = req.body.week;
    if (req.body.lecturer !== undefined) resourceDoc.lecturer = req.body.lecturer;
    if (req.body.courseCode !== undefined) resourceDoc.courseCode = req.body.courseCode;
    if (req.body.courseTitle !== undefined) resourceDoc.courseTitle = req.body.courseTitle;
    if (req.body.category !== undefined) resourceDoc.category = req.body.category;
    if (req.body.contentHtml !== undefined) {
      resourceDoc.contentHtml = sanitizeHtml(req.body.contentHtml, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          img: ['src', 'alt', 'width', 'height', 'style']
        }
      });
    }

    let mainFilesCandidates = [];
    let coverFileCandidate = req.coverFile || null;

    if (req.file) {
      if (req.file.fieldname === "coverFile") coverFileCandidate = req.file;
      else mainFilesCandidates.push(req.file);
    } else if (req.files) {
      if (Array.isArray(req.files)) {
        for (const f of req.files) {
          if (f.fieldname === "coverFile") coverFileCandidate = f;
          else mainFilesCandidates.push(f);
        }
      } else if (typeof req.files === "object") {
        if (req.files.coverFile && req.files.coverFile.length > 0) {
          coverFileCandidate = req.files.coverFile[0];
        }
        for (const key of Object.keys(req.files)) {
          if (key !== "coverFile" && Array.isArray(req.files[key])) {
            mainFilesCandidates.push(...req.files[key]);
          }
        }
      }
    }

    if (mainFilesCandidates.length > 0) {
      const newFiles = await Promise.all(
        mainFilesCandidates.map(f => processIncomingFile(f, RESOURCES_BUCKET, uploadedFilesToCleanup))
      );
      const validNewFiles = newFiles.filter(Boolean);

      if (validNewFiles.length > 0) {
        if (req.body.replaceFiles === "true" && resourceDoc.files && resourceDoc.files.length > 0) {
          for (const oldFile of resourceDoc.files) {
            if (oldFile.bucket && oldFile.publicId) {
              await deleteSupabaseFile(oldFile.bucket, oldFile.publicId);
            }
          }
          resourceDoc.files = validNewFiles;
        } else {
          resourceDoc.files.push(...validNewFiles);
        }
      }
    }

    if (coverFileCandidate) {
      const coverObj = await processIncomingFile(coverFileCandidate, COVERS_BUCKET, uploadedFilesToCleanup);
      if (coverObj) {
        if (resourceDoc.cover && resourceDoc.cover.bucket && resourceDoc.cover.publicId) {
          await deleteSupabaseFile(resourceDoc.cover.bucket, resourceDoc.cover.publicId);
        }

        resourceDoc.cover = {
          url: coverObj.url,
          mimeType: coverObj.mimeType,
          size: coverObj.size,
          storageType: "supabase",
          bucket: coverObj.bucket,
          publicId: coverObj.publicId
        };
      }
    }

    await resourceDoc.save();
    return res.json({ success: true, resource: resourceDoc });

  } catch (err) {
    console.error("updateResource error:", err);
    await cleanupUploadedFiles(uploadedFilesToCleanup);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

export async function getResources(req, res) {
  try {
    const { q, resourceType, faculty, department, level, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (resourceType) filter.resourceType = resourceType;
    if (faculty) filter.faculty = faculty;
    if (department) filter.department = department;
    if (level) filter.level = level;

    if (q) {
      const searchRegex = new RegExp(q.trim(), "i");
      filter.$or = [
        { title: searchRegex },
        { subtitle: searchRegex },
        { authors: searchRegex },
        { coauthors: searchRegex },
        { courseCode: searchRegex },
        { courseTitle: searchRegex },
        { course: searchRegex },
        { lecturer: searchRegex },
        { tags: searchRegex },
        { publisher: searchRegex }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [resources, total] = await Promise.all([
      Resources.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      Resources.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      resources,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (err) {
    console.error("getResources error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

export async function uploadEditorImage(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    if (req.file.bucket && req.file.key) {
      const publicUrl = req.file.publicUrl || `${SUPABASE_URL}/storage/v1/object/public/${req.file.bucket}/${encodeURIComponent(req.file.key)}`;
      return res.json({ success: true, url: publicUrl });
    }

    if (!req.file.buffer || !Buffer.isBuffer(req.file.buffer)) {
      return res.status(400).json({ error: "Invalid editor file payload" });
    }

    const key = makeKey(req.file.originalname || "editor-image", "editor");
    const { publicUrl } = await uploadBufferToSupabase(req.file.buffer, EDITOR_BUCKET, key, req.file.mimetype || undefined);

    return res.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error("uploadEditorImage error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

/**
 * Export categories for frontend to use in dropdowns
 */
export function getNotebookCategories() {
  return NOTEBOOK_CATEGORIES;
}

async function cleanupUploadedFiles(filesArray) {
  if (filesArray && filesArray.length > 0) {
    await Promise.all(
      filesArray.map(item => deleteSupabaseFile(item.bucket, item.key))
    );
  }
}
