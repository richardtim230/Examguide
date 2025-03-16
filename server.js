require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());

// ✅ Allow Frontend Requests (CORS)
const corsOptions = {
  origin: true, // Automatically allows the frontend origin
  methods: "GET,POST",
  allowedHeaders: "Content-Type",
};
app.use(cors(corsOptions));

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ User Schema
const UserSchema = new mongoose.Schema({
  fullName: String,
  faculty: String,
  department: String,
  level: String,
  userId: { type: String, unique: true },
  exams: [{ id: String, title: String }]
});

const User = mongoose.model("User", UserSchema);

// ✅ Registration API (Handles Relative Paths)
app.post("/register", async (req, res) => {
  try {
    const { fullName, faculty, department, level, userId } = req.body;

    if (!fullName || !faculty || !department || !level || !userId) {
      return res.status(400).json({ message: "⚠️ All fields are required." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return res.status(400).json({ message: "🚫 User ID already exists. Try again." });
    }

    // Assign default exam
    const exams = [{ id: "CHM101-F1", title: "INTRODUCTORY CHEMISTRY ONE" }];
    const newUser = new User({ fullName, faculty, department, level, userId, exams });

    await newUser.save();
    res.json({ message: "✅ Registration successful!", userId });

  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ message: "⚠️ Server error. Try again later." });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.list
en(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

app.post("/login", async (req, res) => {
    try {
        const { fullName, userIdOrCode } = req.body;

        if (!fullName || !userIdOrCode) {
            return res.status(400).json({ message: "⚠️ Both Full Name and User ID are required." });
        }

        // Check user by ID or 5-figure code
        const user = await User.findOne({ $or: [{ userId: userIdOrCode }, { fiveFigureCode: userIdOrCode }] });

        if (!user || user.fullName !== fullName) {
            return res.status(400).json({ message: "🚫 Invalid User ID or Full Name." });
        }

        res.json(user);
    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ message: "⚠️ Server error. Try again later." });
    }
});
