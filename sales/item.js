// --- Marketplace Product Details Page JavaScript ---

const BACKEND = "https://examguide.onrender.com";
let buyerProfile = null, currentProduct = null, allProducts = [];
let wishlistIds = []; // For wishlist server sync

// --- Helper: Get Query Params ---
function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

async function checkAuth() {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const res = await fetch(BACKEND+"/api/auth/me", { headers: { "Authorization": "Bearer " + token } });
      if (res.ok) {
        document.getElementById("account-btn").textContent = "My Dashboard";
        document.getElementById("account-btn").href = "/dashboard";
        const data = await res.json();
        buyerProfile = data.user || data; // Support both {user:..} and direct user
        return true;
      }
    }
  } catch (e) {}
  document.getElementById("account-btn").textContent = "Sign In";
  document.getElementById("account-btn").href = "/login";
  buyerProfile = null;
  return false;
}

// --- Product Loading ---
async function fetchProducts() {
  try {
    let res = await fetch(BACKEND + "/api/blogger-dashboard/public/listings");
    if (!res.ok) throw new Error("Not found");
    let products = await res.json();
    // Only show published/active/approved
    products = products.filter(
      p => (p.status && (p.status === "Published" || p.status === "Active")) || p.approved
    );
    return products;
  } catch (e) { return []; }
}
async function fetchProduct(id) {
  // Try backend call for single product
  try {
    let res = await fetch(BACKEND + `/api/blogger-dashboard/public/listings/${id}`);
    if (res.ok) {
      let prod = await res.json();
      return prod;
    }
  } catch(e){}
  // Fallback: try allProducts
  if (!allProducts.length) allProducts = await fetchProducts();
  let prod = allProducts.find(p => p._id === id || p.id == id);
  if (prod) return prod;
  // Fallback - minimal
  return {
    id,
    title: "Sample Product",
    price: "10000",
    category: "Sample",
    posted: "2 hours ago",
    seller: "Demo Seller",
    images: [
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-1.jpg",
      "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-2.jpg"
    ],
    tags: ["Demo", "Sample"],
    description: "This is a sample product description for demo.",
    rating: "4.6",
    inStock: false,
    views: 3
  };
}

// --- Offers loading (for chart) ---
async function fetchOffers(productId) {
  try {
    let res = await fetch(BACKEND + `/api/offers/product/${productId}`);
    if (!res.ok) return [];
    let { offers=[] } = await res.json();
    return offers;
  } catch { return []; }
}

// --- Reviews APIs ---
async function fetchReviews(productId) {
  try {
    const res = await fetch(BACKEND + `/api/reviews/product/${productId}`);
    if (res.ok) {
      const { reviews=[] } = await res.json();
      return reviews;
    }
  } catch {}
  return [];
}

async function addReview(productId, rating, comment) {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(BACKEND + `/api/reviews/product/${productId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": "Bearer " + token } : {})
      },
      body: JSON.stringify({ rating, comment })
    });
    if (res.ok) return true;
  } catch {}
  return false;
}

// --- Render Product Details ---
function renderProduct(product) {
  currentProduct = product;
  document.getElementById("breadcrumb-title").textContent = product.title || "";
  document.getElementById("product-title").textContent = product.title || "";
  document.getElementById("product-category").textContent = product.category || "";
  document.getElementById("product-posted").textContent = product.posted 
    || (product.date ? new Date(product.date).toLocaleString() : "");
  // Price formatting with naira sign
  let priceNum = product.price;
  if (typeof priceNum === "string") priceNum = priceNum.replace(/[^\d.]/g,"");
  document.getElementById("product-price-value").textContent = Number(priceNum || 0).toLocaleString();
  // Rating
  document.getElementById("product-rating").innerHTML = getStarRating(product.rating || product.likes || 0, true);
  document.getElementById("product-description").textContent = product.description || product.summary || "";
  document.getElementById("stock-indicator").textContent = (product.inStock !== false) ? "In Stock" : "Sold";
  document.getElementById("stock-indicator").className = "text-xs px-2 py-1 rounded font-medium " + (product.inStock !== false ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500");
  document.getElementById("product-views").textContent = product.views ? `${product.views} views` : "";
  // Tags
  let tags = Array.isArray(product.tags) ? product.tags : [];
  document.getElementById("product-tags").innerHTML = tags.map(t=>`<span class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">${t}</span>`).join("");

  // Seller
  const sName = product.seller || product.authorName || product.author || "Seller";
  document.getElementById("seller-name").textContent = sName;
  document.getElementById("seller-avatar").textContent = (typeof sName === "string" && sName[0]) ? sName[0].toUpperCase() : "?";
  document.getElementById("seller-meta").textContent = product.sellerMeta || "";
  document.getElementById("seller-profile-link").href = `mart.html?seller=${encodeURIComponent(sName)}`;

  // --- Images and Thumbnails ---
  let imgs = [];
  if (Array.isArray(product.images) && product.images.length > 0) imgs = product.images;
  else if (product.img) imgs = [product.img];
  else if (product.imageUrl) imgs = [product.imageUrl];
  else imgs = ["https://ui-avatars.com/api/?name=" + encodeURIComponent(product.title || 'Product') + "&background=eee&color=263159&rounded=true"];

  let mainImg = imgs[0];
  document.getElementById("product-main-img").src = mainImg;
  document.getElementById("product-main-img").alt = product.title;

  // Render thumbnails and handle selection
  let thumbsHtml = "";
  imgs.forEach((url, i) => {
    thumbsHtml += `<img src="${url}" alt="Thumb ${i+1}" 
      class="h-16 w-16 rounded border-2 border-gray-200 cursor-pointer object-cover thumb-img ${i===0?'ring-2 ring-blue-400':''}" 
      data-img-idx="${i}" />`;
  });
  document.getElementById("product-thumbs").innerHTML = thumbsHtml;

  // Handle thumbnail selection: update main image and highlight
  document.querySelectorAll("#product-thumbs .thumb-img").forEach((thumb, idx) => {
    thumb.onclick = function() {
      document.getElementById("product-main-img").src = imgs[idx];
      document.querySelectorAll("#product-thumbs .thumb-img").forEach(e => e.classList.remove("ring-2","ring-blue-400"));
      this.classList.add("ring-2","ring-blue-400");
    };
  });
  // Hide loader, show details
  document.getElementById("product-loading").classList.add("hidden");
  document.getElementById("product-details").classList.remove("hidden");
}

// --- Star Rating Helper ---
function getStarRating(rating, showValue) {
  let rate = parseFloat(rating);
  if (isNaN(rate)) rate = 0;
  let full = Math.floor(rate), half = rate % 1 >= 0.5 ? 1 : 0, empty = 5 - full - half;
  let stars = '';
  for(let i=0;i<full;i++) stars += '★';
  if(half) stars += '⯪';
  for(let i=0;i<empty;i++) stars += '☆';
  return `<span class="text-base">${stars}</span>${showValue?` <span class="text-xs text-gray-600 ml-1">(${rate.toFixed(1)})</span>`:""}`;
}

// --- Image preview logic ---
window.selectImg = function(url, el) {
  document.getElementById("product-main-img").src = url;
  document.querySelectorAll("#product-thumbs img").forEach(e=>e.classList.remove("ring-2","ring-blue-400"));
  el.classList.add("ring-2","ring-blue-400");
};
// Lightbox
window.openLightbox = function() {
  let src = document.getElementById("product-main-img").src;
  document.getElementById("lightbox-img").src = src;
  document.getElementById("lightbox-modal").classList.remove("hidden");
}
window.closeLightbox = function() {
  document.getElementById("lightbox-modal").classList.add("hidden");
}

// --- Send Offer Modal Logic ---
window.openOfferModal = function(){
  document.getElementById('sendOfferModal').classList.remove('hidden');
  document.getElementById('offerProductId').value = currentProduct._id || currentProduct.id;
  if (buyerProfile) {
    const u = buyerProfile;
    document.getElementById('buyerDetails').innerHTML = `
      <strong>Your Details for Seller:</strong><br>
      Name: ${u.fullname || u.username}<br>
      Email: ${u.email || ''}<br>
      Phone: ${u.phone || ''}
    `;
  } else {
    document.getElementById('buyerDetails').innerHTML = `<span class="block text-red-600">You must sign in for communication and offer follow-up.</span>`;
  }
}
window.closeOfferModal = function(){
  document.getElementById('sendOfferModal').classList.add('hidden');
  document.getElementById('offerForm').reset();
  document.getElementById('offerResponse').classList.add('hidden');
}
document.getElementById('send-offer-btn').onclick = openOfferModal;
document.getElementById('offerForm').onsubmit = async function(e) {
  e.preventDefault();
  const productId = document.getElementById('offerProductId').value;
  const offerPrice = document.getElementById('offerPrice').value;
  const offerMessage = document.getElementById('offerMessage').value;
  const token = localStorage.getItem("token");
  let buyerDetails = "";
  if(buyerProfile){
    const u = buyerProfile;
    buyerDetails = {
      id: u._id,
      name: u.fullname || u.username,
      email: u.email,
      phone: u.phone
    };
  }
  const fullMessage = `
Offer from: ${buyerDetails.name || "Guest"}
Email: ${buyerDetails.email || "N/A"}
Phone: ${buyerDetails.phone || "N/A"}
Product: ${currentProduct.title || ""}
---
${offerMessage}
  `.trim();

  try {
    const res = await fetch(BACKEND + "/api/offers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": "Bearer " + token } : {})
      },
      body: JSON.stringify({
        productId,
        offerPrice,
        message: fullMessage,
        buyer: buyerDetails
      })
    });
    if (res.ok) {
      document.getElementById('offerResponse').textContent = "Offer sent successfully!";
      document.getElementById('offerResponse').classList.remove('hidden');
      document.getElementById('offerForm').reset();
      setTimeout(closeOfferModal, 1500);
    } else throw new Error();
  } catch {
    document.getElementById('offerResponse').textContent = "Could not send offer. Please try again.";
    document.getElementById('offerResponse').classList.remove('hidden');
  }
}

// --- Chat Seller Button ---
document.getElementById('chat-seller-btn').onclick = function(){
  if(!buyerProfile){
    alert("Sign in to chat with seller!");
    window.location.href = "/login";
    return;
  }
  alert("Chat feature coming soon!");
};

// --- Share Button ---
document.getElementById('share-btn').onclick = function(){
  if (navigator.share) {
    navigator.share({
      title: currentProduct.title,
      url: window.location.href
    }).catch(()=>{});
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  }
};

// --- Chart Rendering ---
async function renderOffersChart(productId) {
  const offers = await fetchOffers(productId);
  if (!offers || !offers.length) return;
  document.getElementById('offers-chart-section').classList.remove('hidden');
  const sorted = offers.slice().sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  const labels = sorted.map(o=>new Date(o.createdAt).toLocaleDateString());
  const data = sorted.map(o=>parseInt(o.offerPrice,10));
  new Chart(document.getElementById('offersChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: "Offer Price (₦)",
        data,
        fill: true,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.1)",
        tension: 0.3
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

// --- Reviews Rendering ---
async function renderReviews(productId) {
  const reviews = await fetchReviews(productId);
  const reviewsList = document.getElementById('reviews-list');
  reviewsList.innerHTML = "";
  if (reviews && reviews.length) {
    reviewsList.innerHTML = reviews.map(r=>`
      <div class="bg-white rounded-lg p-3 shadow flex gap-3 items-start">
        <div class="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-lg">
          ${r.avatar ? `<img src="${r.avatar}" class="w-full h-full object-cover rounded-full"/>` : (r.user && r.user[0] ? r.user[0].toUpperCase() : "U")}
        </div>
        <div class="flex-1">
          <div class="font-semibold text-sm">${r.username ||r.fullname || "User"} <span class="text-yellow-500">${getStarRating(r.rating)}</span></div>
          <div class="text-gray-700 text-sm">${r.comment}</div>
          <div class="text-xs text-gray-400 mt-1">${r.date ? new Date(r.date).toLocaleString() : ""}</div>
        </div>
      </div>
    `).join("");
  } else {
    reviewsList.innerHTML = `<div class="text-gray-500 text-center py-6">No reviews yet.</div>`;
  }
}

// --- Add Review Form Logic ---
function setupAddReview(productId) {
  const addReviewCard = document.getElementById("add-review-card");
  if (buyerProfile) {
    addReviewCard.classList.remove("hidden");
  } else {
    addReviewCard.classList.add("hidden");
    return;
  }
  // Star rating - interactive
  const ratingStars = document.getElementById("rating-stars");
  ratingStars.innerHTML = "";
  let selectedRating = 0;
  for(let i=1;i<=5;i++) {
    let star = document.createElement("span");
    star.textContent = "★";
    star.className = "cursor-pointer text-2xl text-gray-300 hover:text-yellow-400";
    star.onmouseenter = ()=> {
      for(let j=0;j<5;j++) ratingStars.children[j].classList.toggle("text-yellow-400", j<i);
    };
    star.onmouseleave = ()=> {
      for(let j=0;j<5;j++) ratingStars.children[j].classList.toggle("text-yellow-400", j<selectedRating);
    };
    star.onclick = ()=> {
      selectedRating = i;
      for(let j=0;j<5;j++) ratingStars.children[j].classList.toggle("text-yellow-400", j<selectedRating);
    };
    ratingStars.appendChild(star);
  }
  // Submit review handler
  document.getElementById("reviewForm").onsubmit = async function(e) {
    e.preventDefault();
    if (selectedRating < 1) {
      alert("Please select a rating!");
      return;
    }
    const comment = document.getElementById("reviewMessage").value;
    const ok = await addReview(productId, selectedRating, comment);
    const resp = document.getElementById("reviewResponse");
    if (ok) {
      resp.textContent = "Review submitted!";
      resp.classList.remove("hidden");
      this.reset();
      selectedRating = 0;
      for(let j=0;j<5;j++) ratingStars.children[j].classList.remove("text-yellow-400");
      await renderReviews(productId);
    } else {
      resp.textContent = "Failed to submit review.";
      resp.classList.remove("hidden");
    }
    setTimeout(()=>resp.classList.add("hidden"), 2000);
  };
}

// --- Related Items ---
function renderRelatedItems(product, products) {
  let related = products.filter(p=>p._id !== product._id && p.category === product.category);
  if (related.length < 4) {
    const others = products.filter(p=>p._id !== product._id && !related.includes(p));
    for (let i=related.length; i<4 && others.length; i++) {
      const idx = Math.floor(Math.random()*others.length);
      related.push(others[idx]);
      others.splice(idx,1);
    }
  }
  document.getElementById("related-items").innerHTML = related.slice(0,4).map(p=>`
    <div class="bg-white rounded-xl shadow overflow-hidden hover:scale-105 transition">
      <a href="items.html?id=${p._id||p.id}" class="block">
        <img src="${(Array.isArray(p.images) && p.images[0]) || p.img || p.imageUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(p.title || 'Product') + '&background=eee&color=263159&rounded=true'}" class="w-full h-32 object-contain bg-gray-50" />
        <div class="p-3">
          <div class="font-semibold text-blue-900 text-sm truncate">${p.title}</div>
          <div class="text-yellow-700 font-bold flex items-center gap-1"><span>&#8358;</span>${Number(p.price||0).toLocaleString()}</div>
        </div>
      </a>
    </div>
  `).join("");
}

// --- Wishlist/Favorite Logic ---
async function fetchWishlist() {
  const token = localStorage.getItem("token");
  if (!token) {
    wishlistIds = [];
    return;
  }
  try {
    const res = await fetch(`${BACKEND}/api/blogger-dashboard/wishlist`, {
      headers: { "Authorization": "Bearer " + token }
    });
    if (res.ok) {
      const { wishlist } = await res.json();
      wishlistIds = (wishlist || []).map(item => item._id || item.id);
    } else {
      wishlistIds = [];
    }
  } catch {
    wishlistIds = [];
  }
}
function isWishlisted(id) {
  return wishlistIds.includes(id);
}
async function toggleWishlistServer(id) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Sign in to use wishlist!");
    window.location.href = "/login";
    return;
  }
  if (isWishlisted(id)) {
    await fetch(`${BACKEND}/api/blogger-dashboard/wishlist/remove/${id}`, {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + token }
    });
    wishlistIds = wishlistIds.filter(_id => _id !== id);
  } else {
    await fetch(`${BACKEND}/api/blogger-dashboard/wishlist/add/${id}`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + token }
    });
    wishlistIds.push(id);
  }
  updateFavoriteBtn(id);
}
function updateFavoriteBtn(id) {
  document.getElementById("favorite-icon").textContent = isWishlisted(id) ? "♥" : "♡";
}
document.getElementById("favorite-btn").onclick = async function() {
  if (!currentProduct) return;
  let id = currentProduct._id || currentProduct.id;
  await toggleWishlistServer(id);
};

// --- Report Modal ---
document.getElementById("report-btn").onclick = function() {
  document.getElementById("reportModal").classList.remove("hidden");
  document.getElementById("reportForm").reset();
  document.getElementById("reportResponse").classList.add("hidden");
}
window.closeReportModal = function() {
  document.getElementById("reportModal").classList.add("hidden");
}
document.getElementById("reportForm").onsubmit = async function(e) {
  e.preventDefault();
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Sign in to report an item!");
    window.location.href = "/login";
    return;
  }
  const reason = document.getElementById("reportMessage").value;
  const productId = currentProduct._id || currentProduct.id;
  try {
    const res = await fetch(`${BACKEND}/api/blogger-dashboard/report/${productId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        reason: reason,
        description: ""
      })
    });
    if (res.ok) {
      document.getElementById("reportResponse").textContent = "Thank you. Your report was submitted!";
      document.getElementById("reportResponse").classList.remove("hidden");
      setTimeout(closeReportModal, 1800);
    } else {
      document.getElementById("reportResponse").textContent = "Failed to submit report.";
      document.getElementById("reportResponse").classList.remove("hidden");
    }
  } catch {
    document.getElementById("reportResponse").textContent = "Failed to submit report.";
    document.getElementById("reportResponse").classList.remove("hidden");
  }
};

// --- On Load ---
document.addEventListener("DOMContentLoaded", async function() {
  await checkAuth();
  await fetchWishlist(); // Load wishlist from server!
  const productId = getQueryParam("id");
  if (!productId) {
    document.getElementById("product-loading").textContent = "No product ID found!";
    return;
  }
  allProducts = await fetchProducts();
  const product = await fetchProduct(productId);
  renderProduct(product);
  updateFavoriteBtn(product._id||product.id);
  renderOffersChart(product._id||product.id);
  await renderReviews(product._id||product.id);
  setupAddReview(product._id||product.id);
  renderRelatedItems(product, allProducts);
});

// ========== ADD TO CART ==========
document.getElementById('add-to-cart-btn').onclick = async function() {
  if (!buyerProfile) {
    alert("Sign in to add to cart!");
    window.location.href = "/login";
    return;
  }
  const token = localStorage.getItem("token");
  const productId = currentProduct._id || currentProduct.id;
  try {
    const res = await fetch(BACKEND + "/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        productId,
        quantity: 1
      })
    });
    if (res.ok) {
      alert("Item added to cart!");
    } else {
      alert("Failed to add to cart.");
    }
  } catch (e) {
    alert("Failed to add to cart.");
  }
};

// ========== CHAT SELLER ==========
let chatSellerId = null;
document.getElementById('chat-seller-btn').onclick = async function(){
  if(!buyerProfile){
    alert("Sign in to chat with seller!");
    window.location.href = "/login";
    return;
  }
  chatSellerId = currentProduct.sellerId || currentProduct.seller || currentProduct.authorId;
  openChatModal();
  await loadChatHistory();
};

function openChatModal() {
  document.getElementById("chatSellerModal").classList.remove("hidden");
  document.getElementById("chatMessages").innerHTML = '<div class="text-gray-400 text-center my-4">Loading chat...</div>';
  document.getElementById("chatResponse").classList.add("hidden");
}
function closeChatModal() {
  document.getElementById("chatSellerModal").classList.add("hidden");
  document.getElementById("chatInput").value = "";
}

// Fetch chat history with this seller from backend
async function loadChatHistory() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(BACKEND + `/api/blogger-dashboard/massages/${chatSellerId}`, {
      headers: { "Authorization": "Bearer " + token }
    });
    const messages = res.ok ? await res.json() : [];
    renderChatMessages(messages);
  } catch {
    renderChatMessages([]);
  }
}
function renderChatMessages(messages) {
  const box = document.getElementById("chatMessages");
  if (!messages.length) {
    box.innerHTML = '<div class="text-gray-400 text-center my-4">No messages yet. Start the conversation!</div>';
    return;
  }
  box.innerHTML = messages.map(msg => `
    <div class="mb-2 flex ${msg.senderId === buyerProfile._id ? 'justify-end' : 'justify-start'}">
      <div class="rounded px-3 py-2 ${msg.senderId === buyerProfile._id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'} max-w-[80%]">
        <span class="block text-xs text-gray-100/90">${msg.senderName || ''}</span>
        ${msg.text}
        <div class="text-[10px] text-gray-200/80 text-right">${msg.date ? new Date(msg.date).toLocaleTimeString() : ''}</div>
      </div>
    </div>
  `).join("");
  box.scrollTop = box.scrollHeight;
}

// Send chat message to backend
document.getElementById("chatForm").onsubmit = async function(e) {
  e.preventDefault();
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(BACKEND + "/api/blogger-dashboard/massages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        sellerId: chatSellerId,
        text,
        productId: currentProduct._id || currentProduct.id
      })
    });
    if (res.ok) {
      input.value = "";
      await loadChatHistory();
      document.getElementById("chatResponse").classList.add("hidden");
    } else {
      document.getElementById("chatResponse").textContent = "Failed to send message.";
      document.getElementById("chatResponse").classList.remove("hidden");
    }
  } catch {
    document.getElementById("chatResponse").textContent = "Failed to send message.";
    document.getElementById("chatResponse").classList.remove("hidden");
  }
};
