
document.addEventListener("DOMContentLoaded", () => {
  const notificationCenter = document.getElementById("notification-center");
  const closeNotification = document.getElementById("close-notification");

  // Get visit count from localStorage
  let visitCount = parseInt(localStorage.getItem("visitCount")) || 0;

  // Show popup if it's the first visit or every 10th visit
  if (visitCount === 0 || visitCount % 10 === 0) {
    notificationCenter.classList.remove("hidden");
  }

  // Increment visit count and save to localStorage
  localStorage.setItem("visitCount", visitCount + 1);

  // Close popup when "Got it, Start!" button is clicked
  closeNotification.addEventListener("click", () => {
    notificationCenter.classList.add("hidden");
  });
});

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
 }, 
}, 
                          {
  Zoology: {
    "BIO201-SET1": {
      title: "Fundamentals of Animal Systematics",
      questions: [
        {
          text: "What is the primary goal of animal systematics?",
          options: ["To study animal habitats", "To classify and organize animals based on evolutionary relationships", "To monitor animal populations", "To conserve endangered species"],
          correct: 1,
          explanation: "The primary goal of animal systematics is to classify and organize animals based on their evolutionary relationships, helping to understand biodiversity and the tree of life."
        },
        {
          text: "Which of the following is not a hierarchical taxonomic rank?",
          options: ["Phylum", "Order", "Family", "Ecosystem"],
          correct: 3,
          explanation: "Ecosystem is not a taxonomic rank; it refers to a community of interacting organisms and their physical environment."
        },
        {
          text: "Who is known as the 'Father of Taxonomy'?",
          options: ["Charles Darwin", "Carolus Linnaeus", "Aristotle", "Gregor Mendel"],
          correct: 1,
          explanation: "Carolus Linnaeus is known as the 'Father of Taxonomy' for developing the binomial nomenclature system."
        },
        {
          text: "What does the binomial nomenclature consist of?",
          options: ["Family and Order", "Genus and Species", "Class and Phylum", "Kingdom and Domain"],
          correct: 1,
          explanation: "Binomial nomenclature assigns a species a two-part name consisting of its genus and species."
        },
        {
          text: "Which term refers to the evolutionary history of a species?",
          options: ["Taxonomy", "Phylogeny", "Ecology", "Morphology"],
          correct: 1,
          explanation: "Phylogeny refers to the evolutionary history and relationships of a species or group of species."
        },
        {
          text: "What is cladistics primarily used for in animal systematics?",
          options: ["To classify animals based on physical traits", "To build phylogenetic trees based on shared derived characteristics", "To study animal behavior", "To conserve endangered species"],
          correct: 1,
          explanation: "Cladistics classifies organisms based on shared derived characteristics and helps construct phylogenetic trees."
        },
        {
          text: "What type of data is primarily used in molecular systematics?",
          options: ["Behavioral traits", "Fossil records", "Genetic sequences", "Ecological interactions"],
          correct: 2,
          explanation: "Molecular systematics uses genetic sequence data to infer evolutionary relationships among organisms."
        },
        {
          text: "Which of the following is the broadest taxonomic category?",
          options: ["Class", "Phylum", "Kingdom", "Domain"],
          correct: 3,
          explanation: "Domain is the broadest taxonomic category, above Kingdom."
        },
        {
          text: "Which method is used to identify homologous traits?",
          options: ["Morphological comparison", "Genetic analysis", "Both morphological comparison and genetic analysis", "Behavioral studies"],
          correct: 2,
          explanation: "Both morphological comparison and genetic analysis are used to identify homologous traits indicative of common ancestry."
        },
        {
          text: "In cladograms, what does a node represent?",
          options: ["A common ancestor", "A species", "A mutation", "A population"],
          correct: 0,
          explanation: "A node in a cladogram represents a common ancestor of the organisms branching from that point."
        }, 
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
