import express from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";

// Create uploads dir
const LIVECLASS_UPLOADS = path.resolve("./uploads/liveclass");
if (!fs.existsSync(LIVECLASS_UPLOADS)) fs.mkdirSync(LIVECLASS_UPLOADS, { recursive: true });

const router = express.Router();

// --- Auth middleware (same logic as your codecxreg.js) ---
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return res.status(401).json({ message: "Missing token" });
  try {
    const decoded = jwt.verify(authHeader.replace("Bearer ", ""), process.env.JWT_SECRET || "your_jwt_secret");
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// --- Multer for file upload (uploads go to /uploads/liveclass) ---
const upload = multer({
  dest: LIVECLASS_UPLOADS,
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.post("/files/upload", authMiddleware, upload.single("file"), (req, res) => {
  if(!req.file) return res.status(400).json({ message: "No file uploaded" });
  // Expose file publicly (served by app.use("/uploads/liveclass", express.static(...)))
  res.json({ url: `/uploads/liveclass/${req.file.filename}`, name: req.file.originalname });
});

export default router;

// --- SOCKET.IO SETUP ---
// Plug this into your main index.js file exactly ONCE after creating the http server:

export function setupLiveClassSocket(io) {
  // in-memory state for ALL live classes (add per classId logic for multiple simultaneous classes)
  let classState = {
    code: "// Welcome to CODECX Live Coding Class!",
    chat: [],
    poll: null,
    pollResults: {},
    resources: [],
  };

  // Socket.io namespace
  io.of("/liveclass-socket").use((socket, next) => {
    const { token } = socket.handshake.query;
    if(!token) return next(new Error("No token"));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
      next();
    } catch (e) {
      next(new Error("Invalid token"));
    }
  }).on("connection", (socket) => {
    // Send all class state on connect
    socket.emit("code:update", classState.code);
    classState.chat.forEach(m => socket.emit("chat:message", m));
    if(classState.poll) socket.emit("quiz:question", classState.poll);
    classState.resources.forEach(f => socket.emit("file:uploaded", f));

    // Chat relay
    socket.on("chat:message", msg => {
      classState.chat.push(msg);
      socket.broadcast.emit("chat:message", msg);
    });

    // Code collaboration
    socket.on("code:update", code => {
      classState.code = code;
      socket.broadcast.emit("code:update", code);
    });

    // Poll/Q&A (from instructor)
    socket.on("quiz:question", ({ q, opts }) => {
      classState.poll = { q, opts };
      classState.pollResults = {};
      socket.broadcast.emit("quiz:question", { q, opts });
    });
    // Students answering
    socket.on("quiz:answer", idx => {
      classState.pollResults[idx] = (classState.pollResults[idx] || 0) + 1;
      socket.broadcast.emit("quiz:results", classState.pollResults);
    });

    // Resource file shared
    socket.on("file:uploaded", file => {
      classState.resources.push(file);
      socket.broadcast.emit("file:uploaded", file);
    });
  });
}
