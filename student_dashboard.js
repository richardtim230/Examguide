// =================== CONFIG ===================
const API_URL = "https://examguide.onrender.com/api/";
const token = localStorage.getItem("token");

// =================== GLOBAL STATE ===================
let student = {};
let facultiesCache = [];
let departmentsCache = [];
let usersCache = [];
let chatListCache = [];
let leaderboardCache = [];
let resultsCache = [];
let availableSchedulesCache = [];
let nextTest = null;
let nextTestStart = null;
let broadcastCache = [];
let chatPollingInterval = null;
let unreadMessages = [];
let currentSchedId = null;

// ============ UTILS ==============
function hidePreloaderSpinner() {
  const spinner = document.getElementById("preloaderSpinner");
  if (spinner) {
    spinner.style.opacity = "0";
    setTimeout(() => { spinner.style.display = "none"; }, 350);
  }
}

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  const el = document.getElementById(tabId);
  if (el) el.classList.add('active');
}

function setSidebarActive(tabId) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('text-blue-200', 'bg-indigo-700', 'rounded-lg');
    if (link.getAttribute('data-tab') === tabId) {
      link.classList.add('text-blue-200', 'bg-indigo-700', 'rounded-lg');
    }
  });
}

function formatDate(dt) {
  if (!dt) return '-';
  return new Date(dt).toLocaleString();
}

// ================= SIDEBAR & NAVIGATION ================
(function setupSidebar() {
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  if (menuToggle && sidebar && sidebarOverlay) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      sidebarOverlay.classList.toggle('hidden');
      document.body.classList.toggle('overflow-hidden');
    });
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    });
  }
  // Tab switching
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const tabId = link.getAttribute('data-tab');
      showTab(tabId);
      setSidebarActive(tabId);
      if (window.innerWidth < 768) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
      }
      localStorage.setItem('student_dashboard_active_tab', tabId);
      location.hash = tabId;
    });
  });
  // Restore last tab
  window.addEventListener('DOMContentLoaded', () => {
    let tabId = location.hash.replace('#', '') || localStorage.getItem('student_dashboard_active_tab') || 'dashboard';
    if (!document.getElementById(tabId)) tabId = 'dashboard';
    showTab(tabId);
    setSidebarActive(tabId);
  });
  window.addEventListener('hashchange', () => {
    let tabId = location.hash.replace('#', '') || 'dashboard';
    if (document.getElementById(tabId)) {
      showTab(tabId);
      setSidebarActive(tabId);
    }
  });
})();

// =================== FETCH HELPERS ===================
window.fetch = (function(origFetch) {
  return async function(resource, options = {}) {
    const tk = localStorage.getItem("token");
    if (tk && resource && typeof resource === "string" && resource.startsWith("http")) {
      options.headers = options.headers || {};
      if (!options.headers["Authorization"] && !options.headers["authorization"]) {
        options.headers["Authorization"] = "Bearer " + tk;
      }
    }
    const resp = await origFetch(resource, options);
    if (resp.status === 401 || resp.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Session expired.");
    }
    return resp;
  };
})(window.fetch);

// =================== PROFILE ===================
async function fetchFacultiesAndDepartments() {
  const [faculties, departments] = await Promise.all([
    fetch(API_URL + "faculties").then(r => r.json()),
    fetch(API_URL + "departments").then(r => r.json())
  ]);
  facultiesCache = faculties;
  departmentsCache = departments;
}
async function fetchAllUsers() {
  const resp = await fetch(API_URL + "users");
  usersCache = await resp.json();
}
async function fetchProfile() {
  const resp = await fetch(API_URL + "auth/me");
  const data = await resp.json();
  student = data.user;
  student.id = student._id || student.id;
  document.getElementById("studentName").innerText = student.username || '';
  document.getElementById("profileName").innerText = student.username || '';
  document.getElementById("studentId").innerText = student.studentId || '';
  document.getElementById("profileDept").innerText = student.department || '';
  document.getElementById("studentLevel").innerText = student.level || '';
  document.getElementById("profileEmail").innerText = student.email || '';
  document.getElementById("profilePhone").innerText = student.phone || '';
  // Profile settings tab
  document.getElementById("editName").value = student.username || '';
  document.getElementById("editEmail").value = student.email || '';
  document.getElementById("editPhone").value = student.phone || '';
}

// =================== DASHBOARD PROGRESS & LEADERBOARD ===================
function renderProgressCircles() {
  // Example: expects [{label: 'Math', percent: 80}, ...] from backend or computed from resultsCache
  let subjects = {};
  resultsCache.forEach(r => {
    let sub = (r.examSet && r.examSet.title) || r.examSet || "Unknown";
    if (!subjects[sub]) subjects[sub] = [];
    if (typeof r.score === "number") subjects[sub].push(r.score);
  });
  const data = Object.entries(subjects).map(([label, arr]) => ({
    label,
    percent: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
  }));
  let html = '';
  data.forEach(subject => {
    html += `
      <div class="text-center">
        <p class="font-medium text-gray-700">${subject.label}</p>
        <div class="w-20 h-20 mx-auto rounded-full progress-circle" style="--progress: ${subject.percent}%;" title="${subject.percent}%">
          <div class="flex items-center justify-center h-full text-sm font-bold text-gray-800">${subject.percent}%</div>
        </div>
      </div>
    `;
  });
  document.getElementById("progress-circles").innerHTML = html || '<div class="text-gray-500 text-center col-span-2">No data yet.</div>';
}

async function fetchLeaderboard() {
  try {
    const resp = await fetch(API_URL + "results/leaderboard/top");
    if (!resp.ok) throw new Error("Failed to fetch leaderboard");
    leaderboardCache = await resp.json();
  } catch (e) {
    leaderboardCache = [];
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

// =================== ANNOUNCEMENTS ===================
async function fetchAnnouncements() {
  const resp = await fetch(API_URL + "notifications");
  const notifs = await resp.json();
  let html = "";
  notifs.forEach(n => {
    html += `<div class="border-l-4 border-indigo-500 pl-4 mb-2">
        <p class="font-medium text-gray-700">${n.title}</p>
        <p class="text-gray-600 text-sm">${n.message} <span class="block text-xs text-gray-500">${formatDate(n.createdAt)}</span></p>
      </div>`;
  });
  document.getElementById("announcementsPanel").innerHTML = html || "No new announcements.";
}

// =================== MOCK TESTS (Available Assessments) ===================
const AVAILABLE_PAGE_SIZE = 5;
let availablePage = 1;

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

function renderAvailableTablePage(page) {
  availablePage = page;
  const tbody = document.querySelector("#availableTable tbody");
  const start = (page - 1) * AVAILABLE_PAGE_SIZE;
  const end = start + AVAILABLE_PAGE_SIZE;
  let html = "";

  if (!Array.isArray(availableSchedulesCache) || availableSchedulesCache.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#999;">
      No available assessments at this time.</td></tr>`;
    buildPagination(0, 1, AVAILABLE_PAGE_SIZE, 'renderAvailableTablePage', 'availablePagination');
    return;
  }

  const now = Date.now();
  availableSchedulesCache.slice(start, end).forEach((sched) => {
    const set = sched.examSet;
    if (!set || set.status !== "ACTIVE") return;
    const taken = resultsCache.some((r) => r.examSet === set.title);
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
      ? `<span style="color:var(--muted);">Completed</span>`
      : isScheduled
      ? `<span style="color:var(--muted);">Not Yet Open</span>`
      : `<span style="color:var(--muted);">Closed</span>`;

    html += `<tr>
      <td>${set.title}</td>
      <td>${set.description ? set.description : "-"}</td>
      <td>${startDt ? startDt.toLocaleString() : "-"}</td>
      <td>${endDt ? endDt.toLocaleString() : "-"}</td>
      <td>${statusLabel}</td>
      <td>${btnHtml}</td>
    </tr>`;
  });

  tbody.innerHTML = html || `<tr><td colspan="6" style="text-align:center;color:#999;">
    No available assessments at this time.</td></tr>`;

  buildPagination(availableSchedulesCache.length, page, AVAILABLE_PAGE_SIZE, 'renderAvailableTablePage', 'availablePagination');
}

async function fetchAvailableTests() {
  const spinner = document.getElementById("testSpinner");
  const tbody = document.querySelector("#availableTable tbody");
  spinner.style.display = "block";
  tbody.innerHTML = "";

  try {
    if (!student.faculty || !student.department) {
      spinner.style.display = "none";
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#999;">
        Please complete your profile to see available assessments.</td></tr>`;
      document.getElementById("upcomingTest").innerText = "None";
      document.getElementById("testCountdown").innerText = "";
      buildPagination(0, 1, AVAILABLE_PAGE_SIZE, 'renderAvailableTablePage', 'availablePagination');
      return;
    }
    const resp = await fetch(
      API_URL + `schedules?faculty=${student.facultyId}&department=${student.departmentId}`
    );
    const schedules = await resp.json();
    spinner.style.display = "none";
    // Remove Duplicates
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
    // Upcoming test
    let soonest = null;
    const now = Date.now();
    uniqueSchedules.forEach((sched) => {
      const set = sched.examSet;
      if (!set || set.status !== "ACTIVE") return;
      const taken = resultsCache.some((r) => r.examSet === set.title);
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
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#f25f5c;">
      Failed to load assessments.</td></tr>`;
    document.getElementById("upcomingTest").innerText = "None";
    document.getElementById("testCountdown").innerText = "";
    buildPagination(0, 1, AVAILABLE_PAGE_SIZE, 'renderAvailableTablePage', 'availablePagination');
  }
}

// ========== Upcoming Countdown ===========
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
    // Calculate time parts
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

// ============ PROGRESS LIST (Recent Scores) ===========
function renderProgressList() {
  const list = document.getElementById("progressList");
  if (!resultsCache.length) {
    list.innerHTML = `<div style="color:var(--muted);font-style:italic;">No exams taken yet.</div>`;
    return;
  }
  const items = resultsCache
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 7)
    .map(r =>
      `<div style="padding:6px 0;border-bottom:1px solid #e3e8ee;">
        <b>${r.examSet && r.examSet.title ? r.examSet.title : r.examSet}</b> —
        <span style="color:var(--primary);font-weight:700;">${r.score ?? '-'}</span>%
        <span style="color:#888;font-size:0.95em;float:right;">${(new Date(r.submittedAt)).toLocaleDateString()}</span>
      </div>`
    ).join('');
  list.innerHTML = items;
}

// ============ HISTORY (Exam Results) ===========
const HISTORY_PAGE_SIZE = 5;
let historyPage = 1;

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
        : ""; // fallback to empty string, never show ID
    html += `<tr>
      <td>${examTitle}</td>
      <td>${formatDate(r.submittedAt)}</td>
      <td>${r.score ?? "-"}</td>
      <td><button class="btn" onclick="openReviewTab('${r._id}')">Review</button></td>
    </tr>`;
  });
  tbody.innerHTML = html || "<tr><td colspan=4>No history</td></tr>";
  buildPagination(resultsCache.length, page, HISTORY_PAGE_SIZE, 'renderHistoryTablePage', 'historyPagination');
}

async function fetchHistory() {
  if (!student.id) return;
  const resp = await fetch(API_URL + "results/user/" + student.id);
  const results = await resp.json();
  resultsCache = results;
  renderHistoryTablePage(1);
  renderProgressList();
  renderProgressCircles();
}

// ============ REVIEW ===========
function openReviewTab(sessionId) {
  window.open('review.html?session=' + encodeURIComponent(sessionId), '_blank');
}

// ============ MESSAGES ===========
function renderInbox() {
  // Here you would fetch and render messages. Placeholder:
  document.getElementById("inboxList").innerHTML = `<div class="text-gray-500">No messages yet.</div>`;
  // TODO: Integrate backend messages
}
function setupMessageSend() {
  document.getElementById("sendMessageBtn").onclick = () => {
    // TODO: Implement send message
    alert("Message sending not yet implemented.");
  };
  document.getElementById("cancelMessageBtn").onclick = () => {
    document.getElementById("messageInput").value = "";
    document.getElementById("recipientSelect").selectedIndex = 0;
  };
}

// ============ PROFILE SETTINGS ==========
function setupProfileSave() {
  document.getElementById("saveProfileBtn").onclick = async () => {
    // TODO: Implement profile saving
    alert("Profile update not yet implemented.");
  };
  document.getElementById("updatePasswordBtn").onclick = async () => {
    // TODO: Implement password change
    alert("Password update not yet implemented.");
  };
}

// ============ LOGOUT ===========
// ... everything else above unchanged ...

// REMOVE this from the global scope:
// document.getElementById("confirm-logout").onclick = () => {...}

// INSTEAD, add inside initDashboard at the END:
async function initDashboard() {
  if (!token) return window.location.href = "/login";
  await fetchFacultiesAndDepartments();
  await fetchAllUsers();
  await fetchProfile();
  await fetchHistory();
  await fetchLeaderboard();
  renderLeaderboard();
  await fetchAnnouncements();
  await fetchAvailableTests();
  renderInbox();
  setupMessageSend();
  setupProfileSave();
  hidePreloaderSpinner();

  // Fix: Attach logout handler now that DOM is ready
  const logoutBtn = document.getElementById("confirm-logout");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.clear();
      window.location.href = '/login';
    };
  }
}
window.addEventListener("DOMContentLoaded", initDashboard);

window.renderAvailableTablePage = renderAvailableTablePage;
window.renderHistoryTablePage = renderHistoryTablePage;
window.openReviewTab = openReviewTab;
window.startTest = function(examSetId) {
  window.location.href = `test.html?examSet=${encodeURIComponent(examSetId)}`;
};
