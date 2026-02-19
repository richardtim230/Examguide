import express from "express";
import multer from "multer";
import path from "path";
import Applications from "../models/market/Application.js";
import fs from "fs";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const router = express.Router();

const uploadDir = "./uploads/applications";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base.replace(/\s+/g,'_')}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }
});

function stripSensitiveFields(app) {
  if (!app) return app;
  const obj = app.toObject ? app.toObject() : { ...app };
  delete obj.password;
  return obj;
}

// Helper: try to resolve a Mongoose model by name or dynamic import if available
async function getModel(name) {
  if (!name) return null;
  if (mongoose.models && mongoose.models[name]) return mongoose.models[name];
  const candidates = [
    `../models/${name}.js`,
    `../models/${name.toLowerCase()}.js`,
    `../models/market/${name}.js`,
    `../models/market/${name.toLowerCase()}.js`
  ];
  for (const p of candidates) {
    try {
      const mod = await import(p);
      const m = mod.default || mod[name] || mod;
      if (m && m.find) return m;
    } catch (e) {
      // ignore
    }
  }
  return null;
}

/*
  APPLICATIONS - CRUD + AUTH
*/

// Create application (registration / new submission)
router.post("/",
  upload.fields([
    { name: "idFile", maxCount: 1 },
    { name: "transcripts", maxCount: 5 }
  ]),
  async (req, res) => {
    try {
      const {
        applicantType, username, password, firstName, lastName, dob, email, phone,
        nationality, address, intakeTerm, program, currentSchool, currentGrade,
        prevAcademics, languageProof, emergencyName, emergencyPhone
      } = req.body;

      if (![applicantType, username, password, firstName, lastName, dob, email, phone, intakeTerm, program].every(Boolean)) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const existingUser = await Applications.findOne({ username });
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists. Please choose another." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const idFile = req.files.idFile?.[0]?.filename
        ? `/uploads/applications/${req.files.idFile[0].filename}`
        : "";

      const transcripts = (req.files.transcripts || []).map(f => `/uploads/applications/${f.filename}`);

      const application = await Applications.create({
        applicantType,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        dob,
        email,
        phone,
        nationality,
        address,
        intakeTerm,
        program,
        currentSchool,
        currentGrade,
        prevAcademics,
        languageProof,
        emergencyName,
        emergencyPhone,
        idFile,
        transcripts,
        submittedAt: new Date()
      });

      res.status(201).json({ message: "Application submitted", application: stripSensitiveFields(application) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Login endpoint for application accounts
router.post("/login", express.json(), async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "Username and password required." });

    const application = await Applications.findOne({ username });
    if (!application)
      return res.status(404).json({ message: "Application not found." });

    const isMatch = await bcrypt.compare(password, application.password || "");
    if (!isMatch)
      return res.status(401).json({ message: "Invalid username or password." });

    res.json({ message: "Login successful", application: stripSensitiveFields(application) });
  } catch (e) {
    console.error("Application login error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// Read all applications
router.get("/", async (req, res) => {
  try {
    const apps = await Applications.find().sort({ submittedAt: -1 });
    res.json(apps.map(stripSensitiveFields));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// Update application
router.put("/:id",
  upload.fields([
    { name: "idFile", maxCount: 1 },
    { name: "transcripts", maxCount: 5 }
  ]),
  async (req, res) => {
    try {
      const application = await Applications.findById(req.params.id);
      if (!application) return res.status(404).json({ message: "Application not found" });

      const updatableFields = [
        "applicantType", "firstName", "lastName", "dob", "email", "phone", "nationality", "address",
        "intakeTerm", "program", "currentSchool", "currentGrade", "prevAcademics", "languageProof",
        "emergencyName", "emergencyPhone"
      ];
      updatableFields.forEach(key => {
        if (req.body[key] !== undefined) application[key] = req.body[key];
      });

      if (req.body.password && req.body.password.length > 0) {
        application.password = await bcrypt.hash(req.body.password, 10);
      }

      if (req.files.idFile && req.files.idFile[0]?.filename) {
        application.idFile = `/uploads/applications/${req.files.idFile[0].filename}`;
      }
      if (req.files.transcripts && req.files.transcripts.length) {
        application.transcripts = req.files.transcripts.map(f => `/uploads/applications/${f.filename}`);
      }

      await application.save();
      res.json({ message: "Application updated", application: stripSensitiveFields(application) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete application
router.delete("/:id", async (req, res) => {
  try {
    const application = await Applications.findByIdAndDelete(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found" });
    res.json({ message: "Application deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// Search applications (dashboard/autocomplete)
router.get("/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.status(400).json({ message: "Missing q parameter" });
  try {
    const regex = new RegExp(q, "i");
    const results = await Applications.find({
      $or: [
        { username: regex },
        { firstName: regex },
        { lastName: regex },
        { program: regex },
        { email: regex },
      ]
    }).limit(50).sort({ submittedAt: -1 });
    res.json(results.map(stripSensitiveFields));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// Dashboard summary
router.get("/dashboard/summary/count", async (req, res) => {
  try {
    const count = await Applications.countDocuments();
    res.json({ count });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

/*
  STUDENT-FACING ENDPOINTS (PROGRAM / CLASS / LEVEL BASED)
  These endpoints prefer program/class/level filters. They also accept studentId for personal queries.
  If your project uses different model names or fields adjust the getModel() candidates above.
*/

// Helper to build class/program query - looks for program, class, level, cohort
function buildClassQuery(params) {
  const { program, programName, className, level, cohort } = params;
  const or = [];
  if (program) {
    or.push({ program }, { programCode: program }, { programName: program });
  }
  if (programName) {
    or.push({ program: programName }, { programName });
  }
  if (className) {
    or.push({ class: className }, { className: className }, { grade: className });
  }
  if (level) {
    or.push({ level }, { grade: level });
  }
  if (cohort) {
    or.push({ cohort });
  }
  if (or.length) return { $or: or };
  return null;
}

// GET /student/assignments?studentId=... OR ?program=... OR ?className=... or ?level=...
router.get("/student/assignments", async (req, res) => {
  try {
    const studentId = req.query.studentId || req.query.user || req.query.id || null;
    const classFilter = buildClassQuery({ program: req.query.program, programName: req.query.programName, className: req.query.className, level: req.query.level, cohort: req.query.cohort });
    const Assignment = await getModel("Assignment") || await getModel("Tasks") || await getModel("Homework");
    if (!Assignment) return res.json({ assignments: [] });

    const q = studentId ? { student: studentId } : (classFilter || {});
    // if studentId is provided, we still allow program filter too
    if (studentId && classFilter) Object.assign(q, classFilter);

    const assignments = await Assignment.find(q).sort({ due: 1 }).limit(200);
    res.json({ assignments });
  } catch (e) {
    console.error(e);
    res.status(500).json({ assignments: [] });
  }
});

// GET /student/grades?studentId=... OR ?program=... OR ?className=...
router.get("/student/grades", async (req, res) => {
  try {
    const studentId = req.query.studentId || req.query.user || req.query.id || null;
    const classFilter = buildClassQuery({ program: req.query.program, className: req.query.className, level: req.query.level, cohort: req.query.cohort });
    const Grade = await getModel("Grade") || await getModel("Result") || await getModel("Scores");
    if (!Grade) return res.json({ grades: [] });

    const q = studentId ? { student: studentId } : (classFilter || {});
    if (studentId && classFilter) Object.assign(q, classFilter);

    const grades = await Grade.find(q).limit(200);
    res.json({ grades });
  } catch (e) {
    console.error(e);
    res.status(500).json({ grades: [] });
  }
});

// GET /messages/conversations?user=... (personal) OR ?program=... (group/conversations for program/class)
router.get("/messages/conversations", async (req, res) => {
  try {
    const user = req.query.user || req.query.studentId || req.query.id || null;
    const classFilter = buildClassQuery({ program: req.query.program, className: req.query.className, level: req.query.level, cohort: req.query.cohort });
    const Message = await getModel("Conversation") || await getModel("Message") || await getModel("ConversationModel");
    if (!Message) return res.json({ conversations: [] });

    let q = {};
    if (user) q = { $or: [{ user }, { participants: user }] };
    else if (classFilter) q = classFilter;
    else q = {};

    const conversations = await Message.find(q).sort({ updatedAt: -1 }).limit(200);
    res.json({ conversations });
  } catch (e) {
    console.error(e);
    res.status(500).json({ conversations: [] });
  }
});

// GET /student/courses?studentId=... OR ?program=...
router.get("/student/courses", async (req, res) => {
  try {
    const studentId = req.query.studentId || req.query.user || req.query.id || null;
    const classFilter = buildClassQuery({ program: req.query.program, className: req.query.className, level: req.query.level, cohort: req.query.cohort });
    const Course = await getModel("Course") || await getModel("Subjects");
    if (!Course) return res.json({ courses: [] });

    const q = studentId ? { students: studentId } : (classFilter || {});
    const courses = await Course.find(q).limit(200);
    res.json({ courses });
  } catch (e) {
    console.error(e);
    res.status(500).json({ courses: [] });
  }
});

// GET /resources?studentId=... OR ?program=...
router.get("/resources", async (req, res) => {
  try {
    const studentId = req.query.studentId || req.query.user || req.query.id || null;
    const classFilter = buildClassQuery({ program: req.query.program, className: req.query.className, level: req.query.level, cohort: req.query.cohort });
    const Resource = await getModel("Resource") || await getModel("File") || await getModel("LearningResource");
    if (!Resource) return res.json({ resources: [] });

    const q = {};
    if (studentId) q.$or = [{ student: studentId }, { students: studentId }];
    if (classFilter) Object.assign(q, classFilter);

    const resources = await Resource.find(q).limit(500);
    res.json({ resources });
  } catch (e) {
    console.error(e);
    res.status(500).json({ resources: [] });
  }
});

// GET /student/timetable?studentId=... OR ?program=... OR ?className=...
router.get("/student/timetable", async (req, res) => {
  try {
    const studentId = req.query.studentId || req.query.user || req.query.id || null;
    const classFilter = buildClassQuery({ program: req.query.program, className: req.query.className, level: req.query.level, cohort: req.query.cohort });
    const Timetable = await getModel("Timetable") || await getModel("Schedule") || await getModel("Roster");
    if (!Timetable) return res.json({ timetable: null });

    let timetable = null;
    if (studentId) {
      timetable = await Timetable.findOne({ student: studentId }) || await Timetable.findOne({ students: studentId });
    }
    if (!timetable && classFilter) {
      timetable = await Timetable.findOne(classFilter) || await Timetable.findOne({});
    }
    if (!timetable) timetable = await Timetable.findOne({}) || null;

    res.json({ timetable });
  } catch (e) {
    console.error(e);
    res.status(500).json({ timetable: null });
  }
});

// GET /student/overview?studentId=... OR ?program=...
router.get("/student/overview", async (req, res) => {
  try {
    const studentId = req.query.studentId || req.query.user || req.query.id || null;
    const classFilter = buildClassQuery({ program: req.query.program, className: req.query.className, level: req.query.level, cohort: req.query.cohort });

    const Overview = {};
    const [AssignmentModel, GradeModel, ProgressModel] = await Promise.all([
      getModel("Assignment"),
      getModel("Grade"),
      getModel("Progress")
    ]);

    // Assignments overview (either personal or class/program based)
    if (AssignmentModel) {
      const q = studentId ? { student: studentId } : (classFilter || {});
      const assignments = await AssignmentModel.find(q);
      Overview.assignmentsDue = assignments.filter(a => ((a.status || '').toLowerCase() !== 'submitted')).length;
      Overview.upcoming = assignments.sort((a,b)=> new Date(a.due) - new Date(b.due))[0] || null;
    }

    // Grades overview (compute simplistic cumulative average)
    if (GradeModel && studentId) {
      const grades = await GradeModel.find({ student: studentId });
      const numeric = grades.map(g => parseFloat(g.score || g.mark || NaN)).filter(n => !Number.isNaN(n));
      if (numeric.length) {
        const avg = Math.round(numeric.reduce((s,v)=>s+v,0)/numeric.length);
        Overview.cumulativeAverage = avg;
      }
    } else if (GradeModel && classFilter) {
      const grades = await GradeModel.find(classFilter);
      const numeric = grades.map(g => parseFloat(g.score || g.mark || NaN)).filter(n => !Number.isNaN(n));
      if (numeric.length) {
        const avg = Math.round(numeric.reduce((s,v)=>s+v,0)/numeric.length);
        Overview.cumulativeAverage = avg;
      }
    }

    // Progress model (per-user)
    if (ProgressModel && studentId) {
      const prog = await ProgressModel.findOne({ user: studentId });
      if (prog) Overview.progress = prog;
    }

    res.json(Overview);
  } catch (e) {
    console.error(e);
    res.status(500).json({});
  }
});

/*
  Specific application resource: get single application by id
  (Placed at the end so that more specific routes like /search and /student/* are matched first)
*/
router.get("/:id", async (req, res) => {
  try {
    const app = await Applications.findById(req.params.id);
    if (!app) return res.status(404).json({ message: "Application not found" });
    res.json(stripSensitiveFields(app));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
