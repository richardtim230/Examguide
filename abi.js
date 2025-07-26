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
  // Show modal for Mock Tests or Exams tabs if not skipped
  if (tabId === 'mock-tests' && !sessionStorage.getItem('skipMockTestModal')) {
    showExamModal('mockTestModal');
  } else if (tabId === 'exams' && !sessionStorage.getItem('skipExamModal')) {
    showExamModal('examModal');
  }
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

// ================= MODAL HANDLING ===================
function showExamModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal || !availableSchedulesCache.length) return;

  const now = Date.now();
  // Find the most recent active or scheduled exam
  let recentExam = null;
  availableSchedulesCache.forEach(sched => {
    const set = sched.examSet;
    if (!set || !set.title || set.status !== "ACTIVE") return;
    const taken = resultsCache.some(r => r.examSet && r.examSet.title === set.title);
    const startDt = sched.start ? new Date(sched.start).getTime() : null;
    const endDt = sched.end ? new Date(sched.end).getTime() : null;
    if (taken || !startDt) return;
    if (!recentExam || startDt < new Date(recentExam.start).getTime()) {
      recentExam = sched;
    }
  });

  if (!recentExam) return;

  const set = recentExam.examSet;
  const startDt = recentExam.start ? new Date(recentExam.start) : null;
  const endDt = recentExam.end ? new Date(recentExam.end) : null;

  // Populate modal content
  document.getElementById(`${modalId}Title`).innerText = set.title || 'Untitled Exam';
  document.getElementById(`${modalId}Description`).innerText = set.description || 'No description available';
  document.getElementById(`${modalId}Start`).innerText = startDt ? startDt.toLocaleString() : '-';
  document.getElementById(`${modalId}End`).innerText = endDt ? endDt.toLocaleString() : '-';
  // Set exam-specific image or fallback
  const img = document.getElementById(`${modalId}Image`);
  img.src = set.imageUrl || 'https://images.unsplash.com/photo-1503676260728-1b7e0b0a62b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80';

  // Handle countdown or start button
  const countdownEl = document.getElementById(`${modalId}Countdown`);
  const startBtn = document.getElementById(`${modalId}StartBtn`);
  const canTake = startDt && now >= startDt.getTime() && (!endDt || now <= endDt.getTime());

  if (canTake) {
    countdownEl.innerText = 'Exam is now available!';
    startBtn.classList.remove('hidden');
    startBtn.onclick = () => startTest(set._id);
  } else if (startDt && now < startDt.getTime()) {
    countdownEl.innerText = '';
    startBtn.classList.add('hidden');
    startModalCountdown(startDt.getTime(), countdownEl, startBtn, set._id);
  } else {
    countdownEl.innerText = 'Exam is not currently available.';
    startBtn.classList.add('hidden');
  }

  // Show modal with animation
  modal.classList.remove('hidden');
  setTimeout(() => modal.querySelector('.modal-enter').classList.add('modal-enter-active'), 10);

  // Close modal
  document.getElementById(`close${modalId.charAt(0).toUpperCase() + modalId.slice(1)}`).onclick = () => {
    if (document.getElementById(`${modalId}DontShow`).checked) {
      sessionStorage.setItem(`skip${modalId.charAt(0).toUpperCase() + modalId.slice(1)}`, 'true');
    }
    modal.querySelector('.modal-enter').classList.remove('modal-enter-active');
    setTimeout(() => modal.classList.add('hidden'), 300);
  };
}

function startModalCountdown(startTime, countdownEl, startBtn, examId) {
  function updateCountdown() {
    const now = Date.now();
    const diff = startTime - now;
    if (diff <= 0) {
      countdownEl.innerText = 'Exam is now available!';
      startBtn.classList.remove('hidden');
      startBtn.onclick = () => startTest(examId);
      clearInterval(timer);
      return;
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    let text = 'Starts in ';
    if (hours > 0) text += `${hours}h `;
    if (hours > 0 || minutes > 0) text += `${minutes}m `;
    text += `${seconds}s`;
    countdownEl.innerText = text;
  }
  updateCountdown();
  const timer = setInterval(() => {
    updateCountdown();
    if (countdownEl.innerText === 'Exam is now available!') {
      clearInterval(timer);
    }
  }, 1000);
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
async function fetchWithAuth(url, options = {}) {
  options.headers = options.headers || {};
  if (token) options.headers['Authorization'] = 'Bearer ' + token;
  const resp = await fetch(url, options);
  if (resp.status === 401 || resp.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Session expired.");
  }
  return resp;
}

// =================== PROFILE ===================
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
  student.id = student._id || student.id;
  // Map faculty/department IDs
  const facultyObj = facultiesCache.find(f => f.name === student.faculty);
  const departmentObj = departmentsCache.find(d => d.name === student.department);
  student.facultyId = facultyObj ? facultyObj._id : "";
  student.departmentId = departmentObj ? departmentObj._id : "";
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
    const resp = await fetchWithAuth(API_URL + "results/leaderboard/top");
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
  const resp = await fetchWithAuth(API_URL + "notifications");
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
    if (!set || !set.title) return;
    const taken = resultsCache.some((r) => r.examSet && r.examSet.title === set.title);
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

// =================== EXAMS TAB (Available Assessments - Exams) ===================
function renderExamAvailableTablePage(page) {
  const tbody = document.querySelector("#examAvailableTable tbody");
  const start = (page - 1) * AVAILABLE_PAGE_SIZE;
  const end = start + AVAILABLE_PAGE_SIZE;
  let html = "";

  if (!Array.isArray(availableSchedulesCache) || availableSchedulesCache.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#999;">
      No available assessments at this time.</td></tr>`;
    buildPagination(0, 1, AVAILABLE_PAGE_SIZE, 'renderExamAvailableTablePage', 'examAvailablePagination');
    return;
  }

  const now = Date.now();
  availableSchedulesCache.slice(start, end).forEach((sched) => {
    const set = sched.examSet;
    if (!set || !set.title) return;
    const taken = resultsCache.some((r) => r.examSet && r.examSet.title === set.title);
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

  buildPagination(availableSchedulesCache.length, page, AVAILABLE_PAGE_SIZE, 'renderExamAvailableTablePage', 'examAvailablePagination');
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

// ============ RECOMMENDATIONS ===========
function recommendTopics() {
  const list = document.getElementById("recommendations");
  if (!resultsCache.length) {
    list.innerHTML = `<li><span class="text-gray-400 italic">Take more assessments to receive tailored recommendations!</span></li>`;
    return;
  }
  let lowest = resultsCache.reduce((acc, cur) => {
    if (cur.score !== undefined && cur.score !== null && cur.examSet && cur.examSet.title) {
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
        : "";
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

// ============ HISTORY FETCH ===========
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

// ============ AVAILABLE TESTS FETCH ===========
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
      buildPagination(0, 1, AVAILABLE_PAGE_SIZE, 'renderExamAvailableTablePage', 'examAvailablePagination');
      return;
    }

    const resp = await fetchWithAuth(
      API_URL + `schedules?faculty=${student.facultyId}&department=${student.departmentId}`
    );
    const schedules = await resp.json();
    spinner.style.display = "none";

    // Defensive: ensure schedules is an array
    if (!Array.isArray(schedules) || schedules.length === 0) {
      availableSchedulesCache = [];
      renderAvailableTablePage(1);
      renderExamAvailableTablePage(1);
      document.getElementById("upcomingTest").innerText = "None";
      document.getElementById("testCountdown").innerText = "";
      return;
    }

    // Remove Duplicates, ensure examSet exists
    const uniqueSchedules = [];
    const seenExamSetIds = new Set();
    for (const sched of schedules) {
      const set = sched.examSet;
      if (!set || !set.title) continue;
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
      const taken = resultsCache.some((r) => r.examSet && r.examSet.title === set.title);
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
    buildPagination(0, 1, AVAILABLE_PAGE_SIZE, 'renderExamAvailableTablePage', 'examAvailablePagination');
  }
}

// ============ REVIEW ===========
function openReviewTab(sessionId) {
  window.open('review.html?session=' + encodeURIComponent(sessionId), '_blank');
}

// ============ MESSAGES ===========
async function fetchInbox() {
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

// ============ PROFILE SETTINGS ==========
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

// ============ LOGOUT ===========
document.getElementById("confirm-logout").onclick = () => {
  localStorage.clear();
  window.location.href = '/login';
};

// ============ TEST START ===========
window.startTest = function(examSetId) {
  window.location.href = `test.html?examSet=${encodeURIComponent(examSetId)}`;
};

window.renderAvailableTablePage = renderAvailableTablePage;
window.renderHistoryTablePage = renderHistoryTablePage;
window.renderExamAvailableTablePage = renderExamAvailableTablePage;
window.openReviewTab = openReviewTab;

// ============ INIT ===========
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
  await fetchInbox();
  hidePreloaderSpinner();
}

window.addEventListener("DOMContentLoaded", initDashboard);
