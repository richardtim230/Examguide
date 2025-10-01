import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import BloggerDashboard from "../models/BloggerDashboard.js";
import Post from "../models/Post.js";

const MONGO_URI = process.env.MONGODB_URI;

async function migratePosts() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const dashboards = await BloggerDashboard.find({});
  let migrated = 0;
  let errors = 0;

  for (const dash of dashboards) {
    for (const post of dash.posts || []) {
      // Check if already migrated
      const exists = await Post.findOne({ _id: post._id });
      if (exists) continue;
      const newPost = new Post({
        ...post.toObject(),
        author: dash.user,
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
