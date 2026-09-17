import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import path from "path";

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

const RESOURCES_BUCKET = process.env.SUPABASE_RESOURCES_BUCKET || "resources";
const COVERS_BUCKET = process.env.SUPABASE_COVERS_BUCKET || "covers";
const EDITOR_BUCKET = process.env.SUPABASE_EDITOR_BUCKET || "editor";

function sanitizeFilename(filename = "file") {
  return filename
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\-.]/g, "");
}

function makeKey(prefix, originalName = "file") {
  const ext = path.extname(originalName) || "";
  const base = path.basename(originalName, ext);
  const name = sanitizeFilename(base).slice(0, 100);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}/${name}-${unique}${ext}`;
}

const AUDIO_EXTENSIONS = new Set([
  ".mp3", ".m4a", ".wav", ".aac", ".ogg", ".oga", ".flac", ".webm", ".opus", ".wma"
]);
const VIDEO_EXTENSIONS = new Set([
  ".mp4", ".mov", ".m4v", ".avi", ".mkv", ".webm", ".mpeg", ".mpg", ".3gp", ".wmv"
]);
const IMAGE_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".webp", ".gif"
]);

function getExtension(filename = "") {
  return path.extname(filename).toLowerCase();
}

function fileFilterForResources(req, file, cb) {
  const mimetype = (file.mimetype || "").toLowerCase();
  const extension = getExtension(file.originalname);
  const allowedDocumentTypes = new Set([
    "application/pdf",
    "application/epub+zip",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ]);
  const isAudioByMime = mimetype.startsWith("audio/");
  const isVideoByMime = mimetype.startsWith("video/");
  const isAudioByExtension = AUDIO_EXTENSIONS.has(extension);
  const isVideoByExtension = VIDEO_EXTENSIONS.has(extension);
  const isAllowedDocument = allowedDocumentTypes.has(mimetype);
  const isAllowedImage = mimetype.startsWith("image/") && IMAGE_EXTENSIONS.has(extension);
  const isAudio = isAudioByMime || isAudioByExtension;
  const isVideo = isVideoByMime || isVideoByExtension;

  console.log("================================================");
  console.log("Incoming resource upload");
  console.log("Field:", file.fieldname);
  console.log("Filename:", file.originalname);
  console.log("MIME:", file.mimetype);
  console.log("Extension:", extension);
  console.log("Detected audio:", isAudio);
  console.log("Detected video:", isVideo);
  console.log("================================================");

  if (isAudio || isVideo || isAllowedDocument || isAllowedImage) {
    return cb(null, true);
  }
  console.error(`Rejected file type: ${file.originalname} (${file.mimetype})`);
  return cb(
    new Error(
      `Unsupported file type: ${file.originalname}. MIME type: ${file.mimetype || "unknown"}`
    )
  );
}

function imageFileFilter(req, file, cb) {
  const mimetype = (file.mimetype || "").toLowerCase();
  const extension = getExtension(file.originalname);
  const validByMime = mimetype.startsWith("image/");
  const validByExtension = IMAGE_EXTENSIONS.has(extension);

  console.log("Incoming image upload:", {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    extension
  });

  if (validByMime || validByExtension) {
    return cb(null, true);
  }
  return cb(
    new Error(`Only image files are allowed. Received: ${file.originalname}`),
    false
  );
}

class SupabaseStorage {
  constructor(opts = {}) {
    if (!opts.bucket) {
      throw new Error("SupabaseStorage requires a bucket name");
    }
    this.bucket = opts.bucket;
    this.prefix = opts.prefix || "";
    this.public = opts.public !== undefined ? opts.public : true;
    this.getKey = typeof opts.getKey === "function" ? opts.getKey : null;
  }

  _handleFile(req, file, cb) {
    const originalName = file.originalname || "file";
    const key = this.getKey
      ? this.getKey(req, file)
      : makeKey(this.prefix || this.bucket, originalName);

    console.log("Starting Supabase upload:", {
      bucket: this.bucket,
      key,
      filename: originalName,
      mimetype: file.mimetype
    });

    (async () => {
      try {
        const uploadResult = await supabase.storage
          .from(this.bucket)
          .upload(key, file.stream, {
            contentType: file.mimetype || "application/octet-stream",
            cacheControl: "3600",
            upsert: false
          });

        if (uploadResult.error) {
          console.error("Supabase upload failed:", uploadResult.error);
          return cb(uploadResult.error);
        }

        file.bucket = this.bucket;
        file.key = uploadResult.data?.path || key;

        if (this.public) {
          const { data: publicData, error: publicUrlError } = supabase.storage
            .from(this.bucket)
            .getPublicUrl(file.key);

          if (publicUrlError) {
            console.error("Public URL generation failed:", publicUrlError);
          }
          file.publicUrl = publicData?.publicUrl || null;
        } else {
          file.publicUrl = null;
        }

        console.log("Supabase upload successful:", {
          bucket: file.bucket,
          key: file.key,
          publicUrl: file.publicUrl
        });

        return cb(null, {
          bucket: file.bucket,
          key: file.key,
          publicUrl: file.publicUrl
        });
      } catch (error) {
        console.error("Supabase storage error:", error);
        return cb(error);
      }
    })();
  }

  _removeFile(req, file, cb) {
    (async () => {
      try {
        if (!file || !file.key) {
          return cb(null);
        }
        const { error } = await supabase.storage
          .from(this.bucket)
          .remove([file.key]);

        if (error) {
          console.error("Failed to remove uploaded file:", error);
          return cb(error);
        }
        return cb(null);
      } catch (error) {
        console.error("Storage cleanup error:", error);
        return cb(error);
      }
    })();
  }
}

export const resourceUpload = multer({
  storage: new SupabaseStorage({
    bucket: RESOURCES_BUCKET,
    prefix: "resources",
    public: true
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: fileFilterForResources
});

export const coverUpload = multer({
  storage: new SupabaseStorage({
    bucket: COVERS_BUCKET,
    prefix: "covers",
    public: true
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter
});

export const avatarUpload = multer({
  storage: new SupabaseStorage({
    bucket: COVERS_BUCKET,
    prefix: "avatars",
    public: true
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter
});

export const mediaUpload = multer({
  storage: new SupabaseStorage({
    bucket: RESOURCES_BUCKET,
    prefix: "media",
    public: true
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: fileFilterForResources
});

export const editorUpload = multer({
  storage: new SupabaseStorage({
    bucket: EDITOR_BUCKET,
    prefix: "editor",
    public: true
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter
});

export const uploadPaths = {
  resources: RESOURCES_BUCKET,
  covers: COVERS_BUCKET,
  editor: EDITOR_BUCKET
};
