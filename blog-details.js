
document.addEventListener('DOMContentLoaded', function () {
  // Navbar
  const btn = document.querySelector('[data-collapse-toggle]');
  const menu = document.getElementById('navbar-default');
  btn?.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });

  // New endpoints
  const API_URL = "https://examguard-jmvj.onrender.com/api/posts";
  const USER_API = "https://examguard-jmvj.onrender.com/api/users/";
  const COMMENT_API = "https://examguard-jmvj.onrender.com/api/posts";

  function getPostIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  function sanitizeHTML(html) {
    return typeof html === "string"
      ? html.replace(/<\/script>/gi, "&lt;/script&gt;").replace(/<script/gi, "&lt;script")
      : html;
  }

  function renderComments(comments) {
    const commentsDiv = document.getElementById('commentsList');
    commentsDiv.innerHTML = '';
    if (!Array.isArray(comments) || comments.length === 0) {
      commentsDiv.innerHTML = `<div class="text-gray-400 italic">No comments yet. Be the first to comment!</div>`;
      return;
    }
    comments.forEach(comment => {
      const commentElement = document.createElement('div');
      commentElement.className = 'comment-bubble';
      commentElement.innerHTML = `
        <span class="comment-author">${comment.name || 'Anonymous'}</span>
        <span class="comment-date ml-2">${comment.date ? new Date(comment.date).toLocaleString() : ''}</span>
        <div class="mt-1 text-gray-800">${sanitizeHTML(comment.text)}</div>
      `;
      commentsDiv.appendChild(commentElement);

      // If replies exist, show them nested
      if (Array.isArray(comment.replies) && comment.replies.length) {
        comment.replies.forEach(reply => {
          const replyElement = document.createElement('div');
          replyElement.className = 'comment-bubble ml-6 bg-blue-50 border-blue-200';
          replyElement.innerHTML = `
            <span class="comment-author">${reply.name || 'Anonymous'}</span>
            <span class="comment-date ml-2">${reply.date ? new Date(reply.date).toLocaleString() : ''}</span>
            <div class="mt-1 text-gray-800">${sanitizeHTML(reply.text)}</div>
          `;
          commentsDiv.appendChild(replyElement);
        });
      }
    });
  }

  async function fetchBlogPost(postId) {
    try {
      const res = await fetch(`${API_URL}/public/posts/${postId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async function fetchAuthor(userId) {
    if (!userId) return {};
    try {
      const resp = await fetch(USER_API + userId);
      if (!resp.ok) return {};
      const d = await resp.json();
      return d.user || {};
    } catch {
      return {};
    }
  }

  async function addCommentToBackend(postId, name, text, parentId = null) {
    try {
      const res = await fetch(`${COMMENT_API}/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, text, parentId })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function main() {
    document.getElementById('blogSpinner').style.display = "flex";
    document.getElementById('blogMainContent').style.display = "none";
    document.getElementById('commentsSection').style.display = "none";

    const postId = getPostIdFromURL();
    const mainPost = await fetchBlogPost(postId);
    if (!mainPost) {
      document.getElementById('blogMainContent').style.display = "block";
      document.getElementById('blog-title').innerText = 'Blog not found';
      document.getElementById('blog-content').innerHTML = "<p>Sorry, this blog post could not be loaded.</p>";
      document.getElementById('blog-image').src = "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80";
      document.getElementById('blogSpinner').style.display = "none";
      return;
    }

    // Author Info
    let authorName = mainPost.authorName || mainPost.author?.fullname || mainPost.author?.username || "Anonymous";
    let authorAvatar = mainPost.authorAvatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(authorName) + "&background=FFCE45&color=263159&rounded=true";
    if (mainPost.author?._id || mainPost.authorId || mainPost.user) {
      const authorData = await fetchAuthor(mainPost.author?._id || mainPost.authorId || mainPost.user);
      if (authorData && (authorData.fullname || authorData.username)) {
        authorName = authorData.fullname || authorData.username;
        authorAvatar = authorData.profilePic
          ? (authorData.profilePic.startsWith("http") ? authorData.profilePic : authorData.profilePic)
          : authorAvatar;
      }
    }

    // Featured image logic
    let featuredImage = "";
    if (Array.isArray(mainPost.images) && mainPost.images.length) {
      featuredImage = mainPost.images[0];
    } else if (mainPost.imageUrl) {
      featuredImage = mainPost.imageUrl;
    } else {
      featuredImage = "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80";
    }
    document.getElementById('blog-image').src = featuredImage;

    document.getElementById('blog-meta').innerHTML = `
      <div class="flex flex-wrap items-center mb-5 gap-2">
        ${mainPost.university ? `<span class="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded">${mainPost.university}</span>` : ""}
        ${mainPost.category ? `<span class="bg-gray-100 text-blue-900 text-xs font-semibold px-3 py-1 rounded">${mainPost.category}</span>` : ""}
        <span class="inline-flex items-center gap-1 text-yellow-500 text-sm font-semibold ml-auto">
          <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.159c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.539 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.174 9.384c-.783-.57-.38-1.81.588-1.81h4.159a1 1 0 00.95-.69l1.286-3.957z"></path>
          </svg>
          ${(mainPost.rating !== undefined && mainPost.rating !== null) ? mainPost.rating : '0.0'}
        </span>
      </div>
    `;
    document.getElementById('blog-title').innerText = mainPost.title || "Untitled";
    document.getElementById('blog-author-date').innerHTML = `
      <span>By <strong>${authorName}</strong></span>
      <span>·</span>
      <span>Published: ${mainPost.date ? new Date(mainPost.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "Unknown date"}</span>
    `;
    document.getElementById('blog-content').innerHTML = mainPost.content || mainPost.summary || "<p>No content available.</p>";

    // Tags
    const tagsDiv = document.getElementById('blog-tags');
    if (Array.isArray(mainPost.tags)) {
      tagsDiv.innerHTML = mainPost.tags.map(tag =>
        `<span class="bg-blue-100 text-blue-700 rounded-full px-4 py-1 text-xs font-semibold">#${tag}</span>`
      ).join("");
    } else {
      tagsDiv.innerHTML = "";
    }
    // Total reads
    document.getElementById('totalReads').innerHTML = `👁️ ${mainPost.views || 0} reads`;

    // Comments
    renderComments(mainPost.comments || []);
    document.getElementById('commentsSection').style.display = "block";

    document.getElementById('commentForm').onsubmit = async function(e) {
      e.preventDefault();
      const name = document.getElementById('commentName').value.trim() || "Anonymous";
      const text = document.getElementById('commentText').value.trim();
      if (!text) return;
      const ok = await addCommentToBackend(postId, name, text);
      if (ok) {
        const updatedPost = await fetchBlogPost(postId);
        renderComments(updatedPost.comments || []);
      }
      this.reset();
    };

    // Related posts: same category, exclude self
    let related = [];
    try {
      const res = await fetch(`${API_URL}/filter?category=${mainPost.category || "General"}&limit=4`);
      if (res.ok) {
        related = await res.json();
        related = related.filter(p => (p._id || p.id) !== postId);
      }
    } catch {}
    if (!related || related.length < 2) {
      related = [];
      try {
        const res = await fetch(`${API_URL}/filter?limit=4`);
        if (res.ok) {
          related = await res.json();
          related = related.filter(p => (p._id || p.id) !== postId);
        }
      } catch {}
    }
    const relatedDiv = document.getElementById('related-blogs');
    relatedDiv.innerHTML = '';
    related.forEach(blog => {
      let imagesArr = Array.isArray(blog.images) && blog.images.length
        ? blog.images
        : blog.imageUrl ? [blog.imageUrl] : ['https://images.unsplash.com/photo-1510936111840-6c2d098e3c49?auto=format&fit=crop&w=600&q=80'];
      const div = document.createElement('div');
      div.className = 'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition duration-200 flex flex-col border border-blue-100 cursor-pointer';
      div.innerHTML = `
        <img src="${imagesArr[0]}"
          alt="${blog.title}" class="w-full h-36 object-cover border-b border-blue-50">
        <div class="p-5 flex flex-col flex-1">
          <div class="flex items-center gap-2 mb-2">
            ${blog.university ? `<span class="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded">${blog.university}</span>` : ""}
            ${blog.category ? `<span class="bg-gray-100 text-blue-900 text-xs font-semibold px-2 py-1 rounded">${blog.category}</span>` : ""}
          </div>
          <h3 class="font-bold text-lg mb-1 text-blue-900">${blog.title}</h3>
          <a href="blog-details.html?id=${blog._id || blog.id}" class="text-blue-700 font-semibold mt-auto hover:underline">Read More</a>
        </div>
      `;
      div.onclick = () => {
        window.location.href = `blog-details.html?id=${blog._id || blog.id}`;
      };
      relatedDiv.appendChild(div);
    });

    // Hide spinner, show content
    document.getElementById('blogSpinner').style.display = "none";
    document.getElementById('blogMainContent').style.display = "block";
  }
  main();
});
