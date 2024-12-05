document.addEventListener("DOMContentLoaded", () => {
  const courseSelectionSection = document.getElementById("course-selection-section");
  const accessCodeSection = document.getElementById("access-code-section");
  const examSection = document.getElementById("exam-section");
  const summarySection = document.getElementById("summary-section");
  const questionText = document.getElementById("question-text");
  const optionsContainer = document.getElementById("options-container");
  const progressContainer = document.getElementById("progress-container");
  const summaryContent = document.getElementById("summary-content");
  const subjectTitle = document.getElementById("subject-title");
  const selectedCourseTitle = document.getElementById("selected-course-title");
  const cancelButton = document.getElementById("cancel-button");

  let questions = [];
  let currentQuestionIndex = 0;
  let answers = [];
  let timerInterval = null;
  let timeRemaining = 60; // Timer in seconds
  let selectedCourse = "";
  let subCourseName = "";

  const questionBanks = {
    Mathematics: {
      "MATH101-SET1": {
        title: "Basic Arithmetic",
        questions: [
          { text: "What is 2 + 2?", options: ["2", "3", "4", "5"], correct: 2, explanation: "2 + 2 equals 4." },
          { text: "What is 3 x 3?", options: ["6", "9", "12", "15"], correct: 1, explanation: "3 x 3 equals 9." },
        ],
      },
      "MATH101-SET2": {
        title: "Algebra Basics",
        questions: [
          { text: "What is the square root of 16?", options: ["2", "3", "4", "5"], correct: 2, explanation: "The square root of 16 is 4." },
          { text: "What is 10 - 7?", options: ["1", "2", "3", "4"], correct: 2, explanation: "10 - 7 equals 3." },
        ],
      },
    },
  };

  function showSection(section) {
    [courseSelectionSection, accessCodeSection, examSection, summarySection].forEach(
      (el) => el.classList.add("hidden")
    );
    section.classList.remove("hidden");
  }

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
    if (courseData) {
      const storedProgress = JSON.parse(localStorage.getItem(`${selectedCourse}-${code}`)) || [];
      const remainingQuestions = courseData.questions.filter(
        (q, i) => !storedProgress.includes(i)
      );
      if (remainingQuestions.length === 0) {
        alert("You have already completed all questions in this question bank.");
        return;
      }
      questions = shuffleArray(remainingQuestions);
      subCourseName = courseData.title;
      startExam();
    } else {
      alert("Invalid access code. Please try again.");
    }
  });

  cancelButton.addEventListener("click", () => {
    showSection(courseSelectionSection);
  });

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

  document.getElementById("end-exam").addEventListener("click", () => {
    clearInterval(timerInterval);
    endExam();
  });

  document.getElementById("restart-exam").addEventListener("click", () => {
    questions = [];
    answers = [];
    currentQuestionIndex = 0;
    subCourseName = "";
    timeRemaining = 60;
    clearInterval(timerInterval);
    showSection(courseSelectionSection);
  });

  function startExam() {
    subjectTitle.textContent = subCourseName;
    showSection(examSection);
    createProgress();
    updateQuestion();
    startTimer();
  }

  function updateQuestion() {
    const question = questions[currentQuestionIndex];
    questionText.textContent = question.text;
    optionsContainer.innerHTML = "";
    question.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.textContent = option;
      button.addEventListener("click", () => selectAnswer(index));
      button.className = "option-button";
      optionsContainer.appendChild(button);
    });

    document.getElementById("prev-question").disabled = currentQuestionIndex === 0;
    document.getElementById("next-question").disabled =
      currentQuestionIndex === questions.length - 1;
    updateProgress();
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

  function saveAnswer() {
    if (answers[currentQuestionIndex] === undefined) {
      answers[currentQuestionIndex] = null; // Mark unanswered
    }
  }

  function startTimer() {
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
        endExam();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    document.getElementById("timer-display").textContent = `Time Remaining: ${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  function endExam() {
    const score = answers.filter((ans, i) => ans === questions[i].correct).length;
    const totalQuestions = questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    const storedProgress = JSON.parse(localStorage.getItem(`${selectedCourse}-${subCourseName}`)) || [];
    const updatedProgress = [...storedProgress, ...questions.map((_, i) => i)];
    localStorage.setItem(`${selectedCourse}-${subCourseName}`, JSON.stringify(updatedProgress));

    showSection(summarySection);
    summaryContent.innerHTML = `
      <h3>Score: ${score}/${totalQuestions} (${percentage}%)</h3>
      <p>${getRemark(percentage)}</p>
      ${questions
        .map(
          (q, i) => `
        <p>
          ${i + 1}. ${q.text} <br>
          Your Answer: ${q.options[answers[i]] || "Unanswered"} <br>
          Correct Answer: ${q.options[q.correct]} <br>
          Explanation: ${q.explanation} <br>
        </p>`
        )
        .join("")}
    `;
  }

  function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  function getRemark(percentage) {
    if (percentage === 100) return "Excellent! You aced the test!";
    if (percentage >= 75) return "Great job! You did very well.";
    if (percentage >= 50) return "Good effort, but there's room for improvement.";
    return "Keep practicing! You can do better.";
  }
});
