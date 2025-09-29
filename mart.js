
    // --- Faculty/Department Cache & Lookup Utilities ---
    let facultiesCache = [];
    let departmentsCache = [];

    async function fetchFacultiesAndDepartments() {
      try {
        const [faculties, departments] = await Promise.all([
          fetch('https://examguide.onrender.com/api/faculties').then(r => r.json()),
          fetch('https://examguide.onrender.com/api/departments').then(r => r.json())
        ]);
        facultiesCache = faculties;
        departmentsCache = departments;
      } catch {
        facultiesCache = [];
        departmentsCache = [];
      }
    }

    function getFacultyName(faculty) {
      if (!faculty) return '';
      if (typeof faculty === 'object' && faculty.name) return faculty.name;
      if (typeof faculty === 'string') {
        const found = facultiesCache.find(f => f._id === faculty);
        return found ? found.name : faculty;
      }
      return '';
    }
    function getDepartmentName(department) {
      if (!department) return '';
      if (typeof department === 'object' && department.name) return department.name;
      if (typeof department === 'string') {
        const found = departmentsCache.find(d => d._id === department);
        return found ? found.name : department;
      }
      return '';
    }

    // Auth Check & Buyer Info
    let buyerProfile = null;
    async function checkAuth() {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const res = await fetch("https://examguide.onrender.com/api/auth/me", {
            headers: { "Authorization": "Bearer " + token }
          });
          if (res.ok) {
            document.getElementById("account-btn").textContent = "My Dashboard";
            document.getElementById("account-btn").href = "/dashboard";
            buyerProfile = await res.json();
            return true;
          }
        }
      } catch (e) {}
      document.getElementById("account-btn").textContent = "Sign In";
      document.getElementById("account-btn").href = "/login";
      buyerProfile = null;
      return false;
    }

    // Demo Products (fallback)
    const demoProducts = [
      {
        id: 1,
        title: "Casio FX-991EX Calculator",
        price: "₦6,500",
        category: "Gadgets",
        posted: "3 hours ago",
        seller: "Blessing (Sciences 200L)",
        rating: "⭐ 4.6 (7)",
        images: ["https://flowbite.s3.amazonaws.com/docs/gallery/square/image-1.jpg"],
        description: "Like new. Used for only one semester."
      },
      {
        id: 2,
        title: "HP Elitebook Laptop",
        price: "₦180,000",
        category: "Electronics",
        posted: "1 day ago",
        seller: "Michael (Engineering 300L)",
        rating: "⭐ 4.9 (15)",
        images: ["https://flowbite.s3.amazonaws.com/docs/gallery/square/image-2.jpg"],
        description: "Slim, powerful, and perfect for students."
      }
    ];

    // Render Products
function renderProducts(products) {
  const list = document.getElementById("products-list");
  if (!products.length) {
    list.innerHTML = `<div class="text-center col-span-2 text-lg text-gray-500 py-12">No products found.</div>`;
    return;
  }
  list.innerHTML = products.map(p => `
    <div class="bg-white rounded-lg shadow overflow-hidden flex flex-col" style="min-height: 320px;">
      <a href="sales/items.html?id=${p._id || p.id}" class="block h-40 sm:h-48 w-full overflow-hidden">
        <img src="${p.img || p.imageUrl || (Array.isArray(p.images) && p.images[0]) || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(p.title || 'Product') + '&background=eee&color=263159&rounded=true'}"
             class="h-full w-full object-cover bg-gray-100" alt="${p.title}">
      </a>
      <div class="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 class="font-bold text-base text-blue-800 leading-tight mb-1">
            <a href="sales/items.html?id=${p._id || p.id}">${p.title}</a>
          </h3>
          <p class="text-yellow-600 font-semibold text-sm mb-1">${p.price}</p>
          <p class="text-gray-500 text-xs">${p.category || ''} • ${p.posted || (p.date ? new Date(p.date).toLocaleDateString() : "")}</p>
        </div>
        <div>
          <div class="flex items-center gap-2 mt-1">
            <span class="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">${p.seller || p.author || p.authorName || ""}</span>
            <span class="flex items-center text-xs text-yellow-600">${p.rating || ("⭐ " + (p.likes || 0))}</span>
          </div>
          <p class="mt-2 text-gray-700 text-xs">${p.description || p.summary || ""}</p>
          <div class="flex gap-2 mt-3">
            <a href="sales/items.html?id=${p._id || p.id}" class="flex-1 px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-xs">View</a>
            <button type="button" onclick="openOfferModal('${p._id || p.id}', '${p.title}')" class="flex-1 px-2 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-xs">Offer</button>
          </div>
          <a href="#" class="block text-right text-red-500 text-xs mt-2 hover:underline">Report</a>
        </div>
      </div>
    </div>
  `).join("");
}

  async function fetchPublicProducts(query="") {
  try {
    let url = "https://examguide.onrender.com/api/blogger-dashboard/public/listings";
    let res = await fetch(url);
    let products = [];
    if (res.ok) {
      products = await res.json();
      // Only show approved/published/active listings
      products = products.filter(
        p => (p.status && (p.status === "Published" || p.status === "Active")) || p.approved
      );
      if (query) {
        const q = query.toLowerCase();
        products = products.filter(p =>
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.summary && p.summary.toLowerCase().includes(q))
        );
      }
    }
    if (!products.length) products = demoProducts;
    renderProducts(products);
  } catch (e) {
    renderProducts(demoProducts);
  }
}

    // OFFER MODAL logic (updated to robustly show faculty/department names!)
    let currentOfferProductId = null;
    let currentOfferProductTitle = null;
    window.openOfferModal = function(productId, productTitle){
      currentOfferProductId = productId;
      currentOfferProductTitle = productTitle;
      document.getElementById('offerProductId').value = productId;
      document.getElementById('sendOfferModal').classList.remove('hidden');

      let details = "";
      if (buyerProfile && buyerProfile.user) {
        const u = buyerProfile.user;

        // Use cached lookup helpers for bulletproof name rendering
        let facultyDisplay = getFacultyName(u.faculty);
        let departmentDisplay = getDepartmentName(u.department);

        details = `
          <span class="block"><strong>Your Details for Seller:</strong></span>
          <span>Name: ${u.fullname || u.username}</span><br>
          <span>Email: ${u.email || ''}</span><br>
          <span>Phone: ${u.phone || ''}</span><br>
          <span>Faculty: <span id="buyerFaculty">${facultyDisplay}</span></span><br>
          <span>Department: <span id="buyerDepartment">${departmentDisplay}</span></span>
        `;
        document.getElementById('buyerDetails').innerHTML = details;
      } else {
        details = `<span class="block text-red-600">You must sign in for communication and offer follow-up.</span>`;
        document.getElementById('buyerDetails').innerHTML = details;
      }
    }

    window.closeOfferModal = function(){
      document.getElementById('sendOfferModal').classList.add('hidden');
      document.getElementById('offerForm').reset();
      document.getElementById('offerResponse').classList.add('hidden');
    }

    document.addEventListener("DOMContentLoaded", async function() {
      await fetchFacultiesAndDepartments();
      await checkAuth();
      fetchPublicProducts();

      document.getElementById("search-btn").onclick = function() {
        const q = document.getElementById("search-input").value.trim();
        fetchPublicProducts(q);
      };
      document.getElementById("search-input").addEventListener("keyup", function(e){
        if(e.key === "Enter"){
          document.getElementById("search-btn").click();
        }
      });

      // Offer form submit handler
      document.getElementById('offerForm').onsubmit = async function(e) {
        e.preventDefault();
        const productId = document.getElementById('offerProductId').value;
        const offerPrice = document.getElementById('offerPrice').value;
        const offerMessage = document.getElementById('offerMessage').value;
        const token = localStorage.getItem("token");
        // Gather buyer details
        let buyerDetails = "";
        if(buyerProfile && buyerProfile.user){
          const u = buyerProfile.user;
          buyerDetails = {
            id: u._id,
            name: u.fullname || u.username,
            email: u.email,
            phone: u.phone,
            faculty: getFacultyName(u.faculty),
            department: getDepartmentName(u.department)
          };
        }
        // Compose full message to seller
        const fullMessage = `
Offer from: ${buyerDetails.name || "Guest"}
Email: ${buyerDetails.email || "N/A"}
Phone: ${buyerDetails.phone || "N/A"}
Faculty: ${buyerDetails.faculty || ""}
Department: ${buyerDetails.department || ""}
Product: ${currentOfferProductTitle || ""}
---
${offerMessage}
        `.trim();

        // Try sending to backend (replace with real endpoint)
        try {
          const res = await fetch("https://examguide.onrender.com/api/offers", {
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
            document.getElementById('offerResponse').textContent = "Offer sent successfully! Saved for follow-up.";
            document.getElementById('offerResponse').classList.remove('hidden');
            document.getElementById('offerForm').reset();
            setTimeout(closeOfferModal, 1500);
          } else {
            throw new Error("Failed to send offer");
          }
        } catch (err) {
          document.getElementById('offerResponse').textContent = "Could not send offer. Please try again.";
          document.getElementById('offerResponse').classList.remove('hidden');
        }
      }
    });
