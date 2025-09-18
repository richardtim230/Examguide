import fs from "fs";
import path from "path";
import axios from "axios";

// ==== CONFIGURATION ====
const API_URL = "https://examguide.onrender.com/api/blogger-dashboard/allposts"; // Your backend API
const TEMPLATE_PATH = "./blog-template.html"; // Path to your template file
const OUTPUT_DIR = "./blog/"; // Output directory for generated HTML files
const SITE_URL = "https://oau.examguard.com.ng/oau-blog.html"; // Used for canonical/og:url

// ==== UTILITY FUNCTIONS ====
// Slugify titles for URLs. Adjust as needed.
function makeSlug(title, id) {
  const slug = (title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${slug}-${id}`;
}

// Basic HTML escape for content not meant to be HTML
function esc(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ==== MAIN GENERATE FUNCTION ====
async function generate() {
  // Ensure output dir exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Load template
  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");

  // Fetch all posts from your backend
  const { data: posts } = await axios.get(API_URL);

  for (const post of posts) {
    try {
      // Prepare replacements
      const slug = makeSlug(post.title, post._id);
      const url = `${SITE_URL}/${slug}.html`;
      const outPath = path.join(OUTPUT_DIR, `${slug}.html`);
      const html = template
        .replace(/{{TITLE}}/g, esc(post.title))
        .replace(/{{DESCRIPTION}}/g, esc(post.summary || (post.content ? post.content.replace(/<[^>]+>/g, '').slice(0, 120) + "..." : "")))
        .replace(/{{KEYWORDS}}/g, "OAU, ExamGuard, student blog, tips, campus, academics, blog details")
        .replace(/{{URL}}/g, url)
        .replace(/{{IMAGE}}/g, post.imageUrl || "/logo.png")
        .replace(/{{AUTHOR}}/g, esc(post.authorName || "Anonymous"))
        .replace(/{{DATE}}/g, esc(post.date ? new Date(post.date).toISOString().slice(0, 10) : ""))
        .replace(/{{CATEGORY}}/g, esc(post.category || "General"))
        .replace(/{{CONTENT}}/g, post.content || "");

      fs.writeFileSync(outPath, html, "utf8");
      console.log(`Generated: ${outPath}`);
    } catch (err) {
      console.error(`Failed to generate static file for post: ${post.title || post._id} - ${err.message}`);
    }
  }
  console.log("All blog posts generated!");
}

generate().catch(err => {
  console.error("Error generating static posts:", err);
  process.exit(1);
});
