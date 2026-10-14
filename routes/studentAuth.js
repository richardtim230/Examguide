import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import ExamSet from "../models/ExamSet.js";

const router = express.Router();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

// Multer setup
const passportUploadDir = "./uploads/passports";

if (!fs.existsSync(passportUploadDir)) {
  fs.mkdirSync(passportUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, passportUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);

    cb(
      null,
      `${base.replace(/\s+/g, "_")}_${Date.now()}${ext}`
    );
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files allowed!"));
    }
  }
});

// Authentication middleware
function authenticate(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth) {
    return res.status(401).json({
      message: "No authorization token."
    });
  }

  const token = auth.replace(/^Bearer\s/, "");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid/expired token."
    });
  }
}

/**
 * Credit the exam creator using the User model only.
 *
 * Returns the updated creator when successful.
 * Returns null when the creator cannot be found or credited.
 */
async function creditCreator(creatorId, amount) {
  if (!creatorId) {
    console.warn("Cannot credit exam creator: creatorId is missing.");
    return null;
  }

  try {
    const creator = await User.findById(creatorId);

    if (!creator) {
      console.warn(
        `Cannot credit exam creator: User ${creatorId} was not found.`
      );
      return null;
    }

    creator.creditPoints =
      Number(creator.creditPoints || 0) + Number(amount || 0);

    await creator.save();

    return creator;
  } catch (err) {
    console.error("Failed to credit exam creator:", err);
    return null;
  }
}

/**
 * Register student
 * POST /api/student/register
 */
router.post("/register", upload.single("passport"), async (req, res) => {
  try {
    let {
      fullName,
      email,
      phone,
      dob,
      gender,
      address,
      program,
      password,
      referral,
      guardianName,
      guardianPhone
    } = req.body;

    // Normalize input
    fullName = (fullName || "").trim();
    email = (email || "").trim().toLowerCase();
    phone = (phone || "").trim();

    if (!fullName || !email || !phone || !program || !password) {
      return res.status(400).json({
        message: "All required fields not provided."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Passport photo required."
      });
    }

    // Check email uniqueness
    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(409).json({
        message: "Email already registered."
      });
    }

    // Check phone uniqueness
    const existingPhone = await User.findOne({ phone });

    if (existingPhone) {
      return res.status(409).json({
        message: "Phone already registered."
      });
    }

    // Password strength validation
    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
      return res.status(400).json({
        message:
          "Password too weak. Minimum 8 characters, letters and at least 1 digit."
      });
    }

    const hash = await bcrypt.hash(password, 12);

    const user = new User({
      fullName,
      email,
      phone,
      dob,
      gender,
      address,
      program,
      password: hash,
      passport: `/uploads/passports/${req.file.filename}`,
      role: "student",
      paymentStatus: "pending",
      referral: referral || "",
      guardianName: guardianName || "",
      guardianPhone: guardianPhone || ""
    });

    await user.save();

    // Generate login token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: "14d"
      }
    );

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        program: user.program,
        role: user.role,
        paymentStatus: user.paymentStatus,
        passport: user.passport
      }
    });
  } catch (err) {
    console.error("Student registration error:", err);

    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

/**
 * Use 20 credit points to access an exam.
 * POST /api/student/exam-set/use-credit-v2
 *
 * Uses the User model exclusively.
 */
router.post(
  "/exam-set/use-credit-v2",
  authenticate,
  async (req, res) => {
    try {
      const { accessCode } = req.body;

      if (!accessCode) {
        return res.status(400).json({
          message: "Access code required."
        });
      }

      // Fetch the authenticated student using User only.
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          message: "Student not found."
        });
      }

      if (user.role !== "student") {
        return res.status(403).json({
          message: "Only students can use credit points to access exams."
        });
      }

      // Find the exam set.
      const examSet = await ExamSet.findOne({ accessCode });

      if (!examSet) {
        return res.status(404).json({
          message: "Invalid/expired Exam Access code."
        });
      }

      const cost = 20;
      const currentCredits = Number(user.creditPoints || 0);

      if (currentCredits < cost) {
        return res.status(403).json({
          message: "Insufficient credit points to access this exam.",
          creditPoints: currentCredits,
          requiredCredits: cost
        });
      }

      // Deduct credits from the student.
      user.creditPoints = currentCredits - cost;
      await user.save();

      // Credit the exam creator using User only.
      const creatorId = examSet.createdBy;
      const creditedCreator = await creditCreator(creatorId, cost);

      const response = {
        message: "Exam access granted. 20 credit points deducted.",
        creditPoints: user.creditPoints,
        examSet
      };

      if (creditedCreator) {
        response.creditedTo = {
          id: creditedCreator._id,
          creditPoints: creditedCreator.creditPoints
        };
      } else {
        response.warning =
          "Exam access was granted, but the exam creator could not be credited. Please check the creator's User record.";
      }

      return res.json(response);
    } catch (err) {
      console.error("Exam credit v2 error:", err);

      return res.status(500).json({
        message: "Server error",
        error: err.message
      });
    }
  }
);

/**
 * Use 10 credit points to access an exam.
 * POST /api/student/exam-set/use-credit
 *
 * Uses the User model exclusively.
 */
router.post(
  "/exam-set/use-credit",
  authenticate,
  async (req, res) => {
    try {
      const { accessCode } = req.body;

      if (!accessCode) {
        return res.status(400).json({
          message: "Access code required."
        });
      }

      // Fetch the authenticated student using User only.
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          message: "Student not found."
        });
      }

      if (user.role !== "student") {
        return res.status(403).json({
          message: "Only students can use credit points to access exams."
        });
      }

      const examSet = await ExamSet.findOne({ accessCode });

      if (!examSet) {
        return res.status(404).json({
          message: "Invalid/expired Exam Access code."
        });
      }

      const cost = 10;
      const currentCredits = Number(user.creditPoints || 0);

      if (currentCredits < cost) {
        return res.status(403).json({
          message: "Insufficient credit points to access this exam.",
          creditPoints: currentCredits,
          requiredCredits: cost
        });
      }

      // Deduct credits from the student.
      user.creditPoints = currentCredits - cost;
      await user.save();

      // Credit the exam creator using User only.
      const creatorId = examSet.createdBy;
      const creditedCreator = await creditCreator(creatorId, cost);

      const response = {
        message: "Exam access granted. 10 credit points deducted.",
        creditPoints: user.creditPoints,
        examSet
      };

      if (creditedCreator) {
        response.creditedTo = {
          id: creditedCreator._id,
          creditPoints: creditedCreator.creditPoints
        };
      } else {
        response.warning =
          "Exam access was granted, but the exam creator could not be credited. Please check the creator's User record.";
      }

      return res.json(response);
    } catch (err) {
      console.error("Exam credit error:", err);

      return res.status(500).json({
        message: "Server error",
        error: err.message
      });
    }
  }
);

/**
 * Login
 * POST /api/student/login
 */
router.post("/login", async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({
        message: "Email/Phone and password required."
      });
    }

    const identifier = emailOrPhone.trim();

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    });

    if (!user) {
      return res.status(401).json({
        message: "Student not found."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Incorrect password."
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: "14d"
      }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        program: user.program,
        role: user.role,
        paymentStatus: user.paymentStatus,
        passport: user.passport
      }
    });
  } catch (err) {
    console.error("Student login error:", err);

    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

/**
 * Get all students
 * GET /api/student/
 * Admin only.
 */
router.get("/", authenticate, async (req, res) => {
  try {
    if (
      req.user.role !== "admin" &&
      req.user.role !== "superadmin"
    ) {
      return res.status(403).json({
        message: "Unauthorized."
      });
    }

    const students = await User.find({
      role: "student"
    }).select("-password -emailVerificationToken");

    return res.json(students);
  } catch (err) {
    console.error("Get students error:", err);

    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

/**
 * Get authenticated student's profile
 * GET /api/student/me
 */
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -emailVerificationToken"
    );

    if (!user) {
      return res.status(404).json({
        message: "Student not found."
      });
    }

    return res.json(user);
  } catch (err) {
    console.error("Get student profile error:", err);

    return res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
});

export default router;
