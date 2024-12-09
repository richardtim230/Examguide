// Predefined access codes with validity periods in days
const accessCodes = [
    { code: 'CODE123', validity: 7 },
    { code: 'CODE456', validity: 14 },
    { code: 'CODE789', validity: 30 },
    { code: 'CODE101', validity: 10 },
    { code: 'CODE202', validity: 20 },
    { code: 'CODE303', validity: 5 },
    { code: 'CODE404', validity: 15 },
    { code: 'CODE505', validity: 25 },
    { code: 'CODE606', validity: 12 },
    { code: 'CODE707', validity: 21 },
    { code: 'CODE808', validity: 8 },
    { code: 'CODE909', validity: 18 },
    { code: 'CODE111', validity: 6 },
    { code: 'CODE222', validity: 9 },
    { code: 'CODE333', validity: 19 },
    { code: 'CODE444', validity: 11 },
    { code: 'CODE555', validity: 13 },
    { code: 'CODE666', validity: 23 },
    { code: 'CODE777', validity: 17 },
    { code: 'CODE888', validity: 16 },
];

// DOM Elements
const loginContainer = document.getElementById('loginContainer');
const registerContainer = document.getElementById('registerContainer');
const recoverContainer = document.getElementById('recoverContainer');

const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const recoverBtn = document.getElementById('recoverBtn');

const goToRegister = document.getElementById('goToRegister');
const goToLogin = document.getElementById('goToLogin');
const forgotPassword = document.getElementById('forgotPassword');
const backToLogin = document.getElementById('backToLogin');

// Helper function to check access code validity
function isValidAccessCode(code, username) {
    const storedCodes = JSON.parse(localStorage.getItem('usedAccessCodes')) || {};
    const currentDate = new Date();

    if (storedCodes[code]) {
        const { expiry, users } = storedCodes[code];
        if (users.includes(username)) return false; // Code already used by this user
        if (new Date(expiry) < currentDate) return false; // Code expired
    }

    return accessCodes.some((item) => item.code === code);
}

// Helper function to activate access code
function activateAccessCode(code, username) {
    const currentDate = new Date();
    const codeDetails = accessCodes.find((item) => item.code === code);
    const expiryDate = new Date(currentDate.setDate(currentDate.getDate() + codeDetails.validity));

    let storedCodes = JSON.parse(localStorage.getItem('usedAccessCodes')) || {};
    if (!storedCodes[code]) {
        storedCodes[code] = { expiry: expiryDate, users: [] };
    }
    storedCodes[code].users.push(username);

    localStorage.setItem('usedAccessCodes', JSON.stringify(storedCodes));
}

// Toggle between sections
goToRegister.addEventListener('click', () => {
    loginContainer.classList.add('hidden');
    registerContainer.classList.remove('hidden');
});

goToLogin.addEventListener('click', () => {
    registerContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
});

forgotPassword.addEventListener('click', () => {
    loginContainer.classList.add('hidden');
    recoverContainer.classList.remove('hidden');
});

backToLogin.addEventListener('click', () => {
    recoverContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
});

// User registration
registerBtn.addEventListener('click', () => {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const question = document.getElementById('securityQuestion').value;
    const answer = document.getElementById('securityAnswer').value;
    const accessCode = document.getElementById('accessCode').value;

    if (!isValidAccessCode(accessCode, username)) {
        alert('Invalid or expired access code!');
        return;
    }

    if (localStorage.getItem(username)) {
        alert('User already exists!');
    } else {
        activateAccessCode(accessCode, username);
        localStorage.setItem(username, JSON.stringify({ password, question, answer }));
        alert('Registration successful! Please log in.');
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    }
});

// User login
loginBtn.addEventListener('click', () => {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const user = JSON.parse(localStorage.getItem(username));

    if (user && user.password === password) {
        alert('Login successful!');
        document.getElementById('overlay').classList.add('hidden');
    } else {
        alert('Invalid username or password!');
    }
});

// Password recovery
recoverBtn.addEventListener('click', () => {
    const username = document.getElementById('recoverUsername').value;
    const answer = document.getElementById('recoverAnswer').value;

    const user = JSON.parse(localStorage.getItem(username));

    if (user && user.answer === answer) {
        alert(`Your password is: ${user.password}`);
        recoverContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    } else {
        alert('Incorrect username or security answer!');
    }
});


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
  let timeRemaining = 3600; // Timer in seconds
  let selectedCourse = "";
  let subCourseName = "";
                          
  const questionBanks = {
    Mathematics: {
        "MTH105-12": {
        title: "Biometry/Biostatistics",
        questions: [
          { text: "What is 2 + 2?", options: ["2", "3", "4", "5"], correct: 2, explanation: "2 + 2 equals 4." },
          { text: "What is 3 x 3?", options: ["6", "9", "12", "15"], correct: 1, explanation: "3 x 3 equals 9." },
        ]
      },
           
      "MTH101-12": {
        title: "Basic Arithmetic",
        questions: [
          { text: "What is 2 + 2?", options: ["2", "3", "4", "5"], correct: 2, explanation: "2 + 2 equals 4." },
          { text: "What is 3 x 3?", options: ["6", "9", "12", "15"], correct: 1, explanation: "3 x 3 equals 9." },
        ],
      },
    },

  Physics: {
        "PHYS101-1": {
        title: "Biometry/Biostatistics",
        questions: [
          { text: "What is 2 + 2?", options: ["2", "3", "4", "5"], correct: 2, explanation: "2 + 2 equals 4." },
          { text: "What is 3 x 3?", options: ["6", "9", "12", "15"], correct: 1, explanation: "3 x 3 equals 9." },
        ]
      },
           
      "PHYS105_1": {     
      title: "Basic Arithmetic",
        questions: [
          { text: "What is 2 + 2?", options: ["2", "3", "4", "5"], correct: 2, explanation: "2 + 2 equals 4." },
          { text: "What is 3 x 3?", options: ["6", "9", "12", "15"], correct: 1, explanation: "3 x 3 equals 9." },
        ],
      },
    },                                  
    

    Zoology: {

         "ZOO201": {
        title: "Biometry/Biostatistics",
        questions: [
          { text: "What is 2 + 2?", options: ["2", "3", "4", "5"], correct: 2, explanation: "2 + 2 equals 4." },
          { text: "What is 3 x 3?", options: ["6", "9", "12", "15"], correct: 1, explanation: "3 x 3 equals 9." },
        ]
      },

  "ZOO202": {
        title: "Biometry/Biostatistics",
        questions: [
          { text: "What is 2 + 2?", options: ["2", "3", "4", "5"], correct: 2, explanation: "2 + 2 equals 4." },
          { text: "What is 3 x 3?", options: ["6", "9", "12", "15"], correct: 1, explanation: "3 x 3 equals 9." },
        ]
      },
           
  "ZOO207": {
        title: "Biometry/Biostatistics",
        questions: [
          { text: "What is 2 + 2?", options: ["2", "3", "4", "5"], correct: 2, explanation: "2 + 2 equals 4." },
          { text: "What is 3 x 3?", options: ["6", "9", "12", "15"], correct: 1, explanation: "3 x 3 equals 9." },
        ]
      },
           
               
      "ZOO101": {
        title: "INTRODUCTORY ZOOLOGY 1",
        questions: [
          { text: "What is the primary basis for the classification of animals in taxonomy?", options: ["Reproductive methods", "Body structure", "Feeding habits", "Behavior"], correct: 1, explanation: "Body structure is a fundamental criterion used in taxonomy to classify animals." },
       
      {
        text: "Which specific cells in the neural crest of vertebrates give rise to peripheral nerves?",
        options: ["Ectodermal cells", "Schwann cells", "Neural crest cells", "Mesodermal cells"],
        correct: 2,
        explanation: "Neural crest cells migrate to form peripheral nerves, pigment cells, and other specialized tissues in vertebrates."
      }, 
    { text: "Which type of egg has a uniform distribution of yolk?", "options": ["Telolecithal", "Isolecithal", "Centrolecithal", "Mesolecithal"], "correct": 1, "explanation": "Isolecithal eggs have a uniform distribution of yolk, seen in mammals and echinoderms." },
    { text: "What type of fertilization occurs outside the female body?", "options": ["Internal fertilization", "External fertilization", "Self-fertilization", "Artificial insemination"], "correct": 1, "explanation": "External fertilization occurs outside the female body, typical in aquatic animals like frogs and fish." },
    { text: "Which cleavage pattern occurs in isolecithal eggs?", "options": ["Holoblastic equal", "Meroblastic", "Superficial", "Holoblastic unequal"], "correct": 0, "explanation": "Holoblastic equal cleavage occurs in isolecithal eggs due to the even yolk distribution." },
    { text: "What is the process of forming three germ layers called?", "options": ["Fertilization", "Cleavage", "Gastrulation", "Organogenesis"], "correct": 2, "explanation": "Gastrulation is the process where the blastula reorganizes into three germ layers: ectoderm, mesoderm, and endoderm." },
    { text: "Which tissue originates from the ectoderm?", "options": ["Liver", "Muscles", "Skin", "Heart"], "correct": 2, "explanation": "The ectoderm gives rise to the skin, nervous system, and sensory organs." },
    { text: "What is the significance of the gray crescent in frog embryos?", "options": ["Prevents polyspermy", "Determines the dorsal side", "Contains yolk", "Secretes enzymes"], "correct": 1, "explanation": "The gray crescent determines the dorsal side and is crucial for establishing body axes in frog embryos." },
    { text: "Which type of egg is found in birds?", "options": ["Isolecithal", "Telolecithal", "Mesolecithal", "Centrolecithal"], "correct": 1, "explanation": "Bird eggs are telolecithal, meaning they have a large amount of yolk concentrated at one end." },
    { text: "What term describes the fusion of male and female gametes?", "options": ["Gamogenesis", "Fertilization", "Cleavage", "Gastrulation"], "correct": 1, "explanation": "Fertilization is the process where male and female gametes fuse to form a zygote." },
    { text: "Which process forms the neural tube in vertebrates?", "options": ["Organogenesis", "Cleavage", "Gastrulation", "Neurulation"], "correct": 3, "explanation": "Neurulation is the process that forms the neural tube, which develops into the central nervous system." },
    { text: "What is the first organ to develop during vertebrate development?", "options": ["Heart", "Brain", "Lungs", "Liver"], "correct": 0, "explanation": "The heart is the first organ to develop and begin functioning during vertebrate development." },
    { text: "Which layer gives rise to the digestive tract lining?", "options": ["Ectoderm", "Mesoderm", "Endoderm", "None of these"], "correct": 2, "explanation": "The endoderm forms the digestive tract lining and associated organs such as the liver and pancreas." },
    { text: "Which cleavage type is found in reptile and bird eggs?", "options": ["Holoblastic", "Superficial", "Meroblastic discoidal", "Equal"], "correct": 2, "explanation": "Reptile and bird eggs undergo meroblastic discoidal cleavage due to the large yolk preventing complete division." },
    { text: "Which embryonic structure forms the placenta in mammals?", "options": ["Yolk sac", "Amnion", "Chorion", "Allantois"], "correct": 2, "explanation": "The chorion contributes to the formation of the placenta, facilitating nutrient and gas exchange in mammals." },
    { text: "What is the term for repeated mitotic divisions of the zygote?", "options": ["Fertilization", "Cleavage", "Gastrulation", "Organogenesis"], "correct": 1, "explanation": "Cleavage involves repeated mitotic divisions of the zygote, forming a multicellular structure." },
    { text: "What structure in frogs guides cell migration during gastrulation?", "options": ["Neural plate", "Blastopore", "Archenteron", "Yolk plug"], "correct": 1, "explanation": "The blastopore guides cell migration during gastrulation and later becomes the anus in deuterostomes." },
    { text: "What is the cavity formed during gastrulation?", "options": ["Coelom", "Blastocoel", "Archenteron", "Amniotic cavity"], "correct": 2, "explanation": "The archenteron is the primitive gut formed during gastrulation, eventually developing into the digestive tract." },
    { text: "Which process leads to cell specialization in an embryo?", "options": ["Fertilization", "Cleavage", "Differentiation", "Organogenesis"], "correct": 2, "explanation": "Differentiation allows cells to acquire specialized structures and functions during development." },
    { text: "What is the fate of the mesoderm in vertebrates?", "options": ["Skin and nerves", "Muscles and bones", "Liver and lungs", "Heart and brain"], "correct": 1, "explanation": "The mesoderm forms muscles, bones, the circulatory system, and other connective tissues in vertebrates." },
    { text: "Which structure supports and protects the embryo in reptiles and birds?", "options": ["Amnion", "Yolk sac", "Allantois", "Chorion"], "correct": 0, "explanation": "The amnion forms a fluid-filled sac that protects the embryo from mechanical shocks and desiccation." },
    { text: "What is the term for the hollow ball of cells formed after cleavage?", "options": ["Blastula", "Morula", "Gastrula", "Neurula"], "correct": 0, "explanation": "The blastula is a hollow ball of cells formed after cleavage, containing a fluid-filled cavity called the blastocoel." }, 

    { text: "Which germ layer forms the nervous system?", "options": ["Endoderm", "Mesoderm", "Ectoderm", "None"], "correct": 2, "explanation": "The ectoderm forms the nervous system, including the brain and spinal cord." },
    { text: "What structure forms the vertebral column?", "options": ["Notochord", "Blastocoel", "Somites", "Neural tube"], "correct": 0, "explanation": "The notochord serves as a temporary structure that later forms the vertebral column." },
    { text: "Which structure stores waste in reptilian embryos?", "options": ["Amnion", "Yolk sac", "Allantois", "Chorion"], "correct": 2, "explanation": "The allantois stores waste products in reptilian and bird embryos." },
    { text: "What is the term for an egg with a large yolk concentrated at one end?", "options": ["Isolecithal", "Telolecithal", "Mesolecithal", "Centrolecithal"], "correct": 1, "explanation": "Telolecithal eggs have a large yolk concentrated at one end, common in birds and reptiles." },
    { text: "Which cleavage pattern occurs in amphibians?", "options": ["Meroblastic", "Holoblastic unequal", "Holoblastic equal", "Superficial"], "correct": 1, "explanation": "Amphibians undergo holoblastic unequal cleavage due to moderate yolk presence." },
    { text: "What is the fate of the blastopore in deuterostomes?", "options": ["Mouth", "Anus", "Brain", "Stomach"], "correct": 1, "explanation": "In deuterostomes, including humans, the blastopore develops into the anus." },
    { text: "Which process forms somites in vertebrates?", "options": ["Gastrulation", "Cleavage", "Neurulation", "Segmentation"], "correct": 3, "explanation": "Segmentation leads to the formation of somites, which develop into muscles and vertebrae." },
    { text: "Which layer gives rise to the circulatory system?", "options": ["Endoderm", "Ectoderm", "Mesoderm", "Blastoderm"], "correct": 2, "explanation": "The mesoderm gives rise to the circulatory system, muscles, and skeleton." },
    { text: "What forms after fertilization but before gastrulation?", "options": ["Blastula", "Morula", "Gastrula", "Neurula"], "correct": 0, "explanation": "The blastula forms after cleavage and before gastrulation." },
    { text: "What is the hollow cavity inside the blastula?", "options": ["Blastopore", "Blastocoel", "Archenteron", "Coelom"], "correct": 1, "explanation": "The blastocoel is the fluid-filled cavity inside the blastula." },
    { text: "Which type of fertilization is common in mammals?", "options": ["External", "Self", "Artificial", "Internal"], "correct": 3, "explanation": "Mammals use internal fertilization for reproduction." },
    { text: "Which term describes the initial cell formed after fertilization?", "options": ["Embryo", "Zygote", "Blastomere", "Oocyte"], "correct": 1, "explanation": "The zygote is the first cell formed after the fusion of sperm and egg." },
    { text: "What process follows cleavage in animal development?", "options": ["Organogenesis", "Gastrulation", "Fertilization", "Implantation"], "correct": 1, "explanation": "Gastrulation follows cleavage and forms the three germ layers." },
    { text: "What type of cleavage occurs in insects?", "options": ["Holoblastic", "Superficial", "Discoidal", "Unequal"], "correct": 1, "explanation": "Insects undergo superficial cleavage due to their centrolecithal eggs." },
    { text: "Which structure anchors the embryo to the uterine wall?", "options": ["Placenta", "Amnion", "Yolk sac", "Allantois"], "correct": 0, "explanation": "The placenta anchors the embryo and facilitates nutrient exchange in mammals." },
    { text: "Which germ layer forms the kidneys?", "options": ["Endoderm", "Ectoderm", "Mesoderm", "Blastoderm"], "correct": 2, "explanation": "The mesoderm forms organs such as the kidneys, heart, and skeletal muscles." },
    { text: "Which organ system forms from the endoderm?", "options": ["Digestive", "Nervous", "Skeletal", "Circulatory"], "correct": 0, "explanation": "The endoderm forms the digestive and respiratory systems." },
    { text: "Which structure provides nutrition to the developing embryo?", "options": ["Yolk sac", "Amnion", "Chorion", "Blastocoel"], "correct": 0, "explanation": "The yolk sac provides nutrition to the developing embryo in birds and reptiles." },
    { text: "Which process establishes the body axes in embryos?", "options": ["Fertilization", "Cleavage", "Gastrulation", "Segmentation"], "correct": 2, "explanation": "Gastrulation establishes the body axes and forms the three germ layers." },
    { text: "What forms the neural plate?", "options": ["Endoderm", "Mesoderm", "Ectoderm", "Blastocoel"], "correct": 2, "explanation": "The ectoderm thickens to form the neural plate, which becomes the neural tube." },
    { text: "Which type of development involves no larval stage?", "options": ["Direct development", "Indirect development", "Complete metamorphosis", "Partial metamorphosis"], "correct": 0, "explanation": "Direct development involves the embryo developing into a miniature adult without a larval stage." },
    { text: "Which process creates identical twins?", "options": ["Fertilization", "Cleavage", "Blastulation", "Splitting of the embryo"], "correct": 3, "explanation": "Identical twins result from the splitting of the early embryo into two separate embryos." },
    { text: "What type of symmetry is established during cleavage?", "options": ["Radial", "Bilateral", "Asymmetry", "No symmetry"], "correct": 1, "explanation": "Bilateral symmetry is established in many animals during cleavage and early development." }, 
    { text: "Which phylum includes acellular animals like protozoa?", "options": ["Porifera", "Protozoa", "Cnidaria", "Annelida"], "correct": 1, "explanation": "Protozoa are unicellular or acellular organisms classified under the Kingdom Protista." },
    { text: "Which of the following is a characteristic of coelenterates?", "options": ["Bilateral symmetry", "Radial symmetry", "Segmented body", "No symmetry"], "correct": 1, "explanation": "Coelenterates like jellyfish and corals have radial symmetry." },
    { text: "Which class of Protozoa includes Amoeba?", "options": ["Sarcodina", "Ciliophora", "Sporozoa", "Mastigophora"], "correct": 0, "explanation": "Amoeba belongs to the class Sarcodina, characterized by pseudopodia for movement." },
    { text: "Which of these is a characteristic feature of Porifera?", "options": ["Presence of cnidocytes", "Spongocoel and choanocytes", "Bilateral symmetry", "Segmented body"], "correct": 1, "explanation": "Porifera (sponges) have a spongocoel lined with choanocytes that filter food from water." },
    { text: "Which invertebrate has a water vascular system?", "options": ["Jellyfish", "Starfish", "Earthworm", "Coral"], "correct": 1, "explanation": "Echinoderms like starfish have a water vascular system for movement and feeding." },
    { text: "Which phylum includes corals and sea anemones?", "options": ["Porifera", "Mollusca", "Cnidaria", "Echinodermata"], "correct": 2, "explanation": "Cnidaria includes corals, sea anemones, and jellyfish, known for their stinging cells." },
    { text: "Which of the following are filter feeders?", "options": ["Earthworms", "Sponges", "Starfish", "Planarians"], "correct": 1, "explanation": "Sponges filter feed by drawing water through their pores using choanocytes." },
    { text: "What structure in Protozoa aids in osmoregulation?", "options": ["Cilia", "Pseudopodia", "Contractile vacuole", "Flagella"], "correct": 2, "explanation": "The contractile vacuole regulates water content by expelling excess water in protozoa." },
    { text: "Which is the main characteristic of Cnidaria?", "options": ["Presence of a water vascular system", "Cnidocytes for stinging", "Segmented body", "Parapodia for movement"], "correct": 1, "explanation": "Cnidaria possess cnidocytes, specialized stinging cells for capturing prey and defense." },
    { text: "Which Protozoan causes malaria?", "options": ["Plasmodium", "Amoeba", "Paramecium", "Euglena"], "correct": 0, "explanation": "Plasmodium is a sporozoan that causes malaria and is transmitted by Anopheles mosquitoes." },
    { text: "Which symmetry do members of the phylum Cnidaria exhibit?", "options": ["Radial", "Bilateral", "Asymmetry", "Pentamerous"], "correct": 0, "explanation": "Cnidarians show radial symmetry, meaning their body parts are arranged around a central axis." },
    { text: "Which of the following is not a Protozoan?", "options": ["Paramecium", "Plasmodium", "Hydra", "Euglena"], "correct": 2, "explanation": "Hydra is a cnidarian, not a protozoan." },
    { text: "Which phylum includes flatworms?", "options": ["Nematoda", "Platyhelminthes", "Cnidaria", "Mollusca"], "correct": 1, "explanation": "Platyhelminthes includes flatworms such as planarians, tapeworms, and flukes." },
    { text: "Which Protozoan moves using cilia?", "options": ["Amoeba", "Plasmodium", "Paramecium", "Euglena"], "correct": 2, "explanation": "Paramecium moves using cilia, small hair-like structures on its surface." },
    { text: "What is a unique feature of sponges?", "options": ["Notochord", "Segmented body", "Porous body", "Cnidocytes"], "correct": 2, "explanation": "Sponges have a porous body structure that allows water to flow through them." },
    { text: "What type of digestive system do flatworms have?", "options": ["Incomplete", "Complete", "No digestive system", "Multiple systems"], "correct": 0, "explanation": "Flatworms have an incomplete digestive system with a single opening serving as both mouth and anus." },
    { text: "Which phylum exhibits alternation of generations?", "options": ["Cnidaria", "Nematoda", "Porifera", "Platyhelminthes"], "correct": 0, "explanation": "Cnidarians exhibit alternation of generations, alternating between polyp and medusa forms." },
    { text: "Which structure in Euglena aids in photosynthesis?", "options": ["Pseudopodia", "Flagella", "Chloroplast", "Cilia"], "correct": 2, "explanation": "Euglena has chloroplasts that enable photosynthesis, making it a mixotroph." },
    { text: "Which phylum includes organisms with a segmented body?", "options": ["Porifera", "Annelida", "Nematoda", "Cnidaria"], "correct": 1, "explanation": "Annelids have segmented bodies, as seen in earthworms and leeches." },
    { text: "What is the mode of reproduction in sponges?", "options": ["Only sexual", "Only asexual", "Both sexual and asexual", "Parthenogenesis"], "correct": 2, "explanation": "Sponges reproduce both sexually through gametes and asexually by budding or fragmentation." },
    { text: "Which phylum includes tapeworms?", "options": ["Nematoda", "Platyhelminthes", "Cnidaria", "Porifera"], "correct": 1, "explanation": "Tapeworms are parasitic flatworms classified under the phylum Platyhelminthes." }, 

    { text: "Which cnidarian exists only in the polyp form?", "options": ["Hydra", "Jellyfish", "Sea anemone", "Portuguese man-of-war"], "correct": 0, "explanation": "Hydra exists only in the polyp form and reproduces asexually by budding." },
    { text: "Which phylum includes roundworms?", "options": ["Annelida", "Platyhelminthes", "Nematoda", "Cnidaria"], "correct": 2, "explanation": "Nematoda includes roundworms such as Ascaris and hookworms." },
    { text: "What is the primary mode of locomotion in Paramecium?", "options": ["Flagella", "Cilia", "Pseudopodia", "None"], "correct": 1, "explanation": "Paramecium uses cilia for locomotion and feeding." },
    { text: "Which organism exhibits metagenesis?", "options": ["Hydra", "Amoeba", "Obelia", "Paramecium"], "correct": 2, "explanation": "Obelia exhibits metagenesis, alternating between polyp and medusa forms." },
    { text: "Which invertebrate has nematocysts?", "options": ["Earthworm", "Jellyfish", "Flatworm", "Starfish"], "correct": 1, "explanation": "Jellyfish possess nematocysts, stinging cells used for capturing prey." },
    { text: "Which phylum includes leeches?", "options": ["Nematoda", "Annelida", "Cnidaria", "Platyhelminthes"], "correct": 1, "explanation": "Leeches belong to the phylum Annelida, known for segmented bodies." },
    { text: "Which structure allows Euglena to move?", "options": ["Pseudopodia", "Flagella", "Cilia", "Setae"], "correct": 1, "explanation": "Euglena uses its flagella for locomotion in aquatic environments." },
    { text: "Which structure do planarians use for excretion?", "options": ["Kidneys", "Malpighian tubules", "Flame cells", "Nephridia"], "correct": 2, "explanation": "Flame cells help with excretion and osmoregulation in planarians." },
    { text: "Which is a characteristic of flatworms?", "options": ["Segmented bodies", "Bilateral symmetry", "Radial symmetry", "Endoskeleton"], "correct": 1, "explanation": "Flatworms have bilateral symmetry, meaning their body is divided into two equal halves." },
    { text: "Which phylum contains animals with a nerve net?", "options": ["Nematoda", "Cnidaria", "Annelida", "Mollusca"], "correct": 1, "explanation": "Cnidarians have a simple nerve net instead of a central nervous system." },
    { text: "Which Protozoan moves using pseudopodia?", "options": ["Amoeba", "Euglena", "Paramecium", "Plasmodium"], "correct": 0, "explanation": "Amoeba uses pseudopodia for movement and engulfing food." },
    { text: "Which phylum includes organisms with an exoskeleton?", "options": ["Porifera", "Mollusca", "Arthropoda", "Annelida"], "correct": 2, "explanation": "Arthropods have a chitin-based exoskeleton providing protection and support." },
    { text: "Which feature is unique to sponges?", "options": ["Nerve cells", "Choanocytes", "Cnidocytes", "Segments"], "correct": 1, "explanation": "Choanocytes (collar cells) help sponges filter feed by generating water currents." },
    { text: "Which Protozoan is both autotrophic and heterotrophic?", "options": ["Plasmodium", "Amoeba", "Euglena", "Paramecium"], "correct": 2, "explanation": "Euglena can perform photosynthesis and also feed heterotrophically when light is unavailable." },
    { text: "Which phylum includes animals with radial symmetry?", "options": ["Platyhelminthes", "Cnidaria", "Nematoda", "Mollusca"], "correct": 1, "explanation": "Cnidarians have radial symmetry, with body parts arranged around a central axis." },
    { text: "Which of the following is a free-living flatworm?", "options": ["Planaria", "Tapeworm", "Liver fluke", "Hookworm"], "correct": 0, "explanation": "Planaria is a free-living flatworm found in freshwater habitats." },
    { text: "Which type of reproduction is common in Protozoa?", "options": ["Only sexual", "Only asexual", "Both sexual and asexual", "Budding"], "correct": 2, "explanation": "Protozoa reproduce both sexually (conjugation) and asexually (binary fission)." },
    { text: "Which of the following is not a coelenterate?", "options": ["Coral", "Hydra", "Earthworm", "Jellyfish"], "correct": 2, "explanation": "Earthworm belongs to the phylum Annelida, not Cnidaria (coelenterates)." },
    { text: "Which characteristic is absent in sponges?", "options": ["Nervous system", "Water canal system", "Pores", "Filter-feeding"], "correct": 0, "explanation": "Sponges lack a nervous system, relying on water flow for survival." },
    { text: "Which Protozoan causes African sleeping sickness?", "options": ["Plasmodium", "Giardia", "Trypanosoma", "Paramecium"], "correct": 2, "explanation": "Trypanosoma causes African sleeping sickness, transmitted by the tsetse fly." },
    { text: "What type of body cavity do roundworms have?", "options": ["Acoelomate", "Coelomate", "Pseudocoelomate", "No cavity"], "correct": 2, "explanation": "Roundworms are pseudocoelomates, having a body cavity partially lined with mesoderm." },
    { text: "Which invertebrate has a gastrovascular cavity?", "options": ["Earthworm", "Hydra", "Tapeworm", "Paramecium"], "correct": 1, "explanation": "Hydra has a gastrovascular cavity used for digestion and distribution of nutrients." },
    { text: "Which Protozoan causes dysentery?", "options": ["Amoeba", "Euglena", "Paramecium", "Plasmodium"], "correct": 0, "explanation": "Amoeba (Entamoeba histolytica) causes amoebic dysentery in humans." }, 

    { text: "Which of the following is an example of a coelomate?", "options": ["Planaria", "Earthworm", "Tapeworm", "Hydra"], "correct": 1, "explanation": "Earthworms are coelomates with a true body cavity fully lined by mesoderm." },
    { text: "What is the defining characteristic of a pseudocoelomate?", "options": ["No body cavity", "Body cavity partially lined by mesoderm", "Body cavity fully lined by mesoderm", "No digestive system"], "correct": 1, "explanation": "Pseudocoelomates have a body cavity partially lined by mesoderm, as seen in roundworms." },
    { text: "Which of these is an acoelomate animal?", "options": ["Earthworm", "Roundworm", "Tapeworm", "Starfish"], "correct": 2, "explanation": "Tapeworms are acoelomates with no body cavity; they have a solid body structure." },
    { text: "Which phylum contains only coelomates?", "options": ["Platyhelminthes", "Annelida", "Nematoda", "Cnidaria"], "correct": 1, "explanation": "Annelida includes segmented worms like earthworms, which are coelomates." },
    { text: "Which of the following describes a true coelom?", "options": ["A cavity between the ectoderm and mesoderm", "A cavity between mesoderm and endoderm", "A cavity fully lined with mesoderm", "No cavity present"], "correct": 2, "explanation": "A true coelom is a body cavity fully lined with mesodermal tissue." },
    { text: "Which of the following is a pseudocoelomate?", "options": ["Ascaris", "Earthworm", "Starfish", "Liver fluke"], "correct": 0, "explanation": "Ascaris (roundworm) is a pseudocoelomate with a cavity partially lined by mesoderm." },
    { text: "Which term best describes flatworms?", "options": ["Acoelomate", "Pseudocoelomate", "Coelomate", "Bilateral"], "correct": 0, "explanation": "Flatworms are acoelomates, meaning they lack a body cavity between the digestive tract and body wall." },
    { text: "What type of coelom do nematodes possess?", "options": ["Acoelom", "True coelom", "Pseudocoelom", "Haemocoel"], "correct": 2, "explanation": "Nematodes have a pseudocoelom, which is a fluid-filled body cavity not fully lined by mesoderm." },
    { text: "Which phylum includes only acoelomate animals?", "options": ["Porifera", "Cnidaria", "Platyhelminthes", "Echinodermata"], "correct": 2, "explanation": "Platyhelminthes includes flatworms, which are acoelomates with no body cavity." },
    { text: "Which of the following is not a characteristic of coelomates?", "options": ["Bilateral symmetry", "Organ-level organization", "Fluid-filled body cavity", "No body cavity"], "correct": 3, "explanation": "Coelomates have a fluid-filled body cavity lined by mesoderm, unlike acoelomates." },
    { text: "What type of body cavity do annelids have?", "options": ["Acoelomate", "Pseudocoelomate", "Coelomate", "None"], "correct": 2, "explanation": "Annelids are coelomates, meaning they have a true coelom fully lined by mesoderm." },
    { text: "Which of the following animals has a pseudocoelom?", "options": ["Earthworm", "Leech", "Roundworm", "Flatworm"], "correct": 2, "explanation": "Roundworms are pseudocoelomates, having a body cavity only partially lined by mesoderm." },
    { text: "Which of the following phyla contains coelomates?", "options": ["Annelida", "Nematoda", "Platyhelminthes", "Porifera"], "correct": 0, "explanation": "Annelids are coelomates, possessing a true coelom lined by mesoderm." },
    { text: "Which feature is found only in coelomates?", "options": ["Complete digestive tract", "Segmentation", "Circulatory system", "True body cavity"], "correct": 3, "explanation": "Coelomates possess a true body cavity completely lined by mesodermal tissue." },
    { text: "What is the primary function of a coelom?", "options": ["Support", "Respiration", "Transport of fluids", "Reproduction"], "correct": 2, "explanation": "A coelom functions as a fluid-filled space for the transport of nutrients, gases, and waste products." },
    { text: "Which animal is a coelomate?", "options": ["Earthworm", "Hydra", "Tapeworm", "Ascaris"], "correct": 0, "explanation": "Earthworms are coelomates with a segmented body and a true coelom." },
    { text: "What is the body cavity of acoelomates filled with?", "options": ["Air", "Fluid", "Solid tissue", "Blood"], "correct": 2, "explanation": "Acoelomates have no body cavity; their internal space is filled with solid mesodermal tissue." },
    { text: "Which phylum contains both acoelomates and pseudocoelomates?", "options": ["Cnidaria", "Annelida", "Nematoda", "None"], "correct": 2, "explanation": "Nematoda includes pseudocoelomates, while Platyhelminthes contains acoelomates." },
    { text: "Which of the following animals lacks a true coelom?", "options": ["Earthworm", "Leech", "Roundworm", "Tapeworm"], "correct": 3, "explanation": "Tapeworms are acoelomates with no body cavity." },
    { text: "Which structure lines the coelom in coelomates?", "options": ["Endoderm", "Mesoderm", "Ectoderm", "Gastroderm"], "correct": 1, "explanation": "The mesoderm lines the coelom in coelomates, forming protective and supportive tissues." }, 

    { text: "Which of the following animals has a true coelom?", "options": ["Earthworm", "Roundworm", "Flatworm", "Hydra"], "correct": 0, "explanation": "Earthworms are coelomates with a true coelom lined by mesoderm." },
    { text: "Which characteristic is unique to pseudocoelomates?", "options": ["Absence of mesoderm", "Incomplete digestive system", "Body cavity partially lined by mesoderm", "Segmented body"], "correct": 2, "explanation": "Pseudocoelomates have a body cavity partially lined by mesoderm, unlike coelomates." },
    { text: "What is a primary feature of acoelomates?", "options": ["Lack of a digestive tract", "Lack of a true body cavity", "Body cavity filled with fluid", "Segmented body"], "correct": 1, "explanation": "Acoelomates lack a true body cavity, with their organs embedded in solid mesodermal tissue." },
    { text: "Which phylum includes both coelomates and pseudocoelomates?", "options": ["Porifera", "Annelida", "Nematoda", "None"], "correct": 2, "explanation": "Nematoda includes pseudocoelomates like roundworms, while annelids are coelomates." },
    { text: "Which of the following animals lacks a true body cavity?", "options": ["Earthworm", "Tapeworm", "Ascaris", "Leech"], "correct": 1, "explanation": "Tapeworms are acoelomates with no body cavity and flattened bodies." },
    { text: "What is the embryonic origin of the coelom?", "options": ["Ectoderm", "Mesoderm", "Endoderm", "Blastocoel"], "correct": 1, "explanation": "The coelom originates from the mesoderm during embryonic development." },
    { text: "Which phylum contains animals with segmented bodies and a coelom?", "options": ["Annelida", "Nematoda", "Platyhelminthes", "Porifera"], "correct": 0, "explanation": "Annelids have segmented bodies and are true coelomates." },
    { text: "What type of body cavity is present in nematodes?", "options": ["Acoelom", "True coelom", "Pseudocoelom", "None"], "correct": 2, "explanation": "Nematodes have a pseudocoelom, a body cavity partially lined by mesoderm." },
    { text: "Which of the following animals is an acoelomate?", "options": ["Earthworm", "Leech", "Planaria", "Roundworm"], "correct": 2, "explanation": "Planaria is a flatworm classified as an acoelomate, lacking a true body cavity." },
    { text: "Which of the following is not a characteristic of coelomates?", "options": ["Organ development", "Circulatory system", "Fluid-filled cavity", "Lack of body cavity"], "correct": 3, "explanation": "Coelomates have a true body cavity, allowing organ development and fluid circulation." },
    { text: "Which term describes an animal with a body cavity completely lined by mesoderm?", "options": ["Acoelomate", "Pseudocoelomate", "Coelomate", "Diploblast"], "correct": 2, "explanation": "Coelomates have a true body cavity completely lined by mesoderm." },
    { text: "Which of these is an example of a pseudocoelomate?", "options": ["Flatworm", "Earthworm", "Roundworm", "Starfish"], "correct": 2, "explanation": "Roundworms are pseudocoelomates, having a cavity partially lined with mesoderm." },
    { text: "Which structure supports organs in coelomates?", "options": ["Endoderm", "Blastocoel", "Mesentery", "Gastroderm"], "correct": 2, "explanation": "The mesentery is formed from mesoderm and supports organs within the coelom." },
    { text: "What type of body cavity do flatworms have?", "options": ["True coelom", "Pseudocoelom", "Acoelomate", "Haemocoel"], "correct": 2, "explanation": "Flatworms are acoelomates, meaning they lack a body cavity." },
    { text: "Which feature distinguishes coelomates from pseudocoelomates?", "options": ["Complete digestive tract", "Segmented body", "Body cavity completely lined by mesoderm", "Presence of mesoderm"], "correct": 2, "explanation": "Coelomates have a true coelom completely lined by mesoderm, unlike pseudocoelomates." },
    { text: "Which of the following is a pseudocoelomate?", "options": ["Earthworm", "Ascaris", "Leech", "Planaria"], "correct": 1, "explanation": "Ascaris is a pseudocoelomate with a body cavity partially lined by mesoderm." },
    { text: "Which term describes animals with no body cavity?", "options": ["Acoelomate", "Coelomate", "Pseudocoelomate", "Segmented"], "correct": 0, "explanation": "Acoelomates have no body cavity, with tissues filling the space between the gut and body wall." },
    { text: "Which phylum is entirely made up of acoelomate animals?", "options": ["Annelida", "Nematoda", "Platyhelminthes", "Cnidaria"], "correct": 2, "explanation": "Platyhelminthes includes acoelomates such as flatworms." },
    { text: "Which of the following organisms has a fluid-filled pseudocoelom?", "options": ["Flatworm", "Earthworm", "Ascaris", "Hydra"], "correct": 2, "explanation": "Ascaris has a fluid-filled pseudocoelom that aids in circulation and movement." },
    { text: "Which term refers to the body cavity in coelomates?", "options": ["Blastocoel", "Pseudocoelom", "True coelom", "Haemocoel"], "correct": 2, "explanation": "Coelomates possess a true coelom, fully lined by mesoderm." }, 
    { text: "Which of the following animals has a segmented body with a true coelom?", "options": ["Earthworm", "Hydra", "Planaria", "Roundworm"], "correct": 0, "explanation": "Earthworms have a segmented body with a true coelom fully lined by mesoderm." },
    { text: "Which characteristic is shared by all acoelomates?", "options": ["True coelom", "Body cavity partially lined by mesoderm", "No body cavity", "Open circulatory system"], "correct": 2, "explanation": "Acoelomates lack a body cavity and have solid tissue between the gut and body wall." },
    { text: "What type of body cavity do pseudocoelomates have?", "options": ["True coelom", "Pseudocoelom", "Acoelomate", "Haemocoel"], "correct": 1, "explanation": "Pseudocoelomates have a body cavity partially lined with mesoderm, as seen in nematodes." },
    { text: "Which of the following is an example of a pseudocoelomate?", "options": ["Tapeworm", "Roundworm", "Earthworm", "Jellyfish"], "correct": 1, "explanation": "Roundworms are pseudocoelomates with a body cavity partially lined by mesoderm." },
    { text: "Which of the following phyla contains only acoelomates?", "options": ["Annelida", "Platyhelminthes", "Nematoda", "Cnidaria"], "correct": 1, "explanation": "Platyhelminthes includes flatworms, which are acoelomates with no body cavity." },
    { text: "Which structure supports organs in coelomates?", "options": ["Mesentery", "Blastocoel", "Pseudocoelom", "Ectoderm"], "correct": 0, "explanation": "The mesentery supports organs and connects them to the body wall in coelomates." },
    { text: "Which of the following is not a coelomate?", "options": ["Earthworm", "Starfish", "Tapeworm", "Leech"], "correct": 2, "explanation": "Tapeworms are acoelomates, lacking a true body cavity." },
    { text: "Which phylum includes animals with a true coelom and segmentation?", "options": ["Porifera", "Annelida", "Nematoda", "Platyhelminthes"], "correct": 1, "explanation": "Annelids have a segmented body structure and a true coelom lined by mesoderm." },
    { text: "Which animal has a pseudocoelom?", "options": ["Ascaris", "Earthworm", "Tapeworm", "Starfish"], "correct": 0, "explanation": "Ascaris is a roundworm with a pseudocoelom partially lined by mesoderm." },
    { text: "Which feature is characteristic of acoelomates?", "options": ["Fluid-filled body cavity", "Body cavity lined with mesoderm", "No body cavity", "Open circulatory system"], "correct": 2, "explanation": "Acoelomates lack a body cavity and have solid mesodermal tissue surrounding their organs." },
    { text: "What type of body cavity do coelomates possess?", "options": ["True coelom", "Pseudocoelom", "No body cavity", "Acoelomate"], "correct": 0, "explanation": "Coelomates have a true coelom fully lined by mesodermal tissue." },
    { text: "Which characteristic distinguishes pseudocoelomates from coelomates?", "options": ["Segmented bodies", "Complete digestive system", "Partially lined body cavity", "Radial symmetry"], "correct": 2, "explanation": "Pseudocoelomates have a body cavity only partially lined by mesoderm, unlike coelomates." },
    { text: "Which phylum consists entirely of coelomate animals?", "options": ["Annelida", "Nematoda", "Platyhelminthes", "Porifera"], "correct": 0, "explanation": "Annelids are coelomates with a true body cavity completely lined by mesoderm." },
    { text: "Which of the following animals lacks a true coelom?", "options": ["Planaria", "Earthworm", "Starfish", "Leech"], "correct": 0, "explanation": "Planaria are flatworms and acoelomates, lacking a true body cavity." },
    { text: "Which phylum includes animals with segmented bodies and a true coelom?", "options": ["Nematoda", "Annelida", "Cnidaria", "Platyhelminthes"], "correct": 1, "explanation": "Annelids have segmented bodies and a true coelom, making them coelomates." },
    { text: "What is the primary function of a coelom?", "options": ["Reproduction", "Movement", "Transport of fluids", "Protection from predators"], "correct": 2, "explanation": "The coelom allows transport of fluids, organ support, and movement." },
    { text: "Which layer forms the coelom during development?", "options": ["Ectoderm", "Endoderm", "Mesoderm", "Blastocoel"], "correct": 2, "explanation": "The mesoderm gives rise to the coelom in coelomates." },
    { text: "Which characteristic is found in all coelomates?", "options": ["Open circulatory system", "Segmented body", "Body cavity lined with mesoderm", "No nervous system"], "correct": 2, "explanation": "Coelomates have a true coelom fully lined by mesoderm." },
    { text: "Which of the following is not a feature of pseudocoelomates?", "options": ["Complete digestive system", "Body cavity partially lined by mesoderm", "Open circulatory system", "Fluid-filled cavity"], "correct": 2, "explanation": "Pseudocoelomates have a complete digestive system and a fluid-filled cavity, but no circulatory system." }, 
    { text: "Which of the following is an example of an aquatic mandibulate?", "options": ["Crab", "Scorpion", "Spider", "Millipede"], "correct": 0, "explanation": "Crabs are aquatic mandibulates belonging to the class Crustacea, characterized by their mandibles for feeding." },
    { text: "Which of the following is a characteristic feature of terrestrial mandibulates?", "options": ["Gills", "Book lungs", "Tracheal system", "Water vascular system"], "correct": 2, "explanation": "Terrestrial mandibulates like insects have a tracheal system for gas exchange." },
    { text: "Which structure is used by chelicerate arthropods for feeding?", "options": ["Mandibles", "Chelicerae", "Maxillae", "Antennae"], "correct": 1, "explanation": "Chelicerate arthropods, such as spiders, use chelicerae for feeding and capturing prey." },
    { text: "Which of the following is a chelicerate arthropod?", "options": ["Crab", "Spider", "Lobster", "Shrimp"], "correct": 1, "explanation": "Spiders belong to the class Arachnida and are chelicerate arthropods." },
    { text: "Which arthropod class includes aquatic mandibulates like lobsters and shrimps?", "options": ["Crustacea", "Arachnida", "Myriapoda", "Insecta"], "correct": 0, "explanation": "Crustacea includes aquatic mandibulates like lobsters and shrimps, which use mandibles for feeding." },
    { text: "Which respiratory structure is found in chelicerate arthropods like scorpions?", "options": ["Book lungs", "Trachea", "Gills", "Skin"], "correct": 0, "explanation": "Scorpions have book lungs for gas exchange in terrestrial environments." },
    { text: "Which arthropod is classified as a terrestrial mandibulate?", "options": ["Centipede", "Crayfish", "Horseshoe crab", "Spider"], "correct": 0, "explanation": "Centipedes are terrestrial mandibulates that use mandibles for feeding." },
    { text: "Which of the following arthropods has chelicerae but no antennae?", "options": ["Spider", "Shrimp", "Lobster", "Millipede"], "correct": 0, "explanation": "Spiders have chelicerae for feeding and lack antennae, distinguishing them from crustaceans." },
    { text: "What is a defining feature of chelicerates?", "options": ["Mandibles", "Chelicerae", "Tracheal system", "Antennae"], "correct": 1, "explanation": "Chelicerates possess chelicerae, used for feeding and defense, but lack mandibles." },
    { text: "Which of the following is a terrestrial mandibulate with a segmented body?", "options": ["Scorpion", "Spider", "Centipede", "Horseshoe crab"], "correct": 2, "explanation": "Centipedes are terrestrial mandibulates with segmented bodies and multiple legs." },
    { text: "What type of excretory structure is found in terrestrial mandibulates like insects?", "options": ["Malpighian tubules", "Nephridia", "Flame cells", "Green glands"], "correct": 0, "explanation": "Insects have Malpighian tubules for excretion and osmoregulation." },
    { text: "Which class includes aquatic mandibulates with two pairs of antennae?", "options": ["Arachnida", "Insecta", "Myriapoda", "Crustacea"], "correct": 3, "explanation": "Crustacea includes aquatic mandibulates like crabs and lobsters, which have two pairs of antennae." },
    { text: "Which chelicerate arthropod has book gills?", "options": ["Scorpion", "Spider", "Horseshoe crab", "Millipede"], "correct": 2, "explanation": "Horseshoe crabs have book gills for respiration in aquatic environments." },
    { text: "Which of the following is not a characteristic of chelicerates?", "options": ["Lack of antennae", "Chelicerae for feeding", "Presence of mandibles", "Two body segments"], "correct": 2, "explanation": "Chelicerates lack mandibles and use chelicerae instead." },
    { text: "What type of exoskeleton do all arthropods have?", "options": ["Chitinous", "Calcareous", "Cartilaginous", "Bony"], "correct": 0, "explanation": "Arthropods have a chitinous exoskeleton for protection and support." },
    { text: "Which terrestrial mandibulate has two pairs of legs per body segment?", "options": ["Centipede", "Spider", "Millipede", "Scorpion"], "correct": 2, "explanation": "Millipedes have two pairs of legs per body segment, unlike centipedes with one pair." },
    { text: "Which arthropod class includes insects?", "options": ["Crustacea", "Arachnida", "Insecta", "Myriapoda"], "correct": 2, "explanation": "Insecta includes terrestrial mandibulates like ants, beetles, and flies." },
    { text: "Which of the following is a characteristic of all mandibulates?", "options": ["Chelicerae", "Antennae", "Book gills", "Segmented bodies"], "correct": 1, "explanation": "Mandibulates have antennae for sensory functions, unlike chelicerates." },
    { text: "Which aquatic mandibulate has compound eyes and a segmented body?", "options": ["Lobster", "Spider", "Centipede", "Horseshoe crab"], "correct": 0, "explanation": "Lobsters have compound eyes and a segmented body typical of aquatic mandibulates." },
    { text: "Which of the following is an example of a chelicerate?", "options": ["Crab", "Lobster", "Spider", "Beetle"], "correct": 2, "explanation": "Spiders are chelicerates, possessing chelicerae and lacking antennae." }, 

        
    {
        text: "What type of jaw articulation is seen in cartilaginous fishes (Chondrichthyes)?",
        options: ["Amphistylic", "Autostylic", "Hyostylic", "Synapsid"],
        correct: 2,
        explanation: "Hyostylic jaw articulation allows greater mobility of the jaws in Chondrichthyes, enhancing feeding efficiency."
      },
      {
        text: "Which embryonic structure in chordates contributes to the development of the intervertebral discs in vertebrates?",
        options: ["Endostyle", "Notochord", "Dorsal hollow nerve cord", "Pharyngeal slits"],
        correct: 1,
        explanation: "The notochord becomes the nucleus pulposus of the intervertebral discs in vertebrates."
      },
      {
        text: "What distinguishes placoid scales found in Chondrichthyes from other scale types?",
        options: ["Keratin composition", "Bone-derived structure", "Tooth-like structure with dentin", "Overlapping arrangement"],
        correct: 2,
        explanation: "Placoid scales in Chondrichthyes have a tooth-like structure made of dentin and enamel."
      },
      {
        text: "Which vertebrate group first exhibited a double-loop circulatory system?",
        options: ["Fish", "Amphibians", "Reptiles", "Birds"],
        correct: 1,
        explanation: "Amphibians were the first to evolve a double-loop circulatory system to separate oxygenated and deoxygenated blood."
      },
      {
        text: "Which cranial nerve is associated with the lateral line system in fishes?",
        options: ["Facial nerve (VII)", "Olfactory nerve (I)", "Glossopharyngeal nerve (IX)", "Trigeminal nerve (V)"],
        correct: 0,
        explanation: "The facial nerve (VII) transmits sensory information from the lateral line system in fishes."
      },
      {
        text: "Which gene family regulates the patterning of the vertebrate body axis during development?",
        options: ["Hox genes", "Pax genes", "Wnt genes", "Bmp genes"],
        correct: 0,
        explanation: "Hox genes regulate the anterior-posterior axis formation in vertebrates, determining segment identity."
      },
      {
        text: "What is the role of somites in vertebrate embryogenesis?",
        options: ["Formation of the neural tube", "Segmentation of the body", "Development of the digestive tract", "Formation of gills"],
        correct: 1,
        explanation: "Somites are mesodermal structures that segment the body and give rise to vertebrae, muscles, and dermis."
      },
      {
        text: "Which of the following vertebrate classes is characterized by the absence of bone?",
        options: ["Chondrichthyes", "Osteichthyes", "Amphibia", "Aves"],
        correct: 0,
        explanation: "Chondrichthyes, such as sharks and rays, have skeletons made entirely of cartilage."
      },
      {
        text: "Which type of jaw suspension allows sharks to protrude their jaws for feeding?",
        options: ["Hyostylic", "Autostylic", "Amphistylic", "Anapsid"],
        correct: 0,
        explanation: "Hyostylic jaw suspension allows sharks to protrude their jaws for feeding and improved prey capture."
      },
      {
        text: "Which evolutionary adaptation in vertebrates improved predation efficiency?",
        options: ["Paired fins", "Development of jaws", "Bony skeleton", "Endothermy"],
        correct: 1,
        explanation: "The evolution of jaws in vertebrates improved feeding efficiency, enabling active predation."
      },
      {
        text: "What type of vertebrae is characteristic of the cervical region in birds?",
        options: ["Procoelous", "Heterocoelous", "Amphicoelous", "Opisthocoelous"],
        correct: 1,
        explanation: "Heterocoelous vertebrae in birds provide flexibility for neck movements, aiding in feeding and flight navigation."
      },
      {
        text: "Which part of the brain in vertebrates controls balance and coordination?",
        options: ["Cerebrum", "Cerebellum", "Medulla oblongata", "Thalamus"],
        correct: 1,
        explanation: "The cerebellum controls balance and motor coordination in vertebrates."
      },
      {
        text: "Which specialized cells produce the myelin sheath in the central nervous system of vertebrates?",
        options: ["Schwann cells", "Astrocytes", "Oligodendrocytes", "Microglia"],
        correct: 2,
        explanation: "Oligodendrocytes produce the myelin sheath in the central nervous system, improving nerve impulse conduction."
      },
      {
        text: "Which vertebrate class exhibits a four-chambered heart with complete separation of oxygenated and deoxygenated blood?",
        options: ["Amphibia", "Aves", "Reptilia", "Chondrichthyes"],
        correct: 1,
        explanation: "Birds have a four-chambered heart with complete separation of oxygenated and deoxygenated blood, supporting endothermy."
      },
      {
        text: "Which region of the vertebrate kidney is responsible for filtering blood?",
        options: ["Loop of Henle", "Glomerulus", "Renal pelvis", "Distal tubule"],
        correct: 1,
        explanation: "The glomerulus in the vertebrate kidney filters blood to form urine."
      },
      {
        text: "Which vertebrate group was the first to exhibit a diaphragm for respiration?",
        options: ["Amphibia", "Reptilia", "Mammalia", "Aves"],
        correct: 2,
        explanation: "Mammals were the first vertebrates to evolve a diaphragm, improving respiratory efficiency."
      },
      {
        text: "Which structure in early vertebrates evolved into the vertebral column?",
        options: ["Notochord", "Neural crest", "Gill arches", "Endostyle"],
        correct: 0,
        explanation: "The notochord in early vertebrates was replaced by the vertebral column during evolution."
      },
      {
        text: "What is the primary function of the Weberian apparatus in certain fishes?",
        options: ["Respiration", "Hearing enhancement", "Buoyancy control", "Osmoregulation"],
        correct: 1,
        explanation: "The Weberian apparatus in fishes like catfish enhances hearing by transmitting sound vibrations to the inner ear."
      },
      {
        text: "Which vertebrate group evolved the earliest amniotic egg?",
        options: ["Amphibia", "Reptilia", "Aves", "Mammalia"],
        correct: 1,
        explanation: "Reptiles were the first vertebrates to evolve the amniotic egg, facilitating reproduction on land."
      },
      {
        text: "Which specialized vertebrate structure ensures unidirectional airflow in bird lungs?",
        options: ["Trachea", "Air sacs", "Bronchioles", "Diaphragm"],
        correct: 1,
        explanation: "Air sacs in birds enable unidirectional airflow, ensuring efficient gas exchange during flight."
      },
      {
        text: "Which type of vertebrae is predominant in the tail region of most vertebrates?",
        options: ["Caudal vertebrae", "Thoracic vertebrae", "Cervical vertebrae", "Lumbar vertebrae"],
        correct: 0,
        explanation: "Caudal vertebrae form the tail region, aiding in locomotion and balance in many vertebrates."
      },
      {
        text: "Which region of the vertebrate brain regulates autonomic functions such as heart rate and respiration?",
        options: ["Cerebrum", "Cerebellum", "Medulla oblongata", "Thalamus"],
        correct: 2,
        explanation: "The medulla oblongata controls autonomic functions like heart rate and respiration in vertebrates."
      },
      {
        text: "What is the role of the pineal gland in vertebrates?",
        options: ["Regulating sleep-wake cycles", "Controlling metabolic rate", "Maintaining balance", "Aiding digestion"],
        correct: 0,
        explanation: "The pineal gland produces melatonin, which regulates sleep-wake cycles in vertebrates."
      },
      {
        text: "Which protein is primarily responsible for structural support in vertebrate connective tissues?",
        options: ["Actin", "Myosin", "Collagen", "Elastin"],
        correct: 2,
        explanation: "Collagen is a key protein that provides structural support in vertebrate connective tissues."
      },
      {
        text: "What evolutionary advancement is associated with the pharyngeal slits in vertebrates?",
        options: ["Formation of lungs", "Development of jaws", "Formation of gills", "Development of kidneys"],
        correct: 2,
        explanation: "Pharyngeal slits evolved into gills in aquatic vertebrates, aiding in respiration."
      },
      {
        text: "Which of the following is a defining characteristic of the class Amphibia?",
        options: ["Amniotic eggs", "Scales", "Moist skin", "Endothermy"],
        correct: 2,
        explanation: "Amphibians are characterized by their moist skin, which is essential for cutaneous respiration."
      },
      {
        text: "What is the function of the swim bladder in bony fishes?",
        options: ["Gas exchange", "Buoyancy control", "Reproduction", "Sensory detection"],
        correct: 1,
        explanation: "The swim bladder in bony fishes helps regulate buoyancy, allowing them to maintain depth without constant swimming."
      },
      {
        text: "Which chordate subphylum includes sessile adults?",
        options: ["Cephalochordata", "Urochordata", "Vertebrata", "Hemichordata"],
        correct: 1,
        explanation: "Urochordates, such as tunicates, are sessile as adults but exhibit chordate features like a notochord during their larval stage."
      },
      {
        text: "What type of circulatory system is found in fish?",
        options: ["Single-loop circulation", "Double-loop circulation", "Open circulation", "Lymphatic circulation"],
        correct: 0,
        explanation: "Fish possess a single-loop circulatory system where blood passes through the heart once per cycle."
      },
      {
        text: "Which vertebrate class is considered the evolutionary link between fish and tetrapods?",
        options: ["Amphibia", "Reptilia", "Mammalia", "Aves"],
        correct: 0,
        explanation: "Amphibians are considered an evolutionary link as they share characteristics with both aquatic and terrestrial animals."
      },
      {
        text: "What feature differentiates jawless fishes from jawed vertebrates?",
        options: ["Presence of gills", "Cartilaginous skeleton", "Absence of jaws", "Paired fins"],
        correct: 2,
        explanation: "Jawless fishes, such as lampreys and hagfish, lack jaws and paired fins."
      },
      {
        text: "Which structure in chordates provides axial support and flexibility?",
        options: ["Notochord", "Vertebral column", "Pharyngeal slits", "Cranium"],
        correct: 0,
        explanation: "The notochord provides axial support and flexibility, serving as the precursor to the vertebral column in vertebrates."
      },
      {
        text: "What is the function of the lateral line system in fishes?",
        options: ["Buoyancy control", "Sensory detection of water movements", "Reproduction", "Respiration"],
        correct: 1,
        explanation: "The lateral line system detects vibrations and water movements, helping fishes navigate and locate prey."
      },
      {
        text: "What structure protects the gills in bony fishes?",
        options: ["Operculum", "Swim bladder", "Gill slits", "Pharyngeal arches"],
        correct: 0,
        explanation: "The operculum is a bony plate that covers and protects the gills in bony fishes."
      },
      {
        text: "Which vertebrate class is characterized by keratinized scales?",
        options: ["Amphibia", "Aves", "Reptilia", "Mammalia"],
        correct: 2,
        explanation: "Reptiles have keratinized scales, which help reduce water loss and protect against desiccation."
      },
      {
        text: "Which adaptation in birds allows for efficient oxygen supply during flight?",
        options: ["Single-loop circulation", "Air sacs", "Lungs with alveoli", "Moist skin"],
        correct: 1,
        explanation: "Birds have air sacs that provide a continuous flow of oxygen through their lungs, ensuring efficient respiration during flight."
      },
      {
        text: "What is a unique feature of monotreme reproduction?",
        options: ["Live birth", "External fertilization", "Egg-laying", "Parthenogenesis"],
        correct: 2,
        explanation: "Monotremes, such as the platypus, are egg-laying mammals."
      },
      {
        text: "Which vertebrates exhibit a three-chambered heart?",
        options: ["Fish", "Amphibians", "Birds", "Mammals"],
        correct: 1,
        explanation: "Amphibians have a three-chambered heart, with two atria and one ventricle."
      },
      {
        text: "Which of the following groups are considered craniates?",
        options: ["Cephalochordates", "Urochordates", "Vertebrates", "Hemichordates"],
        correct: 2,
        explanation: "Vertebrates are craniates, as they possess a skull that encases the brain."
      },
      {
        text: "Which group of vertebrates was the first to evolve jaws?",
        options: ["Chondrichthyes", "Osteichthyes", "Agnatha", "Amphibia"],
        correct: 0,
        explanation: "Chondrichthyes, such as sharks, were the first vertebrates to evolve jaws."
      },
      {
        text: "Which chordate structure evolved into the thyroid gland in vertebrates?",
        options: ["Notochord", "Endostyle", "Dorsal nerve cord", "Pharyngeal slits"],
        correct: 1,
        explanation: "The endostyle, a feeding structure in primitive chordates, evolved into the thyroid gland in vertebrates."
      },
      {
        text: "Which vertebrate group includes ray-finned fishes?",
        options: ["Chondrichthyes", "Osteichthyes", "Amphibia", "Mammalia"],
        correct: 1,
        explanation: "Ray-finned fishes belong to the class Osteichthyes, the bony fishes."
      },
      {
        text: "Which organ is responsible for excretion and osmoregulation in vertebrates?",
        options: ["Liver", "Kidney", "Heart", "Stomach"],
        correct: 1,
        explanation: "The kidney is responsible for excretion and maintaining water and electrolyte balance in vertebrates."
      },
      {
        text: "Which vertebrate class is known for external fertilization?",
        options: ["Reptilia", "Amphibia", "Mammalia", "Aves"],
        correct: 1,
        explanation: "Most amphibians exhibit external fertilization, where eggs and sperm are released into water."
      },
      {
        text: "Which vertebrate group first exhibited an amniotic egg?",
        options: ["Fish", "Amphibians", "Reptiles", "Birds"],
        correct: 2,
        explanation: "Reptiles were the first vertebrates to lay amniotic eggs, enabling reproduction on land."
      },
      {
        text: "What is the function of the cloaca in amphibians and reptiles?",
        options: ["Respiration", "Excretion and reproduction", "Locomotion", "Protection"],
        correct: 1,
        explanation: "The cloaca is a common opening for excretion, reproduction, and digestion in amphibians and reptiles."
      },
      {
        text: "What feature is shared by all vertebrate embryos during development?",
        options: ["Scales", "Pharyngeal slits", "Paired appendages", "Exoskeleton"],
        correct: 1,
        explanation: "All vertebrate embryos possess pharyngeal slits at some stage of development."
      },
      {
        text: "What is the primary function of the vertebral column?",
        options: ["Locomotion", "Respiration", "Protection of the spinal cord", "Nutrient storage"],
        correct: 2,
        explanation: "The vertebral column protects the spinal cord and provides structural support."
      },
      {
        text: "Which of the following vertebrates is ectothermic?",
        options: ["Birds", "Mammals", "Reptiles", "None of the above"],
        correct: 2,
        explanation: "Reptiles are ectothermic, meaning their body temperature is regulated by external conditions."
      },
      {
        text: "Which vertebrate group includes lungfish?",
        options: ["Chondrichthyes", "Amphibia", "Sarcopterygii", "Aves"],
        correct: 2,
        explanation: "Lungfish belong to the class Sarcopterygii, the lobe-finned fishes."
      },
      {
        text: "Which vertebrates exhibit placental development?",
        options: ["Monotremes", "Reptiles", "Marsupials", "Eutherians"],
        correct: 3,
        explanation: "Eutherians, or placental mammals, exhibit placental development where the embryo is nourished in the uterus."
      },
      {
        text: "Which vertebrate class lacks a true stomach?",
        options: ["Osteichthyes", "Chondrichthyes", "Amphibia", "Agnatha"],
        correct: 3,
        explanation: "Agnatha, or jawless fishes, lack a true stomach and rely on direct absorption of nutrients."
      },
      {
        text: "What structure facilitates oxygen uptake in amphibian larvae?",
        options: ["Lungs", "Gills", "Skin", "Pharyngeal arches"],
        correct: 1,
        explanation: "Amphibian larvae, such as tadpoles, rely on gills for oxygen uptake in aquatic environments."
      }, 
{   text: "Which of the following is a defining feature of Phylum Chordata?",
        options: ["Notochord", "Open circulatory system", "Segmented body", "Exoskeleton"],
        correct: 0,
        explanation: "Chordates are characterized by the presence of a notochord, a flexible rod-like structure found during some stage of their life."
      },
      {
        text: "What structure in chordates develops into the spinal cord in vertebrates?",
        options: ["Notochord", "Pharyngeal slits", "Dorsal hollow nerve cord", "Gill arches"],
        correct: 2,
        explanation: "The dorsal hollow nerve cord in chordates develops into the spinal cord and brain in vertebrates."
      },
      {
        text: "Which of the following is a subphylum of Chordata?",
        options: ["Arthropoda", "Urochordata", "Echinodermata", "Cnidaria"],
        correct: 1,
        explanation: "The subphylum Urochordata includes tunicates, which are marine chordates."
      },
      {
        text: "Which subphylum of Chordata includes vertebrates?",
        options: ["Urochordata", "Cephalochordata", "Vertebrata", "Hemichordata"],
        correct: 2,
        explanation: "The subphylum Vertebrata includes chordates with a backbone or vertebral column."
      },
      {
        text: "Which feature is common to all chordates during their life cycle?",
        options: ["Scales", "Notochord", "Paired appendages", "Exoskeleton"],
        correct: 1,
        explanation: "All chordates possess a notochord at some stage in their life cycle."
      },
      {
        text: "Which chordate group retains the notochord throughout life?",
        options: ["Urochordata", "Cephalochordata", "Vertebrata", "Amphibia"],
        correct: 1,
        explanation: "In cephalochordates, such as lancelets, the notochord is retained throughout life."
      },
      {
        text: "What is the function of pharyngeal slits in primitive chordates?",
        options: ["Gas exchange", "Reproduction", "Support", "Locomotion"],
        correct: 0,
        explanation: "In primitive chordates, pharyngeal slits are used for gas exchange and sometimes feeding."
      },
      {
        text: "Which of the following animals belongs to the subphylum Cephalochordata?",
        options: ["Lancelet", "Frog", "Shark", "Tunicate"],
        correct: 0,
        explanation: "Lancelets, or amphioxus, belong to the subphylum Cephalochordata."
      },
      {
        text: "What structure protects the brain in vertebrates?",
        options: ["Notochord", "Cranium", "Dorsal nerve cord", "Pharyngeal slits"],
        correct: 1,
        explanation: "The cranium, or skull, protects the brain in vertebrates."
      },
      {
        text: "Which vertebrate class is characterized by the presence of feathers?",
        options: ["Mammalia", "Reptilia", "Aves", "Amphibia"],
        correct: 2,
        explanation: "Birds, classified under Aves, are characterized by the presence of feathers."
      },
      {
        text: "Which vertebrate group is known for laying amniotic eggs?",
        options: ["Fish", "Amphibians", "Reptiles", "Lancelets"],
        correct: 2,
        explanation: "Reptiles lay amniotic eggs, which have protective membranes allowing development on land."
      },
      {
        text: "What distinguishes vertebrates from invertebrate chordates?",
        options: ["Presence of a dorsal nerve cord", "Presence of a notochord", "Presence of a vertebral column", "Presence of gills"],
        correct: 2,
        explanation: "Vertebrates have a vertebral column that replaces the notochord in adults."
      },
      {
        text: "What is a unique feature of the class Mammalia?",
        options: ["Scales", "Ectothermy", "Hair or fur", "Amniotic eggs"],
        correct: 2,
        explanation: "Mammals are characterized by the presence of hair or fur and mammary glands for milk production."
      },
      {
        text: "Which vertebrate class has a cartilaginous skeleton?",
        options: ["Osteichthyes", "Chondrichthyes", "Aves", "Amphibia"],
        correct: 1,
        explanation: "Chondrichthyes, such as sharks and rays, have a skeleton made of cartilage instead of bone."
      },
      {
        text: "Which vertebrates are known for their ability to live both on land and in water?",
        options: ["Reptiles", "Amphibians", "Birds", "Mammals"],
        correct: 1,
        explanation: "Amphibians, such as frogs and salamanders, can live both on land and in water."
      },
      {
        text: "Which subphylum of chordates is entirely marine?",
        options: ["Urochordata", "Cephalochordata", "Vertebrata", "Mammalia"],
        correct: 0,
        explanation: "Urochordata, or tunicates, are exclusively marine animals."
      },
      {
        text: "Which vertebrate class is characterized by endothermy and the presence of a diaphragm?",
        options: ["Amphibia", "Reptilia", "Mammalia", "Aves"],
        correct: 2,
        explanation: "Mammals are endothermic and possess a diaphragm for efficient respiration."
      },
      {
        text: "Which chordate structure evolves into the jaw in vertebrates?",
        options: ["Pharyngeal arches", "Notochord", "Dorsal nerve cord", "Cranium"],
        correct: 0,
        explanation: "The pharyngeal arches in primitive chordates evolve into jaws and other facial structures in vertebrates."
      },
      {
        text: "What is the primary function of the notochord in early chordates?",
        options: ["Protection", "Support", "Respiration", "Reproduction"],
        correct: 1,
        explanation: "The notochord provides structural support and serves as an attachment point for muscles."
      },
      {
        text: "Which vertebrate class includes the largest number of species?",
        options: ["Mammalia", "Aves", "Osteichthyes", "Amphibia"],
        correct: 2,
        explanation: "Osteichthyes, or bony fishes, represent the largest vertebrate class in terms of species diversity."
      },
      {
        text: "What feature distinguishes cartilaginous fishes from bony fishes?",
        options: ["Endoskeleton", "Gills", "Cartilage skeleton", "Fins"],
        correct: 2,
        explanation: "Cartilaginous fishes, such as sharks, have skeletons made of cartilage, unlike bony fishes."
      },
      {
        text: "Which vertebrate group exhibits the highest degree of parental care?",
        options: ["Reptiles", "Amphibians", "Birds", "Fish"],
        correct: 2,
        explanation: "Birds exhibit advanced parental care, including incubation and feeding their young."
      },
      {
        text: "Which class of vertebrates includes monotremes, marsupials, and placental mammals?",
        options: ["Reptilia", "Aves", "Mammalia", "Amphibia"],
        correct: 2,
        explanation: "The class Mammalia includes monotremes (egg-laying), marsupials, and placental mammals."
      },
      {
        text: "What is a distinguishing feature of amphibians compared to reptiles?",
        options: ["Amniotic eggs", "Metamorphosis", "Dry skin", "Internal fertilization"],
        correct: 1,
        explanation: "Amphibians undergo metamorphosis, transitioning from an aquatic larval stage to a terrestrial adult."
      },
      {
        text: "Which structure allows tunicates to filter feed?",
        options: ["Pharyngeal basket", "Cranium", "Notochord", "Fins"],
        correct: 0,
        explanation: "Tunicates use their pharyngeal basket to filter food particles from water."
      },
      {
        text: "Which vertebrate group is characterized by hollow bones and adaptations for flight?",
        options: ["Mammals", "Reptiles", "Aves", "Amphibians"],
        correct: 2,
        explanation: "Birds (Aves) have hollow bones and other adaptations for flight."
      },
      {
        text: "Which feature distinguishes reptiles from amphibians?",
        options: ["Dry, scaly skin", "Lack of jaws", "Aquatic reproduction", "Gills in adults"],
        correct: 0,
        explanation: "Reptiles have dry, scaly skin, which prevents water loss and allows them to live in arid environments."
      },
      {
        text: "Which chordate subphylum is considered the closest relative to vertebrates?",
        options: ["Cephalochordata", "Urochordata", "Hemichordata", "Arthropoda"],
        correct: 1,
        explanation: "Urochordates are considered the closest relatives of vertebrates based on molecular and developmental evidence."
      },
      {
        text: "What is a distinguishing feature of the vertebrate circulatory system?",
        options: ["Open system", "Multiple hearts", "Closed system with a heart", "Blood sinuses"],
        correct: 2,
        explanation: "Vertebrates have a closed circulatory system with a heart that pumps blood through vessels."
      },
      {
        text: "Which vertebrates are ectothermic and rely on environmental heat for body temperature regulation?",
        options: ["Mammals", "Birds", "Reptiles", "Amphibians"],
        correct: 2,
        explanation: "Reptiles are ectothermic, relying on external heat sources to regulate body temperature."
      }, 
      {
        text: "What is the role of the gray crescent in amphibian development?",
        options: ["Defines the dorsal side", "Provides nutrients", "Prevents polyspermy", "Forms the blastocoel"],
        correct: 0,
        explanation: "The gray crescent in amphibians marks the future dorsal side and plays a critical role in axis formation."
      },
      {
        text: "Which process is responsible for the formation of the germ layers in the embryo?",
        options: ["Cleavage", "Gastrulation", "Oogenesis", "Fertilization"],
        correct: 1,
        explanation: "Gastrulation reorganizes the blastula to form three germ layers: ectoderm, mesoderm, and endoderm."
      },
      {
        text: "What is the significance of maternal mRNA during early cleavage?",
        options: ["Drives early development", "Synthesizes yolk", "Prevents polyspermy", "Promotes gastrulation"],
        correct: 0,
        explanation: "Maternal mRNA stored in the egg directs protein synthesis necessary for early embryonic development."
      },
      {
        text: "Which germ layer forms the nervous system?",
        options: ["Ectoderm", "Mesoderm", "Endoderm", "Blastoderm"],
        correct: 0,
        explanation: "The ectoderm gives rise to the nervous system, including the brain and spinal cord."
      },
      {
        text: "What is the blastopore's fate in deuterostomes?",
        options: ["Becomes the mouth", "Becomes the anus", "Forms the notochord", "Disappears during development"],
        correct: 1,
        explanation: "In deuterostomes, the blastopore develops into the anus, while the mouth forms later."
      },
      {
        text: "Which structure regulates sperm entry into the oocyte?",
        options: ["Zona pellucida", "Corona radiata", "Cortical granules", "Blastodisc"],
        correct: 0,
        explanation: "The zona pellucida facilitates sperm binding and regulates entry, preventing polyspermy."
      },
      {
        text: "What is a morula in embryonic development?",
        options: ["A hollow ball of cells", "A solid ball of cells", "A fertilized zygote", "A germ layer"],
        correct: 1,
        explanation: "The morula is a solid ball of cells formed after several cleavage divisions of the zygote."
      },
      {
        text: "What happens to the polar bodies produced during oogenesis?",
        options: ["They develop into blastomeres", "They degenerate", "They fuse with sperm", "They become yolk sacs"],
        correct: 1,
        explanation: "Polar bodies are non-functional byproducts of meiosis and eventually degenerate."
      },
      {
        text: "Which cleavage pattern is characterized by cells dividing at an angle?",
        options: ["Spiral cleavage", "Radial cleavage", "Holoblastic cleavage", "Superficial cleavage"],
        correct: 0,
        explanation: "Spiral cleavage involves oblique divisions, common in protostomes like mollusks."
      },
      {
        text: "What determines the polarity of an egg?",
        options: ["Yolk distribution", "Maternal mRNA", "Zona pellucida", "Blastomere position"],
        correct: 0,
        explanation: "The distribution of yolk within the egg establishes polarity, defining animal and vegetal poles."
      },
      {
        text: "What is the function of the fertilization membrane?",
        options: ["Prevents polyspermy", "Initiates cleavage", "Stores yolk", "Stimulates gastrulation"],
        correct: 0,
        explanation: "The fertilization membrane forms after sperm entry to block additional sperm, ensuring monospermy."
      },
      {
        text: "Which embryonic structure becomes the placenta in mammals?",
        options: ["Trophoblast", "Blastocoel", "Inner cell mass", "Morula"],
        correct: 0,
        explanation: "The trophoblast contributes to the formation of the placenta, supporting embryo development."
      },
      {
        text: "What type of cleavage occurs in fish embryos?",
        options: ["Discoidal cleavage", "Radial cleavage", "Holoblastic cleavage", "Superficial cleavage"],
        correct: 0,
        explanation: "Fish embryos exhibit discoidal cleavage due to the high yolk content restricting division to the animal pole."
      },
      {
        text: "Which stage of cleavage results in a hollow ball of cells?",
        options: ["Blastula", "Morula", "Gastrula", "Zygote"],
        correct: 0,
        explanation: "The blastula stage forms a hollow ball of cells with a fluid-filled cavity called the blastocoel."
      },
      {
        text: "Which germ layer forms the skeletal system?",
        options: ["Ectoderm", "Mesoderm", "Endoderm", "Trophoblast"],
        correct: 1,
        explanation: "The mesoderm develops into the skeletal system, muscles, and other connective tissues."
      },
      {
        text: "What triggers the cortical reaction during fertilization?",
        options: ["Sperm entry", "Zygote formation", "Cleavage initiation", "Blastula formation"],
        correct: 0,
        explanation: "Sperm entry triggers the cortical reaction, releasing enzymes that prevent polyspermy."
      },
      {
        text: "Which type of eggs exhibit superficial cleavage?",
        options: ["Isolecithal eggs", "Telolecithal eggs", "Centrolecithal eggs", "Mesolecithal eggs"],
        correct: 2,
        explanation: "Superficial cleavage occurs in centrolecithal eggs, typical of insects, with cleavage restricted to the periphery."
      },
      {
        text: "What is the primary function of the zona pellucida?",
        options: ["Promotes cleavage", "Protects the oocyte", "Guides gastrulation", "Stores nutrients"],
        correct: 1,
        explanation: "The zona pellucida protects the oocyte and mediates sperm binding during fertilization."
      },
      {
        text: "Which type of symmetry is established during the early cleavage stages?",
        options: ["Radial symmetry", "Bilateral symmetry", "Asymmetry", "Triradial symmetry"],
        correct: 1,
        explanation: "Bilateral symmetry is often established during early cleavage, as seen in many vertebrates."
      },
      {
        text: "Which term describes a large yolked egg with restricted cleavage?",
        options: ["Isolecithal", "Mesolecithal", "Telolecithal", "Centrolecithal"],
        correct: 2,
        explanation: "Telolecithal eggs contain large yolk reserves that limit cleavage to specific regions, such as the animal pole."
      },
      {
        text: "What is the significance of the animal pole in embryogenesis?",
        options: ["Contains the yolk", "Facilitates fertilization", "Leads cell divisions", "Guides gastrulation"],
        correct: 2,
        explanation: "The animal pole is the site of active cell division, contrasting with the yolk-rich vegetal pole."
      },
      {
        text: "Which layer of the blastocyst develops into the embryo in mammals?",
        options: ["Trophoblast", "Inner cell mass", "Blastocoel", "Zona pellucida"],
        correct: 1,
        explanation: "The inner cell mass of the blastocyst differentiates into the embryo, while the trophoblast forms supporting structures."
      },
      {
        text: "Which cleavage pattern is characteristic of sea urchins?",
        options: ["Radial cleavage", "Spiral cleavage", "Discoidal cleavage", "Superficial cleavage"],
        correct: 0,
        explanation: "Sea urchins exhibit radial cleavage, a feature of deuterostomes like echinoderms."
      },
      {
        text: "What is the primary outcome of meiosis during oogenesis?",
        options: ["Four haploid ova", "One haploid ovum and polar bodies", "Two diploid ova", "One diploid ovum"],
        correct: 1,
        explanation: "Meiosis during oogenesis produces one functional haploid ovum and three polar bodies."
      },
      {
        text: "Which process establishes the body axes during embryonic development?",
        options: ["Fertilization", "Cleavage", "Gastrulation", "Neurulation"],
        correct: 2,
        explanation: "Gastrulation establishes the primary body axes, laying the groundwork for subsequent organogenesis."
      },
      {
        text: "Which embryonic structure contains the first cavity formed during development?",
        options: ["Blastocoel", "Archenteron", "Morula", "Blastoderm"],
        correct: 0,
        explanation: "The blastocoel is the first cavity to form, appearing during the blastula stage of embryonic development."
      },
      {
        text: "What role does yolk play in cleavage patterns?",
        options: ["Defines cell size", "Inhibits cleavage", "Determines cleavage speed", "All of the above"],
        correct: 3,
        explanation: "Yolk affects cleavage by influencing cell size, division speed, and cleavage patterns."
      },
      {
        text: "Which process follows cleavage during embryonic development?",
        options: ["Fertilization", "Gastrulation", "Oogenesis", "Neurulation"],
        correct: 1,
        explanation: "Gastrulation follows cleavage, transforming the blastula into a multilayered embryo."
      },
      {
        text: "What is the primary function of oocytes arresting in metaphase II?",
        options: ["Preventing polyspermy", "Synchronizing fertilization", "Awaiting fertilization", "Guiding cleavage"],
        correct: 2,
        explanation: "Oocytes arrest in metaphase II to await fertilization, ensuring meiosis resumes only when sperm binds."
      }, 
  
      {
        text: "What is the term for the hierarchical organization of animal structures from simple to complex?",
        options: ["Cellular level", "Tissue level", "Organ system level", "All of the above"],
        correct: 3,
        explanation: "Animal complexity progresses from the cellular level to tissues, organs, and organ systems, representing increasing specialization."
      },
      {
        text: "Which type of cleavage results in cells that can individually develop into a complete organism?",
        options: ["Radial cleavage", "Spiral cleavage", "Holoblastic cleavage", "Indeterminate cleavage"],
        correct: 3,
        explanation: "Indeterminate cleavage produces cells capable of forming a complete organism due to their totipotency."
      },
      {
        text: "What is the primary function of oogenesis?",
        options: ["Production of somatic cells", "Production of gametes", "Formation of the blastula", "Cleavage regulation"],
        correct: 1,
        explanation: "Oogenesis is the process by which gametes (ova or eggs) are produced in females."
      },
      {
        text: "In which animal group does spiral cleavage commonly occur?",
        options: ["Echinoderms", "Mollusks", "Chordates", "Cnidarians"],
        correct: 1,
        explanation: "Spiral cleavage is characteristic of mollusks and some other protostomes, distinguishing them from deuterostomes like echinoderms."
      },
      {
        text: "Which of the following terms describes the unequal distribution of yolk in an egg?",
        options: ["Isolecithal", "Mesolecithal", "Telolecithal", "Centrolecithal"],
        correct: 2,
        explanation: "Telolecithal eggs have a large amount of yolk concentrated at one pole, creating an unequal distribution."
      },
      {
        text: "What type of cleavage occurs in eggs with moderate yolk content?",
        options: ["Holoblastic cleavage", "Meroblastic cleavage", "Spiral cleavage", "Radial cleavage"],
        correct: 0,
        explanation: "Holoblastic cleavage occurs in eggs with moderate yolk, such as amphibian eggs, allowing complete division of the zygote."
      },
      {
        text: "What is the primary outcome of the cleavage process during early embryonic development?",
        options: ["Formation of gametes", "Increase in cell size", "Formation of a multicellular blastula", "Growth of the embryo"],
        correct: 2,
        explanation: "Cleavage transforms the single-celled zygote into a multicellular blastula without increasing overall size."
      },
      {
        text: "Which type of cleavage is associated with echinoderms and chordates?",
        options: ["Radial cleavage", "Spiral cleavage", "Holoblastic cleavage", "Meroblastic cleavage"],
        correct: 0,
        explanation: "Radial cleavage, common in echinoderms and chordates, is characterized by cells dividing parallel or perpendicular to the embryo's axis."
      },
      {
        text: "Which of the following is NOT a stage of oogenesis?",
        options: ["Multiplication phase", "Growth phase", "Maturation phase", "Cleavage phase"],
        correct: 3,
        explanation: "Oogenesis consists of multiplication, growth, and maturation phases; cleavage occurs post-fertilization."
      },
      {
        text: "Which cleavage type is typical of bird and reptile embryos?",
        options: ["Radial cleavage", "Discoidal cleavage", "Spiral cleavage", "Superficial cleavage"],
        correct: 1,
        explanation: "Bird and reptile embryos exhibit discoidal cleavage due to the large yolk, restricting division to a small disc at the animal pole."
      },
      {
        text: "What role does yolk play in embryonic development?",
        options: ["Provides nutrients", "Triggers cleavage", "Defines symmetry", "Regulates mitosis"],
        correct: 0,
        explanation: "Yolk serves as the primary source of nutrients for the developing embryo until external feeding is established."
      },
      {
        text: "What type of cleavage is observed in centrolecithal eggs of insects?",
        options: ["Discoidal cleavage", "Superficial cleavage", "Radial cleavage", "Spiral cleavage"],
        correct: 1,
        explanation: "Superficial cleavage occurs in centrolecithal eggs where division happens around the periphery of the yolk."
      },
      {
        text: "Which phase of oogenesis involves the accumulation of ribosomes and mitochondria in the oocyte?",
        options: ["Multiplication phase", "Growth phase", "Maturation phase", "Cleavage phase"],
        correct: 1,
        explanation: "The growth phase prepares the oocyte for fertilization by accumulating organelles and resources like ribosomes and mitochondria."
      },
      {
        text: "What is the function of polar bodies in oogenesis?",
        options: ["Supply nutrients", "Eliminate excess chromosomes", "Form blastomeres", "Aid in cleavage"],
        correct: 1,
        explanation: "Polar bodies form during meiosis in oogenesis to discard extra chromosomes, ensuring a haploid ovum."
      },
      {
        text: "Which group of animals typically exhibits mesolecithal eggs?",
        options: ["Amphibians", "Mammals", "Birds", "Insects"],
        correct: 0,
        explanation: "Amphibians produce mesolecithal eggs with moderate yolk, leading to uneven cleavage patterns."
      },
      {
        text: "What is the primary factor determining cleavage patterns in animals?",
        options: ["Egg size", "Yolk amount and distribution", "Cell shape", "Embryonic genome activation"],
        correct: 1,
        explanation: "Cleavage patterns are influenced by the amount and distribution of yolk within the egg."
      },
      {
        text: "Which of the following describes a holoblastic cleavage pattern?",
        options: ["Partial cleavage", "Complete cleavage", "Yolk-free cleavage", "Peripheral cleavage"],
        correct: 1,
        explanation: "Holoblastic cleavage involves complete division of the egg, typical of isolecithal or moderately yolked eggs."
      },
      {
        text: "What structure forms at the end of cleavage during embryonic development?",
        options: ["Morula", "Blastula", "Gastrula", "Zygote"],
        correct: 1,
        explanation: "Cleavage results in a blastula, a hollow sphere of cells ready for gastrulation."
      },
      {
        text: "Which of the following is a characteristic feature of discoidal cleavage?",
        options: ["Cleavage confined to one region", "Complete division of the egg", "Cleavage around yolk", "Asynchronous cleavage"],
        correct: 0,
        explanation: "Discoidal cleavage occurs in large yolked eggs, where cell division is limited to a small disc at the animal pole."
      },
      {
        text: "What is the significance of the zona pellucida in fertilization?",
        options: ["Prevents multiple sperm entry", "Provides nutrients", "Supports mitosis", "Initiates cleavage"],
        correct: 0,
        explanation: "The zona pellucida prevents polyspermy by blocking additional sperm after the first fertilization event."
      },
      {
        text: "Which layer of the blastula is involved in forming the digestive tract during gastrulation?",
        options: ["Ectoderm", "Mesoderm", "Endoderm", "Trophoblast"],
        correct: 2,
        explanation: "The endoderm develops into the digestive and respiratory systems during gastrulation."
      },
      {
        text: "What is the importance of vegetal pole yolk in embryogenesis?",
        options: ["Prevents cleavage", "Provides nutrients", "Triggers gastrulation", "Forms neural tissues"],
        correct: 1,
        explanation: "The yolk concentrated at the vegetal pole provides essential nutrients for embryonic development."
      },
      {
        text: "Which phase of oogenesis includes arrest in metaphase II until fertilization?",
        options: ["Multiplication phase", "Growth phase", "Maturation phase", "Cleavage phase"],
        correct: 2,
        explanation: "The oocyte arrests in metaphase II of meiosis during maturation, resuming only upon fertilization."
      },
      {
        text: "What type of symmetry is commonly observed in zygotes with radial cleavage?",
        options: ["Radial symmetry", "Bilateral symmetry", "Asymmetry", "Spiral symmetry"],
        correct: 0,
        explanation: "Radial cleavage in zygotes typically leads to radial symmetry, as seen in echinoderms."
      },
      {
        text: "Which cells form the blastocoel in the blastula?",
        options: ["Outer cells", "Inner cells", "Polar bodies", "Yolk cells"],
        correct: 1,
        explanation: "Inner cells of the blastula form the blastocoel, a fluid-filled cavity essential for gastrulation."
      }, 
    {
        text: "What is the term for the hierarchical organization of animal structures from simple to complex?",
        options: ["Cellular level", "Tissue level", "Organ system level", "All of the above"],
        correct: 3,
        explanation: "Animal complexity progresses from the cellular level to tissues, organs, and organ systems, representing increasing specialization."
      },
      {
        text: "Which type of cleavage results in cells that can individually develop into a complete organism?",
        options: ["Radial cleavage", "Spiral cleavage", "Holoblastic cleavage", "Indeterminate cleavage"],
        correct: 3,
        explanation: "Indeterminate cleavage produces cells capable of forming a complete organism due to their totipotency."
      },
      {
        text: "What is the primary function of oogenesis?",
        options: ["Production of somatic cells", "Production of gametes", "Formation of the blastula", "Cleavage regulation"],
        correct: 1,
        explanation: "Oogenesis is the process by which gametes (ova or eggs) are produced in females."
      },
      {
        text: "In which animal group does spiral cleavage commonly occur?",
        options: ["Echinoderms", "Mollusks", "Chordates", "Cnidarians"],
        correct: 1,
        explanation: "Spiral cleavage is characteristic of mollusks and some other protostomes, distinguishing them from deuterostomes like echinoderms."
      },
      {
        text: "Which of the following terms describes the unequal distribution of yolk in an egg?",
        options: ["Isolecithal", "Mesolecithal", "Telolecithal", "Centrolecithal"],
        correct: 2,
        explanation: "Telolecithal eggs have a large amount of yolk concentrated at one pole, creating an unequal distribution."
      },
      {
        text: "What type of cleavage occurs in eggs with moderate yolk content?",
        options: ["Holoblastic cleavage", "Meroblastic cleavage", "Spiral cleavage", "Radial cleavage"],
        correct: 0,
        explanation: "Holoblastic cleavage occurs in eggs with moderate yolk, such as amphibian eggs, allowing complete division of the zygote."
      },
      {
        text: "What is the primary outcome of the cleavage process during early embryonic development?",
        options: ["Formation of gametes", "Increase in cell size", "Formation of a multicellular blastula", "Growth of the embryo"],
        correct: 2,
        explanation: "Cleavage transforms the single-celled zygote into a multicellular blastula without increasing overall size."
      },
      {
        text: "Which type of cleavage is associated with echinoderms and chordates?",
        options: ["Radial cleavage", "Spiral cleavage", "Holoblastic cleavage", "Meroblastic cleavage"],
        correct: 0,
        explanation: "Radial cleavage, common in echinoderms and chordates, is characterized by cells dividing parallel or perpendicular to the embryo's axis."
      },
      {
        text: "Which of the following is NOT a stage of oogenesis?",
        options: ["Multiplication phase", "Growth phase", "Maturation phase", "Cleavage phase"],
        correct: 3,
        explanation: "Oogenesis consists of multiplication, growth, and maturation phases; cleavage occurs post-fertilization."
      },
      {
        text: "Which cleavage type is typical of bird and reptile embryos?",
        options: ["Radial cleavage", "Discoidal cleavage", "Spiral cleavage", "Superficial cleavage"],
        correct: 1,
        explanation: "Bird and reptile embryos exhibit discoidal cleavage due to the large yolk, restricting division to a small disc at the animal pole."
      },
      {
        text: "What role does yolk play in embryonic development?",
        options: ["Provides nutrients", "Triggers cleavage", "Defines symmetry", "Regulates mitosis"],
        correct: 0,
        explanation: "Yolk serves as the primary source of nutrients for the developing embryo until external feeding is established."
      },
      {
        text: "What type of cleavage is observed in centrolecithal eggs of insects?",
        options: ["Discoidal cleavage", "Superficial cleavage", "Radial cleavage", "Spiral cleavage"],
        correct: 1,
        explanation: "Superficial cleavage occurs in centrolecithal eggs where division happens around the periphery of the yolk."
      },
      {
        text: "Which phase of oogenesis involves the accumulation of ribosomes and mitochondria in the oocyte?",
        options: ["Multiplication phase", "Growth phase", "Maturation phase", "Cleavage phase"],
        correct: 1,
        explanation: "The growth phase prepares the oocyte for fertilization by accumulating organelles and resources like ribosomes and mitochondria."
      },
      {
        text: "What is the function of polar bodies in oogenesis?",
        options: ["Supply nutrients", "Eliminate excess chromosomes", "Form blastomeres", "Aid in cleavage"],
        correct: 1,
        explanation: "Polar bodies form during meiosis in oogenesis to discard extra chromosomes, ensuring a haploid ovum."
      },
      {
        text: "Which group of animals typically exhibits mesolecithal eggs?",
        options: ["Amphibians", "Mammals", "Birds", "Insects"],
        correct: 0,
        explanation: "Amphibians produce mesolecithal eggs with moderate yolk, leading to uneven cleavage patterns."
      },
      {
        text: "What is the primary factor determining cleavage patterns in animals?",
        options: ["Egg size", "Yolk amount and distribution", "Cell shape", "Embryonic genome activation"],
        correct: 1,
        explanation: "Cleavage patterns are influenced by the amount and distribution of yolk within the egg."
      },
      {
        text: "Which of the following describes a holoblastic cleavage pattern?",
        options: ["Partial cleavage", "Complete cleavage", "Yolk-free cleavage", "Peripheral cleavage"],
        correct: 1,
        explanation: "Holoblastic cleavage involves complete division of the egg, typical of isolecithal or moderately yolked eggs."
      },
      {
        text: "What structure forms at the end of cleavage during embryonic development?",
        options: ["Morula", "Blastula", "Gastrula", "Zygote"],
        correct: 1,
        explanation: "Cleavage results in a blastula, a hollow sphere of cells ready for gastrulation."
      },
      {
        text: "Which of the following is a characteristic feature of discoidal cleavage?",
        options: ["Cleavage confined to one region", "Complete division of the egg", "Cleavage around yolk", "Asynchronous cleavage"],
        correct: 0,
        explanation: "Discoidal cleavage occurs in large yolked eggs, where cell division is limited to a small disc at the animal pole."
      },
      {
        text: "What is the significance of the zona pellucida in fertilization?",
        options: ["Prevents multiple sperm entry", "Provides nutrients", "Supports mitosis", "Initiates cleavage"],
        correct: 0,
        explanation: "The zona pellucida prevents polyspermy by blocking additional sperm after the first fertilization event."
      }, 
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
        }, 
        // Add more Animal Systematics questions here...
      ]
    }
  }, 

    Chemistry: {
    "Chm101-pap": {
      title: "Introductory Chemistry 1",
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
        }, 
        ] 
    },     

    "Chm102-1": {
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
        }, 
        // Add more Animal Systematics questions here...
      ]
    }
  }, 
    
Botany: {
  "BOT202": {
        title: "Biometry/Biostatistics",
        questions: [
          { text: "What is 2 + 2?", options: ["2", "3", "4", "5"], correct: 2, explanation: "2 + 2 equals 4." },
          { text: "What is 3 x 3?", options: ["6", "9", "12", "15"], correct: 1, explanation: "3 x 3 equals 9." },
        ]
      },

    "BOT203": {
        title: "Welcome to the World of Genetics",
        questions: [
          { text: "What is 2 + 2?", options: ["2", "3", "4", "5"], correct: 2, explanation: "2 + 2 equals 4." },
          { text: "What is 3 x 3?", options: ["6", "9", "12", "15"], correct: 1, explanation: "3 x 3 equals 9." },
        ]
      },

      "BOT102-1": {
        title: "Introductory Botany 2",
        questions: [
          { text: "What is 2 + 2?", options: ["2", "3", "4", "5"], correct: 2, explanation: "2 + 2 equals 4." },
          { text: "What is 3 x 3?", options: ["6", "9", "12", "15"], correct: 1, explanation: "3 x 3 equals 9." },
        ]
      },         
    
  "BOT101": {
    title: "INTRODUCTORY BOTANY 1",
    questions: [
      {
        text: "A rough idea of cell division was given by:",
        options: ["Hofmeister", "Von Mohl", "Flemmings", "Weismann"],
        correct: 1,
        explanation: "Hugo von Mohl was one of the early scientists to provide insights into cell division processes."
      },  
 {
    text: "Which of the following terms represent a pair of contrasting characters?",
    options: ["homozygous", "heterozygous", "alleles", "codominant genes"],
    correct: 2,
    explanation: "Alleles represent contrasting forms of a gene. For example, in pea plants, the gene for flower color has two alleles: one for purple flowers (P) and one for white flowers (p).  Homozygous and heterozygous describe the combination of alleles an individual possesses, not the contrasting characters themselves. Codominant genes are a special case where both alleles are expressed equally, but they still represent contrasting traits."
  },
  {
    text: "The best method to determine the genotype of a dominant parent is by crossing it with a hybrid. This method is called",
    options: ["back cross", "test cross", "selfing", "cross fertilization"],
    correct: 1,
    explanation: "A test cross involves crossing an individual with a dominant phenotype (but unknown genotype) with a homozygous recessive individual. The offspring's phenotype reveals the unknown parent's genotype.  A backcross is a cross between an offspring and one of its parents (or an individual genetically similar to its parent). While it can sometimes help determine genotype, a test cross is more direct for determining the genotype of a dominant parent."
  },
 
  {
    text: "The forerunner of the microscope and telescope is/are",
    options: ["Anton van Leeuwenhoek", "Galileo", "Zacharias Janssen", "Charles Spencer"],
    correct: 2,
    explanation: "Zacharias Janssen is often credited with inventing the first compound microscope, while Galileo Galilei improved the design of telescopes, which share optical principles with microscopes."
  },
  {
    text: "Who is referred to as the father of physics and astronomy who made a better microscope with a focusing device?",
    options: ["Anton van Leeuwenhoek", "Galileo", "Zacharias Janssen", "Charles Spencer"],
    correct: 1,
    explanation: "While not solely focused on microscopy, Galileo Galilei significantly improved telescopic design and incorporated focusing mechanisms, which are crucial to microscope functionality. Anton van Leeuwenhoek is considered the father of microscopy due to his advancements in lens making and biological observations."
  },
  {
    text: "Who is referred to as the father of the microscope?",
    options: ["Anton van Leeuwenhoek", "Galileo", "Zacharias Janssen", "Charles Spencer"],
    correct: 0,
    explanation: "Anton van Leeuwenhoek is widely considered the father of microscopy due to his significant improvements in lens-making and his extensive biological observations using microscopes he created."
  },
  {
    text: "_____ built an instrument with magnification of 1250 diameter with ordinary light up to 5000 diameter with blue light.",
    options: ["Anton van Leeuwenhoek", "Galileo", "Zacharias Janssen", "Charles Spencer"],
    correct: 0,
    explanation: "Anton van Leeuwenhoek achieved remarkably high magnifications for his time using single-lens microscopes."
  },
  {
    text: "The knowledge of transmission electron microscopy was invented by a man called",
    options: ["Rodger James", "Rodger James", "Manfred von Ardenne", "Zworykin"],
    correct: 2,
    explanation: "Manfred von Ardenne is credited with significant contributions to the development of transmission electron microscopy."
  },
  {
    text: "Who was the first person to develop a scanning electron microscope?",
    options: ["Ernst Ruska", "Rodger Ernst Ruska", "Rodger James", "Manfred Ardenne"],
    correct: 0,
    explanation: "Ernst Ruska is credited with pioneering work in electron microscopy, including the development of the scanning electron microscope."
  },
  {
    text: "A type of microscope known as a magnifying glass is known as a",
    options: ["compound microscope", "fluorescence microscope", "simple microscope", "bright field microscope"],
    correct: 2,
    explanation: "A simple microscope uses a single lens for magnification, similar to a magnifying glass."
  },
  {
    text: "Which of the following is incorrect about a stereo microscope?",
    options: ["It is a light illuminating microscope", "It produces an image that appears 3-dimensional", "They are used to observe objects that are too large to be viewed with a compound microscope", "Slide preparation is required", "Used to observe surface tension of an object"],
    correct: 3,
    explanation: "Stereo microscopes, also known as dissecting microscopes, do not require slide preparation; they are used to view whole specimens."
  },
  {
    text: "Dissecting microscopes provide magnification of about",
    options: ["500 times", "200 times", "400 times", "100 times"],
    correct: 3,
    explanation: "Dissecting microscopes typically offer lower magnifications compared to compound microscopes."
  },
  {
    text: "A type of light microscope in which light passes directly through the specimen unless the cell is naturally pigmented or artificially stained is known as a",
    options: ["phase contrast light microscope", "bright field", "fluorescence microscope", "confocal microscope"],
    correct: 1,
    explanation: "A bright-field microscope uses transmitted light, making specimens visible only if they are pigmented or stained."
  },
  {
    text: "A type of light microscope with variation in density within the specimen in which the variations are amplified to enhance contrast in unstained, unpigmented cells is known as a",
    options: ["phase contrast light", "bright field", "fluorescence microscope", "confocal microscope"],
    correct: 0,
    explanation: "Phase contrast microscopy enhances contrast in transparent specimens by exploiting differences in refractive index."
  },
  {
    text: "A type of microscope to examine living cells is known as a",
    options: ["phase contrast microscope", "bright field microscope", "fluorescence microscope", "confocal microscope"],
    correct: 0,
    explanation: "Phase contrast microscopy is well-suited for observing living cells without staining."
  },
  {
    text: "The fluid mosaic model was coined by",
    options: ["S.J. Singer and G.L. Nicolson", "Ernest and mategan", "Griffith and telson", "None of the above"],
    correct: 0,
    explanation: "S.J. Singer and G.L. Nicolson are credited with proposing the fluid mosaic model of the cell membrane."
  },
  {
    text: "Which of the following is NOT a crucial membrane function of proteins?",
    options: ["structural support", "recognition", "communication", "transport"],
    correct: 3,
    explanation: "Membrane proteins play crucial roles in structural support, recognition, and communication, and are vital for various transport processes."
  },
  {
    text: "What is the main difference between active transport and passive transport?",
    options: ["passive transport is primarily in single cell organisms, active transport occurs primarily in multicellular organism", "passive transport does not require any energy for substance to cross the cell membrane, active transport require cellular energy for substance to cross the cell membrane", "passive transport works with gravity, active transport require cellular energy", "passive transport works with gravity, active transport does not require active transport does not require any cellular transport passive transport does not"],
    correct: 1,
    explanation: "Active transport requires energy (ATP) to move substances against their concentration gradient, unlike passive transport."
  },
  {
    text: "_____ protein can change shape to move material from one side of the membrane to the other.",
    options: ["channel protein", "carrier protein", "a and b", "none of the option"],
    correct: 2,
    explanation: "Both channel and carrier proteins facilitate transport across the membrane; carrier proteins undergo conformational changes."
  },
  {
    text: "Channel proteins are embedded in the cell membrane and have a pore for material to cross which is known as ___.",
    options: ["Aloterine", "aquaporin", "silicone", "none of the above"],
    correct: 1,
    explanation: "Aquaporins are channel proteins that facilitate the transport of water across cell membranes."
  },
  {
    text: "All of the following are types of passive transport except",
    options: ["osmosis", "diffusion", "facilitated diffusion", "endocytosis"],
    correct: 3,
    explanation: "Endocytosis is an active transport process requiring energy."
  }, 
  {
    text: "Transpiration is very essential for plants as it",
    options: ["cools", "exchange gases", "removes water", "uptake water"],
    correct: 0,
    explanation: "Transpiration helps cool the plant through evaporative cooling."
  },
  {
    text: "Rate of transpiration is increased with the increase in",
    options: ["Light", "temperature", "wind", "all of the above"],
    correct: 3,
    explanation: "Increased light, temperature, and wind all increase the rate of transpiration."
  },
  {
    text: "Water transpiration is done 90% by the process of",
    options: ["cuticular transpiration", "lenticular transpiration", "stomatal transpiration", "sweating"],
    correct: 2,
    explanation: "Most water loss in plants occurs through the stomata."
  },
  {
    text: "In transpiration, the water leaves the cell of plants in the form of",
    options: ["ice", "water droplets", "sugars", "dew"],
    correct: 1,
    explanation: "Water leaves plant cells as water vapor during transpiration."
  },
  {
    text: "Transpiration in plants occurs through",
    options: ["cortex of phloem cells", "stomata in leaves", "xylem cells", "stomata openings"],
    correct: 1,
    explanation: "Stomata in leaves are the primary sites of transpiration."
  },
  {
    text: "Loss of water through evaporation from the surface of plants is called",
    options: ["transpiration", "water uptake", "food uptake", "mesophyll uptake"],
    correct: 0,
    explanation: "Transpiration is the term for water loss through evaporation from plant surfaces."
  },
  {
    text: "Small stomata present in stems of plants are classified as",
    options: ["plasmodesmata", "lenticels", "guard cells", "food present"],
    correct: 1,
    explanation: "Lenticels are small pores in the stems of plants that allow for gas exchange."
  },
  {
    text: "Mark the one, which is NOT the form of transpiration?",
    options: ["Radical transpiration", "Cuticular transpiration", "Lenticular transpiration", "Stomatal transpiration"],
    correct: 0,
    explanation: "Radical transpiration refers to water loss from roots, not a type of transpiration from aerial parts."
  },
  {
    text: "What is guttation?",
    options: ["Exudation of xylem sap", "Root pressure", "Radial movement", "Field capacity"],
    correct: 0,
    explanation: "Guttation is the exudation of xylem sap from the leaves."
  },
  {
    text: "Which of the following is used to determine the rate of transpiration in a plant?",
    options: ["potometer", "porometer", "auxanometer", "barometer"],
    correct: 0,
    explanation: "A potometer measures the rate of water uptake, which is related to transpiration rate."
  },
  {
    text: "Of all the environmental factors which is the most influential in determining the rate of transpiration?",
    options: ["light", "relative humidity of atmosphere", "temperature", "water"],
    correct: 0,
    "explanation": "Light intensity is a major factor influencing stomatal opening and therefore transpiration."
  },
  {
    text: "Guttation is mainly due to",
    options: ["Root pressure", "transpiration", "Imbibition", "osmosis"],
    correct: 0,
    explanation: "Root pressure forces water out of leaf hydathodes in guttation."
  },
  {
    text: "Transpiration helps in",
    options: ["Ascent regulation in plant", "Mineral transport along with water", "Active absorption of water", "Temperature regulation"],
    correct: 1,
    explanation: "Transpiration creates the transpiration pull that helps move water and minerals upward in the plant."
  },
  {
    text: "Rate of transpiration increases with increase with an increase in",
    options: ["carbon dioxide", "root shoot ratio", "atmospheric humidity", "temperature"],
    correct: 3,
    explanation: "Higher temperatures increase the rate of evaporation, leading to increased transpiration."
  },
  {
    text: "Transpiration is least in",
    options: ["good soil moisture", "high wind velocity", "dry environment", "high atmospheric humidity"],
    correct: 3,
    explanation: "High atmospheric humidity reduces the transpiration rate because the water vapor gradient is less."
  },
  {
    text: "Water is transported from the roots to all parts of a plant by",
    options: ["xylem", "phloem", "lenticel", "stomata"],
    correct: 0,
    explanation: "Xylem is the vascular tissue responsible for water transport in plants."
  },
  {
    text: "What is the pressure potential of a turgid plant cell that has an osmotic potential of -0.7 MPa?",
    options: ["0.7 MPa", "0.7 MPa", "0.5 MPa", "-0.5 MPa"],
    correct: 0,
    explanation: "In a turgid cell, pressure potential (Ψp) is equal and opposite to osmotic potential (Ψs), therefore Ψp = +0.7 MPa"
  },
  {
    text: "If a plasmolysed cell is placed in distilled water, then it returns to its original state & become turgid; this is called as:",
    options: ["Plasmolysis", "Exosmosis", "Endosmosis", "Deplasmolysis"],
    correct: 3,
    explanation: "Deplasmolysis is the process where a plasmolyzed cell regains its turgor pressure."
  },
  {
    text: "Osmotic potential (Ψs) of a solution is always",
    options: ["Positive", "Negative", "Zero", "Variable"],
    correct: 1,
    explanation: "Osmotic potential is always negative because it represents the tendency of water to move into a solution."
  },
  {
    text: "Water potential of a cell when placed in a hypertonic solution:",
    options: ["Decreases", "Increases", "First increases then decreases", "No change"],
    correct: 0,
    explanation: "Water moves out of the cell into the hypertonic solution, decreasing the water potential."
  },
  {
    text: "A cell when kept in a sugar solution gets dehydrated. Then the solution is:",
    options: ["Hypotonic", "Hypertonic", "Isotonic", "None of the above"],
    correct: 1,
    explanation: "If a cell dehydrates in a solution, the solution is hypertonic (higher solute concentration)."
  },
  {
    text: "The molar concentration of the sugar solution in an open beaker has been determined to be 0.3 M. Calculate the solute potential at 27°C:",
    options: ["-7.48 bars", "7.48 bars", "5.28 bars", "-5.28 bars"],
    correct: 0,
    explanation: "Using the formula Ψs = -iCRT, where i=1, C=0.3M, R=0.0831 liter bar/mol K, and T=300K, Ψs ≈ -7.48 bars"
  }, 
        
  {
    text: "The best cross to determine the homozygosity and heterozygosity of an individual is",
    options: ["self-fertilization", "back cross", "test cross", "breeding"],
    correct: 2,
    explanation: "A test cross is the most effective method.  Crossing the individual with a homozygous recessive individual reveals the genotype of the tested individual through the resulting offspring phenotypes. Self-fertilization can reveal homozygosity but is less useful for determining heterozygosity.  Backcrossing and general breeding are less specific and efficient approaches."
  },
  {
    text: "All of this obeys Mendel’s laws except",
    options: ["Linkage", "independent assortment", "dominance", "purity of gametes"],
    correct: 0,
    explanation: "Mendel's laws (segregation and independent assortment) assume that genes are independently assorted and that alleles are passed on without influence from nearby genes. Linkage violates this assumption because linked genes are inherited together.  Dominance and purity of gametes are fundamental concepts within Mendel's framework."
  },
  {

    text: "The geometrical device that helps to find out all the possible combinations of male and female gametes is called",
    options: ["Punnet square", "Bateson square", "Mendel square", "Morgan square"],
    correct: 0,
    explanation: "A Punnett square is a diagram used to predict the genotypes of a particular cross or breeding experiment. It shows all possible combinations of alleles from the parents."
  },
  {
    text: "The title of Mendel’s paper while presenting at Brunn Natural History Society in 1865 was",
    options: ["Laws of inheritance", "Laws of heredity", "Experiments on pea plants", "Experiments in plant hybridization"],
    correct: 3,
    explanation: "Mendel's paper was titled \"Versuche über Pflanzen-Hybriden\" which translates to \"Experiments in Plant Hybridization\"."
  },
  {
    text: "Mendel’s Second Law is also known as",
    options: ["The Law of Probability", "The Law of Segregation", "The Law of Independent Assortment", "The Law of Experiments"],
    correct: 2,
    explanation: "Mendel's Second Law describes the independent assortment of alleles during gamete formation."
  },
  {
    text: "A pea plant that is heterozygous for two traits is called",
    options: ["hybrid", "dual heterozygote", "dihybrid", "dual heterozygote"],
    correct: 2,
    explanation: "A dihybrid is an individual heterozygous for two different genes."
  },
  {
    text: "The term “testcross” is used to describe",
    options: ["an experiment used to validate a previously discovered finding", "an experiment to determine a new genotypic ratio", "an experiment to determine the genotypic expression of two genes", "a model of the genotype of an organism"],
    correct: 2,
    explanation: "A testcross is specifically used to determine the genotype of an individual with a dominant phenotype by crossing it with a homozygous recessive individual."
  },
  {
    text: "If a plant heterozygous for two traits is crossed with a plant that is homozygous recessive for both traits, what is the ratio of phenotypes expressive for both traits?",
    options: ["3:1", "9:3:3:1", "1:2:1", "1:1:1:1"],
    correct: 3,
    explanation: "When a dihybrid (heterozygous for two traits) is crossed with a homozygous recessive individual, the resulting phenotypic ratio is 1:1:1:1. This is because each trait assorts independently.  The question asks for the ratio of phenotypes expressive for both traits, which would be a subset of this overall ratio."
  }, 
        
  {
    text: "Which of the following is NOT a correct statement about the events of the cell cycle?",
    options: ["Interphase is usually the longest phase.", "Cell division ends with cytokinesis.", "The cell replicates its DNA during the G2 phase.", "The cell replicates during the S phase.", "DNA is replicated during the S phase."],
    correct: 2,
    explanation: "DNA replication occurs during the S (synthesis) phase, not the G2 phase. G2 is a gap phase where the cell prepares for mitosis."
  },
  {
    text: "Chromosome pairing of homologous structures starts and are not distinct. This describes what phase in prophase I of meiosis?",
    options: ["Leptonema", "Zygonema", "Pachynema", "Diplonema"],
    correct: 1,
    explanation: "Zygonema (zygotene) is the stage of prophase I where homologous chromosomes begin to pair up, forming bivalents. The chromosomes are not yet distinct individual structures at this early stage of pairing."
  },
  {
    text: "Chiasmata formation occurs during which stage of prophase I?",
    options: ["Leptonema", "Zygonema", "Pachynema", "Diplonema"],
    correct: 2,
    explanation: "Chiasmata (the plural of chiasma) are formed during pachytene, representing points of crossing over between homologous chromosomes. This is where genetic recombination occurs."
  },
  {
    text: "Which of the following statements is true regarding the law of segregation?",
    options: ["Law of segregation is the law of purity of genes", "Alleles separate from each other during gametogenesis", "Segregation of factors is due to the segregation of chromosomes during meiosis", "All of the above"],
    correct: 3,
    explanation: "The law of segregation states that during gamete formation, the two alleles for each gene separate, so each gamete receives only one allele. This separation is a direct result of the segregation of homologous chromosomes during meiosis."
  },
  {
    text: "An exception to Mendelian law is",
    options: ["Independent assortment", "Linkage", "Dominance", "Purity of gametes"],
    correct: 1,
    explanation: "Linkage is an exception because it violates the principle of independent assortment; linked genes on the same chromosome tend to be inherited together."
  },
  {
    text: "Pea plants were used in Mendel's experiments because",
    options: ["They were cheap", "They had contrasting characters", "They were easily available", "All of the above"],
    correct: 3,

    explanation: "Pea plants were a good choice for Mendel's experiments because they exhibited easily observable contrasting traits (e.g., flower color, seed shape), were relatively easy to cultivate, and had a short generation time."
  },
  {
    text: "Mendel's findings were rediscovered by",
    options: ["Correns", "De Vries", "Tschermak", "All of the above"],
    correct: 3,
    explanation: "Mendel's work was independently rediscovered by Carl Correns, Hugo de Vries, and Erich von Tschermak around the beginning of the 20th century."
  },
  {
    text: "When the activity of one gene is suppressed by the activity of a non-allelic gene, it is known as",
    options: ["Pseudo-dominance", "Hypostasis", "Epistasis", "Incomplete dominance"],
    correct: 2,
    explanation: "Epistasis describes the interaction between genes where one gene masks the effect of another gene at a different locus."
  },
  {
    text: "Cystic fibrosis is a",
    options: ["Sex-linked recessive disorder", "Autosomal dominant disorder", "Autosomal recessive disorder", "Sex-linked dominant disorder"],
    correct: 2,
    explanation: "Cystic fibrosis is an autosomal recessive disorder, meaning it requires two copies of the mutated gene to manifest the disease."
  },
  {
    text: "A small amount of selective mutation is always present in the population due to",
    options: ["Positive selection", "Negative selection", "Frequency-dependent selection", "Mutation-selection balance"],
    correct: 3,
    explanation: "Mutation-selection balance describes the equilibrium between the introduction of new mutations and their removal by natural selection."
  },
  {
    text: "If a plant with genotype Aabb is selfed, the probability of getting AABB genotype will be",
    options: ["3/16", "1/16", "1/4", "1/8"],
    correct: 1,
    explanation: "The probability of getting AA from the A/a self-cross is 1/4. The probability of getting BB from the b/b self-cross is 0. Therefore, the probability of AABB is (1/4) * 0 = 0. There is no possibility of obtaining AABB from this cross."
  },
  {
    text: "The process of transfer of hereditary character from one generation to another is known as?",
    options: ["Genes", "Mutation", "Variation", "Genetics"],
    correct: 3,
    explanation: "Genetics is the broad field studying heredity and variation. While genes are the units of heredity, and variation is the outcome, genetics encompasses the overall process."
  },
  {
    text: "Who is known as the father of genetics?",
    options: ["Gregor Mendel", "Augustin friar", "Norman Borlaug", "M.L.S Swaminathan"],
    correct: 0,
    explanation: "Gregor Mendel is considered the father of genetics due to his pioneering work on inheritance patterns in pea plants."
  },
  {
    text: "Who coined the term Mutation?",
    options: ["James Watson", "Herman Joseph Muller", "Hugo de Vries", "None of the above"],
    correct: 2,
    explanation: "Hugo de Vries is credited with coining the term mutation to describe sudden, heritable changes in organisms."
  },
  {
    text: "Which term of genetics represents the potential ability of a plant cell to grow into a complete plant?",
    options: ["Pluripotency", "Totipotency", "Cloning", "Variation"],
    correct: 1,
    explanation: "Totipotency refers to the ability of a single cell to divide and differentiate into all the cell types of an organism."
  },
  {
    text: "A sudden change in the gene which is heritable from one generation to another is known as?",
    options: ["Variation", "Cloning", "Totipotency", "Mutation"],
    correct: 3,
    explanation: "A mutation is a sudden, heritable change in the DNA sequence."
  },
  {
    text: "Which plant did Gregor Mendel use for his experiments?",
    options: ["Onion plant", "Carrot plant", "Pea plant", "Lily plant"],
    correct: 2,
    explanation: "Gregor Mendel used pea plants (Pisum sativum) in his experiments on inheritance."
  },
  {
    text: "The crossing of F1 to a homozygous recessive parent is called",
    options: ["back cross", "test cross", "F1 cross", "all of these"],
    correct: 1,
    explanation: "A test cross involves crossing an F1 generation individual with a homozygous recessive parent to determine the genotype of the F1."
  },
  {
    text: "The test cross is used to determine",
    options: ["the genotype of the plant", "the phenotype of the plant", "both a and d", "none of these"],
    correct: 0,
    explanation: "A test cross is primarily used to determine the genotype of an individual with a dominant phenotype."
  },
  {
    text: "Monohybrid test cross ratio is",
    options: ["9:3:2:1", "1:1", "9:3:3:1", "9:3:3:1"],
    correct: 1,
    explanation: "The phenotypic ratio of a monohybrid test cross is 1:1."
  },
  {
    text: "The phenotypic monohybrid cross is",
    options: ["trihybrid cross", "tetrahybrid cross", "dihybrid cross", "monohybrid cross"],
    correct: 3,
    explanation: "A monohybrid cross involves individuals differing in only one trait."
  }, 
        {
  text: "The number of linkage groups in Drosophila is",
  options: ["4", "8", "23", "46"],
  correct: 0,
  explanation: "Drosophila melanogaster has four pairs of chromosomes, leading to four linkage groups."
},
{
  text: "Who is known as the father of genetics?",
  options: ["Mendel", "Darwin", "Morgan", "Watson"],
  correct: 0,
  explanation: "Gregor Mendel is considered the father of genetics due to his foundational work on inheritance patterns in pea plants."
},
{
  text: "AB blood group is an example of",
  options: ["Incomplete dominance", "Codominance", "Recessive traits", "Dominant traits"],
  correct: 1,
  explanation: "AB blood group demonstrates codominance, where both A and B alleles are equally expressed."
},
{
  text: "Which of the following is a sex-linked recessive disorder?",
  options: ["Down syndrome", "Cystic fibrosis", "Haemophilia", "Sickle cell anemia"],
  correct: 2,
  explanation: "Haemophilia is a sex-linked recessive disorder carried on the X chromosome."
},
{
  text: "DNA as the genetic material was first demonstrated in",
  options: ["E. coli", "Tobacco mosaic virus", "Bacteriophage", "Streptococcus pneumoniae"],
  correct: 3,
  explanation: "Griffith's experiment with *Streptococcus pneumoniae* laid the groundwork for discovering DNA as the genetic material."
},
{
  text: "Cross between F1 and homozygous recessive parent is called",
  options: ["Test cross", "Back cross", "Self cross", "Monohybrid cross"],
  correct: 0,
  explanation: "A test cross is performed between an F1 individual and a homozygous recessive parent to determine the genotype of the F1 individual."
},
{
  text: "Father of modern eugenics is",
  options: ["Mendel", "Morgan", "Francis Galton", "Darwin"],
  correct: 2,
  explanation: "Francis Galton is considered the father of modern eugenics due to his work in heredity and human improvement."
},
{
  text: "The condition where a chromosome is lost during cell division is called",
  options: ["Aneuploidy", "Monosomy", "Polyploidy", "Trisomy"],
  correct: 1,
  explanation: "Monosomy refers to the loss of one chromosome in a pair, leading to a total chromosome count of 2n-1."
},
{
  text: "Which of the following is an example of polygenic inheritance?",
  options: ["ABO blood group", "Height", "Sickle cell anemia", "Color blindness"],
  correct: 1,
  explanation: "Height is an example of polygenic inheritance, influenced by multiple genes resulting in continuous variation."
},
{
  text: "The ability of a gene to have multiple effects is called",
  options: ["Polygeny", "Pleiotropy", "Epistasis", "Codominance"],
  correct: 1,
  explanation: "Pleiotropy occurs when a single gene influences multiple distinct traits."
},
{
  text: "Cross between heterozygotes for a single trait produces which phenotypic ratio?",
  options: ["1:1", "3:1", "9:3:3:1", "1:2:1"],
  correct: 1,
  explanation: "A cross between heterozygotes for a single trait follows Mendel's law, producing a phenotypic ratio of 3:1 (dominant to recessive)."
},
{
  text: "An organism having two different alleles for a trait is called",
  options: ["Homozygous", "Heterozygous", "Hemizygous", "Polyzygous"],
  correct: 1,
  explanation: "An organism with two different alleles for a specific trait is termed heterozygous for that trait."
},
{
  text: "Sickle cell anemia is caused due to a mutation in the gene encoding",
  options: ["Hemoglobin A", "Hemoglobin S", "Myoglobin", "Collagen"],
  correct: 1,
  explanation: "Sickle cell anemia results from a mutation in the gene coding for hemoglobin S, leading to abnormal red blood cells."
},
{
  text: "Which of the following is the universal acceptor blood group?",
  options: ["O", "A", "AB", "B"],
  correct: 2,
  explanation: "AB-positive blood is considered the universal acceptor because it has no antibodies against A, B, or Rh antigens."
},
{
  text: "Sex determination in humans is influenced by",
  options: ["X chromosome", "Y chromosome", "Both X and Y chromosomes", "None of these"],
  correct: 1,
  explanation: "The presence of the Y chromosome (and specifically the SRY gene) determines male sex in humans."
},
{
  text: "Phenotypic ratio for a dihybrid cross is",
  options: ["3:1", "9:3:3:1", "1:2:1", "6:3:3:4"],
  correct: 1,
  explanation: "The phenotypic ratio for a dihybrid cross involving independent assortment is 9:3:3:1."
}, 

{
  text: "Genes that affect growth rate in humans influencing both weight and height are",
  options: ["Codominant", "Polygene", "Pleiotropy", "Epistasis"],
  correct: 2,
  explanation: "Pleiotropy describes when a single gene influences multiple phenotypic traits. Genes affecting growth rate often impact both weight and height."
},
{
  text: "All of the following are continuously varying traits except",
  options: ["Kernel colour in wheat", "Skin colour in humans", "Height in humans", "Tongue rolling in humans"],
  correct: 3,
  explanation: "Tongue rolling is a discrete trait; an individual either can or cannot roll their tongue. Kernel color, skin color, and height demonstrate continuous variation."
},
{
  text: "The number of linkage groups in humans is",
  options: ["12", "23", "46", "92"],
  correct: 1,
  explanation: "Humans have 23 pairs of chromosomes, thus 23 linkage groups (one for each chromosome)."
},
{
  text: "Recombination frequency between two linked genes can be calculated by",
  options: ["Back cross", "Test cross", "Normal cross", "None of these"],
  correct: 1,
  explanation: "A test cross (crossing a heterozygote with a homozygous recessive) allows for the determination of recombination frequencies between linked genes."
},
{
  text: "Which of the following is male determining gene in humans?",
  options: ["tfm", "SRY", "Both of these", "None of these"],
  correct: 1,
  explanation: "The SRY gene (sex-determining region Y) on the Y chromosome is the primary determinant of maleness in humans."
},
{
  text: "It was discovered by J. Seiler in 1914 in moth",
  options: ["XX-XO", "XY-XX", "ZZ-ZW", "None of these"],
  correct: 0,
  explanation: "J. Seiler's work in 1914 described the XX-XO sex-determination system in moths."
},
{
  text: "Haemophilia B is due to abnormality of factor",
  options: ["VIII", "IX", "X", "XI"],
  correct: 1,
  explanation: "Haemophilia B (Christmas disease) is caused by a deficiency in clotting factor IX."
},
{
  text: "Gene for blue spasm is present on chromosome",
  options: ["X", "Y", "7", "11"],
  correct: 0,
  explanation: "The gene for blue-cone monochromacy (a form of color blindness that may be associated with blue spasm or nystagmus) is located on the X chromosome."
},
{
  text: "Most common type of Diabetes mellitus is",
  options: ["MODY", "Type II", "Type I", "None of these"],
  correct: 1,
  explanation: "Type II diabetes mellitus (non-insulin-dependent) is far more prevalent than Type I (insulin-dependent) or MODY (maturity-onset diabetes of the young)."
},
{
  text: "Phenotype represents",
  options: ["Morphology", "Physiology", "Genetics", "None of these"],
  correct: 0,
  explanation: "Phenotype refers to the observable characteristics of an organism, encompassing both its morphology (physical structure) and physiology (biological function)."
},
{
  text: "During test cross, if all offsprings are phenotypically dominant then parents are",
  options: ["Homozygous", "Heterozygous", "One homozygous other heterozygous", "None of these"],
  correct: 0,
  explanation: "If all offspring from a test cross show the dominant phenotype, the parent with the unknown genotype must be homozygous dominant."
},
{
  text: "True breeding variety is produced by",
  options: ["Self fertilization", "Cross fertilization", "Both of these", "None of these"],
  correct: 0,
  explanation: "True-breeding varieties are homozygous for the traits of interest, and they are produced through repeated self-fertilization."
},
{
  text: "Genotype ratio of Mendel’s law of independent assortment is",
  options: ["3:1", "1:02:01", "9:3:3:1", "None of these"],
  correct: 2,
  explanation: "Mendel's dihybrid cross, illustrating the law of independent assortment, produces a 9:3:3:1 genotypic ratio in the F2 generation."
},
{
  text: "Which of the following is universal donor?",
  options: ["AB", "B", "A", "O"],
  correct: 3,
  explanation: "O-negative blood is considered the universal donor because it lacks A, B, and Rh antigens, minimizing the risk of adverse reactions in transfusions."
},
{
  text: "Such inheritance in which trait vary quantitatively is",
  options: ["Continuously varying trait", "Incomplete dominance", "Test cross", "Polygenic inheritance"],
  correct: 3,
  explanation: "Polygenic inheritance involves multiple genes contributing to a single trait, resulting in continuous variation."
},
{
  text: "Inheritance in man is traced by",
  options: ["Mathematical method", "Pedigree method", "Statistical method", "Genetic method"],
  correct: 1,
  explanation: "Pedigree analysis is a crucial method used to trace inheritance patterns in humans and other organisms, visually representing family relationships and phenotypes."
},
{
  text: "Skin colour in man is controlled by",
  options: ["1 pair", "2 pairs", "4 pairs", "8 pairs"],
  correct: 2,
  explanation: "Human skin color is a polygenic trait, controlled by multiple gene pairs (at least 4 pairs are believed to contribute significantly)."
}, 

{
  text: "Among invertebrates who possess great power of regeneration",
  options: ["Arthropods", "Molluscs", "Sponges", "Nematodes"],
  correct: 2,
  explanation: "Sponges exhibit remarkable regenerative capabilities. They can regenerate from small fragments, demonstrating a high degree of plasticity and cell totipotency."
},
{
  text: "Which statement is incorrect?",
  options: ["Lizard can regenerate its head", "Salamander can regenerate its limbs", "Earthworm can regenerate its head", "Man can regenerate his skin"],
  correct: 0,
  explanation: "Lizards cannot regenerate their heads. While they can detach their tails as a defense mechanism, head regeneration is not a capability observed in lizards."
},
{
  text: "Growth is basically an increase in",
  options: ["Number of cells", "Size of cells", "Both of these", "None of these"],
  correct: 2,
  explanation: "Growth involves both an increase in the number of cells (hyperplasia) and an increase in the size of individual cells (hypertrophy)."
},
{
  text: "The stage of rapid cell division just after fertilization is",
  options: ["Gastrulation", "Cleavage", "Organogenesis", "Growth"],
  correct: 1,
  explanation: "Cleavage is a series of rapid mitotic cell divisions that occur immediately after fertilization, resulting in a multicellular blastula."
},
{
  text: "The German scientist Spemann worked on differentiation in",
  options: ["1924", "1925", "1915", "1940"],
  correct: 1,
  explanation: "Hans Spemann's crucial work on embryonic induction and differentiation, particularly his experiments with the newt embryo, culminated in his Nobel Prize in 1935, although his key experiments were done in 1924 leading to publications around 1925."
},
{
  text: "Inducer substances are produced by",
  options: ["Nicholson", "Goethe", "Antershon", "Sacke"],
  correct: 2,
  explanation: "While the specific individual isn't easily identifiable from the given options, the concept of 'inducer substances' is central to Spemann's work on embryonic induction. The organizer region of the embryo produces these signaling molecules which induce differentiation in neighboring cells. There is no prominent individual called Antershon known in developmental biology. This question requires more context or clarification."
},
{
  text: "What is the feature of cells in gastrulation?",
  options: ["Differentiation", "Migration", "Division", "All of these"],
  correct: 3,
  explanation: "Gastrulation involves cell differentiation, as cells take on different fates, and cell migration, as cells move to establish the three germ layers. While cell division also occurs, it is not as rapid as during cleavage, and the other two processes are the defining features of gastrulation."
},
{
  text: "Vertebral column is formed from",
  options: ["Ectoderm", "Endoderm", "Mesoderm", "None of these"],
  correct: 2,
  explanation: "The mesoderm is the germ layer that gives rise to the skeletal system, including the vertebral column (spine)."
},
{
  text: "Liver and pancreas arise from",
  options: ["Foregut", "Midgut", "Hindgut", "None of these"],
  correct: 0,
  explanation: "The liver and pancreas develop from the endodermal lining of the foregut, the anterior part of the primitive gut."
},
{
  text: "Interaction between genes occupying different loci is",
  options: ["Dominance", "Epistasis", "Pleiotropy", "None of these"],
  correct: 1,
  explanation: "Epistasis refers to the interaction between genes at different loci, where one gene modifies or masks the expression of another."
}, 
    { text: "What is the basic unit of life?", options: ["Atom", "Molecule", "Cell", "Organ"], correct: 2, explanation: "The cell is considered the basic unit of life as it is the smallest structure capable of performing all life processes." },
    { text: "Which organelle is known as the powerhouse of the cell?", options: ["Ribosome", "Nucleus", "Mitochondria", "Golgi apparatus"], correct: 2, explanation: "Mitochondria generate most of the cell's energy in the form of ATP, hence they are called the powerhouse of the cell." },
    { text: "What structure encloses the cell and regulates the passage of substances?", options: ["Cell wall", "Plasma membrane", "Cytoplasm", "Endoplasmic reticulum"], correct: 1, explanation: "The plasma membrane encloses the cell, providing a barrier and regulating the movement of materials in and out." },
    { text: "Which organelle contains the genetic material of the cell?", options: ["Nucleus", "Ribosome", "Lysosome", "Chloroplast"], correct: 0, explanation: "The nucleus houses DNA, the genetic blueprint of the organism." },
    { text: "What is the main function of ribosomes?", options: ["Protein synthesis", "Energy production", "Photosynthesis", "Transport"], correct: 0, explanation: "Ribosomes are responsible for synthesizing proteins by translating messenger RNA (mRNA)." },
    { text: "Which organelle is responsible for photosynthesis in plant cells?", options: ["Mitochondria", "Chloroplast", "Golgi apparatus", "Lysosome"], correct: 1, explanation: "Chloroplasts contain chlorophyll and facilitate photosynthesis, converting light energy into chemical energy." },
    { text: "What is the function of the Golgi apparatus?", options: ["Packaging and modifying proteins", "Protein synthesis", "Energy production", "DNA storage"], correct: 0, explanation: "The Golgi apparatus modifies, sorts, and packages proteins for secretion or delivery to other organelles." },
    { text: "What is the semi-fluid substance inside the cell called?", options: ["Cytoplasm", "Nucleus", "Mitochondria", "Vacuole"], correct: 0, explanation: "The cytoplasm is a gel-like substance that surrounds the organelles and is the site for many cellular processes." },
    { text: "Which structure provides structural support to plant cells?", options: ["Cell wall", "Cytoskeleton", "Plasma membrane", "Centrosome"], correct: 0, explanation: "The cell wall, made of cellulose in plants, provides structural support and protection." },
    { text: "What is the role of lysosomes in the cell?", options: ["Digesting waste materials", "Protein synthesis", "Energy production", "DNA replication"], correct: 0, explanation: "Lysosomes contain enzymes that break down waste materials, cellular debris, and foreign particles." },
    { text: "What distinguishes a prokaryotic cell from a eukaryotic cell?", options: ["Presence of nucleus", "Larger size", "Absence of ribosomes", "Ability to reproduce"], correct: 0, explanation: "Prokaryotic cells lack a nucleus, while eukaryotic cells have a membrane-bound nucleus." },
    { text: "Which organelle is involved in lipid synthesis?", options: ["Rough ER", "Smooth ER", "Golgi apparatus", "Ribosome"], correct: 1, explanation: "The smooth endoplasmic reticulum synthesizes lipids and detoxifies certain chemicals." },
    { text: "What is the main difference between rough and smooth ER?", options: ["Ribosomes", "Function", "Location", "Shape"], correct: 0, explanation: "Rough ER is studded with ribosomes, giving it a 'rough' appearance, and is involved in protein synthesis." },
    { text: "What is the term for the movement of water across a semi-permeable membrane?", options: ["Diffusion", "Osmosis", "Active transport", "Endocytosis"], correct: 1, explanation: "Osmosis is the diffusion of water molecules across a semi-permeable membrane from a region of lower solute concentration to higher solute concentration." },
    { text: "Which structure in animal cells is responsible for cell division?", options: ["Nucleus", "Centrioles", "Mitochondria", "Cytoplasm"], correct: 1, explanation: "Centrioles play a crucial role in the organization of microtubules during cell division in animal cells." },
    { text: "What does the term 'selectively permeable' refer to in a cell membrane?", options: ["Allows all molecules", "Blocks all molecules", "Allows specific molecules", "Allows large molecules only"], correct: 2, explanation: "Selectively permeable means the cell membrane allows only certain molecules to pass through while blocking others." },
    { text: "What type of cell contains chloroplasts?", options: ["Animal cells", "Plant cells", "Prokaryotic cells", "Fungi cells"], correct: 1, explanation: "Chloroplasts are present in plant cells and some protists, enabling them to perform photosynthesis." },
    { text: "Which molecule forms the majority of the cell membrane?", options: ["Proteins", "Lipids", "Carbohydrates", "Nucleic acids"], correct: 1, explanation: "The cell membrane is primarily composed of a phospholipid bilayer, providing structural integrity and flexibility." },
    { text: "Which process does the mitochondria facilitate?", options: ["Glycolysis", "Cellular respiration", "Photosynthesis", "Fermentation"], correct: 1, explanation: "Mitochondria are the site of cellular respiration, producing ATP through the breakdown of glucose." },
    { text: "What is the function of vacuoles in plant cells?", options: ["Energy production", "Storage of water and nutrients", "Protein synthesis", "Photosynthesis"], correct: 1, explanation: "Vacuoles store water, nutrients, and waste products, maintaining turgor pressure in plant cells." }, 

    { text: "What type of cells lack a nucleus?", options: ["Prokaryotic cells", "Eukaryotic cells", "Plant cells", "Animal cells"], correct: 0, explanation: "Prokaryotic cells, such as bacteria, do not have a membrane-bound nucleus, unlike eukaryotic cells." },
    { text: "What is the primary function of the nucleolus?", options: ["DNA replication", "Ribosome production", "Protein synthesis", "Energy generation"], correct: 1, explanation: "The nucleolus is located within the nucleus and is responsible for producing ribosomal RNA (rRNA) and assembling ribosomes." },
    { text: "Which of these is found in plant cells but not in animal cells?", options: ["Mitochondria", "Chloroplast", "Cytoplasm", "Golgi apparatus"], correct: 1, explanation: "Chloroplasts are unique to plant cells and certain algae, enabling them to perform photosynthesis." },
    { text: "What is the structural framework within the cell called?", options: ["Cytoplasm", "Cytoskeleton", "Nucleus", "Endoplasmic reticulum"], correct: 1, explanation: "The cytoskeleton provides structural support, aids in cell movement, and organizes the cell's components." },
    { text: "What are membrane-bound compartments within eukaryotic cells called?", options: ["Organelles", "Ribosomes", "Chromosomes", "Enzymes"], correct: 0, explanation: "Organelles are specialized structures within eukaryotic cells, such as the nucleus, mitochondria, and Golgi apparatus, each performing specific functions." },
    { text: "Which molecule is the primary energy carrier in cells?", options: ["Glucose", "ATP", "DNA", "RNA"], correct: 1, explanation: "Adenosine triphosphate (ATP) is the main energy currency in cells, storing and transferring energy for cellular processes." },
    { text: "What is the function of peroxisomes?", options: ["Breaking down fatty acids", "Protein synthesis", "Photosynthesis", "Transporting materials"], correct: 0, explanation: "Peroxisomes are involved in the breakdown of fatty acids and detoxification of harmful substances like hydrogen peroxide." },
    { text: "What process involves the engulfing of large particles by a cell?", options: ["Osmosis", "Phagocytosis", "Diffusion", "Pinocytosis"], correct: 1, explanation: "Phagocytosis is a form of endocytosis where cells engulf large particles, such as pathogens or debris, into vesicles." },
    { text: "What is the name of the process by which cells maintain a stable internal environment?", options: ["Metabolism", "Homeostasis", "Growth", "Reproduction"], correct: 1, explanation: "Homeostasis is the process by which cells regulate internal conditions, such as pH and temperature, to remain stable and functional." },
    { text: "Which organelle is responsible for detoxifying drugs and poisons in liver cells?", options: ["Lysosomes", "Smooth ER", "Golgi apparatus", "Peroxisomes"], correct: 1, explanation: "The smooth endoplasmic reticulum plays a significant role in detoxifying drugs and harmful chemicals in liver cells." },
    { text: "What type of junctions allow direct communication between animal cells?", options: ["Tight junctions", "Gap junctions", "Desmosomes", "Adherens junctions"], correct: 1, explanation: "Gap junctions consist of channels that permit direct communication and exchange of ions and molecules between neighboring cells." },
    { text: "What component of the cytoskeleton is responsible for cell division?", options: ["Microtubules", "Actin filaments", "Intermediate filaments", "Myosin"], correct: 0, explanation: "Microtubules form the spindle apparatus during cell division, facilitating the separation of chromosomes." },
    { text: "Which organelle synthesizes lipids and hormones?", options: ["Rough ER", "Smooth ER", "Golgi apparatus", "Ribosomes"], correct: 1, explanation: "The smooth endoplasmic reticulum synthesizes lipids and hormones and detoxifies harmful substances." },
    { text: "What structure in plant cells stores pigments and starch?", options: ["Chloroplast", "Vacuole", "Leucoplast", "Chromoplast"], correct: 2, explanation: "Leucoplasts are non-pigmented organelles in plant cells that store starch and other nutrients." },
    { text: "What is the function of the central vacuole in plant cells?", options: ["Protein synthesis", "Energy storage", "Water and waste storage", "Photosynthesis"], correct: 2, explanation: "The central vacuole stores water, ions, and waste products, and helps maintain cell turgidity in plant cells." },
    { text: "What is the primary function of plasmodesmata in plant cells?", options: ["Transporting water", "Connecting adjacent cells", "Photosynthesis", "Protein synthesis"], correct: 1, explanation: "Plasmodesmata are channels between plant cell walls that allow communication and transport of materials between adjacent cells." },
    { text: "Which molecule acts as the genetic material in most organisms?", options: ["RNA", "DNA", "ATP", "Protein"], correct: 1, explanation: "DNA is the genetic material in most organisms, containing instructions for development and functioning." },
    { text: "What is the role of the extracellular matrix in animal cells?", options: ["Energy production", "Structural support", "Photosynthesis", "Protein synthesis"], correct: 1, explanation: "The extracellular matrix provides structural support, facilitates cell signaling, and anchors cells to their surroundings." },
    { text: "Which cellular process converts glucose into ATP in the absence of oxygen?", options: ["Aerobic respiration", "Photosynthesis", "Fermentation", "Osmosis"], correct: 2, explanation: "Fermentation is an anaerobic process that breaks down glucose into ATP, producing by-products like lactic acid or ethanol." },
    { text: "Which organelle is responsible for packaging and sorting proteins?", options: ["Mitochondria", "Golgi apparatus", "Rough ER", "Nucleus"], correct: 1, explanation: "The Golgi apparatus modifies, sorts, and packages proteins into vesicles for secretion or transport to other organelles." }, 

    { text: "What is the process by which cells divide to produce two identical daughter cells?", options: ["Meiosis", "Binary fission", "Mitosis", "Budding"], correct: 2, explanation: "Mitosis is a type of cell division that results in two genetically identical daughter cells, used for growth and repair in eukaryotic organisms." },
    { text: "What structure in animal cells helps in organizing microtubules during cell division?", options: ["Centrioles", "Nucleolus", "Cilia", "Flagella"], correct: 0, explanation: "Centrioles are part of the centrosome, which organizes microtubules and plays a key role in forming the spindle apparatus during mitosis." },
    { text: "Which type of transport requires energy to move molecules across the cell membrane?", options: ["Passive transport", "Osmosis", "Diffusion", "Active transport"], correct: 3, explanation: "Active transport uses ATP energy to move molecules against their concentration gradient through specialized membrane proteins." },
    { text: "What is the site of protein synthesis in a cell?", options: ["Nucleus", "Ribosomes", "Golgi apparatus", "Mitochondria"], correct: 1, explanation: "Ribosomes are the cellular structures that synthesize proteins by translating messenger RNA (mRNA)." },
    { text: "What is the role of chromatin in the cell?", options: ["Protein synthesis", "Storage of genetic material", "Energy production", "Cell division"], correct: 1, explanation: "Chromatin is composed of DNA and proteins, and it organizes and condenses genetic material within the nucleus for replication and transcription." },
    { text: "Which organelle is responsible for the synthesis of ATP through oxidative phosphorylation?", options: ["Chloroplast", "Mitochondria", "Ribosomes", "Endoplasmic reticulum"], correct: 1, explanation: "Mitochondria synthesize ATP through oxidative phosphorylation, using oxygen and nutrients in the process of cellular respiration." },
    { text: "What is the term for programmed cell death?", options: ["Apoptosis", "Necrosis", "Autophagy", "Phagocytosis"], correct: 0, explanation: "Apoptosis is a regulated process of programmed cell death that removes damaged or unnecessary cells in an organism." },
    { text: "What do lysosomes primarily contain?", options: ["Genetic material", "Digestive enzymes", "Lipids", "Hormones"], correct: 1, explanation: "Lysosomes contain hydrolytic enzymes that break down macromolecules, cellular debris, and pathogens." },
    { text: "What is the role of the cytoplasm in a cell?", options: ["Support for organelles", "Photosynthesis", "Energy production", "DNA storage"], correct: 0, explanation: "The cytoplasm is the gel-like substance that provides support for organelles and is the site for various cellular processes." },
    { text: "Which cellular structure controls the passage of substances into and out of the cell?", options: ["Cell wall", "Plasma membrane", "Nucleus", "Endoplasmic reticulum"], correct: 1, explanation: "The plasma membrane is selectively permeable, regulating the movement of substances into and out of the cell." },
    { text: "What do cilia and flagella help the cell do?", options: ["Divide", "Move", "Respire", "Grow"], correct: 1, explanation: "Cilia and flagella are hair-like structures that aid in the movement of the cell or substances along the cell's surface." },
    { text: "What is the term for the synthesis of RNA from a DNA template?", options: ["Replication", "Transcription", "Translation", "Reverse transcription"], correct: 1, explanation: "Transcription is the process where RNA is synthesized from a DNA template, which occurs in the nucleus of eukaryotic cells." },
    { text: "What are the functional units of the plasma membrane called?", options: ["Lysosomes", "Cholesterol molecules", "Membrane proteins", "Cytoskeleton filaments"], correct: 2, explanation: "Membrane proteins are integral to the plasma membrane's function, aiding in transport, signal transduction, and cell communication." },
    { text: "Which organelle plays a role in modifying and sorting lipids?", options: ["Rough ER", "Smooth ER", "Golgi apparatus", "Peroxisomes"], correct: 2, explanation: "The Golgi apparatus modifies and sorts lipids and proteins for their final destinations in the cell or outside the cell." },
    { text: "Which macromolecule is primarily found in the cell wall of plants?", options: ["Proteins", "Lipids", "Cellulose", "Chitin"], correct: 2, explanation: "Cellulose, a carbohydrate, forms the primary structural component of the plant cell wall, providing rigidity and support." },
    { text: "What is the process by which cells uptake liquid substances?", options: ["Phagocytosis", "Pinocytosis", "Exocytosis", "Endocytosis"], correct: 1, explanation: "Pinocytosis, often referred to as 'cell drinking,' is the process by which cells engulf liquid substances into vesicles." },
    { text: "Which organelle is involved in intracellular digestion?", options: ["Lysosomes", "Mitochondria", "Chloroplast", "Smooth ER"], correct: 0, explanation: "Lysosomes facilitate intracellular digestion by breaking down macromolecules, old organelles, and pathogens using enzymes." },
    { text: "What is the process of synthesizing proteins from RNA called?", options: ["Transcription", "Translation", "Replication", "Elongation"], correct: 1, explanation: "Translation is the process where ribosomes synthesize proteins by decoding messenger RNA (mRNA)." },
    { text: "What is the structure that allows communication between adjacent plant cells?", options: ["Tight junctions", "Plasmodesmata", "Gap junctions", "Desmosomes"], correct: 1, explanation: "Plasmodesmata are channels in plant cell walls that enable transport and communication between adjacent cells." },
    { text: "Which type of endoplasmic reticulum is involved in detoxification processes?", options: ["Rough ER", "Smooth ER", "Golgi apparatus", "Lysosomes"], correct: 1, explanation: "The smooth endoplasmic reticulum is involved in detoxifying harmful substances, especially in liver cells." }, 
    { text: "What does the cell theory state?", options: ["Cells arise from non-living matter", "All organisms are made of cells", "Cells contain DNA", "Cells are static structures"], correct: 1, explanation: "The cell theory states that all living organisms are made of one or more cells, and all cells arise from pre-existing cells." },
    { text: "Who is credited with coining the term 'cell'?", options: ["Anton van Leeuwenhoek", "Robert Hooke", "Matthias Schleiden", "Theodor Schwann"], correct: 1, explanation: "Robert Hooke coined the term 'cell' in 1665 when observing cork tissue under a microscope." },
    { text: "Which scientist is associated with the discovery that all plants are made of cells?", options: ["Theodor Schwann", "Rudolf Virchow", "Matthias Schleiden", "Louis Pasteur"], correct: 2, explanation: "Matthias Schleiden concluded that all plants are composed of cells, forming a foundation of cell theory." },
    { text: "What is a major difference between animal and plant cells?", options: ["Animal cells have mitochondria", "Plant cells have chloroplasts", "Animal cells lack a nucleus", "Plant cells lack ribosomes"], correct: 1, explanation: "Plant cells contain chloroplasts for photosynthesis, a feature absent in animal cells." },
    { text: "Which feature is common to both prokaryotic and eukaryotic cells?", options: ["Nucleus", "Ribosomes", "Mitochondria", "Golgi apparatus"], correct: 1, explanation: "Both prokaryotic and eukaryotic cells contain ribosomes, which are essential for protein synthesis." },
    { text: "What is the role of the spindle fibers during mitosis?", options: ["Condensing chromosomes", "Aligning and separating chromosomes", "Duplicating DNA", "Producing ATP"], correct: 1, explanation: "Spindle fibers align chromosomes at the metaphase plate and separate them into daughter cells during mitosis." },
    { text: "Which phase of mitosis involves the separation of sister chromatids?", options: ["Prophase", "Metaphase", "Anaphase", "Telophase"], correct: 2, explanation: "During anaphase, sister chromatids are pulled apart to opposite poles of the cell by spindle fibers." },
    { text: "What is cytokinesis?", options: ["Nuclear division", "DNA replication", "Cytoplasmic division", "Chromosome alignment"], correct: 2, explanation: "Cytokinesis is the process of dividing the cytoplasm to form two separate daughter cells after mitosis." },
    { text: "Interaction between genes occupying different loci is", options: ["Dominance", "Epistasis", "Pleiotropy", "None of these"], correct: 1, explanation: "Epistasis describes the interaction between genes at different loci affecting a single trait." },
    { text: "What structure is present in both animal and plant cells but functions differently?", options: ["Nucleus", "Plasma membrane", "Vacuoles", "Mitochondria"], correct: 2, explanation: "Both plant and animal cells have vacuoles, but plant cells have a large central vacuole for storage and maintaining turgor pressure." },
    { text: "What is a characteristic exclusive to eukaryotic cells?", options: ["Ribosomes", "Circular DNA", "Membrane-bound organelles", "Cell wall"], correct: 2, explanation: "Eukaryotic cells are defined by the presence of membrane-bound organelles like the nucleus, mitochondria, and Golgi apparatus." },
    { text: "How do plant cells differ from animal cells during mitosis?", options: ["They lack spindle fibers", "They form a cell plate", "They do not divide", "They lack chromosomes"], correct: 1, explanation: "During cytokinesis in plant cells, a cell plate forms to divide the cytoplasm, unlike the cleavage furrow in animal cells." },
    { text: "What type of cell division produces gametes?", options: ["Mitosis", "Meiosis", "Binary fission", "Cytokinesis"], correct: 1, explanation: "Meiosis is a specialized form of cell division that reduces the chromosome number by half to produce gametes for sexual reproduction." },
    { text: "What is a similarity between plant and animal cells?", options: ["Presence of cell wall", "Presence of chloroplasts", "Presence of mitochondria", "Storage of starch"], correct: 2, explanation: "Both plant and animal cells contain mitochondria, the powerhouse of the cell, to generate energy in the form of ATP." },
    { text: "What feature is unique to prokaryotic cells?", options: ["Lack of DNA", "Presence of membrane-bound organelles", "Circular DNA", "Presence of a nucleus"], correct: 2, explanation: "Prokaryotic cells have circular DNA that is not enclosed within a nucleus, unlike the linear DNA of eukaryotes." },
    { text: "Which phase of the cell cycle is responsible for DNA replication?", options: ["G1 phase", "S phase", "G2 phase", "M phase"], correct: 1, explanation: "The S phase (Synthesis phase) is the part of interphase where the DNA is replicated in preparation for cell division." },
    { text: "What is the purpose of checkpoints in the cell cycle?", options: ["To repair DNA damage", "To condense chromosomes", "To divide organelles", "To increase ATP production"], correct: 0, explanation: "Checkpoints in the cell cycle ensure proper DNA replication and repair any damage before the cell proceeds to division." },
    { text: "What is a common feature of prokaryotic and eukaryotic cells during cell division?", options: ["Mitosis", "Binary fission", "DNA replication", "Cytokinesis"], correct: 2, explanation: "Both prokaryotic and eukaryotic cells replicate their DNA before division, though the mechanisms differ." },
    { text: "Which organelle is involved in the formation of the cell plate during plant cell division?", options: ["Chloroplast", "Golgi apparatus", "Rough ER", "Lysosome"], correct: 1, explanation: "The Golgi apparatus provides vesicles that fuse to form the cell plate, which develops into a new cell wall during cytokinesis in plant cells." },
    { text: "What is the outcome of mitosis?", options: ["Two genetically identical cells", "Four genetically different cells", "One cell with double DNA", "Cell death"], correct: 0, explanation: "Mitosis results in two daughter cells that are genetically identical to the original parent cell, maintaining the chromosome number." },
    { text: "Which process ensures genetic variation in sexually reproducing organisms?", options: ["Mitosis", "Meiosis", "Binary fission", "Cytokinesis"], correct: 1, explanation: "Meiosis introduces genetic variation through processes like crossing over and independent assortment of chromosomes." }, 

    { text: "Who proposed that all cells come from pre-existing cells?", options: ["Rudolf Virchow", "Robert Hooke", "Theodor Schwann", "Anton van Leeuwenhoek"], correct: 0, explanation: "Rudolf Virchow proposed that all cells arise from pre-existing cells, contributing to the cell theory's development." },
    { text: "What is the main difference between binary fission and mitosis?", options: ["Binary fission requires spindle fibers", "Mitosis occurs in prokaryotic cells", "Binary fission is simpler and occurs in prokaryotes", "Mitosis produces genetically diverse cells"], correct: 2, explanation: "Binary fission is a simpler process of cell division in prokaryotes, while mitosis occurs in eukaryotic cells with spindle fiber involvement." },
    { text: "What is the function of chromatin during interphase?", options: ["Condensing DNA", "Replicating DNA", "Splitting chromosomes", "Synthesizing RNA"], correct: 1, explanation: "During interphase, chromatin remains loose to allow replication of DNA in preparation for cell division." },
    { text: "What structure in plant cells is responsible for their rigidity?", options: ["Chloroplasts", "Mitochondria", "Cell wall", "Plasma membrane"], correct: 2, explanation: "The cell wall, made of cellulose, provides rigidity and structural support to plant cells." },
    { text: "Which cellular organelle facilitates the breakdown of hydrogen peroxide?", options: ["Lysosomes", "Peroxisomes", "Mitochondria", "Golgi apparatus"], correct: 1, explanation: "Peroxisomes contain enzymes like catalase that break down hydrogen peroxide into water and oxygen." },
    { text: "What phase of mitosis is characterized by chromosomes aligning at the cell's equator?", options: ["Prophase", "Metaphase", "Anaphase", "Telophase"], correct: 1, explanation: "During metaphase, chromosomes align at the metaphase plate, ensuring they are properly positioned for separation." },
    { text: "How do plant and animal cells differ in their approach to energy production?", options: ["Plant cells use mitochondria only", "Animal cells use chloroplasts", "Plant cells perform photosynthesis", "Animal cells perform photosynthesis"], correct: 2, explanation: "Plant cells perform photosynthesis in chloroplasts to produce glucose, while animal cells rely on mitochondria for cellular respiration." },
    { text: "What is the role of cyclins in the cell cycle?", options: ["Condensing DNA", "Driving progression of cell cycle phases", "Breaking down chromosomes", "Synthesizing RNA"], correct: 1, explanation: "Cyclins regulate the progression of the cell cycle by activating cyclin-dependent kinases (CDKs)." },
    { text: "Which organelle is shared by both prokaryotic and eukaryotic cells?", options: ["Mitochondria", "Chloroplast", "Ribosomes", "Golgi apparatus"], correct: 2, explanation: "Ribosomes are present in both prokaryotic and eukaryotic cells, enabling protein synthesis in both cell types." },
    { text: "Which cellular structure is involved in maintaining the shape of animal cells?", options: ["Cell wall", "Cytoskeleton", "Plasma membrane", "Nucleus"], correct: 1, explanation: "The cytoskeleton provides structural support and maintains the shape of animal cells, as they lack a cell wall." },
    { text: "How does cytokinesis differ between animal and plant cells?", options: ["Animal cells form a cell plate", "Plant cells form a cleavage furrow", "Animal cells form a cleavage furrow, while plant cells form a cell plate", "No difference"], correct: 2, explanation: "Animal cells divide through a cleavage furrow, while plant cells form a cell plate during cytokinesis." },
    { text: "Which type of cells typically lacks organelles?", options: ["Plant cells", "Eukaryotic cells", "Prokaryotic cells", "Animal cells"], correct: 2, explanation: "Prokaryotic cells lack membrane-bound organelles, unlike eukaryotic cells, which contain structures like the nucleus and mitochondria." },
    { text: "What role do spindle fibers play during mitosis?", options: ["Condensing chromosomes", "Breaking down the nucleus", "Pulling sister chromatids apart", "Synthesis of DNA"], correct: 2, explanation: "Spindle fibers attach to chromosomes and pull sister chromatids apart to opposite poles during anaphase of mitosis." },
    { text: "What is the significance of crossing over in meiosis?", options: ["Increases genetic variation", "Prevents chromosome separation", "Ensures DNA replication", "Produces identical cells"], correct: 0, explanation: "Crossing over during prophase I of meiosis increases genetic variation by exchanging DNA segments between homologous chromosomes." },
    { text: "What is a major similarity between plant and animal cells?", options: ["Both have chloroplasts", "Both have cell walls", "Both have mitochondria", "Both lack centrioles"], correct: 2, explanation: "Both plant and animal cells have mitochondria for energy production, although only plant cells have chloroplasts." },
    { text: "How do prokaryotic and eukaryotic cells differ in their genetic material?", options: ["Prokaryotes have DNA in a nucleus", "Eukaryotes have circular DNA", "Prokaryotes have circular DNA in the cytoplasm", "Eukaryotes lack DNA"], correct: 2, explanation: "Prokaryotic cells have circular DNA that floats freely in the cytoplasm, while eukaryotic cells have linear DNA within a nucleus." },
    { text: "What role do centrioles play during animal cell division?", options: ["DNA replication", "Forming spindle fibers", "Condensing chromatin", "Breaking down membranes"], correct: 1, explanation: "Centrioles organize the spindle fibers that segregate chromosomes during cell division in animal cells." },
    { text: "Which stage of mitosis is characterized by the formation of two new nuclei?", options: ["Prophase", "Anaphase", "Telophase", "Metaphase"], correct: 2, explanation: "During telophase, two new nuclei form around the separated sets of chromosomes, signaling the end of mitosis." },
    { text: "What is the G1 phase of the cell cycle known for?", options: ["DNA replication", "Cell growth and preparation for DNA synthesis", "Chromosome separation", "Cytoplasmic division"], correct: 1, explanation: "The G1 phase is the first stage of interphase, where the cell grows and prepares for DNA replication." },
    { text: "What is one function shared by all cell membranes?", options: ["Energy production", "Protein synthesis", "Selective permeability", "DNA storage"], correct: 2, explanation: "All cell membranes are selectively permeable, regulating the movement of substances in and out of the cell." }, 

    { 
        text: "Skin colour in man is controlled by:", 
        options: ["1 pair", "2 pairs", "4 pairs", "8 pairs"], 
        correct: 2, 
        explanation: "Human skin color is a polygenic trait, controlled by multiple gene pairs (at least 4 pairs contribute significantly)." 
    },
    { 
        text: "Feature correct to O-negative blood group:", 
        options: ["A,B antigen present", "Anti-A, Anti-B antibody present", "Rh antigen present", "Rh antibody present"], 
        correct: 1, 
        explanation: "O-negative blood lacks A and B antigens but has anti-A and anti-B antibodies, and lacks the Rh antigen." 
    },
    { 
        text: "Which of the following blood group is always heterozygous?", 
        options: ["AB", "B", "A", "O"], 
        correct: 0, 
        explanation: "The AB blood group genotype is always heterozygous (IAIB)." 
    },
    { 
        text: "Which statement is incorrect?", 
        options: ["Lizard can regenerate its head", "Salamander can regenerate its limbs", "Earthworm can regenerate its head", "Man can regenerate his skin"], 
        correct: 0, 
        explanation: "Lizards cannot regenerate their heads; they can detach their tails, but not their heads." 
    },
    { 
        text: "Growth is basically an increase in:", 
        options: ["Number of cells", "Size of cells", "Both of these", "None of these"], 
        correct: 2, 
        explanation: "Growth involves both cell division (increasing number) and cell enlargement (increasing size)." 
    },
    { 
        text: "The stage of rapid cell division just after fertilization is:", 
        options: ["Gastrulation", "Cleavage", "Organogenesis", "Growth"], 
        correct: 1, 
        explanation: "Cleavage is the rapid series of cell divisions immediately following fertilization." 
    },
    { 
        text: "The German scientist Spemann worked on differentiation in:", 
        options: ["1924", "1925", "1915", "1940"], 
        correct: 0, 
        explanation: "Hans Spemann's key experiments on embryonic induction were primarily conducted in the 1920s, leading to publications around 1924-1925." 
    },
    { 
        text: "Inducer substances are produced by:", 
        options: ["Nicholson", "Goethe", "Antershon", "Sacke"], 
        correct: 2, 
        explanation: "While the options lack a precisely correct answer, the question refers to Spemann's organizer, a region of the embryo that produces signals (inducer substances) influencing differentiation. This question needs clarification as to the intended person. Antershon is not a known figure in this area." 
    },
    { 
        text: "What is the feature of cells in gastrulation?", 
        options: ["Differentiation", "Migration", "Division", "All of these"], 
        correct: 3, 
        explanation: "Gastrulation involves cell differentiation, migration, and some cell division." 
    },
    { 
        text: "Vertebral column is formed from:", 
        options: ["Ectoderm", "Endoderm", "Mesoderm", "None of these"], 
        correct: 2, 
        explanation: "The mesoderm is the germ layer that gives rise to the skeletal system, including the vertebral column." 
    },
    { 
        text: "Liver and pancreas arise from:", 
        options: ["Foregut", "Midgut", "Hindgut", "None of these"], 
        correct: 0, 
        explanation: "The liver and pancreas develop from the foregut during embryonic development." 
    },
    { 
        text: "Interaction between genes occupying different loci is:", 
        options: ["Dominance", "Epistasis", "Pleiotropy", "None of these"], 
        correct: 1, 
        explanation: "Epistasis describes the interaction between genes at different loci affecting a single trait." 
    },
    { 
        text: "Genes that affect growth rate in humans influencing both weight and height are:", 
        options: ["Codominant", "Polygene", "Pleiotropy", "Epistasis"], 
        correct: 2, 
        explanation: "Pleiotropy refers to one gene influencing multiple traits; growth genes often affect both height and weight." 
    },
    { 
        text: "All of the following are continuously varying traits except:", 
        options: ["Kernel colour in wheat", "Skin colour in humans", "Height in humans", "Tongue rolling in humans"], 
        correct: 3, 
        explanation: "Tongue rolling is a discrete trait; you either can or cannot roll your tongue." 
    },
    { 
        text: "The number of linkage groups in humans is:", 
        options: ["12", "23", "46", "92"], 
        correct: 1, 
        explanation: "Humans have 23 pairs of chromosomes, therefore 23 linkage groups." 
    },
    { 
        text: "Recombination frequency between two linked genes can be calculated by:", 
        options: ["Back cross", "Test cross", "Normal cross", "None of these"], 
        correct: 1, 
        explanation: "Test crosses are used to determine the recombination frequency between linked genes." 
    },
    { 
        text: "Which of the following is male determining gene in humans?", 
        options: ["tfm", "SRY", "Both of these", "None of these"], 
        correct: 1, 
        explanation: "The SRY gene on the Y chromosome is the primary determinant of maleness in humans." 
    },
    { 
        text: "It was discovered by J. Seiler in 1914 in moth:", 
        options: ["XX-XO", "XY-XX", "ZZ-ZW", "None of these"], 
        correct: 0, 
        explanation: "J. Seiler described the XX-XO sex determination system in moths." 
    },
    { 
        text: "Haemophilia B is due to abnormality of factor:", 
        options: ["VIII", "IX", "X", "XI"], 
        correct: 1, 
        explanation: "Haemophilia B is caused by a deficiency in factor IX." 
    },
    { 
        text: "Gene for blue spasm is present on chromosome:", 
        options: ["X", "Y", "7", "11"], 
        correct: 0, 
        explanation: "The gene for blue cone monochromacy (sometimes called 'blue spasm') is X-linked." 
    }, 
    {
        text: "Most common type of Diabetes mellitus is:",
        options: ["MODY", "Type II", "Type I", "None of these"],
        correct: 1,
        explanation: "Type II diabetes is far more prevalent than Type I or MODY."
    },
    {
        text: "Phenotype represents:",
        options: ["Morphology", "Physiology", "Genetics", "None of these"],
        correct: 0,
        explanation: "Phenotype refers to the observable characteristics of an organism."
    },
    {
        text: "During test cross, if all offsprings are phenotypically dominant then parents are:",
        options: ["Homozygous", "Heterozygous", "One homozygous other heterozygous", "None of these"],
        correct: 0,
        explanation: "If all offspring from a test cross show the dominant phenotype, the parent with the unknown genotype must be homozygous dominant."
    },
    {
        text: "True breeding variety is produced by:",
        options: ["Self fertilization", "Cross fertilization", "Both of these", "None of these"],
        correct: 0,
        explanation: "True-breeding varieties are homozygous for the traits of interest, achieved through self-fertilization."
    },
    {
        text: "Genotype ratio of Mendel’s law of independent assortment is:",
        options: ["3:1", "1:02:01", "9:3:3:1", "None of these"],
        correct: 2,
        explanation: "Mendel's dihybrid cross shows a 9:3:3:1 genotypic ratio in the F2 generation."
    },
    {
        text: "Which of the following is universal donor?",
        options: ["AB", "B", "A", "O"],
        correct: 3,
        explanation: "O-negative blood is considered the universal donor because it lacks A, B, and Rh antigens."
    },
    {
        text: "Such inheritance in which trait vary quantitatively is:",
        options: ["Continuously varying trait", "Incomplete dominance", "Test cross", "Polygenic inheritance"],
        correct: 3,
        explanation: "Polygenic inheritance involves multiple genes contributing to a quantitative trait."
    },
    {
        text: "A pure breeding tall plant was crossed to a dwarf plant. What would be the probability of ‘Tt’ genotype in F1?",
        options: ["0.25", "0", "0.75", "1"],
        correct: 3,
        explanation: "A cross of TT x tt will produce all Tt offspring in the F1 generation."
    },
    {
        text: "A monohybrid cross yielded 3:1 F2. What could be the mode of inheritance?",
        options: ["Segregation", "Independent assortment", "Both of these", "None of these"],
        correct: 0,
        explanation: "A 3:1 F2 ratio is characteristic of Mendel's law of segregation with complete dominance."
    }, 

{ text: "Which of the following is universal donor?", options: ["AB", "B", "A", "O"], correct: 3, explanation: "O-negative blood is considered the universal donor because it lacks A, B, and Rh antigens." },
{ text: "Such inheritance in which trait very quantitatively is:", options: ["Continuously varying trait", "Incomplete dominance", "Test cross", "Polygenic inheritance"], correct: 3, explanation: "Polygenic inheritance involves multiple genes contributing to a quantitative trait." },
{ text: "A pure breeding tall plant was crossed to dwarf plant. What would be probability of ‘Tt’ genotype in F1?", options: ["0.25", "0", "0.75", "1"], correct: 3, explanation: "A cross of TT x tt will produce all Tt offspring in the F1 generation." },
{ text: "A monohybrid cross yielded 3:1 F2. What could be mode of inheritance?", options: ["Segregation", "Independent assortment", "Both of these", "None of these"], correct: 0, explanation: "A 3:1 F2 ratio is characteristic of Mendel's law of segregation with complete dominance." }, 
{ text: "What is the smallest unit of life that can function independently?", options: ["Atom", "Molecule", "Organelle", "Cell"], correct: 3, explanation: "The cell is the smallest unit of life that can independently carry out all life functions." },
    { text: "What process allows cells to take in solid particles?", options: ["Pinocytosis", "Exocytosis", "Phagocytosis", "Osmosis"], correct: 2, explanation: "Phagocytosis is a type of endocytosis where cells engulf solid particles into vesicles." },
    { text: "Which organelle is responsible for assembling proteins?", options: ["Golgi apparatus", "Ribosomes", "Nucleus", "Mitochondria"], correct: 1, explanation: "Ribosomes are responsible for protein synthesis by translating messenger RNA." },
    { text: "What phase of the cell cycle is responsible for preparing the cell for mitosis?", options: ["G1 phase", "S phase", "G2 phase", "M phase"], correct: 2, explanation: "The G2 phase of the cell cycle prepares the cell for mitosis by ensuring all DNA is replicated and any errors are repaired." },
    { text: "What is the purpose of the cell wall in plant cells?", options: ["Regulating nutrient flow", "Storing energy", "Providing structural support", "Facilitating communication"], correct: 2, explanation: "The cell wall provides structural support and protection to plant cells, allowing them to maintain their shape." },
    { text: "What type of DNA is found in mitochondria?", options: ["Linear DNA", "Circular DNA", "RNA", "Single-stranded DNA"], correct: 1, explanation: "Mitochondria contain circular DNA, similar to prokaryotic cells, allowing them to produce some proteins independently of the nucleus." },
    { text: "Which phase of mitosis is characterized by the breakdown of the nuclear envelope?", options: ["Prophase", "Metaphase", "Anaphase", "Telophase"], correct: 0, explanation: "In prophase, the nuclear envelope breaks down, allowing chromosomes to attach to spindle fibers." },
    { text: "What is the function of gap junctions in animal cells?", options: ["Providing structural support", "Facilitating nutrient storage", "Allowing direct communication between cells", "Strengthening cell walls"], correct: 2, explanation: "Gap junctions are specialized connections that allow direct communication and exchange of ions and molecules between adjacent animal cells." },
    { text: "What is the key feature of stem cells in development?", options: ["Limited division potential", "Specialized structure", "Ability to differentiate into multiple cell types", "Lack of DNA"], correct: 2, explanation: "Stem cells have the ability to differentiate into various cell types, making them crucial for development and tissue repair." },
    { text: "Which organelle is responsible for processing and packaging proteins?", options: ["Golgi apparatus", "Ribosomes", "Endoplasmic reticulum", "Nucleus"], correct: 0, explanation: "The Golgi apparatus modifies, processes, and packages proteins for transport to different parts of the cell or secretion outside the cell." },
    { text: "Which cellular structure in plant cells stores starch?", options: ["Chloroplasts", "Chromoplasts", "Amyloplasts", "Vacuoles"], correct: 2, explanation: "Amyloplasts are specialized plastids in plant cells that store starch, particularly in roots and tubers." },
    { text: "What is the function of the nuclear pores in eukaryotic cells?", options: ["Synthesizing DNA", "Regulating transport of molecules in and out of the nucleus", "Packaging proteins", "Producing energy"], correct: 1, explanation: "Nuclear pores regulate the exchange of materials such as RNA and proteins between the nucleus and cytoplasm." },
    { text: "What is one key role of the cytoskeleton?", options: ["DNA replication", "Maintaining cell shape", "Producing ATP", "Breaking down waste products"], correct: 1, explanation: "The cytoskeleton is a network of protein filaments that provides structural support and maintains the cell's shape." },
    { text: "What distinguishes cytokinesis in animal cells?", options: ["Formation of a cell plate", "Involvement of spindle fibers", "Formation of a cleavage furrow", "Absence of chromosomes"], correct: 2, explanation: "In animal cells, cytokinesis occurs through the formation of a cleavage furrow, where the cell membrane pinches to divide the cytoplasm." },
    { text: "Which cell type lacks membrane-bound organelles?", options: ["Plant cells", "Eukaryotic cells", "Prokaryotic cells", "Animal cells"], correct: 2, explanation: "Prokaryotic cells lack membrane-bound organelles like the nucleus, mitochondria, and Golgi apparatus." },
    { text: "What is the role of the centrosome during cell division?", options: ["Synthesis of DNA", "Formation of spindle fibers", "Separation of chromatids", "Production of ATP"], correct: 1, explanation: "The centrosome organizes spindle fibers, which are crucial for aligning and separating chromosomes during mitosis and meiosis." },
    { text: "Which phase of the cell cycle involves the duplication of chromosomes?", options: ["G1 phase", "S phase", "G2 phase", "M phase"], correct: 1, explanation: "The S phase (Synthesis phase) of interphase is when DNA replication occurs, resulting in duplicated chromosomes." },
    { text: "What is the role of plasmodesmata in plant cells?", options: ["Energy production", "Communication between cells", "Protein synthesis", "Photosynthesis"], correct: 1, explanation: "Plasmodesmata are channels between plant cells that allow for the exchange of materials and communication between adjacent cells." },
    { text: "What feature do both chloroplasts and mitochondria share?", options: ["Presence of ribosomes", "Linear DNA", "Ability to perform photosynthesis", "Synthesis of starch"], correct: 0, explanation: "Both chloroplasts and mitochondria contain ribosomes, which enable them to produce some proteins independently of the cell's nucleus." },
    { text: "How does mitosis contribute to development?", options: ["Produces genetically diverse cells", "Repairs damaged DNA", "Increases the number of identical cells", "Facilitates crossing over"], correct: 2, explanation: "Mitosis produces identical daughter cells, allowing growth, tissue repair, and asexual reproduction in multicellular organisms." }, 
    { text: "What is the primary genetic material in most organisms?", options: ["RNA", "DNA", "Proteins", "Lipids"], correct: 1, explanation: "DNA (Deoxyribonucleic acid) is the primary genetic material in most organisms, containing the instructions for their development and functioning." },
    { text: "Which nitrogenous base is found in RNA but not in DNA?", options: ["Adenine", "Thymine", "Uracil", "Cytosine"], correct: 2, explanation: "Uracil replaces thymine in RNA, pairing with adenine during RNA synthesis." },
    { text: "What is the shape of the DNA molecule?", options: ["Single-stranded", "Double helix", "Linear chain", "Circular loop"], correct: 1, explanation: "DNA has a double-helix structure, where two strands are twisted around each other, held together by hydrogen bonds between complementary bases." },
    { text: "What is the key function of RNA in cells?", options: ["Storage of genetic information", "Catalyzing energy production", "Protein synthesis", "Replication of DNA"], correct: 2, explanation: "RNA plays a critical role in protein synthesis, acting as a messenger (mRNA) and assisting in the translation process (tRNA and rRNA)." },
    { text: "What is equational division also known as?", options: ["Meiosis I", "Meiosis II", "Mitosis", "Binary fission"], correct: 2, explanation: "Equational division is another name for mitosis, where the chromosome number is maintained, producing genetically identical daughter cells." },
    { text: "What is reductional division?", options: ["Meiosis I", "Meiosis II", "Mitosis", "DNA replication"], correct: 0, explanation: "Reductional division occurs during meiosis I, where homologous chromosomes separate, halving the chromosome number in gametes." },
    { text: "What bonds hold the complementary bases of DNA together?", options: ["Covalent bonds", "Ionic bonds", "Hydrogen bonds", "Peptide bonds"], correct: 2, explanation: "Hydrogen bonds between complementary base pairs (adenine-thymine and guanine-cytosine) stabilize the DNA double helix." },
    { text: "What is the term for the process of DNA making a copy of itself?", options: ["Translation", "Replication", "Transcription", "Reduction"], correct: 1, explanation: "Replication is the process by which DNA duplicates itself, ensuring genetic information is passed to new cells or offspring." },
    { text: "Which phase of meiosis reduces the chromosome number by half?", options: ["Prophase I", "Meiosis I", "Meiosis II", "Telophase II"], correct: 1, explanation: "Meiosis I reduces the chromosome number by half by separating homologous chromosomes, preparing for gamete formation." },
    { text: "What is the main difference between meiosis I and meiosis II?", options: ["Crossing over occurs in meiosis II", "Chromosome number is reduced in meiosis II", "Meiosis II is similar to mitosis", "Homologous chromosomes separate in meiosis II"], correct: 2, explanation: "Meiosis II is similar to mitosis as it separates sister chromatids without further reducing the chromosome number." },
    { text: "What is the role of crossing over during prophase I of meiosis?", options: ["Increasing genetic variation", "Reducing chromosome number", "Synthesis of DNA", "Producing identical cells"], correct: 0, explanation: "Crossing over exchanges genetic material between homologous chromosomes, increasing genetic diversity in gametes." },
    { text: "Which molecule carries amino acids to ribosomes during protein synthesis?", options: ["mRNA", "tRNA", "rRNA", "DNA"], correct: 1, explanation: "Transfer RNA (tRNA) carries amino acids to ribosomes, where they are assembled into proteins based on the mRNA sequence." },
    { text: "What is the term for the physical and observable characteristics of an organism?", options: ["Genotype", "Phenotype", "Allele", "Genome"], correct: 1, explanation: "Phenotype refers to the observable traits or characteristics of an organism, influenced by its genotype and environment." },
    { text: "Which phase of meiosis involves the separation of homologous chromosomes?", options: ["Prophase I", "Anaphase I", "Metaphase II", "Telophase II"], correct: 1, explanation: "In anaphase I, homologous chromosomes are separated and pulled to opposite poles, reducing the chromosome number by half." },
    { text: "What is the function of histones in DNA?", options: ["Replication", "Protein synthesis", "Condensing DNA into chromatin", "Crossing over"], correct: 2, explanation: "Histones are proteins that help condense DNA into chromatin, enabling efficient packaging within the nucleus." },
    { text: "What does the term 'haploid' mean?", options: ["Having one set of chromosomes", "Having two sets of chromosomes", "Having three sets of chromosomes", "Having no chromosomes"], correct: 0, explanation: "Haploid cells contain a single set of chromosomes, such as gametes (sperm and egg cells) in sexually reproducing organisms." },
    { text: "Which enzyme unwinds the DNA helix during replication?", options: ["DNA polymerase", "RNA polymerase", "Helicase", "Ligase"], correct: 2, explanation: "Helicase unwinds the DNA double helix at the replication fork, allowing the strands to serve as templates for new DNA synthesis." },
    { text: "What are alleles?", options: ["Different forms of a gene", "Proteins encoded by a gene", "Segments of RNA", "Histones"], correct: 0, explanation: "Alleles are alternative forms of a gene that arise by mutation and are found at the same place on a chromosome." },
    { text: "Which phase of mitosis is characterized by the alignment of chromosomes along the cell's equator?", options: ["Prophase", "Metaphase", "Anaphase", "Telophase"], correct: 1, explanation: "During metaphase, chromosomes align along the metaphase plate, ensuring equal segregation during cell division." },
    { text: "What is a key difference between mitosis and meiosis?", options: ["Mitosis produces haploid cells, meiosis produces diploid cells", "Mitosis results in identical cells, meiosis results in genetically diverse cells", "Meiosis occurs in somatic cells, mitosis occurs in gametes", "Mitosis involves two cell divisions"], correct: 1, explanation: "Mitosis produces two genetically identical daughter cells, while meiosis produces four genetically diverse gametes." }, 
    { text: "Which process ensures that daughter cells have an identical set of chromosomes after cell division?", options: ["Meiosis", "Replication", "Mitosis", "Crossing over"], correct: 2, explanation: "Mitosis ensures that each daughter cell receives an identical set of chromosomes by duplicating and equally distributing the genetic material." },
    { text: "What feature of DNA allows it to serve as a template during replication?", options: ["Phosphodiester bonds", "Double-stranded structure with complementary base pairing", "Single-stranded RNA template", "Hydrophobic core"], correct: 1, explanation: "DNA's double-stranded structure with complementary base pairing enables accurate copying during replication." },
    { text: "What is the ploidy of cells at the end of meiosis I?", options: ["Diploid", "Haploid", "Tetraploid", "Triploid"], correct: 1, explanation: "At the end of meiosis I, the cells are haploid, containing one set of chromosomes, as homologous chromosomes are separated." },
    { text: "Which phase of meiosis increases genetic diversity through crossing over?", options: ["Metaphase I", "Anaphase I", "Prophase I", "Telophase II"], correct: 2, explanation: "Crossing over occurs during prophase I of meiosis, where homologous chromosomes exchange segments to increase genetic diversity." },
    { text: "Which molecule is responsible for adding nucleotides during DNA replication?", options: ["RNA polymerase", "DNA ligase", "DNA helicase", "DNA polymerase"], correct: 3, explanation: "DNA polymerase adds nucleotides to the growing DNA strand during replication, using the template strand as a guide." },
    { text: "What is the main difference between spermatogenesis and oogenesis?", options: ["Spermatogenesis produces one gamete, oogenesis produces four", "Oogenesis is completed before birth, spermatogenesis occurs throughout life", "Spermatogenesis occurs in the ovaries", "Oogenesis involves no meiosis"], correct: 1, explanation: "Oogenesis begins before birth and is arrested at specific stages, while spermatogenesis continues throughout a male's life." },
    { text: "Why is meiosis II often called equational division?", options: ["Chromosome number is halved", "Sister chromatids are separated without changing chromosome number", "Homologous chromosomes pair up", "DNA replication occurs"], correct: 1, explanation: "Meiosis II separates sister chromatids, similar to mitosis, maintaining the haploid chromosome number in daughter cells." },
    { text: "What is the function of Okazaki fragments during DNA replication?", options: ["Synthesizing the leading strand", "Synthesizing the lagging strand discontinuously", "Unwinding the DNA helix", "Sealing gaps in DNA"], correct: 1, explanation: "Okazaki fragments are short DNA sequences synthesized on the lagging strand during DNA replication." },
    { text: "What is the significance of independent assortment in meiosis?", options: ["Replicates DNA", "Aligns chromosomes", "Increases genetic variation", "Separates sister chromatids"], correct: 2, explanation: "Independent assortment occurs during meiosis I, where homologous chromosomes are randomly distributed, creating genetic variation in gametes." },
    { text: "What is the primary difference between leading and lagging strand synthesis?", options: ["Direction of synthesis", "Speed of synthesis", "Enzyme used", "Nucleotide composition"], correct: 0, explanation: "The leading strand is synthesized continuously in the 5'-3' direction, while the lagging strand is synthesized discontinuously in the opposite direction." },
    { text: "Why are telomeres important for DNA stability?", options: ["They encode proteins", "They prevent chromosomes from shortening during replication", "They unwind the DNA helix", "They catalyze nucleotide addition"], correct: 1, explanation: "Telomeres are repetitive sequences at chromosome ends that protect them from degradation during DNA replication." },
    { text: "How does crossing over differ from independent assortment?", options: ["Crossing over occurs in metaphase I", "Crossing over exchanges genetic material, independent assortment arranges chromosomes randomly", "Crossing over separates homologous chromosomes", "Independent assortment occurs in meiosis II"], correct: 1, explanation: "Crossing over involves the exchange of genetic material between homologous chromosomes, while independent assortment determines their random alignment and segregation." },
    { text: "Which enzyme seals gaps between Okazaki fragments?", options: ["DNA polymerase", "RNA primase", "DNA ligase", "Helicase"], correct: 2, explanation: "DNA ligase seals gaps between Okazaki fragments on the lagging strand, forming a continuous DNA strand." },
    { text: "Which structure organizes the spindle fibers during mitosis?", options: ["Centrosome", "Chromosome", "Nucleolus", "Cytoplasm"], correct: 0, explanation: "The centrosome organizes the spindle fibers that attach to chromosomes and facilitate their separation during mitosis." },
    { text: "What role does the synaptonemal complex play in meiosis?", options: ["Separates homologous chromosomes", "Facilitates crossing over", "Replicates DNA", "Aligns sister chromatids"], correct: 1, explanation: "The synaptonemal complex is a protein structure that forms between homologous chromosomes, facilitating crossing over during prophase I." },
    { text: "Which of the following is a result of nondisjunction during meiosis?", options: ["Mutations in DNA sequence", "Failure of chromosomes to replicate", "Aneuploidy, such as Down syndrome", "Crossing over errors"], correct: 2, explanation: "Nondisjunction occurs when homologous chromosomes or sister chromatids fail to separate, leading to aneuploidy, such as trisomy 21 (Down syndrome)." },
    { text: "How is genetic material exchanged between homologous chromosomes?", options: ["Replication", "Independent assortment", "Crossing over", "Chromatid duplication"], correct: 2, explanation: "Crossing over during prophase I allows genetic material to be exchanged between homologous chromosomes, increasing genetic diversity." },
    { text: "What happens during metaphase I of meiosis?", options: ["Homologous chromosomes align at the metaphase plate", "Sister chromatids align at the metaphase plate", "Homologous chromosomes separate", "Crossing over occurs"], correct: 0, explanation: "In metaphase I, homologous chromosomes align at the metaphase plate, preparing for separation in anaphase I." },
    { text: "Which enzyme synthesizes RNA primers during replication?", options: ["DNA polymerase", "RNA primase", "Helicase", "Ligase"], correct: 1, explanation: "RNA primase synthesizes short RNA primers needed for DNA polymerase to initiate DNA synthesis." },
    { text: "What occurs during telophase II of meiosis?", options: ["Homologous chromosomes separate", "Four haploid cells are formed", "DNA replicates", "Spindle fibers form"], correct: 1, explanation: "In telophase II, the nuclear membranes reform, and four haploid daughter cells are produced, each with a unique genetic composition." }, 

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
    text: "Interaction between genes occupying different loci",
    options: ["Dominance", "Epistasis", "Pleiotropy", "None of these"],
    correct: 1,
    explanation: "Epistasis describes the interaction between genes at different loci affecting a single trait."
  },
  {
    text: "Genes that affect growth rate in humans influencing both weight and height",
    options: ["Codominant", "Polygene", "Pleiotropy", "Epistasis"],
    correct: 2,
    explanation: "Pleiotropy refers to one gene influencing multiple traits; growth genes often affect both height and weight."
  },
  {
    text: "All of the following are continuously varying traits except",
    options: ["Kernel colour in wheat", "Skin colour in humans", "Height in humans", "Tongue rolling in humans"],
    correct: 3,
    explanation: "Tongue rolling is a discrete trait; you either can or cannot roll your tongue."
  },
  {
    text: "The number of linkage groups in humans",
    options: ["12", "23", "46", "92"],
    correct: 1,
    explanation: "Humans have 23 pairs of chromosomes, therefore 23 linkage groups."
  },
  {
    text: "Recombination frequency between two linked genes can be calculated by",
    options: ["Back cross", "Test cross", "Normal cross", "None of these"],
    correct: 1,
    explanation: "Test crosses are used to determine the recombination frequency between linked genes."
  },
  {
    text: "Which of the following is male determining gene in humans",
    options: ["tfm", "SRY", "Both of these", "None of these"],
    correct: 1,
    explanation: "The SRY gene on the Y chromosome is the primary determinant of maleness in humans."
  },
  {
    text: "It was discovered by J. Seiler in 1914 in moth",
    options: ["XX-XO", "XY-XX", "ZZ-ZW", "None of these"],
    correct: 0,
    explanation: "J. Seiler described the XX-XO sex determination system in moths."
  },
  {
    text: "Haemophilia B is due to abnormality of factor",
    options: ["VIII", "IX", "X", "XI"],
    correct: 1,
    explanation: "Haemophilia B is caused by a deficiency in factor IX."
  },
  {
    text: "Gene for blue cone monochromacy (sometimes associated with nystagmus and informally called \"blue spasm\") is present on chromosome",
    options: ["X", "Y", "7", "11"],
    correct: 0,
    explanation: "The gene for blue cone monochromacy is X-linked."
  },
  {
    text: "Most common type of Diabetes mellitus",
    options: ["MODY", "Type II", "Type I", "None of these"],
    correct: 1,
    explanation: "Type II diabetes is far more prevalent than Type I or MODY."
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
      }, 
      
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
  // Display question number along with the question text
  questionText.innerHTML = `<h3>Que ${currentQuestionIndex + 1}: ${question.text}</h3>`;
  optionsContainer.innerHTML = "";

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.textContent = option;
    button.addEventListener("click", () => selectAnswer(index));
    button.className = "option-button";
    optionsContainer.appendChild(button);
  });

  // Enable/Disable navigation buttons based on the current index
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
    return array.sort(() => 0.5 - Math.random()).slice(0.5, 50);
  }

  function getRemark(percentage) {
    if (percentage === 100) return "Excellent! You aced the test!";
    if (percentage >= 75) return "Great job! You did very well.";
    if (percentage >= 50) return "Good effort, but there's room for improvement.";
    return "Keep practicing! You can do better.";
  }
});
