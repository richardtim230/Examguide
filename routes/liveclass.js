import express from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";

// Create uploads dir (publicly accessible via /uploads/liveclass)
const LIVECLASS_UPLOADS = path.resolve("./uploads/liveclass");
if (!fs.existsSync(LIVECLASS_UPLOADS)) fs.mkdirSync(LIVECLASS_UPLOADS, { recursive: true });

const router = express.Router();

// --- Auth middleware (JWT) for REST API (file upload) ---
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

// --- File upload endpoint for instructor/students ---
const upload = multer({
  dest: LIVECLASS_UPLOADS,
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.post("/files/upload", authMiddleware, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  // File accessible as /uploads/liveclass/<filename>
  res.json({ url: `/uploads/liveclass/${req.file.filename}`, name: req.file.originalname });
});

// List resources (optionally add real DB)
router.get("/files/list", (req, res) => {
  fs.readdir(LIVECLASS_UPLOADS, (err, files) => {
    if (err) return res.status(500).json({ error: "Could not list files" });
    res.json({ files });
  });
});

export default router;

// --- SOCKET.IO LIVE CLASS/SESSION COLLABORATION ---
//
// You must plug this in your main index.js (after http server created) with:
// import { setupLiveClassSocket } from './routes/liveclass.js';
// setupLiveClassSocket(io);

export function setupLiveClassSocket(io) {
  // In-memory state for one live session (room support easy to add)
  let users = {}; // socket.id -> {name, avatar}
  let code = { html: "", css: "", js: "" };
  let chat = [];
  let files = []; // Shared resource files (uploaded)
  let poll = null;
  let pollResults = {};

  // === Basic public namespace ===
  io.of("/liveclass").on("connection", (socket) => {
    // User identification (sent by client upon joining)
    socket.on("user:join", (userInfo) => {
      users[socket.id] = userInfo || {
        name: `User${Math.floor(Math.random()*10000)}`,
        avatar: ""
      };
      // Broadcast updated presence
      io.of("/liveclass").emit("user:presence", Object.values(users));
      // Send current code state
      socket.emit("code:update", code);
      chat.forEach(msg => socket.emit("chat:message", msg));
      files.forEach(f => socket.emit("file:uploaded", f));
      if (poll) socket.emit("quiz:question", poll);
      if (Object.keys(pollResults).length) socket.emit("quiz:results", pollResults);
    });

    // Code update: shared collaborative workspace
    socket.on("code:update", newCode => {
      code = { ...newCode };
      socket.broadcast.emit("code:update", code);
    });

    // Chat messages
    socket.on("chat:message", msg => {
      chat.push(msg);
      io.of("/liveclass").emit("chat:message", msg);
    });

    // Resource file share (from upload endpoint or directly from instructor)
    socket.on("file:uploaded", file => {
      files.push(file);
      io.of("/liveclass").emit("file:uploaded", file);
    });

    // Poll/quiz system (one question at a time)
    socket.on("quiz:question", ({ q, opts }) => {
      poll = { q, opts };
      pollResults = {};
      io.of("/liveclass").emit("quiz:question", poll);
    });
    socket.on("quiz:answer", idx => {
      pollResults[idx] = (pollResults[idx] || 0) + 1;
      io.of("/liveclass").emit("quiz:results", pollResults);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      delete users[socket.id];
      io.of("/liveclass").emit("user:presence", Object.values(users));
    });
  });

  // === Authenticated instructor/advanced namespace (/liveclass-socket) ===
  io.of("/liveclass-socket").use((socket, next) => {
    const { token } = socket.handshake.query;
    if (!token) return next(new Error("No token"));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
      next();
    } catch (e) {
      next(new Error("Invalid token"));
    }
  }).on("connection", (socket) => {
    // On connect - send everything (code, chat, files, poll/pollResults)
    socket.emit("code:update", code);
    chat.forEach(m => socket.emit("chat:message", m));
    files.forEach(f => socket.emit("file:uploaded", f));
    if (poll) socket.emit("quiz:question", poll);
    if (Object.keys(pollResults).length) socket.emit("quiz:results", pollResults);
    // Chat relay
    socket.on("chat:message", msg => {
      chat.push(msg);
      io.of("/liveclass-socket").emit("chat:message", msg);
    });
    // Code collaboration
    socket.on("code:update", newCode => {
      code = { ...newCode };
      socket.broadcast.emit("code:update", code);
    });
    // Poll/Q&A
    socket.on("quiz:question", ({ q, opts }) => {
      poll = { q, opts };
      pollResults = {};
      io.of("/liveclass-socket").emit("quiz:question", poll);
    });
    socket.on("quiz:answer", idx => {
      pollResults[idx] = (pollResults[idx] || 0) + 1;
      io.of("/liveclass-socket").emit("quiz:results", pollResults);
    });
    // Resource file sharing
    socket.on("file:uploaded", file => {
      files.push(file);
      io.of("/liveclass-socket").emit("file:uploaded", file);
    });
    socket.on("disconnect", () => {
      // Remove user if needed (if passing user info for stats)
    });
  });
}
