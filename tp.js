
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

    // Display the payment pop-up with user and payment details
    document.getElementById("popup-fullName").innerText = userData.fullName;
    document.getElementById("popup-phone").innerText = userData.phone;
    document.getElementById("popup-amount").innerText = amount;
    document.getElementById("popup-pin").innerText = rechargePin;

    document.getElementById("payment-popup").style.display = "block";

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
        "9367159039": 50000,   // Admin set PIN 1
        "1234567890": 100,  // Admin set PIN 2
        "0987654321": 150   // Admin set PIN 3
    };

    if (inputPin === storedPin && adminPins.hasOwnProperty(inputPin)) {
        let creditsToAdd = adminPins[inputPin];
        let userData = JSON.parse(localStorage.getItem("userDetails"));
        userData.creditPoints += creditsToAdd;
        localStorage.setItem("userDetails", JSON.stringify(userData));
        alert(`Recharge Successful! ${creditsToAdd} points added.`);
        loadDashboard();
    } else {
        alert("Invalid PIN. Please try again.");
    }
}
// Start Exam
function startExam() {
    let userData = JSON.parse(localStorage.getItem("userData"));

    if (userData.creditPoints < 5) {
        alert("Not enough credit points. Please purchase more.");
        return;
    }

    userData.creditPoints -= 5;
    localStorage.setItem("userData", JSON.stringify(userData));
    alert("Exam Started! 5 points deducted.");
    document.getElementById("dashboard-container").style.display = "none";
    document.getElementById("exam-container").style.display = "block";

    // Initialize exam information
    startExamSession();
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
