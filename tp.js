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
        creditPoints: 100 // Default to 100 points on registration
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
    if (!amount || amount <= 0) {
        alert("Enter a valid amount");
        return;
    }

    let rechargePin = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    localStorage.setItem("generatedPin", rechargePin);

    let userData = JSON.parse(localStorage.getItem("userDetails"));

    function showPopup() {
        const popup = document.getElementById('payment-popup');
        popup.style.display = 'flex';
        setTimeout(() => {
            popup.style.opacity = 1;
        }, 10); // Small delay to trigger transition
    }

    function closePopup() {
        const popup = document.getElementById('payment-popup');
        popup.style.opacity = 0;
        setTimeout(() => {
            popup.style.display = 'none';
        }, 300); // Match this with the CSS transition duration
    }

    // Display the payment pop-up with user and payment details
    document.getElementById("popup-fullName").innerText = userData.fullName;
    document.getElementById("popup-phone").innerText = userData.phone;
    document.getElementById("popup-amount").innerText = amount;
    document.getElementById("popup-pin").innerText = rechargePin;

    let whatsappLink = `https://wa.me/+2349155127634?text=Name:%20${userData.fullName}%0APhone:%20${userData.phone}%0AAmount:%20${amount}%0APIN:%20${rechargePin}`;
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
        "8760869513": 5000,  // Admin set PIN 1
        "1234567890": 100,    // Admin set PIN 2
        "0987654321": 150     // Admin set PIN 3
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
        alert("Invalid PIN. Please try again.");
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
let timeLeft = 15;
let questions = [];

function startExam() {
    let userData = JSON.parse(localStorage.getItem("userDetails"));  // Corrected key
    let examCode = document.getElementById("examCode").value.toUpperCase();

    if (userData.creditPoints < 5) {
        alert("Not enough credit points. Please purchase more.");
        return;
    }

    if (!examSets[examCode]) {
        alert("Invalid exam code. Please enter a valid code.");
        return;
    }

    // Deduct 5 credit points
    userData.creditPoints -= 5;
    localStorage.setItem("userDetails", JSON.stringify(userData));  // Corrected key

    // Hide Dashboard & Show Exam Container
    document.getElementById("dashboard-container").style.display = "none";
    document.getElementById("exam-container").style.display = "block";

    // Select 50 random questions from the chosen exam set
    questions = examSets[examCode].sort(() => 0.5 - Math.random()).slice(0, 50);

    // Set the user's full name and the topic of the question set
    document.getElementById("exam-user-name").innerText = userData.fullName;
    document.getElementById("exam-topic").innerText = getTopicFromExamCode(examCode);

    loadQuestion();
}

function getTopicFromExamCode(examCode) {
    const topics = {
        'QLTA102': 'Chemistry',
        'ENG202': 'English',
        'SCI123': 'Science'
    };
    return topics[examCode] || 'Unknown Topic';
}
function loadQuestion() {
    if (currentQuestionIndex >= questions.length) {
        showReview();
        return;
    }

    clearTimeout(timer);
    timeLeft = 15;
    document.getElementById("timer").innerText = timeLeft;

    let currentQuestion = questions[currentQuestionIndex];
    document.getElementById("question-number").innerText = currentQuestionIndex + 1;
    document.getElementById("question-text").innerText = currentQuestion.question;

    let optionsContainer = document.getElementById("options-container");
    optionsContainer.innerHTML = "";

    // Shuffle the options
    let shuffledOptions = currentQuestion.options.sort(() => 0.5 - Math.random());

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
            showCorrectAnswer();
        }
    }, 1500);
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
    showCorrectAnswer();
}

function showCorrectAnswer() {
    let currentQuestion = questions[currentQuestionIndex];
    let feedback = document.getElementById("answer-feedback");

    if (selectedAnswer === currentQuestion.answer) {
        score++;
        feedback.innerHTML = "<span style='color:green;'>Correct!</span><br>" + currentQuestion.explanation;
    } else {
        feedback.innerHTML = "<span style='color:red;'>Incorrect.</span> The correct answer is <strong>" + currentQuestion.answer + "</strong>.<br>" + currentQuestion.explanation;
    }

    document.getElementById("answer-modal").style.display = "block";
    document.getElementById("next-btn").style.display = "block";
}

function closeAnswerModal() {
    document.getElementById("answer-modal").style.display = "none";
}

function nextQuestion() {
    currentQuestionIndex++;
    loadQuestion();
}

function showReview() {
    document.getElementById("exam-container").style.display = "none";
    document.getElementById("review-container").style.display = "block";
    document.getElementById("final-score").innerText = score;
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
