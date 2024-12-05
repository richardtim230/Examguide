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

  let questions = [];

  let currentQuestionIndex = 0;

  let answers = [];

  let timerInterval = null;

  let timeRemaining = 60; // Set timer duration in seconds

  let selectedCourse = "";

  let subCourseName = "";

  const questionBanks = {

    Mathematics: {

      "MATH101-SET1": {

        title: "Basic Arithmetic",

        questions: [

          {

            text: "What is 2 + 2?",

            options: ["2", "3", "4", "5"],

            correct: 2,

            explanation: "2 + 2 equals 4."

          },

          {

            text: "What is 3 x 3?",

            options: ["6", "9", "12", "15"],

            correct: 1,

            explanation: "3 x 3 equals 9."

          },

        ],

      },

      "MATH101-SET2": {

        title: "Algebra Basics",

        questions: [

          {

            text: "What is the square root of 16?",

            options: ["2", "3", "4", "5"],

            correct: 2,

            explanation: "The square root of 16 is 4."

          },

          {

            text: "What is 10 - 7?",

            options: ["1", "2", "3", "4"],

            correct: 2,

            explanation: "10 - 7 equals 3."

          },

        ],

      },

    },

    Physics: {

      "PHYS101-SET1": {

        title: "Introduction to Mechanics",

        questions: [

          {

            text: "What is the speed of light?",

            options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"],

            correct: 0,

            explanation: "The speed of light is approximately 300,000 km/s."

          },

          {

            text: "What is Newton's Second Law?",

            options: ["F = ma", "E = mc²", "V = IR", "p = mv"],

            correct: 0,

            explanation: "Newton's Second Law is F = ma."

          },

        ],

      },

    },

  };

  // Show only the specified section and hide others

  function showSection(section) {

    [courseSelectionSection, accessCodeSection, examSection, summarySection].forEach(

      (el) => el.classList.add("hidden")

    );

    section.classList.remove("hidden");

  }

  // Event Listener for Course Buttons

  document.querySelectorAll(".course").forEach((button) => {

    button.addEventListener("click", () => {

      selectedCourse = button.dataset.course;

      selectedCourseTitle.textContent = `Enter Access Code for the course under the department of ${selectedCourse}`;

      showSection(accessCodeSection);

    });

  });

  document.getElementById("submit-code").addEventListener("click", () => {

    const code = document.getElementById("access-code").value.trim();

    const courseData = questionBanks[selectedCourse]?.[code];

    if (courseData) {

      questions = courseData.questions;

      subCourseName = courseData.title;

      startExam();

    } else {

      alert("Invalid access code. Please try again.");

    }

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

    // Reset variables and go back to course selection

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

    showSection(summarySection);

    summaryContent.innerHTML = questions

      .map((q, i) => {

        const userAnswer = answers[i];

        const correct = userAnswer === q.correct;

        return `

          <p>

            ${i + 1}. ${q.text} <br>

            Your Answer: ${q.options[userAnswer] || "Unanswered"} <br>

            Correct Answer: ${q.options[q.correct]} <br>

            Explanation: ${q.explanation} <br>

            <span style="color: ${correct ? "green" : "red"}">${

          correct ? "Correct" : "Incorrect"

        }</span>

          </p>

        `;

      })

      .join("");

  }

});