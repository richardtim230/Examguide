require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json()); // Middleware for JSON parsing

// ✅ CORS Configuration (Allowing frontend access)
const corsOptions = {
  origin: ["https://examguide.vercel.app"], // Change this if your frontend URL changes
  methods: "GET,POST",
  allowedHeaders: "Content-Type",
};
app.use(cors(corsOptions));

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ User Schema (Stores registered users)
const UserSchema = new mongoose.Schema({
  fullName: String,
  faculty: String,
  department: String,
  level: String,
  userId: { type: String, unique: true },
  fiveFigureCode: String, // Optional 5-character login code
  exams: [{ id: String, title: String }], // Array of assigned exams
});

const User = mongoose.model("User", UserSchema);

// ✅ Exam Results Schema
const ResultSchema = new mongoose.Schema({
  userId: String,
  fullName: String,
  examCode: String,
  score: Number,
  totalQuestions: Number,
  scorePercent: String,
  timeSpent: Number,
  answers: Array,
  timestamp: { type: Date, default: Date.now },
});

const Result = mongoose.model("Result", ResultSchema);

// ✅ Register User
app.post("/register", async (req, res) => {
  try {
    const { fullName, faculty, department, level, userId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({ message: "User ID already exists. Try again." });
    }

    // Assign default exam
    const exams = [{ id: "CHM101-F1", title: "INTRODUCTORY CHEMISTRY ONE" }];

    const newUser = new User({ fullName, faculty, department, level, userId, exams });
    await newUser.save();

    res.json({ message: "Registration successful!", userId });
  } catch (error) {
    res.status(500).json({ message: "Server error. Try again later." });
  }
});

// ✅ Login User
app.post("/login", async (req, res) => {
  try {
    const { fullName, userIdOrCode } = req.body;

    // Check user by ID or 5-figure code
    const user = await User.findOne({ $or: [{ userId: userIdOrCode }, { fiveFigureCode: userIdOrCode }] });
    if (!user || user.fullName !== fullName) {
      return res.status(400).json({ message: "Invalid User ID or Full Name." });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error. Try again later." });
  }
});

// ✅ Update 5-Figure Code
app.post("/update-code", async (req, res) => {
  try {
    const { userId, fiveFigureCode } = req.body;
    if (!fiveFigureCode || fiveFigureCode.length !== 5) {
      return res.status(400).json({ message: "Code must be exactly 5 characters long." });
    }

    await User.findOneAndUpdate({ userId }, { fiveFigureCode });
    res.json({ message: "5-figure code updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error. Try again later." });
  }
});

// ✅ Submit Exam Results
app.post("/submit-result", async (req, res) => {
  try {
    const { userId, fullName, examCode, score, totalQuestions, scorePercent, timeSpent, answers } = req.body;

    if (!userId || !examCode) {
      return res.status(400).json({ message: "User ID and Exam Code are required." });
    }

    const newResult = new Result({ userId, fullName, examCode, score, totalQuestions, scorePercent, timeSpent, answers });
    await newResult.save();
    res.json({ message: "Exam results saved successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error. Try again later." });
  }
});

// ✅ Get User Exam Results
app.get("/results/:userId", async (req, res) => {
  try {
    const results = await Result.find({ userId: req.params.userId });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Error fetching results." });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
