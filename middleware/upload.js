import multer from "multer";

const memoryStorage = multer.memoryStorage();

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
  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }

  cb(new Error("Only image files allowed"), false);
}

export const resourceUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 100 * 1024 * 1024
  },
  fileFilter: fileFilterForResources
});

export const coverUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: imageFileFilter
});

export const editorUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: imageFileFilter
});
