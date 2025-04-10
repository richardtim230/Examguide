
  function closeWelcomePopup() {
    document.getElementById('welcomePopup').style.display = 'none';
  }

  function startTour() {
    closeWelcomePopup();

    // Trigger your tour logic here
    if (typeof startAppTour === 'function') {
      startAppTour();
    } else {
      console.log("Tour started!");
    }
  }

  window.onload = () => {
    document.getElementById('welcomePopup').style.display = 'flex';
  };

// Check if the browser supports notifications
if ("Notification" in window) {
    // Request notification permission from the user
    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            scheduleDailyNotification();
        }
    });
}

// Function to schedule a daily notification at 3:00 pm
function scheduleDailyNotification() {
    const now = new Date();
    const notificationTime = new Date();

    notificationTime.setHours(15, 56, 0, 0); // Set time to 3:00 pm

    // If time has already passed today, set for the next day
    if (now.getTime() > notificationTime.getTime()) {
        notificationTime.setDate(now.getDate() + 1);
    }

    const timeout = notificationTime.getTime() - now.getTime();

    setTimeout(() => {
        showNotification();
        // Schedule next notification
        setInterval(showNotification, 24 * 60 * 60 * 1000);
    }, timeout);
}

// Function to show the notification
function showNotification() {
    new Notification("Reminder", {
        body: "It's 3:00 pm! Time to read an article.",
        icon: "logo.png" // Optional: Path to an icon image
    });
}

// Existing code...
let attemptedQuestions = []; // Array to store data about attempted questions
function showRegister() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('register-container').style.display = 'block';
}

function showLogin() {
    document.getElementById('register-container').style.display = 'none';
    document.getElementById('auth-container').style.display = 'block';
}

function loginUser() {
    var fullName = document.getElementById('loginFullName').value;
    var phone = document.getElementById('loginPhone').value;

    if (!fullName || !phone) {
        showRegister();
        return;
    }

    // Retrieve user details from local storage
    var storedUser = JSON.parse(localStorage.getItem('userDetails'));

    if (storedUser && storedUser.fullName === fullName && storedUser.phone === phone) {
        alert('Login successful');
        loadDashboard();  // Load the dashboard on successful login
    } else {
        alert('User not found. Please register.');
        showRegister();
    }
}

function registerUser() {
    var fullName = document.getElementById('regFullName').value;
    var department = document.getElementById('regDepartment').value;
    var faculty = document.getElementById('regFaculty').value;
    var level = document.getElementById('regLevel').value;
    var phone = document.getElementById('regPhone').value;

    if (!fullName || !department || !faculty || !level || !phone) {
        alert('Please fill in all fields');
        return;
    }

    // Save user details to local storage
    var userDetails = {
        fullName: fullName,
        department: department,
        faculty: faculty,
        level: level,
        phone: phone,
        creditPoints: 80 // Default to 100 points on registration
    };

    localStorage.setItem('userDetails', JSON.stringify(userDetails));
    alert('Registration successful');
    window.location.reload();  // Reload the page
    showLogin();  // Redirect to login page
}

function loadDashboard() {
    var userData = JSON.parse(localStorage.getItem('userDetails'));
    if (!userData) return;

    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('register-container').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'block';

    document.getElementById('user-name').innerText = userData.fullName;
    document.getElementById('user-department').innerText = userData.department;
    document.getElementById('user-faculty').innerText = userData.faculty;
    document.getElementById('user-level').innerText = userData.level;
    document.getElementById('user-phone').innerText = userData.phone;
    document.getElementById('credit-points').innerText = userData.creditPoints;  // Display current credit points
}

// Auto-load Dashboard if user is logged in
window.onload = function () {
    if (localStorage.getItem('userDetails')) {
        loadDashboard();
    }
};

// Purchase Credit Points
function purchaseCredits() {
    let amount = document.getElementById("purchaseAmount").value;
    if (!amount || amount < 200) {
        alert("Enter a valid amount. Minimum is ₦200");
        return;
    }

    let rechargePin = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    localStorage.setItem("generatedPin", rechargePin);

    let userData = JSON.parse(localStorage.getItem("userDetails"));

    // Display the payment pop-up with user and payment details
    document.getElementById("popup-fullName").innerText = userData.fullName;
    document.getElementById("popup-phone").innerText = userData.phone;
    document.getElementById("popup-amount").innerText = `₦${amount}`;
    document.getElementById("popup-pin").innerText = rechargePin;

    let popup = document.getElementById('payment-popup');
    popup.style.display = 'block'; // Show the popup
}

// Function to redirect to WhatsApp with payment details
function activatePin() {
    let userData = JSON.parse(localStorage.getItem("userDetails"));
    let amount = document.getElementById("popup-amount").innerText.replace('₦', '');
    let rechargePin = document.getElementById("popup-pin").innerText;

    let whatsappLink = `https://wa.me/+2349155127634?text=Name:%20${userData.fullName}%0APhone:%20${userData.phone}%0AAmount:%20₦${amount}%0APIN:%20${rechargePin}`;
    window.open(whatsappLink, "_blank");
}

// Close the payment pop-up
function closePopup() {
    document.getElementById("payment-popup").style.display = "none";
}


// Redeem Credits
function redeemCredits() {
    let inputPin = document.getElementById("rechargePin").value;
    let storedPin = localStorage.getItem("generatedPin");

    const adminPins = {
        "5081795677": 200,  // Admin set PIN 1
        "7660798196": 200,    // Admin set PIN 2
        "4763094902": 200,   // Admin set PIN 3
        "7542533555": 200,     // Admin set PIN 3
    "2280281834": 200,  // Admin set PIN 3
    "1333744582": 200,    // Admin set PIN 3
    "6227881069": 20000000,   // Admin set PIN 3
    "1213074836": 500,     // Admin set PIN 3
        "9479187153": 300,     // Admin set PIN 3
        "476304902": 200,     // Admin set PIN 3
        "476304902": 200,     // Admin set PIN 3
        "476304902": 200,     // Admin set PIN 3
    "476304902": 200     // Admin set PIN 3
    };

    if (inputPin === storedPin && adminPins.hasOwnProperty(inputPin)) {
        let creditsToAdd = adminPins[inputPin];
        let userData = JSON.parse(localStorage.getItem("userDetails"));
        userData.creditPoints += creditsToAdd;
        localStorage.setItem("userDetails", JSON.stringify(userData));
        alert(`Recharge Successful! ${creditsToAdd} points added.`);
        
        // Delete the redeemed pin from local storage
        localStorage.removeItem("generatedPin");

        loadDashboard();
    } else {
        alert("Invalid PIN. Please try again. Refresh your browser and retry if pin is already validated by Admin");
    }
}

document.addEventListener("DOMContentLoaded", function() {
    // Get query parameters from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const creditPoints = urlParams.get('creditPoints');
    const userName = urlParams.get('userName');

    // Update the credit points and user name on the exam page
    if (creditPoints !== null && userName !== null) {
        document.getElementById("credit-points").innerText = creditPoints;
        document.getElementById("user-name").innerText = userName;
    }
});

// Global Variables
let currentQuestionIndex = 0;
let score = 0;
let selectedAnswer = "";
let timer;
let timeLeft = 25;
let questions = [];

function startExam() {
    let userData = JSON.parse(localStorage.getItem("userDetails"));  // Corrected key
    let examCode = document.getElementById("examCode").value.toUpperCase();

    if (userData.creditPoints < 5) {
        alert("Not enough credit points. Please purchase more.");
        return;
    }

    if (!examSets[examCode]) {
        alert("Invalid exam code or not yet uploaded. Please enter a valid code.");
        return;
    }

    // Deduct 5 credit points
    userData.creditPoints -= 8;
    localStorage.setItem("userDetails", JSON.stringify(userData));  // Corrected key

    // Hide Dashboard & Show Exam Container
    document.getElementById("dashboard-container").style.display = "none";
    document.getElementById("exam-container").style.display = "block";

    // Select 50 random questions from the chosen exam set
    questions = examSets[examCode].sort(() => 0.7 - Math.random()).slice(0, 30);

    // Set the user's full name and the topic of the question set
    document.getElementById("exam-user-name").innerText = userData.fullName;
    document.getElementById("exam-topic").innerText = getTopicFromExamCode(examCode);

    loadQuestion();
}

function getTopicFromExamCode(examCode) {
    const topics = {
    'EXAM001': 'TEST FOR SIMPLE CATIONS AND ANIONS',
    'EXAM002': 'ISOLATION AND PURIFICATION',
    'EXAM003': 'QUALITATIVE ANALYSIS: TEST FOR COMMON ELEMENTS (E.G. CARBON, HYDROGEN, NITROGEN, SULPHUR, HALOGENS)',
    'EXAM004': 'QUANTITATIVE ANALYSIS USING DUMAS, KJELDAHL’S, AND CARIUS METHODS',
    'EXAM005': 'WHY AND HOW ATOMS COMBINE?',
    'EXAM006': 'THE MOLECULE AND CHEMICAL BONDING',
    'EXAM007': 'ELECTRONS IN MOLECULES: IONIC, COVALENT, DATIVE, AND COMPLEX BONDING',
    'EXAM008': 'POLARITY OF BONDS',
    'EXAM009': 'COORDINATE BONDS',
    'EXAM010': 'METALLIC BONDS',
    'EXAM011': 'BASIC CRYSTALLINE STRUCTURE (E.G., NACL AND METALLIC LATTICES)',
    'EXAM012': 'HYBRIDIZATION AND RESONANCE IN CHEMICAL BONDING',
    'EXAM013': 'CHEMISTRY OF HYDROGEN',
    'EXAM014': 'CHEMISTRY OF NOBLE GASES',
    'EXAM015': 'CHEMISTRY OF ALKALI METALS (GROUP I)',
    'EXAM016': 'CHEMISTRY OF ALKALI EARTH METALS (GROUP II)',
    'EXAM017': 'INTRODUCTION TO THE TERM "ORGANIC CHEMISTRY"',
    'EXAM018': 'HYBRIDIZATION IN CARBON: SP³, SP², AND SP',
    'EXAM019': 'PHYSICAL PROPERTIES RELATED TO STRUCTURES: BOND LENGTH, STRENGTH, ROTATION, ETC.',
    'EXAM020': 'ELECTROPHILES AND NUCLEOPHILES',
    'EXAM021': 'FACTORS INFLUENCING ORGANIC REACTIONS (INDUCTIVE AND MESOMERIC EFFECTS, STERIC FACTORS, ETC.)',
    'EXAM022': 'HOMOLOGOUS SERIES',
    'EXAM023': 'FUNCTIONAL GROUPS CHEMISTRY',
    'EXAM024': 'TYPES OF ORGANIC REACTIONS',
    'EXAM025': 'ISOMERISM: STRUCTURAL, GEOMETRIC, AND OPTICAL ISOMERISM',
    'EXAM026': 'CHEMISTRY OF ALKANES',
    'EXAM027': 'CHEMISTRY OF ALKENES',
    'EXAM028': 'CHEMISTRY OF ALKYNES',
    'EXAM029': 'CHEMISTRY OF ALKYL HALIDES',
    'EXAM030': 'CHEMISTRY OF GRIGNARD REAGENTS',
    'EXAM031': 'NOMENCLATURE (IUPAC RULES)',
    'EXAM032': 'PREPARATION OF HYDROCARBONS',
    'EXAM033': 'PHYSICAL PROPERTIES OF HYDROCARBONS',
    'EXAM034': 'CHEMICAL REACTIONS WITH SIMPLE MECHANISMS',
    'EXAM035': 'APPLICATIONS OF HYDROCARBONS',
    'EXAM036': 'TRENDS IN PROPERTIES OF ELEMENTS (STRUCTURES, IONIZATION ENERGY, PHYSICAL AND CHEMICAL PROPERTIES)',
    'EXAM037': 'PROPERTIES OF SELECTED TYPES OF COMPOUNDS: HYDRIDES, OXIDES, ACIDS, AND BASES',
    'EXAM038': 'CHEMISTRY OF BORON AND ALUMINUM',
    'EXAM039': 'CHEMISTRY OF CARBON AND LEAD',
    'EXAM040': 'CHEMISTRY OF NITROGEN AND BISMUTH',
    'EXAM041': 'TRENDS IN PROPERTIES OF ELEMENTS (GROUPS VI-VII)',
    'EXAM042': 'PROPERTIES OF SELECTED TYPES OF COMPOUNDS (GROUPS VI-VII)',
    'EXAM043': 'CHEMISTRY OF OXYGEN AND SULFUR',
    'EXAM044': 'CHEMISTRY OF FLUORINE AND CHLORINE',
    'EXAM045': 'PROPERTIES OF D-BLOCK ELEMENTS, LANTHANIDES, AND ACTINIDES',
    'EXAM046': 'ELECTRONIC CONFIGURATION, COMPLEXES, AND IUPAC NOMENCLATURE OF COMPLEXES',
    'EXAM047': 'CHEMISTRY OF CHROMIUM, IRON, COBALT, NICKEL, AND COPPER',
    'EXAM048': 'NOMENCLATURE (IUPAC RULES)',
    'EXAM049': 'PREPARATION OF ALCOHOLS, ETHERS, ALDEHYDES, KETONES, CARBOXYLIC ACIDS, DERIVATIVES, AND AMINES',
    'EXAM050': 'STRUCTURE AND PHYSICAL PROPERTIES',
    'EXAM051': 'GENERAL REACTIONS',
    'EXAM052': 'INTRODUCTION TO AROMATIC COMPOUNDS',
    'EXAM053': 'SIMPLE TREATMENT OF CARBOHYDRATES: MONOSACCHARIDES (E.G., GLUCOSE AND FRUCTOSE)',
    'EXAM054': 'DISACCHARIDES AND POLYSACCHARIDES',
    'EXAM055': 'PROTEINS: AMINO ACIDS, PEPTIDE BONDS, ETC.',
    'EXAM056': 'LIPIDS: FATS AND OILS, SOAP AND DETERGENTS',
    'EXAM057': 'CLASSIFICATION AND EVOLUTION IN THE PLANT KINGDOM',
    'EXAM058': 'ELEMENTARY TREATMENT OF CRYPTOGAMS: ALGAE',
    'EXAM059': 'ELEMENTARY TREATMENT OF CRYPTOGAMS: FUNGI',
    'EXAM060': 'ELEMENTARY TREATMENT OF CRYPTOGAMS: BRYOPHYTES',
    'EXAM061': 'PTERIDOPHYTES: DISTRIBUTION AND CLASSIFICATION',
    'EXAM062': 'PTERIDOPHYTES: MORPHOLOGY AND REPRODUCTION',
    'EXAM063': 'PTERIDOPHYTES: ECONOMIC IMPORTANCE',
    'EXAM064': 'SIGNIFICANCE OF THE SEED HABIT IN SPERMATOPHYTES (NON-FLOWERING AND FLOWERING SEED PLANTS)',
    'EXAM065': 'SIMPLE AND COMPLEX TISSUE SYSTEMS IN ROOTS, STEMS, AND LEAVES',
    'EXAM066': 'SCOPE OF MORPHOLOGY: EXTERNAL AND INTERNAL MORPHOLOGY',
    'EXAM067': 'MORPHOLOGY OF PLANT ORGANS: ROOT MORPHOLOGY AND VARIATIONS',
    'EXAM068': 'MORPHOLOGY OF PLANT ORGANS: LEAF MORPHOLOGY AND VARIATIONS',
    'EXAM069': 'MORPHOLOGY OF INFLORESCENCE AND FLOWERS',
    'EXAM070': 'FRUIT MORPHOLOGY AND VARIATIONS',
    'EXAM071': 'INTRODUCTION TO CONCEPTS IN ECOLOGY',
    'EXAM072': 'DEFINITION OF ECOLOGY: THE ENVIRONMENT AND CLIMATE',
    'EXAM073': 'HABITAT AND NICHE',
    'EXAM074': 'AUTECOLOGY',
    'EXAM075': 'SYNECOLOGY, ECOSYSTEM, AND COMMUNITIES',
    'EXAM076': 'BIOMES, POLLUTION, AND GLOBAL WARMING',
    'EXAM077': 'HISTORICAL DEVELOPMENT OF SCIENCE OF GENETICS',
    'EXAM078': 'LIFE CYCLES AND REPRODUCTION',
    'EXAM079': 'MENDELIAN GENETICS',
    'EXAM080': 'CHEMICAL COMPOSITION OF THE GENE',
    'EXAM081': 'MOLECULAR BASIS OF HEREDITY',
    'EXAM082': 'INTRODUCTORY PHYSIOLOGY OF ANIMALS',
    'EXAM083': 'NUTRITION IN ANIMALS',
    'EXAM084': 'EXCRETIONS IN ANIMALS',
    'EXAM085': 'RESPIRATION IN ANIMALS',
    'EXAM086': 'REPRODUCTION IN ANIMALS',
    'EXAM087': 'INTRODUCTORY VERTEBRATE BIOLOGY'
};
    return topics[examCode] || 'Unknown Topic';
}

function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        showReview();
        return;
    }

    clearTimeout(timer);
    timeLeft = 25;
    document.getElementById("timer").innerText = timeLeft;

    let currentQuestion = questions[currentQuestionIndex];
    document.getElementById("question-number").innerText = currentQuestionIndex + 1;
    document.getElementById("question-text").innerText = currentQuestion.question;

    let optionsContainer = document.getElementById("options-container");
    optionsContainer.innerHTML = "";

    // Shuffle the options
    let shuffledOptions = currentQuestion.options.sort(() => 0.7 - Math.random());

    shuffledOptions.forEach(option => {
        let btn = document.createElement("button");
        btn.innerText = option;
        btn.onclick = (event) => selectAnswer(option, event);
        optionsContainer.appendChild(btn);
    });

    document.getElementById("confirm-btn").disabled = true;
    document.getElementById("next-btn").style.display = "none";
    document.getElementById("feedback").innerText = "";

    timer = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").innerText = timeLeft;
        if (timeLeft === 0) {
            clearInterval(timer);
            confirmAnswer();
        }
    }, 2500);
}

function selectAnswer(answer, event) {
    selectedAnswer = answer;
    document.getElementById("confirm-btn").disabled = false;

    // Remove the 'selected-answer' class from all option buttons
    let options = document.getElementById("options-container").getElementsByTagName("button");
    for (let option of options) {
        option.classList.remove("selected-answer");
    }

    // Add the 'selected-answer' class to the clicked button
    event.target.classList.add("selected-answer");
}

function confirmAnswer() {
    clearInterval(timer);

    let currentQuestion = questions[currentQuestionIndex];
    let feedback = document.getElementById("answer-feedback");

    let isCorrect = false;
    if (selectedAnswer === currentQuestion.answer) {
        score++;
        feedback.innerHTML = "<span style='color:green;'>Correct!</span><br>" + currentQuestion.explanation;
        isCorrect = true;
    } else {
        feedback.innerHTML = "<span style='color:red;'>Incorrect.</span> The correct answer is <strong>" + currentQuestion.answer + "</strong>.<br>" + currentQuestion.explanation;
    }

    // Store the attempted question data
    attemptedQuestions.push({
        question: currentQuestion.question,
        selectedOption: selectedAnswer,
        correctAnswer: currentQuestion.answer,
        explanation: currentQuestion.explanation,
        isCorrect: isCorrect
    });

    document.getElementById("answer-modal").style.display = "block";
    document.getElementById("next-btn").style.display = "block";
}

function closeAnswerModal() {
    document.getElementById("answer-modal").style.display = "none";
    nextQuestion(); // Call nextQuestion when the modal is closed
}

function nextQuestion() {
    currentQuestionIndex++;
    loadQuestion();
}

// The rest of the code remains unchanged...

function showSummary() {
    const summaryContainer = document.getElementById('summary-results');
    summaryContainer.innerHTML = ''; // Clear previous content

    attemptedQuestions.forEach((attempt, index) => {
        const questionElement = document.createElement('div');
        questionElement.classList.add('summary-question');

        if (attempt.isCorrect) {
            questionElement.classList.add('correct');
        } else {
            questionElement.classList.add('incorrect');
        }

        const questionText = document.createElement('p');
        questionText.innerHTML = `<strong>Question ${index + 1}:</strong> ${attempt.question}`;
        questionElement.appendChild(questionText);

        const selectedAnswerText = document.createElement('p');
        selectedAnswerText.innerHTML = `<strong>Your Answer:</strong> ${attempt.selectedOption}`;
        questionElement.appendChild(selectedAnswerText);

        const correctAnswerText = document.createElement('p');
        correctAnswerText.innerHTML = `<strong>Correct Answer:</strong> ${attempt.correctAnswer}`;
        questionElement.appendChild(correctAnswerText);

        const explanationText = document.createElement('p');
        explanationText.classList.add('explanation');
        explanationText.innerHTML = `<strong>Explanation:</strong> ${attempt.explanation}`;
        questionElement.appendChild(explanationText);

        summaryContainer.appendChild(questionElement);
    });
}

function showReview() {
    document.getElementById("exam-container").style.display = "none";
    document.getElementById("review-container").style.display = "block";
    document.getElementById("final-score").innerText = score;

    // Show the summary of results
    showSummary();
}

function returnToDashboard() {
    location.reload();
}

// Function to initialize and start the exam session
function startExamSession() {
    // Initialize exam session variables and UI elements here
    // Example: Load the first question, start the timer, etc.
}

// Auto-load Dashboard if user is logged in
window.onload = function () {
    if (localStorage.getItem("userDetails")) {
        loadDashboard();
    }
};
