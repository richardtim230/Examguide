const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/examguide';

async function setupIndexes() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // Indexes for BloggerDashboard
  const BloggerDashboard = mongoose.connection.collection('bloggerdashboards');
  await BloggerDashboard.createIndex({ "posts.status": 1, "posts.category": 1, "user": 1 });
  await BloggerDashboard.createIndex({ "user": 1 });

  // Indexes for User collection
  const User = mongoose.connection.collection('users');
  await User.createIndex({ "username": 1 });
  await User.createIndex({ "fullname": 1 });

  console.log("Indexes created successfully!");
  await mongoose.disconnect();
}

setupIndexes().catch(err => {
  console.error("Index creation failed:", err);
  process.exit(1);
});
