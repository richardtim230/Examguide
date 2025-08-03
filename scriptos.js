// === Students Support System Exam App - Full Script ===
// By OoreOfe2024, for use with upgraded index.html.htm

// ========= GLOBAL & STATE =========
let selectedCourse = "";
let subCourseName = "";
let questions = [];
let currentQuestionIndex = 0;
let answers = [];
let timerInterval = null;
let timeRemaining = 0;
let isPracticeMode = false;

// ========= DOM ELEMENTS =========
const overlay = document.getElementById("overlay");
const loginBox = document.getElementById("login-box");
const registerBox = document.getElementById("register-box");
const paymentPage = document.getElementById("paymentPage");
const continueBtn = document.getElementById("continue-btn");
const userIdInput = document.getElementById("user-id");
const fullNameInput = document.getElementById("full-name");
const departmentInput = document.getElementById("department");
const levelInput = document.getElementById("level");
const coursesInput = document.getElementById("courses");
const photoUpload = document.getElementById("photo-upload");
const agreeCheckbox = document.getElementById("agree-checkbox");
const submitRegisterBtn = document.getElementById("submit-register");
const registerBtn = document.getElementById("register-btn");
const backToLoginBtn = document.getElementById("back-to-login");
const loginBtn = document.getElementById("login-btn");
const welcomePopup = document.getElementById("welcome-popup");
const studentDetailsElement = document.getElementById("student-details");
const profilePhoto = document.getElementById("profile-photo");
const welcomeMessage = document.getElementById("welcome-message");
const examSection = document.getElementById("exam-section");
const summarySection = document.getElementById("summary-section");
const summaryContent = document.getElementById("summary-content");
const subjectTitle = document.getElementById("subject-title");
const questionText = document.getElementById("question-text");
const questionImage = document.getElementById("question-image");
const optionsContainer = document.getElementById("options-container");
const progressContainer = document.getElementById("progress-container");
const prevQuestionBtn = document.getElementById("prev-question");
const nextQuestionBtn = document.getElementById("next-question");
const endExamBtn = document.getElementById("end-exam");
const confirmationModal = document.getElementById("confirmationModal");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");
const historyBtn = document.getElementById("history-btn");
const examHistorySection = document.getElementById("exam-history-section");
const examHistoryContent = document.getElementById("exam-history-content");
const rewardIcon = document.getElementById("rewardIcon");
const rewardPopup = document.getElementById("rewardPopup");
const rewardPopupMessage = document.getElementById("rewardPopupMessage");
const examBonusElem = document.getElementById("examBonus");
const timeBonusElem = document.getElementById("timeBonus");
const totalRewardElem = document.getElementById("totalReward");
const timeSpentElem = document.getElementById("timeSpent");
const progressFillElem = document.getElementById("progressFill");
const withdrawalSection = document.getElementById("withdrawalSection");
const withdrawableAmountElem = document.getElementById("withdrawableAmount");
const withdrawForm = document.getElementById("withdrawForm");
const bankNameInput = document.getElementById("bankName");
const accountNumberInput = document.getElementById("accountNumber");
const withdrawAmountInput = document.getElementById("withdrawAmount");
const courseSelectionSection = document.getElementById("course-selection-section");
const accessCodeSection = document.getElementById("access-code-section");
const selectedCourseTitle = document.getElementById("selected-course-title");
const accessCodeInput = document.getElementById("access-code");
const submitCodeBtn = document.getElementById("submit-code");
const cancelButton = document.getElementById("cancel-button");
const sessionConfigSection = document.getElementById("session-config-section");
const numQuestionsInput = document.getElementById("num-questions");
const questionYearSelect = document.getElementById("question-year");
const sessionTimeInput = document.getElementById("session-time");
const startSessionBtn = document.getElementById("start-session-btn");
const cancelSessionBtn = document.getElementById("cancel-session-btn");
const restartExamBtn = document.getElementById("restart-exam");

// ========= QUESTION BANK EXAMPLE =========
const questionBanks = {
  Mathematics: {
    "MTH105": {
      title: "Mathematics for Biological Sciences",
      years: {
        "2024": [
          {
            text: "What is the union of the sets A = {1, 2, 3} and B = {3, 4, 5}?",
            options: [
              "{1, 2, 3, 4, 5}",
              "{3}",
              "{1, 2}",
              "{4, 5}"
            ],
            correct: 0,
            explanation: "The union of two sets includes all elements that are in either set. A ∪ B = {1, 2, 3, 4, 5}."
          },
          {
            text: "What is the symbolic component of culture based on?",
            options: ["Material goods", "Values", "Language and symbols", "Clothing"],
            correct: 2,
            explanation: "The symbolic component of culture is largely based on language and symbols."
          }
        ],
        "2023": [
          {
            text: "Sample question for 2023: What is 2 + 2?",
            options: ["2", "3", "4", "5"],
            correct: 2,
            explanation: "2 + 2 equals 4."
          }
        ]
      }
    }
  }
  // Add more subjects/courses/years as needed
};

// ========= SECTION FLOW =========
function showSection(section) {
  [
    courseSelectionSection,
    accessCodeSection,
    sessionConfigSection,
    examSection,
    summarySection
  ].forEach((el) => {
    if (el) el.classList.add("hidden");
  });
  if (section) section.classList.remove("hidden");
}

// ========= COURSE & ACCESS CODE FLOW =========
document.querySelectorAll(".course").forEach((button) => {
  button.addEventListener("click", () => {
    selectedCourse = button.dataset.course;
    selectedCourseTitle.textContent = `Enter Access Code for ${selectedCourse}`;
    showSection(accessCodeSection);
  });
});
cancelButton.addEventListener("click", () => {
  showSection(courseSelectionSection);
});

// ========= ACCESS CODE SUBMISSION & SESSION CONFIG =========
submitCodeBtn.addEventListener("click", () => {
  const code = accessCodeInput.value.trim();
  const courseData = questionBanks[selectedCourse]?.[code];

  if (!courseData) {
    alert("Invalid access code. Please try again. Note that the access code is your course code in capital letters without spacing, e.g ZOO101");
    return;
  }

  // Populate year options dynamically
  questionYearSelect.innerHTML = "";
  const years = Object.keys(courseData.years || {});
  years.forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    questionYearSelect.appendChild(option);
  });

  // Update max questions based on year selection
  function updateQuestionMax() {
    const selectedYear = questionYearSelect.value;
    const available = courseData.years[selectedYear]?.length || 1;
    numQuestionsInput.max = available;
    numQuestionsInput.value = Math.min(10, available);
  }
  questionYearSelect.addEventListener("change", updateQuestionMax);
  updateQuestionMax();

  // Show config section
  showSection(sessionConfigSection);
});
cancelSessionBtn.addEventListener("click", () => {
  showSection(courseSelectionSection);
});
startSessionBtn.addEventListener("click", () => {
  const numQuestions = parseInt(numQuestionsInput.value, 10);
  const year = questionYearSelect.value;
  const timeLimit = parseInt(sessionTimeInput.value, 10);
  const code = accessCodeInput.value.trim();
  const courseData = questionBanks[selectedCourse]?.[code];

  if (!courseData || !courseData.years[year]) {
    alert("Selected year or course not found!");
    return;
  }
  let questionsPool = [...courseData.years[year]];
  if (numQuestions < questionsPool.length) {
    questionsPool = shuffleArray(questionsPool).slice(0, numQuestions);
  }
  questions = questionsPool;
  subCourseName = `${courseData.title} (${year})`;
  currentQuestionIndex = 0;
  answers = [];
  timeRemaining = timeLimit * 60; // convert min to seconds

  showSection(examSection);
  createProgress();
  updateQuestion();
  startTimer();
});

// ========= EXAM NAVIGATION & QUESTION DISPLAY =========
function updateQuestion() {
  const question = questions[currentQuestionIndex];
  subjectTitle.textContent = subCourseName;
  questionText.innerHTML = `<h3>Que ${currentQuestionIndex + 1}: ${question.text.replace(/\n/g, '<br>')}</h3>`;
  if (question.image) {
    questionImage.src = question.image;
    questionImage.alt = "Question Image";
    questionImage.classList.remove("hidden");
  } else {
    questionImage.src = "";
    questionImage.alt = "";
    questionImage.classList.add("hidden");
  }
  optionsContainer.innerHTML = "";
  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.textContent = option;
    button.className = "option-button";
    button.dataset.index = index;
    button.addEventListener("click", () => selectAnswer(index));
    if (answers[currentQuestionIndex] === index) button.classList.add("selected");
    optionsContainer.appendChild(button);
  });
  prevQuestionBtn.disabled = currentQuestionIndex === 0;
  nextQuestionBtn.disabled = currentQuestionIndex === questions.length - 1;
  updateProgress();
}
prevQuestionBtn.addEventListener("click", () => {
  saveAnswer();
  currentQuestionIndex--;
  updateQuestion();
});
nextQuestionBtn.addEventListener("click", () => {
  saveAnswer();
  currentQuestionIndex++;
  updateQuestion();
});
function selectAnswer(index) {
  answers[currentQuestionIndex] = index;
  updateProgress();
  const allOptions = document.querySelectorAll(".option-button");
  allOptions.forEach((button) => button.classList.remove("selected"));
  const selectedButton = allOptions[index];
  if (selectedButton) selectedButton.classList.add("selected");
}
function saveAnswer() {
  const selected = document.querySelector('.option-button.selected');
  if (selected) {
    answers[currentQuestionIndex] = parseInt(selected.dataset.index);
  }
}
function createProgress() {
  progressContainer.innerHTML = "";
  questions.forEach((_, index) => {
    const progressItem = document.createElement("div");
    progressItem.classList.add("progress-item");
    progressItem.dataset.index = index;
    progressContainer.appendChild(progressItem);
  });
}
function updateProgress() {
  const items = progressContainer.querySelectorAll(".progress-item");
  items.forEach((item, index) => {
    item.classList.toggle("answered", answers[index] !== undefined);
    if (index === currentQuestionIndex) {
      item.classList.add("current");
    } else {
      item.classList.remove("current");
    }
  });
}

// ========= TIMER LOGIC =========
function startTimer() {
  const existingTimerDisplay = document.getElementById("timer-display");
  if (existingTimerDisplay) existingTimerDisplay.remove();
  const timerDisplay = document.createElement("div");
  timerDisplay.id = "timer-display";
  timerDisplay.style.margin = "1rem 0";
  timerDisplay.style.fontSize = "1.2rem";
  examSection.insertBefore(timerDisplay, progressContainer);
  updateTimerDisplay();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      alert("Time's up! The exam will be submitted automatically.");
      endExam(true);
    }
  }, 1000);
}
function updateTimerDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timerDisplay = document.getElementById("timer-display");
  if (timerDisplay)
    timerDisplay.textContent = `Time Remaining: ${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// ========= EXAM SUBMISSION =========
endExamBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  endExam();
});
function endExam(autoSubmit = false) {
  if (!autoSubmit) {
    confirmationModal.style.display = 'flex';
    confirmYes.onclick = function () {
      confirmationModal.style.display = 'none';
      clearInterval(timerInterval);
      finalizeSubmission();
    };
    confirmNo.onclick = function () {
      confirmationModal.style.display = 'none';
    };
    return;
  }
  clearInterval(timerInterval);
  finalizeSubmission();
}
function finalizeSubmission() {
  if (!answers || !questions) {
    console.error("Exam data is missing.");
    return;
  }
  const score = answers.filter((ans, i) => ans === questions[i].correct).length;
  const totalQuestions = questions.length;
  const percentage = Math.round((score / totalQuestions) * 100);
  let userRewards;
  try {
    userRewards = JSON.parse(localStorage.getItem("userRewards")) || {
      timeSpent: 0, timeBonus: 0, examScore: 0, examBonus: 0, totalReward: 0
    };
  } catch (error) {
    userRewards = { timeSpent: 0, timeBonus: 0, examScore: 0, examBonus: 0, totalReward: 0 };
  }
  userRewards.examScore += score;
  const previousBonus = userRewards.examBonus;
  userRewards.examBonus += score * 1;
  userRewards.totalReward = userRewards.timeBonus + userRewards.examBonus;
  const newBonus = userRewards.examBonus - previousBonus;
  if (newBonus > 0) {
    showAnimatedPopup(`🎉 You earned ₦${newBonus} from your exam performance!`);
  }
  localStorage.setItem("userRewards", JSON.stringify(userRewards));
  const examSession = {
    date: new Date().toLocaleString(),
    questions: questions.map(q => ({
      text: q.text,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation
    })),
    answers: answers,
    score: score,
    totalQuestions: totalQuestions,
    percentage: percentage
  };
  try {
    const examHistory = JSON.parse(localStorage.getItem("examHistory")) || [];
    examHistory.push(examSession);
    localStorage.setItem("examHistory", JSON.stringify(examHistory));
  } catch (error) {
    console.error("Error saving exam history:", error);
  }
  showSection(summarySection);
  summaryContent.innerHTML = `
    <h3>Score: ${score}/${totalQuestions} (${percentage}%)</h3>
    <p>${getRemark(percentage)}</p>
    ${questions.map(
      (q, i) => `
        <p>
          ${i + 1}. ${q.text.replace(/\n/g, '<br>')}<br>
          Your Answer: <strong>${q.options[answers[i]] || "Unanswered"}</strong><br><br>
          <strong>Correct Answer: ${q.options[q.correct]}</strong><br><br>
          <strong>Explanation:</strong> ${q.explanation.replace(/\n/g, '<br>')}<br><br><br>
        </p>
      `
    ).join("")}
  `;
  updateRewardUI();
  checkWithdrawalEligibility();
}
restartExamBtn.addEventListener("click", () => {
  questions = [];
  answers = [];
  currentQuestionIndex = 0;
  subCourseName = "";
  timeRemaining = 0;
  clearInterval(timerInterval);
  showSection(courseSelectionSection);
});

// ========= HISTORY =========
historyBtn.addEventListener("click", () => {
  examHistorySection.classList.toggle("hidden");
  if (!examHistorySection.classList.contains("hidden")) {
    displayExamHistory();
  }
});
function displayExamHistory() {
  const examHistory = JSON.parse(localStorage.getItem('examHistory')) || [];
  examHistoryContent.innerHTML = '';
  if (examHistory.length === 0) {
    examHistoryContent.innerHTML = '<p>No exam history available.</p>';
    return;
  }
  examHistory.forEach((session, index) => {
    const sessionDiv = document.createElement('div');
    sessionDiv.classList.add('exam-session');
    const score = session.score || 0;
    const totalQuestions = session.totalQuestions || 0;
    const percentage = session.percentage || 0;
    const sessionTitle = document.createElement('h3');
    sessionTitle.textContent = `Session ${index + 1} - ${session.date} - Score: ${score}/${totalQuestions} (${percentage}%)`;
    sessionTitle.addEventListener('click', () => displaySessionDetails(session));
    sessionDiv.appendChild(sessionTitle);
    examHistoryContent.appendChild(sessionDiv);
  });
}
function displaySessionDetails(session) {
  examHistoryContent.innerHTML = '';
  session.questions.forEach((question, qIndex) => {
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('question');
    const questionText = document.createElement('p');
    questionText.innerHTML = `<strong>Q${qIndex + 1}:</strong> ${question.text}`;
    questionDiv.appendChild(questionText);
    const answerText = document.createElement('p');
    const userAnswerIndex = session.answers[qIndex];
    const userAnswer = userAnswerIndex !== undefined ? question.options[userAnswerIndex] : "No answer selected";
    answerText.innerHTML = `<strong>Your Answer:</strong> ${userAnswer}`;
    questionDiv.appendChild(answerText);
    const explanationText = document.createElement('p');
    explanationText.innerHTML = `<strong>Explanation:</strong> ${question.explanation || "No explanation available"}`;
    questionDiv.appendChild(explanationText);
    examHistoryContent.appendChild(questionDiv);
  });
  const backButton = document.createElement('button');
  backButton.textContent = 'Back to History';
  backButton.addEventListener('click', displayExamHistory);
  backButton.style.marginTop = '20px';
  examHistoryContent.appendChild(backButton);
}

// ========= REWARD UI & WITHDRAWAL =========
function updateRewardUI() {
  let userRewards = JSON.parse(localStorage.getItem("userRewards")) || {
    timeSpent: 0, timeBonus: 0, examScore: 0, examBonus: 0, totalReward: 0
  };
  examBonusElem.innerText = `₦${userRewards.examBonus}`;
  timeBonusElem.innerText = `₦${userRewards.timeBonus}`;
  totalRewardElem.innerText = `₦${userRewards.totalReward}`;
  progressFillElem.style.width = `${Math.min((userRewards.totalReward / 3000) * 100, 100)}%`;
}
function checkWithdrawalEligibility() {
  let userRewards = JSON.parse(localStorage.getItem("userRewards")) || { totalReward: 0 };
  withdrawableAmountElem.innerText = `₦${userRewards.totalReward}`;
  if (userRewards.totalReward >= 3000) {
    withdrawalSection.style.display = "block";
  } else {
    withdrawalSection.style.display = "none";
  }
}
withdrawForm.addEventListener("submit", function (event) {
  event.preventDefault();
  let userRewards = JSON.parse(localStorage.getItem("userRewards")) || { totalReward: 0 };
  const bankName = bankNameInput.value.trim();
  const accountNumber = accountNumberInput.value.trim();
  const withdrawAmount = parseFloat(withdrawAmountInput.value);
  if (withdrawAmount > userRewards.totalReward) {
    alert("Insufficient balance!");
    return;
  }
  let withdrawalHistory = JSON.parse(localStorage.getItem("withdrawals")) || [];
  withdrawalHistory.push({
    bankName: bankName,
    accountNumber: accountNumber,
    amount: withdrawAmount,
    date: new Date().toLocaleString(),
    status: "Pending"
  });
  localStorage.setItem("withdrawals", JSON.stringify(withdrawalHistory));
  userRewards.totalReward -= withdrawAmount;
  userRewards.examBonus -= withdrawAmount;
  localStorage.setItem("userRewards", JSON.stringify(userRewards));
  updateRewardUI();
  checkWithdrawalEligibility();
  alert(`✅ Withdrawal request of ₦${withdrawAmount} submitted successfully!`);
});
function toggleRewardPopup() {
  rewardPopup.style.display =
    rewardPopup.style.display === "block" ? "none" : "block";
  checkWithdrawalEligibility();
  updateRewardUI();
}
function showAnimatedPopup(message) {
  rewardPopupMessage.innerText = message;
  rewardPopupMessage.style.display = "block";
  setTimeout(() => { rewardPopupMessage.style.display = "none"; }, 3000);
}

// ========= SESSION TIMER BONUS (TIME SPENT REWARD) =========
let sessionStartTime = localStorage.getItem("sessionStartTime")
  ? new Date(localStorage.getItem("sessionStartTime"))
  : new Date();
let timerRewardInterval;
function startSessionTimeBonus() {
  sessionStartTime = new Date();
  localStorage.setItem('sessionStartTime', sessionStartTime);
  timerRewardInterval = setInterval(updateTimeBonusDisplay, 1000);
}
function stopSessionTimeBonus() {
  clearInterval(timerRewardInterval);
  const startTime = new Date(localStorage.getItem('sessionStartTime'));
  const endTime = new Date();
  const duration = Math.floor((endTime - startTime) / 1000);
  localStorage.removeItem('sessionStartTime');
  updateTimeBonus(duration);
}
function updateTimeBonusDisplay() {
  const startTime = new Date(localStorage.getItem('sessionStartTime'));
  const now = new Date();
  const duration = Math.floor((now - startTime) / 1000);
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;
  timeSpentElem.textContent =
    `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
function updateTimeBonus(duration) {
  let userRewards = JSON.parse(localStorage.getItem("userRewards")) || {
    timeSpent: 0, timeBonus: 0, examScore: 0, examBonus: 0, totalReward: 0
  };
  userRewards.timeSpent += duration;
  const previousTimeBonus = userRewards.timeBonus;
  userRewards.timeBonus = Math.floor(userRewards.timeSpent / 3600) * 10;
  userRewards.totalReward = userRewards.timeBonus + userRewards.examBonus;
  const newTimeBonus = userRewards.timeBonus - previousTimeBonus;
  if (newTimeBonus > 0) {
    showAnimatedPopup(`🕒 You earned ₦${newTimeBonus} for time spent!`);
  }
  localStorage.setItem("userRewards", JSON.stringify(userRewards));
  updateRewardUI();
  checkWithdrawalEligibility();
}
loginBtn.addEventListener('click', startSessionTimeBonus);
window.addEventListener('beforeunload', stopSessionTimeBonus);

// ========= REMARKS & SHUFFLE UTILITY =========
function getRemark(percentage) {
  if (percentage === 100) return "Excellent! You aced the test!";
  if (percentage >= 75) return "Great job! You did very well.";
  if (percentage >= 50) return "Good effort, but there's room for improvement.";
  return "Keep practicing! You can do better.";
}
function shuffleArray(array) {
  let arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ========= MODE SWITCH =========
document.getElementById("switch-mode-btn").addEventListener("click", () => {
  isPracticeMode = !isPracticeMode;
  document.getElementById("switch-mode-btn").textContent = isPracticeMode ? "📝" : "📖";
  if (isPracticeMode) {
    alert("Coming Up Soon!.");
    timeRemaining = 30;
    startTimer();
  } else {
    alert("Switched to Exam Mode.");
    timeRemaining = 3000;
    startTimer();
  }
});

// ========= PAGE LOAD: UPDATE UI & REWARD =========
window.addEventListener("load", updateRewardUI);

// ========= LOGIN, REGISTER, PAYMENT & WELCOME FLOW =========
registerBtn.addEventListener("click", () => {
  loginBox.classList.add("hidden");
  registerBox.classList.remove("hidden");
});
backToLoginBtn.addEventListener("click", () => {
  registerBox.classList.add("hidden");
  loginBox.classList.remove("hidden");
});
submitRegisterBtn.addEventListener("click", () => {
  if (
    !fullNameInput.value ||
    !departmentInput.value ||
    !levelInput.value ||
    !coursesInput.value ||
    !photoUpload.files.length
  ) {
    alert("Please fill all fields and upload your photo.");
    return;
  }
  if (!agreeCheckbox.checked) {
    alert("You must agree to proceed.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const userID = generateUserID();
    const userData = {
      userID,
      fullName: fullNameInput.value,
      department: departmentInput.value,
      level: levelInput.value,
      courses: coursesInput.value,
      photo: reader.result,
    };
    localStorage.setItem("userData", JSON.stringify(userData));
    document.getElementById("paymentFullName").innerText = userData.fullName;
    document.getElementById("paymentDepartment").innerText = userData.department;
    document.getElementById("paymentLevel").innerText = userData.level;
    document.getElementById("paymentUserID").innerText = userData.userID;
    registerBox.classList.add("hidden");
    paymentPage.classList.remove("hidden");
    alert(`Registration Successful! Your User ID is: ${userID}`);
  };
  reader.readAsDataURL(photoUpload.files[0]);
});
function generateUserID() {
  const prefix = 'OAU-';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomPart = '';
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomPart += characters[randomIndex];
  }
  return prefix + randomPart;
}
document.getElementById("generate-invoice-btn").addEventListener("click", () => {
  const userData = JSON.parse(localStorage.getItem("userData"));
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 650;
  canvas.height = 600;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(0, 0, canvas.width, 80);
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Arial';
  ctx.fillText('STUDENTS SUPPORT SYSTEM', 20, 50);
  ctx.fillStyle = '#2C3E50';
  ctx.font = '20px italic Arial';
  ctx.fillText('Obafemi Awolowo University', 20, 120);
  ctx.font = '18px Arial';
  ctx.fillText('Payment of User ID Activation Fee for the 2023/2024 Academic Session', 20, 160);
  ctx.fillStyle = '#555';
  ctx.font = '16px Arial';
  ctx.fillText(`Full Name: ${userData.fullName}`, 20, 200);
  ctx.fillText(`Department: ${userData.department}`, 20, 240);
  ctx.fillText(`Level: ${userData.level}`, 20, 280);
  ctx.fillText(`User ID: ${userData.userID}`, 20, 320);
  ctx.fillText(`Amount: N2000.00`, 20, 360);
  ctx.fillStyle = '#4CAF50';
  ctx.font = '18px Arial';
  ctx.fillText('Payment Details:', 20, 400);
  ctx.fillStyle = '#555';
  ctx.font = '16px Arial';
  ctx.fillText('Bank Name: Opay Microfinance Bank', 40, 440);
  ctx.fillText('Account Number: 6112744499', 40, 480);
  ctx.fillText('Account Name: OCHUKO TIMOTHY RICHARD', 40, 520);
  const image = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = image;
  link.download = `Invoice_${userData.userID}.png`;
  link.click();
  alert('Invoice has been generated and downloaded as an image.');
});
document.getElementById("submit-receipt-btn").addEventListener("click", () => {
  const receiptFile = document.getElementById("receipt-upload").files[0];
  const userData = JSON.parse(localStorage.getItem("userData"));
  const whatsappMessage = `
    Payment Submission Details:
    - Full Name: ${userData.fullName}
    - Department: ${userData.department}
    - Level: ${userData.level}
    - User ID: ${userData.userID}
    - Amount Paid: N2000.00
    
    📌 *Please attach the receipt image alongside this message.*
  `;
  window.open(
    `https://wa.me/2349155127634?text=${encodeURIComponent(whatsappMessage)}`,
    "_blank"
  );
  alert("Redirecting to admin on WhatsApp. Please ensure your receipt is attached.");
});
document.getElementById("back-to-login-payment").addEventListener("click", () => {
  paymentPage.classList.add("hidden");
  loginBox.classList.remove("hidden");
  alert("You have been redirected back to the login page.");
});
loginBtn.addEventListener("click", () => {
  const userId = userIdInput.value.trim();
  const storedUserData = JSON.parse(localStorage.getItem("userData"));
  if (!storedUserData) {
    alert("No user data found. Please register first.");
    return;
  }
  if (confirm(`Do you want to log in with User ID: ${storedUserData.userID}?`)) {
    profilePhoto.src = storedUserData.photo || "default.png";
    studentDetailsElement.innerHTML = `
      Full Name: ${storedUserData.fullName}<br>
      Department: ${storedUserData.department}<br>
      Level: ${storedUserData.level}<br>
      Courses: ${storedUserData.courses}
    `;
    welcomeMessage.textContent = "Welcome!";
    loginBox.classList.add("hidden");
    welcomePopup.classList.remove("hidden");
  } else {
    loginBox.classList.remove("hidden");
  }
  if (storedUserData.userID !== userId) {
    alert("Invalid or Empty User ID. Please check and try again.");
  }
});
continueBtn.addEventListener("click", () => {
  overlay.style.display = "none";
  document.body.style.overflow = 'auto';
});

// ========= COPY PROTECTION =========
document.addEventListener("copy", function (e) {
  e.preventDefault();
  alert("Copying is disabled on this text!");
});

// ========= END =========
