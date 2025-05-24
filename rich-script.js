const pages = {
  auth: document.getElementById("auth-page"),
  quiz: document.getElementById("quiz-page"),
  result: document.getElementById("result-page")
};
const quizBox = document.getElementById("quiz-box");
const nextBtn = document.getElementById("next-btn");
const summaryDiv = document.getElementById("summary");

let currentUser = null;
let currentQuestion = 0;
let score = 0;
let shuffledQuestions = [];

function showPage(pageName) {
  Object.values(pages).forEach(p => p.classList.add("hidden"));
  pages[pageName].classList.remove("hidden");
}

function register() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  if (!user || !pass) return alert("Enter both fields");
  if (localStorage.getItem(`user-${user}`)) {
    document.getElementById("auth-msg").innerText = "User already exists!";
    return;
  }
  localStorage.setItem(`user-${user}`, pass);
  document.getElementById("auth-msg").innerText = "Registration successful!";
}

function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  if (localStorage.getItem(`user-${user}`) === pass) {
    currentUser = user;
    startQuiz();
  } else {
    document.getElementById("auth-msg").innerText = "Invalid credentials!";
  }
}

function logout() {
  currentUser = null;
  location.reload();
}

function startQuiz() {
  showPage("quiz");
  currentQuestion = 0;
  score = 0;
  shuffledQuestions = questions.map(q => ({
    ...q,
    options: q.options.map(opt => ({text: opt}))
  })).sort(() => Math.random() - 0.5);
  shuffledQuestions.forEach(q => q.options = shuffle(q.options));
  showQuestion();
  startTimer();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function showQuestion() {
  const q = shuffledQuestions[currentQuestion];
  quizBox.innerHTML = `<h3>${q.question}</h3>` +
    q.options.map((opt, i) =>
      `<div class="option" data-index="${i}">${opt.text}</div>`
    ).join('');
  document.querySelectorAll('.option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });
}

nextBtn.onclick = () => {
  const selected = document.querySelector('.option.selected');
  if (!selected) return alert("Please select an option.");
  const selectedIndex = parseInt(selected.dataset.index);
  const correctIndex = shuffledQuestions[currentQuestion].answer;
  if (shuffledQuestions[currentQuestion].options[selectedIndex].text === questions[currentQuestion].options[correctIndex]) {
    score++;
  }
  currentQuestion++;
  if (currentQuestion < shuffledQuestions.length) {
    showQuestion();
  } else {
    endQuiz();
  }
};

function endQuiz() {
  showPage("result");
  summaryDiv.innerHTML = `
    <p><strong>User:</strong> ${currentUser}</p>
    <p>Total Questions: ${questions.length}</p>
    <p>Correct Answers: ${score}</p>
    <p>Wrong Answers: ${questions.length - score}</p>
  `;
  generateChart(score, questions.length - score);
}

function generateChart(correct, wrong) {
  const ctx = document.getElementById("result-chart").getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Correct", "Wrong"],
      datasets: [{
        data: [correct, wrong],
        backgroundColor: ["#4caf50", "#f44336"]
      }]
    }
  });
}

function exportPDF() {
  html2pdf().from(summaryDiv).save("CBT_Result.pdf");
}

function restart() {
  location.reload();
}

// Timer (basic for now)
let timerInterval, seconds = 0;
function startTimer() {
  timerInterval = setInterval(() => {
    seconds++;
    document.getElementById("timer").innerText = `Time: ${Math.floor(seconds/60)}:${seconds%60}`;
  }, 1000);
}
