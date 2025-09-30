import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import BloggerDashboard from "../models/BloggerDashboard.js";
import Post from "../models/Post.js";

// Use your .env MONGODB_URI
const MONGO_URI = process.env.MONGODB_URI;

async function migratePosts() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const dashboards = await BloggerDashboard.find({});
  let migrated = 0;
  let errors = 0;

  for (const dash of dashboards) {
    for (const post of dash.posts || []) {
      const newPost = new Post({
        ...post.toObject(),
        author: dash.user, // Attach the dashboard owner as author
      });
      try {
        await newPost.save();
        migrated++;
      } catch (e) {
        errors++;
        console.error(`Failed to migrate post: ${post.title}, error:`, e);
      }
    }
  }

  console.log(`Migrated ${migrated} posts. Errors: ${errors}`);
  mongoose.disconnect();
}

migratePosts();
