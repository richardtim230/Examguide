// =============================
// CONFIG
// =============================
const API_URL = "https://examguide.onrender.com/api/";
const token = localStorage.getItem("token");

// ========== STATE ==========
let student = {};
let facultiesCache = [];
let departmentsCache = [];
let usersCache = [];
let resultsCache = [];
let setsCache = [];
let availableSchedulesCache = [];
let leaderboardCache = [];
let chatListCache = [];
let unreadMessages = [];
let nextTest = null;
let nextTestStart = null;
let chatPollingInterval = null;

// ========== HELPERS ==========
function showLoader(show) {
  const spinner = document.getElementById("preloaderSpinner");
  if (show) spinner && (spinner.style.opacity = "1", spinner.style.display = "flex");
  else if (spinner) { spinner.style.opacity = "0"; setTimeout(() => { spinner.style.display = "none"; }, 350);}
}

// =============================
// SIDEBAR & TAB LOGIC
// =============================
(function sidebarTabs() {
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const navLinks = document.querySelectorAll('.nav-link');
  const tabContents = document.querySelectorAll('.tab-content');
  const TAB_STORAGE_KEY = 'student_dashboard_active_tab';

  function setActiveTab(tabId) {
    navLinks.forEach(l => l.classList.remove('text-blue-200', 'bg-indigo-700', 'rounded-lg'));
    tabContents.forEach(content => content.classList.remove('active'));
    const link = Array.from(navLinks).find(l => l.getAttribute('data-tab') === tabId);
    if (link) link.classList.add('text-blue-200', 'bg-indigo-700', 'rounded-lg');
    if (document.getElementById(tabId)) document.getElementById(tabId).classList.add('active');
    localStorage.setItem(TAB_STORAGE_KEY, tabId);
    location.hash = tabId;
  }

  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    if (sidebar.classList.contains('open')) {
      sidebarOverlay.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    } else {
      sidebarOverlay.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    }
  });

  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.getAttribute('data-tab');
      setActiveTab(tabId);
      if (window.innerWidth < 768) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
    });
  });

  window.addEventListener('DOMContentLoaded', () => {
    let tabId = location.hash.replace('#', '') || localStorage.getItem(TAB_STORAGE_KEY) || 'dashboard';
    if (!document.getElementById(tabId)) tabId = 'dashboard';
    setActiveTab(tabId);
  });

  window.addEventListener('hashchange', () => {
    let tabId = location.hash.replace('#', '') || 'dashboard';
    if (document.getElementById(tabId)) setActiveTab(tabId);
  });
})();

// =============================
// FETCH HELPERS (with auth)
// =============================
async function fetchWithAuth(url, options = {}) {
  options.headers = options.headers || {};
  if (token) options.headers['Authorization'] = 'Bearer ' + token;
  const resp = await fetch(url, options);
  if (resp.status === 401 || resp.status === 403) {
    localStorage.removeItem("token");
    location.href = "/login";
    throw new Error("Unauthorized");
  }
  return resp;
}

// =============================
// PROFILE / FACULTY / DEPARTMENT
// =============================
async function fetchFacultiesAndDepartments() {
  const [faculties, departments] = await Promise.all([
    fetchWithAuth(API_URL + "faculties").then(r => r.json()),
    fetchWithAuth(API_URL + "departments").then(r => r.json())
  ]);
  facultiesCache = faculties;
  departmentsCache = departments;
}

async function fetchAllUsers() {
  const resp = await fetchWithAuth(API_URL + "users");
  usersCache = await resp.json();
}

async function fetchProfile() {
  const resp = await fetchWithAuth(API_URL + "auth/me");
  const data = await resp.json();
  student = data.user;
  // Map faculty/department IDs
  const facultyObj = facultiesCache.find(f => f.name === student.faculty);
  const departmentObj = departmentsCache.find(d => d.name === student.department);
  student.facultyId = facultyObj ? facultyObj._id : "";
  student.departmentId = departmentObj ? departmentObj._id : "";
  renderProfileInfo();
}

function renderProfileInfo() {
  document.getElementById("studentName").innerText = student.username || "";
  document.getElementById("profileName").innerText = student.username || "";
  document.getElementById("studentId").innerText = student.studentId || "";
  document.getElementById("profileDept").innerText = student.department || "-";
  document.getElementById("studentLevel").innerText = student.level || "-";
  document.getElementById("profileEmail").innerText = student.email || "";
  document.getElementById("profilePhone").innerText = student.phone || "";
  document.getElementById("editName").value = student.username || "";
  document.getElementById("editEmail").value = student.email || "";
  document.getElementById("editPhone").value = student.phone || "";
}

// =============================
// ANNOUNCEMENTS
// =============================
async function fetchAnnouncements() {
  const resp = await fetchWithAuth(API_URL + "notifications");
  const notifs = await resp.json();
  let html = "";
  notifs.forEach(n => {
    html += `<div class="message-link cursor-pointer text-indigo-700" onclick="openAnnouncementModal('${n.title.replace(/'/g, "\\'")}', '${n.message.replace(/'/g, "\\'")}', '${n.createdAt}')">
      <strong>${n.title}:</strong> ${n.message.length>60?n.message.substring(0,57)+'...':n.message} <small class="text-gray-500">(${(new Date(n.createdAt)).toLocaleString()})</small>
    </div>`;
  });
  document.getElementById("announcementsPanel").innerHTML = html || "No new announcements.";
}
window.openAnnouncementModal = function(title, msg, date) {
  let html = `
    <div class="modal-overlay open fixed inset-0 bg-black bg-opacity-50 z-50" onclick="closeModal(event)">
      <div class="modal open bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto mt-20 p-6" onclick="event.stopPropagation()">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold text-indigo-900">${title}</h3>
          <button class="text-gray-500 hover:text-gray-700" aria-label="Close Modal" onclick="closeModal(event)">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <div>
          <small class="text-indigo-600">${(new Date(date)).toLocaleString()}</small>
        </div>
        <div class="mt-4">${msg}</div>
      </div>
    </div>`;
  document.getElementById("modalRoot").innerHTML = html;
}
window.closeModal = function(e) {
  if (!e || e.target.classList.contains('modal-overlay') || e.target.classList.contains('close-modal')) {
    document.getElementById("modalRoot").innerHTML = "";
    if (chatPollingInterval) clearInterval(chatPollingInterval);
  }
}

// =============================
// LEADERBOARD
// =============================
async function fetchLeaderboard() {
  try {
    const resp = await fetchWithAuth(API_URL + "results/leaderboard/top");
    leaderboardCache = await resp.json();
    renderLeaderboard();
  } catch (e) {
    leaderboardCache = [];
    renderLeaderboard();
  }
}
function renderLeaderboard() {
  const lb = leaderboardCache.slice(0, 3);
  let html = `<div class="scoreboard-title">🏆 Top Scholars</div>
    <div class="scoreboard-list">
      ${
        lb.length > 0
        ? lb.map((stu, idx) => `
          <div class="scoreboard-item rank-${idx+1}">
            <div class="scoreboard-rank">#${idx+1}</div>
            <img src="${stu.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(stu.fullname||stu.username)}&background=3a86ff&color=fff&rounded=true`}" class="scoreboard-avatar" alt="Profile">
            <div class="scoreboard-name">${stu.fullname || stu.username}</div>
            <div class="scoreboard-score">${stu.totalScore} pts</div>
            <span class="scoreboard-badge badge-rank-${idx+1}">${['🥇','🥈','🥉'][idx]}</span>
          </div>
        `).join('')
        : `<div style="width:100%;text-align:center;color:#888;font-size:1.05em;padding:12px 0;">No leaderboard data yet.</div>`
      }
    </div>`;
  document.getElementById("leaderboardContainer").innerHTML = html;
}

// =============================
// PROGRESS CIRCLES (Dashboard)
// =============================
function renderProgressCircles() {
  // We'll use last 4 unique subjects/tests
  const subjects = {};
  resultsCache.forEach(r => {
    if (r.examSet && r.examSet.title && r.score !== undefined && !subjects[r.examSet.title]) {
      subjects[r.examSet.title] = r.score;
    }
  });
  const subjectList = Object.entries(subjects).slice(0, 4);
  let html = subjectList.map(([subject, score]) => `
    <div class="text-center">
      <p class="font-medium text-gray-700">${subject}</p>
      <div class="w-20 h-20 mx-auto rounded-full progress-circle" style="--progress: ${score}%;" title="${score}%">
        <div class="flex items-center justify-center h-full text-sm font-bold text-gray-800">${score}%</div>
      </div>
    </div>
  `).join('');
  document.getElementById("progress-circles").innerHTML = html || "<div class='text-gray-400'>No data yet.</div>";
}

// =============================
// MOCK TESTS TAB
// =============================
function renderProgressList() {
  const list = document.getElementById("progressList");
  if (!resultsCache.length) {
    list.innerHTML = `<div class="text-gray-400 italic">No exams taken yet.</div>`;
    return;
  }
  const items = resultsCache
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 7)
    .map(r =>
      `<div class="py-1 border-b border-gray-200">
        <b>${r.examSet && r.examSet.title ? r.examSet.title : r.examSet}</b> —
        <span class="text-blue-600 font-bold">${r.score ?? '-'}</span>%
        <span class="text-gray-500 text-xs float-right">${(new Date(r.submittedAt)).toLocaleDateString()}</span>
      </div>`
    ).join('');
  list.innerHTML = items;
}

// =============================
// RECOMMENDATIONS
// =============================
function recommendTopics() {
  const list = document.getElementById("recommendations");
  if (!resultsCache.length) {
    list.innerHTML = `<li><span class="text-gray-400 italic">Take more assessments to receive tailored recommendations!</span></li>`;
    return;
  }
  let lowest = resultsCache.reduce((acc, cur) => {
    if (cur.score !== undefined && cur.score !== null) {
      if (!acc[cur.examSet.title]) acc[cur.examSet.title] = [];
      acc[cur.examSet.title].push(cur.score);
    }
    return acc;
  }, {});
  let avgScores = Object.entries(lowest).map(([set, scores]) => ({
    set, avg: scores.reduce((a,b)=>a+b,0)/scores.length
  })).sort((a,b)=>a.avg-b.avg);
  let html = "";
  if (avgScores.length > 0) {
    avgScores.slice(0,2).forEach(s => {
      html += `<li>
        <span>Focus on <b>${s.set}</b> (avg: ${Math.round(s.avg)}%)</span>
        <span class="badge">Practice</span>
      </li>`;
    });
    avgScores.filter(s => s.avg >= 80).slice(0,1).forEach(s => {
      html += `<li>
        <span>Great job on <b>${s.set}</b>!</span>
        <span class="badge badge-excellent">Excellent</span>
      </li>`;
    });
  }
  if (!html) html = `<li><span class="text-gray-400 italic">No recommendations. Stellar performance!</span></li>`;
  list.innerHTML = html;
}

// =============================
// HISTORY (EXAMS) TABLE & PAGINATION
// =============================
const HISTORY_PAGE_SIZE = 5;
let historyPage = 1;
function buildPagination(total, page, pageSize, onPageChangeFnName, targetDivId) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) {
    document.getElementById(targetDivId).innerHTML = '';
    return;
  }
  let html = '';
  html += `<button onclick="${onPageChangeFnName}(1)" ${page === 1 ? 'disabled' : ''}>First</button>`;
  html += `<button onclick="${onPageChangeFnName}(${page - 1})" ${page === 1 ? 'disabled' : ''}>&lt;</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(page - i) <= 2) {
      html += `<button onclick="${onPageChangeFnName}(${i})" ${page === i ? 'class="active"' : ''}>${i}</button>`;
    } else if (i === page - 3 || i === page + 3) {
      html += '<span style="margin:0 5px;">...</span>';
    }
  }
  html += `<button onclick="${onPageChangeFnName}(${page + 1})" ${page === totalPages ? 'disabled' : ''}>&gt;</button>`;
  html += `<button onclick="${onPageChangeFnName}(${totalPages})" ${page === totalPages ? 'disabled' : ''}>Last</button>`;
  document.getElementById(targetDivId).innerHTML = html;
}

function renderHistoryTablePage(page) {
  if (!Array.isArray(resultsCache)) return;
  historyPage = page;
  const tbody = document.querySelector("#historyTable tbody");
  const start = (page - 1) * HISTORY_PAGE_SIZE;
  const end = start + HISTORY_PAGE_SIZE;

  let html = "";
  resultsCache.slice(start, end).forEach(r => {
    const examTitle =
      r.examSet && typeof r.examSet === "object"
        ? (r.examSet.title || "")
        : "";
    html += `<tr>
      <td>${examTitle}</td>
      <td>${(new Date(r.submittedAt)).toLocaleString()}</td>
      <td>${r.score ?? "-"}</td>
      <td><button class="btn" onclick="openReviewTab('${r._id}')">Review</button></td>
    </tr>`;
  });
  tbody.innerHTML = html || "<tr><td colspan=4>No history</td></tr>";

  buildPagination(resultsCache.length, page, HISTORY_PAGE_SIZE, 'renderHistoryTablePage', 'historyPagination');
}
window.openReviewTab = function(sessionId) {
  window.open('review.html?session=' + encodeURIComponent(sessionId), '_blank');
}

// =============================
// AVAILABLE MOCK/EXAM TABLES
// =============================
const AVAILABLE_PAGE_SIZE = 5;
let availablePage = 1;
function renderAvailableTablePage(page) {
  availablePage = page;
  const tbody = document.querySelector("#availableTable tbody");
  const start = (page - 1) * AVAILABLE_PAGE_SIZE;
  const end = start + AVAILABLE_PAGE_SIZE;
  let html = "";

  if (!Array.isArray(availableSchedulesCache) || availableSchedulesCache.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-gray-400">
      No available assessments at this time.</td></tr>`;
    buildPagination(0, 1, AVAILABLE_PAGE_SIZE, 'renderAvailableTablePage', 'availablePagination');
    return;
  }

  const now = Date.now();
  availableSchedulesCache.slice(start, end).forEach((sched) => {
    const set = sched.examSet;
    if (!set || set.status !== "ACTIVE") return;
    const taken = resultsCache.some((r) => r.examSet.title === set.title);
    const startDt = sched.start ? new Date(sched.start) : null;
    const endDt = sched.end ? new Date(sched.end) : null;
    const canTake =
      !taken &&
      set.status === "ACTIVE" &&
      startDt &&
      now >= startDt.getTime() &&
      (!endDt || now <= endDt.getTime());

    const isScheduled = startDt && now < startDt.getTime();

    let statusLabel = taken
      ? "Completed"
      : canTake
      ? "Available"
      : isScheduled
      ? "Scheduled"
      : "Closed";

    let btnHtml = canTake
      ? `<button class="btn" onclick="startTest('${set._id}')">Start</button>`
      : taken
      ? `<span class="text-gray-400">Completed</span>`
      : isScheduled
      ? `<span class="text-gray-400">Not Yet Open</span>`
      : `<span class="text-gray-400">Closed</span>`;

    html += `<tr>
      <td>${set.title}</td>
      <td>${set.description ? set.description : "-"}</td>
      <td>${startDt ? startDt.toLocaleString() : "-"}</td>
      <td>${endDt ? endDt.toLocaleString() : "-"}</td>
      <td>${statusLabel}</td>
      <td>${btnHtml}</td>
    </tr>`;
  });

  tbody.innerHTML = html || `<tr><td colspan="6" class="text-center text-gray-400">
    No available assessments at this time.</td></tr>`;

  buildPagination(availableSchedulesCache.length, page, AVAILABLE_PAGE_SIZE, 'renderAvailableTablePage', 'availablePagination');
}

// =============================
// EXAM AVAILABLE TABLE (copy for Exams tab)
function renderExamAvailableTablePage(page) {
  // For demo, use same availableSchedulesCache as mock, but you can split if needed
  const tbody = document.querySelector("#examAvailableTable tbody");
  const start = (page - 1) * AVAILABLE_PAGE_SIZE;
  const end = start + AVAILABLE_PAGE_SIZE;
  let html = "";

  if (!Array.isArray(availableSchedulesCache) || availableSchedulesCache.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-gray-400">
      No available assessments at this time.</td></tr>`;
    buildPagination(0, 1, AVAILABLE_PAGE_SIZE, 'renderExamAvailableTablePage', 'examAvailablePagination');
    return;
  }

  const now = Date.now();
  availableSchedulesCache.slice(start, end).forEach((sched) => {
    const set = sched.examSet;
    if (!set || set.status !== "ACTIVE") return;
    const taken = resultsCache.some((r) => r.examSet.title === set.title);
    const startDt = sched.start ? new Date(sched.start) : null;
    const endDt = sched.end ? new Date(sched.end) : null;
    const canTake =
      !taken &&
      set.status === "ACTIVE" &&
      startDt &&
      now >= startDt.getTime() &&
      (!endDt || now <= endDt.getTime());

    const isScheduled = startDt && now < startDt.getTime();

    let statusLabel = taken
      ? "Completed"
      : canTake
      ? "Available"
      : isScheduled
      ? "Scheduled"
      : "Closed";

    let btnHtml = canTake
      ? `<button class="btn" onclick="startTest('${set._id}')">Start</button>`
      : taken
      ? `<span class="text-gray-400">Completed</span>`
      : isScheduled
      ? `<span class="text-gray-400">Not Yet Open</span>`
      : `<span class="text-gray-400">Closed</span>`;

    html += `<tr>
      <td>${set.title}</td>
      <td>${set.description ? set.description : "-"}</td>
      <td>${startDt ? startDt.toLocaleString() : "-"}</td>
      <td>${endDt ? endDt.toLocaleString() : "-"}</td>
      <td>${statusLabel}</td>
      <td>${btnHtml}</td>
    </tr>`;
  });

  tbody.innerHTML = html || `<tr><td colspan="6" class="text-center text-gray-400">
    No available assessments at this time.</td></tr>`;

  buildPagination(availableSchedulesCache.length, page, AVAILABLE_PAGE_SIZE, 'renderExamAvailableTablePage', 'examAvailablePagination');
}

// ========== AVAILABLE TESTS FETCH ==========
async function fetchAvailableTests() {
  const spinner = document.getElementById("testSpinner");
  const tbody = document.querySelector("#availableTable tbody");
  spinner.style.display = "block";
  tbody.innerHTML = "";

  try {
    if (!student.faculty || !student.department) {
      spinner.style.display = "none";
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-gray-400">
        Please complete your profile to see available assessments.</td></tr>`;
      document.getElementById("upcomingTest").innerText = "None";
      document.getElementById("testCountdown").innerText = "";
      buildPagination(0, 1, AVAILABLE_PAGE_SIZE, 'renderAvailableTablePage', 'availablePagination');
      buildPagination(0, 1, AVAILABLE_PAGE_SIZE, 'renderExamAvailableTablePage', 'examAvailablePagination');
      return;
    }

    const resp = await fetchWithAuth(
      API_URL +
        `schedules?faculty=${student.facultyId}&department=${student.departmentId}`
    );
    const schedules = await resp.json();
    spinner.style.display = "none";

    // Remove Duplicate Schedules, use examSet._id or title
    const uniqueSchedules = [];
    const seenExamSetIds = new Set();
    for (const sched of schedules) {
      const set = sched.examSet;
      if (!set) continue;
      const key = set._id || set.title;
      if (!key || seenExamSetIds.has(key)) continue;
      seenExamSetIds.add(key);
      uniqueSchedules.push(sched);
    }
    availableSchedulesCache = uniqueSchedules;
    renderAvailableTablePage(1);
    renderExamAvailableTablePage(1);

    // Upcoming test logic
    let soonest = null;
    const now = Date.now();
    uniqueSchedules.forEach((sched) => {
      const set = sched.examSet;
      if (!set || set.status !== "ACTIVE") return;
      const taken = resultsCache.some((r) => r.examSet.title === set.title);
      const start = sched.start ? new Date(sched.start) : null;
      if (
        set.status === "ACTIVE" &&
        !taken &&
        start &&
        now < start.getTime() &&
        (!soonest || start.getTime() < new Date(soonest.start).getTime())
      ) {
        soonest = { ...sched, examSet: set };
      }
    });

    if (
      soonest &&
      soonest.start &&
      new Date(soonest.start).getTime() > now &&
      soonest.examSet
    ) {
      nextTest = soonest.examSet;
      nextTestStart = new Date(soonest.start).getTime();
      document.getElementById("upcomingTest").innerText = soonest.examSet.title;
      startCountdown();
    } else if (uniqueSchedules.length > 0) {
      const firstAvailable = uniqueSchedules.find(
        (sched) => sched.examSet && sched.examSet.status === "ACTIVE"
      );
      if (firstAvailable && firstAvailable.examSet)
        document.getElementById("upcomingTest").innerText =
          firstAvailable.examSet.title;
      else document.getElementById("upcomingTest").innerText = "None";
      document.getElementById("testCountdown").innerText = "";
    } else {
      document.getElementById("upcomingTest").innerText = "None";
      document.getElementById("testCountdown").innerText = "";
    }
  } catch (err) {
    spinner.style.display = "none";
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-red-500">
      Failed to load assessments.</td></tr>`;
    document.getElementById("upcomingTest").innerText = "None";
    document.getElementById("testCountdown").innerText = "";
    buildPagination(0, 1, AVAILABLE_PAGE_SIZE, 'renderAvailableTablePage', 'availablePagination');
    buildPagination(0, 1, AVAILABLE_PAGE_SIZE, 'renderExamAvailableTablePage', 'examAvailablePagination');
  }
}

// =============================
// HISTORY FETCH
// =============================
async function fetchHistory() {
  if (!student.id) return;
  const resp = await fetchWithAuth(API_URL + "results/user/" + student.id);
  const results = await resp.json();
  resultsCache = results;
  renderHistoryTablePage(1);
  renderProgressList();
  renderProgressCircles();
  recommendTopics();
}

// =============================
// CERTIFICATES
// =============================
window.downloadCertificate = async function() {
  // This assumes you have html2canvas loaded elsewhere, or can use a simple placeholder
  alert("Certificate download coming soon! (Integrate html2canvas and logic here)");
}
// Attach event
document.addEventListener('DOMContentLoaded', function() {
  const certBtn = document.getElementById("downloadCertBtn");
  if (certBtn) certBtn.onclick = window.downloadCertificate;
});

// =============================
// COUNTDOWN FOR UPCOMING TEST
// =============================
function startCountdown() {
  const countdownEl = document.getElementById("testCountdown");
  const testTitleEl = document.getElementById("upcomingTest");
  if (!nextTestStart || !countdownEl || !testTitleEl) return;

  function updateCountdown() {
    const now = Date.now();
    const diff = nextTestStart - now;
    if (diff <= 0) {
      countdownEl.innerText = "Test is now available!";
      testTitleEl.innerText = nextTest.title + " (Now Available)";
      clearInterval(timer);
      return;
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    let text = "";
    if (hours > 0) text += hours + "h ";
    if (hours > 0 || minutes > 0) text += minutes + "m ";
    text += seconds + "s";
    countdownEl.innerText = "Starts in " + text;
  }
  updateCountdown();
  const timer = setInterval(updateCountdown, 1000);
}

// =============================
// TEST START
// =============================
window.startTest = function(examSetId) {
  window.location.href = `test.html?examSet=${encodeURIComponent(examSetId)}`;
}

// =============================
// MESSAGES (Inbox & Send)
// =============================
async function fetchInbox() {
  // Example: Fetch last 10 messages for inbox
  const resp = await fetchWithAuth(API_URL + "messages/chats");
  chatListCache = await resp.json();
  let html = "";
  chatListCache.forEach(chat => {
    html += `<div class="border-b pb-2 cursor-pointer" onclick="openChatModal('${chat.otherUserId}')">
      <p class="font-medium text-gray-700">${chat.otherUserName}</p>
      <p class="text-gray-600 text-sm">${chat.lastMsgText ? chat.lastMsgText.substring(0, 60) : ""}</p>
      <p class="text-xs text-gray-500">${(new Date(chat.lastMsgAt)).toLocaleString()}</p>
    </div>`;
  });
  document.getElementById("inboxList").innerHTML = html || "<div class='text-gray-400'>No messages yet.</div>";

  // Populate recipient select
  const recipientSelect = document.getElementById("recipientSelect");
  recipientSelect.innerHTML = `<option>Select Recipient</option>` +
    chatListCache.map(chat =>
      `<option value="${chat.otherUserId}">${chat.otherUserName}</option>`
    ).join('');
}
window.openChatModal = function(otherUserId) {
  alert("Chat modal coming soon (integrate chat UI and fetch logic)");
}

// Send message
document.getElementById("sendMessageBtn").onclick = async function() {
  const recipient = document.getElementById("recipientSelect").value;
  const msg = document.getElementById("messageInput").value.trim();
  if (!recipient || !msg) return alert("Please select a recipient and enter a message.");
  await fetchWithAuth(API_URL + "messages/" + recipient, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: msg })
  });
  document.getElementById("messageInput").value = "";
  fetchInbox();
};
document.getElementById("cancelMessageBtn").onclick = function() {
  document.getElementById("messageInput").value = "";
  document.getElementById("recipientSelect").selectedIndex = 0;
}

// =============================
// PROFILE SETTINGS (EDIT & PASSWORD)
// =============================
document.getElementById("saveProfileBtn").onclick = async function() {
  const username = document.getElementById("editName").value.trim();
  const email = document.getElementById("editEmail").value.trim();
  const phone = document.getElementById("editPhone").value.trim();
  if (!username || !email) return alert("Name and email are required.");
  const payload = { username, email, phone };
  const resp = await fetchWithAuth(API_URL + "superadmin/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    const data = await resp.json();
    alert(data.message || "Failed to update profile.");
    return;
  }
  alert("Profile updated.");
  fetchProfile();
};

document.getElementById("updatePasswordBtn").onclick = async function() {
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmNewPassword = document.getElementById("confirmNewPassword").value;
  if (!currentPassword || !newPassword || !confirmNewPassword) return alert("All fields are required.");
  if (newPassword !== confirmNewPassword) return alert("Passwords do not match.");
  // Assume endpoint is /auth/change-password
  const resp = await fetchWithAuth(API_URL + "auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  if (!resp.ok) {
    const data = await resp.json();
    alert(data.message || "Failed to update password.");
    return;
  }
  alert("Password updated.");
  document.getElementById("currentPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmNewPassword").value = "";
};

// =============================
// LOGOUT
// =============================
document.getElementById("confirm-logout").onclick = function() {
  localStorage.clear();
  window.location.href = "/mock-icthallb"; // Adjust to your login page
};

// =============================
// INIT (App Entrypoint)
// =============================
async function initDashboard() {
  try {
    showLoader(true);
    if (!token) return location.href = "/login";
    await fetchFacultiesAndDepartments();
    await fetchAllUsers();
    await fetchProfile();
    await fetchHistory();
    await fetchAnnouncements();
    await fetchLeaderboard();
    await fetchAvailableTests();
    await fetchInbox();
    showLoader(false);
  } catch (e) {
    showLoader(false);
    alert("Error loading dashboard. " + (e && e.message ? e.message : ""));
  }
}
document.addEventListener("DOMContentLoaded", initDashboard);
