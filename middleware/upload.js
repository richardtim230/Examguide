import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure upload directories (create if absent)
const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(__dirname, "../uploads");
const RESOURCES_DIR = path.join(UPLOAD_ROOT, "resources");
const COVERS_DIR = path.join(UPLOAD_ROOT, "covers");
const EDITOR_DIR = path.join(UPLOAD_ROOT, "editor");

[RESOURCES_DIR, COVERS_DIR, EDITOR_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function makeStorage(dest) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext)
        .replace(/[^a-z0-9-_]/gi, "_")
        .slice(0, 120);
      const uniq = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${base}-${uniq}${ext}`);
    }
  });
}

// Filters
function fileFilterForResources(req, file, cb) {
  // Accept common resource types
  const allowed = [
    "application/pdf", "application/epub+zip", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "video/mp4", "audio/mpeg", "image/jpeg", "image/png", "image/webp"
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Unsupported resource file type"), false);
}

function imageFileFilter(req, file, cb) {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files allowed"), false);
}

// Multer instances
export const resourceUpload = multer({
  storage: makeStorage(RESOURCES_DIR),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: fileFilterForResources
});

export const coverUpload = multer({
  storage: makeStorage(COVERS_DIR),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: imageFileFilter
});

export const editorUpload = multer({
  storage: makeStorage(EDITOR_DIR),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter
});

// Export paths to be used when building public URLs
export const uploadPaths = {
  root: UPLOAD_ROOT,
  resources: RESOURCES_DIR,
  covers: COVERS_DIR,
  editor: EDITOR_DIR
};
