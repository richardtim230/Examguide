import multer from "multer";

const storage = multer.memoryStorage();
const imageFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files allowed!"), false);
};
const limits = { fileSize: 6 * 1024 * 1024 };
const uploader = multer({ storage, fileFilter: imageFilter, limits });

export const uploadMultiple = uploader.fields([
  { name: "profilePic", maxCount: 1 },
  { name: "faceImage", maxCount: 10 },
  { name: "verificationImage", maxCount: 1 }
]);

export default uploader;
