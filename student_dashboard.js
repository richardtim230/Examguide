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
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt"
  },
  {
    text: "The mind is everything. What you think you become.",
    author: "Buddha"
  },
  {
    text: "The best way to predict the future is to create it.",
    author: "Peter Drucker"
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "If you want to achieve greatness, stop asking for permission.",
    author: "Unknown"
  },
  {
    text: "The journey of a thousand miles begins with a single step.",
    author: "Lao Tzu"
  },
  {
    text: "Success is walking from failure to failure with no loss of enthusiasm.",
    author: "Winston Churchill"
  },
  {
    text: "Your time is limited, don't waste it living someone else's life.",
    author: "Steve Jobs"
  },
  {
    text: "The harder you work for something, the greater you'll feel when you achieve it.",
    author: "Unknown"
  },
  {
    text: "Push yourself, because no one else is going to do it for you.",
    author: "Unknown"
  },
  {
    text: "Great things never come from comfort zones.",
    author: "Unknown"
  },
  {
    text: "Dream it. Wish it. Do it.",
    author: "Unknown"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill"
  },
  {
    text: "The only place where success comes before work is in the dictionary.",
    author: "Vidal Sassoon"
  },
  {
    text: "It always seems impossible until it's done.",
    author: "Nelson Mandela"
  },
  {
    text: "You are never too old to set another goal or to dream a new dream.",
    author: "C.S. Lewis"
  },
  {
    text: "The mind is not a vessel to be filled, but a fire to be kindled.",
    author: "Plutarch"
  },
  {
    text: "The best revenge is massive success.",
    author: "Frank Sinatra"
  },
  {
    text: "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    author: "Zig Ziglar"
  },
  {
    text: "The future depends on what you do today.",
    author: "Mahatma Gandhi"
  },
  {
    text: "The only way to learn mathematics is to do mathematics.",
    author: "Paul Halmos"
  },
  {
    text: "Develop a passion for learning. If you do, you will never cease to grow.",
    author: "Anthony J. D'Angelo"
  },
  {
    text: "The roots of education are bitter, but the fruit is sweet.",
    author: "Aristotle"
  },
  {
    text: "Education is not preparation for life; education is life itself.",
    author: "John Dewey"
  },
  {
    text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
    author: "Brian Herbert"
  },
  {
    text: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi"
  },
  {
    text: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin"
  },
  {
    text: "The beautiful thing about learning is that nobody can take it away from you.",
    author: "B.B. King"
  },
  {
    text: "To acquire knowledge, one must study; but to acquire wisdom, one must observe.",
    author: "Marilyn vos Savant"
  },
  {
    text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
    author: "Dr. Seuss"
  },
  {
    text: "Change is the end result of all true learning.",
    author: "Leo Buscaglia"
  },
  {
    text: "Learning is not attained by chance, it must be sought for with ardor and attended to with diligence.",
    author: "Abigail Adams"
  },
  {
    text: "The greatest enemy of knowledge is not ignorance, it is the illusion of knowledge.",
    author: "Stephen Hawking"
  },
  {
    text: "Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.",
    author: "Richard Feynman"
  },
  {
    text: "The only true wisdom is in knowing you know nothing.",
    author: "Socrates"
  },
  {
    text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.",
    author: "Benjamin Franklin"
  },
  {
    text: "The whole purpose of education is to turn mirrors into windows.",
    author: "Sydney J. Harris"
  },
  {
    text: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar"
  },
  {
    text: "The best way to learn is by doing. The only way to do is to be.",
    author: "Unknown"
  }
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
// --- Unlimited Random Bible Verse Rotator ---

const BIBLE_BOOKS = [
  {"name":"Genesis","chapters":50,"verses":[31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26]},
  {"name":"Exodus","chapters":40,"verses":[22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,30,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38]},
  {"name":"Leviticus","chapters":27,"verses":[17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34]},
  {"name":"Numbers","chapters":36,"verses":[54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13]},
  {"name":"Deuteronomy","chapters":34,"verses":[46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,69,28,20,30,52,29,12]},
  {"name":"Joshua","chapters":24,"verses":[18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33]},
  {"name":"Judges","chapters":21,"verses":[36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25]},
  {"name":"Ruth","chapters":4,"verses":[22,23,18,22]},
  {"name":"1 Samuel","chapters":31,"verses":[28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13]},
  {"name":"2 Samuel","chapters":24,"verses":[27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25]},
  {"name":"1 Kings","chapters":22,"verses":[53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53]},
  {"name":"2 Kings","chapters":25,"verses":[18,25,27,44,27,33,20,29,37,36,20,21,25,29,38,20,41,37,37,21,26,20,37,20,30]},
  {"name":"1 Chronicles","chapters":29,"verses":[54,55,24,43,26,81,40,40,44,14,47,41,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30]},
  {"name":"2 Chronicles","chapters":36,"verses":[17,18,17,22,14,42,22,18,31,19,23,16,23,14,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23]},
  {"name":"Ezra","chapters":10,"verses":[11,70,13,24,17,22,28,36,15,44]},
  {"name":"Nehemiah","chapters":13,"verses":[11,20,32,23,19,19,73,18,38,39,36,47,31]},
  {"name":"Esther","chapters":10,"verses":[22,23,15,17,14,14,10,17,32,3]},
  {"name":"Job","chapters":42,"verses":[22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17]},
  {"name":"Psalms","chapters":150,"verses":[6,12,8,8,12,10,17,9,20,18,7,9,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,14,10,8,12,15,21,10,20,14,9,6]},
  {"name":"Proverbs","chapters":31,"verses":[33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31]},
  {"name":"Ecclesiastes","chapters":12,"verses":[18,26,22,16,20,12,29,17,18,20,10,14]},
  {"name":"Song of Solomon","chapters":8,"verses":[17,17,11,16,16,13,13,14]},
  {"name":"Isaiah","chapters":66,"verses":[31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,15,19,13,29,24,33,9,20,24,17,12,25,13,28,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,11,12,19,12,25,24,23,28,28,12]},
  {"name":"Jeremiah","chapters":52,"verses":[19,37,25,31,31,30,34,22,25,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,32,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34]},
  {"name":"Lamentations","chapters":5,"verses":[22,22,66,22,22]},
  {"name":"Ezekiel","chapters":48,"verses":[28,10,27,17,11,14,27,18,11,22,25,28,23,23,8,63,24,32,14,44,37,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35]},
  {"name":"Daniel","chapters":12,"verses":[21,49,30,37,31,28,28,27,27,21,45,13]},
  {"name":"Hosea","chapters":14,"verses":[11,23,5,19,15,11,16,14,17,15,12,14,16,9]},
  {"name":"Joel","chapters":3,"verses":[20,32,21]},
  {"name":"Amos","chapters":9,"verses":[15,16,15,13,27,14,17,14,15]},
  {"name":"Obadiah","chapters":1,"verses":[21]},
  {"name":"Jonah","chapters":4,"verses":[17,10,10,11]},
  {"name":"Micah","chapters":7,"verses":[16,13,12,13,15,16,20]},
  {"name":"Nahum","chapters":3,"verses":[15,13,19]},
  {"name":"Habakkuk","chapters":3,"verses":[17,20,19]},
  {"name":"Zephaniah","chapters":3,"verses":[18,15,20]},
  {"name":"Haggai","chapters":2,"verses":[15,23]},
  {"name":"Zechariah","chapters":14,"verses":[21,13,10,14,11,15,14,23,17,12,17,14,9,21]},
  {"name":"Malachi","chapters":4,"verses":[14,17,18,6]},
  {"name":"Matthew","chapters":28,"verses":[25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20]},
  {"name":"Mark","chapters":16,"verses":[45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20]},
  {"name":"Luke","chapters":24,"verses":[80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53]},
  {"name":"John","chapters":21,"verses":[51,25,36,54,47,71,53,59,41,42,42,50,38,31,27,33,26,40,42,31,25]},
  {"name":"Acts","chapters":28,"verses":[26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,38,40,30,35,27,27,32,44,31]},
  {"name":"Romans","chapters":16,"verses":[32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27]},
  {"name":"1 Corinthians","chapters":16,"verses":[31,16,23,21,13,20,40,13,27,33,34,31,13,40,58,24]},
  {"name":"2 Corinthians","chapters":13,"verses":[24,17,18,18,21,18,16,24,15,18,33,21,14]},
  {"name":"Galatians","chapters":6,"verses":[24,21,29,31,26,18]},
  {"name":"Ephesians","chapters":6,"verses":[23,22,21,32,33,24]},
  {"name":"Philippians","chapters":4,"verses":[30,30,21,23]},
  {"name":"Colossians","chapters":4,"verses":[29,23,25,18]},
  {"name":"1 Thessalonians","chapters":5,"verses":[10,20,13,18,28]},
  {"name":"2 Thessalonians","chapters":3,"verses":[12,17,18]},
  {"name":"1 Timothy","chapters":6,"verses":[20,15,16,16,25,21]},
  {"name":"2 Timothy","chapters":4,"verses":[18,26,17,22]},
  {"name":"Titus","chapters":3,"verses":[16,15,15]},
  {"name":"Philemon","chapters":1,"verses":[25]},
  {"name":"Hebrews","chapters":13,"verses":[14,18,19,16,14,20,28,13,28,39,40,29,25]},
  {"name":"James","chapters":5,"verses":[27,26,18,17,20]},
  {"name":"1 Peter","chapters":5,"verses":[25,25,22,19,14]},
  {"name":"2 Peter","chapters":3,"verses":[21,22,18]},
  {"name":"1 John","chapters":5,"verses":[10,29,24,21,21]},
  {"name":"2 John","chapters":1,"verses":[13]},
  {"name":"3 John","chapters":1,"verses":[14]},
  {"name":"Jude","chapters":1,"verses":[25]},
  {"name":"Revelation","chapters":22,"verses":[20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21]}
];

const VERSE_API_URL = "https://bible-api.com/";

function getRandomBibleReference() {
  // Pick a random book
  const book = BIBLE_BOOKS[Math.floor(Math.random() * BIBLE_BOOKS.length)];
  // Random chapter
  const chapter = Math.floor(Math.random() * book.chapters) + 1;
  // Random verse (based on chapter's verse count)
  const verseCount = book.verses[chapter - 1];
  const verse = Math.floor(Math.random() * verseCount) + 1;
  return `${book.name} ${chapter}:${verse}`;
}

async function fetchRandomBibleVerse() {
  const ref = getRandomBibleReference();
  try {
    const resp = await fetch(`${VERSE_API_URL}${encodeURIComponent(ref)}`);
    const data = await resp.json();
    if (data && data.verses && data.verses.length > 0) {
      return {
        text: data.verses.map(v => v.text).join(" "),
        ref: data.reference
      };
    }
    return { text: "Unable to fetch verse.", ref: ref };
  } catch {
    return { text: "Unable to fetch verse.", ref: ref };
  }
}

let _verseTimer = null;

async function showRandomBibleVerse() {
  const verseBox = document.getElementById("verseBox");
  const verseTextEl = document.getElementById("verseText");
  const verseRefEl = document.getElementById("verseRef");
  if (!verseBox || !verseTextEl || !verseRefEl) return;

  verseBox.classList.remove("zoom-in");
  verseBox.classList.add("zoom-out");

  setTimeout(async () => {
    const verse = await fetchRandomBibleVerse();
    verseTextEl.textContent = `“${verse.text.trim()}”`;
    verseRefEl.textContent = `— ${verse.ref}`;
    verseBox.classList.remove("zoom-out");
    verseBox.classList.add("zoom-in");
  }, 1000);

  clearTimeout(_verseTimer);
  _verseTimer = setTimeout(showRandomBibleVerse, 25000);
}

function startVerseRotation() {
  showRandomBibleVerse();
}

// Start on dashboard load (add to init logic)
window.addEventListener("DOMContentLoaded", () => {
  startVerseRotation();
});

// --- Religion-aware Verse/Message Rotator ---

// Add the Quran fetcher
async function fetchRandomQuranVerse() {
    // Quran: 114 chapters (surahs)
    const surah = Math.floor(Math.random() * 114) + 1;
    // Fetch surah info to get ayah count
    const surahInfoResp = await fetch(`https://api.alquran.cloud/v1/surah/${surah}`);
    const surahInfo = await surahInfoResp.json();
    const ayahCount = surahInfo.data.numberOfAyahs;
    const ayah = Math.floor(Math.random() * ayahCount) + 1;
    // Fetch the verse (ayah)
    const resp = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/en.sahih`);
    const data = await resp.json();
    if (data && data.data) {
        return {
            text: data.data.text,
            ref: `Qur'an ${surahInfo.data.englishName} ${surah}:${ayah}`
        };
    }
    return { text: "Unable to fetch verse.", ref: "" };
}

async function showRandomReligiousMessage() {
    const verseBox = document.getElementById("verseBox");
    const verseTextEl = document.getElementById("verseText");
    const verseRefEl = document.getElementById("verseRef");
    if (!verseBox || !verseTextEl || !verseRefEl) return;

    // Get religion from profile (you should load student object first)
    const religion = student?.religion || localStorage.getItem('studentReligion') || "";

    // Animate out
    verseBox.classList.remove("zoom-in");
    verseBox.classList.add("zoom-out");

    setTimeout(async () => {
        let verse = { text: "", ref: "" };
        if (religion === "islam") {
            verse = await fetchRandomQuranVerse();
        } else if (religion === "christianity") {
            verse = await fetchRandomBibleVerse();
        } else {
            verse = { text: "“Education is the key to success.”", ref: "— Unknown" }; // fallback
        }
        verseTextEl.textContent = `“${verse.text.trim()}”`;
        verseRefEl.textContent = `— ${verse.ref}`;
        verseBox.classList.remove("zoom-out");
        verseBox.classList.add("zoom-in");
    }, 1000);

    clearTimeout(window._verseTimer);
    window._verseTimer = setTimeout(showRandomReligiousMessage, 25000);
}

function startReligiousVerseRotation() {
    showRandomReligiousMessage();
}

// Call this in your dashboard/profile init logic
window.addEventListener("DOMContentLoaded", () => {
    startReligiousVerseRotation();
});

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
document.getElementById("editReligion").value = student.religion || '';
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
const religion = document.getElementById("editReligion").value || "";
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
    body: JSON.stringify({ fullname, email, phone, faculty, department, level, religion })
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
function renderMessageContent(text, fileType = "", fileName = "file.html") {
  // --- Image and file preview logic ---
  let html = "";

  // Find all base64 images in the text
  const imgRegex = /data:image\/[a-zA-Z]+;base64,[^\s]+/g;
  let imgMatches = text.match(imgRegex);
  if (imgMatches) {
    imgMatches.forEach(base64Img => {
      html += `<img src="${base64Img}" 
        style="max-width:120px;max-height:120px;border-radius:7px;margin:5px 0;cursor:pointer;" 
        onclick="openImageLightbox('${base64Img.replace(/'/g, "\\'")}')">`;
      text = text.replace(base64Img, "");
    });
  }

  // Find other base64 files (e.g. pdf)
  const fileRegex = /data:(application|text)\/[a-zA-Z0-9\-.]+;base64,[^\s]+/g;
  let fileMatches = text.match(fileRegex);
  if (fileMatches) {
    fileMatches.forEach(base64File => {
      let extMatch = base64File.match(/^data:([a-zA-Z0-9\/\-.]+);base64,/);
      let ext = extMatch ? extMatch[1].split('/').pop() : 'file';
      html += `<a href="${base64File}" download="downloaded.${ext}" target="_blank" style="color:#3b82f6;text-decoration:underline;">Download ${ext.toUpperCase()} file</a>`;
      text = text.replace(base64File, "");
    });
  }

  // Improved: Always show code block if text starts with HTML document
  const isHtmlDoc = typeof text === "string" &&
    (text.trim().startsWith("<!DOCTYPE html") || text.trim().startsWith("<") || text.trim().startsWith("<html"));

  if (isHtmlDoc) {
    html += `<pre style="white-space:pre-wrap;word-break:break-all;background:#f8fafc;padding:7px 11px;border-radius:8px;color:#2d3748;"><code>${escapeHtml(text)}</code></pre>`;
    return html;
  }

  // If it's a file (base64 or url), offer as download (for HTML files)
  if (fileType === "text/html" && (typeof text === "string" && (text.startsWith("data:text/html;base64,") || text.startsWith("http")))) {
    html += `<a href="${text}" download="${fileName}" target="_blank" style="color:#3b82f6;text-decoration:underline;">Download HTML file</a>`;
    return html;
  }

  // --- Main message safe text rendering (always escape!) ---
  let safeText = escapeHtml(text.trim());
  if (safeText) html += `<div>${safeText.replace(/\n/g, "<br>")}</div>`;
  return html;
}

function escapeHtml(html) {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- Update loadChatMessages to pass file type ---
async function loadChatMessages(userId) {
  const chatMessagesDiv = document.getElementById("chatMessages");
  chatMessagesDiv.innerHTML = "<div style='color:#888;text-align:center;'>Loading...</div>";
  try {
    const resp = await fetchWithAuth(API_URL + "messages/" + userId);
    const data = await resp.json();
    lightboxImages = data.filter(msg => msg.file && msg.file.url)
      .map(msg => FILE_BASE_URL + msg.file.url);
    if (!Array.isArray(data) || data.length === 0) {
      chatMessagesDiv.innerHTML = "<div style='color:#888;text-align:center;'>No messages yet.</div>";
      return;
    }
    chatMessagesDiv.innerHTML = data.map(msg => {
      const isMe = msg.from && (msg.from._id === student.id || msg.from === student.id);
      let content = renderMessageContent(msg.text, msg.file?.type || "");
      let img = (msg.file && msg.file.url)
        ? `<img src="${FILE_BASE_URL}${msg.file.url}" ...>`
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
// --- Study Calendar Feature using FullCalendar ----

// Storage key for personal events
const CALENDAR_PERSONAL_EVENTS_KEY = "study_calendar_personal_events";

function loadPersonalEvents() {
  try {
    return JSON.parse(localStorage.getItem(CALENDAR_PERSONAL_EVENTS_KEY) || "[]");
  } catch {
    return [];
  }
}
function savePersonalEvents(events) {
  localStorage.setItem(CALENDAR_PERSONAL_EVENTS_KEY, JSON.stringify(events));
}

function getColorForEventType(type) {
  if (type === "exam") return "#ef4444";      // red
  if (type === "mock") return "#3b82f6";      // blue
  return "#22c55e";                           // green (personal)
}
function getEventTypeLabel(type) {
  if (type === "exam") return "Exam";
  if (type === "mock") return "Mock Test";
  return "Personal Study";
}

// Generate FullCalendar events from schedules and personal events
function buildCalendarEvents() {
  const events = [];
  // Add exams and mocks from availableSchedulesCache
  if (Array.isArray(availableSchedulesCache)) {
    for (const sched of availableSchedulesCache) {
      if (!sched.examSet) continue;
      const set = sched.examSet;
      const start = sched.start ? new Date(sched.start) : null;
      // Decide event type by set.type or fallback to status/title
      let type = "mock";
      if (set.type && set.type.toLowerCase() === "exam") type = "exam";
      else if (set.title && set.title.toLowerCase().includes("exam")) type = "exam";
      // If it's not active, don't show
      if (set.status !== "ACTIVE") continue;
      events.push({
        id: "sched_" + (sched._id || set._id),
        title: set.title,
        start: start ? start.toISOString() : null,
        end: sched.end ? new Date(sched.end).toISOString() : null,
        extendedProps: {
          type,
          description: set.description || "",
          status: set.status,
          isPersonal: false
        },
        color: getColorForEventType(type),
        allDay: !(sched.start && String(sched.start).includes("T"))
      });
    }
  }
  // Add personal study events
  for (const evt of loadPersonalEvents()) {
    events.push({
      ...evt,
      color: getColorForEventType("personal"),
      extendedProps: {
        ...(evt.extendedProps || {}),
        type: "personal",
        isPersonal: true
      }
    });
  }
  return events;
}

// Assignment submission logic: send to "Prof Richard Timothy" by username, fullname, email, role, or fallback to known ID
// Assignment submission logic: send to "Prof Richard Timothy" by username, fullname, email, role, or fallback to known ID

// Utility: build Week/Day dropdown (if needed)
function buildWeekDayDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  let html = '<option value="">Select Week & Day</option>';
  for (let w = 1; w <= 8; w++) {
    for (let d = 1; d <= 3; d++) {
      html += `<option value="week${w}-day${d}">Week ${w} (Day ${d})</option>`;
    }
  }
  select.innerHTML = html;
}

// Spinner utility
function showButtonSpinner(btn, loadingText = "Sending...") {
  btn.disabled = true;
  btn.innerHTML = `<span><i class="fas fa-spinner fa-spin"></i> ${loadingText}</span>`;
}
function hideButtonSpinner(btn, originalText = "Submit") {
  btn.disabled = false;
  btn.innerHTML = originalText;
}

// Robust Find user by name/email/role (case-insensitive, exact then partial then fallback)
function findUserByName(name) {
  if (!Array.isArray(usersCache)) return null;
  name = name.trim().toLowerCase();
  // Try exact match
  let user = usersCache.find(u =>
    (u.fullname && u.fullname.trim().toLowerCase() === name) ||
    (u.username && u.username.trim().toLowerCase() === name)
  );
  if (user) return user;
  // Try partial match
  user = usersCache.find(u =>
    (u.fullname && u.fullname.trim().toLowerCase().includes(name)) ||
    (u.username && u.username.trim().toLowerCase().includes(name))
  );
  if (user) return user;
  return null;
}
// Converts image file to resized JPG base64 string, <50KB
function imageFileToResizedJpgBase64(file, maxKb = 50, maxWidth = 800) {
  return new Promise((resolve, reject) => {
    // Only process image files
    if (!file.type.startsWith('image/')) {
      reject('Not an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        // Resize if needed
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round(height * maxWidth / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.7; // Start quality
        let base64 = '';
        let dataSizeKb = 0;

        // Try to get under maxKb
        function tryExport() {
          base64 = canvas.toDataURL('image/jpeg', quality);
          // Compute size in KB
          dataSizeKb = Math.round((base64.length * 3/4) / 1024);
          if (dataSizeKb > maxKb && quality > 0.2) {
            quality -= 0.1;
            tryExport();
          } else {
            resolve(base64);
          }
        }
        tryExport();
      };
      img.onerror = function() {
        reject('Error loading image');
      };
      img.src = e.target.result;
    };
    reader.onerror = function(e) {
      reject('Error reading file');
    };
    reader.readAsDataURL(file);
  });
}
// Convert file to base64 (returns a Promise)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      resolve(e.target.result); // base64 string (with data:... prefix)
    };
    reader.onerror = function(e) {
      reject(e);
    };
    reader.readAsDataURL(file);
  });
}

// Defensive: Ensure usersCache is always an array before using .find()
// You should have a fetchAllUsers that always sets usersCache as an array, e.g.:
async function fetchAllUsers() {
  const resp = await fetchWithAuth(API_URL + "users");
  const data = await resp.json();
  if (Array.isArray(data)) {
    usersCache = data;
  } else if (Array.isArray(data.users)) {
    usersCache = data.users;
  } else {
    usersCache = [];
  }
}

// Main assignment submit handler (with robust recipient fallback)
document.addEventListener("DOMContentLoaded", function() {
  if (document.getElementById("assignmentWeekDay")) {
    buildWeekDayDropdown("assignmentWeekDay");
  }
  const submitBtn = document.getElementById("submitAssignmentBtn");
  const fileInput = document.getElementById("assignmentFile");
  const errorDiv = document.getElementById("submissionError");
  const weekDaySelect = document.getElementById("assignmentWeekDay");
  const textInput = document.getElementById("assignmentText");

  submitBtn.onclick = async function() {
    errorDiv.textContent = "";
    errorDiv.classList.remove("text-green-600", "text-red-500");
    const weekDay = weekDaySelect.value;
    const files = fileInput.files;
    const textValue = textInput.value.trim();

    if (!weekDay) {
      errorDiv.textContent = "Please select a Week & Day.";
      errorDiv.classList.add("text-red-500");
      return;
    }
    if (!files || !files.length) {
      errorDiv.textContent = "Please upload a file.";
      errorDiv.classList.add("text-red-500");
      return;
    }
    if (!textValue) {
      errorDiv.textContent = "Please enter some assignment text.";
      errorDiv.classList.add("text-red-500");
      return;
    }
    showButtonSpinner(submitBtn, "Submitting...");

    try {
      // Ensure usersCache is loaded and is always an array
      if (!Array.isArray(usersCache) || !usersCache.length) await fetchAllUsers();

      // Try all recipient fallbacks in order
      let targetUser =
        findUserByName("Prof Richard Timothy") ||
        findUserByName("Prof Richard Timothy Ochuko") ||
        (Array.isArray(usersCache) && usersCache.find(u => u.email && u.email.trim().toLowerCase() === "richardochuko14@gmail.com")) ||
        (Array.isArray(usersCache) && usersCache.find(u => u.role === "admin" || u.role === "superadmin"));

      // Final fallback: hardcoded ID (from DB) for "Prof Richard Timothy"
      if (!targetUser) targetUser = { _id: "685274175e20a6a59413b309" };

      if (!targetUser || !targetUser._id) throw new Error("Recipient not found: Prof Richard Timothy");

      // Only first file for demo (can loop for more)
      const file = files[0];
      const base64str = await imageFileToResizedJpgBase64(file, 50, 800); // 50KB, max 800px wide
      // Compose message text
      const msgText =
        `Assignment Submission: ${weekDay.replace(/-/g, ', ').replace(/week(\d+)/, 'Week $1').replace(/day(\d+)/, 'Day $1')}\n` +
        `Assignment Text: ${textValue}\n` +
        `Filename: ${file.name}\n` +
        `Base64: ${base64str}`;

      // Send to the chosen user
      await fetchWithAuth(API_URL + "messages/" + targetUser._id, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msgText })
      });

      errorDiv.textContent = "Assignment submitted successfully!";
      errorDiv.classList.add("text-green-600");
      fileInput.value = "";
      weekDaySelect.selectedIndex = 0;
      textInput.value = "";
    } catch (e) {
      errorDiv.textContent = "Failed to submit assignment: " + (e.message || "Unknown error.");
      errorDiv.classList.add("text-red-500");
    } finally {
      hideButtonSpinner(submitBtn, "Submit");
    }
  };
});

// --- FullCalendar Initialization ---
let calendarObj = null;
function initStudyCalendarTab() {
  // Wait for the tab to be visible, then render
  setTimeout(() => {
    const calEl = document.getElementById("studyCalendar");
    if (!calEl) return;

    // Destroy previous instance if exists
    if (calendarObj) {
      calendarObj.destroy();
      calendarObj = null;
    }
    calendarObj = new FullCalendar.Calendar(calEl, {
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek'
  },
    
      events: buildCalendarEvents(),
      eventClick: function(info) {
        showCalendarEventDetails(info.event);
      },
      dateClick: function(info) {
        // Optionally, allow quick add on date click
      }
    });
    calendarObj.render();
  }, 120); // Let the tab become visible
}

// --- Modal handlers ---
document.getElementById("addPersonalEventBtn").onclick = function() {
  document.getElementById("calendarEventModal").style.display = "flex";
  document.getElementById("eventTitle").value = "";
  document.getElementById("eventDate").value = "";
  document.getElementById("eventTime").value = "";
  document.getElementById("eventDesc").value = "";
};
function closeCalendarEventModal() {
  document.getElementById("calendarEventModal").style.display = "none";
}
document.getElementById("calendarEventForm").onsubmit = function(e) {
  e.preventDefault();
  const title = document.getElementById("eventTitle").value.trim();
  const date = document.getElementById("eventDate").value;
  const time = document.getElementById("eventTime").value;
  const desc = document.getElementById("eventDesc").value.trim();
  if (!title || !date) return;

  // Store as an all-day or timed event
  const startStr = time ? `${date}T${time}` : date;
  const evt = {
    id: "personal_" + Date.now(),
    title,
    start: startStr,
    allDay: !time,
    extendedProps: {
      type: "personal",
      description: desc,
      isPersonal: true
    }
  };
  const events = loadPersonalEvents();
  events.push(evt);
  savePersonalEvents(events);
  closeCalendarEventModal();
  initStudyCalendarTab();
};

function showCalendarEventDetails(event) {
  const modal = document.getElementById("calendarEventDetailsModal");
  const content = document.getElementById("calendarEventDetailsContent");
  const props = event.extendedProps || {};
  let html = `<div class="mb-2">
    <span class="text-lg font-semibold">${event.title}</span>
    <span class="ml-2 px-2 py-1 rounded text-xs" style="background:${event.backgroundColor || event.color || '#eee'};color:#fff;">${getEventTypeLabel(props.type)}</span>
  </div>
  <div class="mb-2"><b>Date:</b> ${event.allDay ? (new Date(event.start).toLocaleDateString()) : (new Date(event.start).toLocaleString())}</div>
  ${props.description ? `<div class="mb-2"><b>Description:</b> ${props.description}</div>` : ""}
  `;
  // Option to delete personal events
  if (props.isPersonal) {
    html += `<button class="px-3 py-1 mt-2 bg-red-600 text-white rounded" onclick="deletePersonalCalendarEvent('${event.id}')">Delete</button>`;
  }
  content.innerHTML = html;
  modal.style.display = "flex";
}
function closeCalendarEventDetailsModal() {
  document.getElementById("calendarEventDetailsModal").style.display = "none";
}
window.closeCalendarEventModal = closeCalendarEventModal;
window.closeCalendarEventDetailsModal = closeCalendarEventDetailsModal;

window.deletePersonalCalendarEvent = function(eventId) {
  let events = loadPersonalEvents();
  events = events.filter(e => e.id !== eventId);
  savePersonalEvents(events);
  closeCalendarEventDetailsModal();
  initStudyCalendarTab();
};

// --- Re-render calendar when switching to the tab ---
document.querySelector('a[data-tab="study-resources"]').addEventListener("click", function() {
  setTimeout(initStudyCalendarTab, 250);
});
// Also, rerender on page load if study-resources is the active tab
window.addEventListener("DOMContentLoaded", function() {
  if (document.getElementById("study-resources")?.classList.contains("active")) {
    setTimeout(initStudyCalendarTab, 350);
  }
});

// When new data loaded (e.g., after fetchAvailableTests), rerender
function rerenderStudyCalendarIfVisible() {
  if (document.getElementById("study-resources")?.classList.contains("active")) {
    setTimeout(initStudyCalendarTab, 100);
  }
}

// Call rerenderStudyCalendarIfVisible after fetchAvailableTests
const origFetchAvailableTests = fetchAvailableTests;
fetchAvailableTests = async function() {
  await origFetchAvailableTests.apply(this, arguments);
  rerenderStudyCalendarIfVisible();
};
// ========== ExamGuard Chatbot Section JavaScript ==========

// To use: make sure you have student object with profile info in global scope (as in your dashboard code)
// Replace YOUR_GEMINI_API_KEY with your real Gemini API key!

// Minimal fallback for user info in case student isn't loaded yet
let egChatUser = { name: "Student" };
function waitForStudentData(cb) {
  if (typeof student !== "undefined" && student.fullname) {
    egChatUser = {
      name: student.fullname,
      email: student.email,
      id: student._id || student.id,
      department: student.department?.name || "",
      level: student.level || "",
      phone: student.phone || "",
      username: student.username || "",
    };
    cb();
  } else {
    setTimeout(() => waitForStudentData(cb), 350);
  }
}

// --- UI logic ---
const chatBtn = document.getElementById('eg-chat-btn');
const chatWindow = document.getElementById('eg-chat-window');
const closeBtn = document.getElementById('eg-close-btn');
chatBtn.onclick = () => chatWindow.classList.add('open');
closeBtn.onclick = () => chatWindow.classList.remove('open');
document.addEventListener('keydown', e => {
  if (e.key === "Escape") chatWindow.classList.remove('open');
});

// --- Messaging logic ---
const chatBody = document.getElementById('eg-chat-body');
const chatForm = document.getElementById('eg-chat-input-row');
const chatInput = document.getElementById('eg-chat-input');
const sendBtn = document.getElementById('eg-send-btn');
const imgBtn = document.getElementById('eg-image-btn');
const imgInput = document.getElementById('eg-image-input');
const imgPreview = document.getElementById('eg-image-preview');
let pendingImageData = null;

function userAvatar(name = "U") {
  return `<span class="eg-user-avatar">${name.slice(0,1).toUpperCase()}</span>`;
}
function botAvatar() {
  return `<img class="eg-bot-avatar" src="examguard-logo.png" alt="Bot">`;
}
function addMessage(content, from = "bot", isImg = false) {
  const row = document.createElement("div");
  row.className = `eg-bubble-row ${from}`;
  let bubbleHTML = from === "bot"
    ? botAvatar()
    : "";
  if (isImg) {
    bubbleHTML += `<div class="eg-bubble ${from}"><img src="${content}" class="eg-preview-img" alt="sent image"></div>`;
  } else {
    bubbleHTML += `<div class="eg-bubble ${from}">${content}</div>`;
  }
  bubbleHTML += from === "user" ? userAvatar(egChatUser.name) : "";
  row.innerHTML = bubbleHTML;
  chatBody.appendChild(row);
  chatBody.scrollTop = chatBody.scrollHeight;
}
function showTyping() {
  const row = document.createElement("div");
  row.className = "eg-bubble-row bot";
  row.id = "eg-typing-row";
  row.innerHTML = botAvatar() +
    `<div class="eg-bubble bot"><span class="eg-typing"><span></span><span></span><span></span></span></div>`;
  chatBody.appendChild(row);
  chatBody.scrollTop = chatBody.scrollHeight;
}
function hideTyping() {
  const typing = document.getElementById('eg-typing-row');
  if (typing) typing.remove();
}

// --- Image Handling ---
imgBtn.onclick = function(e) {
  e.preventDefault();
  imgInput.click();
};
imgInput.onchange = function() {
  const file = imgInput.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert("Please select an image file.");
    imgInput.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    pendingImageData = e.target.result;
    imgPreview.innerHTML = `<img src="${pendingImageData}" class="eg-preview-img" alt="preview"> <button type="button" id="eg-remove-img" title="Remove Image" style="color:red;background:none;border:none;font-size:1.1em;vertical-align:middle;"><i class="bi bi-x-circle"></i></button>`;
    imgPreview.style.display = "inline-block";
    document.getElementById("eg-remove-img").onclick = function() {
      imgPreview.style.display = "none";
      imgPreview.innerHTML = "";
      imgInput.value = "";
      pendingImageData = null;
    };
  };
  reader.readAsDataURL(file);
};

// --- Gemini API Integration (replace API_KEY placeholder) ---
async function geminiChatApi(messages, imageData = null) {
  const apiKey = "AIzaSyB6j5eYA2tEjA0u9NhR6hKkfx9UB5dpSm8"; // <<< INSERT YOUR KEY HERE
  let url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;
  let payload = {
    contents: [
      {
        parts: [
          {text: `The following is a conversation with a helpful, secure, ExamGuard Bot for OAU. The logged in user is ${egChatUser.name} (email: ${egChatUser.email}, department: ${egChatUser.department}, level: ${egChatUser.level}). Always address the user by their first name if possible. Only answer exam and study-related questions, and never provide answers to live or upcoming exams. If user sends an image, try to analyze or describe its content if possible. If not sure, ask the user for clarification.`}
        ]
      },
      ...messages
    ]
  };
  if (imageData) {
    payload.contents.push({
      parts: [
        {text: "User sent an image. Please analyze and reply as ExamGuard Bot."},
        {inline_data: {mime_type:"image/png", data: imageData.split(',')[1]}}
      ]
    });
  }
  const res = await fetch(url, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Gemini API error");
  const data = await res.json();
  let reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I didn't get that. Can you rephrase?";
  return reply;
}

// --- Chat conversation state ---
let conversation = [];
function addToConversation(userMsg, role = "user") {
  if (role === "user") {
    conversation.push({parts: [{text: userMsg}]});
  } else {
    conversation.push({parts: [{text: userMsg}], role: "model"});
  }
  // Keep last 10 messages only for context
  if (conversation.length > 10) conversation = conversation.slice(-10);
}

chatForm.onsubmit = async function(e) {
  e.preventDefault();
  const text = chatInput.value.trim();
  sendBtn.disabled = true;
  chatInput.disabled = true;
  imgBtn.disabled = true;
  if (!text && !pendingImageData) {
    sendBtn.disabled = false; chatInput.disabled = false; imgBtn.disabled = false;
    return;
  }

  // User message (text and/or image)
  if (pendingImageData) {
    addMessage(pendingImageData, "user", true);
    if (text) addMessage(text, "user");
  } else {
    addMessage(text, "user");
  }
  let userMsgObj = { parts: [] };
  if (text) userMsgObj.parts.push({text});
  if (pendingImageData) userMsgObj.parts.push({inline_data:{mime_type: "image/png", data: pendingImageData.split(',')[1]}});
  conversation.push(userMsgObj);

  chatInput.value = "";
  imgInput.value = "";
  imgPreview.style.display = "none";
  imgPreview.innerHTML = "";
  pendingImageData = null;

  showTyping();

  try {
    const reply = await geminiChatApi(conversation, pendingImageData);
    hideTyping();
    addToConversation(reply, "bot");
    addMessage(reply, "bot");
  } catch (err) {
    hideTyping();
    addMessage("Sorry, I couldn't reach the AI service. Please try again later.", "bot");
  }
  sendBtn.disabled = false;
  chatInput.disabled = false;
  imgBtn.disabled = false;
  chatInput.focus();
};

// Welcome message
waitForStudentData(function() {
  setTimeout(() => {
    addMessage(`👋 Hello, <b>${egChatUser.name.split(" ")[0]}</b>! I'm <b>ExamGuard Bot</b>, your secure test assistant. How can I help you today?`);
  }, 500);
});

chatBtn.addEventListener('click', () => {
  setTimeout(() => chatInput.focus(), 400);
});

// --- Blogger/Marketer Application Modal Logic ---

const BM_APP_KEY = "bm_application_status"; // Use localStorage for demo; use backend in production

window.openBmAppModal = function() {
  if (localStorage.getItem(BM_APP_KEY) === "submitted") {
    openBmReviewModal();
    return;
  }
  // Autofill with student data
  document.getElementById("bmFullName").value = student.fullname || "";
  document.getElementById("bmDepartment").value = getDepartmentName(student.department);
  document.getElementById("bmLevel").value = student.level || "";
  document.getElementById("bmPhone").value = student.phone || "";
  // Reset form
  document.getElementById("bmGender").value = "";
  document.getElementById("bmAge").value = "";
  document.getElementById("bmExpNum").value = "";
  document.getElementById("bmExpType").value = "days";
  document.getElementById("bmRole").value = "";
  document.getElementById("bmPhoto").value = "";
  document.getElementById("bmID").value = "";
  document.getElementById("bmAppModal").style.display = "flex";
};

window.closeBmAppModal = function() {
  document.getElementById("bmAppModal").style.display = "none";
};

window.openBmReviewModal = function() {
  document.getElementById("bmReviewModal").style.display = "flex";
};

window.closeBmReviewModal = function() {
  document.getElementById("bmReviewModal").style.display = "none";
};

// Prevent double submission
document.getElementById("bmAppForm").onsubmit = async function(e) {
  e.preventDefault();
  if (localStorage.getItem(BM_APP_KEY) === "submitted") {
    closeBmAppModal();
    openBmReviewModal();
    return;
  }
  // Collect and validate fields
  const fullName = document.getElementById("bmFullName").value.trim();
  const department = document.getElementById("bmDepartment").value.trim();
  const level = document.getElementById("bmLevel").value.trim();
  const phone = document.getElementById("bmPhone").value.trim();
  const gender = document.getElementById("bmGender").value;
  const age = document.getElementById("bmAge").value;
  const expNum = document.getElementById("bmExpNum").value;
  const expType = document.getElementById("bmExpType").value;
  const role = document.getElementById("bmRole").value;
  const photo = document.getElementById("bmPhoto").files[0];
  const idFile = document.getElementById("bmID").files[0];

  if(!fullName || !department || !level || !phone || !gender || !age || !expNum || !role || !photo || !idFile) {
    alert("Please fill all required fields and upload documents.");
    return;
  }
  // In production: Submit to backend API
  // For demo, just save status in localStorage
  localStorage.setItem(BM_APP_KEY, "submitted");
  closeBmAppModal();
  openBmReviewModal();
};

// Optionally: Attach to your "Get Started" button:
const bmCardBtn = document.querySelector('section:has(.fa-bullhorn) button, section:has(.fa-book) + section button, section:has(.fa-users) button, section:has(.fa-blog) button, section:has(.fa-bullhorn) button, section .fa-bullhorn + button'); // or use a more specific selector
const bmBtnManual = document.querySelector('button[onclick*="become-contributor"]');
if (bmCardBtn) bmCardBtn.setAttribute('onclick', 'openBmAppModal()');
if (bmBtnManual) bmBtnManual.setAttribute('onclick', 'openBmAppModal()');
// ============ LOGOUT ===========
document.getElementById("confirm-logout").onclick = () => {
  localStorage.clear();
  window.location.href = '/mock-icthallb';
};
document.querySelector('.practice-form').onsubmit = function(e) {
  e.preventDefault();
  const subject = document.getElementById('subject').value;
  const year = document.getElementById('year').value;
  const questions = document.getElementById('questions').value;
  const time = document.getElementById('time').value;
  const difficulty = document.getElementById('difficulty').value;

  // Save to localStorage for robustness
  localStorage.setItem('pqConfig', JSON.stringify({subject, year, questions, time, difficulty}));
  // Redirect to pq.html with query params
  window.location.href = `tpp.html?subject=${encodeURIComponent(subject)}&year=${year}&count=${questions}&time=${time}&difficulty=${difficulty}`;
};
// ============ TEST START ===========
window.startTest = function(examSetId) {
  window.location.href = `test.html?examSet=${encodeURIComponent(examSetId)}`;
};

window.renderAvailableTablePage = renderAvailableTablePage;
window.renderHistoryTablePage = renderHistoryTablePage;

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
  await fetchInbox();
  await fetchAvailableTests();
  hidePreloaderSpinner();
  
}

window.addEventListener("DOMContentLoaded", initDashboard);
