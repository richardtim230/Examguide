import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/examguide";

async function createAdmin() {
  await mongoose.connect(MONGODB_URI);
  const username = "admin";
  const email = "admin@example.com";
  const fullname = "CODECX Admin";
  const password = "securepassword";

  const exists = await Admin.findOne({ username });
  if (exists) {
    console.log("Admin user already exists.");
    return;
  }
  const hash = await bcrypt.hash(password, 12);
  await Admin.create({ username, email, fullname, password: hash });
  console.log("Admin user created:", username);
  process.exit(0);
}

createAdmin();
