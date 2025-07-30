// --- Sidebar NAV & TABS ---
const sidebar = document.getElementById('sidebar');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');
hamburgerBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
    sidebarOverlay.style.display = "block";
    document.body.classList.add('overflow-hidden');
});
sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.style.display = "none";
    document.body.classList.remove('overflow-hidden');
});
// Close sidebar on outside click for mobile
document.addEventListener('click', function(e) {
    if (window.innerWidth >= 1024) return;
    if (!sidebar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        sidebar.classList.remove('open');
        sidebarOverlay.style.display = "none";
        document.body.classList.remove('overflow-hidden');
    }
});
function showDashboardSpinner() {
    document.getElementById('dashboardSpinner').style.display = 'flex';
}
function hideDashboardSpinner() {
    document.getElementById('dashboardSpinner').style.display = 'none';
                              }
// --- GLOBALS ---
let dashboard = null;
let user = null;
let quill;

// --- AUTH & DATA LOAD ---
const API_URL = "https://examguide.onrender.com/api/";
function getToken() {
    return localStorage.getItem("token");
}

// Helper for authenticated fetches (handles 401)
async function fetchWithAuth(url, options = {}) {
    const token = getToken();
    if (!token) {
        window.location.href = "/mock-icthallb";
        throw new Error("No token found");
    }
    options.headers = options.headers || {};
    options.headers['Authorization'] = 'Bearer ' + token;
    const resp = await fetch(url, options);
    if (resp.status === 401 || resp.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/mock-icthallb";
        throw new Error("Session expired.");
    }
    return resp;
}

async function fetchUser() {
    const res = await fetchWithAuth(API_URL + "auth/me");
    if (!res.ok) {
        throw new Error("Not authenticated");
    }
    const data = await res.json();
    user = data.user;
    // Update welcome message
    if (user && user.fullname) {
        document.querySelector("h2.font-bold.text-gray-800").textContent = `Welcome, ${user.fullname}!`;
    }
    return user;
}

async function fetchDashboard() {
    const res = await fetchWithAuth(API_URL + "blogger-dashboard");
    if (!res.ok) {
        throw new Error("Could not load dashboard");
    }
    dashboard = await res.json();
    return dashboard;
}

async function saveDashboardField(field, value) {
    await fetchWithAuth(API_URL + "blogger-dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value })
    });
}

async function saveDashboardSubdoc(type, doc, mode, id) {
    let url = API_URL + `blogger-dashboard/${type}`;
    let method = "POST";
    if (mode === "update" && id) {
        url += `/${id}`;
        method = "PATCH";
    } else if (mode === "delete" && id) {
        url += `/${id}`;
        method = "DELETE";
    }
    let options = {
        method,
        headers: {
            "Authorization": "Bearer " + getToken(),
            "Content-Type": "application/json"
        }
    };
    if (method !== "DELETE") {
        options.body = JSON.stringify(doc);
    }
    const res = await fetch(url, options);
    if (!res.ok) throw new Error("Failed to save " + type);
    return await res.json();
}

// --- TABS LOGIC ---
document.querySelectorAll('.sidebar-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const tab = this.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        document.getElementById(tab).classList.add('active');
        // Close sidebar on mobile
        if (window.innerWidth < 1024) {
            sidebar.classList.remove('open');
            sidebarOverlay.style.display = "none";
            document.body.classList.remove('overflow-hidden');
        }
        if(tab === "analytics") {
            setTimeout(renderAnalyticsTab, 0);
        }
    });
});

// --- POSTS TAB ---
function renderPostsTable() {
    const postTable = document.getElementById('postTable');
    postTable.innerHTML = '';
    if (!dashboard || !dashboard.posts) return;
    dashboard.posts.forEach((post, idx) => {
        postTable.innerHTML += `
        <tr class="border-t">
            <td class="p-3">${post.title}</td>
            <td class="p-3">${post.date ? (new Date(post.date)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ""}</td>
            <td class="p-3">${post.views}</td>
            <td class="p-3">${post.likes}</td>
            <td class="p-3"><span class="text-${post.status === 'Published' ? 'green' : 'yellow'}-600">${post.status}</span></td>
            <td class="p-3">
                <button class="edit-post action-btn bg-indigo-600 text-white px-3 py-1 rounded text-sm mr-2" data-idx="${idx}" data-id="${post._id}">Edit</button>
                <button class="delete-post action-btn bg-red-600 text-white px-3 py-1 rounded text-sm" data-idx="${idx}" data-id="${post._id}">Delete</button>
            </td>
        </tr>
        `;
    });
    attachPostActions();
}

const postModal = document.getElementById('postModal');
function openPostModal(editIdx = null) {
    postModal.classList.add('flex');
    postModal.classList.remove('hidden');
    document.getElementById('postModalTitle').textContent = editIdx === null ? "Create Post" : "Edit Post";
    setTimeout(initQuillEditor, 0);
    if (editIdx !== null) {
        const p = dashboard.posts[editIdx];
        document.getElementById('postTitle').value = p.title;
        quill.setContents(quill.clipboard.convert(p.content || ""));
        document.getElementById('postStatus').value = p.status ? p.status.toLowerCase() : "draft";
        postModal.dataset.editIdx = editIdx;
        postModal.dataset.postId = p._id;
    } else {
        document.getElementById('postTitle').value = '';
        quill && quill.setText('');
        document.getElementById('postStatus').value = 'draft';
        delete postModal.dataset.editIdx;
        delete postModal.dataset.postId;
    }
}
function closePostModal() {
    postModal.classList.remove('flex');
    postModal.classList.add('hidden');
}
document.getElementById('createPostBtn').onclick = () => openPostModal();
document.getElementById('cancelPostBtn').onclick = closePostModal;
document.getElementById('savePostBtn').onclick = async function() {
    const title = document.getElementById('postTitle').value.trim();
    const content = quill.root.innerHTML;
    const status = document.getElementById('postStatus').value;
    if (!title || !content || quill.getLength() < 2) {
        showToast("Please enter both title and content.");
        return;
    }
    const idx = postModal.dataset.editIdx;
    const postId = postModal.dataset.postId;
    try {
        if (idx !== undefined) {
            // Update post
            await saveDashboardSubdoc('posts', { title, content, status: status.charAt(0).toUpperCase() + status.slice(1) }, "update", postId);
        } else {
            // Create post
            await saveDashboardSubdoc('posts', {
                title,
                content,
                status: status.charAt(0).toUpperCase() + status.slice(1)
            }, "create");
        }
        await reloadDashboard();
        closePostModal();
    } catch (e) {
        showToast("Failed to save post.");
    }
};
function attachPostActions() {
    document.querySelectorAll('.edit-post').forEach(btn => {
        btn.onclick = () => openPostModal(btn.dataset.idx);
    });
    document.querySelectorAll('.delete-post').forEach(btn => {
        btn.onclick = async () => {
            if (confirm('Are you sure you want to delete this post?')) {
                try {
                    await saveDashboardSubdoc('posts', {}, "delete", btn.dataset.id);
                    await reloadDashboard();
                } catch {
                    showToast("Failed to delete post.");
                }
            }
        };
    });
}
function initQuillEditor() {
    if (!quill) {
        quill = new Quill('#quillEditor', {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'align': [] }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['link', 'image'],
                    ['clean']
                ]
            }
        });
    }
}

// --- ANALYTICS TAB ---
function renderAnalyticsTab() {
    if (!dashboard) return;
    // Destroy old charts if they exist to avoid Chart.js errors
    if (window.viewsChart) window.viewsChart.destroy();
    if (window.engagementChart) window.engagementChart.destroy();

    // VIEWS OVER TIME CHART
    const viewsData = (dashboard.analytics && dashboard.analytics.viewsOverTime) || [0,0,0,0,0,0,0];
    const viewsChartCtx = document.getElementById('viewsChart').getContext('2d');
    window.viewsChart = new Chart(viewsChartCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Views',
                data: viewsData,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.10)',
                pointBackgroundColor: '#6366f1',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true }
            }
        }
    });

    // TOP POSTS LIST
    const topPostsUl = document.getElementById('topPosts');
    const posts = dashboard.posts || [];
    const topPostsSorted = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
    topPostsUl.innerHTML = topPostsSorted.map(post =>
        `<li class="flex items-center justify-between">
            <span>${post.title}</span>
            <span class="ml-4 font-bold text-indigo-700">${(post.views || 0).toLocaleString()} Views</span>
        </li>`
    ).join('');

    // ENGAGEMENT CHART
    const engagement = (dashboard.analytics && dashboard.analytics.engagements) || {};
    const engagementData = [
        engagement.blog || 0,
        engagement.marketplace || 0,
        engagement.campaigns || 0,
        engagement.referrals || 0
    ];
    const engagementChartCtx = document.getElementById('engagementChart').getContext('2d');
    window.engagementChart = new Chart(engagementChartCtx, {
        type: 'doughnut',
        data: {
            labels: ['Blog', 'Marketplace', 'Campaigns', 'Referrals'],
            datasets: [{
                label: 'Engagement',
                data: engagementData,
                backgroundColor: [
                    '#4f46e5',
                    '#14b8a6',
                    '#f59e42',
                    '#f43f5e'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// --- FOLLOWERS TAB ---
function renderFollowers() {
    if (!dashboard || !dashboard.followers) return;
    document.getElementById('followersList').innerHTML = dashboard.followers.map(f =>
        `<div class="flex items-center">
            <img src="${f.img}" alt="Follower" class="h-10 w-10 rounded-full mr-2">
            <p class="text-sm sm:text-base text-gray-600">${f.name}</p>
        </div>`
    ).join('');
}
document.getElementById('broadcastForm').onsubmit = async function(e) {
    e.preventDefault();
    const msg = document.getElementById('broadcastMsg').value.trim();
    if (!msg) return;
    // For demo, just show message
    document.getElementById('broadcastResult').textContent = "Message sent to followers!";
    document.getElementById('broadcastResult').classList.remove('hidden');
    setTimeout(() => document.getElementById('broadcastResult').classList.add('hidden'), 2000);
    document.getElementById('broadcastMsg').value = '';
}

// --- MARKETPLACE TAB ---
function renderListings() {
    const listingTable = document.getElementById('listingTable');
    listingTable.innerHTML = '';
    if (!dashboard || !dashboard.listings) return;
    dashboard.listings.forEach((l, idx) => {
        listingTable.innerHTML += `
        <tr class="border-t">
            <td class="p-3">${l.item}</td>
            <td class="p-3">&#8358;${l.price}</td>
            <td class="p-3">${l.stock}</td>
            <td class="p-3"><span class="text-${l.status === 'Active' ? 'green' : (l.status === 'Pending' ? 'yellow' : 'gray')}-600">${l.status}</span></td>
            <td class="p-3">${l.sales}</td>
            <td class="p-3">
                <button class="edit-listing action-btn bg-indigo-600 text-white px-3 py-1 rounded text-sm mr-2" data-idx="${idx}" data-id="${l._id}">Edit</button>
                <button class="delete-listing action-btn bg-red-600 text-white px-3 py-1 rounded text-sm" data-idx="${idx}" data-id="${l._id}">Delete</button>
            </td>
        </tr>
        `;
    });
    attachListingActions();
}
const listingModal = document.getElementById('listingModal');
function openListingModal(editIdx = null) {
    listingModal.classList.add('flex');
    listingModal.classList.remove('hidden');
    document.getElementById('listingModalTitle').textContent = editIdx === null ? "Add Listing" : "Edit Listing";
    if (editIdx !== null) {
        const l = dashboard.listings[editIdx];
        document.getElementById('listingItem').value = l.item;
        document.getElementById('listingPrice').value = l.price;
        document.getElementById('listingStock').value = l.stock;
        document.getElementById('listingStatus').value = l.status;
        listingModal.dataset.editIdx = editIdx;
        listingModal.dataset.listingId = l._id;
    } else {
        document.getElementById('listingItem').value = '';
        document.getElementById('listingPrice').value = '';
        document.getElementById('listingStock').value = '';
        document.getElementById('listingStatus').value = 'Active';
        delete listingModal.dataset.editIdx;
        delete listingModal.dataset.listingId;
    }
}
function closeListingModal() {
    listingModal.classList.remove('flex');
    listingModal.classList.add('hidden');
}
document.getElementById('addListingBtn').onclick = () => openListingModal();
document.getElementById('saveListingBtn').onclick = async function() {
    const item = document.getElementById('listingItem').value.trim();
    const price = document.getElementById('listingPrice').value;
    const stock = document.getElementById('listingStock').value;
    const status = document.getElementById('listingStatus').value;
    if (!item || !price || !stock) {
        showToast("Please fill all fields for listing.");
        return;
    }
    const idx = listingModal.dataset.editIdx;
    const listingId = listingModal.dataset.listingId;
    try {
        if (idx !== undefined) {
            await saveDashboardSubdoc('listings', { item, price, stock, status }, "update", listingId);
        } else {
            await saveDashboardSubdoc('listings', { item, price, stock, status, sales: 0 }, "create");
        }
        await reloadDashboard();
        closeListingModal();
    } catch {
        showToast("Failed to save listing.");
    }
};
function attachListingActions() {
    document.querySelectorAll('.edit-listing').forEach(btn => {
        btn.onclick = () => openListingModal(btn.dataset.idx);
    });
    document.querySelectorAll('.delete-listing').forEach(btn => {
        btn.onclick = async () => {
            if (confirm('Are you sure you want to delete this listing?')) {
                try {
                    await saveDashboardSubdoc('listings', {}, "delete", btn.dataset.id);
                    await reloadDashboard();
                } catch {
                    showToast("Failed to delete listing.");
                }
            }
        };
    });
}

// --- COMMISSIONS TAB LOGIC ---
function updateCommissionSummary() {
    let totalEarnings = 0, totalWithdrawn = 0;
    if (dashboard && dashboard.commissions) {
        totalEarnings = dashboard.commissions.filter(c => c.type === "Earning").reduce((a,c) => a + c.amount, 0);
        totalWithdrawn = dashboard.commissions.filter(c => c.type === "Withdrawal").reduce((a,c) => a + c.amount, 0);
        document.getElementById('commissionTable').innerHTML = dashboard.commissions.map(c =>
            `<tr class="border-t">
                <td class="p-3">${c.date}</td>
                <td class="p-3">${c.source}</td>
                <td class="p-3">&#8358;${c.amount.toLocaleString()}</td>
                <td class="p-3"><span class="text-${c.status === 'Paid' || c.status === 'Completed' ? 'green' : 'yellow'}-600">${c.status}</span></td>
                <td class="p-3">${c.type}</td>
            </tr>`
        ).join('');
    }
    document.getElementById('totalEarnings').textContent = totalEarnings.toLocaleString();
    document.getElementById('totalWithdrawn').textContent = totalWithdrawn.toLocaleString();
    document.getElementById('availableBalance').textContent = (totalEarnings - totalWithdrawn).toLocaleString();
}
document.getElementById('withdrawBtn').onclick = function() {
    showToast("Withdrawal request feature coming soon!");
};

// --- MESSAGES TAB ---
function renderMessages() {
    if (!dashboard || !dashboard.messages) return;
    document.getElementById('inboxList').innerHTML = dashboard.messages.map(m =>
        `<li class="bg-gray-50 px-3 py-2 rounded shadow-sm">
            <div class="font-semibold text-indigo-700">${m.from}</div>
            <div class="text-gray-700">${m.msg}</div>
            <div class="text-xs text-gray-400">${m.date}</div>
        </li>`
    ).join('');
    document.getElementById('recipientSelect').innerHTML = (dashboard.followers || []).map(f =>
        `<option value="${f.name}">${f.name}</option>`
    ).join('');
}
document.getElementById('sendMsgForm').onsubmit = async function(e) {
    e.preventDefault();
    const name = document.getElementById('recipientSelect').value;
    const msg = document.getElementById('msgInput').value.trim();
    if (!name || !msg) return;
    try {
        await saveDashboardSubdoc('messages', {
            from: user.fullname || user.username,
            msg,
            date: (new Date()).toISOString().slice(0, 16).replace('T', ' ')
        }, "create");
        await reloadDashboard();
        document.getElementById('sendMsgResult').textContent = "Message sent to " + name + "!";
        document.getElementById('sendMsgResult').classList.remove('hidden');
        setTimeout(() => document.getElementById('sendMsgResult').classList.add('hidden'), 2000);
        document.getElementById('msgInput').value = '';
    } catch {
        showToast("Failed to send message.");
    }
}

// --- PROFILE TAB ---
document.getElementById('profileForm').onsubmit = async function(e) {
    e.preventDefault();
    // Only local effect for now; you may POST to /api/auth/me for real update later
    document.getElementById('profileSaveResult').textContent = "Profile updated!";
    document.getElementById('profileSaveResult').classList.remove('hidden');
    setTimeout(() => document.getElementById('profileSaveResult').classList.add('hidden'), 2000);
}

// --- LOGOUT TAB ---
document.getElementById('confirmLogout').onclick = function() {
    localStorage.removeItem("token");
    showToast("Logged out successfully!");
    setTimeout(() => location.reload(), 1200);
}

// --- Modal Close on Backdrop Click ---
document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('flex');
            this.classList.add('hidden');
        }
    });
});

// --- Toast Notification ---
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2000);
}

// --- RELOAD DASHBOARD (helper) ---
async function reloadDashboard() {
    await fetchDashboard();
    renderPostsTable();
    renderListings();
    renderFollowers();
    updateCommissionSummary();
    renderMessages();
}

// --- INITIALIZATION ---
async function mainDashboardInit() {
    try {
        showDashboardSpinner();
        await fetchUser();
        await fetchDashboard();
        renderPostsTable();
        renderListings();
        renderFollowers();
        updateCommissionSummary();
        renderMessages();
        // If analytics tab is active on load
        if (document.getElementById('analytics').classList.contains('active')) {
            setTimeout(renderAnalyticsTab, 100);
        }
    } catch (e) {
        showToast("Please login again.");
        setTimeout(() => window.location.href = "/mock-icthallb", 1500);
    } finally {
        hideDashboardSpinner();
    }
}
    
mainDashboardInit();
