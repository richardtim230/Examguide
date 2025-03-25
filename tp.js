// User Data Storage
function registerUser() {
    let fullName = document.getElementById("fullName").value;
    let department = document.getElementById("department").value;
    let faculty = document.getElementById("faculty").value;
    let level = document.getElementById("level").value;
    let phone = document.getElementById("phone").value;

    if (!fullName || !department || !faculty || !level || !phone) {
        alert("Please fill in all fields");
        return;
    }

    let userData = { fullName, department, faculty, level, phone, creditPoints: 100 };
    localStorage.setItem("userData", JSON.stringify(userData));

    loadDashboard();
}

// Load Dashboard
function loadDashboard() {
    let userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData) return;

    document.getElementById("auth-container").style.display = "none";
    document.getElementById("dashboard-container").style.display = "block";

    document.getElementById("user-name").innerText = userData.fullName;
    document.getElementById("user-department").innerText = userData.department;
    document.getElementById("user-faculty").innerText = userData.faculty;
    document.getElementById("user-level").innerText = userData.level;
    document.getElementById("user-phone").innerText = userData.phone;
    document.getElementById("credit-points").innerText = userData.creditPoints;
}

// Purchase Credit Points
function purchaseCredits() {
    let amount = document.getElementById("purchaseAmount").value;
    if (!amount || amount <= 0) {
        alert("Enter a valid amount");
        return;
    }

    let rechargePin = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    localStorage.setItem("generatedPin", rechargePin);

    let userData = JSON.parse(localStorage.getItem("userData"));
    let whatsappLink = `https://wa.me/+2349155127634?text=Name:%20${userData.fullName}%0APhone:%20${userData.phone}%0AAmount:%20${amount}%0APIN:%20${rechargePin}`;
    
    alert("Recharge PIN Generated: " + rechargePin);
    window.open(whatsappLink, "_blank");
}

// Redeem Credits
function redeemCredits() {
    let inputPin = document.getElementById("rechargePin").value;
    let storedPin = localStorage.getItem("generatedPin");
    let predefinedPin = "4057210395";  // Admin set PIN

    if (inputPin === storedPin && inputPin === predefinedPin) {
        let userData = JSON.parse(localStorage.getItem("userData"));
        userData.creditPoints += 500;  // Adding 50 credits
        localStorage.setItem("userData", JSON.stringify(userData));
        alert("Recharge Successful! 50 points added.");
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
    loadDashboard();
}

// Auto-load Dashboard if user is logged in
window.onload = function () {
    if (localStorage.getItem("userData")) {
        loadDashboard();
    }
};
