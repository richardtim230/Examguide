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

// ==== Profile Name/ID Lookup Helpers ====
function getDepartmentName(department) {
  if (!department) return '';
  if (typeof department === 'object' && department.name) return department.name;
  if (typeof department === 'string') {
    const found = departmentsCache.find(d => d._id === department);
    return found ? found.name : department;
  }
  return '';
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

// ========== PROFILE PIC & GREETING HELPERS ==========
function getProfilePicUrl(student) {
  if (student.profilePic) return student.profilePic;
  const name = encodeURIComponent(student.fullname || student.username || "Student");
  return `https://ui-avatars.com/api/?name=${name}&background=ede9fe&color=3b82f6&size=128&rounded=true`;
}
function getGreetingData() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { text: "Good morning", icon: "🌅", label: "Morning" };
  } else if (hour >= 12 && hour < 17) {
    return { text: "Good afternoon", icon: "🌞", label: "Afternoon" };
  } else if (hour >= 17 && hour < 20) {
    return { text: "Good evening", icon: "🌇", label: "Evening" };
  } else {
    return { text: "Good night", icon: "🌙", label: "Night" };
  }
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
    window.location.href = "/mock-icthallb";
    throw new Error("Session expired.");
  }
  return resp;
}
// ========== Motivational Quotes Data ==========
const MOTIVATIONAL_QUOTES = [
  { 
    text: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela"
  },
  { 
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt"
  },
  { 
    text: "Strive for progress, not perfection.",
    author: "Unknown"
  },
  { 
    text: "The expert in anything was once a beginner.",
    author: "Helen Hayes"
  },
  { 
    text: "Success is not the key to happiness. Happiness is the key to success.",
    author: "Albert Schweitzer"
  },
  { 
    text: "Do not wait to strike till the iron is hot; but make it hot by striking.",
    author: "William Butler Yeats"
  },
  { 
    text: "Opportunities don't happen. You create them.",
    author: "Chris Grosser"
  },
  { 
    text: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King"
  },
  { 
    text: "The only limit to our realization of tomorrow will be our doubts of today.",
    author: "Franklin D. Roosevelt"
  },
  { 
    text: "Learning never exhausts the mind.",
    author: "Leonardo da Vinci"
  }
  // ...add more quotes as desired
];

// ========== Greeting Name Helper ==========
function getFirstName(fullname, username) {
  if (!fullname && !username) return "";
  const name = fullname || username;
  return name.trim().split(/\s+/)[0]; // return only the first name part
}

// ========== Motivational Quote Rotation & Animation ==========
function showRandomQuote(prevIdx = -1) {
  let idx;
  do {
    idx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  } while (MOTIVATIONAL_QUOTES.length > 1 && idx === prevIdx);

  const quote = MOTIVATIONAL_QUOTES[idx];
  const qEl = document.getElementById("motivationalQuote");
  const aEl = document.getElementById("quoteAuthor");
  if (!qEl || !aEl) return;

  // Animate out
  qEl.classList.remove("zoom-in");
  aEl.classList.remove("zoom-in");
  qEl.classList.add("zoom-out");
  aEl.classList.add("zoom-out");

  setTimeout(() => {
    qEl.textContent = `“${quote.text}”`;
    aEl.textContent = `— ${quote.author}`;
    qEl.classList.remove("zoom-out");
    aEl.classList.remove("zoom-out");
    qEl.classList.add("zoom-in");
    aEl.classList.add("zoom-in");
  }, 500); // must match zoom-out animation duration

  // Schedule the next quote
  clearTimeout(window._quoteTimer);
  window._quoteTimer = setTimeout(() => showRandomQuote(idx), 6000);
}

function startQuoteRotation() {
  showRandomQuote();
}

// ========== Profile Pic & Greeting Helpers ==========
function getProfilePicUrl(student) {
  if (student.profilePic) return student.profilePic;
  const name = encodeURIComponent(student.fullname || student.username || "Student");
  return `https://ui-avatars.com/api/?name=${name}&background=ede9fe&color=3b82f6&size=128&rounded=true`;
}
function getGreetingData() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { text: "Good morning", icon: "🌅", label: "Morning" };
  } else if (hour >= 12 && hour < 17) {
    return { text: "Good afternoon", icon: "🌞", label: "Afternoon" };
  } else if (hour >= 17 && hour < 20) {
    return { text: "Good evening", icon: "🌇", label: "Evening" };
  } else {
    return { text: "Good night", icon: "🌙", label: "Night" };
  }
}

// =================== PROFILE ===================
async function fetchProfile() {
  const resp = await fetchWithAuth(API_URL + "auth/me");
  const data = await resp.json();
  student = data.user;
  student.id = student._id || student.id;

  // ---- Profile Pic & Greeting (UPDATED) ----
  const profilePic = getProfilePicUrl(student);
  if (document.getElementById("studentProfilePic")) {
    document.getElementById("studentProfilePic").src = profilePic;
    document.getElementById("studentProfilePic").alt = (student.fullname || student.username || "Profile");
  }
  const greeting = getGreetingData();
  // Use first name only
  const firstName = getFirstName(student.fullname, student.username);
  if (document.getElementById("greetingHeader")) {
    document.getElementById("greetingHeader").innerHTML = `${greeting.text}, <span id="studentName">${firstName}</span>!`;
  }
  if (document.getElementById("greetingTimeIcon")) {
    document.getElementById("greetingTimeIcon").innerHTML = `<span title="${greeting.label}">${greeting.icon}</span>`;
  }
  // Start quote rotation
  startQuoteRotation();

  // ...rest of your profile logic unchanged...
  document.getElementById("profileName").innerText = student.fullname || student.username || '';
  document.getElementById("studentId").innerText = student.studentId || '';
  document.getElementById("profileDept").innerText = getDepartmentName(student.department);
  document.getElementById("studentLevel").innerText = student.level || '';
  document.getElementById("profileEmail").innerText = student.email || '';
  document.getElementById("profilePhone").innerText = student.phone || '';
  if (document.getElementById("profileFaculty"))
    document.getElementById("profileFaculty").innerText = getFacultyName(student.faculty);

  document.getElementById("editName").value = student.fullname || '';
  document.getElementById("editEmail").value = student.email || '';
  document.getElementById("editPhone").value = student.phone || '';
  document.getElementById("editStudentId").value = student.studentId || '';
  document.getElementById("editLevel").value = student.level || '';
  document.getElementById("editFaculty").value = student.faculty?._id || student.faculty || '';
  const event = new Event('change');
  document.getElementById("editFaculty").dispatchEvent(event);

  let deptId = '';
  if (student.department?._id) deptId = student.department._id;
  else if (typeof student.department === 'string') deptId = student.department;
  if (!deptId && student.department?.name) {
    const found = departmentsCache.find(d => d.name === student.department.name);
    if (found) deptId = found._id;
  }
  document.getElementById("editDepartment").value = deptId;

  // Optionally, live update the greeting every minute
  if (!window._greetingUpdater) {
    window._greetingUpdater = setInterval(() => {
      const updatedGreeting = getGreetingData();
      const updatedFirstName = getFirstName(student.fullname, student.username);
      if (document.getElementById("greetingHeader")) {
        document.getElementById("greetingHeader").innerHTML = `${updatedGreeting.text}, <span id="studentName">${updatedFirstName}</span>!`;
      }
      if (document.getElementById("greetingTimeIcon")) {
        document.getElementById("greetingTimeIcon").innerHTML = `<span title="${updatedGreeting.label}">${updatedGreeting.icon}</span>`;
      }
    }, 60000);
  }
}
// =================== PROFILE ===================

// Populate faculty and department selects (for profile editing)
async function fetchFacultiesAndDepartments() {
  const [faculties, departments] = await Promise.all([
    fetchWithAuth(API_URL + "faculties").then(r => r.json()),
    fetchWithAuth(API_URL + "departments").then(r => r.json())
  ]);
  facultiesCache = faculties;
  departmentsCache = departments;

  // Populate Faculty select
  const facultySelect = document.getElementById("editFaculty");
  if (facultySelect) {
    facultySelect.innerHTML = `<option value="">Select Faculty</option>` +
      faculties.map(f => `<option value="${f._id}">${f.name}</option>`).join('');
  }
}

// When faculty changes, update department options
if (document.getElementById("editFaculty")) {
  document.getElementById("editFaculty").addEventListener("change", function() {
    const selectedFaculty = this.value;
    const deptSelect = document.getElementById("editDepartment");
    if (!deptSelect) return;
    const filteredDepts = departmentsCache.filter(d => d.faculty === selectedFaculty || d.faculty?._id === selectedFaculty);
    deptSelect.innerHTML = `<option value="">Select Department</option>` +
      filteredDepts.map(d => `<option value="${d._id}">${d.name}</option>`).join('');
  });
}

// Load all users (not needed for profile tab, but kept for chat, etc.)
async function fetchAllUsers() {
  const resp = await fetchWithAuth(API_URL + "users");
  usersCache = await resp.json();
}




// =================== PROFILE EDIT SAVE ===================
document.getElementById("saveProfileBtn").onclick = async function() {
  const btn = this;
  document.getElementById("profileSaveText").style.display = "none";
  document.getElementById("profileSaveLoader").style.display = "inline-block";

  const fullname = document.getElementById("editName").value.trim();
  const email = document.getElementById("editEmail").value.trim();
  const phone = document.getElementById("editPhone").value.trim();
  const faculty = document.getElementById("editFaculty").value || "";
  const department = document.getElementById("editDepartment").value || "";
  const level = document.getElementById("editLevel").value || "";

  if (!fullname || !email) {
    alert("Full name and email are required.");
    document.getElementById("profileSaveText").style.display = "";
    document.getElementById("profileSaveLoader").style.display = "none";
    return;
  }

  // Use the correct API route for updating a student's own profile!
  const resp = await fetchWithAuth(API_URL + "users/" + student.id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullname, email, phone, faculty, department, level })
  });

  if (!resp.ok) {
    const data = await resp.json();
    alert(data.message || "Failed to update profile.");
    document.getElementById("profileSaveText").style.display = "";
    document.getElementById("profileSaveLoader").style.display = "none";
    return;
  }

  alert("Profile updated.");
  await fetchProfile();
  document.getElementById("profileSaveText").style.display = "";
  document.getElementById("profileSaveLoader").style.display = "none";
};

// =================== PASSWORD UPDATE WITH LOADER ===================
document.getElementById("updatePasswordBtn").onclick = async function() {
  const btn = this;
  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Updating...`;

  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmNewPassword = document.getElementById("confirmNewPassword").value;
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    alert("All fields are required.");
    btn.disabled = false;
    btn.innerHTML = "Update Password";
    return;
  }
  if (newPassword !== confirmNewPassword) {
    alert("Passwords do not match.");
    btn.disabled = false;
    btn.innerHTML = "Update Password";
    return;
  }
  const resp = await fetchWithAuth(API_URL + "auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  if (!resp.ok) {
    const data = await resp.json();
    alert(data.message || "Failed to update password.");
    btn.disabled = false;
    btn.innerHTML = "Update Password";
    return;
  }
  alert("Password updated.");
  document.getElementById("currentPassword").value = "";
  document.getElementById("newPassword").value = "";
  document.getElementById("confirmNewPassword").value = "";
  btn.disabled = false;
  btn.innerHTML = "Update Password";
};

// =================== DASHBOARD PROGRESS & LEADERBOARD ===================
// ---- Progress Tracker Show More Button
let progressShowAll = false;
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

  let shownData = progressShowAll ? data : data.slice(0, 6);

  let html = '';
  shownData.forEach(subject => {
    html += `
      <div class="text-center">
        <p class="font-medium text-gray-700">${subject.label}</p>
        <div class="w-20 h-20 mx-auto rounded-full progress-circle" style="--progress: ${subject.percent}%;" title="${subject.percent}%">
          <div class="flex items-center justify-center h-full text-sm font-bold text-gray-800">${subject.percent}%</div>
        </div>
      </div>
    `;
  });
  if (data.length > 6 && !progressShowAll) {
    html += `<div class="col-span-2 flex items-center justify-center mt-2">
      <button id="progressShowMoreBtn" class="px-3 py-1 bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 text-sm" style="margin-top:8px;">Show More</button>
    </div>`;
  } else if (data.length > 6 && progressShowAll) {
    html += `<div class="col-span-2 flex items-center justify-center mt-2">
      <button id="progressShowLessBtn" class="px-3 py-1 bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200 text-sm" style="margin-top:8px;">Show Less</button>
    </div>`;
  }
  document.getElementById("progress-circles").innerHTML = html || '<div class="text-gray-500 text-center col-span-2">No data yet.</div>';
  if (data.length > 6) {
    setTimeout(() => {
      const btnMore = document.getElementById("progressShowMoreBtn");
      const btnLess = document.getElementById("progressShowLessBtn");
      if (btnMore) btnMore.onclick = () => { progressShowAll = true; renderProgressCircles(); };
      if (btnLess) btnLess.onclick = () => { progressShowAll = false; renderProgressCircles(); };
    }, 100);
  }
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
            <img src="${stu.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(stu.fullname||stu.username)}&background=3a86ff&color=fff&rounded=true`}" class="scoreboard-avatar" alt="Avatar">
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

// =================== BROADCAST MESSAGES MODAL ===================
function formatBroadcastParagraphs(msg) {
  if (!msg) return '';
  let parts = msg
    .replace(/\r\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .split(/\n{2,}/)
    .map(para => para.trim())
    .filter(Boolean);

  return parts.map(para => `<p style="margin: 0 0 10px 0; white-space: pre-line;">${para.replace(/\n/g, "<br>")}</p>`).join('');
}

async function openBroadcastModal() {
  document.getElementById("broadcastModal").style.display = "flex";
  try {
    const resp = await fetchWithAuth(API_URL + "broadcasts");
    const broadcasts = await resp.json();
    let html = "";
    if (!Array.isArray(broadcasts) || broadcasts.length === 0) {
      html = `<div style="color:#888;text-align:center;">No broadcasts yet.</div>`;
    } else {
      html = broadcasts.map(b => `
        <div style="border-left:4px solid #3a86ff;padding-left:12px;margin-bottom:16px;">
          <div style="font-weight:bold;font-size:1.07em;">${b.title || ''}</div>
          <div style="margin:7px 0;">
            ${formatBroadcastParagraphs(b.message || '')}
            ${b.image ? `<img src="${b.image}" alt="Broadcast image" style="max-width:100%;border-radius:8px;margin:10px 0;">` : ''}
          </div>
          ${b.link ? `<a href="${b.link}" target="_blank" style="color:#3a86ff;text-decoration:underline;">${b.link}</a>` : ''}
          <div style="font-size:0.99em;color:#585;font-weight:500;margin-top:4px;">${formatDate(b.createdAt)}</div>
        </div>
      `).join('');
    }
    document.getElementById("broadcastList").innerHTML = html;
  } catch (e) {
    document.getElementById("broadcastList").innerHTML = "<div style='color:#f25f5c'>Failed to load broadcasts.</div>";
  }
}
function closeBroadcastModal() {
  document.getElementById("broadcastModal").style.display = "none";
  window.location.href = '#';
  setTimeout(() => {
    if (window.opener) {
      window.close();
    }
  }, 100);
}

// =================== SCHEDULED EXAM MODAL (Exam & Mock Test) ===================
async function openScheduledExamModal() {
  if (!Array.isArray(availableSchedulesCache) || availableSchedulesCache.length === 0) {
    document.getElementById("scheduledExamContent").innerHTML = `<div style="color:#888;">No scheduled exams right now.</div>`;
    document.getElementById("scheduledExamModal").style.display = "flex";
    return;
  }
  const now = Date.now();

  // Filter only schedules for student's department & faculty, type EXAM or active/inactive
  const relevantSchedules = availableSchedulesCache.filter(s => {
    if (!s.examSet) return false;
    let facultyOK = !student.facultyId || s.examSet.faculty === student.facultyId || s.faculty === student.facultyId;
    let deptOK = !student.departmentId || s.examSet.department === student.departmentId || s.department === student.departmentId;
    let isExam = (s.examSet.type && s.examSet.type.toUpperCase() === "EXAM") ||
      (!s.examSet.type && (s.examSet.status === "ACTIVE" || s.examSet.status === "INACTIVE"));
    let end = s.end ? new Date(s.end).getTime() : Infinity;
    return facultyOK && deptOK && isExam && end > now;
  });

  // Find the one with start time closest to now but not in the past (or the most recently started and still active)
  let chosen = null;
  let minStartDiff = Infinity;
  relevantSchedules.forEach(s => {
    let startT = s.start ? new Date(s.start).getTime() : 0;
    let endT = s.end ? new Date(s.end).getTime() : Infinity;
    if (endT > now) {
      let diff = Math.abs(startT - now);
      if ((startT <= now && now <= endT) || startT > now) {
        if (diff < minStartDiff) {
          minStartDiff = diff;
          chosen = s;
        }
      }
    }
  });
  // If none, fallback to any relevant schedule in the future
  if (!chosen && relevantSchedules.length > 0) {
    chosen = relevantSchedules.reduce((prev, curr) => {
      let prevStart = prev.start ? new Date(prev.start).getTime() : Infinity;
      let currStart = curr.start ? new Date(curr.start).getTime() : Infinity;
      return currStart < prevStart ? curr : prev;
    });
  }

  if (!chosen || !chosen.examSet) {
    document.getElementById("scheduledExamContent").innerHTML = `<div style="color:#888;">No scheduled exams at this time.</div>`;
    document.getElementById("scheduledExamModal").style.display = "flex";
    return;
  }
  const set = chosen.examSet;
  const taken = isScheduleCompleted(chosen, set);
  const startDt = chosen.start ? new Date(chosen.start) : null;
  const endDt = chosen.end ? new Date(chosen.end) : null;
  let canTake =
    !taken &&
    set.status === "ACTIVE" &&
    startDt &&
    now >= startDt.getTime() &&
    (!endDt || now <= endDt.getTime());

  let btnHtml = canTake
    ? `<button class="px-5 py-2 bg-green-600 text-white rounded-lg font-bold text-base shadow-md hover:bg-green-700 glow-button transition" style="margin:0.5em 0 0 0;" onclick="startTest('${set._id}')">Start</button>`
    : taken
    ? `<span style="color:#999;">Already Completed</span>`
    : startDt && now < startDt.getTime()
    ? `<span style="color:#999;">Not Yet Open</span>`
    : `<span style="color:#999;">Closed</span>`;

  document.getElementById("scheduledExamContent").innerHTML = `
    <div style="margin-bottom:14px;text-align:center;">
      <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(set.title)}&background=ede9fe&color=3b82f6&size=80&rounded=true" alt="Exam" style="width:80px;height:80px;border-radius:12px;margin-bottom:10px;">
      <div style="font-size:1.25em;font-weight:bold;color:#3b82f6;">${set.title}</div>
    </div>
    <div style="margin-bottom:7px;">
      <b>Start:</b> ${startDt ? startDt.toLocaleString() : '-'}
    </div>
    <div style="margin-bottom:7px;">
      <b>End:</b> ${endDt ? endDt.toLocaleString() : '-'}
    </div>
    <div style="margin:14px 0;">${btnHtml}</div>
  `;
  document.getElementById("scheduledExamModal").style.display = "flex";
}

function closeScheduledExamModal() {
  document.getElementById("scheduledExamModal").style.display = "none";
}

// =================== SCHEDULE COMPLETION UTILITY ===================
function isScheduleCompleted(sched, set) {
  // Completed: there is a result for this examSet and the submission is within this schedule's window
  return resultsCache.some(r => {
    if (!r.examSet) return false;
    const sameSet = (typeof r.examSet === 'object' ? r.examSet._id === set._id : r.examSet === set._id);
    if (!sameSet) return false;
    if (sched.start && sched.end && r.submittedAt) {
      const submitted = new Date(r.submittedAt).getTime();
      const schedStart = new Date(sched.start).getTime();
      const schedEnd = new Date(sched.end).getTime();
      return submitted >= schedStart && submitted <= schedEnd;
    }
    return true; // fallback
  });
}

// =================== MOCK TESTS (Available Assessments) ===================
const AVAILABLE_PAGE_SIZE = 5;
let availablePage = 1;

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

    const startDt = sched.start ? new Date(sched.start) : null;
    const endDt = sched.end ? new Date(sched.end) : null;

    const completed = isScheduleCompleted(sched, set);

    let canTake =
      !completed &&
      set.status === "ACTIVE" &&
      startDt && now >= startDt.getTime() &&
      (!endDt || now <= endDt.getTime());

    let isScheduled = startDt && now < startDt.getTime();
    let isClosed = endDt && now > endDt.getTime();

    let statusLabel =
      completed
        ? "Completed"
        : canTake
        ? "Available"
        : isScheduled
        ? "Scheduled"
        : isClosed
        ? "Closed"
        : "Unavailable";

    let btnHtml = canTake
      ? `<button class="px-4 py-1 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition glow-button" onclick="startTest('${set._id}')">Start</button>`
      : completed
      ? `<span style="color:#999;">Completed</span>`
      : isScheduled
      ? `<span style="color:#999;">Not Yet Open</span>`
      : isClosed
      ? `<span style="color:#999;">Closed</span>`
      : `<span style="color:#999;">Unavailable</span>`;

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

    const startDt = sched.start ? new Date(sched.start) : null;
    const endDt = sched.end ? new Date(sched.end) : null;

    const completed = isScheduleCompleted(sched, set);

    let canTake =
      !completed &&
      set.status === "ACTIVE" &&
      startDt && now >= startDt.getTime() &&
      (!endDt || now <= endDt.getTime());

    let isScheduled = startDt && now < startDt.getTime();
    let isClosed = endDt && now > endDt.getTime();

    let statusLabel =
      completed
        ? "Completed"
        : canTake
        ? "Available"
        : isScheduled
        ? "Scheduled"
        : isClosed
        ? "Closed"
        : "Unavailable";

    let btnHtml = canTake
      ? `<button class="px-4 py-1 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition glow-button" onclick="startTest('${set._id}')">Start</button>`
      : completed
      ? `<span style="color:#999;">Completed</span>`
      : isScheduled
      ? `<span style="color:#999;">Not Yet Open</span>`
      : isClosed
      ? `<span style="color:#999;">Closed</span>`
      : `<span style="color:#999;">Unavailable</span>`;

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

// ========== Pagination Builder ===========
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
async function fetchAvailableTests() {
  const spinner = document.getElementById("testSpinner");
  const tbody = document.querySelector("#availableTable tbody");
  spinner.style.display = "block";
  tbody.innerHTML = "";

  try {
    if (!student.faculty || !student.department || !student.level) {
      spinner.style.display = "none";
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#999;">
        Please complete your profile to see available assessments.</td></tr>`;
      document.getElementById("upcomingTest").innerText = "None";
      document.getElementById("testCountdown").innerText = "";
      buildPagination(0, 1, AVAILABLE_PAGE_SIZE, 'renderAvailableTablePage', 'availablePagination');
      buildPagination(0, 1, AVAILABLE_PAGE_SIZE, 'renderExamAvailableTablePage', 'examAvailablePagination');
      return;
    }

    // Use correct values for faculty/department/level
    const resp = await fetchWithAuth(
      API_URL + `schedules?faculty=${student.faculty}&department=${student.department}&level=${student.level}`
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
      const taken = isScheduleCompleted(sched, set);
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
// --- Chat Modal Global State
let currentChatUserId = null;
let currentChatUserName = null;

// Lightbox state
let lightboxImages = []; // Array of all image URLs in current chat
let lightboxIndex = 0;

// For prepending the backend URL to images
const FILE_BASE_URL = "https://examguide.onrender.com"; // change if your backend is different

window.openChatModal = async function(otherUserId) {
  const chat = chatListCache.find(c => c.otherUserId === otherUserId);
  currentChatUserId = otherUserId;
  currentChatUserName = chat ? chat.otherUserName : "User";
  document.getElementById("chatModalUser").innerText = "Chat with " + currentChatUserName;
  document.getElementById("chatModal").style.display = "flex";
  document.getElementById("chatInput").value = "";
  document.getElementById("chatImage").value = "";
  await loadChatMessages(otherUserId);
}

// Function to load chat messages for the selected user
async function loadChatMessages(userId) {
  const chatMessagesDiv = document.getElementById("chatMessages");
  chatMessagesDiv.innerHTML = "<div style='color:#888;text-align:center;'>Loading...</div>";
  try {
    const resp = await fetchWithAuth(API_URL + "messages/" + userId);
    const data = await resp.json();

    // Collect all image URLs for this chat (for lightbox swiping)
    lightboxImages = data.filter(msg => msg.file && msg.file.url)
      .map(msg => FILE_BASE_URL + msg.file.url);

    if (!Array.isArray(data) || data.length === 0) {
      chatMessagesDiv.innerHTML = "<div style='color:#888;text-align:center;'>No messages yet.</div>";
      return;
    }
    chatMessagesDiv.innerHTML = data.map(msg => {
      const isMe = msg.from && (msg.from._id === student.id || msg.from === student.id);
      let content = msg.text ? `<div>${msg.text.replace(/\n/g, "<br>")}</div>` : "";
      let img = (msg.file && msg.file.url)
        ? `<img src="${FILE_BASE_URL}${msg.file.url}" style="max-width:120px;max-height:120px;border-radius:7px;margin:5px 0;cursor:pointer;" alt="Attachment" onclick="openImageLightbox('${FILE_BASE_URL}${msg.file.url}')">`
        : "";
      return `
        <div style="margin-bottom:9px;display:flex;flex-direction:column;align-items:${isMe?'flex-end':'flex-start'};">
          <div style="background:${isMe?'#3b82f6':'#ede9fe'};color:${isMe?'#fff':'#333'};padding:7px 13px;border-radius:13px;max-width:88%;box-shadow:0 1px 3px #0001;">
            ${content}
            ${img}
          </div>
          <div style="font-size:0.7em;color:#888;margin-top:2px;">${formatDate(msg.createdAt)}</div>
        </div>
      `;
    }).join('');
    // Scroll to bottom
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
  } catch (e) {
    chatMessagesDiv.innerHTML = "<div style='color:#f25f5c'>Failed to load messages.</div>";
  }
}

// Chat send (attach to form submit)
document.getElementById("chatSendForm").onsubmit = async function(e) {
  e.preventDefault();
  if (!currentChatUserId) return;
  const text = document.getElementById("chatInput").value.trim();
  const imageInput = document.getElementById("chatImage");
  const file = imageInput.files && imageInput.files[0];

  try {
    if (file) {
      // Send image (and optional text) to /file endpoint
      let formData = new FormData();
      if (text) formData.append("text", text);
      formData.append("file", file);
      await fetchWithAuth(API_URL + "messages/" + currentChatUserId + "/file", {
        method: "POST",
        body: formData
      });
    } else if (text) {
      // Send text-only to base endpoint
      await fetchWithAuth(API_URL + "messages/" + currentChatUserId, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
    } else {
      return; // Don't send empty message
    }
    document.getElementById("chatInput").value = "";
    document.getElementById("chatImage").value = "";
    await loadChatMessages(currentChatUserId);
    fetchInbox();
  } catch (err) {
    alert("Failed to send message.");
  }
};

function closeChatModal() {
  document.getElementById("chatModal").style.display = "none";
  currentChatUserId = null;
  currentChatUserName = null;
}

// ---- Lightbox with Swiping ----
function openImageLightbox(url) {
  lightboxIndex = lightboxImages.indexOf(url);
  if (lightboxIndex === -1) lightboxIndex = 0;
  updateLightbox();
  const lb = document.getElementById("chatImageLightbox");
  lb.style.display = "flex";
}

function updateLightbox() {
  const lbImg = document.getElementById("lightboxImg");
  if (!lightboxImages.length) return;
  lbImg.src = lightboxImages[lightboxIndex];
  // Show/hide prev/next
  document.getElementById("lightboxPrev").style.display = lightboxIndex > 0 ? "block" : "none";
  document.getElementById("lightboxNext").style.display = lightboxIndex < lightboxImages.length - 1 ? "block" : "none";
}

document.getElementById("lightboxPrev").onclick = function(e) {
  e.stopPropagation();
  if (lightboxIndex > 0) {
    lightboxIndex--;
    updateLightbox();
  }
};
document.getElementById("lightboxNext").onclick = function(e) {
  e.stopPropagation();
  if (lightboxIndex < lightboxImages.length - 1) {
    lightboxIndex++;
    updateLightbox();
  }
};

document.getElementById("chatImageLightbox").onclick = function(e) {
  // Only close if user clicks outside the image or arrows
  if (e.target === this) {
    this.style.display = "none";
    document.getElementById("lightboxImg").src = "";
    lightboxImages = [];
    lightboxIndex = 0;
  }
};

// ---- Touch swipe gestures ----
let touchStartX = 0;
let touchEndX = 0;
const MIN_SWIPE = 40;

document.getElementById("chatImageLightbox").addEventListener("touchstart", function(e) {
  if (e.touches.length === 1) touchStartX = e.touches[0].clientX;
});
document.getElementById("chatImageLightbox").addEventListener("touchend", function(e) {
  if (e.changedTouches.length === 1) {
    touchEndX = e.changedTouches[0].clientX;
    let diff = touchEndX - touchStartX;
    if (Math.abs(diff) > MIN_SWIPE) {
      if (diff < 0 && lightboxIndex < lightboxImages.length - 1) {
        // Swipe left, next
        lightboxIndex++;
        updateLightbox();
      } else if (diff > 0 && lightboxIndex > 0) {
        // Swipe right, prev
        lightboxIndex--;
        updateLightbox();
      }
    }
  }
});

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


// ============ LOGOUT ===========
document.getElementById("confirm-logout").onclick = () => {
  localStorage.clear();
  window.location.href = '/mock-icthallb';
};

// ============ TEST START ===========
window.startTest = function(examSetId) {
  window.location.href = `test.html?examSet=${encodeURIComponent(examSetId)}`;
};

window.renderAvailableTablePage = renderAvailableTablePage;
window.renderHistoryTablePage = renderHistoryTablePage;
window.renderExamAvailableTablePage = renderExamAvailableTablePage;
window.openReviewTab = openReviewTab;
window.openBroadcastModal = openBroadcastModal;
window.closeBroadcastModal = closeBroadcastModal;
window.openScheduledExamModal = openScheduledExamModal;
window.closeScheduledExamModal = closeScheduledExamModal;

// ============ INIT ===========
async function initDashboard() {
  if (!token) return window.location.href = "/mock-icthallb";
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
