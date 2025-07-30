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
// Tabs logic
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
        // --- Analytics tab: render charts and lists only when shown
        if(tab === "analytics") {
            setTimeout(renderAnalyticsTab, 100);
        }
    });
});

// --- Sample Data ---
const posts = [
    { title: "Top 10 Study Hacks", date: "Oct 10, 2025", views: 2500, likes: 120, status: "Published" },
    { title: "Coding Tips for Beginners", date: "Oct 5, 2025", views: 1800, likes: 85, status: "Draft" },
    { title: "Mastering Time Management", date: "Sep 30, 2025", views: 1200, likes: 60, status: "Published" }
];
const listings = [
    { item: "Calculus I Notes", price: 5.99, stock: 12, status: "Active", sales: 17 },
    { item: "USB-C Cable", price: 6.99, stock: 7, status: "Pending", sales: 3 },
    { item: "Physics Lab Manual", price: 4.5, stock: 4, status: "Active", sales: 8 }
];
const commissions = [
    { date: "2025-10-09", source: "Referral", amount: 2000, status: "Paid", type: "Earning" },
    { date: "2025-10-07", source: "Marketplace Sale", amount: 1200, status: "Pending", type: "Earning" },
    { date: "2025-10-06", source: "Withdrawal", amount: 1000, status: "Completed", type: "Withdrawal" },
    { date: "2025-10-04", source: "Campaign", amount: 3500, status: "Paid", type: "Earning" }
];
const followers = [
    { name: "Jane Doe", img: "https://via.placeholder.com/40?text=JD" },
    { name: "Mike Smith", img: "https://via.placeholder.com/40?text=MS" },
    { name: "Ada Lovelace", img: "https://via.placeholder.com/40?text=AL" },
    { name: "John Lee", img: "https://via.placeholder.com/40?text=JL" }
];
const messages = [
    { from: "Jane Doe", msg: "Great post on time management!", date: "2025-10-09 12:30" },
    { from: "Mike Smith", msg: "Can you share more about coding tips?", date: "2025-10-08 15:45" }
];

// --- POSTS TAB ---
function renderPostsTable() {
    const postTable = document.getElementById('postTable');
    postTable.innerHTML = '';
    posts.forEach((post, idx) => {
        postTable.innerHTML += `
        <tr class="border-t">
            <td class="p-3">${post.title}</td>
            <td class="p-3">${post.date}</td>
            <td class="p-3">${post.views}</td>
            <td class="p-3">${post.likes}</td>
            <td class="p-3"><span class="text-${post.status === 'Published' ? 'green' : 'yellow'}-600">${post.status}</span></td>
            <td class="p-3">
                <button class="edit-post action-btn bg-indigo-600 text-white px-3 py-1 rounded text-sm mr-2" data-idx="${idx}">Edit</button>
                <button class="delete-post action-btn bg-red-600 text-white px-3 py-1 rounded text-sm" data-idx="${idx}">Delete</button>
            </td>
        </tr>
        `;
    });
    attachPostActions();
}
renderPostsTable();

// --- Modal handling for posts with Quill ---
let quill;
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
const postModal = document.getElementById('postModal');
function openPostModal(editIdx = null) {
    postModal.classList.add('flex');
    postModal.classList.remove('hidden');
    document.getElementById('postModalTitle').textContent = editIdx === null ? "Create Post" : "Edit Post";
    setTimeout(initQuillEditor, 0);
    if (editIdx !== null) {
        document.getElementById('postTitle').value = posts[editIdx].title;
        quill.setContents(quill.clipboard.convert('<p>Sample content for ' + posts[editIdx].title + '</p>'));
        document.getElementById('postStatus').value = posts[editIdx].status.toLowerCase();
        postModal.dataset.editIdx = editIdx;
    } else {
        document.getElementById('postTitle').value = '';
        quill && quill.setText('');
        document.getElementById('postStatus').value = 'draft';
        delete postModal.dataset.editIdx;
    }
}
function closePostModal() {
    postModal.classList.remove('flex');
    postModal.classList.add('hidden');
}
document.getElementById('createPostBtn').onclick = () => openPostModal();
document.getElementById('cancelPostBtn').onclick = closePostModal;
document.getElementById('savePostBtn').onclick = function() {
    const title = document.getElementById('postTitle').value.trim();
    const content = quill.root.innerHTML;
    const status = document.getElementById('postStatus').value;
    if (!title || !content || quill.getLength() < 2) {
        showToast("Please enter both title and content.");
        return;
    }
    const idx = postModal.dataset.editIdx;
    if (idx !== undefined) {
        posts[idx].title = title;
        posts[idx].status = status.charAt(0).toUpperCase() + status.slice(1);
    } else {
        posts.push({
            title,
            date: (new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            views: 0,
            likes: 0,
            status: status.charAt(0).toUpperCase() + status.slice(1)
        });
    }
    renderPostsTable();
    closePostModal();
};
function attachPostActions() {
    document.querySelectorAll('.edit-post').forEach(btn => {
        btn.onclick = () => openPostModal(btn.dataset.idx);
    });
    document.querySelectorAll('.delete-post').forEach(btn => {
        btn.onclick = () => {
            if (confirm('Are you sure you want to delete this post?')) {
                posts.splice(btn.dataset.idx, 1);
                renderPostsTable();
            }
        };
    });
}

// --- ANALYTICS TAB ---
function renderAnalyticsTab() {
    // Destroy old charts if they exist to avoid Chart.js errors
    if (window.viewsChart) {
        window.viewsChart.destroy();
    }
    if (window.engagementChart) {
        window.engagementChart.destroy();
    }
    // VIEWS OVER TIME CHART
    const viewsChartCtx = document.getElementById('viewsChart').getContext('2d');
    window.viewsChart = new Chart(viewsChartCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Views',
                data: [500, 600, 800, 700, 900, 1200, 1100],
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
    // Use posts array, sorted by views
    const topPostsUl = document.getElementById('topPosts');
    const topPostsSorted = [...posts].sort((a, b) => b.views - a.views).slice(0, 5);
    topPostsUl.innerHTML = topPostsSorted.map(post =>
        `<li class="flex items-center justify-between">
            <span>${post.title}</span>
            <span class="ml-4 font-bold text-indigo-700">${post.views.toLocaleString()} Views</span>
        </li>`
    ).join('');

    // ENGAGEMENT CHART
    const engagementChartCtx = document.getElementById('engagementChart').getContext('2d');
    window.engagementChart = new Chart(engagementChartCtx, {
        type: 'doughnut',
        data: {
            labels: ['Blog', 'Marketplace', 'Campaigns', 'Referrals'],
            datasets: [{
                label: 'Engagement',
                data: [40, 22, 18, 20],
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
document.getElementById('followersList').innerHTML = followers.map(f =>
    `<div class="flex items-center">
        <img src="${f.img}" alt="Follower" class="h-10 w-10 rounded-full mr-2">
        <p class="text-sm sm:text-base text-gray-600">${f.name}</p>
    </div>`
).join('');
document.getElementById('broadcastForm').onsubmit = function(e) {
    e.preventDefault();
    const msg = document.getElementById('broadcastMsg').value.trim();
    if (!msg) return;
    document.getElementById('broadcastResult').textContent = "Message sent to followers!";
    document.getElementById('broadcastResult').classList.remove('hidden');
    setTimeout(() => document.getElementById('broadcastResult').classList.add('hidden'), 2000);
    document.getElementById('broadcastMsg').value = '';
}

// --- MARKETPLACE TAB ---
function renderListings() {
    const listingTable = document.getElementById('listingTable');
    listingTable.innerHTML = '';
    listings.forEach((l, idx) => {
        listingTable.innerHTML += `
        <tr class="border-t">
            <td class="p-3">${l.item}</td>
            <td class="p-3">&#8358;${l.price}</td>
            <td class="p-3">${l.stock}</td>
            <td class="p-3"><span class="text-${l.status === 'Active' ? 'green' : (l.status === 'Pending' ? 'yellow' : 'gray')}-600">${l.status}</span></td>
            <td class="p-3">${l.sales}</td>
            <td class="p-3">
                <button class="edit-listing action-btn bg-indigo-600 text-white px-3 py-1 rounded text-sm mr-2" data-idx="${idx}">Edit</button>
                <button class="delete-listing action-btn bg-red-600 text-white px-3 py-1 rounded text-sm" data-idx="${idx}">Delete</button>
            </td>
        </tr>
        `;
    });
    attachListingActions();
}
renderListings();
const listingModal = document.getElementById('listingModal');
function openListingModal(editIdx = null) {
    listingModal.classList.add('flex');
    listingModal.classList.remove('hidden');
    document.getElementById('listingModalTitle').textContent = editIdx === null ? "Add Listing" : "Edit Listing";
    if (editIdx !== null) {
        document.getElementById('listingItem').value = listings[editIdx].item;
        document.getElementById('listingPrice').value = listings[editIdx].price;
        document.getElementById('listingStock').value = listings[editIdx].stock;
        document.getElementById('listingStatus').value = listings[editIdx].status;
        listingModal.dataset.editIdx = editIdx;
    } else {
        document.getElementById('listingItem').value = '';
        document.getElementById('listingPrice').value = '';
        document.getElementById('listingStock').value = '';
        document.getElementById('listingStatus').value = 'Active';
        delete listingModal.dataset.editIdx;
    }
}
function closeListingModal() {
    listingModal.classList.remove('flex');
    listingModal.classList.add('hidden');
}
document.getElementById('addListingBtn').onclick = () => openListingModal();
document.getElementById('saveListingBtn').onclick = function() {
    const item = document.getElementById('listingItem').value.trim();
    const price = document.getElementById('listingPrice').value;
    const stock = document.getElementById('listingStock').value;
    const status = document.getElementById('listingStatus').value;
    if (!item || !price || !stock) {
        showToast("Please fill all fields for listing.");
        return;
    }
    const idx = listingModal.dataset.editIdx;
    if (idx !== undefined) {
        listings[idx].item = item;
        listings[idx].price = price;
        listings[idx].stock = stock;
        listings[idx].status = status;
    } else {
        listings.push({
            item, price, stock, status, sales: 0
        });
    }
    renderListings();
    closeListingModal();
};
function attachListingActions() {
    document.querySelectorAll('.edit-listing').forEach(btn => {
        btn.onclick = () => openListingModal(btn.dataset.idx);
    });
    document.querySelectorAll('.delete-listing').forEach(btn => {
        btn.onclick = () => {
            if (confirm('Are you sure you want to delete this listing?')) {
                listings.splice(btn.dataset.idx, 1);
                renderListings();
            }
        };
    });
}

// --- COMMISSIONS TAB LOGIC ---
function updateCommissionSummary() {
    let totalEarnings = commissions.filter(c => c.type === "Earning").reduce((a,c) => a + c.amount, 0);
    let totalWithdrawn = commissions.filter(c => c.type === "Withdrawal").reduce((a,c) => a + c.amount, 0);
    document.getElementById('totalEarnings').textContent = totalEarnings.toLocaleString();
    document.getElementById('totalWithdrawn').textContent = totalWithdrawn.toLocaleString();
    document.getElementById('availableBalance').textContent = (totalEarnings - totalWithdrawn).toLocaleString();
    document.getElementById('commissionTable').innerHTML = commissions.map(c =>
        `<tr class="border-t">
            <td class="p-3">${c.date}</td>
            <td class="p-3">${c.source}</td>
            <td class="p-3">&#8358;${c.amount.toLocaleString()}</td>
            <td class="p-3"><span class="text-${c.status === 'Paid' || c.status === 'Completed' ? 'green' : 'yellow'}-600">${c.status}</span></td>
            <td class="p-3">${c.type}</td>
        </tr>`
    ).join('');
}
updateCommissionSummary();
document.getElementById('withdrawBtn').onclick = function() {
    showToast("Withdrawal request feature coming soon!");
};

// --- MESSAGES TAB ---
document.getElementById('inboxList').innerHTML = messages.map(m =>
    `<li class="bg-gray-50 px-3 py-2 rounded shadow-sm">
        <div class="font-semibold text-indigo-700">${m.from}</div>
        <div class="text-gray-700">${m.msg}</div>
        <div class="text-xs text-gray-400">${m.date}</div>
    </li>`
).join('');
document.getElementById('recipientSelect').innerHTML = followers.map(f =>
    `<option value="${f.name}">${f.name}</option>`
).join('');
document.getElementById('sendMsgForm').onsubmit = function(e) {
    e.preventDefault();
    const name = document.getElementById('recipientSelect').value;
    const msg = document.getElementById('msgInput').value.trim();
    if (!name || !msg) return;
    document.getElementById('sendMsgResult').textContent = "Message sent to " + name + "!";
    document.getElementById('sendMsgResult').classList.remove('hidden');
    setTimeout(() => document.getElementById('sendMsgResult').classList.add('hidden'), 2000);
    document.getElementById('msgInput').value = '';
}

// --- PROFILE TAB ---
document.getElementById('profileForm').onsubmit = function(e) {
    e.preventDefault();
    document.getElementById('profileSaveResult').textContent = "Profile updated!";
    document.getElementById('profileSaveResult').classList.remove('hidden');
    setTimeout(() => document.getElementById('profileSaveResult').classList.add('hidden'), 2000);
}

// --- LOGOUT TAB ---
document.getElementById('confirmLogout').onclick = function() {
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

// --- Initialize Analytics tab if user lands there on load (optional) ---
if (document.getElementById('analytics').classList.contains('active')) {
    setTimeout(renderAnalyticsTab, 100);
}
