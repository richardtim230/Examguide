document.addEventListener("DOMContentLoaded", () => {
  // Notification Center Logic
  const notificationCenter = document.getElementById("notification-center");
  const closeNotification = document.getElementById("close-notification");

  if (notificationCenter && closeNotification) {
    let visitCount = parseInt(localStorage.getItem("visitCount") || "0", 10);
    if (visitCount === 0 || visitCount % 10 === 0) {
      notificationCenter.classList.remove("hidden");
    }
    localStorage.setItem("visitCount", visitCount + 1);

    closeNotification.addEventListener("click", () => {
      notificationCenter.classList.add("hidden");
    });
  }

  // Course Selection and Exam Logic
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
    },
    Zoology: {
      "SYS101-SET1": {
        title: "Animal Systematics Fundamentals",
        questions: [
          { text: "What is the primary basis for the classification of animals in taxonomy?", options: ["Reproductive methods", "Body structure", "Feeding habits", "Behavior"], correct: 1, explanation: "Body structure is a fundamental criterion used in taxonomy to classify animals." },
        ],
      },

    "BIO301-SET1": {
      title: "Advanced Concepts in Genetics",
      questions: [
        {
          text: "What is the role of the promoter region in gene expression?",
          options: [
            "It codes for the protein structure",
            "It serves as a binding site for RNA polymerase",
            "It terminates transcription",
            "It splices introns"
          ],
          correct: 1,
          explanation: "The promoter region is a DNA sequence that serves as the binding site for RNA polymerase and transcription factors, initiating transcription."
        },
        {
          text: "Which of the following is a characteristic of autosomal recessive inheritance?",
          options: [
            "Affected individuals always have affected parents",
            "Males are more commonly affected",
            "The trait skips generations and is expressed only in homozygotes",
            "The trait is transmitted exclusively through maternal lines"
          ],
          correct: 2,
          explanation: "Autosomal recessive inheritance requires an individual to inherit two copies of the mutant allele (one from each parent) for the trait to be expressed."
        },
        {
          text: "What is the difference between exons and introns in a eukaryotic gene?",
          options: [
            "Exons are transcribed but not translated, while introns are translated into protein",
            "Exons code for proteins, while introns are non-coding sequences spliced out during mRNA processing",
            "Introns code for functional RNA, while exons are non-functional",
            "Exons are part of prokaryotic genes, while introns are unique to eukaryotic genes"
          ],
          correct: 1,
          explanation: "Exons are coding regions that are translated into protein, while introns are non-coding regions removed during RNA splicing."
        },
        {
          text: "What is the main difference between transcription in prokaryotes and eukaryotes?",
          options: [
            "Prokaryotes do not require RNA polymerase for transcription",
            "Transcription in prokaryotes occurs in the cytoplasm, while in eukaryotes it occurs in the nucleus",
            "Prokaryotes do not have introns, while eukaryotic genes often contain introns",
            "Both B and C"
          ],
          correct: 3,
          explanation: "In prokaryotes, transcription occurs in the cytoplasm as they lack a nucleus, and their genes typically lack introns. In contrast, eukaryotes perform transcription in the nucleus and have introns in their genes."
        },
        {
          text: "What is the purpose of a test cross in genetics?",
          options: [
            "To determine the mutation rate in a population",
            "To assess the genotype of an individual with a dominant phenotype",
            "To increase genetic variation",
            "To identify linkage between two genes"
          ],
          correct: 1,
          explanation: "A test cross is performed to determine the genotype of an individual with a dominant phenotype by crossing it with a homozygous recessive individual."
        }, 
        // Add more Genetics questions here...
      ]
    }
  },
  Animal_Systematics: {
    "BIO201-SET1": {
      title: "Fundamentals of Animal Systematics",
      questions: [
        {
          text: "What is the primary goal of animal systematics?",
          options: [
            "To study animal habitats",
            "To classify and organize animals based on evolutionary relationships",
            "To monitor animal populations",
            "To conserve endangered species"
          ],
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
        }
        // Add more Animal Systematics questions here...
      ]
    }
  }, 

    { Botany = {
  "BOT101": {
    title: "Cell Division Basics",
    questions: [
      {
        text: "A rough idea of cell division was given by:",
        options: ["Hofmeister", "Von Mohl", "Flemmings", "Weismann"],
        correct: 1,
        explanation: "Hugo von Mohl was one of the early scientists to provide insights into cell division processes."
      },
      {
        text: "Who described the cell division first?",
        options: ["Hofmeister", "Hugo Von Mohl", "Weismann", "W. Flemmings"],
        correct: 1,
        explanation: "Hugo von Mohl first described the process of cell division in plant cells."
      },
      {
        text: "Who used the word 'karyokinesis' for cell division?",
        options: ["Hugo Von Mohl", "Weismann", "W. Flemmings", "None of these"],
        correct: 2,
        explanation: "W. Flemming introduced the term 'karyokinesis' to describe nuclear division."
      },
      {
        text: "Word 'mitosis' was coined by:",
        options: ["Hofmeister", "Weismann", "W. Flemmings", "Strasburger"],
        correct: 3,
        explanation: "Eduard Strasburger coined the term 'mitosis' to describe the process of cell division."
      },
      {
        text: "Cell division in plants was described first by:",
        options: ["Strasburger", "Hofmeister", "Weismann", "None of these"],
        correct: 0,
        explanation: "Strasburger detailed cell division in plant cells."
      },
      {
        text: "Who observed first that the reproductive cells have different division than somatic cells?",
        options: ["Weismann", "Hofmeister", "Flemmings", "Sutton"],
        correct: 0,
        explanation: "August Weismann observed the distinct process of division in reproductive cells (meiosis)."
      },
      {
        text: "Sutton emphasized:",
        options: [
          "Importance of cell division in heredity",
          "That reproductive cells divide differently than somatic cells",
          "Cells come from pre-existing cells",
          "None of these"
        ],
        correct: 0,
        explanation: "Sutton correlated the behavior of chromosomes during meiosis with inheritance patterns."
      },
      {
        text: "Importance of cell division in heredity was emphasized by:",
        options: ["Sutton", "Weismann", "Flemmings", "None of these"],
        correct: 1,
        explanation: "Weismann linked cell division to the transmission of hereditary information."
      },
      {
        text: "Strasburger observed:",
        options: ["Mitosis", "Meiosis", "Cell division in plants", "None of these"],
        correct: 2,
        explanation: "Strasburger's work focused on mitosis and cell division in plants."
      },
      {
        text: "Meiosis was termed by:",
        options: [
          "J.B. Farmer and Moore",
          "Hofmeister and Flemmings",
          "Hugo Von Mohl and Strasburger",
          "None of these"
        ],
        correct: 0,
        explanation: "J.B. Farmer and Moore coined the term 'meiosis.'"
      },
      {
        text: "Cell division in eukaryotic cells involves:",
        options: ["Karyokinesis only", "Cytokinesis only", "Both (a) & (b)", "None of these"],
        correct: 2,
        explanation: "Eukaryotic cell division includes both karyokinesis (nuclear division) and cytokinesis (cytoplasmic division)."
      },
      {
        text: "Cell division in animal cells occur by:",
        options: ["Amitosis", "Mitosis", "Meiosis", "All these methods"],
        correct: 3,
        explanation: "Animal cells can divide by amitosis, mitosis, or meiosis depending on the context."
      },
      {
        text: "During amitotic cell division in animals, there is:",
        options: [
          "Only elongation of nucleus and subsequent division into two daughter cells",
          "Reduction in the number of chromosomes in the daughter cells",
          "Breaking into two nuclei",
          "None of these"
        ],
        correct: 0,
        explanation: "Amitosis is a simpler division process without chromosomal segregation."
      },
      {
        text: "Mitosis occurs only in:",
        options: ["Somatic cells", "Reproductive cells", "Both (a) & (b)", "None of these"],
        correct: 0,
        explanation: "Mitosis typically occurs in somatic cells for growth and repair."
      },
      {
        text: "Prophase in mitosis is characterized by which of these events:",
        options: [
          "Nucleus starts disappearing",
          "Chromatin material changes into chromosomes",
          "Nucleolus starts disintegrating",
          "All of these"
        ],
        correct: 3,
        explanation: "Prophase involves chromatin condensation, nuclear membrane disappearance, and nucleolus disintegration."
      },
      {
        text: "Spindle is formed during cell division by:",
        options: ["Centrioles and astral rays", "Nucleus", "Both (a) & (b)", "None of these"],
        correct: 0,
        explanation: "Spindle formation is facilitated by centrioles and astral microtubules."
      },
      {
        text: "Mitosis is a process of cell division during which there is:",
        options: [
          "Distribution of same number at the end of the process",
          "Reduction in the number of chromosomes at the end",
          "Change in chromosomal number",
          "None of these"
        ],
        correct: 0,
        explanation: "Mitosis ensures the equal distribution of chromosomes to daughter cells."
      },
      {
        text: "Mitotic cell division results in the:",
        options: [
          "Reduction in chromosomal number",
          "Increase in chromosomal number",
          "No change in chromosomal number",
          "Doubling of cell columns"
        ],
        correct: 2,
        explanation: "Mitosis maintains the chromosome number in daughter cells."
      }, 
      {
        text: "Meiosis differs from mitosis because in it:",
        options: [
          "Homologous chromosomes pair and exchange segments",
          "Chromosomal number is halved",
          "The four daughter nuclei formed are haploid",
          "All of these"
        ],
        correct: 3,
        explanation: "Meiosis is characterized by pairing of homologous chromosomes, halving of the chromosome number, and the formation of haploid daughter cells."
      },
      {
        text: "Separation of chromatids and their movement to opposite poles of the spindle occurs in which of these phases:",
        options: ["Prophase", "Metaphase", "Anaphase", "Telophase"],
        correct: 2,
        explanation: "Anaphase is marked by the separation of sister chromatids towards opposite poles."
      },
      {
        text: "How many mitotic divisions are required to make 256 daughter nuclei:",
        options: ["8", "64", "32", "16"],
        correct: 0,
        explanation: "Each mitotic division doubles the number of cells. To produce 256 nuclei, 2^8 = 256, so 8 divisions are required."
      },
      {
        text: "Which of these plays important role in cell division in animal cells:",
        options: ["Centriole", "Mitochondria", "Golgi complex", "None of these"],
        correct: 0,
        explanation: "Centrioles play a critical role in forming the spindle apparatus during mitosis."
      },
      {
        text: "Chromosomes during metaphase:",
        options: [
          "Occupy equatorial position",
          "Are not yet ready to divide",
          "Assemble at one end of spindle",
          "Occupy any place in spindle"
        ],
        correct: 0,
        explanation: "In metaphase, chromosomes align at the equatorial plate of the spindle."
      },
      {
        text: "Movement of chromosomes during anaphase is:",
        options: [
          "Dependent on association of spindle fibres with kinetochore",
          "Independent of spindle fibres",
          "Due to streaming of cytoplasm",
          "Due to excess of ATP formed in microtubules"
        ],
        correct: 0,
        explanation: "Chromosomal movement during anaphase is facilitated by the interaction of spindle fibers with the kinetochores."
      },
      {
        text: "Chromosomes are composed of:",
        options: ["DNA only", "Proteins only", "DNA + Proteins", "RNA only"],
        correct: 2,
        explanation: "Chromosomes consist of DNA molecules wrapped around proteins (mainly histones)."
      },
      {
        text: "For mitotic division the DNA is:",
        options: [
          "Left unaffected",
          "Reduced to half",
          "Replicated",
          "Reduced in chromosomal number"
        ],
        correct: 2,
        explanation: "During the S phase of interphase, DNA is replicated to ensure each daughter cell receives an identical copy."
      },
      {
        text: "Some of microtubules of spindle attaching to centromeres of chromosomes are called:",
        options: ["Chromosomal fibres", "Continuous fibres", "Interchromosomal fibres", "None of these"],
        correct: 0,
        explanation: "Chromosomal fibers connect the spindle apparatus to the centromeres of chromosomes."
      },
      {
        text: "Continuous fibres in spindle are those which connect:",
        options: [
          "One centriole with other and attached pole",
          "Centromeres of chromosomes with spindle",
          "Centrioles with spindle and also the poles",
          "None of these"
        ],
        correct: 0,
        explanation: "Continuous fibers span between the poles of the spindle and help maintain its structure."
      },
      {
        text: "Some microtubules in spindle which remain attached to spindle and also to the poles are called:",
        options: [
          "Continuous fibres",
          "Chromosomal fibres",
          "Interchromosomal fibres",
          "None of these"
        ],
        correct: 0,
        explanation: "Continuous fibers are the spindle microtubules that connect the spindle poles."
      },
      {
        text: "Which of these changes mark the telophase in mitosis:",
        options: [
          "Chromosomes start reaching poles and become thread like",
          "Nucleolus start reappearing and nuclear membrane reappears",
          "Both of these",
          "None of these"
        ],
        correct: 2,
        explanation: "Telophase is marked by chromosomes decondensing, the nuclear envelope reassembling, and the nucleolus reappearing."
      }, 

{
        text: "Cytokinesis in animal cells occurs through:",
        options: [
          "Formation of cell plate",
          "Cleavage furrow formation",
          "Both (a) and (b)",
          "None of these"
        ],
        correct: 1,
        explanation: "In animal cells, cytokinesis involves the formation of a cleavage furrow, which divides the cytoplasm."
      },
      {
        text: "The centromere is important during mitosis because:",
        options: [
          "It serves as the point of attachment for spindle fibers",
          "It stores genetic material",
          "It synthesizes ATP",
          "It forms the cell membrane"
        ],
        correct: 0,
        explanation: "The centromere is the attachment site for spindle fibers, ensuring proper chromosome segregation."
      },
      {
        text: "The primary function of mitosis is:",
        options: [
          "To produce genetically identical cells",
          "To reduce chromosome number",
          "To increase genetic variation",
          "To eliminate mutations"
        ],
        correct: 0,
        explanation: "Mitosis produces two genetically identical daughter cells, maintaining chromosome number."
      },
      {
        text: "Which organelle is crucial for spindle formation in animal cells?",
        options: ["Nucleus", "Golgi apparatus", "Centriole", "Mitochondria"],
        correct: 2,
        explanation: "Centriole is essential for organizing the spindle apparatus in animal cells."
      },
      {
        text: "Meiosis is important because it:",
        options: [
          "Produces haploid gametes",
          "Introduces genetic variation",
          "Reduces chromosome number",
          "All of these"
        ],
        correct: 3,
        explanation: "Meiosis ensures haploid gamete formation, reduces chromosome number, and introduces genetic variation."
      },
      {
        text: "Which phase of meiosis involves crossing over?",
        options: ["Prophase I", "Metaphase I", "Anaphase I", "Telophase I"],
        correct: 0,
        explanation: "Crossing over occurs during Prophase I when homologous chromosomes exchange genetic material."
      },
      {
        text: "During metaphase of mitosis:",
        options: [
          "Chromosomes align along the equatorial plate",
          "Nuclear membrane reforms",
          "Chromosomes condense",
          "Cytoplasm divides"
        ],
        correct: 0,
        explanation: "In metaphase, chromosomes align at the cell's equatorial plate for proper segregation."
      },
      {
        text: "Spindle fibers are primarily composed of:",
        options: ["Actin filaments", "Microtubules", "Intermediate filaments", "Collagen"],
        correct: 1,
        explanation: "Spindle fibers are made of microtubules, which play a role in chromosome movement."
      },
      {
        text: "How many daughter cells are produced at the end of meiosis?",
        options: ["2", "4", "8", "16"],
        correct: 1,
        explanation: "Meiosis produces four haploid daughter cells from a single diploid parent cell."
      },
      {
        text: "Which stage of mitosis is characterized by the complete separation of chromatids?",
        options: ["Prophase", "Metaphase", "Anaphase", "Telophase"],
        correct: 2,
        explanation: "Anaphase involves the separation of chromatids as they move to opposite poles."
      },
      {
        text: "In plant cells, cytokinesis occurs through:",
        options: [
          "Cleavage furrow formation",
          "Cell plate formation",
          "Both (a) and (b)",
          "None of these"
        ],
        correct: 1,
        explanation: "Plant cells divide by forming a cell plate, which becomes the new cell wall."
      },
      {
        text: "Chromosome number is halved during:",
        options: ["Mitosis", "Meiosis I", "Meiosis II", "None of these"],
        correct: 1,
        explanation: "Chromosome number is halved during Meiosis I as homologous chromosomes are separated."
      },
      {
        text: "Genetic recombination during meiosis occurs because of:",
        options: [
          "Crossing over",
          "Independent assortment",
          "Both (a) and (b)",
          "None of these"
        ],
        correct: 2,
        explanation: "Crossing over and independent assortment contribute to genetic diversity during meiosis."
      },
      {
        text: "Which phase of the cell cycle involves DNA replication?",
        options: ["G1 phase", "S phase", "G2 phase", "M phase"],
        correct: 1,
        explanation: "DNA replication occurs during the S phase of the cell cycle."
      },
      {
        text: "The term 'synapsis' refers to:",
        options: [
          "The separation of sister chromatids",
          "The pairing of homologous chromosomes",
          "The formation of spindle fibers",
          "The division of cytoplasm"
        ],
        correct: 1,
        explanation: "Synapsis is the pairing of homologous chromosomes during Prophase I of meiosis."
      },
      {
        text: "Which phase of mitosis involves the reformation of the nuclear envelope?",
        options: ["Prophase", "Metaphase", "Anaphase", "Telophase"],
        correct: 3,
        explanation: "In Telophase, the nuclear envelope reforms around the separated chromatids."
      },
      {
        text: "Chromosomes first become visible during which phase of mitosis?",
        options: ["Prophase", "Metaphase", "Anaphase", "Telophase"],
        correct: 0,
        explanation: "Chromosomes condense and become visible during Prophase."
      },
      {
        text: "The structure that holds sister chromatids together is called:",
        options: ["Centromere", "Spindle", "Telomere", "Chromatin"],
        correct: 0,
        explanation: "The centromere connects sister chromatids until they are separated during mitosis."
      },
      {
        text: "In which type of cell division does independent assortment occur?",
        options: ["Mitosis", "Meiosis", "Both (a) and (b)", "None of these"],
        correct: 1,
        explanation: "Independent assortment occurs during meiosis, contributing to genetic variation."
      },
      {
        text: "The spindle apparatus attaches to chromosomes at the:",
        options: ["Centromere", "Telomere", "Kinetochore", "Chromatin"],
        correct: 2,
        explanation: "Spindle fibers attach to chromosomes at the kinetochore, a protein structure on the centromere."
      },
      {
        text: "Which of these processes does not occur during interphase?",
        options: [
          "DNA replication",
          "Organelle duplication",
          "Chromosome condensation",
          "Protein synthesis"
        ],
        correct: 2,
        explanation: "Chromosome condensation occurs during Prophase, not interphase."
      },
      {
        text: "Which event is unique to meiosis but not mitosis?",
        options: [
          "Chromosome alignment at the equatorial plate",
          "Separation of chromatids",
          "Formation of a synaptonemal complex",
          "Cytokinesis"
        ],
        correct: 2,
        explanation: "The synaptonemal complex forms during meiosis to facilitate homologous recombination."
      },
      {
        text: "What is the ploidy level of cells at the end of meiosis I?",
        options: ["Diploid", "Haploid", "Tetraploid", "None of these"],
        correct: 1,
        explanation: "Cells are haploid at the end of meiosis I because homologous chromosomes are separated."
      },
      {
        text: "During which stage of meiosis do homologous chromosomes separate?",
        options: ["Prophase I", "Metaphase I", "Anaphase I", "Telophase I"],
        correct: 2,
        explanation: "Homologous chromosomes separate during Anaphase I of meiosis."
      },
      {
        text: "Which cell cycle checkpoint ensures proper DNA replication?",
        options: ["G1 checkpoint", "S checkpoint", "G2 checkpoint", "M checkpoint"],
        correct: 2,
        explanation: "The G2 checkpoint ensures that DNA has been accurately replicated before mitosis begins."
      },
      {
        text: "The longest phase of the cell cycle is:",
        options: ["G1 phase", "S phase", "G2 phase", "M phase"],
        correct: 0,
        explanation: "G1 is typically the longest phase, as cells grow and prepare for DNA replication."
      },
      {
        text: "A tetrad is formed during which stage of meiosis?",
        options: ["Prophase I", "Metaphase I", "Anaphase I", "Telophase I"],
        correct: 0,
        explanation: "A tetrad, consisting of four chromatids, forms during Prophase I when homologous chromosomes pair."
      },
      {
        text: "During which phase of mitosis do chromosomes decondense?",
        options: ["Prophase", "Metaphase", "Anaphase", "Telophase"],
        correct: 3,
        explanation: "Chromosomes decondense and return to a less compact state during Telophase."
      },
      {
        text: "Which protein is involved in the regulation of the cell cycle?",
        options: ["Actin", "Tubulin", "Cyclin", "Keratin"],
        correct: 2,
        explanation: "Cyclins regulate the progression of the cell cycle by activating cyclin-dependent kinases."
      }
    ]
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

  document.getElementById("submit-code").addEventListener("click", () => {
    const code = document.getElementById("access-code").value.trim();
    const courseData = questionBanks[selectedCourse]?.[code];

    if (!courseData) {
      alert("Invalid access code. Please try again.");
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
    document.getElementById("next-question").disabled = currentQuestionIndex === questions.length - 1;
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
    document.getElementById("timer-display").textContent = `Time Remaining: ${minutes}:${seconds.toString().padStart(2, "0")}`;
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
