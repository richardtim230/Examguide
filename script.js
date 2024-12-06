
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
      {
  Zoology: {
    "ZOO203": {
      "title": "Advanced Concepts in Genetics",
      "questions": [
        {
          "text": "What is the role of the promoter region in gene expression?",
          "options": [
            "It codes for the protein structure",
            "It serves as a binding site for RNA polymerase",
            "It terminates transcription",
            "It splices introns"
          ],
          "correct": 1,
          "explanation": "The promoter region is a DNA sequence that serves as the binding site for RNA polymerase and transcription factors, initiating transcription."
        },
        {
          "text": "Which of the following is a characteristic of autosomal recessive inheritance?",
          "options": [
            "Affected individuals always have affected parents",
            "Males are more commonly affected",
            "The trait skips generations and is expressed only in homozygotes",
            "The trait is transmitted exclusively through maternal lines"
          ],
          "correct": 2,
          "explanation": "Autosomal recessive inheritance requires an individual to inherit two copies of the mutant allele (one from each parent) for the trait to be expressed."
        },
        {
          "text": "What is the difference between exons and introns in a eukaryotic gene?",
          "options": [
            "Exons are transcribed but not translated, while introns are translated into protein",
            "Exons code for proteins, while introns are non-coding sequences spliced out during mRNA processing",
            "Introns code for functional RNA, while exons are non-functional",
            "Exons are part of prokaryotic genes, while introns are unique to eukaryotic genes"
          ],
          "correct": 1,
          "explanation": "Exons are coding regions that are translated into protein, while introns are non-coding regions removed during RNA splicing."
        },
        {
          "text": "What is the main difference between transcription in prokaryotes and eukaryotes?",
          "options": [
            "Prokaryotes do not require RNA polymerase for transcription",
            "Transcription in prokaryotes occurs in the cytoplasm, while in eukaryotes it occurs in the nucleus",
            "Prokaryotes do not have introns, while eukaryotic genes often contain introns",
            "Both B and C"
          ],
          "correct": 3,
          "explanation": "In prokaryotes, transcription occurs in the cytoplasm as they lack a nucleus, and their genes typically lack introns. In contrast, eukaryotes perform transcription in the nucleus and have introns in their genes."
        },
        {
          "text": "What is the purpose of a test cross in genetics?",
          "options": [
            "To determine the mutation rate in a population",
            "To assess the genotype of an individual with a dominant phenotype",
            "To increase genetic variation",
            "To identify linkage between two genes"
          ],
          "correct": 1,
          "explanation": "A test cross is performed to determine the genotype of an individual with a dominant phenotype by crossing it with a homozygous recessive individual."
        },
        {
          "text": "What is a key feature of mitochondrial inheritance?",
          "options": [
            "It follows Mendel's laws",
            "Only males inherit mitochondrial DNA",
            "Mitochondrial DNA is inherited exclusively from the mother",
            "It exhibits autosomal dominant patterns"
          ],
          "correct": 2,
          "explanation": "Mitochondrial DNA is inherited maternally because the mitochondria in sperm are typically destroyed after fertilization."
        },
        {
          "text": "What are linked genes, and how do they affect inheritance patterns?",
          "options": [
            "Genes located on the same chromosome that do not assort independently",
            "Genes that control the same trait",
            "Genes with mutations that result in non-viable offspring",
            "Genes that are inherited exclusively through sex chromosomes"
          ],
          "correct": 0,
          "explanation": "Linked genes are located close to each other on the same chromosome and are often inherited together because they do not undergo independent assortment."
        },
        {
          "text": "What is the function of a spliceosome?",
          "options": [
            "To catalyze DNA replication",
            "To remove introns and join exons in pre-mRNA",
            "To degrade mRNA after translation",
            "To assist in ribosome assembly"
          ],
          "correct": 1,
          "explanation": "The spliceosome is a complex of proteins and RNA that removes introns from pre-mRNA and joins exons to produce mature mRNA."
        },
        {
          "text": "What is the significance of telomeres in DNA replication?",
          "options": [
            "They increase mutation rates",
            "They protect the ends of chromosomes from degradation",
            "They are sites for ribosome attachment",
            "They serve as origins of replication"
          ],
          "correct": 1,
          "explanation": "Telomeres are repetitive sequences at the ends of chromosomes that prevent DNA degradation and fusion with other chromosomes during replication."
        },
        {
          "text": "What is the role of the lac operon in E. coli?",
          "options": [
            "To produce enzymes for lactose metabolism only when lactose is present",
            "To regulate glucose metabolism",
            "To replicate DNA",
            "To synthesize ribosomal proteins"
          ],
          "correct": 0,
          "explanation": "The lac operon is an inducible system that produces enzymes to metabolize lactose only when lactose is available, conserving resources."
        },
        {
          "text": "What is the outcome of nondisjunction during meiosis?",
          "options": [
            "Chromosomes do not replicate",
            "Gametes receive an abnormal number of chromosomes",
            "Mutations in nucleotide sequences occur",
            "Crossing over fails to occur"
          ],
          "correct": 1,
          "explanation": "Nondisjunction occurs when chromosomes fail to separate properly during meiosis, leading to gametes with abnormal chromosome numbers (e.g., trisomy or monosomy)."
        },
        {
          "text": "What is the function of tRNA in translation?",
          "options": [
            "To carry the genetic code from the nucleus",
            "To catalyze peptide bond formation",
            "To bring amino acids to the ribosome based on mRNA codons",
            "To regulate gene expression"
          ],
          "correct": 2,
          "explanation": "Transfer RNA (tRNA) brings specific amino acids to the ribosome, matching its anticodon to the mRNA codons during protein synthesis."
        },
        {
          "text": "What is epigenetics?",
          "options": [
            "Changes in DNA sequence",
            "Heritable changes in gene expression without altering the DNA sequence",
            "Mutations in mitochondrial DNA",
            "Regulation of genetic traits by the environment"
          ],
          "correct": 1,
          "explanation": "Epigenetics involves heritable changes in gene expression caused by mechanisms such as DNA methylation or histone modification, without altering the DNA sequence."
        },
        {
          "text": "What is a single nucleotide polymorphism (SNP)?",
          "options": [
            "A mutation that occurs in all cells of an organism",
            "A single base change in the DNA sequence that is common in a population",
            "An insertion or deletion mutation",
            "A chromosomal abnormality"
          ],
          "correct": 1,
          "explanation": "SNPs are single base-pair variations in the genome that occur commonly in a population and may affect traits or susceptibility to diseases."
        },
        {
          "text": "What is the function of restriction enzymes in molecular genetics?",
          "options": [
            "To replicate DNA",
            "To cut DNA at specific sequences",
            "To transcribe RNA",
            "To synthesize proteins"
          ],
          "correct": 1,
          "explanation": "Restriction enzymes recognize specific DNA sequences and cut at these sites, enabling molecular techniques like cloning and genetic mapping."
        },
        {
          "text": "What is the role of enhancer sequences in gene regulation?",
          "options": [
            "To increase the rate of transcription by interacting with transcription factors",
            "To inhibit RNA polymerase binding",
            "To terminate transcription",
            "To code for protein synthesis"
          ],
          "correct": 0,
          "explanation": "Enhancer sequences are regulatory DNA elements that increase the rate of transcription by interacting with specific transcription factors and the promoter."
        },
        {
          "text": "What is the relationship between a codon and an amino acid?",
          "options": [
            "Each codon specifies multiple amino acids",
            "Each codon specifies a single amino acid in the genetic code",
            "Codons are not related to amino acids",
            "A single amino acid is coded by overlapping codons"
          ],
          "correct": 1,
          "explanation": "Each codon, a sequence of three nucleotides in mRNA, specifies a single amino acid according to the genetic code."
        },
        {
          "text": "What is the result of a frameshift mutation?",
          "options": [
            "A single base change that does not affect the protein",
            "A shift in the reading frame of the mRNA, altering all downstream codons",
            "The deletion of an entire gene",
            "Duplication of a chromosome"
          ],
          "correct": 1,
          "explanation": "Frameshift mutations occur due to insertions or deletions that shift the reading frame, often resulting in a completely altered protein sequence."
        }
      ]
    }
  }
}

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
