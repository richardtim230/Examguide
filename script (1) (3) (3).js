document.addEventListener("DOMContentLoaded", function () {
    const authSection = document.getElementById("login-box");
    const registerSection = document.getElementById("register-box");

    function showLogin() {
        authSection.classList.remove("hidden");
        registerSection.classList.add("hidden");
        window.history.pushState({}, "", "/login-studentsApp"); // Update URL without reloading
    }

    function showRegister() {
        authSection.classList.add("hidden");
        registerSection.classList.remove("hidden");
        window.history.pushState({}, "", "/register-studentsApp"); // Update URL without reloading
    }
    Computer: {
  "CSC201": {
        title: "Biometry/Biostatistics",
        questions: [
     ]
   }
 }
};


function showSection(section) {
  [courseSelectionSection, accessCodeSection, examSection, summarySection].forEach((el) => {
    if (el) el.classList.add("hidden");
  });
  section.classList.remove("hidden");
}

document.querySelectorAll(".course").forEach((button) => {
  button.addEventListener("click", () => {
    selectedCourse = button.dataset.course;
    selectedCourseTitle.textContent = `Enter Access Code for ${selectedCourse}`;
    showSection(accessCodeSection);
  });
});

document.querySelectorAll(".course").forEach((button) => {
  button.addEventListener("click", () => {
    selectedCourse = button.dataset.course;
    selectedCourseTitle.textContent = `Enter Access Code for ${selectedCourse}`;
    showSection(accessCodeSection);
  });
});

document.getElementById("submit-code").addEventListener("click", () => {
  const code = document.getElementById("access-code").value.trim();
  const courseData = questionBanks[selectedCourse]?.[code];

  if (!courseData) {
    alert("Invalid access code. Please try again. Note that the access code is your course code in capital letters without spacing, e.g ZOO101");
    return;
  }

  const storedProgress = JSON.parse(localStorage.getItem(`${selectedCourse}-${code}`)) || [];
  const remainingQuestions = courseData.questions.filter((_, i) => !storedProgress.includes(i));

  if (remainingQuestions.length === 0) {
    alert("You have already completed all questions in this question bank.");
    return;
  }

  questions = shuffleArray(remainingQuestions);
  subCourseName = courseData.title;
  startExam();
});

cancelButton.addEventListener("click", () => {
  showSection(courseSelectionSection);
});


document.getElementById("end-exam").addEventListener("click", () => {
  clearInterval(timerInterval);
  endExam();
});

document.getElementById("restart-exam").addEventListener("click", () => {
  // Clear previous exam session data
  questions = [];
  answers = [];  // Clear previously selected answers
  currentQuestionIndex = 0;
  subCourseName = "";
  timeRemaining = 3000;
  
  // Stop any running timer
  clearInterval(timerInterval);
  
  // Show the initial course selection section
  showSection(courseSelectionSection);
});

let isPracticeMode = false;

document.getElementById("switch-mode-btn").addEventListener("click", () => {
  isPracticeMode = !isPracticeMode;
  document.getElementById("switch-mode-btn").textContent = isPracticeMode ? "📝" : "📖";
});

function startExam() {
  subjectTitle.textContent = subCourseName;
  showSection(examSection);
  createProgress();
  updateQuestion();
  if (!isPracticeMode) {
    startTimer();
  }
}

function selectAnswer(index) {
  answers[currentQuestionIndex] = index;

  // Deselect all option buttons
  const allOptions = document.querySelectorAll(".option-button");
  allOptions.forEach((button) => button.classList.remove("selected"));

  // Mark the clicked button as selected
  const selectedButton = allOptions[index];
  selectedButton.classList.add("selected");

  if (isPracticeMode) {
    // Display correct answer and explanation
    const question = questions[currentQuestionIndex];
    const explanation = document.createElement("div");
    explanation.innerHTML = `<strong>Correct Answer: ${question.options[question.correct]}</strong><br>Explanation: ${question.explanation}`;
    optionsContainer.appendChild(explanation);
  }

  updateProgress();
}

function endExam(autoSubmit = false) {
  if (!autoSubmit) {
    // Show the confirmation modal
    const modal = document.getElementById("confirmationModal");
    modal.style.display = "flex";

    // Handle "Yes" button
    document.getElementById("confirmYes").onclick = function () {
      modal.style.display = "none";
      clearInterval(timerInterval); // Stop the timer
      console.log("Exam submitted!");
      finalizeSubmission();
    };

    // Handle "No" button
    document.getElementById("confirmNo").onclick = function () {
      modal.style.display = "none";
      console.log("Submission canceled");
      // Timer continues running
    };

    return; // Prevent further execution until the user confirms
  }

  // Auto-submit (e.g., when time runs out)
  clearInterval(timerInterval);
  console.log("Time's up! Auto-submitting exam...");
  finalizeSubmission();
          }


function startExam() {
  subjectTitle.textContent = subCourseName;
  showSection(examSection);
  createProgress();
  updateQuestion();
  startTimer();
}






function updateQuestion() {
  const question = questions[currentQuestionIndex];
  
  // Display question number along with the question text
  const formattedText = question.text.replace(/\n/g, '<br>');
  questionText.innerHTML = `<h3>Que ${currentQuestionIndex + 1}: ${formattedText}</h3>`;
  
  // Handle the question image
  if (question.image) {
    questionImage.src = question.image;
    questionImage.alt = "Question Image";
    questionImage.classList.remove("hidden");
  } else {
    questionImage.src = "";
    questionImage.alt = "";
    questionImage.classList.add("hidden");
  }

  // Clear previous options
  optionsContainer.innerHTML = "";



  // Display options as buttons
  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.textContent = option;
    button.addEventListener("click", () => selectAnswer(index));
    button.className = "option-button";
    optionsContainer.appendChild(button);
  });

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

function selectAnswer(index) {
  answers[currentQuestionIndex] = index;
  updateProgress();
}

// Save Answer
function saveAnswer() {
  const selected = document.querySelector('.option-button.selected');
  if (selected) {
    answers[currentQuestionIndex] = parseInt(selected.dataset.index);
  }
}

function selectAnswer(index) {
  answers[currentQuestionIndex] = index;

  // Deselect all option buttons
  const allOptions = document.querySelectorAll(".option-button");
  allOptions.forEach((button) => button.classList.remove("selected"));

  // Mark the clicked button as selected
  const selectedButton = allOptions[index];
  selectedButton.classList.add("selected");

  updateProgress();
}

function updateQuestion() {
  const question = questions[currentQuestionIndex];
  
  // Display question number along with the question text
  questionText.innerHTML = `<h3>Que ${currentQuestionIndex + 1}: ${question.text.replace(/\n/g, '<br>')}</h3>`;
  
  // Handle the question image
  if (question.image) {
    questionImage.src = question.image;
    questionImage.alt = "Question Image";
    questionImage.classList.remove("hidden");
  } else {
    questionImage.src = "";
    questionImage.alt = "";
    questionImage.classList.add("hidden");
  }

  // Clear previous options
  optionsContainer.innerHTML = "";


  // Display options as buttons
  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.textContent = option;
    button.className = "option-button";
    button.dataset.index = index;
    button.addEventListener("click", () => selectAnswer(index));

    // Apply the selected state if this option was previously selected
    if (answers[currentQuestionIndex] === index) {
      button.classList.add("selected");
    }

    optionsContainer.appendChild(button);
  });

  // Enable/Disable navigation buttons based on the current index
  document.getElementById("prev-question").disabled = currentQuestionIndex === 0;
  document.getElementById("next-question").disabled = currentQuestionIndex === questions.length - 1;
  updateProgress();
}

  document.getElementById("next-question").addEventListener("click", () => {
  saveAnswer();
  currentQuestionIndex++;
  updateQuestion();
});

document.getElementById("prev-question").addEventListener("click", () => {
  saveAnswer();
  currentQuestionIndex--;
  updateQuestion();
});

// Initialize the first question on page load
updateQuestion();


function startTimer() {
  // Remove existing timer container if it exists
  const existingTimerDisplay = document.getElementById("timer-display");
  if (existingTimerDisplay) {
    existingTimerDisplay.remove();
  }

  // Create a new timer container
  const timerDisplay = document.createElement("div");
  timerDisplay.id = "timer-display";
  timerDisplay.style.margin = "1rem 0";
  timerDisplay.style.fontSize = "1.2rem";
  examSection.insertBefore(timerDisplay, progressContainer);

  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      alert("Time's up! The exam will be submitted automatically.");
      endExam(true); // Pass a flag to force submission
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  document.getElementById("timer-display").textContent = `Time Remaining: ${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function endExam(autoSubmit = false) {
  const modal = document.getElementById('confirmationModal');

  if (!autoSubmit) {
    modal.style.display = 'flex';

    // Handle "Yes" button
    document.getElementById('confirmYes').onclick = function () {
      modal.style.display = 'none';
      clearInterval(timerInterval); // Stop the timer

      console.log("Exam submitted!");

      // Calculate results
      const score = answers.filter((ans, i) => ans === questions[i].correct).length;
      const totalQuestions = questions.length;
      const percentage = Math.round((score / totalQuestions) * 100);

      // Save exam history
      const examSession = {
        date: new Date().toLocaleString(),
        questions: questions.map(q => ({
          text: q.text,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation,
        })),
        answers: answers, // User's answers
        score: score,
        totalQuestions: totalQuestions,
        percentage: percentage,
      };

      const examHistory = JSON.parse(localStorage.getItem('examHistory')) || [];
      examHistory.push(examSession);
      localStorage.setItem('examHistory', JSON.stringify(examHistory));

      console.log("Exam session saved:", examSession);

      // Reload history to reflect updates
      displayExamHistory();
    };

    // Handle "No" button
    document.getElementById('confirmNo').onclick = function () {
      modal.style.display = 'none';
      console.log("Submission canceled");
    };

    return; // Prevent further execution
  }

  // Auto-submit logic
  if (autoSubmit) {
    clearInterval(timerInterval);
    console.log("Time's up! Auto-submitting exam...");
    finalizeSubmission();
    return;
  }
}

  
  
function finalizeSubmission() {
    if (!answers || !questions) {
        console.error("Exam data is missing.");
        return;
    }

    const score = answers.filter((ans, i) => ans === questions[i].correct).length;
    const totalQuestions = questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    // Load existing rewards safely
    let userRewards;
    try {
        userRewards = JSON.parse(localStorage.getItem("userRewards")) || {
            timeSpent: 0, timeBonus: 0, examScore: 0, examBonus: 0, totalReward: 0  
        };
    } catch (error) {
        console.error("Error loading user rewards:", error);
        userRewards = { timeSpent: 0, timeBonus: 0, examScore: 0, examBonus: 0, totalReward: 0 };
    }

    // Update Exam Statistics
    userRewards.examScore += score;  // Add this exam's correct answers
    const previousBonus = userRewards.examBonus;
    
    // Award ₦1 per correct answer
    userRewards.examBonus += score * 1;
    
    userRewards.totalReward = userRewards.timeBonus + userRewards.examBonus;

    // Check if new bonus was earned
    const newBonus = userRewards.examBonus - previousBonus;
    if (newBonus > 0) {
        showAnimatedPopup(`🎉 You earned ₦${newBonus} from your exam performance!`);
    }

    // Save updated rewards
    localStorage.setItem("userRewards", JSON.stringify(userRewards));

    // Store exam session history
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

    // Update UI in real-time
    updateRewardUI();
    updateExamResults(score, totalQuestions, percentage);

    console.log("Exam session saved:", examSession);
}

// Update UI Elements
function updateRewardUI() {
    let userRewards = JSON.parse(localStorage.getItem("userRewards")) || {
        timeSpent: 0, timeBonus: 0, examScore: 0, examBonus: 0, totalReward: 0  
    };

    document.getElementById("examBonus").innerText = `₦${userRewards.examBonus}`;
    document.getElementById("timeBonus").innerText = `₦${userRewards.timeBonus}`;
    document.getElementById("totalReward").innerText = `₦${userRewards.totalReward}`;

    // Update progress bar
    document.getElementById("progressFill").style.width = `${Math.min((userRewards.totalReward / 3000) * 100, 100)}%`;
}
// Update Exam Results UI
function updateExamResults(score, totalQuestions, percentage) {
    document.getElementById("examScore").innerText = `Score: ${score}/${totalQuestions}`;
    document.getElementById("examPercentage").innerText = `Percentage: ${percentage}%`;
}
  

// Show a notification popup
function showAnimatedPopup(message) {
    const popup = document.getElementById("rewardPopupMessage");
    popup.innerText = message;
    popup.style.display = "block";
    setTimeout(() => { popup.style.display = "none"; }, 3000);
}

// Ensure UI updates on page load
window.addEventListener("load", updateRewardUI);




function endExam() {
  // Show the modal
  const modal = document.getElementById('confirmationModal');
  modal.style.display = 'flex';
  // Declare variables in outer scope
  let score, totalQuestions, percentage;

  // Handle confirmation buttons
  document.getElementById('confirmYes').onclick = function () {
    modal.style.display = 'none';

    // Calculate results
    score = answers.filter((ans, i) => ans === questions[i].correct).length;
    totalQuestions = questions.length;
    percentage = Math.round((score / totalQuestions) * 100);

    // Save exam history
    const examSession = {
  date: new Date().toLocaleString(),
  questions: questions.map(q => ({
    text: q.text,
    options: q.options,
    correct: q.correct,
    explanation: q.explanation,
  })),
  answers: answers, // User's answers
  score: score,
  totalQuestions: totalQuestions,
  percentage: percentage,
};

const examHistory = JSON.parse(localStorage.getItem('examHistory')) || [];
examHistory.push(examSession);
localStorage.setItem('examHistory', JSON.stringify(examHistory));
console.log("Exam session saved:", examSession);


    // Show results
    showSection(summarySection);
    summaryContent.innerHTML = `
    <h3>Score: ${score}/${totalQuestions} (${percentage}%)</h3>
    <p>${getRemark(percentage)}</p>
    ${questions
      .map(
        (q, i) => `
      <p>
        ${i + 1}. ${q.text.replace(/\n/g, '<br>')} <br>
        Your Answer: <strong> ${q.options[answers[i]] || "Unanswered"} </strong><br><br>
        <strong> Correct Answer: ${q.options[q.correct]} </strong><br><br>
       <strong> Explanation:</strong> ${q.explanation.replace(/\n/g, '<br>')} <br><br><br>
      </p>`
      )
      .join("")}
  `;
}


   function displayExamHistory() {
  const examHistory = JSON.parse(localStorage.getItem('examHistory')) || [];
  const historyContent = document.getElementById('exam-history-content');
  historyContent.innerHTML = ''; // Clear current content

  if (examHistory.length === 0) {
    historyContent.innerHTML = '<p>No exam history available.</p>';
    return;
  }

  examHistory.forEach((session, index) => {
    const sessionDiv = document.createElement('div');
    sessionDiv.classList.add('exam-session');

    // Extract score and percentage, using defaults if missing
    const score = session.score || 0;
    const totalQuestions = session.totalQuestions || 0;
    const percentage = session.percentage || 0;

    const sessionTitle = document.createElement('h3');
    sessionTitle.textContent = `Session ${index + 1} - ${session.date} - Score: ${score}/${totalQuestions} (${percentage}%)`;
    
    sessionTitle.addEventListener('click', () => displaySessionDetails(session));
    sessionDiv.appendChild(sessionTitle);

    historyContent.appendChild(sessionDiv);
  });
}


function displaySessionDetails(session) {
  const historyContent = document.getElementById('exam-history-content');
  historyContent.innerHTML = ''; // Clear current content

  session.questions.forEach((question, qIndex) => {
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('question');

    const questionText = document.createElement('p');
    questionText.innerHTML = `<strong>Q${qIndex + 1}:</strong> ${question.text}`;
    questionDiv.appendChild(questionText);

    const answerText = document.createElement('p');
    const userAnswerIndex = session.answers[qIndex]; // User's selected answer index

    // Check if the user answer exists to prevent errors
    const userAnswer = userAnswerIndex !== undefined ? question.options[userAnswerIndex] : "No answer selected";
    answerText.innerHTML = `<strong>Your Answer:</strong> ${userAnswer}`;
    questionDiv.appendChild(answerText);

    const explanationText = document.createElement('p');
    explanationText.innerHTML = `<strong>Explanation:</strong> ${question.explanation || "No explanation available"}`;
    questionDiv.appendChild(explanationText);

    historyContent.appendChild(questionDiv);
  });

  // Add a "Back to History" button
  const backButton = document.createElement('button');
  backButton.textContent = 'Back to History';
  backButton.addEventListener('click', displayExamHistory);
  backButton.style.marginTop = '20px';
  historyContent.appendChild(backButton);
}

document.addEventListener("DOMContentLoaded", function () {
  const saveToHistoryBtn = document.getElementById("save-to-history-btn");

  if (saveToHistoryBtn) {
    saveToHistoryBtn.addEventListener("click", saveResultsToHistory);
  } else {
    console.error("Save to History button not found.");
  }
});

function saveResultsToHistory() {
  const resultContent = document.getElementById("summarySection");

  if (!resultContent) {
    console.error("Summary content is missing. Cannot save results to history.");
    return;
  }


  // Create an exam session object
  const examSession = {
    date: new Date().toLocaleString(),
    content: resultContent.innerHTML // Save the summary content
  };

  // Retrieve existing exam history from local storage
  const examHistory = JSON.parse(localStorage.getItem("examHistory")) || [];

  // Add the new exam session to the history
  examHistory.push(examSession);

  // Save the updated exam history back to local storage
  localStorage.setItem("examHistory", JSON.stringify(examHistory));

  console.log("Exam history saved:", examHistory);
  alert("Results have been saved to history.");
}

  
document.getElementById('confirmNo').onclick = function () {
    modal.style.display = 'none';
    // Prevent further actions when "No" is clicked
    return;
  };
}


  function shuffleArray(array) {
    return array.sort(() => 0.5 - Math.random()).slice(0.5, 50);
  }

  function getRemark(percentage) {
    if (percentage === 100) return "Excellent! You aced the test!";
    if (percentage >= 75) return "Great job! You did very well.";
    if (percentage >= 50) return "Good effort, but there's room for improvement.";
    return "Keep practicing! You can do better.";
  }
});

// Use debounce to limit frequent state updates
function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function() {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

// Throttle the resize event
window.addEventListener('resize', throttle(function() {
  console.log('Resized!');
}, 1000));

// Throttle the click event for toggling the menu
document.addEventListener('click', throttle(function(event) {
  const sideNav = document.getElementById('sideNav');
  const menuIcon = document.querySelector('.menu-icon');

  if (sideNav.classList.contains('active') &&
      !sideNav.contains(event.target) &&
      !menuIcon.contains(event.target)) {
      sideNav.classList.remove('active');
  }
}, 500));


                                                                                                    
