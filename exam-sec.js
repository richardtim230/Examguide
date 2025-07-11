// Function to display session details
function displaySessionDetails(session) {
  const historyContent = document.getElementById('exam-history-content');
  historyContent.innerHTML = ''; // Clear current content

  if (!session.questions || session.questions.length === 0) {
    historyContent.innerHTML = '<p>No questions available for this session.</p>';
    return;
  }

  session.questions.forEach((question, qIndex) => {
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('question');

    // Display question text
    const questionText = document.createElement('p');
    questionText.innerHTML = `<strong>Q${qIndex + 1}:</strong> ${question.text}`;
    questionDiv.appendChild(questionText);

    // Create list for options
    const optionsList = document.createElement('ul');

    // Loop through options
    question.options.forEach((option, index) => {
      const optionItem = document.createElement('li');
      optionItem.textContent = option;

      // User's answer
      if (session.answers[qIndex] === index) {
        optionItem.classList.add('user-answer');
      }

      // Correct answer
      if (index === question.correct) {
        optionItem.classList.add('correct-answer');
      }

      optionsList.appendChild(optionItem);
    });

    questionDiv.appendChild(optionsList);

    // Display explanation
    const explanationText = document.createElement('p');
    explanationText.innerHTML = `<strong>Explanation:</strong> ${question.explanation || 'No explanation available'}`;
    questionDiv.appendChild(explanationText);

    historyContent.appendChild(questionDiv);
  });

  // Add "Back to History" button
  const backButton = document.createElement('button');
  backButton.textContent = 'Back to History';
  backButton.addEventListener('click', displayExamHistory);
  historyContent.appendChild(backButton);
                             }

// Use debounce to limit frequent state updates
function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

// Tour Data

const tourSteps = [

  {

    title: "Welcome to Students Support System Exam Section",

    description: "Get started with our intuitive dashboard and tools.",

    image: "logo.png"

  },

  {

    title: "Homepage and Department Selection",

    description: "This is where you select the course you want to practice questions from, either chemistry,physics, biology and others. It doesn't necessarily indicate the department you belong to but the department rendering the course you want to take.",

    image: "deo1.jpg"

  },

  {

    title: "Course Management",

    description: "This is where you indicate the exact course you want to practice. All you have to do is input the course code which is the access code. Take for instance you selected or clicked on -Botany- at the home page, the access code for introductory botany one is 'BOT101'. Take note that it's capitalized with no space otherwise it won't work.",

    image: "accesp.jpg"

  },

  {

    title: "Exam and Summary Section",

    description: "You can now practice your select departmental course and also preview corrections with explanations.",

    image: "examsec.jpg"

  }

];

let currentStep = 0;

// DOM Elements

const tourTitle = document.getElementById('tour-title');

const tourDescription = document.getElementById('tour-description');

const tourImage = document.getElementById('tour-image');

const prevBtn = document.getElementById('prev-btn');

const nextBtn = document.getElementById('next-btn');

const closeBtn = document.getElementById('close-btn');

const overlay = document.getElementById('tour-overlay');

// Initialize Tour

function showStep(step) {

  const { title, description, image } = tourSteps[step];

  tourTitle.innerText = title;

  tourDescription.innerText = description;

  tourImage.src = image;

  // Toggle Button Visibility

  prevBtn.style.display = step === 0 ? 'none' : 'inline-block';

  nextBtn.style.display = step === tourSteps.length - 1 ? 'none' : 'inline-block';

}

// Event Listeners

nextBtn.addEventListener('click', () => {

  if (currentStep < tourSteps.length - 1) {

    currentStep++;

    showStep(currentStep);

  }

});

prevBtn.addEventListener('click', () => {

  if (currentStep > 0) {

    currentStep--;

    showStep(currentStep);

  }

});

closeBtn.addEventListener('click', () => {

  overlay.style.display = 'none';

  document.body.style.overflow = 'auto';

});

// Start Tour

showStep(currentStep);



window.addEventListener('load', () => {
  // Show the first notification on page load
  const notification1 = document.getElementById('notification1');
  document.body.classList.add('modal-active'); // Prevent scrolling
  notification1.classList.remove('hidden');

  // Schedule the second notification for 12:00 PM
  const targetTime = new Date();
  targetTime.setHours(12, 0, 0, 0); // Set to 12:00 PM

  const now = new Date();

  if (now >= targetTime) {
    // If it's already 12:00 PM or later, show the second notification immediately
    showNotification('notification2');
  } else {
    // Calculate the delay until 12:00 PM
    const delay = targetTime - now;
    setTimeout(() => {
      showNotification('notification2');
    }, delay);
  }
});

function showNotification(notificationId) {
  const notification = document.getElementById(notificationId);
  document.body.classList.add('modal-active'); // Prevent scrolling
  notification.classList.remove('hidden');
}

function dismissNotification(notificationId) {
  const notification = document.getElementById(notificationId);
  document.body.classList.remove('modal-active'); // Re-enable scrolling
  notification.classList.add('hidden');
}


// Add a new state when the page loads
window.onload = function() {
    history.pushState(null, '', window.location.href);
};

// Listen for the back button event
window.onpopstate = function(event) {
    // Show a confirmation dialog
    if (confirm("Are you sure you want to go back?")) {
        // Allow navigation
        history.back();
    } else {
        // Prevent navigation by pushing the state back
        history.pushState(null, '', window.location.href);
    }
};
const overlay = document.getElementById("overlay");
  const loginBox = document.getElementById("login-box");
  const registerBox = document.getElementById("register-box");
  const welcomePopup = document.getElementById("welcome-popup");
  const app = document.getElementById("homepage");

  const loginBtn = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");
  const backToLoginBtn = document.getElementById("back-to-login");
  const submitRegisterBtn = document.getElementById("submit-register");
  const continueBtn = document.getElementById("continue-btn");

  const userIdInput = document.getElementById("user-id");
  const fullNameInput = document.getElementById("full-name");
  const departmentInput = document.getElementById("department");
  const levelInput = document.getElementById("level");
  const coursesInput = document.getElementById("courses");
  const photoUpload = document.getElementById("photo-upload");
  const agreeCheckbox = document.getElementById("agree-checkbox");

  const studentDetailsElement = document.getElementById("student-details");
  const profilePhoto = document.getElementById("profile-photo");
  const welcomeMessage = document.getElementById("welcome-message");

  const activeUserIDs = ["ZAT61G", "OAU-gn5H1", "OAU-GBXbW", "OAU-pPtXA", "OAU-8zM0P", "OAU-Cts4O", "OAU-P5nJv", "C9OJNB", "OAU-iM1rP", "YO638H", "OAU-QuKF7", "OAU-eElXp", "OAU-D7QPC", "OAU-vs1He", "OAU-GM7jE", "OAU-nTs6h", "OAU-4iDRs", "OAU-Hx08e", "OAU-giRIJ", "380PSM", "6YF1OG", "NI59IE", "V5KAMW", "ENOKAF", "O34U90", "C4BVOZ", "QM39NB", "KEEWPP", "VJJ6DP", "NJ5PKC", "43V107", "DNV83T", "QJ8RJZ", "VUA6KK", "2ZDGJM", "QQTIRS","537G6R", "WFX1S9", "77EOLI", "59UD2L", "2WN6FP", "CEIJ7E", "3IV4RI", "BSIZTQ", "K3RBVK", "XR0QEV", "J2DTAN", "ZKWN3U", "9UR3N6", "KNNP24", "3XHF8Z", "R7F0YO", "GIY77W", "FB32H6", "X64SH5"]; // Admin-activated user IDs
  const morningMessages = ["Good morning", "Rise and shine", "Hello! How was your night?", 
    "Good morning!",
    "Rise and shine!",
    "Hello! How was your night?",
    "Good morning, sunshine!",
    "Wishing you a bright and productive day!",
    "Good morning! May your coffee be strong and your Monday be short.",
    "Good morning! Let's make today amazing!",
    "Good morning! Embrace the day with a smile!",
    "Have a wonderful morning!",
    "Good morning! May your day be filled with joy and success.",
    "Good morning! Wishing you a day filled with happiness and laughter.",
    "Hello beautiful! Have a great day!",
    "Good morning!  May your day be as radiant as you are.",
    "Good morning! Time to seize the day!",
    "Good morning!  Hoping you have a fantastic start to your day.",
    "Good morning!  May your day be filled with opportunities.",
    "Good morning!  Let's make some memories today!",
    "Good morning!  May all your dreams come true today.",
    "Good morning!  Sending you positive vibes for a wonderful day!",
    "Good morning!  May your day be filled with peace and serenity.",
    "Good morning!  May your day be filled with love and kindness.",
    "Good morning!  I hope you have a productive and successful day.",
    "Good morning!  May your day be filled with fun and adventure!",
    "Good morning!  May your day be better than yesterday.",
    "Good morning!  Don't forget to breathe and be mindful today.",
    "Good morning!  Stay hydrated and energized!",
    "Good morning!  Believe in yourself and your abilities today.",
    "Good morning! May your day be filled with inspiration and creativity.",
    "Good morning!  Remember to take some time for yourself today.",
    "Good morning!  I hope this message brightens your day!"];
  const afternoonMessages = ["Good afternoon", "Hope you're having a productive day!", "Keep shining!", 
    "Hope you're having a productive day!",
    "Let me know if you need anything.",
    "Just checking in to see how things are going.",
    "Thinking of you and hoping your workday is going smoothly.",
    "Great work on studies! Keep it up!",
    "Let's schedule a quick chat later today to discuss anything - Prof Richard.",
    "I've got new questions for you to practice! 😊.",
    "Making progress on that course?",
    "How's that deadline looking?",
    "Anything I can assist with today?",
    "Need a hand with anything?",
    "Let's brainstorm solutions for CHM101.",
    "Keep up the amazing work!",
    "Remember to take short breaks throughout the day.",
    "Stay focused and determined!",
    "Don't forget to hydrate and refuel!",
    "Almost through the week - keep going!",
    "What are your priorities for the rest of the day?",
    "Is there anything blocking your progress?",
    "Checking in – how's the workload?",
    "Any updates on CHM101?",
    "Remember to prioritize your tasks.",
    "Time for a quick team huddle?",
    "What's your plan of action for the afternoon?",
    "Let's touch base at [time] to review [topic].",
    "Any questions I can answer?",
    "How's your energy level?",
    "Remember to take a proper lunch break!",
    "Wishing you a productive afternoon!",
    "It's almost time to go home; hang in there!"
];
  const eveningMessages = ["Good evening", "Hope your day was great!", "Relax, you did well today!", 
    "Good evening!",
    "Good night! Sleep tight!",
    "Sweet dreams!",
    "Have a restful night!",
    "Good night! May your sleep be peaceful and your dreams be sweet.",
    "Sleep well, and have a wonderful tomorrow.",
    "Good night! Rest up for a productive day ahead.",
    "Hoping you have a relaxing evening.",
    "Enjoy your evening!",
    "Wishing you a peaceful and quiet night.",
    "Time to unwind and relax.",
    "May your evening be filled with joy and comfort.",
    "Good night!  May your sleep be deep and restorative.",
    "Wishing you a pleasant evening and a good night's rest.",
    "Take some time to de-stress before bed.",
    "Good night!  May tomorrow bring new opportunities.",
    "Sweet dreams and a happy tomorrow!",
    "Enjoy the quiet of the evening.",
    "Have a wonderful evening, filled with happiness.",
    "May your evening be filled with things you love.",
    "Good night!  May your sleep be sound and refreshing.",
    "Time to disconnect and recharge.",
    "Hoping your evening is filled with relaxation and joy.",
    "Good night!  Sending positive thoughts for a great night's sleep.",
    "May your dreams be filled with wonder and excitement.",
    "Enjoy a well-deserved rest.",
    "Good night and sleep well!",
    "Wishing you a calming and peaceful night.",
    "Time to reflect on the day and prepare for tomorrow.",
    "Goodnight!  May your sleep be as peaceful as the night sky."
];

  // Utility Function to Generate Alphanumeric User ID
function generateUserID() {
  const prefix = 'OAU-';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomPart = '';

  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomPart += characters[randomIndex];
  }

  return prefix + randomPart;
}

// Example usage
console.log(generateUserID()); // Example Output: OAU-A1b2C


  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return morningMessages[Math.floor(Math.random() * morningMessages.length)];
    if (hour < 18) return afternoonMessages[Math.floor(Math.random() * afternoonMessages.length)];
    return eveningMessages[Math.floor(Math.random() * eveningMessages.length)];
    }


// Check and Display User Data on Load
window.addEventListener("DOMContentLoaded", () => {
  const savedUserData = JSON.parse(localStorage.getItem("userData"));
  
  if (savedUserData) {
    document.getElementById("paymentFullName").innerText = savedUserData.fullName;
    document.getElementById("paymentDepartment").innerText = savedUserData.department;
    document.getElementById("paymentLevel").innerText = savedUserData.level;
    document.getElementById("paymentUserID").innerText = savedUserData.userID;
  }
});




// Submit Registration and Save User Data
submitRegisterBtn.addEventListener("click", () => {
  if (
    !fullNameInput.value ||
    !departmentInput.value ||
    !levelInput.value ||
    !coursesInput.value ||
    !photoUpload.files.length
  ) {
    alert("Please fill all fields and upload your photo.");
    return;
  }

  if (!agreeCheckbox.checked) {
    alert("You must agree to proceed.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    // Generate a unique User ID
    const userID = generateUserID();
    
    const userData = {
      userID,
      fullName: fullNameInput.value,
      department: departmentInput.value,
      level: levelInput.value,
      courses: coursesInput.value,
      photo: reader.result,
    };

    // Save user data securely to localStorage
    localStorage.setItem("userData", JSON.stringify(userData));

    // Display User Details on Payment Page
    document.getElementById("paymentFullName").innerText = userData.fullName;
    document.getElementById("paymentDepartment").innerText = userData.department;
    document.getElementById("paymentLevel").innerText = userData.level;
    document.getElementById("paymentUserID").innerText = userData.userID;

    registerBox.classList.add("hidden");
    paymentPage.classList.remove("hidden");

    alert(`Registration Successful! Your User ID is: ${userID}`);
  };

  reader.readAsDataURL(photoUpload.files[0]);
});

// Utility Function to Generate User ID
function generateUserID() {
  const prefix = 'OAU-';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomPart = '';

  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomPart += characters[randomIndex];
  }

  return prefix + randomPart;
}


window.addEventListener("beforeunload", () => {
  const userData = JSON.parse(localStorage.getItem("userData"));
  if (userData) {
    localStorage.setItem("userData", JSON.stringify(userData));
  }
});

// Login Validation Logic
loginBtn.addEventListener("click", () => {
  const userId = userIdInput.value.trim();
  const storedUserData = JSON.parse(localStorage.getItem("userData"));

  if (!storedUserData) {
    alert("No user data found. Please register first.");
    return;
  }

  if (storedUserData.userID === userId) {
    if (activeUserIDs.includes(userId)) {
      // Valid User ID found in the active list
      profilePhoto.src = storedUserData.photo || "default.png";
      studentDetailsElement.innerHTML = `
        Full Name: ${storedUserData.fullName}<br>
        Department: ${storedUserData.department}<br>
        Level: ${storedUserData.level}<br>
        Courses: ${storedUserData.courses}
      `;
      welcomeMessage.textContent = getGreeting();
      loginBox.classList.add("hidden");
      welcomePopup.classList.remove("hidden");

      // Generate Receipt if not already done
      if (!localStorage.getItem("receiptGenerated")) {
        generateAndDownloadReceipt(storedUserData);
        localStorage.setItem("receiptGenerated", "true");
      }
    } else {
      // User ID is valid but not yet active
      alert("Your account is not active. Please contact admin via WhatsApp.");
      window.open(
        `https://wa.me/2349155127634?text=${encodeURIComponent(
          `I just completed my registration and my User ID is ${userId}. I am here to activate my account.`
        )}`,
        "_blank"
      );
    }
  } else {
    alert("Invalid User ID. Please check and try again.");
  }
});



function generateAndDownloadReceipt(userData) {
  const receiptCanvas = document.createElement("canvas");
  const ctx = receiptCanvas.getContext("2d");

  // Set canvas size
  receiptCanvas.width = 500;
  receiptCanvas.height = 700;

  const { fullName, userID, department, level } = userData;
  const subscription = "Students Support System";
  const amountPaid = "₦2000";
  const validUntil = "12/31/2025";
  const director = "Richard O. Timothy";

  // Draw receipt
  // Background and gradient header
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, receiptCanvas.width, receiptCanvas.height);

  const gradient = ctx.createLinearGradient(0, 0, receiptCanvas.width, 0);
  gradient.addColorStop(0, "#007BFF");
  gradient.addColorStop(1, "#80deea");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, receiptCanvas.width, 100);

  // Header Text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px 'Segoe UI'";
  ctx.textAlign = "center";
  ctx.fillText("STUDENTS SUPPORT SYSTEM", receiptCanvas.width / 2, 50);

  ctx.font = "16px 'Segoe UI'";
  ctx.fillText("Obafemi Awolowo University", receiptCanvas.width / 2, 80);

  // Divider Line
  ctx.beginPath();
  ctx.moveTo(20, 140);
  ctx.lineTo(receiptCanvas.width - 20, 140);
  ctx.strokeStyle = "#ddd";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // User Information
  ctx.fillStyle = "#333333";
  ctx.font = "18px 'Segoe UI'";
  ctx.textAlign = "left";
  const padding = 20;

  ctx.fillText("Name:", padding, 180);
  ctx.fillText(fullName, padding + 120, 180);

  ctx.fillText("User ID:", padding, 220);
  ctx.fillText(userID, padding + 120, 220);

  ctx.fillText("Department:", padding, 260);
  ctx.fillText(department, padding + 120, 260);

  ctx.fillText("Level:", padding, 300);
  ctx.fillText(level, padding + 120, 300);

  ctx.fillText("Subscription:", padding, 340);
  ctx.fillText(subscription, padding + 120, 340);

  ctx.fillText("Amount Paid:", padding, 380);
  ctx.fillText(amountPaid, padding + 120, 380);

  ctx.fillText("Valid Until:", padding, 420);
  ctx.fillText(validUntil, padding + 120, 420);

  // Footer
  ctx.font = "16px 'Segoe UI'";
  const now = new Date();
  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString();

  ctx.fillText(`Generated On: ${date} at ${time}`, padding, 460);

  ctx.font = "italic 16px 'Segoe UI'";
  ctx.fillText("Esigned by:", padding, 500);

  ctx.font = "bold 18px 'Segoe UI'";
  ctx.fillText(director, padding + 120, 500);

  // Esigned Stamp
  ctx.fillStyle = "rgba(0, 123, 255, 0.2)";
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.rotate(-Math.PI / 12);
  ctx.fillText("Esigned", receiptCanvas.width / 2 - 140, 600);
  ctx.rotate(Math.PI / 12);

  // Automatically download the receipt
  receiptCanvas.toBlob((blob) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "receipt.png";
    link.click();
  });
}



// Payment Page Elements
const paymentPage = document.getElementById("paymentPage");
const submitReceiptBtn = document.getElementById("submit-receipt-btn");
const generateInvoiceBtn = document.getElementById("generate-invoice-btn");
const backToLoginPaymentBtn = document.getElementById("back-to-login-payment");
const receiptUpload = document.getElementById("receipt-upload");

// 🎯 Event Listeners

// ➡️ Navigate to Registration Page
registerBtn.addEventListener("click", () => {
  loginBox.classList.add("hidden");
  registerBox.classList.remove("hidden");
});

// ➡️ Back to Login from Registration Page
backToLoginBtn.addEventListener("click", () => {
  registerBox.classList.add("hidden");
  loginBox.classList.remove("hidden");
});

  
// Ensure activeUserIDs exists in localStorage
if (!localStorage.getItem("activeUserIDs")) {
  localStorage.setItem("activeUserIDs", JSON.stringify([]));
}

// ➡️ Generate Invoice as an Image
generateInvoiceBtn.addEventListener("click", () => {
  const userData = JSON.parse(localStorage.getItem("userData"));
  
  // Create an off-screen canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = 650;
  canvas.height = 600;

 // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);


  // Header
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(0, 0, canvas.width, 80);
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Arial';
  ctx.fillText('STUDENTS SUPPORT SYSTEM', 20, 50);

  // University Name
  ctx.fillStyle = '#2C3E50';
  ctx.font = '20px italic Arial';
  ctx.fillText('Obafemi Awolowo University', 20, 120);

  // Payment Info
  ctx.font = '18px Arial';
  ctx.fillText('Payment of User ID Activation Fee for the 2023/2024 Academic Session', 20, 160);

  ctx.fillStyle = '#555';
  ctx.font = '16px Arial';
  ctx.fillText(`Full Name: ${userData.fullName}`, 20, 200);
  ctx.fillText(`Department: ${userData.department}`, 20, 240);
  ctx.fillText(`Level: ${userData.level}`, 20, 280);
  ctx.fillText(`User ID: ${userData.userID}`, 20, 320);
  ctx.fillText(`Amount: N2000.00`, 20, 360);

  // Bank Details
  ctx.fillStyle = '#4CAF50';
  ctx.font = '18px Arial';
  ctx.fillText('Payment Details:', 20, 400);
  ctx.fillStyle = '#555';
  ctx.font = '16px Arial';
  ctx.fillText('Bank Name: Opay Microfinance Bank', 40, 440);
  ctx.fillText('Account Number: 6112744499', 40, 480);
  ctx.fillText('Account Name: OCHUKO TIMOTHY RICHARD', 40, 520);

  // Save as Image
  const image = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = image;
  link.download = `Invoice_${userData.userID}.png`;
  link.click();

  alert('Invoice has been generated and downloaded as an image.');
});

// ➡️ Submit Receipt and Redirect to WhatsApp
submitReceiptBtn.addEventListener("click", () => {
  const receiptFile = receiptUpload.files[0];
  const userData = JSON.parse(localStorage.getItem("userData"));
  
  const whatsappMessage = `
    Payment Submission Details:
    - Full Name: ${userData.fullName}
    - Department: ${userData.department}
    - Level: ${userData.level}
    - User ID: ${userData.userID}
    - Amount Paid: N1500.00
    
    📌 *Please attach the receipt image alongside this message.*
  `;

  window.open(
    `https://wa.me/2349155127634?text=${encodeURIComponent(whatsappMessage)}`,
    "_blank"
  );

  alert("Redirecting to admin on WhatsApp. Please ensure your receipt is attached.");
});

// ➡️ Back to Login from Payment Page
backToLoginPaymentBtn.addEventListener("click", () => {
  paymentPage.classList.add("hidden");
  loginBox.classList.remove("hidden");
  alert("You have been redirected back to the login page.");
});




  continueBtn.addEventListener("click", () => {
    // Hide overlay and show the main application
    overlay.style.display = "none"; // Completely hide the overlay
    app.style.display = "block"; // Display the main app content
    app.style.body.overflow = 'auto';
  });
  
    // Expiry Logic
  const expiryDays = 365;
  const currentDate = new Date();
  const savedDate = localStorage.getItem("loginDate");

  if (savedDate && (currentDate - new Date(savedDate)) / (1000 * 60 * 60 * 24) > expiryDays) {
    alert("Your ID has expired.");
  } else {
    localStorage.setItem("loginDate", currentDate);
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
  const questionImage = document.getElementById("question-image");
  let questions = [];
  let currentQuestionIndex = 0;
  let answers = [];
  let timerInterval = null;
  let timeRemaining = 3000; // Timer in seconds
  let selectedCourse = "";
  let subCourseName = "";
                          
document.addEventListener("DOMContentLoaded", () => {
  // Fetch question sets from JSON file
  fetch('exam-ques.json')
    .then(response => response.json())
    .then(data => {
      // Store the question sets in a global variable
      window.questionBanks = data;
    })
    .catch(error => console.error('Error fetching question sets:', error));

    
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
    const courseData = window.questionBanks[selectedCourse]?.[code];

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
  let answers = [];
  currentQuestionIndex = 0;
  subCourseName = "";
  timeRemaining = 3000;
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
  
  // Handle the question image
  if (question.image) {
    questionImage.src = question.image;
    questionImage.alt = "Question Image";
    questionImage.classList.remove("hidden");
  } else {
    questionImage.src = "";
    questionImage.alt = "";
    questionImage.classList.add("hidden");
  }

  // Clear previous options
  optionsContainer.innerHTML = "";

  // Display options as buttons
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


// Save Answer

function saveAnswer() {

  const selected = document.querySelector('input[name="answer"]:checked');

  if (selected) {

    answers[currentQuestionIndex] = parseInt(selected.value);

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
      endExam(true); // Pass a flag to force submission
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  document.getElementById("timer-display").textContent = `Time Remaining: ${minutes}:${seconds.toString().padStart(2, "0")}`;
}
function endExam(autoSubmit = false) {
  if (!autoSubmit) {
    // Show the confirmation modal
    const modal = document.getElementById("confirmationModal");
    modal.style.display = "flex";

    // Handle "Yes" button
    document.getElementById("confirmYes").onclick = function () {
      modal.style.display = "none";
      clearInterval(timerInterval); // Stop the timer
      console.log("Exam submitted!");
      // Add your submission logic here
      finalizeSubmission();
    };

    // Handle "No" button
    document.getElementById("confirmNo").onclick = function () {
      modal.style.display = "none";
      console.log("Submission canceled");
      // Ensure the timer continues running
      if (!autoSubmit) {
        startTimer(); // Restart the timer if it was stopped
      }
    };

    return; // Prevent further execution until the user confirms
  }

  // Auto-submit (e.g., when time runs out)
  clearInterval(timerInterval);
  console.log("Time's up! Auto-submitting exam...");
  finalizeSubmission();
}


function finalizeSubmission() {
    if (!answers || !questions) {
        console.error("Exam data is missing.");
        return;
    }

    const score = answers.filter((ans, i) => ans === questions[i].correct).length;
    const totalQuestions = questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    // Load existing rewards safely
    let userRewards;
    try {
        userRewards = JSON.parse(localStorage.getItem("userRewards")) || {
            timeSpent: 0, timeBonus: 0, examScore: 0, examBonus: 0, totalReward: 0  
        };
    } catch (error) {
        console.error("Error loading user rewards:", error);
        userRewards = { timeSpent: 0, timeBonus: 0, examScore: 0, examBonus: 0, totalReward: 0 };
    }

    // Update Exam Statistics
    userRewards.examScore += score;  // Add this exam's correct answers
    const previousBonus = userRewards.examBonus;
    
    // Award ₦1 per correct answer
    userRewards.examBonus += score * 1;
    
    userRewards.totalReward = userRewards.timeBonus + userRewards.examBonus;

    // Check if new bonus was earned
    const newBonus = userRewards.examBonus - previousBonus;
    if (newBonus > 0) {
        showAnimatedPopup(`🎉 You earned ₦${newBonus} from your exam performance!`);
    }

    // Save updated rewards
    localStorage.setItem("userRewards", JSON.stringify(userRewards));

    // Store exam session history
    const examSession = {
        date: new Date().toLocaleString(),
        questions: questions.map(q => ({
            text: q.text,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation
        })),
        answers: answers, 
        score: score,
        totalQuestions: totalQuestions,
        percentage: percentage
    };

    try {
        const examHistory = JSON.parse(localStorage.getItem("examHistory")) || [];
        examHistory.push(examSession);
        localStorage.setItem("examHistory", JSON.stringify(examHistory));
    } catch (error) {
        console.error("Error saving exam history:", error);
    }

    // Update UI in real-time
    updateRewardUI();
    updateExamResults(score, totalQuestions, percentage);

    console.log("Exam session saved:", examSession);
}

// Update UI Elements
function updateRewardUI() {
    let userRewards = JSON.parse(localStorage.getItem("userRewards")) || {
        timeSpent: 0, timeBonus: 0, examScore: 0, examBonus: 0, totalReward: 0  
    };

    document.getElementById("examBonus").innerText = `₦${userRewards.examBonus}`;
    document.getElementById("timeBonus").innerText = `₦${userRewards.timeBonus}`;
    document.getElementById("totalReward").innerText = `₦${userRewards.totalReward}`;

    // Update progress bar
    document.getElementById("progressFill").style.width = `${Math.min((userRewards.totalReward / 3000) * 100, 100)}%`;
}



function endExam() {
  // Show the modal
  const modal = document.getElementById('confirmationModal');
  modal.style.display = 'flex';

  // Declare variables in outer scope
  let score, totalQuestions, percentage;

  // Handle confirmation buttons
  document.getElementById('confirmYes').onclick = function () {
    modal.style.display = 'none';

    // Calculate results
    score = answers.filter((ans, i) => ans === questions[i].correct).length;
    totalQuestions = questions.length;
    percentage = Math.round((score / totalQuestions) * 100);

    // Save exam history
    const examSession = {
  date: new Date().toLocaleString(),
  questions: questions.map(q => ({
    text: q.text,
    options: q.options,
    correct: q.correct,
    explanation: q.explanation,
  })),
  answers: answers, // User's answers
  score: score,
  totalQuestions: totalQuestions,
  percentage: percentage,
};

const examHistory = JSON.parse(localStorage.getItem('examHistory')) || [];
examHistory.push(examSession);
localStorage.setItem('examHistory', JSON.stringify(examHistory));
console.log("Exam session saved:", examSession);


      
// Show               
    showSection(summarySection);
    summaryContent.innerHTML = `
      <h3>Score: ${score}/${totalQuestions} (${percentage}%)</h3>
      <p>${getRemark(percentage)}</p>
      ${questions
        .map(
          (q, i) => `
        <p>
          ${i + 1}. ${q.text} <br>
          Your Answer: <strong> ${q.options[answers[i]] || "Unanswered"} </strong><br><br>
         <strong> Correct Answer: ${q.options[q.correct]} </strong><br><br>
          Explanation: ${q.explanation} <br><br><br>
        </p>`
        )
        .join("")}
    `;
  };


function displayExamHistory() {
  const examHistory = JSON.parse(localStorage.getItem('examHistory')) || [];
  console.log('Retrieved Exam History:', examHistory);

  const historyContent = document.getElementById('exam-history-content');
  historyContent.innerHTML = ''; // Clear current content

  if (examHistory.length === 0) {
    historyContent.innerHTML = '<p>No exam history available.</p>';
    return;
  }

  examHistory.forEach((session, index) => {
    console.log(`Session ${index + 1}:`, session); // Log the session data
    const sessionDiv = document.createElement('div');
    sessionDiv.classList.add('exam-session');

    const sessionTitle = document.createElement('h3');
    sessionTitle.textContent = `Exam Session ${index + 1} - ${session.date}`;
    sessionTitle.addEventListener('click', () => {
      console.log("Session clicked:", session); // Debug the session object
      displaySessionDetails(session);
    });
    sessionDiv.appendChild(sessionTitle);

    historyContent.appendChild(sessionDiv);
  });
}


function displaySessionDetails(session) {
  console.log("Session details clicked:", session);

  const historyContent = document.getElementById('exam-history-content');
  historyContent.innerHTML = ''; // Clear current content

  // Check if the session contains questions
  if (!session.questions || session.questions.length === 0) {
    console.log("No questions found in session:", session);
    historyContent.innerHTML = '<p>No questions available for this session.</p>';
    return;
  }

  // Loop through each question and display details
  session.questions.forEach((question, qIndex) => {
    console.log(`Question ${qIndex + 1}:`, question);

    const questionDiv = document.createElement('div');
    questionDiv.classList.add('question');

    // Display question text
    const questionText = document.createElement('p');
    questionText.innerHTML = `<strong>Q${qIndex + 1}:</strong> ${question.text}`;
    questionDiv.appendChild(questionText);

    // Display options
    const optionsList = document.createElement('ul');
    question.options.forEach((option, index) => {
      const optionItem = document.createElement('li');
      optionItem.textContent = option;

      // Highlight user's answer and correct answer
      if (session.answers[qIndex] === index) {
        optionItem.style.color = 'blue'; // User's answer
        optionItem.style.fontWeight = 'bold';
      }
      if (index === question.correct) {
        optionItem.style.color = 'green'; // Correct answer
        optionItem.style.fontWeight = 'bold';
      }

      optionsList.appendChild(optionItem);
    });
    questionDiv.appendChild(optionsList);

    // Display explanation
    const explanationText = document.createElement('p');
    explanationText.innerHTML = `<strong>Explanation:</strong> ${question.explanation}`;
    questionDiv.appendChild(explanationText);

    // Append question details to the content
    historyContent.appendChild(questionDiv);
  });

  // Add a "Back to History" button
  const backButton = document.createElement('button');
  backButton.textContent = 'Back to History';
  backButton.addEventListener('click', displayExamHistory);
  backButton.style.marginTop = '20px';
  historyContent.appendChild(backButton);
}


  (function () {
  document.addEventListener("DOMContentLoaded", function () {
    const downloadBtn = document.getElementById("download-btn");

    if (downloadBtn) {
      downloadBtn.addEventListener("click", downloadResultsAsPDF);
    } else {
      console.error("Download button not found.");
    }
  });

    document.getElementById("download-btn").addEventListener("click", () => {
  console.log("Download button clicked!");
  downloadResultsAsPDF();
});

  function downloadResultsAsPDF() {
    const resultContent = document.getElementById("summarySection");

    if (!resultContent) {
      console.error("Summary content is missing. Cannot generate PDF.");
      return;
    }

    const options = {
      margin: 1,
      filename: 'Exam_Results.pdf',
      image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(options).from(resultContent).save();
  }
})();

  document.getElementById('confirmNo').onclick = function () {
    modal.style.display = 'none';
    // Prevent further actions when "No" is clicked
    return;
  };
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



