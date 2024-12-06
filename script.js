
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
  "SYS101-SET1": {
    title: "Animal Systematics Fundamentals",
    questions: [
      {
        text: "What is the primary basis for the classification of animals in taxonomy?",
        options: ["Reproductive methods", "Body structure", "Feeding habits", "Behavior"],
        correct: 1,
        explanation: "Body structure is a fundamental criterion used in taxonomy to classify animals, as it provides insights into evolutionary relationships."
      },
      {
        text: "Which kingdom do animals belong to?",
        options: ["Plantae", "Fungi", "Animalia", "Protista"],
        correct: 2,
        explanation: "Animals belong to the kingdom Animalia, which includes multicellular, eukaryotic organisms that are typically heterotrophic."
      },
      {
        text: "What is binomial nomenclature?",
        options: ["A system of naming species with one word", "A system of naming species with two words", "A system of assigning numbers to species", "A classification of only plants"],
        correct: 1,
        explanation: "Binomial nomenclature is a system of naming species with two words: the genus and species names, introduced by Carl Linnaeus."
      },
      {
        text: "Which of the following is an example of a scientific name?",
        options: ["Dog", "Homo sapiens", "Cat", "Horse"],
        correct: 1,
        explanation: "Homo sapiens is the scientific name for humans, written in binomial nomenclature with the genus (Homo) capitalized and species (sapiens) in lowercase."
      },
      {
        text: "What is the highest taxonomic rank in the classification hierarchy?",
        options: ["Kingdom", "Domain", "Phylum", "Class"],
        correct: 1,
        explanation: "Domain is the highest rank in the taxonomic hierarchy, which includes Archaea, Bacteria, and Eukarya."
      },
      {
        text: "In which phylum are sponges classified?",
        options: ["Cnidaria", "Porifera", "Mollusca", "Echinodermata"],
        correct: 1,
        explanation: "Sponges are classified in the phylum Porifera, characterized by their porous bodies and lack of true tissues."
      },
      {
        text: "What does the term 'taxonomy' refer to?",
        options: ["Study of animal behavior", "Study of classification", "Study of reproduction", "Study of habitats"],
        correct: 1,
        explanation: "Taxonomy is the study of the principles of classification, organizing organisms based on their relationships."
      },
      {
        text: "Which group of animals is characterized by a notochord, dorsal nerve cord, and pharyngeal slits at some stage in life?",
        options: ["Arthropoda", "Chordata", "Mollusca", "Cnidaria"],
        correct: 1,
        explanation: "Chordata is the phylum characterized by the presence of a notochord, dorsal nerve cord, and pharyngeal slits at some stage of development."
      },
      {
        text: "Which of the following is an arthropod?",
        options: ["Earthworm", "Crab", "Shark", "Frog"],
        correct: 1,
        explanation: "Crabs are arthropods, belonging to the phylum Arthropoda, which is characterized by segmented bodies, jointed appendages, and exoskeletons."
      },
      {
        text: "What is the primary feature of mammals that distinguishes them from other vertebrates?",
        options: ["Cold-blooded", "Lays eggs", "Hair or fur", "No backbone"],
        correct: 2,
        explanation: "Mammals are distinguished by the presence of hair or fur and mammary glands that produce milk."
      },
      {
        text: "What does 'phylogenetics' study?",
        options: ["Reproductive systems", "Evolutionary relationships", "Animal habitats", "Animal diets"],
        correct: 1,
        explanation: "Phylogenetics studies the evolutionary relationships among species, often depicted as a phylogenetic tree."
      },
      {
        text: "Which group of animals is known as 'amphibians'?",
        options: ["Reptiles", "Frogs and salamanders", "Birds", "Mammals"],
        correct: 1,
        explanation: "Frogs and salamanders are amphibians, which can live both in water and on land during different stages of their life."
      },
      {
        text: "Which class of vertebrates is known for having feathers?",
        options: ["Mammals", "Birds", "Reptiles", "Amphibians"],
        correct: 1,
        explanation: "Birds belong to the class Aves and are characterized by feathers, which are unique to this class."
      },
      {
        text: "What is the defining feature of animals in the phylum Cnidaria?",
        options: ["Segmented bodies", "Radial symmetry and stinging cells", "Bilateral symmetry", "Exoskeletons"],
        correct: 1,
        explanation: "Cnidarians have radial symmetry and specialized stinging cells called cnidocytes, used for capturing prey."
      },
      {
        text: "What is the correct order of the taxonomic hierarchy from highest to lowest?",
        options: [
          "Domain, Kingdom, Phylum, Class, Order, Family, Genus, Species",
          "Kingdom, Domain, Phylum, Class, Order, Family, Genus, Species",
          "Domain, Phylum, Kingdom, Class, Family, Genus, Species, Order",
          "Domain, Kingdom, Class, Phylum, Order, Genus, Family, Species"
        ],
        correct: 0,
        explanation: "The taxonomic hierarchy is Domain, Kingdom, Phylum, Class, Order, Family, Genus, Species."
      },
      {
        text: "Which phylum includes animals with jointed appendages?",
        options: ["Mollusca", "Annelida", "Arthropoda", "Echinodermata"],
        correct: 2,
        explanation: "Arthropoda includes animals with jointed appendages, segmented bodies, and exoskeletons."
      },
      {
        text: "Which group of animals lays amniotic eggs?",
        options: ["Amphibians", "Reptiles and birds", "Fish", "Cnidarians"],
        correct: 1,
        explanation: "Reptiles and birds lay amniotic eggs, which have a protective shell and membranes for embryo development."
            },
      {
        text: "What term describes animals without backbones?",
        options: ["Chordates", "Vertebrates", "Invertebrates", "Mammals"],
        correct: 2,
        explanation: "Animals without backbones are called invertebrates, which include arthropods, mollusks, and cnidarians."
      },
      {
        text: "Which phylum includes soft-bodied animals often protected by a shell?",
        options: ["Porifera", "Mollusca", "Annelida", "Arthropoda"],
        correct: 1,
        explanation: "Mollusca includes soft-bodied animals like snails, clams, and octopuses, often protected by a calcium carbonate shell."
      },
      {
        text: "Which term refers to animals that can regulate their body temperature internally?",
        options: ["Ectothermic", "Endothermic", "Poikilothermic", "Cold-blooded"],
        correct: 1,
        explanation: "Endothermic animals, like mammals and birds, can regulate their body temperature through internal processes."
      },
      {
        text: "Which of the following is a defining characteristic of reptiles?",
        options: ["Moist skin", "Scales", "Feathers", "Fur"],
        correct: 1,
        explanation: "Reptiles have scales, which help prevent water loss and protect them from the environment."
      },
      {
        text: "What is the main function of the notochord in chordates?",
        options: [
          "Aiding in digestion",
          "Providing structural support",
          "Assisting in reproduction",
          "Facilitating respiration"
        ],
        correct: 1,
        explanation: "The notochord provides structural support and serves as the main axis of the body in chordates during early development."
      },
      {
        text: "Which of the following is an example of an echinoderm?",
        options: ["Jellyfish", "Starfish", "Octopus", "Lobster"],
        correct: 1,
        explanation: "Starfish belong to the phylum Echinodermata, characterized by radial symmetry and a water vascular system."
      },
      {
        text: "What type of body symmetry do annelids exhibit?",
        options: ["Asymmetry", "Radial symmetry", "Bilateral symmetry", "None of the above"],
        correct: 2,
        explanation: "Annelids, like earthworms, exhibit bilateral symmetry, meaning their body can be divided into mirror-image halves."
      },
      {
        text: "Which group of animals undergoes metamorphosis during development?",
        options: ["Reptiles", "Birds", "Amphibians", "Mammals"],
        correct: 2,
        explanation: "Amphibians undergo metamorphosis, transitioning from aquatic larvae (e.g., tadpoles) to terrestrial adults."
      },
      {
        text: "What distinguishes vertebrates from invertebrates?",
        options: ["Presence of jointed appendages", "Having a backbone", "Radial symmetry", "Soft bodies"],
        correct: 1,
        explanation: "Vertebrates are distinguished by the presence of a backbone, which protects the spinal cord."
      },
      {
        text: "Which phylum includes animals with a segmented body plan and a coelom?",
        options: ["Mollusca", "Annelida", "Arthropoda", "Echinodermata"],
        correct: 1,
        explanation: "Annelida includes segmented worms like earthworms and leeches, which have a coelom (body cavity)."
      },
      {
        text: "Which characteristic is unique to animals in the class Mammalia?",
        options: ["Laying eggs", "Possessing mammary glands", "Being ectothermic", "Having scales"],
        correct: 1,
        explanation: "Mammals are characterized by mammary glands that produce milk to nourish their young."
      },
      {
        text: "Which phylum includes organisms with a water vascular system?",
        options: ["Porifera", "Cnidaria", "Echinodermata", "Mollusca"],
        correct: 2,
        explanation: "Echinoderms, such as starfish and sea urchins, have a water vascular system used for movement and feeding."
      },
      {
        text: "Which group of animals has a cartilaginous skeleton?",
        options: ["Amphibians", "Sharks", "Bony fish", "Mammals"],
        correct: 1,
        explanation: "Sharks and rays belong to the class Chondrichthyes, characterized by a cartilaginous skeleton instead of bone."
      },
      {
        text: "Which of the following animals is classified under the phylum Platyhelminthes?",
        options: ["Roundworm", "Flatworm", "Earthworm", "Leech"],
        correct: 1,
        explanation: "Flatworms belong to the phylum Platyhelminthes, which includes planarians, tapeworms, and flukes."
      },
      {
        text: "Which group of animals is capable of flight and lays hard-shelled eggs?",
        options: ["Birds", "Reptiles", "Insects", "Mammals"],
        correct: 0,
        explanation: "Birds are capable of flight (in most species) and lay hard-shelled eggs to protect their embryos."
      },
      {
        text: "What is the function of cnidocytes in cnidarians?",
        options: ["Locomotion", "Digestion", "Capturing prey", "Respiration"],
        correct: 2,
        explanation: "Cnidocytes are specialized stinging cells in cnidarians used for capturing prey and defense."
      },
      {
        text: "Which of the following is an example of an endothermic animal?",
        options: ["Frog", "Shark", "Eagle", "Crab"],
        correct: 2,
        explanation: "Eagles are endothermic animals, meaning they regulate their body temperature internally."
      },
      {
        text: "Which class of vertebrates is characterized by dry, scaly skin?",
        options: ["Amphibians", "Reptiles", "Birds", "Mammals"],
        correct: 1,
        explanation: "Reptiles are characterized by dry, scaly skin, which helps retain moisture in terrestrial environments."
      },
      {
        text: "Which phylum includes animals that possess an exoskeleton made of chitin?",
        options: ["Annelida", "Arthropoda", "Mollusca", "Cnidaria"],
        correct: 1,
        explanation: "Arthropods, such as insects, spiders, and crustaceans, have an exoskeleton made of chitin for protection and support."
      }
    ],
  },
}


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
