import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import path from "path";

// Supabase client — server-side key (SERVICE_ROLE) is recommended for server uploads.
// Provide these via environment variables in your runtime.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY)."
  );
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

// Bucket names (override via env if needed)
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
  const name = sanitizeFilename(base).slice(0, 100); // limit length
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}/${name}-${unique}${ext}`;
}

// Multer file filters (kept from original)
function fileFilterForResources(req, file, cb) {
  const allowed = [
    "application/pdf",
    "application/epub+zip",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "video/mp4",
    "audio/mpeg",
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (allowed.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(new Error("Unsupported resource file type"), false);
}

function imageFileFilter(req, file, cb) {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }

  cb(new Error("Only image files allowed"), false);
}

// Custom Multer storage engine that uploads to Supabase Storage
class SupabaseStorage {
  constructor(opts = {}) {
    if (!opts.bucket) throw new Error("SupabaseStorage requires a bucket name");
    this.bucket = opts.bucket;
    // prefix folder within the bucket (optional)
    this.prefix = opts.prefix || "";
    // public: if true we'll attach a public URL (getPublicUrl); if false you can createSignedUrl in handlers
    this.public = opts.public !== undefined ? opts.public : true;
    // optional function(req, file) => key
    this.getKey = typeof opts.getKey === "function" ? opts.getKey : null;
  }

  _handleFile(req, file, cb) {
    const originalName = file.originalname || "file";
    const key = this.getKey ? this.getKey(req, file) : makeKey(this.prefix || this.bucket, originalName);

    // upload accepts ReadableStream or Buffer in Node — we can pass file.stream
    (async () => {
      const uploadResult = await supabase.storage.from(this.bucket).upload(key, file.stream, {
        contentType: file.mimetype,
        cacheControl: "3600",
        upsert: false
      });
      if (uploadResult.error) {
        return cb(uploadResult.error);
      }

      // attach metadata to the multer file object for downstream handlers
      file.bucket = this.bucket;
      file.key = uploadResult.data.path || key;

      if (this.public) {
        // getPublicUrl returns { data: { publicUrl } } in supabase-js
        const { data: publicData } = supabase.storage.from(this.bucket).getPublicUrl(file.key);
        file.publicUrl = publicData?.publicUrl || null;
      } else {
        file.publicUrl = null;
      }

      // size is unknown here unless Supabase returns it; keep undefined or let downstream compute if needed
      cb(null, {
        bucket: file.bucket,
        key: file.key,
        publicUrl: file.publicUrl
      });
    })().catch((err) => cb(err));
  }

  _removeFile(req, file, cb) {
    // attempt to remove the file from storage if multer requests it
    (async () => {
      try {
        if (!file || !file.key) return cb(null);
        const { error } = await supabase.storage.from(this.bucket).remove([file.key]);
        if (error) return cb(error);
        cb(null);
      } catch (err) {
        cb(err);
      }
    })();
  }
}

// Exports — similar API shape to your original module
export const resourceUpload = multer({
  storage: new SupabaseStorage({
    bucket: RESOURCES_BUCKET,
    prefix: "resources",
    public: true
  }),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB
  },
  fileFilter: fileFilterForResources
});

export const coverUpload = multer({
  storage: new SupabaseStorage({
    bucket: COVERS_BUCKET,
    prefix: "covers",
    public: true
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: imageFileFilter
});

export const editorUpload = multer({
  storage: new SupabaseStorage({
    bucket: EDITOR_BUCKET,
    prefix: "editor",
    public: true
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: imageFileFilter
});
// compatibility export for code that still imports uploadPaths
export const uploadPaths = {
  resources: RESOURCES_BUCKET,
  covers: COVERS_BUCKET,
  editor: EDITOR_BUCKET
};
