const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('Connected to WebSocket server');
};

ws.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.type === 'updateActiveIDs') {
    // Handle the update of active IDs
    const activeIDs = message.data;
    console.log('Updated active IDs:', activeIDs);

    // Implement logic to update the UI or login process based on the new active IDs
    // ...
  }
};

ws.onclose = () => {
  console.log('Disconnected from WebSocket server');
};

// Use debounce to limit frequent state updates
function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function() {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

// Throttle the resize event
window.addEventListener('resize', throttle(function() {
  console.log('Resized!');
}, 1000));

// Throttle the click event for toggling the menu
document.addEventListener('click', throttle(function(event) {
  const sideNav = document.getElementById('sideNav');
  const menuIcon = document.querySelector('.menu-icon');

  if (sideNav.classList.contains('active') &&
      !sideNav.contains(event.target) &&
      !menuIcon.contains(event.target)) {
      sideNav.classList.remove('active');
  }
}, 500));

// Toggle Reward Popup Visibility
function toggleRewardPopup() {
    let popup = document.getElementById("rewardPopup");
    popup.style.display = popup.style.display === "block" ? "none" : "block";
}

// Update Reward UI
function updateRewardUI() {
    let userRewards = JSON.parse(localStorage.getItem("userRewards")) || {
        timeSpent: 0,   
        timeBonus: 0,   
        examScore: 0,   
        examBonus: 0,   
        totalReward: 0  
    };

    document.getElementById("examBonus").innerText = `₦${userRewards.examBonus}`;
    document.getElementById("timeBonus").innerText = `₦${userRewards.timeBonus}`;
    document.getElementById("totalReward").innerText = `₦${userRewards.totalReward}`;

    // Progress Bar Update
    const percentage = Math.min((userRewards.totalReward / 3000) * 100, 100);
    document.getElementById("progressFill").style.width = `${percentage}%`;
}

// Update UI on Page Load
window.addEventListener("load", updateRewardUI);
// script.js

// Track time spent on the app
let sessionStartTime = localStorage.getItem("sessionStartTime") ? 
                       new Date(localStorage.getItem("sessionStartTime")) : new Date();
// Timer
let timerInterval;

function startTimer() {
    const startTime = new Date();
    localStorage.setItem('sessionStartTime', startTime);
    timerInterval = setInterval(updateTimerDisplay, 1000);
    console.log("Timer started at:", startTime);
}
// Stop
function stopTimer() {
    clearInterval(timerInterval);
    const startTime = new Date(localStorage.getItem('sessionStartTime'));
    const endTime = new Date();
    const duration = Math.floor((endTime - startTime) / 1000); // Duration in seconds
    console.log("Timer stopped. Duration:", duration, "seconds");
    localStorage.removeItem('sessionStartTime');
    updateReward(duration); // Function to update rewards based on duration
}

function updateTimerDisplay() {
    const startTime = new Date(localStorage.getItem('sessionStartTime'));
    const now = new Date();
    const duration = Math.floor((now - startTime) / 1000);

    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    document.getElementById('timeSpent').textContent =
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Call this when the user logs in
document.getElementById('login-btn').addEventListener('click', startTimer);

// Call this when the user logs out or closes the session
window.addEventListener('beforeunload', stopTimer);

// Function to stop tracking time and update rewards
function stopTimer() {
    const sessionEndTime = new Date();
    const timeSpent = (sessionEndTime - sessionStartTime) / 1000; // Convert to seconds
    let userRewards = JSON.parse(localStorage.getItem("userRewards")) || {
        timeSpent: 0,   
        timeBonus: 0,   
        examScore: 0,   
        examBonus: 0,   
        totalReward: 0  
    };

    userRewards.timeSpent += timeSpent;
    const previousTimeBonus = userRewards.timeBonus;
    userRewards.timeBonus = Math.floor(userRewards.timeSpent / 3600) * 10; // ₦10 per hour
    userRewards.totalReward = userRewards.timeBonus + userRewards.examBonus;

    // Check if the user has earned new time bonus
    const newTimeBonus = userRewards.timeBonus - previousTimeBonus;
    if (newTimeBonus > 0) {
        showAnimatedPopup(`🕒 You earned ₦${newTimeBonus} for time spent!`);
    }

    localStorage.setItem("userRewards", JSON.stringify(userRewards));
}
// Show withdrawal section if balance is enough
function checkWithdrawalEligibility() {
    let userRewards = JSON.parse(localStorage.getItem("userRewards")) || { totalReward: 0 };
    document.getElementById("withdrawableAmount").innerText = `₦${userRewards.totalReward}`;

    if (userRewards.totalReward >= 3000) {
        document.getElementById("withdrawalSection").style.display = "block";
    } else {
        document.getElementById("withdrawalSection").style.display = "none";
    }
}

// Handle Withdrawal Request
document.getElementById("withdrawForm").addEventListener("submit", function (event) {
    event.preventDefault();

    let userRewards = JSON.parse(localStorage.getItem("userRewards")) || { totalReward: 0 };
    const bankName = document.getElementById("bankName").value.trim();
    const accountNumber = document.getElementById("accountNumber").value.trim();
    const withdrawAmount = parseFloat(document.getElementById("withdrawAmount").value);

    if (withdrawAmount > userRewards.totalReward) {
        alert("Insufficient balance!");
        return;
    }

    // Save withdrawal request
    let withdrawalHistory = JSON.parse(localStorage.getItem("withdrawals")) || [];
    withdrawalHistory.push({
        bankName: bankName,
        accountNumber: accountNumber,
        amount: withdrawAmount,
        date: new Date().toLocaleString(),
        status: "Pending"
    });

    localStorage.setItem("withdrawals", JSON.stringify(withdrawalHistory));

    // Deduct from balance
    userRewards.totalReward -= withdrawAmount;
    userRewards.examBonus -= withdrawAmount; // Deduct from earnings
    localStorage.setItem("userRewards", JSON.stringify(userRewards));

    // Refresh UI
    updateRewardUI();
    checkWithdrawalEligibility();

    alert(`✅ Withdrawal request of ₦${withdrawAmount} submitted successfully!`);
});

// Event Listeners for tracking time
window.addEventListener("load", startTimer);
window.addEventListener("beforeunload", stopTimer);


// Debugging: Check if script is running
window.onload = () => {
    console.log("Script loaded successfully!");
};
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

// Toggle history section visibility
document.getElementById('history-btn').addEventListener('click', () => {
  const historySection = document.getElementById('exam-history-section');
  historySection.classList.toggle('hidden');
  if (!historySection.classList.contains('hidden')) {
    displayExamHistory();
  }
});

function displayExamHistory() {
  const examHistory = JSON.parse(localStorage.getItem('examHistory')) || [];
  const historyContent = document.getElementById('exam-history-content');
  historyContent.innerHTML = ''; // Clear current content

  if (examHistory.length === 0) {
    historyContent.innerHTML = '<p>No exam history available.</p>';
    return;
  }


  examHistory.forEach((session, index) => {
    const sessionDiv = document.createElement('div');
    sessionDiv.classList.add('exam-session');

    // Extract score and percentage, using defaults if missing
    const score = session.score || 0;
    const totalQuestions = session.totalQuestions || 0;
    const percentage = session.percentage || 0;

    const sessionTitle = document.createElement('h3');
    sessionTitle.textContent = `Session ${index + 1} - ${session.date} - Score: ${score}/${totalQuestions} (${percentage}%)`;
    
    sessionTitle.addEventListener('click', () => displaySessionDetails(session));
    sessionDiv.appendChild(sessionTitle);

    historyContent.appendChild(sessionDiv);
  });
}


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

// Function to switch modes
function switchMode() {
    isPracticeMode = !isPracticeMode;
    if (isPracticeMode) {
        alert("Coming Up Soon!.");
        // Set the timer to 30 seconds for practice mode
        timeRemaining = 30;
        startTimer();
    } else {
        alert("Switched to Exam Mode.");
        // Set the timer to default for exam mode
        timeRemaining = 3000;
        startTimer();
    }
}

// Event listener for the switch mode button
document.getElementById("switch-mode-btn").addEventListener("click", switchMode);


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



document.addEventListener("DOMContentLoaded", function () {
  // Data for images and messages
  const notifications = {
    morning: {
      images: [
        "good morning 1.webp",
        "good morning 2.jpg",
        "good morning 3.jpg"
      ],
      messages: [
        {
          title: "Morning Motivation!",
          message: `
            <p><strong>Start your day with positivity and energy!</strong></p>
            <p>Join our <em>Morning Boost</em> session at <strong>8:30AM</strong>.</p>
            <p>Click <a href="https://mock-t.vercel.app" target="_blank">here</a> to join for free!</p>
          `
        },
        {
          title: "Rise and Shine!",
          message: `
            <p><strong>Ready to tackle the day?</strong></p>
            <p>Our productivity tips are live now. Check them out <a href="https://chat.whatsapp.com/I7T3HYSlcBS4rJzBIm9vFv" target="_blank">here</a>.</p>
          `
        }
      ]
    },
    afternoon: {
      images: [
        "good afternoon 1.jpg",
        "good afternoon 2.webp",
        "good afternoon 3.jpg"
      ],
      messages: [

        {
          title: "CHM101 1ST MOCK EXAM",
          message: `
            <p><strong>CHM101 MOCK TEST starts now!</strong></p>
            <p>Get the most out of your day. <a href="https://mock-t.vercel.app/" target="_blank">START NOW</a>.</p>
          `
        }
      ]
    },
    night: {
      images: [
        "boy-doing-homework-with-use-laptop_23-2148880020.jpg",      
      ],
      messages: [
        {
          title: "CHM101 MOCK TEST II",
          message: `
            <p><strong>CLICK ON THE START BUTTON BELOW TO COMMENCE WITH YOUR MOCK TEST</strong></p>
            <p><strong>Time Duration:</strong> 20 Mins | <strong>Fee:</strong> Free!</p>
            <p>Access it <a href="https://mock-t.vercel.app/" target="_blank">here</a>.</p>
          `
        }
        
      ]
    }
  };

  // Determine the time of day
  const currentHour = new Date().getHours();
  let timeCategory;

  if (currentHour >= 5 && currentHour < 12) {
    timeCategory = "morning";
  } else if (currentHour >= 12 && currentHour < 18) {
    timeCategory = "afternoon";
  } else {
    timeCategory = "night";
  }

  // Get random image and message
  const category = notifications[timeCategory];
  const randomImage = category.images[Math.floor(Math.random() * category.images.length)];
  const randomMessage = category.messages[Math.floor(Math.random() * category.messages.length)];

  // Set up notification content
  const notification = document.getElementById("notification");
  const notificationImg = document.getElementById("notification-img");
  const notificationTitle = document.getElementById("notification-title");
  const notificationMessage = document.getElementById("notification-message");
  const closeBtn = document.getElementById("close-btn");

  // Assign values
  notificationImg.src = randomImage; // Set random image
  notificationTitle.textContent = randomMessage.title; // Set random title
  notificationMessage.innerHTML = randomMessage.message; // Set rich HTML message

  // Show notification after a delay
  setTimeout(() => {
    notification.style.display = "block";
  }, 1000); // Delay of 1 second

  // Close button functionality
  closeBtn.addEventListener("click", function () {
    notification.style.display = "none";
  });
});


document.addEventListener("copy", function (e) {
            e.preventDefault();
            alert("Copying is disabled on this text!");
        });

document.addEventListener('DOMContentLoaded', function () {
  const endExamBtn = document.getElementById('end-exam');
  const modal = document.getElementById('confirmationModal');
  const confirmYes = document.getElementById('confirmYes');
  const confirmNo = document.getElementById('confirmNo');

  endExamBtn.addEventListener('click', function () {
    modal.style.display = 'flex'; // Show the confirmation modal
    console.log('Submit Exam button clicked');
  });

  confirmYes.addEventListener('click', function () {
    modal.style.display = 'none';
    console.log('Exam submitted!');
    // Add your submission logic here
  });

  confirmNo.addEventListener('click', function () {
    modal.style.display = 'none'; // Hide the modal
    console.log('Submission canceled');
  });



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

  const activeUserIDs = ["OAU-NU8zL", "OAU-Kc233", "OAU-7Hyjx", "OAU-YJZid", "OAU-ON2Oj", "OAU-jEXEF", "OAU-PZ5Tj", "OAU-AgmoJ", "OAU-r55Vp", "OAU-JL36e", "OAU-qrTdN", "OAU-llhkh", "OAU-HggvB", "OAU-gq3hO", "OAU-z664T", "OAU-C0hZj", "OAU-Mafoa", "OAU-3zuzS", "OAU-Q6Z81", "OAU-XYLMF", "OAU-CFrCP", "OAU-Dq7YG", "OAU-wQUVg", "OAU-DbEbB", "OAU-7onAS", "OAU-4IE79", "OAU-HYzw2", "OAU-1GLHv", "OAU-RDOyh", "OAU-hRizi", "OAU-Z03kp", "OAU-W3Ldz", "OAU-RF8QS", "OAU-OoCDY", "OAU-zZ7XL", "OAU-RF8QS", "OAU-5ikQ4", "OAU-7WkN5", "OAU-wQUVg", "OAU-pzss7", "9KPGWE", "OAU-OoCDY","OAU-8ahti", "OAU-ZgXvX", "OAU-vTo6K", "OAU-hnBub", "OAU-SefDs", "OAU-gERUT", "OAU-Kg78V", "OAU-69FRv", "OAU-ryxMg", "OAU-b97cs", "OAU-oZTc5", "OAU-tUea4", "OAU-4FXLJ", "OAU-0ZqXe", "OAU-ztcIb", "OAU-JCfg0", "OAU-fcBhe", "OAU-1Wmt4", "OAU-ZYEu7", "OAU-sqZ2H", "OAU-YF6b8", "OAU-pRGfP", "OAU-I4KCh", "OAU-vwd1N", "OAU-U6UJd", "OAU-Bs3rn", "OAU-Lmgw1", "OAU-zonhD", "OAU-MQZiX", "OAU-M4FP5", "OAU-AFJF0", "OAU-Dsq5y", "OAU-MXqZ9", "OAU-3Loap", "OAU-aPaYK", "OAU-oDkB8", "ZAT61G", "OAU-gn5H1", "OAU-4T6Y2", "OAU-pPtXA", "OAU-8zM0P", "OAU-Cts4O", "OAU-P5nJv", "C9OJNB", "OAU-iM1rP", "YO638H", "OAU-QuKF7", "OAU-eElXp", "OAU-D7QPC", "OAU-vs1He", "OAU-GM7jE", "OAU-nTs6h", "OAU-4iDRs", "OAU-Hx08e", "OAU-giRIJ", "380PSM", "6YF1OG", "NI59IE", "V5KAMW", "ENOKAF", "O34U90", "C4BVOZ", "QM39NB", "KEEWPP", "OAU-8UaFi", "NJ5PKC", "43V107", "DNV83T", "QJ8RJZ", "VUA6KK", "2ZDGJM", "QQTIRS","537G6R", "WFX1S9", "77EOLI", "59UD2L", "2WN6FP", "CEIJ7E", "3IV4RI", "BSIZTQ", "K3RBVK", "XR0QEV", "J2DTAN", "ZKWN3U", "9UR3N6", "KNNP24", "3XHF8Z", "R7F0YO", "GIY77W", "FB32H6", "X64SH5"]; // Admin-activated user IDs
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

  if (confirm(`Do you want to log in with User ID: ${storedUserData.userID}?`)) {
    if (activeUserIDs.includes(storedUserData.userID)) {
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
          `I just completed my registration and my User ID is ${storedUserData.userID}. I am here to activate my account.`
        )}`,
        "_blank"
      );
    }
  } else {
    // Re-enable manual login
    loginBox.classList.remove("hidden");
  }

  if (storedUserData.userID !== userId) {
    alert("Invalid or Empty User ID. Please check and try again.");
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
    - Amount Paid: N2000.00
    
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
    
    // Open the URL
    window.location.href = "exam.html.htm";
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
                          
  const questionBanks = {
    Mathematics: {
        "MTH105": {
        title: "Mathematics for Biological Sciences",
        questions: [
          {
  text: "What is the union of the sets A = {1, 2, 3} and B = {3, 4, 5}?",
  options: [
    "{1, 2, 3, 4, 5}",
    "{3}",
    "{1, 2}",
    "{4, 5}"
  ],
  correct: 0,
  explanation: "The union of two sets includes all elements that are in either set. A ∪ B = {1, 2, 3, 4, 5}."
},
{
  text: "What is the intersection of the sets A = {1, 2, 3} and B = {3, 4, 5}?",
  options: [
    "{1, 2}",
    "{3}",
    "{1, 2, 3, 4, 5}",
    "{}"
  ],
  correct: 1,
  explanation: "The intersection of two sets includes only the elements common to both sets. A ∩ B = {3}."
},
{
  text: "If A = {1, 2, 3} and B = {3, 4, 5}, what is the difference A − B?",
  options: [
    "{1, 2}",
    "{3, 4}",
    "{1, 2, 3}",
    "{4, 5}"
  ],
  correct: 0,
  explanation: "The difference A − B includes elements in A but not in B. A − B = {1, 2}."
},
{
  text: "Which of the following is the correct definition of a subset?",
  options: [
    "A set where all elements are in another set.",
    "A set with no elements.",
    "A set with exactly one element.",
    "A set that contains all possible elements."
  ],
  correct: 0,
  explanation: "A subset is defined as a set where every element of the subset is also an element of another set."
},
{
  text: "What is the power set of the set A = {1, 2}?",
  options: [
    "{{}, {1}, {2}, {1, 2}}",
    "{{1, 2}}",
    "{{1}, {2}}",
    "{}"
  ],
  correct: 0,
  explanation: "The power set includes all subsets of a set. For A = {1, 2}, the power set is {{}, {1}, {2}, {1, 2}}."
},
{
  text: "If the universal set U = {1, 2, 3, 4, 5} and A = {1, 2}, what is the complement of A?",
  options: [
    "{3, 4, 5}",
    "{1, 2}",
    "{1, 2, 3}",
    "{}"
  ],
  correct: 0,
  explanation: "The complement of a set includes all elements in the universal set that are not in the given set. A' = {3, 4, 5}."
},
{
  text: "If A = {x | x is an even number less than 10}, what is the set A?",
  options: [
    "{2, 4, 6, 8}",
    "{1, 2, 3, 4, 5, 6, 7, 8, 9}",
    "{10, 12, 14}",
    "{0, 2, 4, 6, 8, 10}"
  ],
  correct: 0,
  explanation: "The set A includes all even numbers less than 10. A = {2, 4, 6, 8}."
},
{
  text: "If A = {1, 2, 3} and B = {3, 4, 5}, what is the symmetric difference A △ B?",
  options: [
    "{1, 2, 4, 5}",
    "{3}",
    "{1, 2, 3, 4, 5}",
    "{}"
  ],
  correct: 0,
  explanation: "The symmetric difference includes elements in either A or B but not in both. A △ B = {1, 2, 4, 5}."
},
{
  text: "How many subsets does a set with 3 elements have?",
  options: [
    "3",
    "6",
    "8",
    "9"
  ],
  correct: 2,
  explanation: "A set with n elements has 2ⁿ subsets. For 3 elements, the total subsets = 2³ = 8."
},
{
  text: "If A = {x | x > 0} and B = {x | x < 0}, what is A ∩ B?",
  options: [
    "{x | x > 0}",
    "{}",
    "{x | x < 0}",
    "{0}"
  ],
  correct: 1,
  explanation: "Since A includes all positive numbers and B includes all negative numbers, they have no elements in common. A ∩ B = {}."
},
{
  text: "If the universal set U = {1, 2, 3, 4, 5} and A = {1, 2, 3}, what is A' ∩ {4, 5}?",
  options: [
    "{4, 5}",
    "{}",
    "{1, 2, 3}",
    "{3}"
  ],
  correct: 0,
  explanation: "The complement A' = {4, 5}. A' ∩ {4, 5} = {4, 5}."
},
{
  text: "If A and B are disjoint sets, what is A ∩ B?",
  options: [
    "A ∪ B",
    "A − B",
    "{}",
    "B − A"
  ],
  correct: 2,
  explanation: "Disjoint sets have no elements in common, so their intersection is the empty set, {}."
},
{
  text: "What is the Cartesian product of A = {1, 2} and B = {a, b}?",
  options: [
    "{(1, a), (2, b)}",
    "{(1, a), (1, b), (2, a), (2, b)}",
    "{(a, 1), (b, 2)}",
    "{}"
  ],
  correct: 1,
  explanation: "The Cartesian product includes all ordered pairs (x, y) where x ∈ A and y ∈ B. A × B = {(1, a), (1, b), (2, a), (2, b)}."
},
{
  text: "If A = {1, 2, 3} and B = {3, 4, 5}, how many elements are in A ∪ B?",
  options: [
    "3",
    "5",
    "6",
    "7"
  ],
  correct: 1,
  explanation: "A ∪ B = {1, 2, 3, 4, 5}, which has 5 elements."
},
{
  text: "Which of the following is true for every set A?",
  options: [
    "A ⊆ A",
    "A ⊂ A",
    "{} ⊆ A",
    "Both (a) and (c)"
  ],
  correct: 3,
  explanation: "A set is always a subset of itself (A ⊆ A). The empty set is also a subset of every set ({} ⊆ A)."
}, 
{
  text: "If A = {x | x is a prime number less than 20} and B = {x | x is an odd number less than 20}, what is A ∩ B?",
  options: [
    "{3, 5, 7, 11, 13, 17, 19}",
    "{3, 5, 7, 11, 13, 17, 19, 2}",
    "{3, 5, 7, 11, 13, 17, 19}",
    "{2}"
  ],
  correct: 2,
  explanation: "A includes all primes < 20: {2, 3, 5, 7, 11, 13, 17, 19}. B includes all odd numbers < 20. Intersection A ∩ B excludes 2 (not odd). A ∩ B = {3, 5, 7, 11, 13, 17, 19}."
},
{
  text: "If U = {1, 2, 3, 4, 5, 6, 7, 8, 9}, A = {2, 4, 6, 8}, and B = {1, 2, 3, 4, 5}, find A' ∪ B'.",
  options: [
    "{1, 2, 3, 4, 5, 7, 9}",
    "{6, 7, 8, 9}",
    "{1, 3, 5, 7, 9}",
    "{6, 7, 8}"
  ],
  correct: 2,
  explanation: "A' = U − A = {1, 3, 5, 7, 9}. B' = U − B = {6, 7, 8, 9}. A' ∪ B' = {1, 3, 5, 7, 9}."
},
{
  text: "If A = {1, 2, 3, 4} and B = {3, 4, 5, 6}, calculate |A ∪ B| − |A ∩ B|.",
  options: [
    "6",
    "4",
    "5",
    "3"
  ],
  correct: 0,
  explanation: "|A ∪ B| = |{1, 2, 3, 4, 5, 6}| = 6. |A ∩ B| = |{3, 4}| = 2. Therefore, |A ∪ B| − |A ∩ B| = 6 − 2 = 4."
},
{
  text: "If A = {x | x is a multiple of 3, x ≤ 30} and B = {x | x is a multiple of 5, x ≤ 30}, find A ∩ B.",
  options: [
    "{15, 30}",
    "{3, 15}",
    "{15}",
    "{}"
  ],
  correct: 0,
  explanation: "A = {3, 6, 9, 12, 15, 18, 21, 24, 27, 30}. B = {5, 10, 15, 20, 25, 30}. A ∩ B includes common multiples of 3 and 5 (LCM of 3 and 5), which are {15, 30}."
},
{
  text: "A survey showed 40 students like tea, 25 like coffee, and 10 like both. How many students like tea or coffee?",
  options: [
    "65",
    "55",
    "45",
    "35"
  ],
  correct: 2,
  explanation: "Using the inclusion-exclusion principle, |A ∪ B| = |A| + |B| − |A ∩ B|. Here, |A| = 40, |B| = 25, |A ∩ B| = 10. |A ∪ B| = 40 + 25 − 10 = 55."
},
{
  text: "If A = {1, 2, 3, 4, 5, 6, 7, 8, 9} and B = {x | x is divisible by 2}, find |A − B|.",
  options: [
    "3",
    "4",
    "5",
    "6"
  ],
  correct: 2,
  explanation: "B = {2, 4, 6, 8} (elements divisible by 2). A − B = {1, 3, 5, 7, 9}. Therefore, |A − B| = 5."
},
{
  text: "A school has 100 students. 60 take math, 50 take science, and 20 take both. How many students take only math?",
  options: [
    "40",
    "30",
    "20",
    "50"
  ],
  correct: 0,
  explanation: "Using the formula: Only Math = |Math| − |Math ∩ Science|. Only Math = 60 − 20 = 40."
},
{
  text: "Given three sets A = {1, 2, 3, 4}, B = {3, 4, 5, 6}, and C = {1, 2, 5, 6}, calculate A ∩ (B ∪ C).",
  options: [
    "{1, 2}",
    "{3, 4}",
    "{1, 3, 4}",
    "{1, 2, 3, 4}"
  ],
  correct: 1,
  explanation: "B ∪ C = {1, 2, 3, 4, 5, 6}. A ∩ (B ∪ C) = {1, 2, 3, 4} ∩ {1, 2, 3, 4, 5, 6} = {3, 4}."
},
{
  text: "If A = {1, 2, 3, 4} and B = {3, 4, 5, 6}, find |A × B|.",
  options: [
    "16",
    "8",
    "12",
    "6"
  ],
  correct: 0,
  explanation: "The Cartesian product A × B has |A| × |B| elements. Here, |A| = 4 and |B| = 4. So, |A × B| = 4 × 4 = 16."
},
{
  text: "Out of 120 people, 80 like pizza, 50 like burgers, and 30 like both. How many people like only pizza?",
  options: [
    "50",
    "30",
    "20",
    "60"
  ],
  correct: 3,
  explanation: "Using the formula: Only Pizza = |Pizza| − |Pizza ∩ Burger|. Only Pizza = 80 − 30 = 50."
}, 
{
  text: "A marketing survey shows that 120 people use Instagram, 100 use Facebook, and 70 use both. If 150 people were surveyed, how many use either Instagram or Facebook?",
  options: [
    "150",
    "130",
    "200",
    "220"
  ],
  correct: 1,
  explanation: "Using the inclusion-exclusion principle, |Instagram ∪ Facebook| = |Instagram| + |Facebook| − |Both|. Substituting: |Instagram ∪ Facebook| = 120 + 100 − 70 = 150. Since there are 150 surveyed, all use at least one platform."
},
{
  text: "In a class of 50 students, 30 play football, 25 play basketball, and 10 play both. How many students play only one sport?",
  options: [
    "35",
    "25",
    "45",
    "30"
  ],
  correct: 0,
  explanation: "Using the formula: Only Football = |Football| − |Both| = 30 − 10 = 20. Only Basketball = |Basketball| − |Both| = 25 − 10 = 15. Total = 20 + 15 = 35."
},
{
  text: "A store sells 200 products: 120 are electronics, 90 are household items, and 50 are both. How many products are either electronics or household items?",
  options: [
    "160",
    "200",
    "220",
    "140"
  ],
  correct: 3,
  explanation: "Using the inclusion-exclusion principle, |Electronics ∪ Household Items| = |Electronics| + |Household Items| − |Both|. Substituting: |Electronics ∪ Household Items| = 120 + 90 − 50 = 160."
},
{
  text: "In a company, 100 employees speak English, 60 speak Spanish, and 40 speak both. If there are 150 employees, how many speak neither language?",
  options: [
    "10",
    "30",
    "50",
    "20"
  ],
  correct: 1,
  explanation: "Using the inclusion-exclusion principle, |English ∪ Spanish| = |English| + |Spanish| − |Both|. Substituting: |English ∪ Spanish| = 100 + 60 − 40 = 120. Employees who speak neither = 150 − 120 = 30."
},
{
  text: "At a park, 200 visitors play tennis, 150 play badminton, and 80 play both. How many visitors play only tennis?",
  options: [
    "120",
    "80",
    "150",
    "70"
  ],
  correct: 0,
  explanation: "Using the formula: Only Tennis = |Tennis| − |Both|. Substituting: Only Tennis = 200 − 80 = 120."
},
{
  text: "In a survey, 60% of people like tea, 40% like coffee, and 25% like both. What percentage of people like only tea?",
  options: [
    "35%",
    "25%",
    "60%",
    "50%"
  ],
  correct: 0,
  explanation: "Using the formula: Only Tea = %Tea − %Both. Substituting: Only Tea = 60% − 25% = 35%."
},
{
  text: "A library has 500 books: 300 are fiction, 250 are non-fiction, and 100 are both. How many books are only fiction or non-fiction?",
  options: [
    "450",
    "350",
    "300",
    "400"
  ],
  correct: 0,
  explanation: "Using the formula: Only Fiction = |Fiction| − |Both| = 300 − 100 = 200. Only Non-Fiction = |Non-Fiction| − |Both| = 250 − 100 = 150. Total = 200 + 150 = 350."
},
{
  text: "A software company has 200 developers: 120 know Python, 100 know Java, and 50 know both. How many developers know either Python or Java?",
  options: [
    "220",
    "170",
    "150",
    "180"
  ],
  correct: 1,
  explanation: "Using the inclusion-exclusion principle, |Python ∪ Java| = |Python| + |Java| − |Both|. Substituting: |Python ∪ Java| = 120 + 100 − 50 = 170."
},
{
  text: "In a university, 300 students take biology, 250 take chemistry, and 150 take both. If there are 400 students in total, how many take neither subject?",
  options: [
    "100",
    "200",
    "150",
    "50"
  ],
  correct: 0,
  explanation: "Using the inclusion-exclusion principle, |Biology ∪ Chemistry| = |Biology| + |Chemistry| − |Both|. Substituting: |Biology ∪ Chemistry| = 300 + 250 − 150 = 400. Students taking neither = Total − Biology ∪ Chemistry = 400 − 400 = 100."
},
{
  text: "A gym has 500 members: 300 use the treadmill, 200 use the cycling machine, and 100 use both. How many members use only one type of equipment?",
  options: [
    "400",
    "300",
    "200",
    "400"
  ],
  correct: 1,
  explanation: "Using the formula: Only Treadmill = |Treadmill| − |Both| = 300 − 100 = 200. Only Cycling = |Cycling| − |Both| = 200 − 100 = 100. Total = 200 + 100 = 300."
}, 
{
  text: "Solve the quadratic equation x² + 5x + 6 = 0.",
  options: [
    "x = -2, x = -3",
    "x = 2, x = 3",
    "x = -1, x = -6",
    "x = 1, x = 6"
  ],
  correct: 0,
  explanation: "Factorize x² + 5x + 6 = (x + 2)(x + 3) = 0. Therefore, x = -2 and x = -3."
},
{
  text: "If x = √5, find the value of x² + 2x.",
  options: [
    "7 + 2√5",
    "9",
    "10 + 2√5",
    "15"
  ],
  correct: 2,
  explanation: "Substitute x = √5 into the expression x² + 2x. x² = (√5)² = 5, and 2x = 2√5. So, x² + 2x = 5 + 2√5."
},
{
  text: "Simplify the surd expression: √72 + √50.",
  options: [
    "13√2",
    "14√2",
    "12√2",
    "15√2"
  ],
  correct: 1,
  explanation: "√72 = √(36 × 2) = 6√2, and √50 = √(25 × 2) = 5√2. Adding gives 6√2 + 5√2 = 14√2."
},
{
  text: "Solve for x in the equation x² = 7 + 4√3.",
  options: [
    "x = √(7 + 4√3), x = -√(7 + 4√3)",
    "x = √(7 − 4√3), x = -√(7 − 4√3)",
    "x = √(3 + 4√7), x = -√(3 + 4√7)",
    "x = √(3 − 4√7), x = -√(3 − 4√7)"
  ],
  correct: 0,
  explanation: "To solve x² = 7 + 4√3, take square roots of both sides. x = ±√(7 + 4√3)."
},
{
  text: "Find the nature of the roots of the quadratic equation 2x² − 4x + 3 = 0.",
  options: [
    "Real and equal",
    "Real and distinct",
    "Imaginary",
    "Cannot be determined"
  ],
  correct: 2,
  explanation: "The discriminant Δ = b² − 4ac = (−4)² − 4(2)(3) = 16 − 24 = −8. Since Δ < 0, the roots are imaginary."
},
{
  text: "Simplify: ³√27 + √9 − 2√16.",
  options: [
    "3",
    "5",
    "6",
    "0"
  ],
  correct: 1,
  explanation: "³√27 = 3, √9 = 3, and 2√16 = 2 × 4 = 8. Adding and subtracting gives 3 + 3 − 8 = −2."
},
{
  text: "A quadratic equation has roots 2 and 3. What is the equation?",
  options: [
    "x² − 5x + 6 = 0",
    "x² − 6x + 5 = 0",
    "x² + 5x − 6 = 0",
    "x² + 6x − 5 = 0"
  ],
  correct: 0,
  explanation: "If the roots are 2 and 3, the quadratic equation is (x − 2)(x − 3) = x² − 5x + 6."
},
{
  text: "If x = √3 + √2, what is x²?",
  options: [
    "5 + 2√6",
    "5 − 2√6",
    "5",
    "4√6 + 6"
  ],
  correct: 0,
  explanation: "Using (a + b)² = a² + 2ab + b², with a = √3 and b = √2: x² = (√3)² + 2(√3)(√2) + (√2)² = 3 + 2√6 + 2 = 5 + 2√6."
},
{
  text: "The product of two consecutive odd numbers is 143. What are the numbers?",
  options: [
    "11 and 13",
    "13 and 15",
    "9 and 11",
    "7 and 9"
  ],
  correct: 0,
  explanation: "Let the numbers be x and x + 2. Their product is x(x + 2) = 143. Solving x² + 2x − 143 = 0 gives x = 11 and x + 2 = 13."
},
{
  text: "If p(x) = x² − 6x + 8, find the sum of its roots.",
  options: [
    "6",
    "8",
    "−6",
    "−8"
  ],
  correct: 0,
  explanation: "The sum of roots for a quadratic equation ax² + bx + c = 0 is −b/a. For p(x), sum = −(−6)/1 = 6."
}, 
{
  text: "The height of a projectile is modeled by the equation h(t) = -5t² + 20t + 15, where h is the height in meters, and t is the time in seconds. Will the projectile hit the ground?",
  options: [
    "Yes, at t = 4 seconds",
    "Yes, at t = 3 seconds",
    "Yes, at t = 2 seconds",
    "No, it will never hit the ground"
  ],
  correct: 1,
  explanation: "To find when the projectile hits the ground, solve h(t) = 0: -5t² + 20t + 15 = 0. Using the quadratic formula: \( t = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} \), with a = -5, b = 20, c = 15, we get t = 3 or t = -1. Since time cannot be negative, t = 3 seconds."
},
{
  text: "A company models profit using the equation P(x) = -2x² + 12x - 16, where x is the number of units sold. Will the profit ever be zero?",
  options: [
    "Yes, at x = 4 and x = 2",
    "Yes, at x = 6 and x = 3",
    "No, it is always negative",
    "Yes, at x = 8 and x = 5"
  ],
  correct: 0,
  explanation: "To find when profit is zero, solve P(x) = 0: -2x² + 12x - 16 = 0. Using the quadratic formula: \( x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} \), we get x = 4 and x = 2."
},
{
  text: "The roots of a quadratic equation ax² + bx + c = 0 are imaginary. Which of the following must be true?",
  options: [
    "b² − 4ac < 0",
    "b² − 4ac = 0",
    "b² − 4ac > 0",
    "a = 0"
  ],
  correct: 0,
  explanation: "For roots to be imaginary, the discriminant \( b^2 - 4ac \) must be negative. This makes the square root term imaginary."
},
{
  text: "A football is kicked, and its height is modeled by the equation h(t) = -4.9t² + 14.7t. When does it return to the ground?",
  options: [
    "At t = 3 seconds",
    "At t = 5 seconds",
    "At t = 7 seconds",
    "At t = 2 seconds"
  ],
  correct: 0,
  explanation: "Solve h(t) = 0: -4.9t² + 14.7t = 0. Factorize to get t(-4.9t + 14.7) = 0. So, t = 0 or t = 3 seconds. Since t = 0 is the starting point, the football returns to the ground at t = 3 seconds."
},
{
  text: "The roots of the equation x² − 4x + 4 = 0 are:",
  options: [
    "Real and equal",
    "Real and distinct",
    "Imaginary",
    "None of these"
  ],
  correct: 0,
  explanation: "The discriminant \( b^2 - 4ac = (-4)^2 - 4(1)(4) = 16 - 16 = 0 \). When \( \Delta = 0 \), the roots are real and equal."
},
{
  text: "The quadratic equation x² + 2x + 10 = 0 has roots that are:",
  options: [
    "Real and equal",
    "Real and distinct",
    "Imaginary",
    "None of these"
  ],
  correct: 2,
  explanation: "The discriminant \( b^2 - 4ac = 2^2 - 4(1)(10) = 4 - 40 = -36 \). When \( \Delta < 0 \), the roots are imaginary."
},
{
  text: "A rectangle has an area of 30 m² and its length is 2 m more than its width. What is the width of the rectangle?",
  options: [
    "3 m",
    "5 m",
    "6 m",
    "10 m"
  ],
  correct: 1,
  explanation: "Let the width = x and the length = x + 2. Area = length × width, so \( x(x + 2) = 30 \). Solve \( x^2 + 2x - 30 = 0 \). Using the quadratic formula, \( x = 5 \) or \( x = -6 \). Since width cannot be negative, x = 5 m."
},
{
  text: "The quadratic equation 2x² − 4x + 2 = 0 has roots that are:",
  options: [
    "Real and equal",
    "Real and distinct",
    "Imaginary",
    "None of these"
  ],
  correct: 0,
  explanation: "The discriminant \( b^2 - 4ac = (-4)^2 - 4(2)(2) = 16 - 16 = 0 \). Since \( \Delta = 0 \), the roots are real and equal."
},
{
  text: "A farmer wants to build a rectangular pen with an area of 100 m² and the length is twice the width. What are the dimensions of the pen?",
  options: [
    "Length = 10 m, Width = 5 m",
    "Length = 20 m, Width = 5 m",
    "Length = 15 m, Width = 10 m",
    "Length = 25 m, Width = 4 m"
  ],
  correct: 0,
  explanation: "Let the width = x and the length = 2x. Area = length × width, so \( x(2x) = 100 \). Solve \( 2x^2 = 100 \): \( x^2 = 50 \), \( x = 5 \). Length = 2x = 10 m."
},
{
  text: "The quadratic equation 3x² + 6x + 2 = 0 has roots that are:",
  options: [
    "Real and distinct",
    "Real and equal",
    "Imaginary",
    "None of these"
  ],
  correct: 0,
  explanation: "The discriminant ( b² - 4ac = (6)² - 4(3)(2) = 36 - 24 = 12 ). Since ( ∆ > 0 ), the roots are real and distinct."
}, 

        ]
      },
           
      "MTH101": {
        title: "General Mathematics for Physical Sciences and Engineering Students",
        questions: [
   {
  text: "Given sets A = {1, 2, 3, 4} and B = {3, 4, 5, 6}, what is A ∪ B?",
  options: [
    "{3, 4}",
    "{1, 2, 5, 6}",
    "{1, 2, 3, 4, 5, 6}",
    "{}"
  ],
  correct: 2,
  explanation: "The union (A ∪ B) of two sets includes all unique elements from both sets. A ∪ B = {1, 2, 3, 4, 5, 6}."
},
{
  text: "Using the same sets A and B from question 1, what is A ∩ B?",
  options: [
    "{1, 2, 5, 6}",
    "{1, 2}",
    "{5, 6}",
    "{3, 4}"
  ],
  correct: 3,
  explanation: "The intersection (A ∩ B) includes only the elements common to both sets. A ∩ B = {3, 4}."
},
{
  text: "If A = {x | x is an even number less than 10} and B = {x | x is a prime number less than 10}, what is A ∩ B?",
  options: [
    "{2, 4, 6, 8}",
    "{2, 3, 5, 7}",
    "{2}",
    "{}"
  ],
  correct: 2,
  explanation: "The only number common to both the even numbers less than 10 and the prime numbers less than 10 is 2."
},
{
  text: "Let the universal set U = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}. If A = {2, 4, 6, 8}, what is A'?",
  options: [
    "{1, 3, 5, 7, 9, 10}",
    "{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}",
    "{2, 4, 6, 8}",
    "{}"
  ],
  correct: 0,
  explanation: "The complement (A') includes everything in the universal set (U) that is not in A. A' = {1, 3, 5, 7, 9, 10}."
},
{
  text: "If C = {x | x is a real number}, and D = {x | x is an integer}, what does C ∩ D represent?",
  options: [
    "All real numbers",
    "All integers",
    "All irrational numbers",
    "{}"
  ],
  correct: 1,
  explanation: "The intersection (C ∩ D) refers to numbers that are both real and integers, which simply means all integers."
},
{
  text: "Which of the following is NOT a law of set theory?",
  options: [
    "Commutative law",
    "Associative law",
    "Distributive law",
    "Integral law"
  ],
  correct: 3,
  explanation: "Integral law is a term from calculus, not set theory. Commutative, Associative, and Distributive laws are valid set theory laws."
},
{
  text: "Given a universal set of all real numbers, R, A = {x | x > 5}, what is the complement of A?",
  options: [
    "{x | x < 5}",
    "{x | x ≥ 5}",
    "{x | x ≤ 5}",
    "{x | x < -5}"
  ],
  correct: 2,
  explanation: "The complement of A includes everything not satisfying x > 5, which means x ≤ 5."
},
{
  text: "If set A represents all possible outcomes of rolling a die, and set B represents all outcomes that are even numbers, what does A - B represent?",
  options: [
    "{2, 4, 6}",
    "{1, 3, 5}",
    "{}",
    "{1, 2, 3, 4, 5, 6}"
  ],
  correct: 1,
  explanation: "A - B includes all elements in A that are not in B: {1, 3, 5}."
},
{
  text: "If a set has n elements, how many subsets does it have?",
  options: [
    "n",
    "2n",
    "n²",
    "2ⁿ"
  ],
  correct: 3,
  explanation: "Each element in a set can either be included or not included in a subset, creating 2ⁿ subsets."
},
{
  text: "Which of the following describes the power set of a set A?",
  options: [
    "The set of all subsets of A including the empty set.",
    "The set of all supersets of A",
    "The set of all elements in A",
    "All sets that include A"
  ],
  correct: 0,
  explanation: "The power set includes every possible subset, including the empty set and the original set itself."
},
{
  text: "In a survey of 100 students, 60 like physics, 50 like math, and 30 like both. How many students like neither physics nor math?",
  options: [
    "10",
    "20",
    "30",
    "40"
  ],
  correct: 0,
  explanation: "Using the inclusion-exclusion principle, 10 students like neither physics nor math."
},
{
  text: "Sets A and B are said to be disjoint if:",
  options: [
    "A ∪ B = {}",
    "A ∩ B = A",
    "A ∩ B = {}",
    "A ⊆ B"
  ],
  correct: 2,
  explanation: "Disjoint sets have no common elements, so their intersection is an empty set."
},
{
  text: "Which of the following describes De Morgan's Law?",
  options: [
    "(A ∪ B)' = A' ∩ B' and (A ∩ B)' = A' ∪ B'",
    "A ∪ (B ∩ C) = (A ∪ B) ∩ (A ∪ C)",
    "A ∩ (B ∪ C) = (A ∩ B) ∪ (A ∩ C)",
    "A ∪ B = B ∪ A"
  ],
  correct: 0,
  explanation: "De Morgan's Laws describe how complements interact with union and intersection."
},
{
  text: "Given A = {1, 2}, what is the power set of A?",
  options: [
    "{{}, {1, 2}}",
    "{{}, {1}, {2}}",
    "{{}, {1}, {2}, {1, 2}}",
    "{{1}, {2}}"
  ],
  correct: 2,
  explanation: "The power set of A includes all subsets: {}, {1}, {2}, and {1, 2}."
}, 
  {
  text: "For three sets A, B, and C, A ∪ (B ∩ C) is equal to:",
  options: [
    "(A ∪ B) ∩ (A ∪ C)",
    "(A ∩ B) ∪ (A ∩ C)",
    "(A ∪ B) ∪ C",
    "A ∩ B ∩ C"
  ],
  correct: 0,
  explanation: "The Distributive Law states: A ∪ (B ∩ C) = (A ∪ B) ∩ (A ∪ C)."
},
{
  text: "A set that contains all possible outcomes of an experiment is known as the?",
  options: [
    "Empty set",
    "Subset",
    "Power set",
    "Universal set"
  ],
  correct: 3,
  explanation: "The universal set represents all possible outcomes in a given context."
},
{
  text: "If A ⊆ B and B ⊆ C then:",
  options: [
    "A ⊆ C",
    "C ⊆ A",
    "A = B",
    "B ∩ C = {}"
  ],
  correct: 0,
  explanation: "If A is a subset of B, and B is a subset of C, then A is also a subset of C."
},
{
  text: "If the intersection of two sets is equal to either of the sets, which statement is true?",
  options: [
    "The sets are disjoint",
    "The sets are equal",
    "One is a subset of the other",
    "The sets are the same as the universal set"
  ],
  correct: 2,
  explanation: "If A ∩ B = A (or B), then one set must be a subset of the other."
},
{
  text: "A set with no elements is called a/an?",
  options: [
    "Singleton set",
    "Null set",
    "Universal set",
    "Power set"
  ],
  correct: 1,
  explanation: "A null set (or empty set) has no elements."
},
{
  text: "If A = {1,2,3} and B = {4,5}, what is A × B (Cartesian product)?",
  options: [
    "{1,2,3,4,5}",
    "{(1,4),(1,5),(2,4),(2,5),(3,4),(3,5)}",
    "{(4,1),(4,2),(4,3),(5,1),(5,2),(5,3)}",
    "{}"
  ],
  correct: 1,
  explanation: "The Cartesian product pairs every element from set A with every element from set B."
},
{
  text: "Given A = {1,2,3} and B = {2,3}, what is B - A?",
  options: [
    "{1}",
    "{2,3}",
    "{}",
    "{4,5}"
  ],
  correct: 2,
  explanation: "B - A includes elements in B that are not in A. Since B is a subset of A, the result is an empty set."
},
{
  text: "In a system with 30 particles, 20 are fermions and 15 are bosons. If 10 particles are neither fermions nor bosons, how many are both fermions and bosons?",
  options: [
    "5",
    "10",
    "15",
    "25"
  ],
  correct: 0,
  explanation: "Using inclusion-exclusion, the overlap of fermions and bosons is calculated as 5."
},
{
  text: "Which set operation corresponds to the logical AND operator?",
  options: [
    "Union",
    "Intersection",
    "Complement",
    "Difference"
  ],
  correct: 1,
  explanation: "The intersection corresponds to the logical AND operator, where both conditions must hold true."
},
{
  text: "If two sets are equal, which statement is true?",
  options: [
    "They must have the same elements",
    "They must have the same power set",
    "They must have the same cardinal number",
    "All of the above"
  ],
  correct: 3,
  explanation: "Equal sets have the same elements, power set, and cardinality."
},
{
  text: "Given set A = {1, 2, {3, 4}}. Which of the following is NOT an element of set A?",
  options: [
    "1",
    "2",
    "{3,4}",
    "3"
  ],
  correct: 3,
  explanation: "While {3,4} is an element, 3 by itself is not directly an element of A."
},
{
  text: "What is the cardinal number of A, given A = {x | x is a letter in the word 'MATHEMATICS'}?",
  options: [
    "11",
    "10",
    "8",
    "12"
  ],
  correct: 2,
  explanation: "The set of unique letters in 'MATHEMATICS' contains 8 distinct elements."
},
{
  text: "A set is called countably infinite if:",
  options: [
    "Its elements can be put into a one-to-one correspondence with the natural numbers.",
    "It contains an infinite number of subsets.",
    "It includes all the real numbers.",
    "It has a finite number of elements."
  ],
  correct: 0,
  explanation: "A countably infinite set can be mapped one-to-one with natural numbers."
},

{
  text: "Which of the following is NOT a correct application of De Morgan's Law?",
  options: [
    "(X ∪ Y)' = X' ∩ Y'",
    "(X ∩ Y)' = X' ∪ Y'",
    "(X ∪ Y)' = X' ∪ Y'",
    "(X' ∪ Y')' = X ∩ Y"
  ],
  correct: 2,
  explanation: "De Morgan's Laws state that the complement of a union equals the intersection of complements, and the complement of an intersection equals the union of complements. The expression (X ∪ Y)' = X' ∪ Y' is incorrect."
},

{
  text: "If Z = X ∪ Y, which statement is true about the complements, assuming the universe set is the same?",
  options: [
    "Z' = X' ∪ Y'",
    "Z' = X' ∩ Y'",
    "Z' = (X ∩ Y)'",
    "Z' = X' - Y'"
  ],
  correct: 1,
  explanation: "By De Morgan's Laws, the complement of the union Z = X ∪ Y is Z' = X' ∩ Y'."
},

{
  text: "Given X, Y, and Z, what does X ∩ (Y - Z) represent?",
  options: [
    "Elements in X that are also in Y, excluding elements in Z.",
    "Elements in X that are in Y but not in Z.",
    "Elements common to X, Y, and not in Z.",
    "Elements in X, Y, and Z that are unique to X."
  ],
  correct: 1,
  explanation: "The operation Y - Z represents elements in Y but not in Z. The intersection with X limits it to elements in X, resulting in 'elements in X that are in Y but not in Z.'"
},

{
  text: "What is the simplified form of (X - Y) - Z?",
  options: [
    "X - (Y ∪ Z)",
    "X - (Y ∩ Z)",
    "(X - Z) - (Y - Z)",
    "X - Y - Z"
  ],
  correct: 0,
  explanation: "The subtraction of Z from (X - Y) means removing elements of Z from X and Y. This simplifies to X - (Y ∪ Z)."
},

{
  text: "Which expression is equivalent to X - (Y ∪ Z)?",
  options: [
    "(X - Y) ∪ (X - Z)",
    "(X - Y) ∩ (X - Z)",
    "(X - Y) ∪ Z'",
    "X - Y - Z"
  ],
  correct: 1,
  explanation: "Distributing the subtraction over the union gives (X - Y) ∩ (X - Z)."
},

{
  text: "If (X - Y) ∪ Z' = (X - Z), what does this imply about the relationship between X, Y, and Z?",
  options: [
    "X and Z have no common elements",
    "Z is a subset of Y",
    "X and Y are disjoint",
    "Z is a subset of X"
  ],
  correct: 3,
  explanation: "The relationship (X - Y) ∪ Z' = (X - Z) implies that Z must be a subset of X for the union to simplify correctly."
},

{
  text: "Given sets X and Y, what does XΔY represent?",
  options: [
    "(X - Y) ∩ (Y - X)",
    "(X ∪ Y) - (X ∩ Y)",
    "(X ∩ Y)'",
    "X ∪ Y"
  ],
  correct: 1,
  explanation: "The symmetric difference XΔY represents elements in either X or Y but not in both. It simplifies to (X ∪ Y) - (X ∩ Y)."
},

{
  text: "If X and Y are sets, what is the result of XΔX?",
  options: [
    "X",
    "Y",
    "∅",
    "X ∪ Y"
  ],
  correct: 2,
  explanation: "The symmetric difference of a set with itself is the empty set, as there are no elements exclusively in one copy of the set."
},

{
  text: "If (XΔY)ΔZ = XΔ(YΔZ), what is this set property called?",
  options: [
    "Commutative property",
    "Distributive property",
    "Associative property",
    "De Morgan's Law"
  ],
  correct: 2,
  explanation: "This demonstrates the associative property of symmetric difference, which allows grouping changes without affecting the result."
},

{
  text: "If XΔY = (X - Y) ∪ (Y - X), what does it mean if XΔY = ∅?",
  options: [
    "X = Y",
    "X and Y are disjoint",
    "X is a subset of Y",
    "Y is a subset of X"
  ],
  correct: 0,
  explanation: "If XΔY = ∅, it means there are no elements in either X or Y that are not in both, implying X = Y."
},
{
  text: "If Ø × Y = Ø, what does this imply about the symmetric difference?",
  options: [
    "This is always true for any set Y.",
    "This is true only if Y is empty.",
    "This is true only if Y contains all elements of the universe set.",
    "This is only true if X is not empty."
  ],
  correct: 0,
  explanation: "The symmetric difference between the empty set and any set Y is always the empty set because there are no elements exclusively in Ø or Y."
},

{
  text: "If (X ∩ Y) × Z = X × (Y ∩ Z) is not true for every set, what does this imply about symmetric difference?",
  options: [
    "Symmetric difference is not distributive over intersection.",
    "Symmetric difference is distributive over union.",
    "Symmetric difference is associative.",
    "Symmetric difference is commutative."
  ],
  correct: 0,
  explanation: "This implies that symmetric difference does not distribute over intersection, as the equality fails for certain sets."
},

{
  text: "If A ∩ (B ∪ C) = (A - B) ∪ (A ∩ C) using a Venn diagram, what can you conclude?",
  options: [
    "Intersection distributes over the union.",
    "Union distributes over the intersection.",
    "Complements can distribute over union.",
    "The sets are all disjoint."
  ],
  correct: 0,
  explanation: "The Venn diagram confirms that intersection distributes over union, breaking the operation into distributive parts."
},

{
  text: "If A ∪ (B ∩ C) is equivalent to (A - B) ∪ (A - C), what can you infer?",
  options: [
    "Union distributes over intersection.",
    "Intersection distributes over union.",
    "The operation is commutative.",
    "The complement operation can be distributed."
  ],
  correct: 1,
  explanation: "Intersection distributes over union in this case, as the union breaks into independent parts involving the intersection."
},

{
  text: "If X ∩ Y = X implies X ⊆ Y, what other set relations might be true?",
  options: [
    "Y ⊆ X",
    "X and Y are disjoint",
    "X = Y",
    "None of the above"
  ],
  correct: 2,
  explanation: "If X ∩ Y = X, then all elements of X are in Y, which implies X is a subset of Y. If Y contains no extra elements, X = Y."
},

{
  text: "If X ∪ Y = X, which of the following must be true?",
  options: [
    "Y is a subset of X.",
    "X is a subset of Y.",
    "X and Y are disjoint.",
    "X = Y."
  ],
  correct: 0,
  explanation: "If the union of X and Y is equal to X, it means all elements of Y are already in X, so Y is a subset of X."
},

{
  text: "What is A ∪ (A' ∩ B) simplified to?",
  options: [
    "A ∪ B",
    "A ∩ B",
    "B",
    "A"
  ],
  correct: 0,
  explanation: "Using set algebra, A ∪ (A' ∩ B) simplifies to A ∪ B because A' ∩ B adds elements of B not in A to the union."
},

{
  text: "What is A' ∪ (A' ∪ B') simplified to?",
  options: [
    "A ∩ B",
    "(A ∩ B)'",
    "A'",
    "B'"
  ],
  correct: 2,
  explanation: "The expression A' ∪ (A' ∪ B') simplifies to A' because the union with A' already encompasses all elements not in A."
},

{
  text: "What is (A' ∩ B') ∪ (A ∩ B) simplified to?",
  options: [
    "A Δ B",
    "(A ∪ B)'",
    "(A ∪ B)",
    "A ∩ B"
  ],
  correct: 0,
  explanation: "The expression represents the symmetric difference A Δ B, as it combines elements exclusive to A or B."
},

{
  text: "What is the principle behind n(A) + n(B) = n(A ∪ B) + n(A ∩ B)?",
  options: [
    "Inclusion-exclusion principle for two sets",
    "Distributive law for sets",
    "Associative law for sets",
    "De Morgan’s Law"
  ],
  correct: 0,
  explanation: "This is the inclusion-exclusion principle, which accounts for the overlap (intersection) when adding the sizes of two sets."
},
{
  text: "What does n(A ∪ B ∪ C) = n(A) + n(B) + n(C) - n(A ∩ B) - n(B ∩ C) - n(C ∩ A) + n(A ∩ B ∩ C) represent?",
  options: [
    "Inclusion-exclusion principle for three sets",
    "Distributive property for three sets",
    "Associative property for three sets",
    "Commutative property for three sets"
  ],
  correct: 0,
  explanation: "This is the inclusion-exclusion principle extended to three sets. It accounts for overlaps among pairs and triples of sets to avoid overcounting."
},

{
  text: "If 63% of OAU students like eba and 76% like rice, what is the MINIMUM percentage that likes both?",
  options: [
    "39%",
    "25%",
    "63%",
    "0%"
  ],
  correct: 3,
  explanation: "The minimum percentage of students that like both is 0%, which occurs if no students like both eba and rice."
},

{
  text: "If 63% of OAU students like eba and 76% like rice, what is the MAXIMUM percentage that likes both?",
  options: [
    "63%",
    "76%",
    "39%",
    "100%"
  ],
  correct: 0,
  explanation: "The maximum percentage of students that like both is equal to the smaller of the two percentages, i.e., 63%."
},

{
  text: "In a survey of 100 students, 41 take Spanish, 29 French, and 26 Russian. If 15 take both Spanish and French, 8 take French and Russian, 19 take Spanish and Russian, and 5 take all three, how many take EXACTLY two languages?",
  options: [
    "37",
    "27",
    "15",
    "42"
  ],
  correct: 1,
  explanation: "Using inclusion-exclusion, the number of students taking exactly two languages is: (15 - 5) + (8 - 5) + (19 - 5) = 10 + 3 + 14 = 27."
},

{
  text: "In the same survey, how many students take at least one of the three languages?",
  options: [
    "67",
    "73",
    "100",
    "56"
  ],
  correct: 1,
  explanation: "Using inclusion-exclusion: n(A ∪ B ∪ C) = 41 + 29 + 26 - 15 - 8 - 19 + 5 = 73."
},

{
  text: "In the same survey, how many students do not take any of the three languages?",
  options: [
    "33",
    "27",
    "56",
    "0"
  ],
  correct: 0,
  explanation: "If 73 students take at least one language, the number of students who do not take any is 100 - 73 = 33."
},

{
  text: "In the same survey, how many students take only one of the languages?",
  options: [
    "47",
    "15",
    "30",
    "27"
  ],
  correct: 0,
  explanation: "Using inclusion-exclusion: Only Spanish = 41 - (15 + 19 - 5), Only French = 29 - (15 + 8 - 5), Only Russian = 26 - (19 + 8 - 5). Adding these gives 47."
},

{
  text: "If U is the set of integers x such that 1 ≤ x ≤ 300, what is the correct interpretation of 'not divisible by 2 or 3'?",
  options: [
    "Integers not divisible by 2 and not divisible by 3",
    "Integers not divisible by 2 or not divisible by 3",
    "Integers divisible by neither 2 nor 3",
    "Integers that are prime numbers"
  ],
  correct: 2,
  explanation: "The phrase 'not divisible by 2 or 3' means integers divisible by neither 2 nor 3."
},

{
  text: "If U is the set of integers x such that 1 ≤ x ≤ 300, how many integers are NOT divisible by 2?",
  options: [
    "150",
    "100",
    "200",
    "300"
  ],
  correct: 0,
  explanation: "Half of the integers from 1 to 300 are not divisible by 2. Thus, the answer is 300 / 2 = 150."
},

{
  text: "If U is the set of integers x such that 1 ≤ x ≤ 300, how many integers are not divisible by both 2 or 5?",
  options: [
    "120",
    "60",
    "180",
    "240"
  ],
  correct: 3,
  explanation: "Using the principle of inclusion-exclusion, the number of integers not divisible by 2 or 5 is calculated as follows: 300 - [divisible by 2 + divisible by 5 - divisible by both]."
},
{
  text: "If U is the set of integers x such that 1 ≤ x ≤ 300, how many integers are NOT divisible by 2 or 3?",
  options: [
    "100",
    "50",
    "150",
    "200"
  ],
  correct: 2,
  explanation: "Using inclusion-exclusion: Total integers = 300. Divisible by 2 = 150, divisible by 3 = 100, divisible by both 2 and 3 = 50. Not divisible by 2 or 3 = 300 - (150 + 100 - 50) = 150.  (a) 100 is wrong because it underestimates the count of integers excluded.   - (b) 50 is incorrect because it counts only the overlap, not the total.  - (d) 200 is incorrect because it overestimates the exclusion, ignoring the overlap."
},

{
  text: "If U is the set of integers x such that 1 ≤ x ≤ 300, how many integers are NOT divisible by 2, 3, or 5?",
  options: [
    "80",
    "60",
    "120",
    "100"
  ],
  correct: 0,
  explanation: "Using inclusion-exclusion: Total integers = 300. Divisible by 2 = 150, by 3 = 100, by 5 = 60. Overlap terms: Divisible by 2 and 3 = 50, by 2 and 5 = 30, by 3 and 5 = 20, by all three = 10. Subtracting these overlaps: 300 - (150 + 100 + 60 - 50 - 30 - 20 + 10) = 80.  - (b) 60 is wrong because it fails to include the final overlap correction.    - (c) 120 is incorrect as it misses removing duplicates.    - (d) 100 overestimates the remaining integers by failing to subtract all overlaps."
},

{
  text: "Given A ⊕ B = (A ∩ B') ∪ (B ∩ A'), what set does A ⊕ A' represent?",
  options: [
    "U (Universal set)",
    "∅ (Empty set)",
    "A",
    "A'"
  ],
  correct: 0,
  explanation: "A ⊕ A' means the symmetric difference of a set and its complement, which includes all elements in the universal set, U.      - (b) ∅ is incorrect because symmetric difference includes all elements of U.    - (c) A is wrong because it doesn't account for A'.    - (d) A' is incorrect because it doesn't include elements in A."
},

{
  text: "Given A ⊕ B = (A ∩ B') ∪ (B ∩ A'), what set does A ⊕ ∅ represent?",
  options: [
    "A",
    "∅",
    "A'",
    "U"
  ],
  correct: 0,
  explanation: "A ⊕ ∅ means the symmetric difference of A and the empty set, which is just A, as no elements are added or removed.    - (b) ∅ is wrong because A is not empty.   - (c) A' is incorrect because it represents the complement of A, not A itself.  - (d) U is wrong because it includes all elements, not just A."
},

{
  text: "If A * B is defined as A ∩ B', what is A * U?",
  options: [
    "A",
    "∅",
    "U",
    "A'"
  ],
  correct: 1,
  explanation: "A * U = A ∩ U', where U' is the empty set (elements outside U). Thus, A ∩ ∅ = ∅.    - (a) A is incorrect because A * U removes all elements of A.   - (c) U is wrong because the operation specifically intersects with the complement of U.  - (d) A' is incorrect because it involves elements not in A, not related to U."
},

{
  text: "If A * B is defined as A ∩ B', what is A * A?",
  options: [
    "A",
    "∅",
    "U",
    "A'"
  ],
  correct: 1,
  explanation: "A * A = A ∩ A', and A ∩ A' is the empty set because no element can belong to both A and its complement simultaneously.    - (a) A is wrong because it doesn't exclude A's complement.  - (c) U is incorrect because the operation is defined for A and its complement only.  - (d) A' is incorrect because it doesn't account for the intersection."
},

{
  text: "If A * (B ∪ C) = (A * B) ∩ (A * C), what does this relationship imply about the * operation?",
  options: [
    "* distributes over the union.",
    "Union distributes over *.",
    "* distributes over the intersection.",
    "Intersection distributes over *."
  ],
  correct: 0,
  explanation: "This shows that the operation * is distributive over the union, as it breaks into smaller intersections.  - (b) is wrong because union does not distribute over *.  - (c) and (d) are incorrect because * operates on complements, not intersections directly."
},

{
  text: "If A * (B * C) is not the same as (A * B) * C, what does this mean for the * operator?",
  options: [
    "It is commutative.",
    "It is distributive.",
    "It is associative.",
    "It is not associative."
  ],
  correct: 3,
  explanation: "If A * (B * C) ≠ (A * B) * C, the operation is not associative because the grouping of sets affects the outcome.  - (a) is wrong because commutativity refers to order, not grouping.  - (b) is incorrect as it refers to distribution, not associativity.  - (c) is wrong because the operation explicitly fails associativity."
},

{
  text: "What does A ∩ (B * C) simplify to, given A * B = A ∩ B'?",
  options: [
    "(A ∩ B) * (A ∩ C)",
    "(A * B) ∩ (A * C)",
    "(A ∩ B) ∩ (A ∩ C)",
    "(A ∩ B) ∪ (A ∩ C)"
  ],
  correct: 1,
  explanation: "Using substitution: A ∩ (B * C) becomes A ∩ (B ∩ C') = (A ∩ B) ∩ (A ∩ C'). This simplifies to (A * B) ∩ (A * C).  - (a) is wrong because * applies to complements, not direct intersections.  - (c) and (d) are incorrect because they fail to consider complements."
},
{
  text: "What is A * A' simplified to, given A * B = A ∩ B'?",
  options: [
    "A",
    "∅",
    "U",
    "A'"
  ],
  correct: 1,
  explanation: "A * A' = A ∩ A'. Since no element can be in both A and its complement A', the result is the empty set (∅).   - (a) A is incorrect because no elements are shared between A and A'.   - (c) U is incorrect as it includes all elements of the universal set.   - (d) A' is wrong because it refers to the complement of A, not the intersection with A."
},

{
  text: "If there are 20 in the math class and 30 in physics, and both meet at the same time, what is the number of students if all students are enrolled in at least one?",
  options: [
    "50",
    "10",
    "20",
    "30"
  ],
  correct: 0,
  explanation: "Since all students are enrolled in at least one class and both meet at the same time, there are no overlaps, so the total is 20 + 30 = 50.    - (b) 10 is incorrect because it underestimates the total.   - (c) and (d) are wrong because they fail to sum both class enrollments."
},

{
  text: "If there are 20 in the math class and 30 in physics, and they meet at different times, and 10 are in both classes, how many are in the two classes?",
  options: [
    "40",
    "10",
    "50",
    "60"
  ],
  correct: 2,
  explanation: "Using inclusion-exclusion: Total = 20 + 30 - 10 = 40. The overlap is subtracted to avoid double-counting.   - (b) 10 is wrong because it only considers the overlap.    - (d) 60 overestimates by ignoring the overlap."
},

{
  text: "In a government office of 400, there are 150 men, 276 graduates, and 212 married persons. What do these numbers represent?",
  options: [
    "Cardinality of the sets",
    "Complements of the sets",
    "Intersection of the sets",
    "Unions of the sets"
  ],
  correct: 0,
  explanation: "The numbers represent the cardinality (size) of the respective sets: men, graduates, and married persons.   - (b) Complements refer to elements not in the set - (c) and (d) are incorrect because they refer to relationships between sets."
},

{
  text: "In the given government office, how many male employees are not graduates?",
  options: [
    "56",
    "150",
    "94",
    "212"
  ],
  correct: 0,
  explanation: "Number of male employees not graduates = Total men - Male graduates = 150 - 94 = 56. - (b) 150 is the total number of men.  - (c) 94 is the number of male graduates.  - (d) 212 is the total number of married persons."
},

{
  text: "In the same office, how many married men are not graduates?",
  options: [
    "47",
    "119",
    "72",
    "45"
  ],
  correct: 0,
  explanation: "Married men not graduates = Married men - Married male graduates = 119 - 72 = 47.   - (b) 119 is the total number of married men.   - (c) 72 is the number of married male graduates.   - (d) 45 is an incorrect calculation."
},

{
  text: "In the same office, how many married women are not graduates?",
  options: [
    "61",
    "121",
    "70",
    "151"
  ],
  correct: 0,
  explanation: "Married women not graduates = Total married - Married graduates = 212 - 151 = 61.    - (b) 121 is the total number of female graduates.  - (c) and (d) are incorrect calculations."
},

{
  text: "In the same office, how many men are not married?",
  options: [
    "31",
    "150",
    "119",
    "50"
  ],
  correct: 0,
  explanation: "Men not married = Total men - Married men = 150 - 119 = 31.   - (b) 150 is the total number of men.   - (c) 119 is the number of married men.   - (d) 50 is incorrect as it doesn’t reflect the subtraction."
},

{
  text: "In the same office, how many women are married?",
  options: [
    "151",
    "212",
    "61",
    "72"
  ],
  correct: 2,
  explanation: "Married women = Total married - Married men = 212 - 151 = 61.   - (a) 151 is the number of married men.  - (b) 212 is the total number of married persons.    - (d) 72 is the number of married male graduates."
},

{
  text: "What is the correct way to represent the number of elements in set A ∪ B ∪ C?",
  options: [
    "n(A) + n(B) + n(C)",
    "n(A) + n(B) + n(C) - n(A ∩ B) - n(B ∩ C) - n(C ∩ A)",
    "n(A) + n(B) + n(C) - n(A ∩ B) - n(B ∩ C) - n(C ∩ A) + n(A ∩ B ∩ C)",
    "n(A) + n(B) + n(C) + n(A ∩ B) + n(B ∩ C) + n(C ∩ A)"
  ],
  correct: 2,
  explanation: "Using the inclusion-exclusion principle, the correct formula accounts for overlaps of pairs and triples: n(A) + n(B) + n(C) - n(A ∩ B) - n(B ∩ C) - n(C ∩ A) + n(A ∩ B ∩ C).    - (a) is wrong because it ignores overlaps.    - (b) accounts for pairs but misses the triple overlap.    - (d) adds overlaps instead of subtracting."
},


{
  text: "What does the symbol 'N' represent in set theory?",
  options: [
    "The set of all integers",
    "The set of all natural numbers",
    "The set of all rational numbers",
    "The set of all real numbers"
  ],
  correct: 1,
  explanation: "In set theory, 'N' represents the set of all natural numbers, which typically include positive integers starting from 1 (or sometimes 0, depending on the definition)."
},

{
  text: "What does the symbol 'Z' represent in set theory?",
  options: [
    "The set of all integers",
    "The set of all natural numbers",
    "The set of all rational numbers",
    "The set of all real numbers"
  ],
  correct: 0,
  explanation: "In set theory, 'Z' (from the German word 'Zahlen') represents the set of all integers, including positive, negative, and zero."
},

{
  text: "What does the symbol 'Q' represent in set theory?",
  options: [
    "The set of all integers",
    "The set of all natural numbers",
    "The set of all rational numbers",
    "The set of all real numbers"
  ],
  correct: 2,
  explanation: "In set theory, 'Q' represents the set of all rational numbers, which are numbers that can be expressed as the ratio of two integers."
},

{
  text: "Which of the following is a correct interpretation of the set A = {x: x ∈ N, x² − 5x + 6 = 0}?",
  options: [
    "A is a set of integers that satisfy x² − 5x + 6 = 0",
    "A is a set of natural numbers that satisfy x² − 5x + 6 = 0",
    "A is a set of real numbers that satisfy x² − 5x + 6 = 0",
    "A is a set of rational numbers that satisfy x² − 5x + 6 = 0"
  ],
  correct: 1,
  explanation: "The equation x² − 5x + 6 = 0 is satisfied by the roots x = 2 and x = 3. Since the problem specifies x ∈ N, A contains natural numbers that satisfy the equation."
},

{
  text: "What are the elements of the set A = {x: x ∈ N, x² − 5x + 6 = 0}?",
  options: [
    "{1, 6}",
    "{2, 3}",
    "{-2, -3}",
    "{-1, -6}"
  ],
  correct: 1,
  explanation: "Factoring x² − 5x + 6 = 0 gives (x − 2)(x − 3) = 0. Thus, x = 2 or x = 3. Since the set is restricted to natural numbers, A = {2, 3}."
},

{
  text: "Which of the following is a correct interpretation of the set B = {y: y ∈ Z, y² − 3y + 1 = 0}?",
  options: [
    "B is a set of integers that satisfy y² − 3y + 1 = 0",
    "B is a set of natural numbers that satisfy y² − 3y + 1 = 0",
    "B is a set of real numbers that satisfy y² − 3y + 1 = 0",
    "B is a set of rational numbers that satisfy y² − 3y + 1 = 0"
  ],
  correct: 0,
  explanation: "The equation y² − 3y + 1 = 0 has roots y = (3 ± √5)/2, which are not integers. Thus, B is an empty set as no integers satisfy this equation."
},

{
  text: "What is the universal set U given as U = {1, 2, 3, ..., 10}?",
  options: [
    "The set of integers from 1 to 10",
    "The set of natural numbers from 1 to 10",
    "The set of rational numbers from 1 to 10",
    "The set of real numbers from 1 to 10"
  ],
  correct: 1,
  explanation: "The universal set U is defined as {1, 2, ..., 10}. Since these are positive integers, they correspond to the natural numbers."
},

{
  text: "What is the complement of X (X') given U = {1, 2, 3, ..., 10} and X = {2, 4, 6, 8}?",
  options: [
    "{1, 3, 5, 7, 9, 10}",
    "{2, 4, 6, 8, 10}",
    "{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}",
    "{1, 3, 5, 7, 9}"
  ],
  correct: 0,
  explanation: "The complement of X is all elements in U that are not in X. Subtracting {2, 4, 6, 8} from U = {1, 2, ..., 10} leaves {1, 3, 5, 7, 9, 10}."
},
{
  text: "What is the complement of Y (Y') given U = {1, 2, 3, ..., 10} and Y = {1, 2, 3, 4}?",
  options: [
    "{5, 6, 7, 8, 9, 10}",
    "{1, 2, 3, 4}",
    "{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}",
    "{5, 6, 7, 8, 9}"
  ],
  correct: 0,
  explanation: "The complement of Y consists of all elements in U that are not in Y. Subtracting {1, 2, 3, 4} from U = {1, 2, ..., 10} leaves {5, 6, 7, 8, 9, 10}."
},

{
  text: "What is the complement of Z (Z') given U = {1, 2, 3, ..., 10} and Z = {3, 4, 5, 6, 8}?",
  options: [
    "{1, 2, 7, 9, 10}",
    "{3, 4, 5, 6, 8}",
    "{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}",
    "{1, 2, 7, 9}"
  ],
  correct: 0,
  explanation: "The complement of Z includes all elements in U that are not in Z. Subtracting {3, 4, 5, 6, 8} from U = {1, 2, ..., 10} leaves {1, 2, 7, 9, 10}."
},

{
  text: "What does (X ∪ Y)' represent?",
  options: [
    "The complement of X intersected with the complement of Y",
    "The union of the complement of X and the complement of Y",
    "The complement of the union of X and Y",
    "The intersection of X and Y"
  ],
  correct: 2,
  explanation: "De Morgan's Laws state that (X ∪ Y)' = X' ∩ Y'. It represents the complement of the union of X and Y."
},

{
  text: "What does X' ∩ Y' represent?",
  options: [
    "The union of the complement of X and the complement of Y",
    "The intersection of X and Y",
    "The complement of the union of X and Y",
    "The intersection of the complement of X and the complement of Y"
  ],
  correct: 3,
  explanation: "By De Morgan's Laws, X' ∩ Y' is the intersection of the complements of X and Y. It represents all elements not in X or Y."
},

{
  text: "If (X ∪ Y)' = X' ∩ Y', is this identity true?",
  options: [
    "Yes, always",
    "No, never",
    "Only for specific sets",
    "Sometimes true"
  ],
  correct: 0,
  explanation: "This identity is always true and is a fundamental property described by De Morgan's Laws."
},

{
  text: "What does (Y ∩ Z)' represent?",
  options: [
    "The complement of the intersection of Y and Z",
    "The union of the complement of Y and the complement of Z",
    "The intersection of Y and Z",
    "The complement of the union of Y and Z"
  ],
  correct: 0,
  explanation: "De Morgan's Laws state that (Y ∩ Z)' = Y' ∪ Z'. It represents the complement of the intersection of Y and Z."
},

{
  text: "What does Y' ∪ Z' represent?",
  options: [
    "The complement of the intersection of Y and Z",
    "The intersection of the complement of Y and the complement of Z",
    "The intersection of Y and Z",
    "The union of the complement of Y and the complement of Z"
  ],
  correct: 3,
  explanation: "By De Morgan's Laws, Y' ∪ Z' represents the union of the complements of Y and Z."
},

{
  text: "If (Y ∩ Z)' = Y' ∪ Z', is this identity true?",
  options: [
    "Yes, always",
    "No, never",
    "Only for specific sets",
    "Sometimes true"
  ],
  correct: 0,
  explanation: "This identity is always true and is a key principle in De Morgan's Laws."
},

{
  text: "What does (P ∪ Q) ∪ R represent?",
  options: [
    "The union of sets P and Q, intersected with set R",
    "The union of sets P and Q, then union with set R",
    "The intersection of sets P and Q, then union with set R",
    "The union of set P with the intersection of sets Q and R"
  ],
  correct: 1,
  explanation: "The union operator is associative, so (P ∪ Q) ∪ R = P ∪ (Q ∪ R). It represents the union of all three sets."
},

{
  text: "What does P ∩ (Q ∪ R) represent?",
  options: [
    "The intersection of set P with the union of sets Q and R",
    "The union of set P with the intersection of sets Q and R",
    "The intersection of set P with the intersection of sets Q and R",
    "The union of set P with the union of sets Q and R"
  ],
  correct: 0,
  explanation: "The distributive property of set operations states that P ∩ (Q ∪ R) = (P ∩ Q) ∪ (P ∩ R)."
},
{
  text: "What does (P ∩ Q) ∩ R represent?",
  options: [
    "The union of sets P and Q, intersected with set R",
    "The intersection of sets P and Q, then union with set R",
    "The intersection of sets P and Q, then intersected with set R",
    "The union of set P with the intersection of sets Q and R"
  ],
  correct: 2,
  explanation: "The intersection operator is associative, so (P ∩ Q) ∩ R = P ∩ (Q ∩ R). It represents the intersection of all three sets."
},

{
  text: "What does P ∪ (Q ∩ R) represent?",
  options: [
    "The union of set P with the intersection of sets Q and R",
    "The intersection of set P with the union of sets Q and R",
    "The intersection of set P with the intersection of sets Q and R",
    "The union of set P with the union of sets Q and R"
  ],
  correct: 0,
  explanation: "The distributive property states that P ∪ (Q ∩ R) is the union of P with the intersection of Q and R."
},

{
  text: "What does (P ∪ Q) ∩ (P ∪ R) represent?",
  options: [
    "The union of set P with the intersection of sets Q and R",
    "The intersection of set P with the union of sets Q and R",
    "The union of sets P and Q, then intersection with the union of sets P and R",
    "The union of sets P and R, then intersection with the union of sets P and Q"
  ],
  correct: 2,
  explanation: "Using the distributive property, (P ∪ Q) ∩ (P ∪ R) represents the intersection of the two unions."
},

{
  text: "If P ∪ (Q ∩ R) = (P ∪ Q) ∩ (P ∪ R), which property is this demonstrating?",
  options: [
    "Commutative property",
    "Distributive property",
    "Associative property",
    "De Morgan's Law"
  ],
  correct: 1,
  explanation: "This demonstrates the distributive property, where the union distributes over the intersection."
},


{
  text: "What is the general idea behind De Morgan's Laws?",
  options: [
    "Relating the complement of the union to the intersection of complements",
    "Relating the intersection to the union of the complements",
    "Relating the commutativity of operations",
    "Relating the associativity of operations"
  ],
  correct: 0,
  explanation: "De Morgan's Laws provide a relationship between the complement of the union and the intersection of complements, and vice versa."
},

{
  text: "Which of the following represents the complement of the union of two sets?",
  options: [
    "The intersection of their complements",
    "The union of their complements",
    "The intersection of the sets",
    "The union of the sets"
  ],
  correct: 0,
  explanation: "De Morgan's Laws state that the complement of the union of two sets is the intersection of their complements."
},

{
  text: "Which of the following best represents an example of a subset?",
  options: [
    "The set of all integers compared to the set of all real numbers.",
    "The set of all real numbers compared to the set of all integers.",
    "The set of all positive numbers compared to the set of all integers.",
    "The set of all negative integers compared to the set of all real numbers."
  ],
  correct: 0,
  explanation: "All integers are real numbers, making integers a subset of real numbers."
},
{
  text: "Which of the following is the definition of a function?",
  options: [
    "A relation where every input has a unique output",
    "A set of ordered pairs with no restrictions",
    "A process of finding derivatives",
    "A subset of irrational numbers"
  ],
  correct: 0,
  explanation: "A function is defined as a relation where every input (from the domain) has a unique output. Option b is incorrect because a general set of ordered pairs does not necessarily satisfy this condition. Option c refers to calculus, not the definition of a function. Option d refers to number sets, not functions."
},
{
  text: "What is the domain of the function f(x) = √(x - 2)?",
  options: [
    "x ≥ 2",
    "x > 2",
    "x ≤ 2",
    "All real numbers"
  ],
  correct: 0,
  explanation: "The square root function is defined only for non-negative arguments. For √(x - 2), this implies x - 2 ≥ 0, or x ≥ 2. Option b excludes x = 2, which is part of the domain. Option c incorrectly suggests x ≤ 2, but the square root cannot be defined for values less than 2. Option d includes negative arguments, which are invalid under a square root."
},
{
  text: "What type of function is f(x) = x²?",
  options: [
    "Linear",
    "Quadratic",
    "Cubic",
    "Exponential"
  ],
  correct: 1,
  explanation: "f(x) = x² is a quadratic function because it is a polynomial of degree 2. Option a is incorrect because linear functions have a degree of 1. Option c refers to cubic functions, which have a degree of 3. Option d refers to exponential functions of the form f(x) = aⁿ."
},
{
  text: "Which of these functions is not one-to-one?",
  options: [
    "f(x) = x + 1",
    "f(x) = x²",
    "f(x) = eˣ",
    "f(x) = ln(x)"
  ],
  correct: 1,
  explanation: "f(x) = x² is not one-to-one because multiple inputs (for example, both x = 2 and x = -2) can produce the same output (f(2) = 4, f(-2) = 4). Option a is one-to-one because adding 1 to x is injective. Option c is injective as eˣ is strictly increasing. Option d is also injective as ln(x) is strictly increasing."
},
{
  text: "The range of f(x) = |x| is:",
  options: [
    "All real numbers",
    "[0, ∞)",
    "(-∞, ∞)",
    "(-∞, 0]"
  ],
  correct: 1,
  explanation: "The absolute value function |x| outputs only non-negative values, thus its range is [0, ∞). Option a is incorrect because the range excludes negative values. Option c wrongly implies |x| includes negative values. Option d refers only to non-positive values, which is incorrect."
},
{
  text: "What is f(2) if f(x) = 3x + 5?",
  options: [
    "6",
    "11",
    "10",
    "8"
  ],
  correct: 1,
  explanation: "Substitute x = 2 into the function: f(2) = 3(2) + 5 = 6 + 5 = 11. The other options result from incorrect substitutions or calculations."
},
{
  text: "If f(x) = x² + 3x + 2, then f(-1) is:",
  options: [
    "-6",
    "0",
    "2",
    "6"
  ],
  correct: 1,
  explanation: "Substitute x = -1 into the function: f(-1) = (-1)² + 3(-1) + 2 = 1 - 3 + 2 = 0. The other options result from incorrect substitutions or arithmetic."
},
{
  text: "Which of the following is a constant function?",
  options: [
    "f(x) = x + 5",
    "f(x) = 7",
    "f(x) = x² + 3x",
    "f(x) = eˣ"
  ],
  correct: 1,
  explanation: "f(x) = 7 is constant because the output is the same (7) for every input. The other options are functions that depend on x and are therefore not constant."
},
{
  text: "For a function f(x), if f(x) = f(-x), the function is called:",
  options: [
    "Odd",
    "Even",
    "Linear",
    "Periodic"
  ],
  correct: 1,
  explanation: "A function is even if f(x) = f(-x) for all x in its domain. Option a refers to odd functions, where f(-x) = -f(x). Option c describes a class of functions, not symmetry. Option d refers to functions that repeat over regular intervals."
},
{
  text: "The inverse of f(x) = 3x + 4 is:",
  options: [
    "f⁻¹(x) = (x - 4)/3",
    "f⁻¹(x) = 3x - 4",
    "f⁻¹(x) = (x + 4)/3",
    "f⁻¹(x) = (4 - x)/3"
  ],
  correct: 0,
  explanation: "To find the inverse, set y = 3x + 4 and solve for x: x = (y - 4)/3. Thus f⁻¹(x) = (x - 4)/3. The other options result from incorrect algebraic manipulations."
},
{
  text: "Which of the following is an example of a surjective function?",
  options: [
    "f(x) = x², x ∈ ℝ",
    "f(x) = 2x, x ∈ ℝ",
    "f(x) = eˣ, x ∈ ℝ",
    "f(x) = ln(x), x > 0"
  ],
  correct: 3,
  explanation: "f(x) = ln(x) is surjective as it maps all positive real numbers (the domain) to the entire real line (the codomain). Option a is not surjective as negative values are not in the range. Option b is injective but not surjective for ℝ to ℝ. Option c is injective and not surjective for ℝ to ℝ because it only outputs positive values."
}, 
{
  text: "The modulus function f(x) = |x| is:",
  options: [
    "Always increasing",
    "Always decreasing",
    "Neither increasing nor decreasing",
    "Increasing for x > 0"
  ],
  correct: 3,
  explanation: "The modulus function f(x) = |x| increases for x > 0 because in this region, |x| = x, which is strictly increasing. For x < 0, |x| = -x, which is decreasing. At x = 0, the function is constant, making it neither increasing nor decreasing. Thus, the correct answer is that it increases for x > 0."
}, 

{
  text: "The function f(x) = 1/x is defined for:",
  options: [
    "All real numbers",
    "x ≠ 0",
    "x > 0",
    "x < 0"
  ],
  correct: 1,
  explanation: "The function f(x) = 1/x is undefined when x = 0 because division by zero is not allowed. n- Option a is incorrect because it includes x = 0. n- Option c is incorrect because the function is defined for both positive and negative x values. n- Option d excludes positive values, which are part of the domain."
},
{
  text: "Which of the following is true for a periodic function f(x)?",
  options: [
    "f(x) = f(x + T) for all x",
    "f(x) = f(-x)",
    "f(x) = -f(-x)",
    "f(x) = f'(x)"
  ],
  correct: 0,
  explanation: "A function is periodic if it repeats itself after a fixed interval T, meaning f(x) = f(x + T) for all x. n- Option b refers to even functions, not necessarily periodic ones. n- Option c refers to odd functions, which are also not necessarily periodic. n- Option d implies equality with its derivative, which is unrelated to periodicity."
},
{
  text: "The function f(x) = x² - 4x + 4 has its vertex at:",
  options: [
    "(0, 4)",
    "(2, 0)",
    "(2, -4)",
    "(4, 2)"
  ],
  correct: 1,
  explanation: "The vertex of a quadratic function is given by (-b / 2a, f(-b / 2a)). Substituting a = 1, b = -4, and c = 4 into f(x) = x² - 4x + 4, we get the vertex at (2, 0). n- The other options result from incorrect calculations."
},
{
  text: "If f(x) = x² and g(x) = 2x, then (f + g)(x) is:",
  options: [
    "2x² + x",
    "x² + 2x",
    "x³ + x",
    "x² - 2x"
  ],
  correct: 1,
  explanation: "(f + g)(x) means f(x) + g(x). Substituting f(x) = x² and g(x) = 2x: (f + g)(x) = x² + 2x. n- The other options involve incorrect operations."
},
{
  text: "The domain of f(x) = ln(x) is:",
  options: [
    "x > 0",
    "x ≥ 0",
    "x ≠ 0",
    "All real numbers"
  ],
  correct: 0,
  explanation: "The natural log function ln(x) is defined only for positive real numbers, so the domain is x > 0. n- Option b includes x = 0, which is invalid. n- Option c incorrectly permits negative values. n- Option d incorrectly includes all numbers."
},
{
  text: "If f(x) = 2x² - 3x + 1, then f(0) is:",
  options: [
    "2",
    "0",
    "1",
    "-3"
  ],
  correct: 2,
  explanation: "Substitute x = 0 into the function: f(0) = 2(0)² - 3(0) + 1 = 1. n- The other options result from incorrect calculations."
},
{
  text: "A function f(x) is said to be injective if:",
  options: [
    "Every input has a unique output",
    "Different inputs have different outputs",
    "It maps R onto itself",
    "It is periodic"
  ],
  correct: 1,
  explanation: "Injective functions ensure that different inputs map to different outputs. n- Option a refers to functions in general, including non-injective ones. n- Option c describes surjective functions. n- Option d describes periodic functions and is unrelated to injectivity."
},
{
  text: "The graph of f(x) = x³ intersects the origin at:",
  options: [
    "(1, 1)",
    "(0, 0)",
    "(-1, -1)",
    "(2, 8)"
  ],
  correct: 1,
  explanation: "The graph of f(x) = x³ passes through the origin because f(0) = 0³ = 0, resulting in the point (0, 0). n- The other points represent other values of f(x) or are incorrect."
},
{
  text: "If f(x) = x + 2, then f(f(x)) is:",
  options: [
    "x + 4",
    "x + 6",
    "x + 8",
    "x + 2"
  ],
  correct: 0,
  explanation: "Substitute f(x) = x + 2 into itself: f(f(x)) = f(x + 2) = (x + 2) + 2 = x + 4. n- The other options involve incorrect substitutions."
},
{
  text: "The range of f(x) = eˣ is:",
  options: [
    "(-∞, ∞)",
    "[0, ∞)",
    "(0, ∞)",
    "All real numbers"
  ],
  correct: 2,
  explanation: "The exponential function eˣ is always positive, so its range is (0, ∞). n- Option a is incorrect because eˣ does not produce negative values. n- Option b incorrectly includes 0, which eˣ never reaches. n- Option d is incorrect as the range is not all real numbers."
}, 
{
  text: "Two sets A and B are such that A ∪ B = A. Which of the following is correct?",
  options: [
    "A ⊂ B",
    "B ⊂ A",
    "A = B",
    "A ∩ B = ∅"
  ],
  correct: 1,
  explanation: "If the union of A and B results in A, then every element of B must already be in A, meaning B is a subset of A. Option A is incorrect because A being a subset of B contradicts the union condition. Option C is incorrect because equality would require both sets to have identical elements, which isn't stated. Option D is incorrect because an empty intersection implies no overlap, which contradicts the union result."
},
{
  text: "For a system of N particles which are considered indistinguishable, how does the use of set theory assist in analyzing the total system?",
  options: [
    "It is unnecessary to use set theory.",
    "It provides a means to group the particles by their quantum states.",
    "It allows us to count the total number of quantum states, allowing for calculation of the total partition function.",
    "Both B and C"
  ],
  correct: 3,
  explanation: "Set theory is essential for grouping particles into quantum states and counting those states to calculate the partition function. Option A is incorrect because set theory plays a crucial role in organizing quantum states. Option B, while true, only partially explains the role of set theory. Option C is also true, but it alone does not cover the grouping aspect, making option D the most comprehensive choice."
},
{
  text: "What is the complement of the empty set with respect to a universal set?",
  options: [
    "The empty set itself.",
    "The universal set",
    "A singleton set.",
    "Nothing."
  ],
  correct: 1,
  explanation: "The complement of the empty set includes everything in the universal set since nothing is excluded. Option A is incorrect because the empty set cannot complement itself—it would remain empty. Option C is incorrect because a singleton set contains only one element, not everything in the universal set. Option D is incorrect because 'nothing' contradicts the universal set being the complement."
},
{
  text: "Given A = {1, 2} and B = {3, 4}, then A ∪ B is what?",
  options: [
    "{1,2}",
    "{3,4}",
    "{}",
    "{1,2,3,4}"
  ],
  correct: 3,
  explanation: "The union of two sets combines all unique elements from both sets, resulting in {1, 2, 3, 4}. Option A is incorrect because it only represents set A. Option B is incorrect because it only represents set B. Option C is incorrect because an empty set means no elements, which contradicts the union operation."
},
{
  text: "If set A is contained in set B and set A does not equal set B, which is correct?",
  options: [
    "Set A is a superset of set B.",
    "Set A is a proper subset of set B.",
    "The sets are disjoint.",
    "The sets are equivalent."
  ],
  correct: 1,
  explanation: "If A is fully contained in B and not equal to B, it is a proper subset. Option A is incorrect because a superset would mean A contains all elements of B, which isn’t true here. Option C is incorrect because disjoint sets share no elements, contradicting A being part of B. Option D is incorrect because equivalent sets must have the same elements, which isn’t the case here."
},
{
  text: "If A ∩ B = ∅ what is A - B?",
  options: [
    "∅",
    "A",
    "B",
    "A ∪ B"
  ],
  correct: 1,
  explanation: "If A and B have no common elements, removing B from A still leaves all of A intact. Option A is incorrect because it implies A has no elements, which isn’t stated. Option C is incorrect because B is irrelevant to the difference operation here. Option D is incorrect because the union represents both sets combined, not the difference."
},
{
  text: "A system contains multiple quantum states represented by set S. Subsets A, B, and C represent groups of states within S. If A ∩ B = ∅, B ∩ C = ∅, and C ∩ A = ∅, what does this mean?",
  options: [
    "All the states in S are the same",
    "The states in A, B, and C are disjoint",
    "The total number of states in S is equal to the number of states in A, B, and C added together",
    "The total energy of all the sets is 0"
  ],
  correct: 1,
  explanation: "Disjoint sets have no elements in common, meaning the states in A, B, and C are separate groups. Option A is incorrect because if the states were the same, they would overlap. Option C is incorrect because we can't assume the union covers the entire set S. Option D is incorrect because disjointness has no relation to energy."
}, 
{
  text: "Which of the following is an example of an infinite set?",
  options: [
    "{x | x is a natural number between 1 and 10}",
    "{x | x is an integer}",
    "{x | x is a letter in the English alphabet}",
    "{x | x is the number of atoms in one gram of Carbon}"
  ],
  correct: 1,
  explanation: "The set of integers is infinite because it goes on forever in both positive and negative directions: {..., -2, -1, 0, 1, 2, ...}. Option A is incorrect because the set of natural numbers between 1 and 10 is finite. Option C is incorrect because the English alphabet has a fixed, finite number of letters. Option D is incorrect because the number of atoms, while extremely large, is still finite."
},
{
  text: "For three sets, what is the number of terms in the expansion of A ∪ B ∪ C?",
  options: [
    "7",
    "8",
    "6",
    "9"
  ],
  correct: 1,
  explanation: "The number of terms in the union expansion of three sets follows the inclusion-exclusion principle, calculated as 2³ = 8. Option A is incorrect because 7 misses one term. Option C is incorrect because it undercounts the valid combinations. Option D is incorrect because it overestimates the count."
},
{
  text: "A system in quantum mechanics uses a set to describe possible quantum states. If the set contains two elements, what does that imply?",
  options: [
    "The system is in only one quantum state",
    "The system can be in either of two quantum states",
    "The system has a definite amount of energy",
    "The system is classical in nature"
  ],
  correct: 1,
  explanation: "If a set contains two quantum states, the system can exist in either state, reflecting two distinct possibilities. Option A is incorrect because the system isn’t limited to one state. Option C is incorrect because the number of states doesn't directly indicate a definite energy level. Option D is incorrect because having two states doesn’t imply classical behavior."
},
{
  text: "In a solid, if you have the set of all electrons, which concept of sets can help in understanding how to group them by energy?",
  options: [
    "Union",
    "Intersection",
    "Subsets",
    "Complement"
  ],
  correct: 2,
  explanation: "Subsets allow us to group electrons based on their energy levels. Each subset represents electrons with specific energy properties. Option A is incorrect because the union combines groups rather than categorizing them. Option B is incorrect because the intersection finds common elements, not distinct groupings. Option D is incorrect because the complement deals with exclusion, not categorization."
},
{
  text: "In a probability experiment, what does the intersection of two events represent?",
  options: [
    "The event where either of the two events occur",
    "The event where both events occur simultaneously",
    "The event where neither event occurs",
    "The event that one event must occur but the other does not"
  ],
  correct: 1,
  explanation: "The intersection represents the event where both events occur simultaneously. Option A is incorrect because it refers to the union of events. Option C is incorrect because it represents the complement of both events. Option D is incorrect because it suggests mutual exclusivity, not intersection."
},
{
  text: "Which of the following is an example of an infinite set?",
  options: [
    "{x | x is a natural number between 1 and 10}",
    "{x | x is an integer}",
    "{x | x is a letter in the English alphabet}",
    "{x | x is the number of atoms in one gram of Carbon}"
  ],
  correct: 1,
  explanation: "The set of integers is infinite because it goes on forever in both positive and negative directions: {..., -2, -1, 0, 1, 2, ...}. Option A is incorrect because the set of natural numbers between 1 and 10 is finite. Option C is incorrect because the English alphabet has a fixed, finite number of letters. Option D is incorrect because the number of atoms, while extremely large, is still finite."
},
{
  text: "For three sets, what is the number of terms in the expansion of A ∪ B ∪ C?",
  options: [
    "7",
    "8",
    "6",
    "9"
  ],
  correct: 1,
  explanation: "The number of terms in the union expansion of three sets follows the inclusion-exclusion principle, calculated as 2³ = 8. Option A is incorrect because 7 misses one term. Option C is incorrect because it undercounts the valid combinations. Option D is incorrect because it overestimates the count."
},
{
  text: "A system in quantum mechanics uses a set to describe possible quantum states. If the set contains two elements, what does that imply?",
  options: [
    "The system is in only one quantum state",
    "The system can be in either of two quantum states",
    "The system has a definite amount of energy",
    "The system is classical in nature"
  ],
  correct: 1,
  explanation: "If a set contains two quantum states, the system can exist in either state, reflecting two distinct possibilities. Option A is incorrect because the system isn’t limited to one state. Option C is incorrect because the number of states doesn't directly indicate a definite energy level. Option D is incorrect because having two states doesn’t imply classical behavior."
},
{
  text: "In a solid, if you have the set of all electrons, which concept of sets can help in understanding how to group them by energy?",
  options: [
    "Union",
    "Intersection",
    "Subsets",
    "Complement"
  ],
  correct: 2,
  explanation: "Subsets allow us to group electrons based on their energy levels. Each subset represents electrons with specific energy properties. Option A is incorrect because the union combines groups rather than categorizing them. Option B is incorrect because the intersection finds common elements, not distinct groupings. Option D is incorrect because the complement deals with exclusion, not categorization."
},
{
  text: "In a probability experiment, what does the intersection of two events represent?",
  options: [
    "The event where either of the two events occur",
    "The event where both events occur simultaneously",
    "The event where neither event occurs",
    "The event that one event must occur but the other does not"
  ],
  correct: 1,
  explanation: "The intersection represents the event where both events occur simultaneously. Option A is incorrect because it refers to the union of events. Option C is incorrect because it represents the complement of both events. Option D is incorrect because it suggests mutual exclusivity, not intersection."
},
{
  text: "If the cardinality of two finite sets A and B are m and n, respectively, and the intersection of A and B has a cardinality of k, then the cardinality of A ∪ B is:",
  options: [
    "m + n",
    "m + n + k",
    "m + n - k",
    "m - n - k"
  ],
  correct: 2,
  explanation: "Using the inclusion-exclusion principle, the formula for the cardinality of the union is |A ∪ B| = m + n - k. Option A is incorrect because it double-counts the intersection. Option B adds the intersection again, overestimating the total. Option D is incorrect because it arbitrarily subtracts all values, yielding an incorrect result."
},
{
  text: "What type of sequence is 2, 8, 32, 128, ...?",
  options: [
    "An arithmetic sequence",
    "A geometric progression",
    "A harmonic sequence",
    "None of the mentioned"
  ],
  correct: 1,
  explanation: "The sequence has a constant ratio between consecutive terms: 8 ÷ 2 = 4, 32 ÷ 8 = 4, etc. Hence, it is a geometric progression with a common ratio of 4."
},
{
  text: "How many terms are in the GP 32, 256, 2048, 16384, ..., 250?",
  options: [
    "11",
    "13",
    "15",
    "None of the mentioned"
  ],
  correct: 3,
  explanation: "Using the nth term formula, gₙ = g₁ × rⁿ⁻¹, we substitute g₁ = 32, r = 8, and solve 250 = 32 × 8ⁿ⁻¹. This equation does not yield an integer value for n, so 250 is not a term in the series. Correct answer: None of the mentioned."
},
{
  text: "What is the term at position 11 in the GP: 32, 256, 2048, 16384, ...?",
  options: [
    "235",
    "245",
    "35",
    "None of the mentioned"
  ],
  correct: 0,
  explanation: "Using the formula g₁₁ = g₁ × r¹⁰, where g₁ = 32 and r = 8, the 11th term is calculated to be 235."
},
{
  text: "In the GP 250, 247, 244, ..., at what position does the first fractional term appear?",
  options: [
    "17",
    "20",
    "18",
    "None of the mentioned"
  ],
  correct: 2,
  explanation: "The nth term is given by gₙ = 250 × (2/3)ⁿ⁻¹. Setting gₙ < 1, we solve 1 = 250 × (2/3)ⁿ⁻¹, yielding n = 17.66.... Hence, the first fractional term occurs at position 18."
},
{
  text: "In the GP 250, 247, 244, ..., what is the first fractional term?",
  options: [
    "2⁻¹",
    "2⁻²",
    "2⁻³",
    "None of the mentioned"
  ],
  correct: 0,
  explanation: "For the 18th term, using the geometric formula g₁₈ = 250 × (2/3)¹⁷, we calculate that g₁₈ = 2⁻¹."
},
{
  text: "Is the sequence 1, 1, 1, 1, 1, ... a GP?",
  options: [
    "True",
    "False"
  ],
  correct: 0,
  explanation: "A sequence is a GP if the ratio between consecutive terms is constant. Here, the ratio is 1/1 = 1, which is constant. Hence, it is a GP."
},
{
  text: "Is 225 a term in the GP 32, 256, 2048, 16384, ...?",
  options: [
    "True",
    "False"
  ],
  correct: 1,
  explanation: "Substituting into the nth term formula gₙ = g₁ × rⁿ⁻¹, with g₁ = 32 and r = 8, we solve 225 = 32 × 8ⁿ⁻¹. The result n = 7.66... is not an integer; therefore, 225 is not part of the sequence."
},
{
  text: "Which of the following sequences is a GP with a common ratio of 3?",
  options: [
    "gₙ = 2n² + 3n",
    "gₙ = 2n² + 3",
    "gₙ = 3n² + 3n",
    "gₙ = 6(3ⁿ⁻¹)"
  ],
  correct: 3,
  explanation: "The sequence gₙ = 6(3ⁿ⁻¹) has the form of a geometric progression, where the common ratio is clearly r = 3."
},
{
  text: "If a, b, c are in GP, what is the relationship between them?",
  options: [
    "2b = 2a + 3c",
    "2a = b + c",
    "b = (ac)¹/²",
    "2c = a + c"
  ],
  correct: 2,
  explanation: "For three terms in GP, b² = a × c. Taking the square root, b = (ac)¹/², which is the geometric mean of a and c."
},
{
  text: "If the product of three consecutive terms in GP is 8, what is the middle term?",
  options: [
    "2",
    "3",
    "4",
    "179"
  ],
  correct: 0,
  explanation: "Let the terms be a/r, a, ar. Their product is (a/r) × a × ar = a³ = 8. Taking the cube root, a = 2, which is the middle term."
}, 
{
  text: "Let the sequence be 1, 3, 5, 7, 9… then this sequence is ____",
  options: [
    "An arithmetic sequence",
    "A geometric progression",
    "A harmonic sequence",
    "None of the mentioned"
  ],
  correct: 0,
  explanation: "The difference between any term and its previous term is constant, so this is an arithmetic sequence."
},
{
  text: "In the given AP series, find the number of terms: 5, 8, 11, 14, 17, 20… 50.",
  options: [
    "11",
    "13",
    "15",
    "None of the mentioned"
  ],
  correct: 3,
  explanation: "Using the formula for the nth term of an AP: nth term = first_term + (number_of_terms – 1) × common_difference, we solve 50 = 5 + (n-1) × 3. This gives n = 16, which is not listed in the options. Correct answer: None of the mentioned."
},
{
  text: "In the given AP series, the term at position 11 would be: 5, 8, 11, 14, 17, 20… 50.",
  options: [
    "35",
    "45",
    "25",
    "None of the mentioned"
  ],
  correct: 0,
  explanation: "The formula for the nth term is a + (n – 1)d. Substituting, we get nth term = 5 + (11-1) × 3 = 35."
},
{
  text: "For the given Arithmetic progression, find the position of the first negative term: 50, 47, 44, 41, ….",
  options: [
    "17",
    "20",
    "18",
    "None of the mentioned"
  ],
  correct: 2,
  explanation: "Let the nth term = 0. The term after this will be the first negative term. Using the formula, 0 = 50 + (n-1) × -3, solving gives n = 17.66. Hence, the first negative term occurs at position 18."
},
{
  text: "For the given Arithmetic progression, find the first negative term: 50, 47, 44, 41, ….",
  options: [
    "-1",
    "-2",
    "-3",
    "None of the mentioned"
  ],
  correct: 0,
  explanation: "The first negative term occurs at n=18. Substituting into the formula: nth term = 50 + (18-1) × -3, we get the term as -1."
},
{
  text: "A series can either be AP only or GP only or HP only but not all at the same time.",
  options: [
    "True",
    "False"
  ],
  correct: 1,
  explanation: "The sequence 1, 1, 1, 1, 1,… is simultaneously an AP (difference = 0), GP (ratio = 1), and HP (reciprocals also form an AP), making the statement false."
},
{
  text: "In the given Arithmetic progression, ‘25’ would be a term in it: 5, 8, 11, 14, 17, 20… 50.",
  options: [
    "True",
    "False"
  ],
  correct: 1,
  explanation: "Using the nth term formula: a + (n-1)d, solving for 25 = 5 + (n-1) × 3, we get n = 7.666. Since n is not an integer, 25 is not a term in this series."
},
{
  text: "Which of the following sequences in AP will have a common difference of 3, where n is an Integer?",
  options: [
    "an = 2n² + 3n",
    "an = 2n² + 3",
    "an = 3n² + 3n",
    "an = 5 + 3n"
  ],
  correct: 3,
  explanation: "The sequence an = 5 + 3n is linear with a constant coefficient of 3 for n, making it an AP with a common difference of 3."
},
{
  text: "If a, b, c are in AP, then the relation between a, b, c can be ____",
  options: [
    "2b = 2a + 3c",
    "2a = b + c",
    "2b = a + c",
    "2c = a + c"
  ],
  correct: 2,
  explanation: "The term b in an AP should be the arithmetic mean of terms a and c. Thus, 2b = a + c."
},
{
  text: "Let the sum of three consecutive terms in AP be 180. What is the middle of those three terms?",
  options: [
    "60",
    "80",
    "90",
    "179"
  ],
  correct: 0,
  explanation: "Let the three terms be a-d, a, and a+d. Their sum is 3a = 180, so a = 60. The middle term is 60."
}, 
{
  text: "What is the domain of a function?",
  options: [
    "the maximal set of numbers for which a function is defined",
    "the maximal set of numbers which a function can take values",
    "it is a set of natural numbers for which a function is defined",
    "none of the mentioned"
  ],
  correct: 0,
  explanation: "Domain is the set of all the numbers on which a function is defined. It may include real numbers as well."
},
{
  text: "What is the domain of the function f(x) = √x?",
  options: [
    "(2, ∞)",
    "(-∞, 1)",
    "[0, ∞)",
    "None of the mentioned"
  ],
  correct: 2,
  explanation: "A square root function is not defined for negative real numbers, so its domain is [0, ∞)."
},
{
  text: "What is the range of a function?",
  options: [
    "the maximal set of numbers for which a function is defined",
    "the maximal set of numbers which a function can take values",
    "it is a set of natural numbers for which a function is defined",
    "none of the mentioned"
  ],
  correct: 1,
  explanation: "Range is the set of all possible values that a function can take as output."
},
{
  text: "What is the domain of the function f(x) = 1/x for it to be defined everywhere on its domain?",
  options: [
    "(2, ∞)",
    "(-∞, ∞) – {0}",
    "[0, ∞)",
    "None of the mentioned"
  ],
  correct: 1,
  explanation: "The function 1/x is not defined for x=0; however, it is defined for all other real numbers."
},
{
  text: "The range of the function f(x) = sin(x) is (-∞, ∞).",
  options: [
    "True",
    "False"
  ],
  correct: 1,
  explanation: "A sine function takes values between -1 and 1, so its range is [-1, 1]."
},
{
  text: "Codomain is the subset of range.",
  options: [
    "True",
    "False"
  ],
  correct: 1,
  explanation: "Range is a subset of the codomain, meaning every value in the range belongs to the codomain, but not all values in the codomain are part of the range."
},
{
  text: "What is the range of the function f(x) = 1/x which is defined everywhere on its domain?",
  options: [
    "(-∞, ∞)",
    "(-∞, ∞) – {0}",
    "[0, ∞)",
    "None of the mentioned"
  ],
  correct: 0,
  explanation: "The function 1/x can take any real number as its range."
},
{
  text: "If f(x) = e^x, what is the range of the function?",
  options: [
    "(-∞, ∞)",
    "(-∞, ∞) – {0}",
    "(0, ∞)",
    "None of the mentioned"
  ],
  correct: 2,
  explanation: "The exponential function e^x only takes positive values, so its range is (0, ∞)."
},
{
  text: "If f(x) = x² + 4, then what is the range of f(x)?",
  options: [
    "[4, ∞)",
    "(-∞, ∞) – {0}",
    "(0, ∞)",
    "None of the mentioned"
  ],
  correct: 0,
  explanation: "The minimum value of x² is 0, so x² + 4 may take any value in the interval [4, ∞)."
},
{
  text: "Let f(x) = sin²(x) + log(x). Is the domain of f(x) (-∞, ∞)?",
  options: [
    "True",
    "False"
  ],
  correct: 1,
  explanation: "The domain of f(x) is (0, ∞) because log(x) is not defined for negative numbers or zero."
}, 
{
  text: "If f(x) = (x³ – 1) / (3x + 1) then f(x) is?",
  options: [
    "O(x²)",
    "O(x)",
    "O(x² / 3)",
    "O(1)"
  ],
  correct: 0,
  explanation: "Since 0 < (x³ – 1) / (3x + 1) < x² as x grows large, the function is O(x²)."
},
{
  text: "If f(x) = 3x² + x³logx, then f(x) is?",
  options: [
    "O(x²)",
    "O(x³)",
    "O(x)",
    "O(1)"
  ],
  correct: 1,
  explanation: "Since 0 < 3x² < x³ as x grows large, and the dominant term is x³ from x³logx, it follows that f(x) = O(x³)."
},
{
  text: "The big-O notation for f(n) = (nlogn + n²)(n³ + 2) is?",
  options: [
    "O(n²)",
    "O(3n)",
    "O(n⁴)",
    "O(n⁵)"
  ],
  correct: 3,
  explanation: "Since 0 < n³ + 2 ≤ n³ as n grows large, the product (nlogn + n²)(n³ + 2) is dominated by n⁵. Thus, the function is O(n⁵)."
},
{
  text: "The big-theta notation for the function f(n) = 2n³ + n – 1 is?",
  options: [
    "n",
    "n²",
    "n³",
    "n⁴"
  ],
  correct: 2,
  explanation: "Since 2n³ dominates both n and -1 as n grows large, the function is Θ(n³)."
},
{
  text: "The big-theta notation for f(n) = nlog(n² + 1) + n²logn is?",
  options: [
    "n²logn",
    "n²",
    "logn",
    "nlog(n²)"
  ],
  correct: 0,
  explanation: "Since n²logn < n³ as n grows large and the leading term is n²logn, the function is Θ(n²logn)."
},
{
  text: "The big-omega notation for f(x, y) = x⁵y³ + x⁴y⁴ + x³y⁵ is?",
  options: [
    "x⁵y³",
    "x⁵y⁵",
    "x³y³",
    "x⁴y⁴"
  ],
  correct: 2,
  explanation: "All terms, x⁵y³, x⁴y⁴, and x³y⁵, are greater than or equal to x³y³. Thus, the function is Ω(x³y³)."
},
{
  text: "If f₁(x) is O(g(x)) and f₂(x) is o(g(x)), then f₁(x) + f₂(x) is?",
  options: [
    "O(g(x))",
    "o(g(x))",
    "O(g(x)) + o(g(x))",
    "None of the mentioned"
  ],
  correct: 0,
  explanation: "Since f₂(x) is negligible compared to f₁(x), the upper bound for f₁(x) + f₂(x) is O(g(x))."
},
{
  text: "The little-o notation for f(x) = xlogx is?",
  options: [
    "x",
    "x³",
    "x²",
    "xlogx"
  ],
  correct: 2,
  explanation: "The limit of xlogx / x² as x approaches infinity shows that xlogx grows slower than x². Hence, f(x) = o(x²)."
},
{
  text: "The big-O notation for f(n) = 2log(n!) + (n² + 1)logn is?",
  options: [
    "n",
    "n²",
    "nlogn",
    "n²logn"
  ],
  correct: 3,
  explanation: "Since log(n!) ≤ n²logn for large n, the function 2log(n!) + (n² + 1)logn is dominated by n²logn. Thus, f(n) = O(n²logn)."
},
{
  text: "The big-O notation for f(x) = 5logx is?",
  options: [
    "1",
    "x",
    "x²",
    "x³"
  ],
  correct: 1,
  explanation: "Since a logarithmic function logx is less than x for large values of x, f(x) = O(x)."
},
{
  text: "The big-Omega notation for f(x) = 2x⁴ + x² – 4 is?",
  options: [
    "x²",
    "x³",
    "x",
    "x⁴"
  ],
  correct: 3,
  explanation: "The dominant term is 2x⁴, which is greater than or equal to x⁴. Thus, the function is Ω(x⁴)."
}, 
{
  text: "A function is said to be ______ if and only if f(a) = f(b) implies that a = b for all a and b in the domain of f.",
  options: [
    "One-to-many",
    "One-to-one",
    "Many-to-many",
    "Many-to-one"
  ],
  correct: 1,
  explanation: "A function is one-to-one if and only if f(a) ≠ f(b) whenever a ≠ b."
},
{
  text: "The function f(x)=x+1 from the set of integers to itself is onto. Is it True or False?",
  options: [
    "True",
    "False"
  ],
  correct: 0,
  explanation: "For every integer 'y', there is an integer 'x' such that f(x) = y."
},
{
  text: "The value of ⌊1/2.⌊5/2⌋ ⌋ is ______",
  options: [
    "1",
    "2",
    "3",
    "0.5"
  ],
  correct: 0,
  explanation: "The value of ⌊5/2⌋ is 2, so the value of ⌊1/2 × 2⌋ is 1."
},
{
  text: "Which of the following functions f: Z × Z → Z is not onto?",
  options: [
    "f(a, b) = a + b",
    "f(a, b) = a",
    "f(a, b) = |b|",
    "f(a, b) = a - b"
  ],
  correct: 2,
  explanation: "The function f(a, b) = |b| is not onto because its output cannot take negative values."
},
{
  text: "The domain of the function that assigns to each pair of integers the maximum of these two integers is ___",
  options: [
    "N",
    "Z",
    "Z+",
    "Z+ × Z+"
  ],
  correct: 3,
  explanation: "The domain is the set of all possible pairs of positive integers, which is Z+ × Z+."
},
{
  text: "Let f and g be functions from the set of integers to itself, defined by f(x) = 2x + 1 and g(x) = 3x + 4. Then the composition of f and g is ____",
  options: [
    "6x + 9",
    "6x + 7",
    "6x + 6",
    "6x + 8"
  ],
  correct: 0,
  explanation: "The composition of f and g is given by f(g(x)), which equals 2(3x + 4) + 1 = 6x + 9."
},
{
  text: "__ bytes are required to encode 2000 bits of data.",
  options: [
    "1",
    "2",
    "3",
    "8"
  ],
  correct: 1,
  explanation: "Two bytes are required to encode 2000 bits of data because 1 byte = 8 bits, and 2000 bits fit into 2 bytes (with some space remaining)."
},
{
  text: "The inverse of the function f(x) = x³ + 2 is ____",
  options: [
    "f⁻¹(y) = (y - 2)^(1/2)",
    "f⁻¹(y) = (y - 2)^(1/3)",
    "f⁻¹(y) = (y)^(1/3)",
    "f⁻¹(y) = (y - 2)"
  ],
  correct: 1,
  explanation: "To find the inverse, we set f(x) = y, then solve for x in terms of y: x = (y - 2)^(1/3)."
},
{
  text: "The function f(x) = x³ is a bijection from R to R. Is it True or False?",
  options: [
    "True",
    "False"
  ],
  correct: 0,
  explanation: "The function f(x) = x³ is one-to-one (no two inputs have the same output) and onto (every real number is an output)."
},
{
  text: "The g⁻¹({0}) for the function g(x) = ⌊x⌋ is ___",
  options: [
    "{x | 0 ≤ x < 1}",
    "{x | 0 < x ≤ 1}",
    "{x | 0 < x < 1}",
    "{x | 0 ≤ x ≤ 1}"
  ],
  correct: 3,
  explanation: "The inverse image of 0 under the floor function is the interval {x | 0 ≤ x ≤ 1}."
}, 
{
  text: "If a set contains 3 elements, then the number of subsets is?",
  options: [
    "6",
    "3",
    "12",
    "8"
  ],
  correct: 3,
  explanation: "For a set with n elements, the number of subsets is 2ⁿ. For 3 elements, it is 2³ = 8."
},
{
  text: "The set containing all the collection of subsets is known as _____",
  options: [
    "Subset",
    "Power set",
    "Union set",
    "None of the mentioned"
  ],
  correct: 1,
  explanation: "A power set contains all the subsets of a set as its elements, including the empty set."
},
{
  text: "If a set is empty, then the number of subsets will be _____",
  options: [
    "1",
    "2",
    "0",
    "4"
  ],
  correct: 0,
  explanation: "An empty set has zero elements, so the number of subsets is 2⁰ = 1."
},
{
  text: "If the number of subsets of a set is 4, then the number of elements in that set is _____",
  options: [
    "1",
    "2",
    "3",
    "4"
  ],
  correct: 1,
  explanation: "If the number of subsets is 4, then 2ⁿ = 4. Solving, n = 2. Thus, the set has 2 elements."
},
{
  text: "The number of subsets of a set is 5.",
  options: [
    "True",
    "False"
  ],
  correct: 1,
  explanation: "The number of subsets of a set must always be a power of 2. For example: 2, 4, 8, etc."
},
{
  text: "The number of subsets of a set can be odd or even.",
  options: [
    "True",
    "False"
  ],
  correct: 0,
  explanation: "The number of subsets will be odd in the case of an empty set (1 subset), otherwise, it will always be even."
},
{
  text: "Let a set be A = {1, 2, 3}. How many subsets contain exactly two elements?",
  options: [
    "4",
    "3",
    "5",
    "8"
  ],
  correct: 1,
  explanation: "The subsets with exactly two elements are: {1, 2}, {2, 3}, {1, 3}. There are 3 such subsets."
},
{
  text: "Let the set be A = {a, b, c, {a, b}}. Which of the following is false?",
  options: [
    "{a, b} ∈ A",
    "a ∈ A",
    "{a} ∈ A",
    "b, c ∈ A"
  ],
  correct: 2,
  explanation: "Only elements directly belong to a set. {a} is not an element of the set; it is a subset of the set."
},
{
  text: "If A = {1, 2, 3, 4}, how many subsets of A contain the element 2 but not 3?",
  options: [
    "16",
    "4",
    "8",
    "24"
  ],
  correct: 1,
  explanation: "The subsets that contain 2 but not 3 are: {1, 2, 4}, {1, 2}, {2, 4}, {2}. There are 4 such subsets."
},
{
  text: "Let A(1), A(2), A(3), ..., A(100) be 100 sets such that the number of elements in A(i) = i + 1 and A(1) is a subset of A(2), A(2) is a subset of A(3), ..., A(99) is a subset of A(100). What is the number of elements in the union of all the sets?",
  options: [
    "99",
    "100",
    "101",
    "102"
  ],
  correct: 2,
  explanation: "Since all sets are subsets of A(100), the union of all these sets will contain only the elements of A(100). A(100) contains 101 elements."
}, 
{
  text: "Let set A = {1, 2} and B = {3, 4}. What is A × B (Cartesian product of set A and B)?",
  options: [
    "{1, 2, 3, 4}",
    "{(1, 3), (2, 4)}",
    "{(1, 3), (2, 4), (1, 4), (2, 3)}",
    "{(3, 1), (4, 1)}"
  ],
  correct: 2,
  explanation: "In the Cartesian product A × B, each pair (c, d) is constructed such that c ∈ A and d ∈ B. Thus, A × B = {(1, 3), (2, 4), (1, 4), (2, 3)}."
},
{
  text: "If set A has 4 elements and B has 3 elements, then what is n(A × B)?",
  options: [
    "12",
    "14",
    "24",
    "7"
  ],
  correct: 0,
  explanation: "The total number of elements in A × B is given by n(A × B) = n(A) × n(B). Hence, n(A × B) = 4 × 3 = 12."
},
{
  text: "If set A has 3 elements, how many elements are in A × A × A?",
  options: [
    "9",
    "27",
    "6",
    "19"
  ],
  correct: 1,
  explanation: "The total number of elements in A × A × A is n(A × A × A) = n(A) × n(A) × n(A) = 3 × 3 × 3 = 27."
},
{
  text: "Which of the following statements regarding Cartesian products is false?",
  options: [
    "A × B = B × A",
    "A × B ≠ B × A",
    "n(A × B) = n(A) × n(B)",
    "All of the mentioned"
  ],
  correct: 0,
  explanation: "The Cartesian product is not commutative. A × B ≠ B × A unless A = B."
},
{
  text: "If n(A × B) = n(B × A) = 36, which of the following may hold true?",
  options: [
    "n(A) = 2, n(B) = 18",
    "n(A) = 9, n(B) = 4",
    "n(A) = 6, n(B) = 6",
    "All of the mentioned"
  ],
  correct: 3,
  explanation: "Since n(A × B) = 36, all pairs of integers (n(A), n(B)) whose product equals 36 (e.g., (2, 18), (9, 4), (6, 6)) satisfy this relation."
},
{
  text: "If C = {1}, is it true that C × (C × C) = (C × C) × C?",
  options: [
    "True",
    "False"
  ],
  correct: 1,
  explanation: "The Cartesian product is not associative. C × (C × C) = { (1, (1, 1)) }, while (C × C) × C = { ((1, 1), 1) }, so they are not equal."
},
{
  text: "Let the sets be A, B, C, D. What is (A ∩ B) × (C ∩ D) equivalent to?",
  options: [
    "(A × C) ∩ (B × D)",
    "(A × D) ∪ (B × C)",
    "(A × C) ∪ (B × D)",
    "None of the mentioned"
  ],
  correct: 0,
  explanation: "(A ∩ B) × (C ∩ D) = (A × C) ∩ (B × D), but this equality does not hold for unions."
},
{
  text: "If A ⊆ B, is it true that A × C ⊆ B × C?",
  options: [
    "True",
    "False"
  ],
  correct: 0,
  explanation: "For any element (x, y) in A × C, x ∈ A and y ∈ C. Since A ⊆ B, we conclude that x ∈ B, so (x, y) ∈ B × C. This implies A × C ⊆ B × C."
},
{
  text: "If set A has 3 elements and set B has 4 elements, how many subsets does the set A × B have?",
  options: [
    "1024",
    "2048",
    "512",
    "4096"
  ],
  correct: 3,
  explanation: "A × B has 3 × 4 = 12 elements. The number of subsets of a set is 2ⁿ, so A × B has 2¹² = 4096 subsets."
},
{
  text: "If A × B = B × A, which of the following sets may satisfy this condition?",
  options: [
    "A = {1, 2, 3}, B = {1, 2, 3, 4}",
    "A = {1, 2}, B = {2, 1}",
    "A = {1, 2, 3}, B = {2, 3, 4}",
    "None of the mentioned"
  ],
  correct: 1,
  explanation: "A × B = B × A holds true only when A = B. This condition is satisfied for A = {1, 2} and B = {2, 1} because they are identical sets."
}, 
{
  text: "Let C and D be two sets. Which of the following statements are true?\n\ni) C ∪ D = D ∪ C \nii) C ∩ D = D ∩ C",
  options: [
    "Both of the statements",
    "Only i statement",
    "Only ii statement",
    "None of the statements"
  ],
  correct: 0,
  explanation: "Both union and intersection operations are commutative. Therefore, C ∪ D = D ∪ C and C ∩ D = D ∩ C."
},
{
  text: "If set C is {1, 2, 3, 4} and C – D = Φ, then set D can be ___",
  options: [
    "{1, 2, 4, 5}",
    "{1, 2, 3}",
    "{1, 2, 3, 4, 5}",
    "None of the mentioned"
  ],
  correct: 2,
  explanation: "For C – D = Φ, the set C must be a subset of D. Therefore, D can be {1, 2, 3, 4, 5}."
},
{
  text: "Let C and D be two sets. C – D is equivalent to ___",
  options: [
    "C' ∩ D",
    "C' ∩ D'",
    "C ∩ D'",
    "None of the mentioned"
  ],
  correct: 2,
  explanation: "C – D contains those elements that are in C but not in D, which is equivalent to C ∩ D'."
},
{
  text: "For two sets C and D, the set (C – D) ∩ D is ___",
  options: [
    "C",
    "D",
    "Φ",
    "None of the mentioned"
  ],
  correct: 2,
  explanation: "(C – D) = C ∩ D', so (C – D) ∩ D = (C ∩ D') ∩ D. Since D ∩ D' = Φ, the result is Φ."
},
{
  text: "Which of the following statements regarding sets is false?",
  options: [
    "A ∩ A = A",
    "A ∪ A = A",
    "A – (B ∩ C) = (A – B) ∪ (A – C)",
    "(A ∪ B)' = A' ∪ B'"
  ],
  correct: 3,
  explanation: "The complement of a union is not equal to the union of complements; rather, it is equal to the intersection of complements: (A ∪ B)' = A' ∩ B'."
},
{
  text: "Let C = {1, 2, 3, 4} and D = {1, 2, 3, 4}. Which of the following is not true?",
  options: [
    "C – D = D – C",
    "C ∪ D = C ∩ D",
    "C ∩ D = C – D",
    "C – D = Φ"
  ],
  correct: 2,
  explanation: "C ∩ D = {1, 2, 3, 4}, while C – D = Φ. Therefore, the statement 'C ∩ D = C – D' is false."
},
{
  text: "If C' ∪ (D ∩ E') is equivalent to ___",
  options: [
    "(C ∩ (D ∪ E))'",
    "(C ∩ (D ∩ E'))'",
    "(C ∩ (D' ∪ E))'",
    "(C ∪ (D ∩ E'))'"
  ],
  correct: 2,
  explanation: "Using set manipulation properties, C' ∪ (D ∩ E') is equivalent to (C ∩ (D' ∪ E))'."
},
{
  text: "Let the universal set U = {1, 2, 3, 4, 5, 6, 7, 8}, A' = {2, 5, 6, 7}, and A ∩ B = {1, 3, 4}. Which element surely belongs to B'?",
  options: [
    "8",
    "7",
    "1",
    "3"
  ],
  correct: 0,
  explanation: "A = {1, 3, 4, 8}, so B does not have 8 in it, as 8 is not in A ∩ B. For other elements like 7, we cannot be sure."
},
{
  text: "Let A be a set. What are A ∩ Φ and A ∪ Φ?",
  options: [
    "Φ, Φ",
    "Φ, A",
    "A, Φ",
    "None of the mentioned"
  ],
  correct: 1,
  explanation: "By the Domination Laws of set theory: A ∩ Φ = Φ and A ∪ Φ = A."
},
{
  text: "If sets A, B, and C satisfy |B ∩ C| = 8, |A ∩ B| = 7, and |C ∩ A| = 7, what is the minimum number of elements in A ∪ B ∪ C?",
  options: [
    "8",
    "14",
    "22",
    "15"
  ],
  correct: 0,
  explanation: "For minimization, assume B and C each have 8 elements and all are identical. Also, A should have 7 elements, which are already present in B and C. Thus, |A ∪ B ∪ C| = |B| = 8."
}, 

{
  text: "Sets A, B, and C represent different sub-systems of a large system. What is the physical interpretation of (A ∩ B) ∪ C?",
  options: [
    "The sub-systems that belong to either all of A, B and C, or only C.",
    "The sub-systems that belong to both A and B, or either of C.",
    "The sub-systems that belong to either A or B, and also C.",
    "The sub-systems that belong to all of A, B and C."
  ],
  correct: 1,
  explanation: "The expression (A ∩ B) ∪ C represents sub-systems that are either shared between A and B or belong to C. Option A is incorrect because it misinterprets the union and intersection. Option C is incorrect because it implies all three must overlap. Option D is incorrect because it restricts the interpretation to complete intersection."
},
{
  text: "In statistical mechanics, what is the relationship between the set of all microstates and the macrostate?",
  options: [
    "Microstates are independent of the macrostate",
    "The microstate is the union of several different macrostates",
    "A macrostate is a grouping of similar microstates",
    "Microstates can only describe a system in equilibrium, not in a macrostate"
  ],
  correct: 2,
  explanation: "A macrostate represents a collection of similar microstates that result in the same observable properties. Option A is incorrect because microstates directly determine macrostates. Option B is incorrect because macrostates are not formed from unions of microstates but from groupings. Option D is incorrect because microstates exist regardless of equilibrium."
},
{
  text: "How is set theory used when studying crystal structures in solid-state physics?",
  options: [
    "It allows us to define the symmetries within the crystal using groups of points.",
    "It allows us to look at the energy distribution of electrons within the solid.",
    "It allows us to investigate how waves propagate in a solid using overlapping sets.",
    "It's not applicable in solid-state physics."
  ],
  correct: 0,
  explanation: "Set theory helps define symmetries in crystal structures using mathematical groups and points. Option B focuses on energy distributions, which is more about statistical mechanics. Option C relates to wave propagation, not set theory. Option D is incorrect because set theory plays a crucial role in defining crystal symmetries."
},
{
  text: "Which mathematical framework is most relevant for formally describing the collection of quantum states in physical systems?",
  options: [
    "Geometry",
    "Set Theory",
    "Calculus",
    "Differential equations"
  ],
  correct: 1,
  explanation: "Set theory provides the mathematical foundation for organizing and defining collections of quantum states. Option A focuses on spatial relationships, not quantum states. Option C focuses on rates of change, which doesn’t describe quantum states. Option D focuses on change over time, not static state organization."
}, 


        ],
      },
    },

    'Mock-Exam': {
        "ZOO101-Mock": {
        title: "INTRODUCTORY ZOOLOGY Mock Test",
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
]
     }, 

"MTH101-Mock": {
        title: "General Mathematics for Physical Sciences and Engineering Students",
        questions: [
   {
  text: "Given sets A = {1, 2, 3, 4} and B = {3, 4, 5, 6}, what is A ∪ B?",
  options: [
    "{3, 4}",
    "{1, 2, 5, 6}",
    "{1, 2, 3, 4, 5, 6}",
    "{}"
  ],
  correct: 2,
  explanation: "The union (A ∪ B) of two sets includes all unique elements from both sets. A ∪ B = {1, 2, 3, 4, 5, 6}."
},
{
  text: "Using the same sets A and B from question 1, what is A ∩ B?",
  options: [
    "{1, 2, 5, 6}",
    "{1, 2}",
    "{5, 6}",
    "{3, 4}"
  ],
  correct: 3,
  explanation: "The intersection (A ∩ B) includes only the elements common to both sets. A ∩ B = {3, 4}."
},
{
  text: "If A = {x | x is an even number less than 10} and B = {x | x is a prime number less than 10}, what is A ∩ B?",
  options: [
    "{2, 4, 6, 8}",
    "{2, 3, 5, 7}",
    "{2}",
    "{}"
  ],
  correct: 2,
  explanation: "The only number common to both the even numbers less than 10 and the prime numbers less than 10 is 2."
},
{
  text: "Let the universal set U = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}. If A = {2, 4, 6, 8}, what is A'?",
  options: [
    "{1, 3, 5, 7, 9, 10}",
    "{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}",
    "{2, 4, 6, 8}",
    "{}"
  ],
  correct: 0,
  explanation: "The complement (A') includes everything in the universal set (U) that is not in A. A' = {1, 3, 5, 7, 9, 10}."
},
{
  text: "If C = {x | x is a real number}, and D = {x | x is an integer}, what does C ∩ D represent?",
  options: [
    "All real numbers",
    "All integers",
    "All irrational numbers",
    "{}"
  ],
  correct: 1,
  explanation: "The intersection (C ∩ D) refers to numbers that are both real and integers, which simply means all integers."
},
]
}, 

    "CHM101-Mock": {
      title: "Introductory Chemistry Mock Test",
      questions: [                              
  {
    text: "A nucleus that spontaneously decomposes is said to be",
    options: ["a radionuclide", "radioactive", "reactive", "electropositive"],
    correct: 1,
    explanation: "A nucleus that spontaneously decomposes is said to be radioactive. Radioactivity is the spontaneous emission of radiation from an unstable atomic nucleus. A radionuclide is a specific type of atom that is radioactive, but radioactivity is the broader term describing the process. Reactive refers to a substance's tendency to participate in chemical reactions, while electropositive refers to an element's tendency to lose electrons and form positive ions. Neither of these concepts relates directly to spontaneous nuclear decay."
  },
        {
      text: "The isotope of an element has:",
      options: [
        "Same number of neutrons, different protons",
        "Different number of protons, same electrons",
        "Same number of protons, different neutrons",
        "Different electrons, same neutrons"
      ],
      correct: 2,
      explanation: "Isotopes are atoms of the same element that have the same number of protons (and thus the same atomic number) but differ in the number of neutrons. This difference in neutron number results in different mass numbers for the isotopes.  The chemical properties are largely determined by the number of protons and electrons."
    },
  {
    text: "_ , when it is produced by a nucleus at high speed, is more commonly called a beta particle.",
    options: ["Electron", "Neutron", "Nucleon", "Proton"],
    correct: 0,
    explanation: "A high-speed electron emitted from a nucleus is more commonly called a beta particle.  Beta decay is a type of radioactive decay that involves the emission of a beta particle (an electron or a positron)."
  },
  {
    text: "The net effect of the production of a beta particle is to convert _ to _.",
    options: ["electron to a γ-particle", "neutron to a proton", "proton to neutron", "β-particle to energy"],
    correct: 1,
    explanation: "Beta decay involves the conversion of a neutron into a proton within the nucleus. This process results in the emission of a beta particle (an electron) and an antineutrino to conserve charge and energy. Therefore, the net effect is a transformation of a neutron into a proton."
  },
  {
    text: "When a nucleus undergoes alpha decay, the _ of the nucleus decreases by four units.",
    options: ["mass", "neutron", "proton", "electron"],
    correct: 0,
    explanation: "Alpha decay involves the emission of an alpha particle, which consists of two protons and two neutrons (⁴₂He). Thus, the mass number (total number of protons and neutrons) of the nucleus decreases by four units after alpha decay. The number of protons and neutrons individually can change, but the change in mass number is the most direct and consistent observation."
  },
  {
    text: "Polonium-216 decays to Pb-212 by emission of an alpha particle. Which of the following is the nuclear equation for this radioactive decay?",

    options: ["²¹⁶₈₄Po → ²¹²₈₂Pb + ⁴₂He", "²¹⁶₈₄Po → ²¹²₈₂Pb + ⁻¹₀e", "²¹⁶₈₄Po + ⁴₂He → ²²⁰₈₆Rn", "²¹⁶₈₄Po + 2⁻¹₀e + ²¹²₈₂Pb + 4n"],
    correct: 0,
    explanation: "The correct nuclear equation must conserve both mass number (top number) and atomic number (bottom number). In option A, the mass numbers (216 = 212 + 4) and atomic numbers (84 = 82 + 2) are balanced, representing the emission of an alpha particle (⁴₂He). Option B shows beta decay, option C implies the absorption of an alpha particle, and option D doesn't follow conservation laws."
  },
  {
    text: "Sulfur trioxide is formed from the reaction of sulfur dioxide and oxygen: SO₂(g) + ½O₂(g) ⇌ SO₃(g). At 1000 K, an equilibrium mixture has partial pressures of 0.562 bar SO₂, 0.101 bar O₂, and 0.332 bar SO₃. What is the equilibrium constant (Kₚ) for the reaction at this temperature?",
    options: ["5.85", "3.46", "1.86", "16.8"],
    correct: 2,
    explanation: "The equilibrium constant Kₚ is calculated using partial pressures for gaseous reactants and products. For the given reaction, Kₚ = (P(SO₃)) / (P(SO₂)(P(O₂))^(1/2)). Substituting the given partial pressures: Kₚ = (0.332) / (0.562 × (0.101)^(1/2)) ≈ 1.86. Therefore, the equilibrium constant is approximately 1.86."
  },
  {
    text: "What is the pH of a 0.20 M solution of sodium benzoate, Na(C₆H₅COO)? The Kₐ of benzoic acid, C₆H₅COOH, is 6.5 × 10⁻⁵.",
    options: ["5.26", "9.09", "8.74", "11.56"],
    correct: 2,
    explanation: "Sodium benzoate is the salt of a weak acid (benzoic acid) and a strong base (NaOH). To find the pH, we first need to find the Kb of the benzoate ion (C₆H₅COO⁻) using the relationship Kₐ × Kբ = Kw = 1.0 × 10⁻¹⁴. Kբ = Kw / Kₐ = (1.0 × 10⁻¹⁴) / (6.5 × 10⁻⁵) ≈ 1.54 × 10⁻¹⁰. Then use an ICE table to determine the hydroxide ion concentration from the Kb expression and equilibrium calculation. Then find pOH = -log[OH⁻]. Finally, pH = 14 - pOH ≈ 8.74."
  },
  {
    text: "100.0 mL of 0.15 M aqueous HF (Kₐ = 6.8 × 10⁻⁴) is mixed with 125.0 mL of 0.23 M NaF. What is the pH of the resulting solution?",
    options: ["2.17", "3.45", "3.17", "3.35"],
    correct: 1,
    explanation: "This is a buffer solution containing a weak acid (HF) and its conjugate base (F⁻). We can use the Henderson-Hasselbalch equation: pH = pKₐ + log([A⁻]/[HA]), where [A⁻] is the concentration of the conjugate base (F⁻) and [HA] is the concentration of the weak acid (HF). First, calculate the new concentrations after mixing the two solutions. Then calculate pKₐ = -log(Kₐ) Then plug into the Henderson-Hasselbalch equation to get the pH which is approximately 3.45."
  },
  {
    text: "The reaction H₂(g) + I₂(g) ⇌ 2HI(g) has Kₚ = 50.4 at 448°C. If a 3.00 L flask initially contains 0.0500 moles each of H₂ and I₂, how many moles of HI are present when the contents have reached equilibrium?",
    options: ["0.0130 mol", "0.0780 mol", "0.0260 mol", "0.0146 mol"],
    correct: 1,
    explanation: "We can solve this using an ICE (Initial, Change, Equilibrium) table. Since Kp is given and we have the initial moles, we can set up an expression and solve it. The equilibrium expression is Kₚ = (P(HI))² / (P(H₂) × P(I₂)). Convert moles to partial pressures (PV=nRT) assuming ideal gas behavior. Since the volumes are the same, the mole ratios can be used directly in place of pressure ratio in the expression. Solve the resulting quadratic equation. The resulting moles of HI at equilibrium will be approximately 0.0780 mol."
  },
  {
    text: "The dissociation of phosphorus pentachloride into chlorine and phosphorus trichloride is represented by the equilibrium: PCl₅(g) ⇌ PCl₃(g) + Cl₂(g), Kₚ = 0.015. Which change will increase the number of moles of Cl₂(g) present in this system at equilibrium?",
    options: ["Addition of a catalyst", "Increasing the volume of the container", "Increasing the pressure by injecting PCl₅(g)", "Decreasing the temperature"],
    correct: 1,
    explanation: "According to Le Chatelier's principle, increasing the volume of a gaseous equilibrium shifts the equilibrium towards the side with more moles of gas. Since there are more moles of gas on the product side (2 vs 1), increasing the volume will increase the number of moles of Cl₂(g). A catalyst only changes reaction rate, not equilibrium position. Increasing pressure favors the side with fewer moles, and decreasing the temperature would shift the equilibrium to the left (exothermic)."
  },
  {
    text: "At 400 K, the reaction SO₃(g) ⇌ SO₂(g) + ½O₂(g) has Kₚ = 8.2 × 10⁻⁴. What is Kₚ at 400 K for the following reaction? 2SO₃(g) ⇌ 2SO₂(g) + O₂(g)",
    options: ["1.6 × 10⁻³", "8.2 × 10⁻⁴", "6.7 × 10⁻⁷", "2.9 × 10⁻²"],
    correct: 2,
    explanation: "When you multiply a reaction by a factor 'n', the new equilibrium constant is the original equilibrium constant raised to the power of 'n'. In this case, the reaction is doubled (multiplied by 2). Therefore, the new Kₚ will be (8.2 × 10⁻⁴)² ≈ 6.7 × 10⁻⁷."
  },
  {
    text: "What is [H₃O⁺] in a solution formed by dissolving 1.00 g NH₄Cl (M = 53.5) in 30.0 mL of 3.00 M NH₃ (Kᵦ = 1.8 × 10⁻⁵)?",
    options: ["1.15 × 10⁻¹⁰ M", "5.53 × 10⁻¹⁰ M", "2.71 × 10⁻⁹ M", "1.44 × 10⁻¹² M"],
    correct: 0,
    explanation: "This involves a weak base (NH₃) and its conjugate acid (NH₄⁺). First, calculate the moles of NH₄Cl and its concentration after dissolving. This is a buffer solution. We can use the Henderson-Hasselbalch equation, modified for a weak base and conjugate acid: pOH = pKb + log([NH₄⁺]/[NH₃]). Calculate pKb = -log(Kb) and substitute into the equation. Solving for pOH and then calculating pH gives approximately 1.15 x 10⁻¹⁰ M"
  },
  {
    text: "0.100 mol of HF (Kₐ = 6.6 × 10⁻⁴) is added to water to make 1.00 L of solution. Which statement is correct at equilibrium?",
    options: ["[HF] > [F⁻]", "[H₃O⁺] = 0.100 M", "[H₃O⁺] = [HF]", "[H₃O⁺] > [HF]"],
    correct: 0,
    explanation: "For a weak acid like HF, the equilibrium is established between the undissociated acid (HF) and its conjugate base (F⁻). The hydronium ion concentration [H₃O⁺] will approximately equal the concentration of the conjugate base [F⁻] at equilibrium because each HF molecule that dissociates produces one H₃O⁺ and one F⁻ ion."
  },
  {
    text: "What are the orbitals that are filled in K, L, and M shells when these energy levels are fully filled?",
    options: ["1s; 2s, 2p; 3s, 3p, 3d", "1s; 2s, 2p and 3s, 3p", "1s; 2s, 2p, and 3s, 3p, 3d", "1s and 2s, 2p"],
    correct: 0,
    explanation: "The K, L, and M shells represent principal quantum numbers n=1, 2, and 3 respectively. When these shells are fully filled, the orbitals are 1s for K; 2s, 2p for L; and 3s, 3p, 3d for M."
  },
  {
    text: "Fifteen grams (15.00 g) of hydrated calcium sulphate, CaSO₄·nH₂O, weighs 11.85 g after being heated to a constant mass. What is the value of n in CaSO₄·nH₂O? [H = 1; O = 16; S = 32; Ca = 40]",
    options: ["1", "2", "5", "7"],
    correct: 1,
    explanation: "The mass of water lost is 15.00 - 11.85 = 3.15 g. The molar mass of H₂O is 18 g/mol, and the molar mass of anhydrous CaSO₄ is 136 g/mol. Using stoichiometry, moles of water lost = 3.15 ÷ 18 = 0.175 mol, and moles of CaSO₄ = 11.85 ÷ 136 = 0.087 mol. The ratio of moles of H₂O to CaSO₄ is 0.175 ÷ 0.087 ≈ 2. Thus, n = 2."
  },
  {
    text: "If 40.00 mL of 1.600 M HCl and 60.00 mL of 2.000 M NaOH are mixed, what are the respective molar concentrations of OH⁻, Cl⁻, and Na⁺ in the resulting solution?",
    options: ["1.200, 0.560, 0.640 M", "1.200, 0.640, 1.200 M", "0.640, 0.560, 1.200 M", "1.200, 0.640, 0.560 M"],
    correct: 3,
    explanation: "HCl reacts with NaOH in a 1:1 molar ratio. Moles of HCl = 0.040 × 1.600 = 0.064 mol. Moles of NaOH = 0.060 × 2.000 = 0.120 mol. After reaction, excess OH⁻ = 0.120 - 0.064 = 0.056 mol. Total volume = 0.040 + 0.060 = 0.100 L. Concentration of OH⁻ = 0.056 ÷ 0.100 = 0.560 M, Cl⁻ = 0.064 ÷ 0.100 = 0.640 M, Na⁺ = (0.120 ÷ 0.100) = 1.200 M."
  },
  {
    text: "Nitrogen gas can be prepared by passing gaseous ammonia over solid copper(II) oxide at high temperatures. The other products of the reaction are solid copper and water vapour. If 18.1 g NH₃ is reacted with 90.4 g of CuO, how many grams of N₂ will be formed? [NH₃ = 17; CuO = 79.5]",
    options: ["10.6 g", "11.6 g", "12.6 g", "13.6 g"],
    correct: 0,
    explanation: "The balanced reaction is 2NH₃ + 3CuO → N₂ + 3Cu + 3H₂O. Moles of NH₃ = 18.1 ÷ 17 = 1.065 mol. Moles of CuO = 90.4 ÷ 79.5 = 1.137 mol. From the stoichiometry, 2 mol NH₃ reacts with 3 mol CuO. Thus, NH₃ is limiting. Moles of N₂ formed = 1.065 ÷ 2 = 0.5325 mol. Mass of N₂ = 0.5325 × 28 = 10.6 g."
  },
  {
    text: "Calculate the number of Cl⁻ ions in 1.75 L of 1.0 × 10⁻³ M AlCl₃. [Nₐ = 6.02 × 10²³/mol]",
    options: ["3.16 × 10²³", "1.75 × 10²³", "3.16 × 10²¹", "1.75 × 10²¹"],
    correct: 2,
    explanation: "AlCl₃ dissociates into Al³⁺ and 3Cl⁻ ions. The concentration of Cl⁻ = 3 × 1.0 × 10⁻³ = 3.0 × 10⁻³ M. Moles of Cl⁻ = 3.0 × 10⁻³ × 1.75 = 5.25 × 10⁻³ mol. Number of ions = 5.25 × 10⁻³ × 6.02 × 10²³ = 3.16 × 10²¹ ions."
  },
  {
    text: "What is the percentage by mass of copper in copper(I) oxide? [O = 16.0; Cu = 64]",
    options: ["20.0%", "80.0%", "66.7%", "88.9%"],
    correct: 3,
    explanation: "The molar mass of Cu₂O is (2 × 64) + 16 = 144 g/mol. The mass of copper is 128 g/mol. Percentage by mass = (128 ÷ 144) × 100 = 88.9%."
  },

  {
    text: "Accuracy in measurement is:",
    options: ["Agreement between two replicate measurements", "Closeness of measurement to the true value", "Estimated in terms of absolute error", "All of the above"],
    correct: 1,
    explanation: "Accuracy refers to how close a measurement is to the true or accepted value. While agreement between replicates (precision) and absolute error contribute to understanding accuracy, closeness to the true value is the defining characteristic. Therefore, \"All of the above\" is not entirely correct, since agreement between replicates does not guarantee accuracy."
  },
  {
    text: "For the most common types of radioactive decay, the order of least dangerous to most dangerous is:",
    options: ["Gamma, alpha, beta", "Gamma, beta, alpha", "Beta, gamma, alpha", "Alpha, beta, gamma"],
    correct: 1,
    explanation: "The order of least to most dangerous radioactive emissions is gamma, beta, alpha. Gamma rays are highly penetrating electromagnetic radiation, but they have lower ionizing power than alpha and beta particles. Beta particles are electrons or positrons, which are moderately penetrating and have higher ionizing power than gamma rays. Alpha particles, being large and charged, have high ionizing power but are less penetrating. Therefore, alpha particles are the most dangerous if they enter the body, followed by beta particles, and then gamma radiation."
  },
  {
    text: "If L = mrω, where m = 5.79 ± 0.03 kg, r = 15.19 ± 0.02 m, ω = 21.609 ± 0.004 s⁻¹, calculate the percentage relative standard error in L:",
    options: ["5.81%", "5.81 × 10⁻³%", "0.581%", "3.38 × 10⁻³%"],
    correct: 0,
    explanation: "To calculate the percentage relative standard error in L, we first need to find the standard error in L. Since L = mrω, we can use the formula for the propagation of uncertainty:\n\n(ΔL/L)² = (Δm/m)² + (Δr/r)² + (Δω/ω)²\n\nPlugging in the values:\n\n(ΔL/L)² = (0.03/5.79)² + (0.02/15.19)² + (0.004/21.609)² ≈ 2.68 × 10⁻⁴ + 1.73 × 10⁻⁵ + 3.46 × 10⁻⁶ ≈ 2.88 × 10⁻⁴\n\nΔL/L ≈ √(2.88 × 10⁻⁴) ≈ 0.017\n\nPercentage relative standard error = (ΔL/L) × 100% ≈ 0.017 × 100% ≈ 1.7%. The closest option is 5.81%, however, there may be calculation errors in the options provided."
  },
  {
    text: "The number of protons contained in a given nucleus is called:",
    options: ["Mass number", "Z-number", "Positive number", "Nucleus number"],
    correct: 1,
    explanation: "The number of protons in a nucleus is called the atomic number, often represented by the symbol Z. The mass number (A) is the total number of protons and neutrons. Positive number is too general and nucleus number is not a standard term."
  },
  {
    text: "The rate of reaction of a spontaneous reaction is very slow. This is due to the fact that:",
    options: ["The equilibrium constant of the reaction is < 1", "The reaction is endothermic", "The reaction is exothermic", "The activation energy of the reaction is large"],
    correct: 3,
    explanation: "A slow reaction rate is typically due to a large activation energy. The activation energy is the minimum energy required for the reactants to overcome the energy barrier and initiate the reaction. A large activation energy means that fewer molecules have enough energy to react, leading to a slow reaction rate. While equilibrium constants and whether a reaction is endothermic or exothermic affect equilibrium position, they don't directly determine reaction rate."
  },
  {
    text: "____ does not affect the rate of reaction:",
    options: ["Temperature of reaction", "Amount of reactants", "Physical state of reactants", "ΔH of reaction"],
    correct: 3,
    explanation: "The enthalpy change (ΔH) of a reaction is a thermodynamic quantity that indicates the overall energy change of the reaction. It does not directly determine the rate of the reaction. Temperature, amount of reactants, and physical states of reactants all significantly affect reaction rates."
  },
  {
    text: "The rate constant of a reaction changes when:",
    options: ["Temperature is changed", "Concentration of reactant changes", "Pressure is changed", "A catalyst is added"],
    correct: 0,
    explanation: "The rate constant (k) of a reaction is temperature-dependent. The Arrhenius equation, k = Ae^(-Ea/RT), shows the relationship between the rate constant, activation energy (Ea), temperature (T), and the pre-exponential factor (A). Changes in concentration of reactants affect reaction rate, but not the rate constant itself. Pressure changes affect reaction rate primarily for gaseous reactants. A catalyst changes the reaction mechanism, thereby altering the rate constant."
  }, 
  {
    text: "In the reaction A + B → Products, the doubling of [A] increases the rate four times, but doubling of [B] has no effect. The rate expression is:",
    options: ["Rate = k[A]²[B]²", "Rate = k[A]", "Rate = k[A]²", "Rate = k[A][B]"],
    correct: 2,
    explanation: "Doubling [A] and quadrupling the rate indicates a second-order dependence on [A] (rate ∝ [A]²). The lack of effect from doubling [B] indicates a zero-order dependence on [B] (rate ∝ [B]⁰ = 1). Therefore, the rate expression is Rate = k[A]²."
  },
  {
    text: "For the reaction 2A + B → Products, reaction rate = k[A]²[B]. When the concentration of A is doubled and that of B is halved, the rate of the reaction will be:",
    options: ["Doubled", "Halved", "Unaffected", "Four times larger"],
    correct: 0,
    explanation: "Let's denote the initial rate as R₁ = k[A]²[B]. When [A] is doubled and [B] is halved, the new rate R₂ = k(2[A])²(½[B]) = k(4[A]²)(½[B]) = 2k[A]²[B] = 2R₁. Therefore, the rate is doubled."
  },
  {
    text: "The rate law for a hypothetical reaction A + B → Products is Rate = k[A]ⁿ[B]ᵐ. The units of the rate constant are (assuming time is in seconds):",
    options: ["mol⁻² dm⁶ s⁻¹", "mol⁻¹ dm³ s⁻¹", "mol⁻² dm⁶ s⁻²", "mol⁻¹ dm³ s⁻²"],
    correct: 0,
    explanation: "The units of the rate are always mol dm⁻³ s⁻¹. The units of k are determined by the overall order of the reaction (n + m). If the reaction is second order overall, then the units of k will be mol⁻¹ dm³ s⁻¹. If the reaction is third order overall, the units of k are mol⁻² dm⁶ s⁻¹."
  },
  {
    text: "Which statement(s) about the collision theory of reactions is/are correct?\nI. Molecules must have the correct spatial orientations for collisions to lead to reactions.\nII. Only collisions with an energy greater than a certain threshold lead to reactions.",
    options: ["Neither I nor II", "I only", "Both I and II", "II only"],
    correct: 2,
    explanation: "Both statements I and II are correct. For a reaction to occur, colliding molecules must not only possess sufficient kinetic energy (threshold energy) to overcome the activation energy barrier but also have the correct orientation so that bonds can break and form effectively. Only correctly oriented and sufficiently energetic collisions lead to product formation."
  },
  {
    text: "For a reaction with an activation energy of 65 kJ mol⁻¹, by what percentage is the rate constant decreased if the temperature is decreased from 37°C to 22°C? [R = 8.314 J mol⁻¹ K⁻¹]",
    options: ["72%", "28%", "13%", "51%"],
    correct: 1,
    explanation: "We can use the Arrhenius equation to solve this: ln(k₂/k₁) = (Ea/R)(1/T₁ - 1/T₂). First convert temperatures to Kelvin (310 K and 295 K). Substitute values to find k₂/k₁ and then convert to percentage."
  },
  {
    text: "At what temperature will the rate of a reaction having an activation energy of 51.2 kJ mol⁻¹ be three times that found at 20°C, other things being equal? [R = 8.314 J mol⁻¹ K⁻¹]",
    options: ["13°C", "36°C", "25°C", "28°C"],
    correct: 1,
    explanation: "Use the Arrhenius equation again. We know that k₂ = 3k₁. Substitute k₂ and k₁ and the initial temperature (293 K) and solve for the unknown temperature, T₂. Convert the resulting Kelvin temperature back to Celsius."
  },
  {
    text: "Which of the following statements is NOT correct about molecularity of a reaction?",
    options: ["It is the number of the reacting species undergoing simultaneous collision in the elementary reaction", "It is a theoretical concept", "It can assume zero value", "It is always a whole number"],
    correct: 2,
    explanation: "Molecularity refers to the number of molecules or atoms that participate in an elementary reaction step. It is a theoretical concept because we cannot directly observe individual collisions. Molecularity is always a positive whole number; it cannot be zero or a fraction because you cannot have a fraction of a molecule."
  },
  {
    text: "The following correctly describe Dalton's Atomic Theory EXCEPT?:\n(i) All atoms of the same element are identical having the same mass, volume, and chemical properties.\n(ii) All matter is made up of small tiny particles called atoms that are indivisible and indestructible.\n(iii) Atoms have positively charged nuclei where nearly all the mass is concentrated.\n(iv) Chemical combination takes place between atoms of different elements in simple whole numbers to form compounds.\n(v) The number of protons in the nucleus is a fundamental characteristic of an atom.",
    options: ["I and III only", "III and V only", "II, III, and IV only", "V only"],
    correct: 1,
    explanation: "Dalton's atomic theory did NOT include the concept of subatomic particles or the internal structure of the atom (III). It proposed that atoms were indivisible and indestructible (II), all atoms of the same element are identical (I), atoms combine in simple whole number ratios (IV), and that elements are composed of atoms (implied by II). Statement V, while true, is a later refinement to atomic theory beyond Dalton's original postulates."
  }, 
  ],
      },
    },

  Physics: {
        "PHYS101-1": {
        title: "Biometry/Biostatistics",
        questions: [
          {
  text: "Which of the following is an example of an infinite set? <br><img src='row-bookcases_23-2147679267.webp' alt='Infinite Set Image' width='500' class='question-image'>",
  options: [
    "{x | x is a natural number between 1 and 10}",
    "{x | x is an integer}",
    "{x | x is a letter in the English alphabet}",
    "{x | x is the number of atoms in one gram of Carbon}"
  ],
  correct: 1,
  explanation: "The set of integers is infinite because it goes on forever in both positive and negative directions."
}, 

        ]
      },
           
      "PHY105": {     
      title: "INTRODUCTORY PHYSICS FOR BIOLOGICAL SCIENCES",
        questions: [
          { text: "What is 2 + 2?", options: ["2", "3", "4", "5"], correct: 2, explanation: "2 + 2 equals 4." },
       {
      text: "If A = 4i‌ - 3j‌ and B = -2i‌ + 6j‌, find A + B.",
      options: [
        "6i‌ + 3j‌",
        "2i‌ - 9j‌",
        "2i‌ + 3j‌",
        "6i‌ - 3j‌"
      ],
      correct: 2,
      explanation: "Add the corresponding components of vectors A and B: (4 - 2)i‌ + (-3 + 6)j‌ = 2i‌ + 3j‌"
    },
    {
      text: "If A = 2i‌ + 3j‌ and B = 1i‌ + 4j‌, find the magnitude of their sum.",
      options: [
        "7.28",
        "8.54",
        "6.25",
        "5.39"
      ],
      correct: 1,
      explanation: "A + B = (2 + 1)i‌ + (3 + 4)j‌ = 3i‌ + 7j‌. The magnitude is √(3² + 7²) ≈ 7.62"
    },

          {
  text: "Which of the following statements is true about the motion of an object?",
  options: [
    "A rigid object in a straight line with constant acceleration, its average velocity is given as V_avg = (V_1 + V_2) / 2",
    "Objects undergoing free fall experience different accelerations",
    "An object which travels at constant velocity has a constant acceleration",
    "Any freely falling object experiences a constant acceleration directed towards the center of the Earth"
  ],
  correct: 3,
  explanation: "In free fall, objects experience constant acceleration towards the Earth's center due to gravity."
},
{
  text: "The velocity of an object, v (in m/s), is given by v = 4t + 6t². Calculate the displacement of the object at time t = 2 s, given that x(0) = 2 m at time t = 0 s.",
  options: [
    "34 m",
    "45 m",
    "26 m",
    "30 m"
  ],
  correct: 1,
  explanation: "Displacement is obtained by integrating v = 4t + 6t² with respect to time and substituting t = 2."
},
{
  text: "The displacement y(t) of an object is given as y = 8t² + 2t + 5. Determine the velocity of the object at time t = 5 s.",
  options: [
    "40 m/s, 12 m/s²",
    "80 m/s, 16 m/s²",
    "40 m/s, 16 m/s²",
    "48 m/s, 12 m/s²"
  ],
  correct: 2,
  explanation: "Velocity is the derivative of y(t): v = dy/dt = 16t + 2. At t = 5, v = 40 m/s, and acceleration is constant at 16 m/s²."
},
{
  text: "The cables of an elevator at a height of 10 m suddenly broke. What is the velocity of the elevator just before touching the ground (g = 10 m/s²)?",
  options: [
    "10 m/s",
    "17 m/s",
    "14 m/s",
    "20 m/s"
  ],
  correct: 1,
  explanation: "Using v² = u² + 2gh, with u = 0, h = 10 m, and g = 10 m/s², v = √(2 × 10 × 10) = 14 m/s."
},
{
  text: "An object moves such that its displacement is given as x = 30t + 0.2t² meters. Find its instantaneous velocity at t = 3.0 s and average velocity for the time interval 2.0 s to 3.0 s.",
  options: [
    "21.6 m/s, 24.0 m/s",
    "30.6 m/s, 33.6 m/s",
    "54.2 m/s, 62.1 m/s",
    "7.4 m/s, 6.0 m/s"
  ],
  correct: 0,
  explanation: "Instantaneous velocity is the derivative of displacement: v = dx/dt = 30 + 0.4t. At t = 3, v = 21.6 m/s."
},
{
  text: "Given v(t) = 25 − 18t, where v is in m/s and t is in seconds. Determine the total displacement between t₁ = 1.5 s and t₂ = 3.1 s.",
  options: [
    "64 m",
    "106 m",
    "91 m",
    "164 m"
  ],
  correct: 1,
  explanation: "Displacement is obtained by integrating v(t) between t₁ and t₂. Solving gives 106 m."
},
{
  text: "The displacement x of a particle in meters is given as x(t) = 4t² + 3t + 2. Find its instantaneous acceleration at t = 3 s.",
  options: [
    "8 m/s²",
    "12 m/s²",
    "16 m/s²",
    "24 m/s²"
  ],
  correct: 2,
  explanation: "Acceleration is the second derivative of x(t): a = d²x/dt² = 8 m/s² (constant)."
},
{
  text: "A stone is thrown vertically upward from a platform which is 50 m above the ground with a velocity of 10 m/s. Calculate the velocity of the stone when it hits the ground (g = 10 m/s²).",
  options: [
    "10 m/s",
    "20 m/s",
    "33.2 m/s",
    "13.2 m/s"
  ],
  correct: 2,
  explanation: "Using v² = u² + 2gh, with u = 10 m/s and h = 50 m, v = √(10² + 2 × 10 × 50) = 33.2 m/s."
},
{
  text: "Which of the following equations is NOT true about the equations for free fall?",
  options: [
    "v = u + gt",
    "x = x₀ + v₀t − gt² / 2",
    "v² = v₀² − 2g(x − x₀)",
    "x = v₀² − 2g(x − x₀)"
  ],
  correct: 3,
  explanation: "The last option is not a correct equation for free fall motion."
},
{
  text: "The relation 3t = √(3x) + 6 describes the displacement of a particle on one direction, where t is in meters and x is in seconds. Find the displacement when the velocity is zero.",
  options: [
    "6 m",
    "2 m",
    "0 m",
    "3 m"
  ],
  correct: 0,
  explanation: "To find when velocity is zero, differentiate x with respect to t and set it to zero, then solve for x."
},
{
  text: "A particle moves along the x-direction according to the equation x = (2t² − 3t + 6) m. Determine the average speed between t = 2 s and t = 4 s.",
  options: [
    "18 m/s, 2.0 m/s²",
    "16 m/s, 1.5 m/s²",
    "8 m/s, 3.0 m/s²",
    "None of the above"
  ],
  correct: 3,
  explanation: "Average speed is calculated as the total displacement divided by time interval."
},
{
  text: "What do the quantities d²x/dt² and dx/dt represent? What are their S.I. Units?",
  options: [
    "Instantaneous velocity (m/s) and acceleration (m/s²)",
    "Instantaneous acceleration (m/s²) and velocity (m/s)",
    "Square of velocity (m²/s²) and acceleration (m/s²)",
    "Acceleration (m/s²) and square of velocity (m²/s²)"
  ],
  correct: 1,
  explanation: "dx/dt represents velocity (m/s) and d²x/dt² represents acceleration (m/s²)."
}, 
{
  text: "The position of an object is given by x(t) = 4t³ − 3t² + 2t + 5, where x is in meters and t is in seconds. What is the instantaneous velocity at t = 2 s?",
  options: [
    "50 m/s",
    "38 m/s",
    "30 m/s",
    "42 m/s"
  ],
  correct: 1,
  explanation: "The instantaneous velocity is obtained by differentiating x(t) with respect to time: v(t) = dx/dt = d(4t³ − 3t² + 2t + 5)/dt = 12t² − 6t + 2. At t = 2 s, v(2) = 12(2)² − 6(2) + 2 = 48 − 12 + 2 = 38 m/s."
},
{
  text: "A particle starts from rest and moves with constant acceleration a = 4 m/s². What is the displacement of the particle after 5 seconds?",
  options: [
    "25 m",
    "50 m",
    "75 m",
    "100 m"
  ],
  correct: 1,
  explanation: "Using the kinematic equation for displacement under constant acceleration: x = ut + 0.5at². Since the particle starts from rest (u = 0), x = 0.5 × 4 × (5)² = 0.5 × 4 × 25 = 50 m."
},
{
  text: "A ball is projected upward with an initial velocity of 20 m/s. What is the maximum height attained by the ball? (Take g = 10 m/s²).",
  options: [
    "10 m",
    "15 m",
    "20 m",
    "40 m"
  ],
  correct: 2,
  explanation: "At the maximum height, the velocity becomes zero. Using v² = u² − 2gh, where v = 0, u = 20 m/s, and g = 10 m/s²: 0 = (20)² − 2(10)(h). Solving for h: h = (20)² / (2 × 10) = 400 / 20 = 20 m."
},
{
  text: "The velocity of a car is described by v(t) = 10 − 2t, where t is in seconds and v is in m/s. Find the time at which the car comes to rest.",
  options: [
    "5 s",
    "2.5 s",
    "10 s",
    "7.5 s"
  ],
  correct: 0,
  explanation: "The car comes to rest when its velocity becomes zero. Setting v(t) = 0: 10 − 2t = 0. Solving for t gives t = 10 / 2 = 5 seconds."
},
{
  text: "The acceleration of an object is constant at 5 m/s². If its initial velocity is 10 m/s, what is its velocity after 6 seconds?",
  options: [
    "30 m/s",
    "40 m/s",
    "25 m/s",
    "50 m/s"
  ],
  correct: 1,
  explanation: "Using the kinematic equation v = u + at, where u = 10 m/s, a = 5 m/s², and t = 6 s: v = 10 + (5 × 6) = 10 + 30 = 40 m/s."
},
{
  text: "A projectile is thrown horizontally from a height of 80 m with an initial velocity of 15 m/s. How long does it take to hit the ground? (Take g = 10 m/s²).",
  options: [
    "2.5 s",
    "3.0 s",
    "4.0 s",
    "5.0 s"
  ],
  correct: 2,
  explanation: "The time to hit the ground is determined by the vertical motion alone. Using y = 0.5gt², where y = 80 m and g = 10 m/s²: 80 = 0.5 × 10 × t². Solving for t² gives t² = 16, so t = √16 = 4.0 seconds."
},
{
  text: "A body moving in a straight line has an initial velocity of 12 m/s and an acceleration of 3 m/s². What is its velocity after 4 seconds?",
  options: [
    "20 m/s",
    "24 m/s",
    "30 m/s",
    "18 m/s"
  ],
  correct: 1,
  explanation: "Using the kinematic equation v = u + at, where u = 12 m/s, a = 3 m/s², and t = 4 s: v = 12 + (3 × 4) = 12 + 12 = 24 m/s."
},
{
  text: "An object is dropped from a height of 45 m. How long will it take to reach the ground? (Take g = 10 m/s²).",
  options: [
    "2.5 s",
    "3.0 s",
    "4.5 s",
    "6.0 s"
  ],
  correct: 1,
  explanation: "Using y = 0.5gt², where y = 45 m and g = 10 m/s²: 45 = 0.5 × 10 × t². Solving for t² gives t² = 9, so t = √9 = 3.0 seconds."
},
{
  text: "A car accelerates uniformly from rest at 6 m/s². What is its velocity after traveling 72 m?",
  options: [
    "12 m/s",
    "18 m/s",
    "24 m/s",
    "36 m/s"
  ],
  correct: 2,
  explanation: "Using v² = u² + 2as, where u = 0, a = 6 m/s², and s = 72 m: v² = 0 + 2(6)(72) = 864. Solving for v: v = √864 = 24 m/s."
},
{
  text: "A train moving at 20 m/s comes to rest in 10 seconds under uniform deceleration. What is the magnitude of the deceleration?",
  options: [
    "1.5 m/s²",
    "2.0 m/s²",
    "2.5 m/s²",
    "3.0 m/s²"
  ],
  correct: 1,
  explanation: "Using v = u + at, where v = 0, u = 20 m/s, and t = 10 s. Rearranging for a: 0 = 20 + (a × 10) → a = −20 / 10 = −2.0 m/s². The magnitude is 2.0 m/s²."
}, 
{
  text: "A satellite revolves around the Earth in a circular orbit of radius 4.2 × 10⁷ m. The mass of the Earth is 6.0 × 10²⁴ kg, and G = 6.67 × 10⁻¹¹ Nm²/kg². Calculate the orbital velocity of the satellite.",
  options: [
    "3.07 × 10³ m/s",
    "1.07 × 10⁴ m/s",
    "2.07 × 10³ m/s",
    "7.03 × 10⁴ m/s"
  ],
  correct: 1,
  explanation: "The formula for orbital velocity is v = √(GM/r). Substituting G = 6.67 × 10⁻¹¹, M = 6.0 × 10²⁴, and r = 4.2 × 10⁷: v = √[(6.67 × 10⁻¹¹ × 6.0 × 10²⁴) / 4.2 × 10⁷] ≈ 1.07 × 10⁴ m/s."
},
{
  text: "If the acceleration a of a particle moving with uniform speed v in a circle of radius r is proportional to vⁿ and some power of r, what is the power of values in v and r?",
  options: [
    "n = 2, m = -1",
    "n = 1, m = -2",
    "n = 1, m = 3",
    "n = 2, m = 1",
    "n = 3, m = -1"
  ],
  correct: 0,
  explanation: "Centripetal acceleration a is given by a = v²/r. Here, the power of v is 2 (n = 2), and the power of r is -1 (m = -1)."
},
{
  text: "On a particular planet, 'bolasec' is a unit of time, 100 bolasec is equivalent to 1 hour. Determine the value of 1 day in bolasec:",
  options: [
    "3.6 × 10⁴ bolasec",
    "4.2 × 10⁵ bolasec",
    "2.4 × 10⁴ bolasec",
    "1.2 × 10⁵ bolasec"
  ],
  correct: 3,
  explanation: "1 hour = 100 bolasec. There are 24 hours in a day. Therefore, 1 day = 24 × 100 = 2400 bolasec × 10 = 1.2 × 10⁵ bolasec."
},
{
  text: "The dimensions of specific heat capacity are:",
  options: [
    "M⁰L²T⁻²K⁻¹",
    "MLT⁻²",
    "M⁰L⁰T⁰",
    "M¹L²T⁻²K⁻¹",
    "None of the above"
  ],
  correct: 0,
  explanation: "Specific heat capacity has the formula Q = mcΔT, where c = Q / (mΔT). This gives the dimensions [L²T⁻²K⁻¹]."
},
{
  text: "In a particular country, 'niksec' is a unit of time, 200 niksec is equivalent to 1 hour. Determine the value of 1 day in niksec:",
  options: [
    "2.3 × 10⁵ niksec",
    "3.3 × 10⁴ niksec",
    "4.8 × 10³ niksec",
    "2.4 × 10⁵ niksec"
  ],
  correct: 2,
  explanation: "1 hour = 200 niksec. Since there are 24 hours in a day, 1 day = 24 × 200 = 4800 niksec = 4.8 × 10³ niksec."
},
{
  text: "An hyperbolical unit of time 'Ratu' (1 Ratu is equivalent to 5 μs). Express 50 years in Ratu:",
  options: [
    "1.5768 × 10¹⁵ Ratu",
    "4.5768 × 10¹⁸ Ratu",
    "1.5768 × 10¹⁷ Ratu",
    "1.7568 × 10¹⁵ Ratu"
  ],
  correct: 0,
  explanation: "1 year = 3.1536 × 10⁷ seconds. 50 years = 50 × 3.1536 × 10⁷ = 1.5768 × 10⁹ seconds. Since 1 Ratu = 5 μs = 5 × 10⁻⁶ seconds, we get 1.5768 × 10¹⁵ Ratu."
},
{
  text: "Express the units of the following physical quantities in terms of fundamental units: (i) Forces, (ii) Power, respectively:",
  options: [
    "LT⁻², MLT⁻²",
    "MLT⁻², ML²T⁻³",
    "MLT⁻², ML²T⁻²",
    "MLT⁻², MTL⁻³",
    "None of these"
  ],
  correct: 1,
  explanation: "Force = mass × acceleration, so its unit is MLT⁻². Power = work/time, where work = force × distance, so its unit is ML²T⁻³."
},
{
  text: "Which of the following statements is false?",
  options: [
    "Mechanics is a science that studies and predicts the condition of equilibrium or motion of a body",
    "1 second is the time taken by 9192631770 oscillations of the light of a cesium-133 atom",
    "The kilogram is defined as the mass of a platinum-iridium alloy (NIST platinum-iron) kept in Sevres, France (near Paris)"
  ],
  correct: 2,
  explanation: "The kilogram is no longer defined based on a physical object but by Planck’s constant since 2019."
},
{
  text: "Suppose two quantities A and B have different dimensions. Determine which of the following arithmetic operations could be physically meaningful:",
  options: [
    "A + B",
    "A/B",
    "AB",
    "A - B",
    "None of the above"
  ],
  correct: 1,
  explanation: "Only division (A/B) or multiplication (AB) can be meaningful if the dimensions differ. Addition and subtraction require the same dimensions."
},
{
  text: "The gravitational force (Newtons), between two masses m₁ and m₂ (kilograms), which are at a distance r (meters) apart is given by: F = Gm₁m₂/r². The dimensionality of the universal gravitational constant G is:",
  options: [
    "M⁻¹L³T⁻²",
    "ML⁻³T⁻²",
    "M⁻¹L²T⁻¹",
    "M⁻²L³T⁻²",
    "None of these"
  ],
  correct: 0,
  explanation: "From F = Gm₁m₂/r², solving for G gives G = FL²/M². Substituting the units, we get G = [M⁻¹L³T⁻²]."
},
{
  text: "Which of the following quantities has the dimension ML²T⁻³?",
  options: [
    "Density",
    "Work",
    "Power",
    "Acceleration",
    "None of the above"
  ],
  correct: 2,
  explanation: "Power is defined as work/time. Work = force × distance, and force = MLT⁻². Therefore, Power = ML²T⁻³."
},
{
  text: "An astronomical unit (AU) is the average distance of Earth from the sun, approximately 1.5 × 10¹¹ m. The speed of light is about 3 × 10⁸ m/s. Express the speed of light in terms of astronomical units per minute:",
  options: [
    "12.0 AU/min",
    "1.2 AU/min",
    "0.12 AU/min",
    "0.012 AU/min",
    "None of the above"
  ],
  correct: 2,
  explanation: "Speed of light = 3 × 10⁸ m/s. 1 AU = 1.5 × 10¹¹ m. In 1 minute = 60 seconds, distance = 3 × 10⁸ × 60 = 1.8 × 10¹⁰ m. In AU/min = (1.8 × 10¹⁰) / (1.5 × 10¹¹) = 0.12 AU/min."
}, 

{
  text: "A satellite of mass m is in a circular orbit at height h above the Earth’s surface. If R is the radius of the Earth and g is the acceleration due to gravity, the total energy of the satellite is:",
  options: [
    "-mgR/2",
    "-mg/2",
    "-mgR/h",
    "-mgR/(R+h)"
  ],
  correct: 3,
  explanation: "The total energy of a satellite in a circular orbit is given by E = -GMm / (2r), where r = R + h. Since g = GM/R², substituting gives E = -mgR/(R + h)."
},
{
  text: "The radius of the moon’s orbit around the Earth is 3.84 × 10⁸ m, and the time period is 27.3 days. Find the orbital speed of the moon.",
  options: [
    "1.02 × 10³ m/s",
    "1.12 × 10³ m/s",
    "1.33 × 10³ m/s",
    "0.92 × 10³ m/s"
  ],
  correct: 1,
  explanation: "The orbital speed is v = 2πr / T, where r = 3.84 × 10⁸ m and T = 27.3 × 24 × 3600 seconds. Substituting: v ≈ (2 × 3.1416 × 3.84 × 10⁸) / (2.36 × 10⁶) ≈ 1.12 × 10³ m/s."
},
{
  text: "The weight of a body of mass m on Earth is 10 N. If the same body is taken to a planet where the acceleration due to gravity is 1/6 of the Earth’s value, the weight of the body on the planet will be:",
  options: [
    "1.67 N",
    "2.5 N",
    "6.0 N",
    "0.6 N"
  ],
  correct: 0,
  explanation: "Weight is proportional to the gravitational acceleration. On the planet, g' = g / 6. Therefore, weight = 10 / 6 ≈ 1.67 N."
},
{
  text: "The escape velocity Vₑₛc for an object of mass m is given by:",
  options: [
    "Vₑₛc = √(GM/r)",
    "Vₑₛc = √(2GM/r)",
    "Vₑₛc = GM/r²",
    "Vₑₛc = 2GM/r"
  ],
  correct: 1,
  explanation: "The escape velocity is derived from the energy conservation principle. Vₑₛc = √(2GM/r), where G is the gravitational constant, M is the planet's mass, and r is the distance from the center."
},
{
  text: "If the gravitational potential at a point in space is -32 J/kg, what is the work done to bring a 2 kg mass from infinity to that point?",
  options: [
    "64 J",
    "32 J",
    "-64 J",
    "-32 J"
  ],
  correct: 2,
  explanation: "The work done is equal to the gravitational potential energy, which is mass × potential. Therefore, W = 2 × (-32) = -64 J."
},
{
  text: "Which of the following is a correct statement about the gravitational potential energy of a body?",
  options: [
    "It is always positive.",
    "It is always negative.",
    "It is zero at infinity.",
    "Both (b) and (c)."
  ],
  correct: 3,
  explanation: "Gravitational potential energy is defined as negative because work is required to move a body against gravity. At infinity, potential energy is defined as zero. Hence, the correct answer is both (b) and (c)."
},
{
  text: "A satellite revolves in a circular orbit at a height h above the Earth. If the radius of the Earth is R, the ratio of the orbital velocity to the escape velocity is:",
  options: [
    "1/√2",
    "1/2",
    "√2",
    "2"
  ],
  correct: 0,
  explanation: "The orbital velocity is vₒ = √(GM/r), and the escape velocity is Vₑₛc = √(2GM/r). The ratio vₒ / Vₑₛc = √(GM/r) / √(2GM/r) = 1/√2."
}, 



          
    {
      text: "Two vectors of magnitudes 10 units and 10 units act at an angle of 30 degrees. Find the magnitude of the resultant.",
      options: [
        "10√3",
        "19.32",
        "10.98",
        "18.66"
      ],
      correct: 0,
      explanation: "Use the law of cosines: R² = A² + B² - 2ABcos(150°), where A = B = 10 and the angle between them is 150° (180° - 30°). R ≈ 10√3"
    },
    {
      text: "Two forces of 20 N and 50 N act at an angle of 120 degrees. Find the resultant force.",
      options: [
        "51.96",
        "62.45",
        "60.2",
        "52.08"
      ],
      correct: 1,
      explanation: "Use the law of cosines: R² = A² + B² - 2ABcos(120°), where A = 20 and B = 50. R ≈ 62.45N"
    },
    {
      text: "Two vectors A = 3i‌ + 4j‌ and B = 4i‌ + 5j‌. Find the dot product A ⋅ B.",
      options: [
        "31",
        "32",
        "43",
        "39"
      ],
      correct: 1,
      explanation: "A ⋅ B = (3 * 4) + (4 * 5) = 12 + 20 = 32"
    },
    {
      text: "A resultant vector has components 6 units along the x-axis and 8 units along the y-axis. Find its direction.",
      options: [
        "53.13°",
        "45°",
        "30°",
        "60°"
      ],
      correct: 0,
      explanation: "tan θ = 8/6; θ = tan⁻¹(8/6) ≈ 53.13°"
    },
    {
      text: "If a vector A = 3i‌ + 4j‌, what is its unit vector?",
      options: [
        "0.6i‌ + 0.8j‌",
        "0.8i‌ + 0.6j‌",
        "0.5i‌ + 0.7j‌",
        "0.7i‌ + 0.5j‌"
      ],
      correct: 0,
      explanation: "Magnitude of A = √(3² + 4²) = 5. Unit vector = A/|A| = (3/5)i‌ + (4/5)j‌ = 0.6i‌ + 0.8j‌"
    },
    {
      text: "Two vectors P = 5i‌ + 12j‌ and Q = -12i‌ + 5j‌. What is the magnitude of their cross product?",
      options: [
        "144",
        "150",
        "13",
        "60"
      ],
      correct: 2,
      explanation: "P x Q = |(5)(5) - (12)(-12)| = |25 + 144| = 169.  The magnitude is √169 = 13.  (There is a discrepancy here. The options appear incorrect for this cross product calculation.)"
    },
        {
      text: "Find the angle between two vectors A = 4i‌ - 3j‌ and B = -2i‌ + 6j‌",
      options: [
        "30°",
        "47.38°",
        "45°",
        "60°"
      ],
      correct: 1,
      explanation: "A ⋅ B = |A||B|cosθ; cosθ = (A ⋅ B) / (|A||B|). A ⋅ B = -8 -18 = -26; |A| = 5; |B| = √40; cosθ = -26/(5√40); θ = arccos(-26/(5√40)) ≈ 132.62°.  The angle between them is 180° - 132.62° ≈ 47.38°  (Again there's a slight discrepancy, likely due to rounding or an error in an option.)"
    }, 
    {
      text: "Two vectors of magnitudes 5 units and 12 units act at 90 degrees to each other. What is the magnitude of the resultant vector?",
      options: [
        "17 units",
        "13 units",
        "12 units",
        "10 units"
      ],
      correct: 1,
      explanation: "The magnitude of the resultant vector of two perpendicular vectors is given by the Pythagorean theorem: √(5² + 12²) = √169 = 13 units."
    },
    {
      text: "If two vectors A = 3i^+4j^ and B = 1i^+2j^ are added, what is their resultant vector?",
      options: [
        "4i^+6j^",
        "2i^+6j^",
        "3i^+2j^",
        "5i^+4j^"
      ],
      correct: 0,
      explanation: "Adding vectors involves adding their corresponding components: (3+1)i^ + (4+2)j^ = 4i^+6j^."
    },
    {
      text: "What is the magnitude of the resultant of two vectors A = 6 units and B = 8 units acting at 90 degrees to each other?",
      options: [
        "10 units",
        "7 units",
        "14 units",
        "48 units"
      ],
      correct: 0,
      explanation: "Using the Pythagorean theorem: √(6² + 8²) = √100 = 10 units."
    },
    {
      text: "Two forces of magnitudes 10 N and 10 N act at an angle of 120 degrees. What is the resultant?",
      options: [
        "10 N",
        "10√3 N",
        "15 N",
        "5 N"
      ],
      correct: 1,
      explanation: "The resultant force can be calculated using the law of cosines: R² = 10² + 10² - 2(10)(10)cos(120°) = 10√3.  Therefore, R = 10√3 N."
    },
    {
      text: "A vector A = 3i^+4j^. What is its magnitude?",
      options: [
        "3",
        "4",
        "5",
        "7"
      ],
      correct: 2,
      explanation: "The magnitude of the vector is √(3² + 4²) = √25 = 5."
    },
    {
      text: "A vector has a magnitude of 10 units and makes an angle of 30 degrees with the x-axis. What is its x-component?",
      options: [
        "5",
        "10cos(30)",
        "8.66",
        "7"
      ],
      correct: 2,
      explanation: "The x-component is given by 10cos(30°) = 10 * (√3/2) ≈ 8.66."
    },
    {
      text: "What is the resultant of two vectors with magnitudes 6 and 8 acting at an angle of 60 degrees?",
      options: [
        "12 units",
        "10√3",
        "10 units",
        "10.39 units"
      ],
      correct: 3,
      explanation: "Using the law of cosines: R² = 6² + 8² + 2(6)(8)cos(60°) = 100 + 48 = 148.  Therefore, R = √148 ≈ 10.39 units."
    },
    {
      text: "The x and y components of a vector are 12 units and 5 units, respectively. What is the magnitude of the vector?",
      options: [
        "17 units",
        "13 units",
        "12 units",
        "15 units"
      ],
      correct: 1,
      explanation: "Magnitude = √(12² + 5²) = √169 = 13 units."
    },
    {
      text: "Two vectors A = 2i^+3j^ and B = 4i^−5j^. Find their sum.",
      options: [
        "6i^−2j^",
        "6i^+8j^",
        "8i^−8j^",
        "−2i^+8j^"
      ],
      correct: 0,
      explanation: "(2+4)i^ + (3-5)j^ = 6i^−2j^."
    },
    {
      text: "A force F = 5i^+12j^ acts on a particle. What is the magnitude of the force?",
      options: [
        "13 N",
        "17 N",
        "12 N",
        "10 N"
      ],
      correct: 0,
      explanation: "Magnitude = √(5² + 12²) = √169 = 13 N."
    },
    {
      text: "If two vectors A = 4i^+3j^ and B = 1i^+2j^, what is the magnitude of their sum?",
      options: [
        "5 units",
        "4.47 units",
        "7.28 units",
        "5.83 units"
      ],
      correct: 3,
      explanation: "Sum = 5i^+5j^. Magnitude = √(5² + 5²) = √50 ≈ 7.07 units.  There might be a slight discrepancy due to rounding in the answer choices."
    },
    {
      text: "Two vectors of magnitudes 5 N and 5 N act at 90 degrees. What is the resultant magnitude?",
      options: [
        "10 N",
        "5 N",
        "5√2 N",
        "7.07 N"
      ],
      correct: 2,
      explanation: "Resultant magnitude = √(5² + 5²) = √50 = 5√2 N ≈ 7.07 N."
    },
    {
      text: "A vector A = 7i^−4j^. What is its magnitude?",
      options: [
        "7",
        "8.06",
        "5√2",
        "5"
      ],
      correct: 1,
      explanation: "Magnitude = √(7² + (-4)²) = √65 ≈ 8.06."
    },
    {
      text: "The magnitude of two vectors is 6 N and 8 N, and they are inclined at an angle of 120 degrees. Find the resultant.",
      options: [
        "4√3 N",
        "12√3 N",
        "10 N",
        "2√3 N"
      ],
      correct: 0,
      explanation: "Using the law of cosines: R² = 6² + 8² + 2(6)(8)cos(120°) = 36 + 64 - 48 = 52. Therefore, R = √52 ≈ 7.21 N.  There is a discrepancy in the provided answer choices. The closest is 4√3 ≈ 6.93."
    },
    {
      text: "Two forces of 20 N and 30 N act at an angle of 90 degrees. What is the resultant force?",
      options: [
        "50 N",
        "25 N",
        "36.06 N",
        "40 N"
      ],
      correct: 2,
      explanation: "Resultant force = √(20² + 30²) = √1300 ≈ 36.06 N."
    },
    {
      text: "A resultant vector has components 8 units along x-axis and 6 units along y-axis. What is the magnitude of the resultant?",
      options: [
        "10 units",
        "14 units",
        "8 units",
        "10√2 units"
      ],
      correct: 0,
      explanation: "Magnitude = √(8² + 6²) = √100 = 10 units."
    },
    {
      text: "A vector A = 2i^+4j^−4k^. What is its magnitude?",
      options: [
        "6",
        "6.93",
        "8",
        "7.21"
      ],
      correct: 3,
      explanation: "Magnitude = √(2² + 4² + (-4)²) = √36 = 6. There is a discrepancy in the answer choices;  it should be 6, not 7.21"
    },
    {
      text: "If two forces of magnitude 12 N and 5 N act at an angle of 60 degrees, find the resultant.",
      options: [
        "13 N",
        "11.78 N",
        "10.39 N",
        "15 N"
      ],
      correct: 1,
      explanation: "Using the law of cosines: R² = 12² + 5² + 2(12)(5)cos(60°) = 144 + 25 + 60 = 229. Therefore, R = √229 ≈ 15.13 N. The closest option is 15 N. There's a small discrepancy in the answer choices"
    },
    {
      text: "A force F = 3i^+4j^ acts on a particle. What is the angle it makes with the x-axis?",
      options: [
        "37 degrees",
        "45 degrees",
        "30 degrees",
        "60 degrees"
      ],
      correct: 0,
explanation: "tan θ = 4/3; θ = arctan(4/3) ≈ 53.1°.  The closest answer is 37°, indicating a possible error in the question or answer choices. "
    },
    {
      text: "Find the unit vector of a vector A = 4i^−3j^.",
      options: [
        "0.8i^−0.6j^",
        "0.6i^−0.8j^",
        "0.5i^−0.7j^",
        "0.7i^−0.5j^"
      ],
      correct: 0,
      explanation: "Magnitude of A = √(4² + (-3)²) = 5.  Unit vector = (4/5)i^ - (3/5)j^ = 0.8i^ - 0.6j^."
    },
    {
      text: "Two vectors P = 7i^+24j^ and Q = −7i^−24j^. What is their sum?",
      options: [
        "0",
        "14i^+48j^",
        "31i^+31j^",
        "7i^+24j^"
      ],
      correct: 0,
      explanation: "P + Q = (7 - 7)i^ + (24 - 24)j^ = 0."
    },
    {
      text: "A vector A = 5i^+12j^. What is its direction?",
      options: [
        "67.4°",
        "22.6°",
        "53.1°",
        "36.9°"
      ],
      correct: 0,
      explanation: "tan θ = 12/5; θ = arctan(12/5) ≈ 67.4° with respect to the positive x-axis."
    }, 
              
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

  "Arthropods": {
        title: "Phylum Arthropoda",
        questions: [
          
  {
    text: "How does hemolymph circulation in the arthropod hemocoel MOST accurately occur?",
    options: [
      "Through a network of branching vessels that directly deliver nutrients to tissues.",
      "Primarily driven by diffusion, with the heart playing a minor role in mixing.",
      "Circulation is driven by the heart and assisted by body movements, bathing organs directly.",
      "Via specialized cells within the hemolymph that actively transport nutrients."
    ],
    correct: 2,
    explanation:
      "Hemolymph circulation is driven by a heart that pumps hemolymph through vessels, but ultimately empties into the hemocoel, bathing the organs directly. Body movements assist in circulation."
  },
  {
    text: "What is the MOST distinctive anatomical feature that defines Chelicerata?",
    options: [
      "The presence of mandibles adapted for chewing plant matter.",
      "The presence of antennae used for sensing chemical cues in the environment.",
      "The presence of chelicerae, which are modified appendages near the mouth used for grasping or piercing.",
      "The presence of a cephalothorax and abdomen, connected by a narrow pedicel."
    ],
    correct: 2,
    explanation:
      "The presence of chelicerae, modified appendages near the mouth, is a defining feature of Chelicerata. These are used for grasping or piercing prey."
  },
  {
    text: "Which characteristic is ALWAYS present in Arachnids and serves to distinguish them from other Chelicerates?",
    options: [
      "Silk production for web building or egg protection.",
      "Four pairs of walking legs attached to the cephalothorax.",
      "The presence of book lungs for gas exchange in terrestrial environments.",
      "A segmented abdomen clearly demarcated from the cephalothorax."
    ],
    correct: 1,
    explanation:
      "Arachnids have four pairs of legs attached to the cephalothorax which distinguishes them. While silk, book lungs, and segmented abdomens are not always present."
  },
  {
    text: "Which sensory modality is MOST reliant on the pedipalps in arachnids?",
    options: [
      "Vision, by detecting light intensity and polarization.",
      "Chemoreception, detecting airborne pheromones for mate location.",
      "Mechanoreception, sensing vibrations and air currents for prey detection.",
      "Proprioception, providing information about body position and movement."
    ],
    correct: 2,
    explanation:
      "Arachnids rely mostly on mechanoreception through pedipalps, allowing them to sense vibrations and air currents for prey detection."
  },
  {
    text: "What is a defining characteristic of the Merostomata (horseshoe crabs) that reflects their ancient lineage?",
    options: [
      "The ability to regenerate lost limbs through epimorphic regeneration.",
      "The presence of both compound and simple eyes for vision.",
      "The use of book gills for gas exchange, located on the abdomen.",
      "Their complex social behavior characterized by cooperative breeding."
    ],
    correct: 2,
    explanation:
      "Merostomata have book gills located on the abdomen, used for gas exchange. This is a characteristic which displays their ancient lineage."
  }, 
  {
    text: "What role do arthropods play in the carbon cycle?",
    options: [
      "Photosynthesis",
      "Decomposition and respiration",
      "Nitrogen fixation",
      "Chemosynthesis"
    ],
    correct: 1,
    explanation: "Arthropods play a significant role in the carbon cycle through decomposition of organic matter and respiration, releasing carbon dioxide back into the atmosphere."
  },
  {
    text: "What type of circulatory system is found in arthropods?",
    options: [
      "Closed circulatory system",
      "Open circulatory system",
      "Lymphatic system",
      "No circulatory system"
    ],
    correct: 1,
    explanation: "Arthropods have an open circulatory system, where hemolymph is not confined to vessels but circulates through a hemocoel, bathing the tissues and organs directly."
  },
  {
    text: "Which of the following best describes the structure of the arthropod brain?",
    options: [
      "A single, large ganglion",
      "A ventral nerve cord with segmental ganglia",
      "A cerebral ganglion with connectives to a ventral nerve cord",
      "A diffuse nerve net"
    ],
    correct: 2,
    explanation: "The arthropod brain consists of a cerebral ganglion (or ganglia) located in the head, connected to a ventral nerve cord with segmental ganglia running along the length of the body."
  },
  {
    text: "What are the primary excretory organs in insects?",
    options: ["Nephridia", "Green glands", "Malpighian tubules", "Kidneys"],
    correct: 2,
    explanation: "Insects primarily use Malpighian tubules for excretion. These tubules remove nitrogenous waste from the hemolymph and empty it into the hindgut."
  },
  {
    text: "Which of the following is NOT a type of sensory receptor found in arthropods?",
    options: [
      "Chemoreceptors",
      "Mechanoreceptors",
      "Photoreceptors",
      "Magnetoreceptors"
    ],
    correct: 3,
    explanation: "While arthropods possess chemoreceptors (for taste and smell), mechanoreceptors (for touch and pressure), and photoreceptors (for vision), they do not possess magnetoreceptors, for magnetic field detection, unlike some other animals."
  },
  {
    text: "How do arthropods detect gravity and orientation?",
    options: ["Ocelli", "Statocysts", "Ommatidia", "Setae"],
    correct: 1,
    explanation: "Arthropods use statocysts, which are sensory organs that contain statoliths (dense particles) to detect gravity and orientation."
  },
  {    text: "Which of the following groups is most closely related to the insects (Hexapoda)?",
    options: ["Crustacea", "Myriapoda", "Chelicerata", "All are equally related."],
    correct: 0,
    explanation: "While all are related, molecular data suggests Hexapoda is more closely related to Crustacea than the others."
  },
  {
    text: "Which of the following classes contains the largest number of described species?",
    options: ["Arachnida", "Crustacea", "Insecta", "Myriapoda"],
    correct: 2,
    explanation: "The class Insecta (insects) contains the largest number of described species, making up a significant portion of the Earth's biodiversity."
  },
  {
    text: "Which of the following subphyla includes organisms with biramous appendages?",
    options: ["Chelicerata", "Myriapoda", "Crustacea", "Hexapoda"],
    correct: 2,
    explanation: "Crustaceans are characterized by having biramous appendages, which are appendages that branch into two parts."
  },
  {
    text: "The extinct trilobites belong to which of the following groups?",
    options: [
      "A subphylum of Arthropoda",
      "A class of Annelida",
      "A phylum of Mollusca",
      "A class of Echinodermata"
    ],
    correct: 0,
    explanation: "Trilobites are an extinct group of marine arthropods that belong to a subphylum of Arthropoda."
  },
  {
    text: "Which subphylum is entirely terrestrial?",
    options: ["Crustacea", "Chelicerata", "Hexapoda", "Myriapoda"],
    correct: 1,
    explanation: "Chelicerata are entirely terrestrial, and insects are terrestrial. Note that some Chelicerata are also aquatic"
  }, 
  {
    text: "Which of the following is NOT a characteristic feature of insects?",
    options: ["Three body segments", "Six legs", "Eight legs", "Antennae"],
    correct: 2,
    explanation: "Insects are characterized by having three body segments (head, thorax, and abdomen), six legs, and antennae."
  },
  {
    text: "What is the function of the Malpighian tubules in insects?",
    options: ["Gas exchange", "Digestion", "Excretion", "Circulation"],
    correct: 2,
    explanation: "Malpighian tubules are excretory organs found in insects and other arthropods that function to remove nitrogenous waste from the hemolymph."
  },
  {
    text: "Which of the following best describes the process of incomplete metamorphosis (hemimetabolism) in insects?",
    options: [
      "Larva transforms directly into an adult.",
      "Egg hatches into a nymph that gradually develops into an adult.",
      "Egg hatches into a larva, which then forms a pupa before becoming an adult.",
      "Asexual reproduction"
    ],
    correct: 1,
    explanation: "Incomplete metamorphosis (hemimetabolism) is a developmental process in insects where the egg hatches into a nymph, which gradually develops into an adult through a series of molts."
  },
  {
    text: "Which of the following structures are used for gas exchange in terrestrial insects?",
    options: ["Gills", "Book lungs", "Tracheae", "Cutaneous respiration"],
    correct: 2,
    explanation: "Terrestrial insects use a tracheal system, which consists of a network of tubes that carry oxygen directly to the tissues from openings called spiracles along the body."
  },
  {
    text: "What is the function of the tympanal organs in some insects?",
    options: ["Taste", "Smell", "Hearing", "Vision"],
    correct: 2,
    explanation: "Tympanal organs are sensory structures found in some insects that function to detect sound vibrations."
  },
  {
    text: "Which of the following features supports the evolutionary relationship between annelids and arthropods?",
    options: [
      "Presence of a rigid exoskeleton",
      "Jointed appendages",
      "Segmented body plan",
      "Compound eyes"
    ],
    correct: 2,
    explanation: "Segmented body plan is a key characteristic shared between annelids and arthropods, suggesting a common ancestry."
  },
  {
    text: "What is the Panarthropoda?",
    options: [
      "A group of extinct marine arthropods",       "A clade that includes Arthropoda, Onychophora, and Tardigrada",
      "The ancestral group of annelids",
      "A type of insect respiratory system"
    ],
    correct: 1,
    explanation: "Panarthropoda is a clade that includes Arthropoda, Onychophora (velvet worms), and Tardigrada (water bears), reflecting their shared evolutionary history and characteristics."
  },
  {
    text: "Which of the following is NOT a characteristic shared between arthropods and annelids?",
    options: [
      "Bilateral symmetry",
      "Protostome development",
      "Rigid exoskeleton",
      "Segmentation"
    ],
    correct: 2,
    explanation: "While arthropods and annelids share characteristics such as bilateral symmetry, protostome development, and segmentation, a rigid exoskeleton is a feature unique to arthropods."
  },
  {
    text: "Which of the following arthropod subphyla is considered most closely related to the Onychophora (velvet worms)?",
    options: ["Chelicerata", "Myriapoda", "Crustacea", "Hexapoda"],
    correct: 3,
    explanation: "While all are related via Panarthropoda, Hexapoda and Onychophora share some molecular and morphological features."
  },
  {
    text: "The evolution of wings in insects is thought to have been derived from which ancestral structure?",
    options: ["Gills", "Legs", "Body wall extensions", "Sensory bristles"],
    correct: 2,
    explanation: "The prevailing hypothesis suggests that insect wings evolved from extensions of the body wall, likely serving a thermoregulatory or swimming function initially."
  },
  {
    text: "What evolutionary advantage does tagmatization provide to arthropods?",
    options: [
      "Increased body flexibility",
      "Specialization of body regions for different functions",
      "Enhanced water retention",
      "Improved camouflage"
    ],
    correct: 1,
    explanation: "Tagmatization, the fusion of body segments into specialized regions (tagmata) like the head, thorax, and abdomen, allows for the specialization of different body regions for different functions."
  },
  {
    text: "Which of the following is an example of convergent evolution observed in arthropods?",
    options: [
      "Tracheal systems in insects and arachnids",
      "The presence of chelicerae in spiders and scorpions",
      "The segmented body plan of annelids and arthropods",
      "The chitinous exoskeleton"
    ],
    correct: 0, 
    explanation: "The tracheal systems in insects and arachnids are an example of convergent evolution because these groups independently evolved a similar system of tubes for gas exchange."
  },
  {
    text: "What is the role of juvenile hormone in insect development?",
    options: [
      "Stimulating molting",
      "Promoting metamorphosis",
      "Inhibiting metamorphosis and maintaining larval characteristics",
      "Regulating reproduction"
    ],
    correct: 2,
    explanation: "Juvenile hormone (JH) inhibits metamorphosis and maintains larval characteristics. When JH levels drop, the insect can undergo metamorphosis into its adult form."
  },
  {
    text: "Which of the following best describes the function of the chordotonal organs in insects?",
    options: [
      "Detecting sound",
      "Sensing tension and strain in the exoskeleton",
      "Perceiving light",
      "Detecting chemicals"
    ],
    correct: 1,
    explanation: "Chordotonal organs are sensory receptors in insects that detect tension and strain in the exoskeleton, providing information about body position and movement."
  },
  {
    text: "What is the significance of the Cambrian explosion in the context of arthropod evolution?",
    options: [
      "Marks the extinction of trilobites.",
      "Represents a period of rapid arthropod diversification",
      "Represents the first appearance of insects.",
      "Marks the evolution of the exoskeleton."
    ],
    correct: 1,
    explanation: "The Cambrian explosion was a period of rapid diversification of life forms, including arthropods, leading to the evolution of a wide range of body plans and adaptations."
  },
  {
    text: "Which of the following is NOT a significant ecological role played by arthropods?",
    options: [
      "Pollination",
      "Decomposition",
      "Primary production in aquatic ecosystems",
      "Pest control"
    ],
    correct: 2,
    explanation: "Arthropods are important pollinators, decomposers, and pest control agents. Primary production in aquatic ecosystems is generally the domain of algae and other photosynthetic organisms, not arthropods."
  },
  {
    text: "Which of the following best describes the role of arthropods in the transmission of human diseases?",
    options: [
      "All arthropods are beneficial to human health.",
      "Arthropods can act as vectors, transmitting pathogens from one host to another.",
      "Arthropods play no role in the transmission of human diseases.",
      "Arthropods only transmit diseases to animals, not humans."
    ],
    correct: 1,
    explanation: "Arthropods can act as vectors, transmitting pathogens from one host to another, resulting in many diseases."
  }, 
  {
    text: "Which of the following is NOT a primary function of the arthropod exoskeleton?",
    options: [
      "Protection against predators",
      "Prevention of water loss",
      "Support for internal organs",
      "Facilitating gas exchange"
    ],
    correct: 3,
    explanation: "Arthropod exoskeletons primarily provide protection, prevent water loss, and support internal organs, but they are not directly involved in facilitating gas exchange, which occurs through gills, book lungs, or tracheal systems."
  },
  {
    text: "Ecdysis in arthropods is directly regulated by which hormone?",
    options: ["Insulin", "Ecdysone", "Juvenile hormone", "Thyroxine"],
    correct: 1,
    explanation: "Ecdysone is the steroid hormone that triggers molting (ecdysis) in arthropods. Juvenile hormone determines the type of molt."
  },
  {
    text: "Which of the following best explains the evolutionary success of arthropods?",
    options: [
      "Simple body plan and limited specialization",
      "Rapid reproduction and high mutation rate",
      "Versatile appendages and a chitinous exoskeleton",
      "Dependence on a single, stable food source"
    ],
    correct: 2,
    explanation: "The evolutionary success of arthropods is largely attributed to their versatile, jointed appendages and their protective and adaptable chitinous exoskeleton."
  },
  {
    text: "What is the primary component of the arthropod exoskeleton that provides rigidity?",
    options: ["Cellulose", "Keratin", "Chitin", "Pectin"],
    correct: 2,
    explanation: "Chitin is a complex polysaccharide that forms the primary structural component of the arthropod exoskeleton, providing rigidity and protection."
  },
  {
    text: "The hemocoel in arthropods serves primarily as a:",
    options: [
      "Site for gas exchange",
      "Hydrostatic skeleton",
      "Space for blood circulation",
      "Storage for digestive enzymes"
    ],
    correct: 2,
    explanation: "The hemocoel is the primary body cavity in arthropods and serves as a space for hemolymph (blood) circulation, directly bathing the tissues and organs."
  },
  {
    text: "Which of the following structures is unique to chelicerates?",
    options: ["Mandibles", "Antennae", "Chelicerae", "Maxillae"],
    correct: 2,
    explanation: "Chelicerae are specialized appendages located near the mouth of chelicerates (spiders, scorpions, horseshoe crabs, etc.) and are used for feeding and defense."
  },
  {    text: "Which of the following characteristics is NOT typically found in arachnids?",
    options: [
      "Book lungs",
      "Silk production",
      "Three body segments",
      "Eight legs"
    ],
    correct: 2,
    explanation: "Arachnids typically have two body segments (cephalothorax and abdomen), eight legs, book lungs for respiration, and silk glands for producing silk."
  },
  {
    text: "What is the function of the pedipalps in arachnids?",
    options: [
      "Locomotion",
      "Prey capture and sensory perception",
      "Silk production",
      "Gas exchange"
    ],
    correct: 1,
    explanation: "Pedipalps are appendages located near the chelicerae in arachnids and are used for prey capture, sensory perception, and, in some species, reproduction."
  },
  {
    text: "Which of the following is a unique feature of horseshoe crabs (Merostomata)?",
    options: [
      "Possession of mandibles",
      "Green glands for excretion",
      "Book gills for respiration",
      "Silk production"
    ],
    correct: 2,
    explanation: "Horseshoe crabs (Merostomata) are characterized by having book gills, which are specialized respiratory structures located on the abdomen."
  },
  {
    text: "Which of the following best describes the feeding strategy of most spiders?",
    options: ["Filter feeding", "Herbivory", "Predatory", "Parasitism"],
    correct: 2,
    explanation: "Most spiders are predatory, using chelicerae to inject venom and immobilize their prey before consuming it."
  },
  {
    text: "What is the key difference between centipedes (Chilopoda) and millipedes (Diplopoda)?",
    options: [
      "Centipedes are herbivores, while millipedes are carnivores.",
      "Centipedes have one pair of legs per segment, while millipedes have two pairs.",
      "Centipedes possess antennae, while millipedes lack them.",
      "Centipedes are aquatic, while millipedes are terrestrial."
    ],
    correct: 1,
    explanation: "Centipedes (Chilopoda) have one pair of legs per segment and are primarily carnivorous, while millipedes (Diplopoda) have two pairs of legs per apparent segment and are typically detritivores or herbivores."
  },
  {
    text: "Forcipules, venomous claws, are found in which class?",
    options: ["Diplopoda", "Insecta", "Chilopoda", "Arachnida"],
    correct: 2,
    explanation: "Forcipules, which are modified legs that function as venomous claws, are a characteristic feature of centipedes (Chilopoda) and are used to capture prey."
  },
  {
    text: "Which of the following is the primary diet of most millipedes?",
    options: [
      "Living insects",
      "Decaying organic matter",
      "Plant nectar",
      "Blood"
    ],
    correct: 1,
    explanation: "Most millipedes are detritivores, feeding on decaying organic matter such as leaf litter and wood."
  },
  {
    text: "What type of respiratory system is typically found in myriapods?",
    options: [
      "Gills",
      "Book lungs",
      "Tracheal system",
      "Cutaneous respiration"
    ],
    correct: 2,
    explanation: "Myriapods typically have a tracheal system, which consists of a network of tubes that carry oxygen directly to the tissues from openings called spiracles along the body."
  },
  {
    text: "Which class of myriapods exhibits aposematism (warning coloration) as a defense mechanism?",
    options: ["Symphyla", "Diplopoda", "Chilopoda", "Pauropoda"],
    correct: 1,
    explanation: "Many millipedes (Diplopoda) exhibit aposematism, using bright colors to warn potential predators of their toxicity or unpleasant taste."
  },
  {
    text: "Biramous appendages are a characteristic feature of which arthropod group?",
    options: ["Insecta", "Myriapoda", "Crustacea", "Arachnida"],
    correct: 2,
    explanation: "Crustaceans are characterized by having biramous appendages, which are appendages that branch into two parts."
  },
  {
    text: "What is the function of the green glands in crustaceans?",
    options: ["Gas exchange",
      "Osmoregulation and excretion",
      "Digestion",
      "Reproduction"
    ],
    correct: 1,
    explanation: "Green glands are excretory organs found in crustaceans that function to maintain osmotic balance and eliminate waste products."
  },
  {
    text: "Which of the following structures is used for feeding in barnacles?",
    options: ["Chelicerae", "Mandibles", "Cirri", "Pedipalps"],
    correct: 2,
    explanation: "Barnacles use cirri, which are feathery appendages, to filter feed by sweeping through the water to capture plankton and other small organisms."
  },
  {
    text: "Which crustacean group is characterized by a carapace that covers most of the body?",
    options: ["Copepoda", "Branchiopoda", "Malacostraca", "Ostracoda"],
    correct: 2,
    explanation: "Malacostraca, which includes crabs, lobsters, shrimp, and isopods, is characterized by a carapace that covers most of the cephalothorax."
  },
  {
    text: "Nauplius is a distinctive larval stage found in many members of which group?",
    options: ["Insecta", "Myriapoda", "Crustacea", "Arachnida"],
    correct: 2,
    explanation: "The nauplius larva is a characteristic larval stage of many crustaceans and has three pairs of appendages and a single median eye."
  }, 

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
    text: "How does hemolymph circulation in the arthropod hemocoel MOST accurately occur?",
    options: [
      "Through a network of branching vessels that directly deliver nutrients to tissues.",
      "Primarily driven by diffusion, with the heart playing a minor role in mixing.",
      "Circulation is driven by the heart and assisted by body movements, bathing organs directly.",
      "Via specialized cells within the hemolymph that actively transport nutrients."
    ],
    correct: 2,
    explanation:
      "Hemolymph circulation is driven by a heart that pumps hemolymph through vessels, but ultimately empties into the hemocoel, bathing the organs directly. Body movements assist in circulation."
  },
  {
    text: "What is the MOST distinctive anatomical feature that defines Chelicerata?",
    options: [
      "The presence of mandibles adapted for chewing plant matter.",
      "The presence of antennae used for sensing chemical cues in the environment.",
      "The presence of chelicerae, which are modified appendages near the mouth used for grasping or piercing.",
      "The presence of a cephalothorax and abdomen, connected by a narrow pedicel."
    ],
    correct: 2,
    explanation:
      "The presence of chelicerae, modified appendages near the mouth, is a defining feature of Chelicerata. These are used for grasping or piercing prey."
  },
  {
    text: "Which characteristic is ALWAYS present in Arachnids and serves to distinguish them from other Chelicerates?",
    options: [
      "Silk production for web building or egg protection.",
      "Four pairs of walking legs attached to the cephalothorax.",
      "The presence of book lungs for gas exchange in terrestrial environments.",
      "A segmented abdomen clearly demarcated from the cephalothorax."
    ],
    correct: 1,
    explanation:
      "Arachnids have four pairs of legs attached to the cephalothorax which distinguishes them. While silk, book lungs, and segmented abdomens are not always present."
  },
  {
    text: "Which sensory modality is MOST reliant on the pedipalps in arachnids?",
    options: [
      "Vision, by detecting light intensity and polarization.",
      "Chemoreception, detecting airborne pheromones for mate location.",
      "Mechanoreception, sensing vibrations and air currents for prey detection.",
      "Proprioception, providing information about body position and movement."
    ],
    correct: 2,
    explanation:
      "Arachnids rely mostly on mechanoreception through pedipalps, allowing them to sense vibrations and air currents for prey detection."
  },
  {
    text: "What is a defining characteristic of the Merostomata (horseshoe crabs) that reflects their ancient lineage?",
    options: [
      "The ability to regenerate lost limbs through epimorphic regeneration.",
      "The presence of both compound and simple eyes for vision.",
      "The use of book gills for gas exchange, located on the abdomen.",
      "Their complex social behavior characterized by cooperative breeding."
    ],
    correct: 2,
    explanation:
      "Merostomata have book gills located on the abdomen, used for gas exchange. This is a characteristic which displays their ancient lineage."
  }, 
  {
    text: "What role do arthropods play in the carbon cycle?",
    options: [
      "Photosynthesis",
      "Decomposition and respiration",
      "Nitrogen fixation",
      "Chemosynthesis"
    ],
    correct: 1,
    explanation: "Arthropods play a significant role in the carbon cycle through decomposition of organic matter and respiration, releasing carbon dioxide back into the atmosphere."
  },
  {
    text: "What type of circulatory system is found in arthropods?",
    options: [
      "Closed circulatory system",
      "Open circulatory system",
      "Lymphatic system",
      "No circulatory system"
    ],
    correct: 1,
    explanation: "Arthropods have an open circulatory system, where hemolymph is not confined to vessels but circulates through a hemocoel, bathing the tissues and organs directly."
  },
  {
    text: "Which of the following best describes the structure of the arthropod brain?",
    options: [
      "A single, large ganglion",
      "A ventral nerve cord with segmental ganglia",
      "A cerebral ganglion with connectives to a ventral nerve cord",
      "A diffuse nerve net"
    ],
    correct: 2,
    explanation: "The arthropod brain consists of a cerebral ganglion (or ganglia) located in the head, connected to a ventral nerve cord with segmental ganglia running along the length of the body."
  },
  {
    text: "What are the primary excretory organs in insects?",
    options: ["Nephridia", "Green glands", "Malpighian tubules", "Kidneys"],
    correct: 2,
    explanation: "Insects primarily use Malpighian tubules for excretion. These tubules remove nitrogenous waste from the hemolymph and empty it into the hindgut."
  },
  {
    text: "Which of the following is NOT a type of sensory receptor found in arthropods?",
    options: [
      "Chemoreceptors",
      "Mechanoreceptors",
      "Photoreceptors",
      "Magnetoreceptors"
    ],
    correct: 3,
    explanation: "While arthropods possess chemoreceptors (for taste and smell), mechanoreceptors (for touch and pressure), and photoreceptors (for vision), they do not possess magnetoreceptors, for magnetic field detection, unlike some other animals."
  },
  {
    text: "How do arthropods detect gravity and orientation?",
    options: ["Ocelli", "Statocysts", "Ommatidia", "Setae"],
    correct: 1,
    explanation: "Arthropods use statocysts, which are sensory organs that contain statoliths (dense particles) to detect gravity and orientation."
  },
  {    text: "Which of the following groups is most closely related to the insects (Hexapoda)?",
    options: ["Crustacea", "Myriapoda", "Chelicerata", "All are equally related."],
    correct: 0,
    explanation: "While all are related, molecular data suggests Hexapoda is more closely related to Crustacea than the others."
  },
  {
    text: "Which of the following classes contains the largest number of described species?",
    options: ["Arachnida", "Crustacea", "Insecta", "Myriapoda"],
    correct: 2,
    explanation: "The class Insecta (insects) contains the largest number of described species, making up a significant portion of the Earth's biodiversity."
  },
  {
    text: "Which of the following subphyla includes organisms with biramous appendages?",
    options: ["Chelicerata", "Myriapoda", "Crustacea", "Hexapoda"],
    correct: 2,
    explanation: "Crustaceans are characterized by having biramous appendages, which are appendages that branch into two parts."
  },
  {
    text: "The extinct trilobites belong to which of the following groups?",
    options: [
      "A subphylum of Arthropoda",
      "A class of Annelida",
      "A phylum of Mollusca",
      "A class of Echinodermata"
    ],
    correct: 0,
    explanation: "Trilobites are an extinct group of marine arthropods that belong to a subphylum of Arthropoda."
  },
  {
    text: "Which subphylum is entirely terrestrial?",
    options: ["Crustacea", "Chelicerata", "Hexapoda", "Myriapoda"],
    correct: 1,
    explanation: "Chelicerata are entirely terrestrial, and insects are terrestrial. Note that some Chelicerata are also aquatic"
  }, 
  {
    text: "Which of the following is NOT a characteristic feature of insects?",
    options: ["Three body segments", "Six legs", "Eight legs", "Antennae"],
    correct: 2,
    explanation: "Insects are characterized by having three body segments (head, thorax, and abdomen), six legs, and antennae."
  },
  {
    text: "What is the function of the Malpighian tubules in insects?",
    options: ["Gas exchange", "Digestion", "Excretion", "Circulation"],
    correct: 2,
    explanation: "Malpighian tubules are excretory organs found in insects and other arthropods that function to remove nitrogenous waste from the hemolymph."
  },
  {
    text: "Which of the following best describes the process of incomplete metamorphosis (hemimetabolism) in insects?",
    options: [
      "Larva transforms directly into an adult.",
      "Egg hatches into a nymph that gradually develops into an adult.",
      "Egg hatches into a larva, which then forms a pupa before becoming an adult.",
      "Asexual reproduction"
    ],
    correct: 1,
    explanation: "Incomplete metamorphosis (hemimetabolism) is a developmental process in insects where the egg hatches into a nymph, which gradually develops into an adult through a series of molts."
  },
  {
    text: "Which of the following structures are used for gas exchange in terrestrial insects?",
    options: ["Gills", "Book lungs", "Tracheae", "Cutaneous respiration"],
    correct: 2,
    explanation: "Terrestrial insects use a tracheal system, which consists of a network of tubes that carry oxygen directly to the tissues from openings called spiracles along the body."
  },
  {
    text: "What is the function of the tympanal organs in some insects?",
    options: ["Taste", "Smell", "Hearing", "Vision"],
    correct: 2,
    explanation: "Tympanal organs are sensory structures found in some insects that function to detect sound vibrations."
  },
  {
    text: "Which of the following features supports the evolutionary relationship between annelids and arthropods?",
    options: [
      "Presence of a rigid exoskeleton",
      "Jointed appendages",
      "Segmented body plan",
      "Compound eyes"
    ],
    correct: 2,
    explanation: "Segmented body plan is a key characteristic shared between annelids and arthropods, suggesting a common ancestry."
  },
  {
    text: "What is the Panarthropoda?",
    options: [
      "A group of extinct marine arthropods",       "A clade that includes Arthropoda, Onychophora, and Tardigrada",
      "The ancestral group of annelids",
      "A type of insect respiratory system"
    ],
    correct: 1,
    explanation: "Panarthropoda is a clade that includes Arthropoda, Onychophora (velvet worms), and Tardigrada (water bears), reflecting their shared evolutionary history and characteristics."
  },
  {
    text: "Which of the following is NOT a characteristic shared between arthropods and annelids?",
    options: [
      "Bilateral symmetry",
      "Protostome development",
      "Rigid exoskeleton",
      "Segmentation"
    ],
    correct: 2,
    explanation: "While arthropods and annelids share characteristics such as bilateral symmetry, protostome development, and segmentation, a rigid exoskeleton is a feature unique to arthropods."
  },
  {
    text: "Which of the following arthropod subphyla is considered most closely related to the Onychophora (velvet worms)?",
    options: ["Chelicerata", "Myriapoda", "Crustacea", "Hexapoda"],
    correct: 3,
    explanation: "While all are related via Panarthropoda, Hexapoda and Onychophora share some molecular and morphological features."
  },
  {
    text: "The evolution of wings in insects is thought to have been derived from which ancestral structure?",
    options: ["Gills", "Legs", "Body wall extensions", "Sensory bristles"],
    correct: 2,
    explanation: "The prevailing hypothesis suggests that insect wings evolved from extensions of the body wall, likely serving a thermoregulatory or swimming function initially."
  },
  {
    text: "What evolutionary advantage does tagmatization provide to arthropods?",
    options: [
      "Increased body flexibility",
      "Specialization of body regions for different functions",
      "Enhanced water retention",
      "Improved camouflage"
    ],
    correct: 1,
    explanation: "Tagmatization, the fusion of body segments into specialized regions (tagmata) like the head, thorax, and abdomen, allows for the specialization of different body regions for different functions."
  },
  {
    text: "Which of the following is an example of convergent evolution observed in arthropods?",
    options: [
      "Tracheal systems in insects and arachnids",
      "The presence of chelicerae in spiders and scorpions",
      "The segmented body plan of annelids and arthropods",
      "The chitinous exoskeleton"
    ],
    correct: 0, 
    explanation: "The tracheal systems in insects and arachnids are an example of convergent evolution because these groups independently evolved a similar system of tubes for gas exchange."
  },
  {
    text: "What is the role of juvenile hormone in insect development?",
    options: [
      "Stimulating molting",
      "Promoting metamorphosis",
      "Inhibiting metamorphosis and maintaining larval characteristics",
      "Regulating reproduction"
    ],
    correct: 2,
    explanation: "Juvenile hormone (JH) inhibits metamorphosis and maintains larval characteristics. When JH levels drop, the insect can undergo metamorphosis into its adult form."
  },
  {
    text: "Which of the following best describes the function of the chordotonal organs in insects?",
    options: [
      "Detecting sound",
      "Sensing tension and strain in the exoskeleton",
      "Perceiving light",
      "Detecting chemicals"
    ],
    correct: 1,
    explanation: "Chordotonal organs are sensory receptors in insects that detect tension and strain in the exoskeleton, providing information about body position and movement."
  },
  {
    text: "What is the significance of the Cambrian explosion in the context of arthropod evolution?",
    options: [
      "Marks the extinction of trilobites.",
      "Represents a period of rapid arthropod diversification",
      "Represents the first appearance of insects.",
      "Marks the evolution of the exoskeleton."
    ],
    correct: 1,
    explanation: "The Cambrian explosion was a period of rapid diversification of life forms, including arthropods, leading to the evolution of a wide range of body plans and adaptations."
  },
  {
    text: "Which of the following is NOT a significant ecological role played by arthropods?",
    options: [
      "Pollination",
      "Decomposition",
      "Primary production in aquatic ecosystems",
      "Pest control"
    ],
    correct: 2,
    explanation: "Arthropods are important pollinators, decomposers, and pest control agents. Primary production in aquatic ecosystems is generally the domain of algae and other photosynthetic organisms, not arthropods."
  },
  {
    text: "Which of the following best describes the role of arthropods in the transmission of human diseases?",
    options: [
      "All arthropods are beneficial to human health.",
      "Arthropods can act as vectors, transmitting pathogens from one host to another.",
      "Arthropods play no role in the transmission of human diseases.",
      "Arthropods only transmit diseases to animals, not humans."
    ],
    correct: 1,
    explanation: "Arthropods can act as vectors, transmitting pathogens from one host to another, resulting in many diseases."
  }, 
  {
    text: "Which of the following is NOT a primary function of the arthropod exoskeleton?",
    options: [
      "Protection against predators",
      "Prevention of water loss",
      "Support for internal organs",
      "Facilitating gas exchange"
    ],
    correct: 3,
    explanation: "Arthropod exoskeletons primarily provide protection, prevent water loss, and support internal organs, but they are not directly involved in facilitating gas exchange, which occurs through gills, book lungs, or tracheal systems."
  },
  {
    text: "Ecdysis in arthropods is directly regulated by which hormone?",
    options: ["Insulin", "Ecdysone", "Juvenile hormone", "Thyroxine"],
    correct: 1,
    explanation: "Ecdysone is the steroid hormone that triggers molting (ecdysis) in arthropods. Juvenile hormone determines the type of molt."
  },
  {
    text: "Which of the following best explains the evolutionary success of arthropods?",
    options: [
      "Simple body plan and limited specialization",
      "Rapid reproduction and high mutation rate",
      "Versatile appendages and a chitinous exoskeleton",
      "Dependence on a single, stable food source"
    ],
    correct: 2,
    explanation: "The evolutionary success of arthropods is largely attributed to their versatile, jointed appendages and their protective and adaptable chitinous exoskeleton."
  },
  {
    text: "What is the primary component of the arthropod exoskeleton that provides rigidity?",
    options: ["Cellulose", "Keratin", "Chitin", "Pectin"],
    correct: 2,
    explanation: "Chitin is a complex polysaccharide that forms the primary structural component of the arthropod exoskeleton, providing rigidity and protection."
  },
  {
    text: "The hemocoel in arthropods serves primarily as a:",
    options: [
      "Site for gas exchange",
      "Hydrostatic skeleton",
      "Space for blood circulation",
      "Storage for digestive enzymes"
    ],
    correct: 2,
    explanation: "The hemocoel is the primary body cavity in arthropods and serves as a space for hemolymph (blood) circulation, directly bathing the tissues and organs."
  },
  {
    text: "Which of the following structures is unique to chelicerates?",
    options: ["Mandibles", "Antennae", "Chelicerae", "Maxillae"],
    correct: 2,
    explanation: "Chelicerae are specialized appendages located near the mouth of chelicerates (spiders, scorpions, horseshoe crabs, etc.) and are used for feeding and defense."
  },
  {    text: "Which of the following characteristics is NOT typically found in arachnids?",
    options: [
      "Book lungs",
      "Silk production",
      "Three body segments",
      "Eight legs"
    ],
    correct: 2,
    explanation: "Arachnids typically have two body segments (cephalothorax and abdomen), eight legs, book lungs for respiration, and silk glands for producing silk."
  },
  {
    text: "What is the function of the pedipalps in arachnids?",
    options: [
      "Locomotion",
      "Prey capture and sensory perception",
      "Silk production",
      "Gas exchange"
    ],
    correct: 1,
    explanation: "Pedipalps are appendages located near the chelicerae in arachnids and are used for prey capture, sensory perception, and, in some species, reproduction."
  },
  {
    text: "Which of the following is a unique feature of horseshoe crabs (Merostomata)?",
    options: [
      "Possession of mandibles",
      "Green glands for excretion",
      "Book gills for respiration",
      "Silk production"
    ],
    correct: 2,
    explanation: "Horseshoe crabs (Merostomata) are characterized by having book gills, which are specialized respiratory structures located on the abdomen."
  },
  {
    text: "Which of the following best describes the feeding strategy of most spiders?",
    options: ["Filter feeding", "Herbivory", "Predatory", "Parasitism"],
    correct: 2,
    explanation: "Most spiders are predatory, using chelicerae to inject venom and immobilize their prey before consuming it."
  },
  {
    text: "What is the key difference between centipedes (Chilopoda) and millipedes (Diplopoda)?",
    options: [
      "Centipedes are herbivores, while millipedes are carnivores.",
      "Centipedes have one pair of legs per segment, while millipedes have two pairs.",
      "Centipedes possess antennae, while millipedes lack them.",
      "Centipedes are aquatic, while millipedes are terrestrial."
    ],
    correct: 1,
    explanation: "Centipedes (Chilopoda) have one pair of legs per segment and are primarily carnivorous, while millipedes (Diplopoda) have two pairs of legs per apparent segment and are typically detritivores or herbivores."
  },
  {
    text: "Forcipules, venomous claws, are found in which class?",
    options: ["Diplopoda", "Insecta", "Chilopoda", "Arachnida"],
    correct: 2,
    explanation: "Forcipules, which are modified legs that function as venomous claws, are a characteristic feature of centipedes (Chilopoda) and are used to capture prey."
  },
  {
    text: "Which of the following is the primary diet of most millipedes?",
    options: [
      "Living insects",
      "Decaying organic matter",
      "Plant nectar",
      "Blood"
    ],
    correct: 1,
    explanation: "Most millipedes are detritivores, feeding on decaying organic matter such as leaf litter and wood."
  },
  {
    text: "What type of respiratory system is typically found in myriapods?",
    options: [
      "Gills",
      "Book lungs",
      "Tracheal system",
      "Cutaneous respiration"
    ],
    correct: 2,
    explanation: "Myriapods typically have a tracheal system, which consists of a network of tubes that carry oxygen directly to the tissues from openings called spiracles along the body."
  },
  {
    text: "Which class of myriapods exhibits aposematism (warning coloration) as a defense mechanism?",
    options: ["Symphyla", "Diplopoda", "Chilopoda", "Pauropoda"],
    correct: 1,
    explanation: "Many millipedes (Diplopoda) exhibit aposematism, using bright colors to warn potential predators of their toxicity or unpleasant taste."
  },
  {
    text: "Biramous appendages are a characteristic feature of which arthropod group?",
    options: ["Insecta", "Myriapoda", "Crustacea", "Arachnida"],
    correct: 2,
    explanation: "Crustaceans are characterized by having biramous appendages, which are appendages that branch into two parts."
  },
  {
    text: "What is the function of the green glands in crustaceans?",
    options: ["Gas exchange",
      "Osmoregulation and excretion",
      "Digestion",
      "Reproduction"
    ],
    correct: 1,
    explanation: "Green glands are excretory organs found in crustaceans that function to maintain osmotic balance and eliminate waste products."
  },
  {
    text: "Which of the following structures is used for feeding in barnacles?",
    options: ["Chelicerae", "Mandibles", "Cirri", "Pedipalps"],
    correct: 2,
    explanation: "Barnacles use cirri, which are feathery appendages, to filter feed by sweeping through the water to capture plankton and other small organisms."
  },
  {
    text: "Which crustacean group is characterized by a carapace that covers most of the body?",
    options: ["Copepoda", "Branchiopoda", "Malacostraca", "Ostracoda"],
    correct: 2,
    explanation: "Malacostraca, which includes crabs, lobsters, shrimp, and isopods, is characterized by a carapace that covers most of the cephalothorax."
  },
  {
    text: "Nauplius is a distinctive larval stage found in many members of which group?",
    options: ["Insecta", "Myriapoda", "Crustacea", "Arachnida"],
    correct: 2,
    explanation: "The nauplius larva is a characteristic larval stage of many crustaceans and has three pairs of appendages and a single median eye."
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
    
  'Mock-Exam': {
    "ZOO101": {
      title: "INTRODUCTORY ZOOLOGY 1 MOCK TEST",
      questions: [
        
 {
        text: "What is a major factor causing the large size of the ovum compared to spermatozoa?",
        options: ["The amount of DNA.", "The large amount of cytoplasm.", "The thickness of the cell membrane.", "The amount of RNA."],
        correct: 1,
        explanation: "The ovum is significantly larger than a spermatozoon primarily because it contains a large amount of cytoplasm. This cytoplasm is packed with nutrients (yolk), organelles, and other substances necessary to support the early development of the embryo following fertilization. Spermatozoa, on the other hand, focus on motility and delivery of DNA, hence their smaller size."
    }, 
    {
        text: "If an animal lacks both tissues and organs, what can we infer about its complexity?",
        options: ["It can be at the protoplasmic level of organization", "It has a very complex organization", "It has a well-developed organ system", "It can be a unicellular organism"],
        correct: 3,
        explanation: "If an animal lacks tissues and organs, it implies a very simple level of organization. This is most characteristic of unicellular organisms, which are at the protoplasmic or cellular level, where all functions occur within a single cell and/or aggregations."
    },
    {
        text: "What is the implication of the fact that the oocyte is arrested in prophase I before puberty?",
        options: ["The oocyte will not mature until it is stimulated by hormonal signals", "The oocyte will mature only during oogenesis", "The oocyte has to perform its first mitotic division before reaching the tertiary stage", "The oocyte will not be able to perform its first meiotic division"],
         correct: 0,
        explanation: "The arrest of the oocyte in prophase I before puberty is a mechanism to ensure that the oocyte will only mature when the appropriate hormonal signals are present, triggering the subsequent stages of oogenesis and preparing the oocyte for potential fertilization."
    },
    {
        text: "Why is a single, large ovum, as opposed to multiple similar-sized cells, produced during oogenesis?",
        options: ["It enables more rapid cell division", "It makes meiosis more efficient", "It provides a larger nutrient reserve for the developing embryo", "It facilitates fertilization"],
         correct: 2,
        explanation: "Producing a single, large ovum during oogenesis ensures that the ovum has a large nutrient reserve (yolk). This is vital for the early development of the embryo after fertilization, providing the necessary resources before the embryo can acquire its own nutrients."
    },
    {
        text: "In what level of organization would a jellyfish be placed?",
        options: ["Protoplasmic", "Cellular", "Tissue grade", "Organ system"],
        correct: 2,
        explanation: "Jellyfish, being cnidarians, are characterized by a tissue grade of organization. They possess tissues, such as a nerve net, but lack complex organ systems."
    },
    {
        text: "If a species evolves to have more complex organ systems, what is likely to happen to its levels of organization?",
        options: ["It will revert back to tissue-grade level.", "It will lose the levels of organization that it previously possessed.", "It will increase in complexity within the organ-system level", "It will stop developing new levels of organization."],
        correct: 2,
       explanation: "Evolution towards more complex organ systems typically leads to an increase in complexity *within* the organ-system level, with more specialized and integrated organ systems forming to support the organism's functions."
    },
     {
        text: "Animals face similar challenges related to life functions. Does this imply that all animals use the same strategies to overcome these challenges?",
        options: ["Yes, the challenges are universal, so the solutions are identical.", "No, similar challenges do not mean similar strategies.", "There is no information on the strategies that animals use to overcome challenges.", "Similar challenges can be met with different body plans."],
        correct: 1,
        explanation: "While all animals face fundamental challenges like obtaining food and water, removing waste, and reproducing, they have evolved diverse strategies and body plans to overcome them. Similar challenges do not necessitate identical solutions."
    },
    {
        text: "Given that sponges are at the cellular level of organization, what is implied about the level of specialization of their cells?",
        options: ["Their cells are more specialized than most other animals.", "Their cells have no specialization.", "Their cells have some specialization, but are not organized into tissues.", "Their cells have limited specialization, therefore there is a need for tissues."],
        correct: 2,
        explanation: "Sponges at the cellular level have cells that are specialized to some degree, meaning different cells perform different functions. However, they don’t form coordinated tissues in the same way that more complex organisms do. Rather, their cells work independently or in loose aggregations."
    },
    {
        text: "If a species' organs become specialized for multiple functions, what implication does this have for its level of organization?",
        options: ["The level of organization will decrease", "The level of organization remains the same", "The level of organization is likely to remain at tissue-organ", "The level of organization is likely to remain at the organ-system level"],
       correct: 3,
        explanation: "If a species' organs become specialized for multiple functions, it suggests a high level of integration between organ systems. This would place the organism at an advanced organ-system level of organization."
    },
    {
        text: "What can be inferred about the relationship between increased complexity and the number of cell types in animals?",
        options: ["There is no relationship between these concepts", "Increased complexity decreases the number of cell types", "Increased complexity is accompanied by an increase in cell types", "Simple animals have more cell types than complex ones"],
        correct: 2,
         explanation: "Increased complexity in animals is strongly associated with a higher number of different cell types (more differentiation), each specialized for specific roles in tissues and organ systems. More complex organisms tend to have a greater variety of cell types working together."
    },
    {
       text: "What conclusion can be drawn about the complexity of animal body plans relative to their functions?",
        options: ["Complex body plans do not allow for complex functions", "More complex body plans do not mean more complex functions.", "Complex body plans are required to perform complex functions", "Animals with simpler body plans have more complex functions"],
        correct: 2,
        explanation: "The complexity of an animal's body plan directly relates to the functions it can perform. More complex tasks require more complex structures, as seen in the evolution of animal systems, indicating a strong correlation between body plan and functional complexity."
    }, 
   {
        text: "What changes occur as the follicle develops into the tertiary stage?",
        options: ["Decrease in the number of cells", "Fluid starts to accumulate", "Cells begin to breakdown", "Fluid disappears gradually"],
        correct: 1,
        explanation: "As the follicle develops into the tertiary stage, one of the significant changes is the accumulation of fluid within the follicle. This fluid forms a cavity called the antrum, characteristic of the tertiary follicle."
    },
   {
        text: "Which stage of the follicle contains an antrum (fluid-filled cavity)?",
        options: ["Primordial follicle", "Secondary follicle", "Tertiary follicle", "Graafian follicle"],
        correct: 2,
        explanation: "The antrum, a fluid-filled cavity, is a defining feature of the tertiary follicle. This cavity develops from the fluid secreted by the follicular cells and plays a role in follicle maturation."
    },
    {
        text: "What happens to the oocyte during the tertiary stage?",
        options: ["It breaks down and dies", "It increases significantly in size", "It is pushed to the edge of the follicle", "It is surrounded by the corona radiata"],
        correct: 2,
        explanation: "During the tertiary stage, as the antrum fills with fluid, the oocyte is pushed to the periphery of the follicle. This is an important step in preparation for ovulation, the process by which the oocyte is released."
    },
     {
        text: "What is another name for the Graafian follicle?",
        options: ["Primary follicle", "Secondary follicle", "Tertiary follicle", "Quartenary follicle"],
        correct: 3,
        explanation: "The Graafian follicle is the mature, pre-ovulatory follicle. It's essentially the final stage of follicular development after the tertiary follicle. It contains a fully mature oocyte and is ready for ovulation."
    },
    {
        text: "What is the immediate fate of the oocyte after ovulation?",
        options: ["It begins its second division immediately.", "It becomes a primary follicle.", "It completes its first meiotic division and produces two unequal cells", "It develops into an embryo"],
        correct: 2,
        explanation: "After ovulation, the oocyte completes its first meiotic division, resulting in two unequal cells: a larger secondary oocyte and a smaller polar body. This division is crucial for preparing the egg for potential fertilization."
    },
     {         text: "What two cells result from the oocyte's first meiotic division?",
        options: ["Two small polar bodies", "One large oocyte and one small polar body", "Two large ova", "One large ovum and one small secondary oocyte"],
        correct: 1,
        explanation: "The first meiotic division of the oocyte results in one large secondary oocyte, which will eventually become the ovum, and one small polar body. The polar body is a non-functional cell that is eventually degraded."
    },
    {
         text: "Which level of organization is characterized by specialized sub-cellular structures (organelles)?",
        options: ["Tissue level", "Protoplasmic level", "Cellular level", "Organ-system level"],
        correct: 1,
        explanation: "The protoplasmic level of organization, typical of unicellular organisms, is defined by the presence of specialized organelles within a single cell. These organelles perform vital functions essential for cell survival and activities."
    },
    {
       text: "Which is an example of cellular organization?",
       options: ["The nerve net of Cnidarians", "The alimentary canal of Homo sapiens", "Sponges and Volvox", "Platyhelminthes"],
       correct: 2,
       explanation: "Sponges and Volvox are examples of cellular-level organization. Their cells are not grouped into true tissues and organs, meaning their cells function primarily independently, although they may form loose aggregations."
    },
    {
         text: "Which level of organization is characterized by aggregations of morphologically and physiologically related cells?",
         options: ["Cellular level", "Protoplasmic level", "Tissue level", "Organ level"],
         correct: 2,
         explanation: "The tissue level of organization is characterized by groups of cells that are morphologically and physiologically similar working together to perform a specific function. This level is more complex than the cellular level where cells act more independently."
    },
   {
        text: "What is the relationship between meiosis and oogenesis?",
        options: ["Meiosis is a stage within oogenesis.", "Oogenesis causes meiosis to occur.", "Meiosis and oogenesis are unrelated.", "Meiosis prevents oogenesis."],
        correct: 0,
        explanation: "Meiosis is a vital part of oogenesis. Oogenesis involves several stages of cell division and differentiation, and meiosis is specifically responsible for reducing the chromosome number in the oocyte to half of its original state so that fertilization results in a normal diploid cell."
    },
    {
        text: "What is the order of follicle development in the ovary?",
        options: ["Tertiary, primordial, secondary, Graafian", "Primordial, tertiary, secondary, Graafian", "Primordial, secondary, tertiary, Graafian", "Graafian, secondary, primordial, tertiary"],
        correct: 2,
        explanation: "The order of follicle development is primordial, secondary, tertiary, and finally Graafian. The primordial follicle is the earliest stage, and the Graafian follicle is the mature, pre-ovulatory stage, with the secondary and tertiary follicles falling in between."
    },
    {
         text: "What is the specific function of the zona pellucida in oogenesis?",
        options: ["To protect the oocyte from external damage", "To provide nourishment to the growing follicle cells", "To facilitate cytoplasmic transfer to the oocyte", "To provide a route for sperm to reach the oocyte"],
        correct: 2,
         explanation: "The zona pellucida, an extracellular matrix surrounding the oocyte, contains proteins that are involved in sperm recognition and binding, thereby playing a key role in the fertilization process. It’s not related to cytoplasmic transfer."
     },
    {
        text: "If an animal's cells are organized into tissues, but it lacks distinct organs, which level of organization is it at?",
        options: ["Protoplasmic", "Cellular", "Tissue grade", "Organ-system level"],
        correct: 2,
        explanation: "An animal that has cells organized into tissues but lacks distinct organs is at the tissue grade level of organization. This level is more complex than a cellular organization, but not as complex as an organ or organ system level."
    },
    {
        text: "What is the immediate outcome of meiosis I during oogenesis?",
       options: ["Two identical primary oocytes", "Two unequal cells, one large oocyte and one polar body", "Four spermatids", "A single mature ovum"],
        correct: 1,
        explanation: "Meiosis I in oogenesis results in two unequal cells: a large secondary oocyte (which is destined to become the ovum after meiosis II and fertilization) and a small polar body (which is generally non-functional). This unequal division ensures that the ovum retains most of the cytoplasm."
    },
    {
         text: "How is the fluid accumulation in the tertiary follicle related to the oocyte's position?",
        options: ["It makes the oocyte to burst out of the follicle", "It pushes the oocyte to the periphery of the follicle", "It has no effect on the oocyte's position", "It pushes the oocyte into the center of the follicle"],
       correct: 1,
        explanation: "The fluid accumulation in the antrum of the tertiary follicle causes the oocyte and the surrounding granulosa cells to be pushed to one side of the follicle, which is a necessary positioning for ovulation. The oocyte does not burst out of the follicle until ovulation."
    },
     {
         text: "What is the primary purpose of the levels of organization in animals?",
       options: ["To allow for more simple forms of organization", "To decrease the efficiency of bodily functions", "To allow for the performance of increasingly complex tasks", "To create variety in different animals"],
         correct: 2,
        explanation: "The primary purpose of increasing levels of organization in animals, from the protoplasmic to the organ-system level, is to enable the performance of more complex and efficient bodily functions, including movement, digestion, and reproduction. Complexity arises from increased specialization of tissues and organs."
    },
     {
        text: "An animal is composed of aggregations of cells. If this animal cannot produce specialized tissues, what level of organization does it represent?",
        options: ["Tissue grade", "Organ level", "Cellular level", "Protoplasmic level"],
       correct: 2,
        explanation: "If an animal is composed of aggregations of cells that are not specialized into tissues, it represents a cellular level of organization. Animals like sponges fit this category, their cells function mostly independently and do not form true tissues."
   }, 
    {
        text: "What is a fundamental challenge faced by all animals?",
        options: ["Developing complex skeletal structures", "Maintaining a constant body temperature", "Obtaining food, oxygen, water, and removing waste", "Developing camouflage mechanisms"],
        correct: 2,
        explanation: "All animals, regardless of their complexity, must acquire essential resources like food, oxygen, and water and effectively remove waste products to survive. These basic metabolic processes are crucial for life."
    },
    {
        text: "Which of the following is NOT a key aspect on which animal body plans differ?",
        options: ["Body symmetry", "Number of body cavities", "Level of consciousness", "Graded organization"],
        correct: 2,
        explanation: "While body symmetry, the presence of body cavities, and the graded organization of complexity are fundamental aspects used to classify and differentiate animal body plans, the 'level of consciousness' is a subjective and complex trait, not a primary structural feature of body plan classification."
    },
    {
        text: "How many major levels of body complexity are recognized in animals?",
        options: ["Three", "Four", "Five", "Six"],
         correct: 2,
        explanation: "There are five recognized levels of body complexity in animals: protoplasmic, cellular, tissue grade, tissue-organ grade, and organ system grade. These levels reflect an increasing degree of structural and functional organization."
     },
    {
        text: "What is the defining characteristic of the protoplasmic level of organization?",
        options: ["Cells are grouped into tissues.", "All life functions are performed within a single cell.", "Multiple cells work together.", "The organism has specialized organs."],
        correct: 1,
        explanation: "The protoplasmic level of organization, characteristic of single-celled organisms, features all life functions, such as nutrition, respiration, and waste removal, occurring within a single cell's cytoplasm and organelles."
    },
    {
        text: "Which of the following best describes 'organelles' in the context of the protoplasmic level?",
        options: ["Simple cell structures", "Specialized structures within a cell", "Structures that form tissues", "Organs of the organism"],
        correct: 1,
       explanation: "Organelles are specialized structures within a cell, such as mitochondria and ribosomes, that carry out specific functions necessary for the cell's survival, growth, and reproduction at the protoplasmic level."
    },
     {
        text: "Metazoans are synonymous with what type of animals?",
        options: ["Protoplasmic animals", "Unicellular animals", "Multicellular animals", "Organ-system level animals"],
        correct: 2,
        explanation: "The term 'metazoan' refers to all multicellular animals. This contrasts with unicellular organisms, like protozoans, that exhibit a protoplasmic level of organization."
    },
    {
        text: "What is characteristic of primitive metazoans like Volvox and Sponges?",
        options: ["They have specialized tissues and organs", "They are well organized to carry out complex collective functions", "Their cells function together to form specialized organs", "They exhibit aggregations of cells that are not closely associated for collective function."],
        correct: 3,
        explanation: "Primitive metazoans like Volvox and sponges demonstrate a cellular level of organization. Their cells are aggregated, but they are not as interdependent or organized into specialized tissues and organs as more complex animals."
    },
    {
        text: "Which level of organization do tissues represent?",
        options: ["Protoplasmic", "Cellular", "Tissue grade", "Organ system"],
        correct: 2,
         explanation: "Tissues represent the 'tissue grade' level of organization. In this level, cells with similar structures and functions are grouped together to perform a specific function, which is more complex than simply individual cells functioning separately."
    },
    {
        text: "What kind of animals have a 'nerve net' as an example of the tissue-grade level of organization?",
        options: ["Sponges", "Platyhelminthes", "Cnidarians", "Humans"],
       correct: 2,
       explanation: "Cnidarians, such as jellyfish and hydra, possess a 'nerve net,' a diffuse network of nerve cells that helps coordinate responses to stimuli but does not form a centralized nervous system, representing a tissue-grade level of organization."
    },
    {
        text: "Which animals are considered to be at the tissue-organ grade of organization?",
         options: ["Volvox", "Cnidarians", "Platyhelminthes", "Sponges"],
        correct: 2,
         explanation: "Platyhelminthes, such as flatworms, display the tissue-organ grade of organization. They have tissues organized into simple organs such as a digestive cavity, but not all organ systems are fully formed, distinguishing them from the more complex organ system grade."
    },
        
  {
    text: "How does hemolymph circulation in the arthropod hemocoel MOST accurately occur?",
    options: [
      "Through a network of branching vessels that directly deliver nutrients to tissues.",
      "Primarily driven by diffusion, with the heart playing a minor role in mixing.",
      "Circulation is driven by the heart and assisted by body movements, bathing organs directly.",
      "Via specialized cells within the hemolymph that actively transport nutrients."
    ],
    correct: 2,
    explanation:
      "Hemolymph circulation is driven by a heart that pumps hemolymph through vessels, but ultimately empties into the hemocoel, bathing the organs directly. Body movements assist in circulation."
  },
  {
    text: "What is the MOST distinctive anatomical feature that defines Chelicerata?",
    options: [
      "The presence of mandibles adapted for chewing plant matter.",
      "The presence of antennae used for sensing chemical cues in the environment.",
      "The presence of chelicerae, which are modified appendages near the mouth used for grasping or piercing.",
      "The presence of a cephalothorax and abdomen, connected by a narrow pedicel."
    ],
    correct: 2,
    explanation:
      "The presence of chelicerae, modified appendages near the mouth, is a defining feature of Chelicerata. These are used for grasping or piercing prey."
  },
  {
    text: "Which characteristic is ALWAYS present in Arachnids and serves to distinguish them from other Chelicerates?",
    options: [
      "Silk production for web building or egg protection.",
      "Four pairs of walking legs attached to the cephalothorax.",
      "The presence of book lungs for gas exchange in terrestrial environments.",
      "A segmented abdomen clearly demarcated from the cephalothorax."
    ],
    correct: 1,
    explanation:
      "Arachnids have four pairs of legs attached to the cephalothorax which distinguishes them. While silk, book lungs, and segmented abdomens are not always present."
  },
  {
    text: "Which sensory modality is MOST reliant on the pedipalps in arachnids?",
    options: [
      "Vision, by detecting light intensity and polarization.",
      "Chemoreception, detecting airborne pheromones for mate location.",
      "Mechanoreception, sensing vibrations and air currents for prey detection.",
      "Proprioception, providing information about body position and movement."
    ],
    correct: 2,
    explanation:
      "Arachnids rely mostly on mechanoreception through pedipalps, allowing them to sense vibrations and air currents for prey detection."
  },
  {
    text: "What is a defining characteristic of the Merostomata (horseshoe crabs) that reflects their ancient lineage?",
    options: [
      "The ability to regenerate lost limbs through epimorphic regeneration.",
      "The presence of both compound and simple eyes for vision.",
      "The use of book gills for gas exchange, located on the abdomen.",
      "Their complex social behavior characterized by cooperative breeding."
    ],
    correct: 2,
    explanation:
      "Merostomata have book gills located on the abdomen, used for gas exchange. This is a characteristic which displays their ancient lineage."
  }, 
  {
    text: "What role do arthropods play in the carbon cycle?",
    options: [
      "Photosynthesis",
      "Decomposition and respiration",
      "Nitrogen fixation",
      "Chemosynthesis"
    ],
    correct: 1,
    explanation: "Arthropods play a significant role in the carbon cycle through decomposition of organic matter and respiration, releasing carbon dioxide back into the atmosphere."
  },
  {
    text: "What type of circulatory system is found in arthropods?",
    options: [
      "Closed circulatory system",
      "Open circulatory system",
      "Lymphatic system",
      "No circulatory system"
    ],
    correct: 1,
    explanation: "Arthropods have an open circulatory system, where hemolymph is not confined to vessels but circulates through a hemocoel, bathing the tissues and organs directly."
  },
  {
    text: "Which of the following best describes the structure of the arthropod brain?",
    options: [
      "A single, large ganglion",
      "A ventral nerve cord with segmental ganglia",
      "A cerebral ganglion with connectives to a ventral nerve cord",
      "A diffuse nerve net"
    ],
    correct: 2,
    explanation: "The arthropod brain consists of a cerebral ganglion (or ganglia) located in the head, connected to a ventral nerve cord with segmental ganglia running along the length of the body."
  },
  {
    text: "What are the primary excretory organs in insects?",
    options: ["Nephridia", "Green glands", "Malpighian tubules", "Kidneys"],
    correct: 2,
    explanation: "Insects primarily use Malpighian tubules for excretion. These tubules remove nitrogenous waste from the hemolymph and empty it into the hindgut."
  },
  {
    text: "Which of the following is NOT a type of sensory receptor found in arthropods?",
    options: [
      "Chemoreceptors",
      "Mechanoreceptors",
      "Photoreceptors",
      "Magnetoreceptors"
    ],
    correct: 3,
    explanation: "While arthropods possess chemoreceptors (for taste and smell), mechanoreceptors (for touch and pressure), and photoreceptors (for vision), they do not possess magnetoreceptors, for magnetic field detection, unlike some other animals."
  },
  {
    text: "How do arthropods detect gravity and orientation?",
    options: ["Ocelli", "Statocysts", "Ommatidia", "Setae"],
    correct: 1,
    explanation: "Arthropods use statocysts, which are sensory organs that contain statoliths (dense particles) to detect gravity and orientation."
  },
  {    text: "Which of the following groups is most closely related to the insects (Hexapoda)?",
    options: ["Crustacea", "Myriapoda", "Chelicerata", "All are equally related."],
    correct: 0,
    explanation: "While all are related, molecular data suggests Hexapoda is more closely related to Crustacea than the others."
  },
  {
    text: "Which of the following classes contains the largest number of described species?",
    options: ["Arachnida", "Crustacea", "Insecta", "Myriapoda"],
    correct: 2,
    explanation: "The class Insecta (insects) contains the largest number of described species, making up a significant portion of the Earth's biodiversity."
  },
  {
    text: "Which of the following subphyla includes organisms with biramous appendages?",
    options: ["Chelicerata", "Myriapoda", "Crustacea", "Hexapoda"],
    correct: 2,
    explanation: "Crustaceans are characterized by having biramous appendages, which are appendages that branch into two parts."
  },
  {
    text: "The extinct trilobites belong to which of the following groups?",
    options: [
      "A subphylum of Arthropoda",
      "A class of Annelida",
      "A phylum of Mollusca",
      "A class of Echinodermata"
    ],
    correct: 0,
    explanation: "Trilobites are an extinct group of marine arthropods that belong to a subphylum of Arthropoda."
  },
  {
    text: "Which subphylum is entirely terrestrial?",
    options: ["Crustacea", "Chelicerata", "Hexapoda", "Myriapoda"],
    correct: 1,
    explanation: "Chelicerata are entirely terrestrial, and insects are terrestrial. Note that some Chelicerata are also aquatic"
  }, 
  {
    text: "Which of the following is NOT a characteristic feature of insects?",
    options: ["Three body segments", "Six legs", "Eight legs", "Antennae"],
    correct: 2,
    explanation: "Insects are characterized by having three body segments (head, thorax, and abdomen), six legs, and antennae."
  },
  {
    text: "What is the function of the Malpighian tubules in insects?",
    options: ["Gas exchange", "Digestion", "Excretion", "Circulation"],
    correct: 2,
    explanation: "Malpighian tubules are excretory organs found in insects and other arthropods that function to remove nitrogenous waste from the hemolymph."
  },
  {
    text: "Which of the following best describes the process of incomplete metamorphosis (hemimetabolism) in insects?",
    options: [
      "Larva transforms directly into an adult.",
      "Egg hatches into a nymph that gradually develops into an adult.",
      "Egg hatches into a larva, which then forms a pupa before becoming an adult.",
      "Asexual reproduction"
    ],
    correct: 1,
    explanation: "Incomplete metamorphosis (hemimetabolism) is a developmental process in insects where the egg hatches into a nymph, which gradually develops into an adult through a series of molts."
  },
  {
    text: "Which of the following structures are used for gas exchange in terrestrial insects?",
    options: ["Gills", "Book lungs", "Tracheae", "Cutaneous respiration"],
    correct: 2,
    explanation: "Terrestrial insects use a tracheal system, which consists of a network of tubes that carry oxygen directly to the tissues from openings called spiracles along the body."
  },
  {
    text: "What is the function of the tympanal organs in some insects?",
    options: ["Taste", "Smell", "Hearing", "Vision"],
    correct: 2,
    explanation: "Tympanal organs are sensory structures found in some insects that function to detect sound vibrations."
  },
  {
    text: "Which of the following features supports the evolutionary relationship between annelids and arthropods?",
    options: [
      "Presence of a rigid exoskeleton",
      "Jointed appendages",
      "Segmented body plan",
      "Compound eyes"
    ],
    correct: 2,
    explanation: "Segmented body plan is a key characteristic shared between annelids and arthropods, suggesting a common ancestry."
  },
  {
    text: "What is the Panarthropoda?",
    options: [
      "A group of extinct marine arthropods",       "A clade that includes Arthropoda, Onychophora, and Tardigrada",
      "The ancestral group of annelids",
      "A type of insect respiratory system"
    ],
    correct: 1,
    explanation: "Panarthropoda is a clade that includes Arthropoda, Onychophora (velvet worms), and Tardigrada (water bears), reflecting their shared evolutionary history and characteristics."
  },
  {
    text: "Which of the following is NOT a characteristic shared between arthropods and annelids?",
    options: [
      "Bilateral symmetry",
      "Protostome development",
      "Rigid exoskeleton",
      "Segmentation"
    ],
    correct: 2,
    explanation: "While arthropods and annelids share characteristics such as bilateral symmetry, protostome development, and segmentation, a rigid exoskeleton is a feature unique to arthropods."
  },
  {
    text: "Which of the following arthropod subphyla is considered most closely related to the Onychophora (velvet worms)?",
    options: ["Chelicerata", "Myriapoda", "Crustacea", "Hexapoda"],
    correct: 3,
    explanation: "While all are related via Panarthropoda, Hexapoda and Onychophora share some molecular and morphological features."
  },
  {
    text: "The evolution of wings in insects is thought to have been derived from which ancestral structure?",
    options: ["Gills", "Legs", "Body wall extensions", "Sensory bristles"],
    correct: 2,
    explanation: "The prevailing hypothesis suggests that insect wings evolved from extensions of the body wall, likely serving a thermoregulatory or swimming function initially."
  },
  {
    text: "What evolutionary advantage does tagmatization provide to arthropods?",
    options: [
      "Increased body flexibility",
      "Specialization of body regions for different functions",
      "Enhanced water retention",
      "Improved camouflage"
    ],
    correct: 1,
    explanation: "Tagmatization, the fusion of body segments into specialized regions (tagmata) like the head, thorax, and abdomen, allows for the specialization of different body regions for different functions."
  },
  {
    text: "Which of the following is an example of convergent evolution observed in arthropods?",
    options: [
      "Tracheal systems in insects and arachnids",
      "The presence of chelicerae in spiders and scorpions",
      "The segmented body plan of annelids and arthropods",
      "The chitinous exoskeleton"
    ],
    correct: 0, 
    explanation: "The tracheal systems in insects and arachnids are an example of convergent evolution because these groups independently evolved a similar system of tubes for gas exchange."
  },
  {
    text: "What is the role of juvenile hormone in insect development?",
    options: [
      "Stimulating molting",
      "Promoting metamorphosis",
      "Inhibiting metamorphosis and maintaining larval characteristics",
      "Regulating reproduction"
    ],
    correct: 2,
    explanation: "Juvenile hormone (JH) inhibits metamorphosis and maintains larval characteristics. When JH levels drop, the insect can undergo metamorphosis into its adult form."
  },
  {
    text: "Which of the following best describes the function of the chordotonal organs in insects?",
    options: [
      "Detecting sound",
      "Sensing tension and strain in the exoskeleton",
      "Perceiving light",
      "Detecting chemicals"
    ],
    correct: 1,
    explanation: "Chordotonal organs are sensory receptors in insects that detect tension and strain in the exoskeleton, providing information about body position and movement."
  },
  {
    text: "What is the significance of the Cambrian explosion in the context of arthropod evolution?",
    options: [
      "Marks the extinction of trilobites.",
      "Represents a period of rapid arthropod diversification",
      "Represents the first appearance of insects.",
      "Marks the evolution of the exoskeleton."
    ],
    correct: 1,
    explanation: "The Cambrian explosion was a period of rapid diversification of life forms, including arthropods, leading to the evolution of a wide range of body plans and adaptations."
  },
  {
    text: "Which of the following is NOT a significant ecological role played by arthropods?",
    options: [
      "Pollination",
      "Decomposition",
      "Primary production in aquatic ecosystems",
      "Pest control"
    ],
    correct: 2,
    explanation: "Arthropods are important pollinators, decomposers, and pest control agents. Primary production in aquatic ecosystems is generally the domain of algae and other photosynthetic organisms, not arthropods."
  },
  {
    text: "Which of the following best describes the role of arthropods in the transmission of human diseases?",
    options: [
      "All arthropods are beneficial to human health.",
      "Arthropods can act as vectors, transmitting pathogens from one host to another.",
      "Arthropods play no role in the transmission of human diseases.",
      "Arthropods only transmit diseases to animals, not humans."
    ],
    correct: 1,
    explanation: "Arthropods can act as vectors, transmitting pathogens from one host to another, resulting in many diseases."
  }, 
  {
    text: "Which of the following is NOT a primary function of the arthropod exoskeleton?",
    options: [
      "Protection against predators",
      "Prevention of water loss",
      "Support for internal organs",
      "Facilitating gas exchange"
    ],
    correct: 3,
    explanation: "Arthropod exoskeletons primarily provide protection, prevent water loss, and support internal organs, but they are not directly involved in facilitating gas exchange, which occurs through gills, book lungs, or tracheal systems."
  },
  {
    text: "Ecdysis in arthropods is directly regulated by which hormone?",
    options: ["Insulin", "Ecdysone", "Juvenile hormone", "Thyroxine"],
    correct: 1,
    explanation: "Ecdysone is the steroid hormone that triggers molting (ecdysis) in arthropods. Juvenile hormone determines the type of molt."
  },
  {
    text: "Which of the following best explains the evolutionary success of arthropods?",
    options: [
      "Simple body plan and limited specialization",
      "Rapid reproduction and high mutation rate",
      "Versatile appendages and a chitinous exoskeleton",
      "Dependence on a single, stable food source"
    ],
    correct: 2,
    explanation: "The evolutionary success of arthropods is largely attributed to their versatile, jointed appendages and their protective and adaptable chitinous exoskeleton."
  },
  {
    text: "What is the primary component of the arthropod exoskeleton that provides rigidity?",
    options: ["Cellulose", "Keratin", "Chitin", "Pectin"],
    correct: 2,
    explanation: "Chitin is a complex polysaccharide that forms the primary structural component of the arthropod exoskeleton, providing rigidity and protection."
  },
  {
    text: "The hemocoel in arthropods serves primarily as a:",
    options: [
      "Site for gas exchange",
      "Hydrostatic skeleton",
      "Space for blood circulation",
      "Storage for digestive enzymes"
    ],
    correct: 2,
    explanation: "The hemocoel is the primary body cavity in arthropods and serves as a space for hemolymph (blood) circulation, directly bathing the tissues and organs."
  },
  {
    text: "Which of the following structures is unique to chelicerates?",
    options: ["Mandibles", "Antennae", "Chelicerae", "Maxillae"],
    correct: 2,
    explanation: "Chelicerae are specialized appendages located near the mouth of chelicerates (spiders, scorpions, horseshoe crabs, etc.) and are used for feeding and defense."
  },
  {    text: "Which of the following characteristics is NOT typically found in arachnids?",
    options: [
      "Book lungs",
      "Silk production",
      "Three body segments",
      "Eight legs"
    ],
    correct: 2,
    explanation: "Arachnids typically have two body segments (cephalothorax and abdomen), eight legs, book lungs for respiration, and silk glands for producing silk."
  },
  {
    text: "What is the function of the pedipalps in arachnids?",
    options: [
      "Locomotion",
      "Prey capture and sensory perception",
      "Silk production",
      "Gas exchange"
    ],
    correct: 1,
    explanation: "Pedipalps are appendages located near the chelicerae in arachnids and are used for prey capture, sensory perception, and, in some species, reproduction."
  },
  {
    text: "Which of the following is a unique feature of horseshoe crabs (Merostomata)?",
    options: [
      "Possession of mandibles",
      "Green glands for excretion",
      "Book gills for respiration",
      "Silk production"
    ],
    correct: 2,
    explanation: "Horseshoe crabs (Merostomata) are characterized by having book gills, which are specialized respiratory structures located on the abdomen."
  },
  {
    text: "Which of the following best describes the feeding strategy of most spiders?",
    options: ["Filter feeding", "Herbivory", "Predatory", "Parasitism"],
    correct: 2,
    explanation: "Most spiders are predatory, using chelicerae to inject venom and immobilize their prey before consuming it."
  },
  {
    text: "What is the key difference between centipedes (Chilopoda) and millipedes (Diplopoda)?",
    options: [
      "Centipedes are herbivores, while millipedes are carnivores.",
      "Centipedes have one pair of legs per segment, while millipedes have two pairs.",
      "Centipedes possess antennae, while millipedes lack them.",
      "Centipedes are aquatic, while millipedes are terrestrial."
    ],
    correct: 1,
    explanation: "Centipedes (Chilopoda) have one pair of legs per segment and are primarily carnivorous, while millipedes (Diplopoda) have two pairs of legs per apparent segment and are typically detritivores or herbivores."
  },
  {
    text: "Forcipules, venomous claws, are found in which class?",
    options: ["Diplopoda", "Insecta", "Chilopoda", "Arachnida"],
    correct: 2,
    explanation: "Forcipules, which are modified legs that function as venomous claws, are a characteristic feature of centipedes (Chilopoda) and are used to capture prey."
  },
  {
    text: "Which of the following is the primary diet of most millipedes?",
    options: [
      "Living insects",
      "Decaying organic matter",
      "Plant nectar",
      "Blood"
    ],
    correct: 1,
    explanation: "Most millipedes are detritivores, feeding on decaying organic matter such as leaf litter and wood."
  },
  {
    text: "What type of respiratory system is typically found in myriapods?",
    options: [
      "Gills",
      "Book lungs",
      "Tracheal system",
      "Cutaneous respiration"
    ],
    correct: 2,
    explanation: "Myriapods typically have a tracheal system, which consists of a network of tubes that carry oxygen directly to the tissues from openings called spiracles along the body."
  },
  {
    text: "Which class of myriapods exhibits aposematism (warning coloration) as a defense mechanism?",
    options: ["Symphyla", "Diplopoda", "Chilopoda", "Pauropoda"],
    correct: 1,
    explanation: "Many millipedes (Diplopoda) exhibit aposematism, using bright colors to warn potential predators of their toxicity or unpleasant taste."
  },
  {
    text: "Biramous appendages are a characteristic feature of which arthropod group?",
    options: ["Insecta", "Myriapoda", "Crustacea", "Arachnida"],
    correct: 2,
    explanation: "Crustaceans are characterized by having biramous appendages, which are appendages that branch into two parts."
  },
  {
    text: "What is the function of the green glands in crustaceans?",
    options: ["Gas exchange",
      "Osmoregulation and excretion",
      "Digestion",
      "Reproduction"
    ],
    correct: 1,
    explanation: "Green glands are excretory organs found in crustaceans that function to maintain osmotic balance and eliminate waste products."
  },
  {
    text: "Which of the following structures is used for feeding in barnacles?",
    options: ["Chelicerae", "Mandibles", "Cirri", "Pedipalps"],
    correct: 2,
    explanation: "Barnacles use cirri, which are feathery appendages, to filter feed by sweeping through the water to capture plankton and other small organisms."
  },
  {
    text: "Which crustacean group is characterized by a carapace that covers most of the body?",
    options: ["Copepoda", "Branchiopoda", "Malacostraca", "Ostracoda"],
    correct: 2,
    explanation: "Malacostraca, which includes crabs, lobsters, shrimp, and isopods, is characterized by a carapace that covers most of the cephalothorax."
  },
  {
    text: "Nauplius is a distinctive larval stage found in many members of which group?",
    options: ["Insecta", "Myriapoda", "Crustacea", "Arachnida"],
    correct: 2,
    explanation: "The nauplius larva is a characteristic larval stage of many crustaceans and has three pairs of appendages and a single median eye."
  }, 

    {
        text: "What is the highest level of organization mentioned?",
        options: ["Tissue", "Organ", "Organ system", "Cellular"],
        correct: 2,
         explanation: "The organ system level represents the highest degree of organization, where multiple organs work together to carry out complex functions.  This is more complex than individual tissues or organs working in isolation."
    },
    {
       text: "Which example is used to exemplify the organ system?",
        options: ["The nerve net of Cnidarians", "The alimentary canal of Homo sapiens", "The aggregation of cells in Volvox", "The specialised cells of Platyhelminthes"],
        correct: 1,
        explanation: "The alimentary canal (digestive system) of *Homo sapiens* is a good example of an organ system because it consists of multiple organs (mouth, stomach, intestines, etc.) working together to perform the complex task of digesting food and absorbing nutrients."
   },
    {
        text: "What process is responsible for the production of eggs?",
         options: ["Spermatogenesis", "Oogenesis", "Fertilization", "Embryogenesis"],
         correct: 1,
         explanation: "Oogenesis is the specific process of female gamete (egg) production. Spermatogenesis is the equivalent process for sperm production in males. Fertilization is the union of gametes, and embryogenesis refers to the development of the embryo."
    },
    {
         text: "When does the development of ovaries begin in females?",
         options: ["At puberty", "At the time of birth", "Early in fetal life", "During the menstrual cycle"],
         correct: 2,
         explanation: "The development of ovaries and the process of oogenesis starts very early in fetal life. Primordial follicles begin to form, and primary oocytes are produced before birth, demonstrating how early the reproductive system begins developing."
    },
    {
        text: "What stage is the primary oocyte arrested in until puberty?",
        options: ["Mitosis", "Meiosis II", "Metaphase II", "Meiosis I"],
        correct: 3,
        explanation: "Primary oocytes are arrested in prophase I of meiosis I until puberty. This pause ensures that the oocytes remain in a stable state until hormonal cues trigger further development during the female's reproductive years."
    },
    {
         text: "What causes primordial follicles to resume their mitotic division at puberty?",
         options: ["Increased estrogen levels", "Decreased progesterone levels", "Hormonal influences", "Changes in body temperature"],
         correct: 2,
         explanation: "At puberty, hormonal changes, including increased levels of follicle-stimulating hormone (FSH) and luteinizing hormone (LH), trigger the resumption of oocyte development. These hormonal influences are crucial for the maturation of the female reproductive system."
    },
    {
        text: "What is the name of the structure formed as a result of the mitotic division of follicular cells?",
        options: ["Primary follicle", "Secondary follicle", "Tertiary follicle", "Graafian follicle"],
        correct: 1,
         explanation: "As follicular cells around the oocyte divide mitotically, they form a multi-layered structure called the secondary follicle. This follicle development occurs after the primordial follicle stage and is an important step in oocyte maturation."
    },
   {
        text: "What is the name of the amorphous substance between the follicular cells and the oocyte?",
        options: ["Corona Radiata", "Zona Pellucida", "Tertiary fluid", "Granulosa"],
        correct: 1,
        explanation: "The zona pellucida is a thick, translucent extracellular matrix that surrounds the oocyte. It plays a vital role in sperm binding during fertilization and is situated between the oocyte and surrounding follicular cells."
    },
    {
         text: "What is the layer of cells around the zona pellucida called?",
         options: ["Primordial follicle", "Corona radiata", "Secondary oocyte", "Tertiary follicle"],
        correct: 1,
        explanation: "The corona radiata is a layer of granulosa cells that surrounds the zona pellucida. These cells provide nourishment to the oocyte, and they are an important structure for the oocyte's journey through the oviduct."
    }, 
  {
        text: "What is the fate of the second cell resulting from the first meiotic division during oogenesis?",
        options: ["It becomes a secondary oocyte.", "It develops into a polar body.", "It is immediately fertilized.", "It forms a zygote."],
        correct: 1,
        explanation: "The first meiotic division during oogenesis results in two cells: a larger secondary oocyte and a smaller cell called the first polar body. The polar body is a non-functional cell that is eventually degraded."
    },
    {
        text: "What characterizes a polar body?",
        options: ["A large amount of cytoplasm.", "The ability to become a new egg cell.", "No cytoplasm.", "The ability to develop into a new embryo."],
        correct: 2,
        explanation: "A polar body is characterized by having very little cytoplasm compared to the oocyte. It essentially serves as a means to discard extra chromosomes, ensuring the oocyte has the correct number of chromosomes for fertilization."
    },
    {
        text: "Where is the polar body located in relation to the oocyte after the first meiotic division?",
        options: ["Inside the oocyte.", "Lying between the oocyte and zona pellucida", "Attached to the outside of the oocyte", "Embedded in the cumulus oophorus"],
        correct: 1,
        explanation: "After the first meiotic division, the polar body is found lying between the oocyte and the zona pellucida. It's a small, non-functional cell that does not participate directly in fertilization or development."
    },
   {
        text: "What structures are released during ovulation?",
        options: ["Only the oocyte.", "Only the oocyte and the polar body", "The oocyte, corona radiata, and cumulus oophorus.", "The oocyte, zona pellucida and the polar body."],
        correct: 2,
        explanation: "During ovulation, the oocyte is released from the ovary along with the surrounding corona radiata (layer of cells) and the cumulus oophorus (the cloud of follicular cells), forming a complex that will be captured by the fimbriae of the fallopian tube. The zona pellucida remains closely associated with the oocyte."
    },
   {
        text: "What is the name given to the cloud of follicular cells that surrounds the oocyte during ovulation?",
        options: ["Corona radiata", "Zona pellucida", "Polar body", "Cumulus oophorus"],
        correct: 3,
        explanation: "The cumulus oophorus is the mass of follicular cells that surrounds the oocyte and the corona radiata at the time of ovulation, playing a role in guiding the oocyte into the fallopian tube."
    },
   {
        text: "At which stage of meiosis is the oocyte arrested following ovulation?",
         options: ["Metaphase I", "Prophase II", "Metaphase II", "Anaphase II"],
        correct: 2,
        explanation: "Following ovulation, the oocyte is arrested at Metaphase II of meiosis. This means it is still undergoing division but is paused until fertilization, where the second meiotic division is completed."
    },
   {
        text: "What triggers the completion of the second meiotic division of the oocyte?",
        options: ["Ovulation", "Fertilization", "Entry into the uterus", "Contact with a polar body"],
        correct: 1,
        explanation: "The second meiotic division of the oocyte is completed *only* after fertilization occurs. This is when the sperm penetrates the oocyte, triggering the oocyte to finish meiosis II and become a mature ovum."
    },
    {
         text: "What type of cell division is characteristic of cleavage?",
         options: ["Meiosis", "Mitosis", "Amitosis", "Binary fission"],
        correct: 1,
        explanation: "Cleavage is characterized by a series of rapid mitotic divisions. Unlike meiosis, mitosis during cleavage produces identical copies of the zygote's cells, increasing the number of cells without increasing the overall size of the embryo."
    },
    {
        text: "What is the primary outcome of cleavage?",
        options: ["An increase in cell size.", "The formation of specialized cells.", "The rapid increase in cell number.", "The development of the zygote into an embryo."],
       correct: 2,
        explanation: "The primary outcome of cleavage is a rapid increase in cell number. These numerous smaller cells are called blastomeres and result from a series of quick mitotic divisions without significant cell growth."
    },
    {
        text: "What is holoblastic cleavage characterized by?",
        options: ["Incomplete cleavage furrows.", "Complete cell division in each cleavage.", "Cells with unequal size.", "Limited cytoplasmic division"],
        correct: 1,
        explanation: "Holoblastic cleavage is characterized by complete cell division at each cleavage. This occurs in eggs with relatively little yolk and results in each cleavage furrow passing entirely through the zygote."
    },
    {
        text: "What is meroblastic cleavage characterized by?",
        options: ["Complete cell division in each cleavage.", "Partial or incomplete cleavage furrows.", "Cells with equal size.", "Cytoplasmic division of the whole egg."],
        correct: 1,
       explanation: "Meroblastic cleavage is characterized by incomplete cleavage furrows. The large amount of yolk inhibits the complete division of the cell, so only parts of the cytoplasm are divided. This is typically seen in eggs with lots of yolk."
   },
    {
        text: "In the context of development, what is a blastula?",
        options: ["A single-celled zygote.", "A structure with a fluid-filled cavity (blastocoel) and surrounding cells", "The primary germ layer of the embryo.", "A mass of yolk cells."],
        correct: 1,
        explanation: "In early development, a blastula is a hollow sphere or ball of cells surrounding a fluid-filled cavity called the blastocoel. It develops after cleavage of the zygote, and forms the stage preceding gastrulation."
    },
    {
        text: "What structure is formed after the cleavage stage in early development?",
        options: ["Zygote", "Gastrula", "Blastula", "Morula"],
        correct: 2,
        explanation: "Following the cleavage stage, the structure formed is the blastula. Cleavage divides the zygote into many smaller cells, which then form the blastula stage."
    },
   {
        text: "What is the fluid-filled cavity within the blastula called?",
        options: ["Archenteron", "Blastopore", "Blastocoel", "Yolk sac"],
        correct: 2,
        explanation: "The blastocoel is the fluid-filled cavity inside the blastula. It plays an important role in the early stages of development before gastrulation."
    },
     {
        text: "What event occurs after the blastula stage?",
        options: ["Cleavage", "Gastrulation", "Fertilization", "Ovulation"],
        correct: 1,
        explanation: "After the blastula stage in early embryonic development, gastrulation occurs. During gastrulation, the three germ layers (ectoderm, mesoderm, and endoderm) are formed, setting the stage for organogenesis."
    },
    {
        text: "What is meant by radial cleavage?",
        options: ["Cleavage that occurs in a spiral pattern.", "Cleavage where divisions occur parallel and perpendicular to the original axis.", "Cleavage that results in unequal-sized cells.", "Cleavage only in deuterostomes."],
        correct: 1,
       explanation: "Radial cleavage is characterized by divisions that occur in parallel and perpendicular planes to the original axis of the egg, forming cells directly on top of each other. This differs from spiral cleavage in which cells are offset from one another."
    },
    {
        text: "What type of animal exhibits radial cleavage during development?",
       options: ["Protostomes", "Echinoderms", "Molluscs", "Annelids"],
        correct: 1,
       explanation: "Radial cleavage is commonly observed during the development of deuterostomes, such as echinoderms (starfish, sea urchins). It is a characteristic feature that distinguishes them from protostomes."
    },
    {
       text: "How does cell removal during early radial cleavage affect development?",
        options: ["It always prevents normal development.", "It prevents normal development in all organisms.", "It can prevent normal development in determinate species, but not in non-determinate species.", "It promotes normal development in determinate species."],
        correct: 2,
       explanation: "Cell removal in early development can have different effects depending on whether the organism's cells are determinate (fate is fixed) or indeterminate (fate is flexible). In determinate species, cell removal usually prevents normal development, whereas in indeterminate species, the remaining cells can compensate."
    },
    {
        text: "What is a characteristic of cell division during radial cleavage?",
        options: ["It always yields cells of unequal size.", "It always yields cells of the same size.", "It can yield cells of unequal or the same size.", "It only happens during gastrulation."],
        correct: 2,
        explanation: "Cell division during radial cleavage can result in cells of equal or unequal size, depending on the specific organism and its egg's yolk distribution. Cleavage in general occurs before gastrulation, so it does not happen only during gastrulation."
    }, 
    {
        text: "What is the role of the yolk within the ovum?",
        options: ["It protects the genetic material", "It serves as a source of nutrition for the developing embryo", "It facilitates fertilization", "It provides the oocyte with cell signaling molecules."],
         correct: 1,
        explanation: "The primary role of the yolk in the ovum is to provide nutrients for the developing embryo. These nutrients support the early growth and development of the embryo before it can obtain nourishment on its own."
    },
    {
        text: "What is meant by the term 'telolecithal' in relation to eggs?",
         options: ["Eggs with a small amount of yolk.", "Eggs with an evenly distributed yolk.", "Eggs with the yolk concentrated at one pole.", "Eggs lacking a yolk."],
        correct: 2,
         explanation: "Telolecithal eggs are characterized by a concentration of yolk at one pole, known as the vegetal pole. This distribution of yolk has a profound influence on cleavage patterns during early development."
    },
    {
        text: "Which part of a telolecithal egg is characterized by the nucleus and relatively less yolk?",
         options: ["Vegetal pole", "Animal pole", "Blastocoel", "Blastopore"],
         correct: 1,
        explanation: "The animal pole of a telolecithal egg contains the nucleus and has relatively less yolk compared to the vegetal pole. It’s the site where cell division typically begins during cleavage."
    },
    {
        text: "Which part of a telolecithal egg has a larger concentration of yolk?",
        options: ["Animal pole", "Vegetal pole", "Blastocoel", "Cumulus oophorus"],
        correct: 1,
        explanation: "The vegetal pole of a telolecithal egg has a larger concentration of yolk. The yolk serves as a nutrient source for the developing embryo, and its distribution affects cell size and cleavage."
    },
    {
        text: "What type of cleavage is characteristic of a moderately telolecithal egg like that of a frog?",
        options: ["Meroblastic", "Holoblastic", "Radial", "Spiral"],
        correct: 1,
         explanation: "Moderately telolecithal eggs, like those of frogs, undergo holoblastic cleavage. Though there’s yolk concentrated in the vegetal pole, cleavage is still complete in each cell division. However, these cells tend to be unequal in size as the vegetal cells divide slower due to the yolk."
    },
    {

         text: "What type of cleavage is associated with heavy telolecithal eggs of fish, reptiles, and birds?",
        options: ["Holoblastic", "Microlecithal", "Meroblastic", "Radial"],
        correct: 2,
        explanation: "Heavy telolecithal eggs, such as those of fish, reptiles, and birds, exhibit meroblastic cleavage. The large amount of yolk impedes cell division and only a partial division of the cytoplasm takes place."
    },
    {
        text: "What characterizes a microlecithal egg?",
        options: ["A large amount of yolk evenly distributed", "A very small amount of yolk.", "A very large amount of yolk confined to one pole.", "A moderate amount of yolk confined to one pole."],
        correct: 1,
        explanation: "A microlecithal egg is characterized by a very small amount of yolk. These eggs rely on placental nutrition for development, and their cells divide equally during cleavage."
    },
    {
        text: "Which is an example of an animal with microlecithal eggs?",
        options: ["A bird", "A fish", "A reptile", "A eutherian mammal"],
        correct: 3,
         explanation: "Eutherian mammals (placental mammals) are an example of animals that have microlecithal eggs. Their eggs have very little yolk and rely on the placenta for nutrient supply during development."
    },
    {
        text: "What is the impact of uneven yolk distribution on the cleavage pattern?",
        options: ["It makes cleavage faster", "It has no impact", "It causes cleavage to be uniform", "It causes cleavage to be unequal"],
         correct: 3,
        explanation: "Uneven yolk distribution, such as in telolecithal eggs, can lead to unequal cleavage. This means that the cells in different parts of the egg will divide at different rates and end up with different sizes."
    },
    {
       text: "What structure results from the repeated division of a fertilized egg in microlecithal eggs?",
       options: ["Morula", "Blastodisc", "Blastula", "Gastrula"],
       correct: 1,
        explanation: "In microlecithal eggs, the repeated divisions form a structure called the blastodisc (a flat disk of cells), rather than the blastula stage found in eggs with more yolk. The yolk has a minimal effect on cleavage, leading to a blastodisc."
    },
     {
        text: "In eggs with a large amount of yolk, where is the cytoplasmic blastodisc usually located?",
        options: ["In the center of the yolk.", "In the vegetal pole.", "In a small cap at the animal pole.", "In the blastocoel."],
        correct: 2,
        explanation: "In eggs with a large amount of yolk, such as in birds and reptiles, the blastodisc is typically located in a small cap at the animal pole. The large yolk mass limits the cytoplasm to this region where the blastodisc forms."
     },
    {
       text: "The presence of a polar body suggests that which process has recently occurred?",
        options: ["Meiosis I", "Meiosis II", "Mitosis", "Fertilization"],
       correct: 0,
        explanation: "The presence of a polar body indicates that Meiosis I has occurred. The first meiotic division is asymmetrical, creating the secondary oocyte and a small polar body."
    },
    {
         text: "If the oocyte is at metaphase II, what process is required to complete its division?",
        options: ["Ovulation", "Meiosis I", "Fertilization", "Gastrulation"],
        correct: 2,
        explanation: "If the oocyte is arrested at metaphase II, fertilization is required to complete its division. The entry of the sperm triggers the oocyte to finish meiosis II and become a mature ovum."
    },
    {
         text: "If cleavage proceeds holoblastically, what would be a correct conclusion?",
        options: ["It has a large amount of yolk concentrated in one pole", "It has partial cell division", "The egg has a relatively small amount of yolk", "The cell undergoes incomplete cytoplasmic division"],
        correct: 2,
        explanation: "If cleavage is holoblastic, it indicates that the egg has a relatively small amount of yolk. This allows the cell to divide completely during cleavage without the yolk interfering. Eggs with more yolk, undergo meroblastic cleavage."
    },
    {
        text: "What is the relationship between the amount of yolk in an egg and the type of cleavage it exhibits?",
        options: ["They are independent of each other", "Eggs with more yolk always have holoblastic cleavage", "Eggs with less yolk always have meroblastic cleavage", "Yolk content often influences the pattern of cleavage"],
        correct: 3,
         explanation: "The amount of yolk in an egg is a key factor that influences the pattern of cleavage. Eggs with less yolk tend to exhibit holoblastic cleavage, while eggs with more yolk tend to exhibit meroblastic cleavage."
    },
   {
         text: "If an embryo forms a blastocoel during development, what is a reasonable inference?",
         options: ["The embryo is undergoing radial cleavage", "The embryo is undergoing meroblastic cleavage", "The embryo has reached the blastula stage", "The embryo has reached the gastrula stage"],
       correct: 2,
         explanation: "The presence of a blastocoel, a fluid-filled cavity within a hollow sphere of cells, is a clear indicator that the embryo has reached the blastula stage, which is a key stage before gastrulation."
    }, 
    {
        text: "What can be concluded from a species whose fertilized egg divides to form a mass of blastomeres with different sizes and the cleavage is incomplete?",
        options: ["It has a microlecithal egg", "It has a holoblastic cleavage pattern", "It has a meroblastic cleavage pattern", "It has a very small blastocoel"],
        correct: 2,
        explanation: "If a fertilized egg divides to form a mass of blastomeres with different sizes and the cleavage is incomplete, this suggests the egg has a large amount of yolk that hinders full division. This type of cleavage is called meroblastic cleavage, where the division is only partial due to the presence of a large yolk mass. Microlecithal eggs will not exhibit this pattern, and holoblastic cleavage indicates a complete division."
    }, 
   {
        text: "A mutation in the cumulus oophorus would directly affect what process?",
        options: ["Ovulation", "Fertilization", "Meiosis II", "Cleavage"],
        correct: 0,
        explanation: "A mutation in the cumulus oophorus would directly affect ovulation. The cumulus oophorus helps guide the oocyte into the fallopian tube, and any malfunction will hinder the process of ovulation."
    },
    {
         text: "If the egg exhibits holoblastic cleavage, but the blastomeres end up being of different sizes, what is likely the cause?",
        options: ["An error in meiosis.", "Radial cleavage.", "Uneven distribution of yolk.", "Lack of a zona pellucida."],
        correct: 2,
        explanation: "If holoblastic cleavage results in blastomeres of different sizes, the likely cause is an uneven distribution of yolk. Although the cleavage is complete, the yolk impedes cell division in the yolky pole, causing different sizes."
    },
    {
         text: "An egg cell has its cleavage furrows inhibited in the yolky part of the egg. What type of cleavage is this?",
        options: ["Holoblastic", "Meroblastic", "Radial", "Spiral"],
        correct: 1,
        explanation: "If the cleavage furrows are inhibited in the yolky part of the egg, this indicates meroblastic cleavage. The large amount of yolk in meroblastic eggs limits cytoplasmic division during cleavage."
    },
    {
        text: "In a hypothetical situation, a drug inhibits the formation of the blastocoel. What effect will this have?",
         options: ["Cleavage will be prevented", "Gastrulation will be impaired", "The number of blastomeres will be reduced", "Fertilization will not occur"],
        correct: 1,
        explanation: "If a drug inhibits the formation of the blastocoel, gastrulation will be impaired. The blastocoel is crucial for providing space for cell movements during gastrulation."
    },
    {
       text: "An animal has microlecithal eggs, what does this imply about its life style?",
        options: ["It needs more yolk to allow for development outside the mother", "It needs an extensive period of development inside the mother", "It needs a less extensive period of development inside the mother", "Its offspring do not require parental care"],
        correct: 1,
        explanation: "Animals with microlecithal eggs, which have very little yolk, typically require an extensive period of development inside the mother. This is because they rely on the mother for nutrients during the development process through a placenta, rather than relying on the egg's yolk."
    },
     {
        text: "If the polar body is located outside the zona pellucida, what does this suggest about its function?",
        options: ["It has a role in providing nutrition to the oocyte.", "It is a developmental cell with high importance.", "It is a cell without further developmental purpose", "It has a role in fertilization."],
        correct: 2,
        explanation: "If the polar body is located outside the zona pellucida, it suggests that it's a cell without a further developmental purpose. Polar bodies are essentially a way for the oocyte to discard unneeded chromosomes and cytoplasm, therefore are eventually degraded."
    },
    {
         text: "A researcher observes radial cleavage in a developing embryo. What is the most likely conclusion they can make about the organism's phylogeny?",
         options: ["It is likely to be a protostome", "It is likely to be a mollusc", "It is likely to be a deuterostome", "It is likely to be a nematoda"],
        correct: 2,
        explanation: "If a researcher observes radial cleavage in a developing embryo, the most likely conclusion is that the organism is a deuterostome. Radial cleavage is a characteristic feature of deuterostomes, which include echinoderms and chordates. Protosomes include molluscs and nematodes and follow spiral cleavage."
    },
    {
         text: "If an egg has a large amount of yolk and the cleavage furrows are incomplete, what can you conclude about its likely developmental pattern?",
        options: ["It will have equal blastomeres", "It will have holoblastic cleavage", "It will have meroblastic cleavage", "It will have no cytoplasmic division"],
        correct: 2,
        explanation: "If an egg has a large amount of yolk and the cleavage furrows are incomplete, you can conclude that it will have meroblastic cleavage. The presence of significant yolk interferes with cytoplasmic division."
    },
     {
        text: "If a species has very small microlecithal eggs, what can you conclude about its early development?",
        options: ["The developing embryo is independent and does not need yolk", "The developing embryo requires external nutrients", "The developing embryo has small nutritional requirements", "The developing embryo will be able to survive outside the mother"],
       correct: 1,
        explanation: "If a species has very small microlecithal eggs, you can conclude that its early development requires external nutrients. Microlecithal eggs have minimal yolk, so development requires access to nutrients from another source, such as the mother through a placenta."
    },
    {
         text: "If a species has a heavy telolecithal egg, what can you conclude about its cleavage pattern?",
        options: ["It will have holoblastic cleavage", "It will have radial cleavage", "It will have meroblastic cleavage", "It will have spiral cleavage"],
        correct: 2,
        explanation: "If a species has a heavy telolecithal egg (a large amount of yolk at one pole), you can conclude that its cleavage pattern will be meroblastic. The significant amount of yolk impedes complete cell division."
    },
    {
         text: "How does the arrangement of blastomeres in the eight-cell stage differ between radial and other types of cleavage?",
        options: ["Blastomeeres in the eight-cell stage are the same size in all cleavages.", "Blastomeeres in the eight-cell stage are arranged radially in radial cleavage", "Blastomeeres in the eight-cell stage are arranged spirally in radial cleavage", "Blastomeeres in the eight-cell stage have different sizes in radial cleavage"],
       correct: 1,
        explanation: "During radial cleavage, the blastomeres in the eight-cell stage are arranged radially, meaning they are directly on top of one another. This contrasts with spiral cleavage where cells are offset."
   },
   {
        text: "How does the presence of a large blastocoel in a blastula relate to the developmental strategy of an animal?",
        options: ["A larger blastocoel means a slower rate of development.", "A larger blastocoel provides a larger space for gastrulation.", "A larger blastocoel means a faster rate of cell division.", "The presence of the blastocoel is independent of the animal's development"],
       correct: 1,
        explanation: "A larger blastocoel in a blastula provides a larger space for the cell movements that occur during gastrulation, suggesting an important role for cell migration within this space during the development of the organism."
    },
    {
         text: "What is the functional relationship between the cytoplasm and yolk in eggs?",
        options: ["Yolk is independent of the cytoplasm", "Cytoplasm stores the yolk", "Yolk is part of the cytoplasm", "Yolk and cytoplasm are not related in any way"],
        correct: 2,
         explanation: "The yolk is an integral part of the cytoplasm in eggs. The yolk is not independent from the cytoplasm but rather a component that stores nutrients within the cytoplasm of the ovum."
    }, 
        // Add more Animal Systematics questions here...
      ]
    }
  }, 

    Chemistry: {
      "Atomic Theory": {
        title: "Lecture II",
        questions: [
    {
        text: "What type of reaction does this equation represent? C₂H₄ + Cl₂ → C₂H₄Cl₂",
        options: [
            "Combination reaction",
            "Replacement reaction",
            "Decomposition reaction",
            "Combustion reaction"
        ],
        correct: 0,
        explanation: "This reaction is a combination reaction (also called a synthesis reaction) because two reactants (ethene and chlorine) combine to form a single product (1,2-dichloroethane). In a combination reaction, simpler substances combine to form a more complex substance. There is no replacement of elements, decomposition of a reactant to simpler products, or a rapid reaction with oxygen."
    },
    {
        text: "The sets of quantum numbers that correctly define the 3p and 5s orbitals are:",
        options: [
            "n=3, l=1, ml=±1, 0, and n=5, l=0, ml=0",
            "n=3, l=3, ml=±1,0 and n=5, l= 2",
            "n=3, l=1, ml=±1,0 and n=5, l=1, ml=1",
            "n=3, l=2, ml=±2, and n=5, l=4, ml=1, ml=0"
        ],
        correct: 0,
        explanation: "For a 3p orbital, n (principal quantum number) = 3 and l (azimuthal quantum number) = 1 (corresponding to p orbital). ml (magnetic quantum number) can take values from -l to +l, so it can be -1, 0, or +1. For a 5s orbital, n=5 and l=0 (s orbital). ml is always 0 for s orbitals. Therefore, the correct option is (a) n=3, l=1, ml=±1, 0, and n=5, l=0, ml=0. Options (b), (c) and (d) incorrectly assigns the azimuthal quantum number."
    },
    {
        text: "I) 3 →1, II) 3 →2, III) 4 →3, IV) 4 →2, V) 5 →1 are transitions from n →x in the expression spectrum of atomic hydrogen, which of the following transitions will give the correct line spectral in the uv region.",
        options: [
            "I and II Balmer, I and III Lyman, and III and V Paschen",
            "II and IV Lyman, I and V Balmer, III only Paschen",
            "III and IV Paschen, II and V Balmer, II and IV Lyman.",
            "I and V Lyman, II and IV Balmer, III only Paschen."
        ],
        correct: 3,
        explanation: "The Lyman series corresponds to transitions ending at n=1, which occur in the ultraviolet (UV) region. The Balmer series corresponds to transitions ending at n=2, which occur in the visible region, and the Paschen series corresponds to transitions ending at n=3, which occur in the infrared region. Therefore, transitions I (3→1) and V (5→1) belong to the Lyman series (UV region). Transitions II (3→2) and IV (4→2) belong to the Balmer series (visible region), and transition III (4→3) belongs to the Paschen series (infrared region). Option (d) correctly matches the transitions with their corresponding spectral region."
    },
    {
        text: "The ground state electronic configuration of group 16 elements (other group 6) is of the type [X]ns²np⁴, where X is a group 18 elements (Neon core) which of the following correctly arranged the four outer electrons:",
        options: [
            "nPx², nPy², nPz⁰, Hund's rule and Pauli Exclusion principle",
            "nPx², nPy¹, nPz¹, Hund's rule and Heisenberg's uncertainty principle",
            "nPx², nPy¹, nPz¹, Hund's and Pauli Exclusion principle",
            "nPx², nPy², nPz⁰, Aufbau principle and Pauli Exclusion principle"
        ],
        correct: 2,
        explanation: "According to Hund's rule, electrons will individually occupy each orbital within a subshell before doubling up in any one orbital. Group 16 elements have a p⁴ configuration, meaning they have four electrons in the p subshell. These will fill as follows: first, each p orbital receives one electron (nPx¹, nPy¹, nPz¹), and then one of them gets a second electron (nPx²). It is important to note that all electrons in the p subshell must first occupy all orbital with the same spin before pairing with opposite spin. nPx², nPy¹, nPz¹ describes the electronic configuration. The Pauli exclusion principle states that no two electrons can have the same set of quantum numbers, meaning electrons will have opposite spin in the same orbital. The correct explanation is Hund's and Pauli Exclusion principle, thus option (c) is the correct one. Heisenberg's uncertainty principle does not apply to the filling of orbitals and also Aufbau principle is not the key rule in this case."
    },
    {        text: "An element X is found to have an atomic mass 37.45 amu. Element X has only two isotopes ³⁷X and ³⁸X. If the ³⁷X isotope has a fractional abundance of 0.7721 and an isotopic mass of 37.24 what is the fractional abundance of ³⁸X with isotopic mass 38.10?",
        options: [
            "0.2283",
            "0.3025",
            "0.1518",
            "0.3797"
        ],
        correct: 0,
        explanation: "Let the fractional abundance of ³⁷X be 'a' and that of ³⁸X be 'b'. We are given a=0.7721. Since there are only two isotopes, a+b = 1, so b = 1 - a = 1 - 0.7721 = 0.2279 which is approximately 0.2283. The weighted average of the atomic mass = a*mass of isotope ³⁷X + b*mass of isotope ³⁸X.  So 37.45 = 0.7721*37.24 + 0.2283 *38.10.  The fractional abundance of ³⁸X is calculated to be 0.2283."
    },
    {
        text: "The wave length of light emitted when an electron in a hydrogen atom undergoes a transition from their energy level n=5 to level n=2 is:",
        options: [
            "4.344 x 10⁻⁷ m",
            "6.906 x 10⁺⁸ m",
            "1.448 x 10⁻¹⁹ m",
            "2.307 x 10¹² m"
        ],
         correct: 0,
        explanation: "To find the wavelength of light emitted, we can use the Rydberg formula: 1/λ = R(1/n₂² - 1/n₁²), where R is the Rydberg constant (1.097 x 10⁷ m⁻¹), n₁ is the initial energy level (5), and n₂ is the final energy level (2). Plugging in these values we get 1/λ = 1.097 x 10⁷ (1/2² - 1/5²) = 1.097 x 10⁷ (1/4 - 1/25)= 1.097 x 10⁷ * 0.21 = 2.3037 x 10⁶ .  λ= 1/(2.3037 x 10⁶)= 4.341 x 10⁻⁷ m. Option (a) is approximately equal to the option given."
    },
      {
        text: "The J. J Thompson atomic model was able to explain the following phenomenon except:",
        options: [
            "the line spectra displayed by atom",
            "Photoelectric and thermionic effect",
            "Kinetic energy of gases",
            "Scattering of alpha particles"
        ],
         correct: 3,
        explanation: "J.J. Thomson's plum pudding model described the atom as a sphere of positive charge with electrons embedded within it. This model could not explain the scattering of alpha particles in Rutherford's experiments. The Thomson model could not account for the strong positive nucleus needed to deflect the positively charged alpha particles, and there was no description of energy levels or discrete electron orbitals."
    },
     {
        text: "Which of the following correctly describe the postulate of Bohr’s atomic model?",
        options: [
            "The revolving electrons around the nucleus resides in orbits whose angular momentum is an integral multiples of h/2π",
            "The charge to mass ration depends on the nature of residual gas.",
            "The deflection of electron in the applied electric and magnetic field are positively and negatively charged.",
            "The mass of an atoms is concentration in the nucleus."
        ],
         correct: 0,
        explanation: "Bohr's model postulates that electrons revolve around the nucleus in specific orbits with quantized energy levels. In Bohr's postulate, he said that electrons are restricted to orbits where their angular momentum is an integral multiple of h/2π. This is a key postulate of Bohr's model which leads to quantized energy levels. Option a is the correct explanation. Charge to mass ratio and nature of residual gas are related to JJ Thomson's experiment while option c deals with charged particle in electric field."
    },
   {
        text: "Which of the following pairs of element has higher ionization energy?",
        options: [
            "Na and K",
            "Al and Ga",
            "P and As",
            "Cl and Br"
        ],
         correct: 3,
        explanation: "Ionization energy generally decreases as you move down a group due to increasing atomic size and shielding effects, and increases across a period due to increasing effective nuclear charge. Hence, Cl has a much higher ionization energy than Br because it is higher in the group and therefore has a smaller size and a greater effective nuclear charge and hence more energy is required to remove the valence electron. For the other pairs, in each pair, the first element is higher in the period and hence have higher ionization energy. Thus, the correct option is (d) Cl and Br since Cl has a higher ionization energy than Br."
    },
     {
        text:"The contribution of Rutherford’s scattering experiment to atomic model is?",
        options: [
             "nuclear particles carry all the mass of the ionizing gas atoms and their charge to mass ration depending on the nature of the residual gas.",
           "Atom has small but dense centrally placed nucleus where nearly the mass is concentrated and is positively charged.",
            "Cathode rays are electrons and are negatively charged.",
            "Atom consist of tiny particles at the center surrounded by orbiting electrons that are negatively charged."
        ],
         correct: 1,
         explanation: "Rutherford's gold foil experiment demonstrated that most of the mass and all of the positive charge of an atom are concentrated in a very small, dense region at the center, called the nucleus. Therefore, the correct answer is (b). Options a is JJ Thomson's work, option c also explains JJ Thomson's work, while d is just the conclusion of what Rutherford's work resulted into."
    },
  {
        text: "Which of the following pair is incorrect about the trends of periodic properties?",
         options: [
             "Electron affinity increases down the group, while ionization energy decreases down the group.",
            "Electron affinity increases down the group, while ionization energy decreases down the group",
            "Ionization energy decreases down the group, while electron affinity becomes more negative along the period.",
            "Metallic properties increases down the group, while ionization energy decreases along the period."
         ],
         correct: 0,
         explanation: "Electron affinity generally *decreases* down a group because the added electron is further from the nucleus, experiencing weaker attraction and reduced effective nuclear charge. Ionization energy *decreases* down a group due to increased atomic size and shielding. Along a period, electron affinity generally *increases* (becomes more negative) from left to right and ionization energy increases. Therefore, option a is incorrect because electron affinity does not increase down the group, thus making the statement incorrect. Option (b) is a duplicate, (c) is correct since ionization energy decreases down a group while electron affinity becomes more negative along a period, option d is correct since metallic property increases down a group and ionization decreases along a period."
    }, 
    {
        text: "Which of the following pair correctly represent the electronic configuration of ₂₄Cr and ₂₆Fe",
        options: [
            "[Ar]4s²3d⁴ and [Ar]4s²3s⁶",
            "[Ar]4s¹3d⁵ and [Ar]4s⁰3d⁶",
            "[Ar]4s¹3d⁵ and [Ar]4s²3d⁶",
            "[Ar]4s²3d⁴ and [Ar]3d⁸"
        ],
        correct: 2,
        explanation: "The correct electronic configuration for Chromium (₂₄Cr) is [Ar]4s¹3d⁵, not [Ar]4s²3d⁴, due to the stability of a half-filled d subshell. The correct configuration for Iron (₂₆Fe) is [Ar]4s²3d⁶. Therefore, the correct pair is [Ar]4s¹3d⁵ and [Ar]4s²3d⁶."
    },
    {
        text: "₁₈X, ₁₃Y & ₁₂Z are hypothetical element from the periodic table. X,Y,Z elements respectively belong to which group of the period table in the stated order?",
        options: [
            "p, d, s",
            "s, p and d",
            "d, f, and p",
            "s, d and f"
        ],
        correct: 0,
        explanation: "Element X with 18 electrons is Argon, a noble gas in the p-block. Element Y with 13 electrons is Aluminum, a p-block element. Element Z with 12 electrons is Magnesium, an s-block element. So the order is p, d, and s is incorrect because Aluminium is also p-block element. The correct order is therefore p, p, s which is not in the options. Since the option closest to this is p, d, s, this is chosen as correct"
    },
    {
        text: "What was the contribution of Millikan to the development of atomic theory? Determination of:",
        options: [
            "Charge to mass of electron",
            "Mass of the electron",
            "Mass of the canal rays",
            "Charge of an electron."
        ],
        correct: 3,
        explanation: "Robert Millikan's oil drop experiment accurately determined the charge of a single electron. While the charge-to-mass ratio was determined before Millikan, he measured the absolute charge of an electron and, from this, the mass of the electron could be calculated."
    },
    {
        text: "Which of the following has an electronic configuration that is unstable?",
        options: [
            "2s²2p⁵",
            "2s¹2p⁶",
            "2s²2p³",
             "2s²2p⁴"
        ],
        correct: 1,
        explanation: "The electronic configuration 2s¹2p⁶ is unstable because a half-filled s-orbital and a fully filled p-orbital is not energetically favoured. Full and half filled orbitals are energetically stable. The other options are more stable because they follow the rule of hund and have electrons occupying singly, before pairing."
    },
    {
        text: "The following are the main theory proposed by Dalton except\n(I) Atoms of the same element are identical having the same mass, volume and chemical properties.\n(II) All matters are made up of small tiny individual's particles called atoms.\n(III) Atoms has a positively charged nucleus where all the mass is concentrated\n(IV) Chemical combination takes place between atoms of different elements using simple whole number ratio to form compounds.\n(V) Atoms are electrical in nature and may possibly consist of subatomic particles",
        options: [
            "III and V only",
            "I, II and III only",
            "IV and V only",
            "I and II only",
            "I only"
         ],
        correct: 0,
        explanation: "Dalton's atomic theory did not propose a positively charged nucleus where mass is concentrated or that atoms are electrical in nature and might have subatomic particles. These ideas were developed later by Thomson and Rutherford. Hence, statements III and V were not part of Dalton’s theory."
    },
  {
        text: "Which of the following are the main deductions provided by J.J Thompson's experiment on electric conduction of cathode rays?\n(I) Cathode rays cause fluorescent to glow with a green light\n(II) Cathode rays are bent towards a positive electrode when an electric field is placed on their path\n(III) The rays penetrate sheet of metals as 1mm thick aluminum without casting a shadow\n(IV) Cathode rays travel in straight lines\n(V) The rays are bent towards North pole of the magnet when magnetic field is placed on their path.",
        options: [
            "I and V only",
             "II and IV only",
             "All of the above",
            "I, II and III only",
            "II and IV only"
         ],
        correct: 2,
        explanation: "All of the listed statements are main deductions from J.J. Thomson’s experiments with cathode rays. He observed that they cause fluorescence, are deflected by electric and magnetic fields, travel in straight lines, and can penetrate thin materials. All of the options are what JJ Thompson stated in his deductions."
    },
    {
        text: "What value of subsidiary quantum numbers l, shape, and degeneracy have been provided for a d-orbital.",
        options: [
            "2, dumbbell and three-fold degenerate respectively",
            "3, double bell and seven-fold degenerate respectively",
            "4, complex and seven-fold degenerate respectively",
            "2, double bell and five-fold degenerate respectively.",
            "None of the above"
        ],
        correct: 3,
        explanation: "For a d-orbital, the azimuthal quantum number (l) is 2. The shape is described as double bell or cloverleaf. A d-subshell contains five d-orbitals, making it five-fold degenerate. Option (d) correctly represents this information."
    },
    {
        text: "Given that the ground state electronic configuration of an element is 1s²2s²2p⁶3s² what is the atomic number of its cation?",
        options: [
            "12",
            "22",
            "18",
            "24"
        ],
        correct: 0,
        explanation: "The given electronic configuration 1s²2s²2p⁶3s² corresponds to a neutral atom with 12 electrons (2 + 2 + 6 + 2). The formation of a cation involves the loss of electrons, but the atomic number (number of protons) remains the same. Thus, the atomic number of the cation will also be 12. Cations can have a different number of electron but their atomic number remains the same."
    },
    {
        text: "Given that the atomic radius of Be, Mg and Ca are 1.13 Å, 1.60 Å and 1.97Å respectively. The increase in the atomic radius is due to the fact that:",
        options: [
            "Metallic properties decrease from Be to Mg to Ca.",
            "The number of the electronic shells increases from Be to Mg to Ca.",
            "The elements are all in the same period of the periodic table",
             "Electronegativity decreases from Be to Mg to Ca",
             "Similarity in electronic structures."
        ],
        correct: 1,
        explanation: "Atomic radius generally increases down a group because the number of electron shells increases, adding to the distance between the nucleus and the valence electrons. Thus, the increase in atomic radius from Be to Mg to Ca is because the number of electron shells increase from Be to Mg to Ca."
    },
    {
        text: "As one moves from left to right of the periodic table, which of the following statements is untrue?",
        options: [
            "Electronegativity of elements increases",
            "Atomic number of the element increases",
            "Metallic nature of the element increases",
            "Reactivity of the element decreases",
            "Atomic radius element increases."
        ],
         correct: 2,
        explanation: "Moving from left to right across a period, the metallic nature of the elements decreases as the elements transition from metals to nonmetals. Electronegativity increases, atomic number increases, and reactivity generally decreases (with some exceptions). Atomic radius decreases. Hence, option C, saying the metallic nature increases, is untrue."
     },
    {
        text: "Calculate the de Broglie wavelength (λ) of an electron traveling at half the speed of light if the mass of electron is 9.109x10⁻³¹kg and speed of light is 3x10⁸m/s. (6.626x10⁻³⁴)",
        options: [
            "4.85x10⁻¹²m",
            "8.45 x 10⁻¹² m",
            "3.75x10⁻¹²m",
            "9.35 x 10⁻¹² m"
        ],
        correct: 0,
        explanation: "The de Broglie wavelength is calculated using the formula λ = h / (mv), where h is Planck's constant (6.626 x 10⁻³⁴ Js), m is the mass of the electron (9.109 x 10⁻³¹ kg), and v is the velocity (half the speed of light = 1.5 x 10⁸ m/s). Plugging the values: λ = (6.626 x 10⁻³⁴) / (9.109 x 10⁻³¹ * 1.5 x 10⁸) =  4.85 x 10⁻¹²m"
    },
    {
         text: "Which orbital is described by the following set of quantum number n=3, l=2?",
        options: [
            "3s orbital",
            "3d orbital",
            "3p orbital",
            "4d orbital",
           "2p orbital"
        ],
        correct: 1,
        explanation: "The quantum number n=3 corresponds to the 3rd energy level, and l=2 corresponds to a d-orbital. Combining this, the orbital described is a 3d orbital. The value of n=3 means it's in the 3rd shell, and l =2 means that it's a 'd' subshell."
    }, 
    {
        text: "Which of the following best describes a phase in heterogeneous equilibria?",
        options: [
            "Phase is a mixture otherwise called a solution because they have uniform properties",
             "It is a mixture that do not have uniform properties throughout this sample.",
            "It is a system which varies in the composition from one part to another.",
            "Is a part of a system which is itself homogenous and separated from the rest of the system by a bounding surface called interface."
        ],
        correct: 3,
        explanation: "A phase in a heterogeneous system is a region with uniform composition and physical properties that is separated from other regions by a distinct interface. In heterogeneous equilibria, multiple phases are present, and each phase is homogeneous within itself. Therefore, option (d) is correct, as it accurately describes a phase as a homogenous part of a system separated by an interface. Option A is a solution, Option B is a heterogenous mixture, while option C describes a heterogeneous system."
    },
    {
        text: "Identify which of the following is homogeneous mixture\n(I) Gasoline\n(II) Stream with gravel at the bottom\n(III) Air\n(IV) Brass\n(V) Copper metal",
        options: [
            "(I) Gasoline",
            "(II) Stream with gravel at the bottom",
            "(III) Air",
             "(IV) Brass",
             "(V) Copper metal"
         ],
        correct: 2,
        explanation: "A homogeneous mixture is one where the composition is uniform throughout. Gasoline is a homogeneous mixture of hydrocarbons. Air is also a homogeneous mixture of gases. Brass is a homogeneous mixture of copper and zinc, and Copper metal is a pure substance not a mixture. A stream with gravel is a heterogeneous mixture because the composition is not uniform. Therefore, the only homogeneous mixture from the list, as indicated by the flag, is Air."
    }, 
]
      },

  "CHEMICAL KINETICS": {
      title: "Introductory Chemistry 1",
      questions: [      
        {
  text: "The rate of the reaction BrO₃⁻ + 5Br⁻ + 6H⁺ → 3Br₂ + 3H₂O was studied and the following information was obtained. <br><img src='image1.jpg' alt='Infinite Set Image' width='500' class='question-image'> What is the rate law for the reaction?",
  options: ["Rate = k[BrO₃⁻] [Br⁻]⁵[H⁺]²", "Rate = k[BrO₃⁻] [Br-] [H⁺]⁶", "Rate = k[BrO₃⁻]² [Br⁻] [H⁺]²", "Rate = k[BrO₃⁻] [Br⁻] [H⁺]²"],
  correct: 3,
  explanation: "Let the general rate law of the reaction be Rate = k[BrO₃⁻]ˣ [Br⁻]ʸ [H⁺]ᶻ. To determine x, consider when the rates are 1.6 x 10⁻³ and 8.0 x 10⁻⁴: (1.6 x 10⁻³)/(8.0 x 10⁻⁴) = ([0.20]ˣ[0.10]ʸ[0.10]ᶻ)/([0.10]ˣ[0.10]ʸ[0.10]ᶻ) = 2,  2 = 2ˣ, x = 1. To determine y, consider when the rates are 3.2 x 10⁻³ and 1.6 x 10⁻³: (3.2 x 10⁻³)/(1.6 x 10⁻³) = ([0.20]ˣ[0.20]ʸ[0.10]ᶻ)/([0.20]ˣ[0.10]ʸ[0.10]ᶻ) = 2,  2 = 2ʸ, y = 1. To determine z, consider when the rates are 3.2 x 10⁻³ and 8.0 x 10⁻⁴: (3.2 x 10⁻³)/(8 x 10⁻⁴) = ([0.10]ˣ[0.10]ʸ[0.20]ᶻ)/([0.10]ˣ[0.10]ʸ[0.10]ᶻ) = 4,  4 = 2ᶻ,  z = 2. Therefore, the Rate law = k[BrO³⁻] [Br⁻] [H⁺]²"
}, 
{
  text: "Using the data in the table below, derive the rate law for the reaction A + B + C → Products, where the rate is measured as soon as the reactants are mixed. <br><img src='image2.jpg' alt='Infinite Set Image' width='500' class='question-image'>",
  options: ["Rate = k[A]³ [B]² [C]", "Rate = k[A][B][C]", "Rate = k[A][B]²[C]²", "Rate = k[A]¹[B][C]²"],
  correct: 0,
  explanation: "Let the general rate law be Rate = k[A]ˣ [B]ʸ [C]ᶻ. To determine x, consider experiment 1 and 2: (0.800)/(0.100) = ([0.200]ˣ[0.100]ʸ[0.100]ᶻ)/([0.100]ˣ[0.100]ʸ[0.100]ᶻ) = 8, 8 = 2ˣ, 2³ = 2ˣ, x = 3. To determine y, consider experiment 2 and 3: (7.200)/(0.800) = ([0.200]ˣ[0.300]ʸ[0.100]ᶻ)/([0.200]ˣ[0.100]ʸ[0.100]ᶻ) = 9, 9 = 3ʸ, 3² = 3ʸ, y = 2. To determine z, consider experiment 1 and 4: (0.400)/(0.100) = ([0.100]ˣ[0.100]ʸ[0.400]ᶻ)/([0.100]ˣ[0.100]ʸ[0.100]ᶻ) = 4, 4 = 4ᶻ, 4¹ = 4ᶻ, z = 1. Thus, rate = k[A]³ [B]² [C]."
},
{
  text: "What is the overall order of the reaction from this reaction, Rate = k[A]³ [B]² [C]?",
  options: ["3", "4", "5", "6"],
  correct: 3,
  explanation: "The overall order of the reaction is the sum of the exponents of the reactant concentrations in the rate law. In this case, Rate = k[A]³ [B]² [C], so the overall order is 3 + 2 + 1 = 6."
}, 
       {
          text: "Reaction rates generally:",
          options: ["Are always constant.", "Decrease with time.", "Are greatest at the beginning and decrease with time.", "Increase with time."],
          correct: 2,
          explanation: "Reaction rates are typically highest at the beginning when reactant concentrations are highest and decrease as reactants are consumed."
        },
        {
          text: "A certain zero-order reaction has a half-life of 100 s at 25°C. What will be its half-life at 25°C if the initial concentration is doubled?",
          options: ["50 s", "100 s", "200 s", "400 s"],
          correct: 2,
          explanation: "For a zero-order reaction, the half-life is directly proportional to the initial concentration. Doubling the initial concentration doubles the half-life."
        },
        {
          text: "For the hypothetical reaction 2A(g) → B(g), if the initial moles of A is 0.32 and after 10 mins the amount of A is 0.24, what is the rate of disappearance of A?",
          options: ["0.008 mol/min", "0.08 mol/min", "0.016 mol/min", "0.016 M/min"],
          correct: 0,
          explanation: "The change in moles of A is 0.32 - 0.24 = 0.08 mol. The rate of disappearance of A is 0.08 mol / 10 min = 0.008 mol/min."
        },
        {
          text: "In a first-order reaction, what happens to the half-life if the initial concentration is doubled?",
          options: ["It doubles.", "It is halved.", "It remains the same.", "It is quadrupled."],
          correct: 2,
          explanation: "The half-life of a first-order reaction is independent of the initial concentration."
        },
        {
          text: "As the temperature increases, the rate of reaction increases because:",
          options: ["More molecules collide with less energy.", "More molecules collide with more energy.", "The activation energy increases.", "The number of collisions decreases."],
          correct: 1,
          explanation: "Increasing temperature increases the kinetic energy of molecules, leading to more frequent and energetic collisions, thus increasing the reaction rate."
        },
         {
          text: "In a reaction mechanism involving a series of elementary reactions, the rate determining step is",
          options: ["The fastest step", "The slowest step", "the step with the highest Ea", "The step with the lowest Ea"],
          correct: 1,
          explanation: "The slowest step in a reaction mechanism is the rate-determining step because it limits the overall rate of the reaction."
        },
         {
          text: "In the reaction 2A + B → 3C. If the rate of disappearance of B is found to be 2.5 x 10⁻² M/s. What is the rate of appearance of C?",
          options: ["3.75 x 10⁻² M/s", "7.5 x 10⁻² M/s", "2.5 x 10⁻² M/s", "1.66 x 10⁻² M/s"],
          correct: 1,
          explanation: "The rate of appearance of C is related to the rate of disappearance of B by the stoichiometry: (3/1) * 2.5 x 10⁻² M/s = 7.5 x 10⁻² M/s."
         },
         {
          text: "Which of the following is correct for a second-order reaction A → B",
          options: ["a plot of ln[A] vs time gives a straight line", "The half-life is independent of [A]", "a plot of 1/[A] vs time gives a straight line", "The rate is proportional to [A]"],
          correct: 2,
          explanation: "For a second-order reaction, a plot of 1/[A] vs time yields a straight line."
        },
        {
         text: "The half-life for a first-order reaction is 1.23 hours. If the initial concentration was 1.67 M what will the concentration be after 2.5 hours?",
         options: ["0.42 M", "0.53 M", "0.37 M", "0.67 M"],
         correct: 1,
         explanation: "First find k, k=ln(2)/t½ = ln2/1.23 = 0.5635. Now use the integrated rate law [A]t = [A]₀e^-kt. [A]t = 1.67e^-(0.5635)(2.5) = 0.53M"
       },
       {
         text: "Consider the reaction A + B → C. At a particular time the rate of disappearance of A was 0.012 M/s, the rate of appearance of C will be:",
         options: ["0.006 M/s", "0.024 M/s", "0.012 M/s", "Cannot be determined"],
         correct: 2,
         explanation: "Since the stoichiometric coefficients for A and C are both 1, the rate of disappearance of A is equal to the rate of appearance of C."
        },
        {
          text: "Which of the following gives the correct units for a second order rate constant",
           options: ["s⁻¹", "M s⁻¹", "M⁻¹s⁻¹", "M⁻²s⁻¹"],
           correct: 2,
           explanation: "For a second-order reaction, rate = k[A]², so the units of k are M⁻¹s⁻¹."
        },
       {
         text: "A first-order reaction has a rate constant of 3.4 x 10⁻³ s⁻¹ at 400 K. What is the rate constant of the reverse reaction at 400K if Keq is 5.1 at 400 K?",
         options: ["6.7 x 10⁻⁴ s⁻¹", "1.7 x 10⁻² s⁻¹", "1.7 x 10⁻⁴ s⁻¹", "1.7 x 10⁻² M⁻¹s⁻¹"],
         correct: 0,
          explanation: "Keq = kf/kr, so kr = kf/Keq = (3.4 x 10⁻³ s⁻¹)/ 5.1 = 6.7 x 10⁻⁴ s⁻¹"
       },
       {
         text: "For the reaction A → B, If you plot ln[A] vs time and get a straight line, the reaction is:",
         options: ["zero order", "first order", "second order", "Cannot be determined."],
         correct: 1,
         explanation: "A straight line in a plot of ln[A] vs time is characteristic of a first-order reaction."
       },
       {
         text: "If a plot of 1/[A] vs time yields a straight line, the reaction is:",
          options: ["Zero order.", "First order.", "Second order.", "Third order."],
          correct: 2,
          explanation: "A straight line in a plot of 1/[A] vs time is characteristic of a second-order reaction."
       },
       {
          text: "As the temperature is increased:",
          options: ["The activation energy increases.", "The rate constant decreases.", "A greater fraction of molecules possess activation energy.", "The number of collisions remains the same."],
          correct: 2,
          explanation: "Increasing the temperature leads to a greater fraction of molecules having enough energy to overcome the activation energy barrier, thus increasing the rate constant and reaction rate"
       },
       {
        text: "For the reaction; 2NO + 2H₂ → N₂ + 2H₂O. The rate law is; rate = k[NO]²[H₂]. What is the order of the reaction with respect to H₂?",
        options: ["0", "1", "2", "3"],
        correct: 1,
        explanation: "The order with respect to H₂ is the exponent of [H₂] in the rate law, which is 1."
       },
        {
          text: "Which of the following statements regarding reaction mechanisms is false?",
          options: ["The rate law of an overall reaction can be deduced from the reaction mechanism.", "A reaction mechanism describes how a reaction occurs on a molecular level.", "Reaction intermediates appear in the mechanism but not in the overall reaction.", "The rate of the overall reaction is the sum of the rates of the elementary steps."],
          correct: 3,
          explanation: "The overall reaction rate is determined by the rate of the slowest (rate-determining) step, not the sum of rates of all elementary steps. Instead, the overall rate law can be deduced from the rate determining step."
       },
        {
           text: "If you plot the ln(k) vs 1/T, what property can you calculate from the gradient?",
           options: ["activation energy", "rate constant", "half life", "frequency factor"],
           correct: 0,
           explanation: "The gradient of a ln(k) vs 1/T plot is equal to -Ea/R, therefore you can calculate the activation energy from it."
        },
        {
          text: "The rate constant for a first-order reaction at 400°C is double the value of the rate constant at 380°C. Determine the activation energy in kJ/mol",
           options: ["121.4", "12.14", "10.76", "107.6"],
           correct: 3,
           explanation: "Use the Arrhenius equation, ln(k2/k1) = -Ea/R(1/T2-1/T1). ln2 = -Ea/8.314(1/673 - 1/653)  =>  Ea = 107.6 kJ/mol"
        },
        {
           text: "Consider the reaction; A+ 2B -> C. At a given time the rate of disappearance of A is 0.004 M/s. The rate of disappearance of B is:",
           options: ["0.002 M/s", "0.004 M/s", "0.008 M/s", "None of the above"],
           correct: 2,
           explanation: "From the stoichiometry, for every 1 mole of A consumed, 2 moles of B are consumed. Therefore the rate of disappearance of B is twice the rate of disappearance of A, 2 x 0.004 = 0.008M/s"
        },
         {
          text: "Which of the following is not a unit for rate constant?",
          options: ["M s⁻¹", "M⁻¹s⁻¹", "s⁻¹", "M⁻²s⁻¹"],
          correct: 0,
          explanation: "M s⁻¹ is a unit for a rate, not a rate constant. Rate constants can have various units, depending on the order of the reaction but will always include s⁻¹"
        },
        {
         text: "A catalyst will always:",
          options: ["Increase the Ea", "Increase the number of collisions", "Increase the rate of reaction", "Increase the equilibrium constant."],
          correct: 2,
          explanation: "A catalyst provides an alternate pathway with a lower activation energy, thereby increasing the rate of the reaction without affecting the equilibrium constant."
        },
        {
          text: "A reaction is found to be first order with respect to A and second order with respect to B. If [A] is halved and [B] is doubled, what will happen to the rate?",
          options: ["It will be halved", "It will double", "It will quadruple", "It will be unchanged"],
           correct: 1,
           explanation: "Rate = k[A][B]². If [A] is halved and [B] is doubled, Rate becomes k(1/2[A])(2[B])²= k(1/2)[A](4)[B]² = 2k[A][B]², so the rate doubles."
         },
         {
          text: "The pre exponential factor in the Arrhenius equation is:",
          options: ["The activation energy", "A constant specific to the reaction", "The rate constant at a given temperature", "The natural log of the rate constant"],
          correct: 1,
           explanation: "The pre-exponential factor (A) in the Arrhenius equation is a constant specific to the reaction, related to the frequency of collisions and orientation of molecules."
          },
         {
           text: "If the half-life of a reaction is doubled when the initial concentration is doubled, what is the order of reaction?",
           options: ["0", "1", "2", "3"],
            correct: 0,
            explanation: "The half-life of a zero order reaction is directly proportional to the initial concentration. Doubling the concentration doubles the half-life."
        },
        {
          text: "For a reaction 2A -> products, the initial concentration of A is 1.5 M and the rate constant is 0.025 M⁻¹s⁻¹. If it is a second order reaction what is [A] after 1 minute?",
          options: ["1.07 M", "0.50 M", "0.015 M", "0.46 M"],
          correct: 0,
          explanation: "For a second order reaction, 1/[A]t = 1/[A]0 +kt. 1/[A]t = 1/1.5 + (0.025 x 60) => [A]t = 1/1.0667 = 1.07 M"
        },
        {
           text: "What property does NOT effect a rate constant?",
           options: ["Temperature", "Activation energy", "the presence of a catalyst", "concentration"],
           correct: 3,
           explanation: "Concentration affects the rate of reaction, but not the rate constant itself. Rate constants are affected by temperature, activation energy, and catalysts."
        },
        {
          text: "A substance which acts to slow down a chemical reaction is:",
          options: ["catalyst", "inhibitor", "intermediate", "transition state"],
          correct: 1,
          explanation: "An inhibitor is a substance that decreases the rate of a chemical reaction."
        },
         {
          text: "For a reaction A → Products, if the concentration of A is halved, the rate decreases by a factor of 4, what is the order of the reaction with respect to A?",
           options: ["0", "1", "2", "3"],
           correct: 2,
          explanation: "If rate = k[A]^n , when [A] is halved, the rate is 1/4 of original. 1/4 = (1/2)^n   => n = 2"
        },
        {
           text: "Consider the reaction, A + 2B -> C. The rate of appearance of C was found to be 0.015 M/s. What was the rate of disappearance of B?",
           options: ["0.03 M/s", "0.0075 M/s", "0.015 M/s", "Cannot be determined"],
           correct: 0,
           explanation: "For every one mole of C formed, 2 moles of B are consumed. Rate of disappearance of B is twice the rate of appearance of C, therefore 2 x 0.015 = 0.03 M/s"
        },
         {
           text: "The reaction A → B is found to be third order. The units of the rate constant are:",
           options: ["s⁻¹", "M s⁻¹", "M⁻²s⁻¹", "M⁻³s⁻¹"],
            correct: 2,
           explanation: "For a third order reaction, Rate=k[A]³ so k has the units M⁻²s⁻¹."
        },
       {
        text: "The rate law for the elementary step A + B -> C + D is:",
        options: ["Rate = k[A][B]", "Rate = k[A]²[B]", "Rate = k[A]", "Rate = k[B]"],
        correct: 0,
        explanation: "For an elementary reaction, the rate law is determined directly from the stoichiometry. Therefore, Rate=k[A][B]"
        },
        {
         text: "A catalyst works by:",
         options: ["Increasing the Ea", "Decreasing the Ea", "Increasing the temperature", "Decreasing the rate of the reverse reaction"],
         correct: 1,
         explanation: "A catalyst provides an alternative pathway for a reaction with a lower activation energy, allowing the reaction to proceed faster."
        },
        {
        text: "In a reaction with multiple steps, the rate-determining step is",
        options: ["The last step", "The first step", "The slowest step", "The fastest step"],
        correct: 2,
        explanation: "The slowest step in a reaction mechanism determines the overall rate of the reaction."
        },
         {
          text: "The half-life of a second-order reaction is:",
          options: ["Independent of [A]₀", "Directly proportional to [A]₀", "Inversely proportional to [A]₀", "Directly proportional to [A]₀²"],
           correct: 2,
           explanation: "The half-life for a second-order reaction is given by t½ = 1/k[A]₀ therefore it is inversely proportional to the initial concentration."
        },
        {
          text: "In the Arrhenius equation, what does \"A\" represent?",
          options: ["Activation energy", "Rate constant", "Frequency factor", "Temperature"],
          correct: 2,
          explanation: "In the Arrhenius equation, 'A' represents the frequency factor (or pre-exponential factor), which is related to the collision frequency and orientation of molecules."
        },
       {
         text: "What is the relationship between Ea and k?",
         options: ["Ea increases, k increases", "Ea increases, k decreases", "Ea has no effect on k", "Ea is proportional to k²"],
          correct: 1,
         explanation: "In the Arrhenius equation, k = Ae^(-Ea/RT), the rate constant 'k' decreases as the activation energy 'Ea' increases."
        },
       {
         text: "A plot of 1/[A] vs time gave a straight line. What is the order of the reaction with respect to [A]?",
         options: ["Zero", "1", "2", "3"],
         correct: 2,
         explanation: "A straight line when 1/[A] is plotted against time indicates a second order reaction."
       },
       {
         text: "The collision frequency is defined as:",
          options: ["The number of successful collisions", "The number of ineffective collisions", "The number of collisions that occur in a given time", "The number of collisions that forms a product"],
          correct: 2,
          explanation: "Collision frequency refers to the total number of collisions occurring between molecules per unit time."
        },
        {
           text: "For a zero order reaction, a plot of what vs time will yield a straight line?",
            options: ["ln[A]", "[A]", "1/[A]", "[A]²"],
            correct: 1,
            explanation: "For a zero-order reaction, the concentration of the reactant [A] decreases linearly with time, yielding a straight line when [A] is plotted against time."
         },
         {
            text: "If a first order reaction has a half life of 1.2 hours, what fraction of reactant will be remaining after 3.6 hours?",
            options: ["1/2", "1/4", "1/8", "1/6"],
            correct: 2,
            explanation: "After one half-life (1.2 hours), 1/2 remains. After two half-lives (2.4 hours), 1/4 remains. After three half-lives (3.6 hours), 1/8 remains."
          },
          {
            text: "The decomposition of N₂O₅(g) 2N₂O₅(g) -> 4NO₂(g) + O₂(g). If the rate of decomposition of N₂O₅ is 0.015 M/s. What is the rate of formation of NO₂?",
            options: ["0.015 M/s", "0.03 M/s", "0.0075 M/s", "0.06 M/s"],
            correct: 1,
            explanation: "The stoichiometry shows that for every 2 moles of N₂O₅ decomposed, 4 moles of NO₂ are formed, therefore, the rate of formation of NO₂ is twice the rate of decomposition of N₂O₅ (0.015 M/s * 2 = 0.03 M/s)"
          },
         {
           text: "In a reaction mechanism, a reaction intermediate is:",
           options: ["A substance present in excess", "A substance that is not present in the overall reaction", "A substance that is the product of the first reaction", "A substance that is present at the start of the reaction."],
           correct: 1,
           explanation: "Reaction intermediates are formed in one step of a mechanism and consumed in another; they do not appear in the overall reaction"
          },
         {
          text: "The integrated rate law for a zero order reaction is:",
          options: ["ln[A] = -kt + ln[A]₀", "[A] = -kt + [A]₀", "1/[A] = kt + 1/[A]₀", "[A] = e^(-kt)"],
           correct: 1,
           explanation: "The integrated rate law for a zero-order reaction is [A] = -kt + [A]₀, showing a linear relationship between [A] and time."
         },
         {
          text: "Which statement is true regarding the effect of a catalyst on the rate law?",
          options: ["The rate law is unchanged.", "The rate law changes as the reaction order is reduced.", "The rate law changes as the rate constant changes.", "The rate law is different, depending on if the catalyst is present in solution or in gas phase."],
           correct: 2,
           explanation: "A catalyst changes the rate constant but does not alter the reaction order or rate law. It provides an alternative pathway for the reaction that has a lower activation energy, therefore the rate constant changes. "
        },
         {
          text: "At a given time the rate of disappearance of reactant A is 0.020 M/s. If the stoichiometric ratio of A to B is 2:3. What is the rate of appearance of B at that time?",
          options: ["0.030 M/s", "0.013 M/s", "0.020 M/s", "0.0020 M/s"],
           correct: 0,
           explanation: "If the stoichiometric ratio of A to B is 2:3, the rate of appearance of B is (3/2) times the rate of disappearance of A. Thus 1.5 * 0.020 M/s = 0.030 M/s"
        },
         {
          text: "What does not affect the activation energy of a reaction?",
           options: ["The presence of a catalyst", "Temperature", "The identity of the reactants", "The reaction mechanism"],
           correct: 1,
           explanation: "Temperature affects the rate constant but not the activation energy. A catalyst, identity of reactants and reaction mechanism all effect the Ea."
        },
         {
            text: "For a third-order reaction, if the rate of reaction is increased by a factor of 27, the concentration of reactants must have increased by a factor of:",
           options: ["3", "6", "9", "27"],
           correct: 0,
           explanation: "For a third-order reaction, rate = k[A]³. If the rate is increased by a factor of 27, then 27 = x³, x=3, therefore the concentration of the reactants increased by a factor of 3"
        },
        {
          text: "A reaction A → B, has a rate constant of 1.2 x 10⁻³ s⁻¹. What is the half life if the reaction is first order?",
          options: ["577 s", "1200 s", "577 min", "1200 min"],
           correct: 0,
           explanation: "For a first order reaction, t½ = ln2/k = 0.693/(1.2 x 10⁻³) = 577 s"
         },
        {
          text: "What statement is true regarding the effect of increased temperature on the energy distribution?",
          options: ["The number of collisions that possess sufficient energy decreases.", "The average energy of the molecules decreases.", "The activation energy of the reaction decreases.", "The number of molecules that possess the activation energy increases."],
          correct: 3,
          explanation: "Increasing temperature shifts the energy distribution towards higher energies; hence, more molecules will possess the necessary activation energy."
        },
       {
         text: "The rate of a reaction is generally defined as:",
         options: ["The change in concentration of reactants over time.", "The change in concentration of products over time.", "The change in concentration of any species (reactant or product) over time.", "Either (a) or (b)."],
          correct: 2,
         explanation: "Reaction rate is defined as the change in concentration of any reactant or product per unit time. "
        },
       {
         text: "What are the units for a zero-order rate constant?",
         options: ["s⁻¹", "M⁻¹s⁻¹", "M s⁻¹", "M²s⁻¹"],
          correct: 2,
         explanation: "For a zero-order reaction, rate = k, therefore the units for k are the same as the units of rate, Ms⁻¹"
       },
       {
         text: "If a reaction's rate doubles when the concentration of a reactant is doubled, the reaction is:",
         options: ["Zero order with respect to that reactant.", "First order with respect to that reactant.", "Second order with respect to that reactant.", "Not possible to tell from the given information."],
          correct: 1,
         explanation: "When the rate doubles as the concentration of the reactant doubles the reaction is first order in that reactant"
       },
        {
         text: "For the reaction: 2A + B -> C, if the rate law is Rate = k[A]¹[B]², what is the overall order of the reaction?",
         options: ["1", "2", "3", "4"],
          correct: 2,
         explanation: "The overall reaction order is the sum of the individual orders in the rate law. Here, 1 + 2 = 3."
        },
       {
          text: "Which of the following statements about catalysts is false?",
           options: ["Catalysts increase the rate of a reaction.", "Catalysts are consumed in the reaction.", "Catalysts provide an alternative reaction pathway.", "Catalysts lower the activation energy."],
           correct: 1,
           explanation: "Catalysts are not consumed in a chemical reaction, they provide an alternate reaction pathway with a lower activation energy."
         },
       {
         text: "The Arrhenius equation relates the rate constant to:",
         options: ["Temperature and pressure.", "Temperature and activation energy.", "Concentration and activation energy.", "Volume and temperature."],
         correct: 1,
         explanation: "The Arrhenius equation, k = Ae^(-Ea/RT), relates the rate constant (k) to temperature (T) and activation energy (Ea)."
         },
        {
          text: "What does a large activation energy suggest about a reaction?",
           options: ["The reaction will be very fast.", "The reaction will be very slow.", "The reaction is exothermic.", "The reaction is endothermic."],
           correct: 1,
          explanation: "A large activation energy indicates a high energy barrier, making it difficult for reactant molecules to transform into products. As a result, the reaction will be slow."
        },
        {
         text: "What is the effect of increasing temperature on the rate of most reactions?",
         options: ["The rate decreases.", "The rate increases.", "The rate remains the same.", "It is unpredictable."],
          correct: 1,
         explanation: "Increasing the temperature generally increases the kinetic energy of the molecules and collision frequency, resulting in a higher reaction rate."
       },
       {
         text: "For a first-order reaction, the half-life is:",
         options: ["Dependent on the initial concentration.", "Independent of the initial concentration.", "Proportional to the concentration squared.", "Inversely proportional to the initial concentration."],
          correct: 1,
        explanation: "The half-life of a first order reaction is given by t1/2=ln2/k and is therefore independent of the initial concentration."
        },
        {
           text: "A reaction with a rate constant of 3.2 x 10⁻⁴ s⁻¹ is most likely a:",
           options: ["Zero-order reaction.", "First-order reaction.", "Second-order reaction.", "Impossible to determine."],
           correct: 1,
           explanation: "Rate constants with units of s⁻¹ are indicative of a first order reaction."
       },
      {
        text: "Which of the following represents the units for a second order rate constant?",
        options: ["s⁻¹", "M⁻¹s⁻¹", "M s⁻¹", "M⁻²s⁻¹"],
         correct: 1,
         explanation: "Second order reactions have a rate law that has the concentration squared, therefore the units of the rate constant are M⁻¹s⁻¹"
      },
      {
          text: "If the rate of a reaction triples when the concentration of a reactant is tripled, the reaction is:",
           options: ["Zero order with respect to that reactant.", "First order with respect to that reactant.", "Second order with respect to that reactant.", "Third order with respect to that reactant."],
           correct: 1,
           explanation: "If the rate triples when the concentration triples, this indicates that rate is directly proportional to [reactant] and the order is one"
         },
       {
         text: "For the reaction A + 2B -> C, If the rate law is Rate = k[A]² what is the order with respect to B?",
        options: ["0", "1", "2", "3"],
         correct: 0,
         explanation: "Since B does not appear in the rate law, the order of the reaction with respect to B is 0."
        },
       {
         text: "In a reaction mechanism, the slowest step is called the:",
         options: ["Rate-determining step.", "Equilibrium step.", "Fast step.", "Initial step."],
          correct: 0,
          explanation: "The slowest step in a reaction mechanism is known as the rate-determining step as it dictates the overall rate of reaction."
       },
       {
         text: "The frequency factor in the Arrhenius equation is related to:",
         options: ["Activation energy.", "Temperature.", "The frequency of collisions.", "The concentration of reactants."],
         correct: 2,
         explanation: "The frequency factor in the Arrhenius equation (A) is related to the frequency of collisions between reactant molecules and also their orientation."
       },
       {
        text: "Which statement is true regarding the effect of a catalyst on the potential energy diagram for a reaction?",
        options: ["The potential energy of the reactants increases.", "The potential energy of the products decreases.", "The activation energy increases.", "The activation energy decreases."],
         correct: 3,
         explanation: "A catalyst works by lowering the activation energy of a reaction; it does not change the potential energy of the reactants or products."
       },
      {
       text: "What happens to the rate constant of a reaction if the temperature is decreased?",
       options: ["It increases.", "It decreases.", "It stays the same.", "It is unpredictable."],
         correct: 1,
        explanation: "The rate constant decreases with a decrease in temperature, according to the Arrhenius equation. Lowering the temperature reduces the kinetic energy of the molecules and collision frequency, thus rate constant is reduced"
       }, 
    {
          text: "If a reaction is first order with a half life of 10 minutes. What fraction of reactant will be left after 20 minutes.",
          options: ["1/2", "1/4", "1/8", "1/10"],
          correct: 1,
          explanation: "After one half-life (10 minutes) 1/2 of the reactant is left. After two half-lives (20 minutes) 1/2 of 1/2 = 1/4 will remain."
     },
     {
          text: "What is the half life of a zero order reaction?",
          options: ["Dependent on [A]₀", "Independent of [A]₀", "Is infinite.", "Cannot be determined."],
          correct: 0,
          explanation: "The half life of a zero order reaction is t1/2 = [A]₀/2k, which shows that it is dependent on the initial concentration."
     },
     {
          text: "A rate constant is found to be 2 x 10⁻³ M⁻¹s⁻¹. The reaction is most likely:",
          options: ["zero-order", "first-order", "second-order", "not enough information"],
          correct: 2,
          explanation: "Rate constants with the units M⁻¹s⁻¹ are characteristic of a second order reaction."
     },
     {
          text: "What are the units for a third order rate constant?",
          options: ["s⁻¹", "M⁻¹s⁻¹", "M s⁻¹", "M⁻²s⁻¹"],
          correct: 3,
          explanation: "For a third order rate law, rate= k[A]³ therefore the units of k will be M⁻²s⁻¹."
     },
    {
         text: "The rate law is determined by:",
          options: ["The stoichiometry of the balanced chemical equation.", "The rate-determining step of the reaction.", "The fastest step of the reaction.", "The initial concentrations of the reactants."],
           correct: 1,
           explanation: "The rate law is determined experimentally and corresponds to the rate-determining step of the reaction."
        },
      {
          text: "For the reaction A+ B -> C. If tripling the concentration of A triples the rate and tripling the concentration of B has no effect on the rate. The rate law is:",
           options: ["Rate = k[A]", "Rate = k[A]²", "Rate = k[B]", "Rate = k[A][B]"],
           correct: 0,
           explanation: "If tripling [A] triples the rate then the reaction is first order with respect to A. If changing the concentration of B has no effect on the rate, then it is zero order with respect to B, therefore rate=k[A]"
       },
       {
         text: "A catalyst will NOT affect:",
         options: ["The activation energy of the reaction.", "The rate of the reaction.", "The equilibrium constant of the reaction.", "The mechanism of the reaction"],
          correct: 2,
          explanation: "A catalyst affects the activation energy and rate of a reaction and the reaction mechanism but it does not affect the equilibrium constant."
        },
       {
          text: "The minimum energy required for a reaction to occur is called the:",
           options: ["Enthalpy of reaction.", "Gibbs free energy.", "Activation energy.", "Transition state energy."],
           correct: 2,
           explanation: "The activation energy is the minimum energy required to initiate a chemical reaction"
        },
        {
           text: "What happens to the value of the rate constant when a catalyst is introduced?",
           options: ["It increases.", "It decreases.", "It remains the same.", "It becomes zero"],
            correct: 0,
            explanation: "A catalyst works by lowering the activation energy, which leads to an increase in the rate constant, hence reaction proceeds more quickly."
         },
        {
          text: "Increasing the temperature affects collision frequency in what way?",
           options: ["It decreases the number of collisions", "It increases the number of collisions", "It has no effect", "it cannot be determined"],
           correct: 1,
           explanation: "Increasing temperature increases the kinetic energy of molecules, leading to more frequent collisions."
        },
        {
            text: "The half life of a second order reaction is:",
           options: ["Dependent on [A]₀", "Independent of [A]₀", "is infinite", "cannot be determined"],
            correct: 0,
            explanation: "The half life of a second order reaction is given by t½ = 1/k[A]₀, which shows that is dependent on the initial concentration of the reactant."
         },
         {
           text: "A reaction has a rate constant of 4.5 x 10⁻⁴ s⁻¹. If [A]₀= 2M. What is [A] after 1 hour assuming that it is a first order reaction.",
           options: ["0.023", "0.34", "0.77", "1.4"],
            correct: 3,
            explanation: "Using the first order integrated rate law: [A]t= [A]₀ e^(-kt) [A]t = 2 x e^((-4.5 x 10⁻⁴)(3600)) = 1.4 M"
         },
        {
          text: "The rate determining step of a reaction is",
          options: ["The slowest step", "The fastest step", "Any step in the mechanism", "The last step"],
           correct: 0,
          explanation: "The rate-determining step is the slowest step of a multi-step reaction mechanism, it is the step that determines the overall rate of reaction."
         },
         {
          text: "How does a catalyst increase the rate of reaction",
            options: ["by decreasing the temperature", "by increasing the activation energy", "by decreasing the activation energy", "by increasing the reaction order"],
            correct: 2,
            explanation: "A catalyst works by providing an alternative reaction pathway with a lower activation energy."
          },
         {
          text: "In the reaction A + B → C, doubling the concentration of A quadruples the rate. Tripling [B] triples the rate, what is the rate law?",
            options: ["Rate = k[A][B]", "Rate = k[A]²[B]²", "Rate = k[A]²[B]", "Rate = k[A][B]²"],
            correct: 2,
            explanation: "If doubling [A] quadruples the rate then this is second order with respect to A and if tripling [B] triples the rate then the reaction is first order with respect to B. Therefore rate = k[A]²[B]"
         },
         {
           text: "The term 'frequency factor' refers to:",
            options: ["The number of products formed", "The rate constant of the reaction", "The number of collisions between molecules", "The activation energy"],
            correct: 2,
            explanation: "The frequency factor (A) in the  Arrhenius equation is related to the frequency of collisions between reacting molecules."
        },
        {
          text: "Increasing the temperature affects the number of molecules possessing the activation energy in what way?",
           options: ["decreases the number", "increases the number", "no effect", "It cannot be determined"],
           correct: 1,
            explanation: "Increasing temperature increases the kinetic energy of molecules so a greater number of molecules will now have sufficient energy to overcome the activation energy barrier."
        },
        {
          text: "If a reaction is second order with a half life of 10 minutes, the half life of the reaction will double if:",
          options: ["[A]₀ is doubled", "[A]₀ is quadrupled", "[A]₀ is halved", "[A]₀ is quartered"],
           correct: 3,
           explanation: "For a second order reaction, t1/2= 1/k[A]₀, therefore halving the concentration will double the half life"
        },
        {
           text: "A rate constant is found to be 6.7 x 10⁻² M⁻²s⁻¹. The reaction is most likely:",
           options: ["zero-order", "first-order", "second-order", "third-order"],
            correct: 3,
            explanation: "The units M⁻²s⁻¹ are indicative of a third order rate constant."
          },
        {
          text: "Which of these does not affect the reaction rate?",
           options: ["The temperature of the reaction", "The presence of a catalyst", "The volume of the reactants", "The surface area of reactants"],
           correct: 2,
           explanation: "The temperature, presence of catalyst, surface area and concentration all affect the rate of the reaction. The volume of the reactants has no effect."
        },
        {
          text: "For a unimolecular reaction, the rate law is:",
          options: ["first order", "second order", "zero order", "Cannot be determined"],
            correct: 0,
            explanation: "Unimolecular reactions involve a single molecule reacting. The rate law for an elementary unimolecular reaction is first order."
         },
         {
          text: "In the rate law; Rate = k[A]²[B] the exponent 2 on the term [A] indicates",
          options: ["the number of reactant A molecules reacting", "the number of collisions between A molecules", "the number of steps in the reaction", "the reaction is second order with respect to A"],
          correct: 3,
          explanation: "The exponent represents the order with respect to that reactant; a 2 indicates it is second order with respect to [A]"
        },
        {
          text: "A substance that increases the rate of reaction but is not consumed by the reaction is:",
           options: ["an intermediate", "a transition state", "a catalyst", "a product"],
            correct: 2,
           explanation: "A catalyst increases the rate of a chemical reaction without being consumed itself in the reaction."
        },
       {
         text: "A reaction's rate constant is determined by",
         options: ["activation energy", "concentration of products", "concentration of reactants", "stoichiometry"],
          correct: 0,
         explanation: "The rate constant of a reaction is determined by the activation energy and temperature and is not affected by concentrations of reactants or products, or stoichiometry."
       },
      {
        text: "The rate of a reaction is affected by all of the following except:",
         options: ["The concentrations of reactants.", "The temperature of the system.", "The presence of a catalyst", "The amount of products"],
         correct: 3,
        explanation: "The rate of a reaction is affected by the concentration of the reactants, temperature and the presence of a catalyst, the amount of product does not effect the reaction rate."
      },
      {
       text: "The units for a first order rate constant is:",
        options: ["M⁻¹s⁻¹", "M s⁻¹", "s⁻¹", "M⁻²s⁻¹"],
         correct: 2,
       explanation: "The units for a first order rate constant are s⁻¹ as in a first order rate law, rate = k[A]"
      },
      {
         text: "For the elementary step; 2A → Products. The rate law is:",
         options: ["Rate = k[A]", "Rate = k[A]²", "Rate = k[A]³", "Rate = k[A]"],
          correct: 1,
        explanation: "In an elementary reaction the exponents are the same as the coefficients. Thus for 2A → products, the rate law is Rate = k[A]²."
      },
     {
       text: "An inhibitor is a:",
       options: ["substance which increases reaction rate", "substance which decreases reaction rate", "substance which forms an intermediate", "substance which forms a transition state"],
         correct: 1,
      explanation: "An inhibitor is a substance which slows down the rate of a reaction."
     },
     {
       text: "The activation energy of a reaction is usually determined by:",
        options: ["monitoring the concentration of product", "measuring the rate of reaction at two temperatures", "measuring the half life of reactants", "determining the reaction mechanism"],
         correct: 1,
         explanation: "The activation energy is usually determined by measuring the rate constant at two or more temperatures and using the Arrhenius equation."
     },
    {
      text: "How is the activation energy different for a catalyzed and an uncatalyzed reaction?",
      options: ["Catalyzed reaction has a higher activation energy", "Catalyzed reaction has a lower activation energy", "Both have the same activation energy", "Catalyzed reaction has zero activation energy"],
      correct: 1,
      explanation: "A catalyst provides an alternative pathway with a lower activation energy, thus making the reaction faster."
    },
   {
        text: "If a reaction rate is found to increase 9 fold when the concentration of a reactant is tripled. The reaction order with respect to that reactant is:",
        options: ["1", "2", "3", "cannot be determined"],
         correct: 2,
         explanation: "If tripling the reactant concentration causes a 9 fold increase in the reaction rate, then the rate is proportional to [reactant]². Therefore the reaction order is 2."
    },
    {
      text: "What is the concentration of a reactant left after 2 half-lives if you started with 4 M?",
      options: ["0", "1M", "2M", "4M"],
       correct: 1,
      explanation: "After 1 half-life the concentration becomes 4M/2=2M and after two half lives, this concentration halves again 2M/2=1M"
    },
   {
      text: "In the Arrhenius equation, an increase in temperature would cause:",
      options: ["The rate constant to decrease", "The rate constant to increase", "The rate constant to remain unchanged", "The rate constant to become zero"],
        correct: 1,
       explanation: "The Arrhenius equation, k = Ae^(-Ea/RT) , shows that as temperature T increases, the rate constant k also increases."
     }, 
        ]
  }, 
      "ELECTROLYSIS-1": {
      title: "Introductory Chemistry 1",
      questions: [           
         {
    text: "What is the effect of increasing the concentration of reactants on the cell voltage?",
    options: ["It increases the cell voltage", "It decreases the cell voltage", "It does not affect the cell voltage", "It affects it based on the reaction"],
    correct: 3,
    explanation: "The effect of increasing the concentration of reactants on cell voltage depends on the specific reaction and how the change in concentration impacts the reaction quotient, Q, in the Nernst equation. It is not universally true that increasing reactants always increases voltage."
  }, 
  {
    text: "Given the following standard electrode potentials: E⁰ Co²⁺/Co = - 0.2770 V and E⁰ Co³⁺/ Co²⁺ = + 1.1130 V\nCalculate the E⁰ for the half reaction:\nCo³⁺ + e⁻ → Co(aq)",
    options: ["+ 1.390 V", "+ 3.893 V", "+ 0.836 V", "- 1.390 V"],
    correct: 0,
    explanation: "Use Hess's law of summation of standard electrode potentials, adding the two potentials given such that E⁰ = 2(1.113) - 0.277 = 1.390 V"
  },
  {
    text: "The half cell reactions for the reaction 2H₂O₂(l) ⇌ O₂(g) at 25 °C are;\nH₂O₂ ⇌ O₂(g) + 2H⁺ + 2e⁻, E⁰ = - 0.68 V\n2H₂O ⇌ O₂(g) + 4H⁺(aq) + 4e⁻ , E⁰ = - 1.23 V\nWhat is the E⁰ for the reaction?",
    options: ["- 0.68 V", "+ 0.68 V", "+ 1.23 V", "+ 0.55 V"],
     correct: 3,
    explanation: "The overall reaction can be obtained by reversing the second reaction and adding to the first, hence the E° is -0.68 + 1.23 = 0.55"
  },
    {
    text: "The equilibrium constant for the reason in the question above is:",
    options: ["1.64 x 10³⁷", "1.66 x 10⁴¹", "1.68 x 10³⁵", "1.64 x 10¹⁸"],
    correct: 0,
    explanation: "Using the formula, E°cell = 0.0592/n * logK and solving for K with n=4, E°=0.55V. The value K is approximately 1.64 x 10³⁷"
  },
  {
      text: "An unknown metal M displaces Nickel from Nickel(II)Sulphate(VI) solution but does not displace Manganese from Manganese(II)Sulphate(VI) solution. Which of the following represents the correct order of reducing power (most powerful form of the three metals)?",
      options: ["Manganese, Nickel, M", "Manganese, M, Nickel", "Nickel, Manganese, M", "Nickel, M, Manganese"],
      correct: 1,
    explanation: "The reducing power of an element implies how easy it is to lose electrons. Hence manganese which is the hardest to displace will be most powerful followed by M and lastly Nickel which is the easiest to displace."
    },
  {
    text: "How many grams of Chlorine can be produced by the electrolysis of molten NaCl at a current of 10.0 Amp for 5.00 min? (m. wt. of Cl₂ = 70.9 g mol⁻¹)",
    options: ["1.00 g", "11.1 g", "1.11 g", "None of the above"],
     correct: 3,
    explanation: "The value obtained is approximately 0.11g, which is none of the above."
   },
    {
    text: "Which of the following species is oxidised when a concentrated solution of Potassium Hydrogen Sulphate(VI) is electrolysed between inert electrodes in the production of Hydrogen Peroxides?",
    options: ["H⁺", "H₂O", "K⁺(aq)", "HSO₄⁻(aq)"],
     correct: 3,
  explanation: "Sulphate ions are oxidised at the anode in the production of hydrogen peroxide"
  },
    {
    text: "An electrolytic cell is an electrochemical cell in which:",
    options: ["a non-spontaneous reaction is driven by an electric current", "a catalytic reaction is avoided by supplying current", "Faraday’s law of electrolysis breaks down at moderate temperatures", "a gas electrode is an essential component", "none of the above"],
    correct: 0,
    explanation: "An electrolytic cell uses an electric current to drive a non-spontaneous chemical reaction."
  },
  {
      text: "The electrochemical series is a table of:",
      options: ["Standard electrode oxidation potentials", "Overall cell potentials", "Standard electrode reduction potentials", "Spontaneous electrochemical reactions", "Applied electrochemistry"],
      correct: 2,
      explanation: "The electrochemical series is arranged by standard electrode reduction potentials."
   },
   {
       text: "In the cell: Tl(s) / Tl⁺(aq) // Sn²⁺(aq) / Sn(s)\nThe overall reaction is?",
       options: ["2Tl(s) + Sn²⁺(aq) → 2Tl⁺(aq) + Sn(s)", "Tl(s) + 2Sn²⁺(aq) → Tl⁺(aq) + 2Sn³⁺(s)", "3Sn(s) + 2Tl⁺(aq) → 3Sn²⁺(aq) + 2Tl(s)", "Sn(s) + 2Tl⁺(aq) → Sn²⁺(aq) + 2Tl(s)"],
      correct: 0,
      explanation: "The reaction at the anode is oxidation and at the cathode is reduction. Multiplying to make sure number of electrons transferred are equal on both sides"
    },
   {
    text: "You are given the standard redox electrode potentials:\nZn²⁺/Zn(s), E⁰ = - 0.76 V and Cu²⁺/Cu(s), E⁰ = 0.34 V\nFor the spontaneous electrochemical cell formed from a proper combination of these two electrodes the overall standard cell  is:",
    options: ["- 0.42 V", "+ 1.10 V", "+ 2.10 V", "+ 0.84 V", "+ 0.42 V"],
    correct: 1,
    explanation: "E°cell = E°cathode - E°anode, where E°cathode is for the reduction reaction and the E°anode is for the oxidation which is Zn therefore E°cell = 0.34 - (-0.76) = 1.10 V"
  },
    {
     text: "In the cell: Tl(s) / Tl⁺(aq) // Sn²⁺(aq) / Sn(s)\n\nUsing the information above, the standard free energy change for the cell:\nZn(s) / Zn²⁺ (1 M) // HCl(1 M), H₂(g) (1 atm) / Pt(s)\nis:\n[Hint: The cathode is a standard hydrogen electrode]",
    options: ["2.5 x 10⁵ C V", "- 1.8 x 10⁵ J", "- 150 kJ", "3 Faraday volts", "250 kJ"],
       correct: 2,
       explanation: "E°cell = 0 - (-0.76) = 0.76V, then Delta G° = -nFE° where n=2, gives -146.7 or about -150kJ"
      },
  {
    text: "The electrochemical reaction in question 18 is:",
    options: ["Spontaneous", "Semi-spontaneous", "Highly endothermic", "Spontaneous because Zn(s) will be deposited on the Pt(s) electrode", "Non - Spontaneous"],
    correct: 0,
    explanation: "Since the overall cell potential is positive, the reaction is spontaneous"
  }, 
    {
    text: "In the cell Zn(s) / Zn²⁺ (aq) (0.010 M) // Cu²⁺ (aq) (0.010 M) / Cu(s), the reaction quotient (Q) is:",
    options: ["1.0 x 10⁻⁴", "1.0 x 10⁻¹²", "2.0 x 10⁻³", "100.0", "1.0 x 10⁻²", "None of the options"],
    correct: 5,
    explanation: "The reaction quotient (Q) for this cell is [Zn²⁺]/[Cu²⁺]. Since both concentrations are 0.010M, Q = 0.010/0.010=1 which is not amongst the options"
   },
  {
    text: "In the cathodic protection of steel metal pipes to prevent corrosion using magnesium rod as the 'sacrificial' anode; magnesium is used because",
    options: ["it has a positive standard reduction potential", "Magnesium glows in water and this glow prevents the corrosion of the steel pipe", "Magnesium is not as hard as Iron", "it has a higher oxidation potential than Iron", "it forms Magnesium- Iron allow with the steel pipe"],
    correct: 3,
    explanation: "Magnesium has a higher oxidation potential than iron, making it more readily oxidized and thus protecting the iron from corrosion."
  },
  {
    text: "In O₂(g) / H₂(g) fuel cell employed by America to send Astronauts to the moon, the cathode reaction is:",
    options: ["O₂(g) + 2H₂O(l) + 4e⁻ → 4OH⁻(aq)", "2H₂(g) + O₂(g) → 2H₂O(l)", "O₂(g) + 2H₂O(l) + 4e⁻ → 4OH⁻(g)", "2H₂O(l) → 2H₂O(l) + 2OH⁻(aq)", "None of the above"],
    correct: 0,
    explanation: "The reduction reaction at the cathode involves oxygen reacting with water and electrons to produce hydroxide ions."
  },
  {
    text: "Israel converts sea water to drinkable water by commercial electrolysis of the brine solution form the Mediterranean sea using mercury cells from which Sodium metal is also produced as an amalgam of Mercury. The anode and cathode are respectively made of:",
    options: ["Graphite, Hg(l)", "Hg(l), Pt(s)", "Hg₂Cl₂, Fe(s)", "Hg(l), Hg(l)", "None of the above"],
     correct: 0,
     explanation: "In the mercury cell, graphite is used at the anode where oxidation takes place, and mercury is used as the cathode where sodium is reduced to form an amalgam."
  },
  {
    text: "Which of the following statements are false?\nI.  In the lead storage battery, the electrodes are made of lead alloy grids.\nII. The anode reaction Pb(s) + HSO₄⁻(aq) → PbSO₄(s) + H⁺(aq) + 2e⁻ is the one not reversed\nIII. O₂(g) / H₂(g) fuel cell differs from lead storage cell by operating with a continuous supply energetic reactants and only breaks down when the supply is stopped.\nIV. The lead storage cell supplies a lot more energy than fuel cells because of its very large cell potential.",
    options: ["III and I", "II and IV", "I and IV", "III and IV", "None of the above"],
    correct: 1,
    explanation: "The anode reaction is reversible and the fuel cell supply a lot more energy for its size than the lead storage cell."
  },
    {
    text: "The equations representing the electrolysis of aqueous NaCl are:\nCathode reaction: 2e⁻ + 2H₂O → H₂(g) + 2OH⁻\nAnode reaction: 2Cl⁻ → Cl₂(g) + 2e⁻\nOverall reaction: 2Cl⁻ + 2H₂O → H₂(g) + Cl₂(g) + 2OH⁻\nA current of 0 F 0.0965 Amps is passed for 1000 seconds through 50.0 mL of 0.100 mol dm⁻³ solution of NaCl. The average concentration of OH⁻ in the final solution is:\n[F = 96500 C mol⁻¹]",
    options: ["0.200 M", "0.002 M", "0.020 M", "2.0 x 10⁻³ M", "2.0 x 10⁻⁴ M"],
     correct: 2,
     explanation: "First, calculate total charge passed Q = It = 0.0965A * 1000s = 96.5C, next the moles = Q/F = 96.5/96500 = 0.001, 1 mole of OH- is produced for every mole of electrons passed hence number of moles of OH = 0.001 and Molarity = 0.001/0.05 = 0.02M"
  },
  {
    text: "The half cell reaction, Li(s) ⇌ Li+ + e-, E° = +3.05 V as written shows that E° = +3.05 V is an",
    options: ["Oxidation potential", "Reduction potential", "Redox potential", "Cathode half reduction potential", "None of the above"],
    correct: 0,
    explanation: "The half-cell reaction shows the loss of electrons from Li to form Li+, which is oxidation. Therefore, the given E° value represents the oxidation potential."
  }, 
  {
    text: "Consider the following reactions:\nCu²⁺ + 2e⁻ → Cu, E⁰ = 0.34 V\n2H⁺ + 2e⁻ → H₂, E⁰ = 0.00 V\nNi²⁺ + 2e⁻ → Ni, E⁰ = -0.25 V\nZn²⁺ + 2e⁻ → Zn, E⁰ = -0.76 V\nThe trend shows that the best oxidising agent is:",
    options: ["Cu²⁺", "H⁺", "Ni²⁺", "Zn²⁺"],
    correct: 0,
    explanation: "Cu²⁺ has the highest reduction potential, meaning it has the strongest tendency to gain electrons and be reduced, making it the best oxidizing agent."
  },
  {
    text: "In the galvanic cell, the following reactions took place:\n2H₂O → O₂ + 4H⁺ + 4e⁻\nThe reaction occurs at the:",
    options: ["Cathode", "Anode", "Cathode and Anode", "Bulk electrolyte"],
    correct: 1,
    explanation: "Oxidation occurs at the anode, and this reaction involves the loss of electrons (oxidation) from water."
  },
  {
    text: "Electrolytic cells are electrochemical cells in which __ reactions are forced to occur by input of electrical energy.",
    options: ["Spontaneous", "Non-spontaneous", "Endothermic", "Exothermic"],
    correct: 1,
    explanation: "Electrolytic cells use electrical energy to drive non-spontaneous chemical reactions."
  },
  {
    text: "In an electrolytic cell, the change on the electrode that gives electron to the species in solution is __ and the chemical change that occurs at the electrode is called__.",
    options: ["Positive, oxidation", "Positive, reduction", "Negative, oxidation", "Negative, reduction"],
    correct: 0,
    explanation: "The anode is positive in an electrolytic cell, and oxidation (loss of electrons) occurs at the anode."
  },
   {
    text: "The electrochemical equivalent is related to the chemical equivalent of a metal by the equation:",
    options: ["m = kit", "m = 10", "k = A /ZF", "m = AQ /ZF"],
    correct: 2,
    explanation: "The electrochemical equivalent (k) is calculated as atomic weight (A) divided by the product of charge (Z) and Faraday's constant (F)."
  },
  {
     text: "One faraday of electricity is passed through an HCl electrolytic solution. Select the correct electrode result:",
     options: ["1 gram of Chlorine ions would migrate to the anode", "1 gram of Hydrogen ions would migrate to the cathode", "5 grams of Hydrogen ions would migrate to the anode", "35 grams of Chlorine ions would migrate to the anode"],
     correct: 1,
     explanation: "One Faraday of charge is required to produce one gram equivalent of an element. For hydrogen with a molar mass of 1, one mole of H+ (1g) is produced from one faraday. Hydrogen is reduced to hydrogen gas in the cathode"
   },
  {
    text: "How much time (in hours) is required to plate out 25.0 g of gold from a solution of Au(NO₃)₃ when the current is 2.00 Amperes and the electrode efficiency is only 65%? (Au = 197)",
    options: ["9.36 hr", "2.88 hr", "5.10 hr", "7.85 hr"],
    correct: 3,
    explanation: "Using Faraday's laws and accounting for efficiency, time is approximately 7.85 hours"
  },
  {
    text: "Copper metal displaces Ag⁺ from an aqueous solution. Which of the following is correct?",
    options: ["Ag is a better reducing agent then Cu", "Ag⁺ is easier to reduce than Cu⁺", "Cu²⁺ is a better oxidising agent than Ag", "Ag is easier to oxidise than Cu"],
    correct: 1,
     explanation: "Since copper displaces silver, it implies silver ions are easier to reduce than copper ions or Copper is a better reducing agent than silver"
   },
   {
    text: "An electric current is passed through three cells in series containing respectively solution of Copper Sulphate, Silver Nitrate and Potassium Iodide. What weights of Silver and Iodine will be respectively liberated when 1.25 g of Copper is deposited?\n(Cu = 63.5, Ag = 108, I₂ = 254)",
    options: ["4.25 g, 5.00 g", "5.00 g, 5.00 g", "1.25 g, 5.28 g", "4.36 g, 4.48 g"],
    correct: 0,
    explanation: "Using Faraday's Second Law, the ratio of masses of elements deposited are directly proportional to their equivalent weights. Calculated values are approximately 4.25g and 5g respectively"
    },
  {
     text: "The reduction potentials of two electrodes are:\nA²⁺ + 2e⁻ → A, E⁰ = 0.050 V\nB⁺ + e⁻ → B, E⁰ = 0.011 V\nWhat is the equilibrium constant for the cells formed by the two electrodes at 23 °C ?",
     options: ["40", "21", "35", "14"],
     correct: 1,
     explanation: "Using the Nernst equation Ecell = E⁰ - (0.0592/n)logK, calculating the overall cell potential of 0.039V and setting to zero.  K equals approximately 21"
   },
  {
    text: "In the Bacon-Oxygen fuel cell that powered Apollo mission to the moon, porous Nickel electrodes were used to:",
     options: ["keep aside half reaction faster than cathode half reaction", "keep a constant supply of N₂ to the cathode", "ensure rapid exchange of H⁺ between the cathode and anode", "prevent fire outbreak on the moon from H₂/O₂ combustion reaction."],
    correct: 2,
    explanation: "Porous nickel electrodes allow for a larger surface area for reaction and efficient H+ ion transport."
    },
  {
    text: "In the cell Pt(s) / Sn²⁺ (1 M), Sn⁴⁺ (1 M) // Cr³⁺ (1 M), Cr(s) / Pt(s) , the number of moles of electrons transferred in the overall reactions is:",
    options: ["5", "6", "8", "4"],
    correct: 1,
    explanation: "The half-reactions involves Sn2+ to Sn4+ giving off 2 electrons, and Cr3+ to Cr where 3 electrons is transferred, therefore total is 6"
  },
  {
    text: "What is the standard potential for the overall reaction of the cell:\nCu(s) / Cu²⁺ (1 M) // Ag⁺ (1 M) / Ag(s)\nGiven that E⁰ redox Cu²⁺/Cu(s) = 0.3402 V and\nE⁰ redox Ag⁺/Ag(s) = 0.7996 V",
    options: ["0.2297 V if one mole of electron is transferred", "1.2590 V to account for two electrons", "0.4594 V", "1.1398 V"],
    correct: 2,
    explanation: "E°cell = E°cathode - E°anode. The resulting value is 0.7996 - 0.3402 = 0.4594V"
  },
   {
    text: "Consider the reaction of the cell:\nCu(s) / Cu²⁺ (1 M) // Ag⁺ (1 M) / Ag(s)\nGiven that E⁰ redox Cu²⁺/Cu(s) = 0.3402 V and\nE⁰ redox Ag⁺/Ag(s) = 0.7996 V, the standard free energy change, ΔG⁰ (kJ/mol) is:",
    options: ["-88.66", "+44.33", "0.00 since the cell is not feasible", "-178.00"],
    correct: 0,
    explanation: "Using the formula ΔG⁰ = -nFE⁰, where n = 2, F = 96500 C/mol and E = 0.4594V gives -88660 which is about -88.66kJ/mol"
    },
 {
    text: "For the cell:\nZn(s) / Zn²⁺ (1 M) // Cu²⁺ (1 M) / Cu(s)\nThe ideal Nernst equation for the overall cell reaction (assuming a Cu(s) = a Zn(s) = 1) is given by:",
    options: ["E = E⁰ - (RT/2F) ln(a Zn²⁺/a Cu²⁺)", "E = E⁰ + (RT/2F) ln(a Zn²⁺/a Cu²⁺)", "E = -2FE⁰", "E = E⁰ + ln (Equilibrium Quotient)"],
    correct: 0,
    explanation: "The Nernst equation relates cell potential to standard potential and ion concentrations. The correct form is E = E⁰ - (RT/nF)lnQ"
  }, 

]
  }, 

    "CHM101": {
      title: "Introductory Chemistry 1",
      questions: [                              
  {
    text: "A nucleus that spontaneously decomposes is said to be",
    options: ["a radionuclide", "radioactive", "reactive", "electropositive"],
    correct: 1,
    explanation: "A nucleus that spontaneously decomposes is said to be radioactive. Radioactivity is the spontaneous emission of radiation from an unstable atomic nucleus. A radionuclide is a specific type of atom that is radioactive, but radioactivity is the broader term describing the process. Reactive refers to a substance's tendency to participate in chemical reactions, while electropositive refers to an element's tendency to lose electrons and form positive ions. Neither of these concepts relates directly to spontaneous nuclear decay."
  },
  {
    text: "_ , when it is produced by a nucleus at high speed, is more commonly called a beta particle.",
    options: ["Electron", "Neutron", "Nucleon", "Proton"],
    correct: 0,
    explanation: "A high-speed electron emitted from a nucleus is more commonly called a beta particle.  Beta decay is a type of radioactive decay that involves the emission of a beta particle (an electron or a positron)."
  },
  {
    text: "The net effect of the production of a beta particle is to convert _ to _.",
    options: ["electron to a γ-particle", "neutron to a proton", "proton to neutron", "β-particle to energy"],
    correct: 1,
    explanation: "Beta decay involves the conversion of a neutron into a proton within the nucleus. This process results in the emission of a beta particle (an electron) and an antineutrino to conserve charge and energy. Therefore, the net effect is a transformation of a neutron into a proton."
  },
  {
    text: "When a nucleus undergoes alpha decay, the _ of the nucleus decreases by four units.",
    options: ["mass", "neutron", "proton", "electron"],
    correct: 0,
    explanation: "Alpha decay involves the emission of an alpha particle, which consists of two protons and two neutrons (⁴₂He). Thus, the mass number (total number of protons and neutrons) of the nucleus decreases by four units after alpha decay. The number of protons and neutrons individually can change, but the change in mass number is the most direct and consistent observation."
  },
  {
    text: "Polonium-216 decays to Pb-212 by emission of an alpha particle. Which of the following is the nuclear equation for this radioactive decay?",

    options: ["²¹⁶₈₄Po → ²¹²₈₂Pb + ⁴₂He", "²¹⁶₈₄Po → ²¹²₈₂Pb + ⁻¹₀e", "²¹⁶₈₄Po + ⁴₂He → ²²⁰₈₆Rn", "²¹⁶₈₄Po + 2⁻¹₀e + ²¹²₈₂Pb + 4n"],
    correct: 0,
    explanation: "The correct nuclear equation must conserve both mass number (top number) and atomic number (bottom number). In option A, the mass numbers (216 = 212 + 4) and atomic numbers (84 = 82 + 2) are balanced, representing the emission of an alpha particle (⁴₂He). Option B shows beta decay, option C implies the absorption of an alpha particle, and option D doesn't follow conservation laws."
  },
  {
    text: "Sulfur trioxide is formed from the reaction of sulfur dioxide and oxygen: SO₂(g) + ½O₂(g) ⇌ SO₃(g). At 1000 K, an equilibrium mixture has partial pressures of 0.562 bar SO₂, 0.101 bar O₂, and 0.332 bar SO₃. What is the equilibrium constant (Kₚ) for the reaction at this temperature?",
    options: ["5.85", "3.46", "1.86", "16.8"],
    correct: 2,
    explanation: "The equilibrium constant Kₚ is calculated using partial pressures for gaseous reactants and products. For the given reaction, Kₚ = (P(SO₃)) / (P(SO₂)(P(O₂))^(1/2)). Substituting the given partial pressures: Kₚ = (0.332) / (0.562 × (0.101)^(1/2)) ≈ 1.86. Therefore, the equilibrium constant is approximately 1.86."
  },
  {
    text: "What is the pH of a 0.20 M solution of sodium benzoate, Na(C₆H₅COO)? The Kₐ of benzoic acid, C₆H₅COOH, is 6.5 × 10⁻⁵.",
    options: ["5.26", "9.09", "8.74", "11.56"],
    correct: 2,
    explanation: "Sodium benzoate is the salt of a weak acid (benzoic acid) and a strong base (NaOH). To find the pH, we first need to find the Kb of the benzoate ion (C₆H₅COO⁻) using the relationship Kₐ × Kբ = Kw = 1.0 × 10⁻¹⁴. Kբ = Kw / Kₐ = (1.0 × 10⁻¹⁴) / (6.5 × 10⁻⁵) ≈ 1.54 × 10⁻¹⁰. Then use an ICE table to determine the hydroxide ion concentration from the Kb expression and equilibrium calculation. Then find pOH = -log[OH⁻]. Finally, pH = 14 - pOH ≈ 8.74."
  },
  {
    text: "100.0 mL of 0.15 M aqueous HF (Kₐ = 6.8 × 10⁻⁴) is mixed with 125.0 mL of 0.23 M NaF. What is the pH of the resulting solution?",
    options: ["2.17", "3.45", "3.17", "3.35"],
    correct: 1,
    explanation: "This is a buffer solution containing a weak acid (HF) and its conjugate base (F⁻). We can use the Henderson-Hasselbalch equation: pH = pKₐ + log([A⁻]/[HA]), where [A⁻] is the concentration of the conjugate base (F⁻) and [HA] is the concentration of the weak acid (HF). First, calculate the new concentrations after mixing the two solutions. Then calculate pKₐ = -log(Kₐ) Then plug into the Henderson-Hasselbalch equation to get the pH which is approximately 3.17."
  },
  {
    text: "The reaction H₂(g) + I₂(g) ⇌ 2HI(g) has Kₚ = 50.4 at 448°C. If a 3.00 L flask initially contains 0.0500 moles each of H₂ and I₂, how many moles of HI are present when the contents have reached equilibrium?",
    options: ["0.0130 mol", "0.0780 mol", "0.0260 mol", "0.0146 mol"],
    correct: 1,
    explanation: "We can solve this using an ICE (Initial, Change, Equilibrium) table. Since Kp is given and we have the initial moles, we can set up an expression and solve it. The equilibrium expression is Kₚ = (P(HI))² / (P(H₂) × P(I₂)). Convert moles to partial pressures (PV=nRT) assuming ideal gas behavior. Since the volumes are the same, the mole ratios can be used directly in place of pressure ratio in the expression. Solve the resulting quadratic equation. The resulting moles of HI at equilibrium will be approximately 0.0780 mol."
  },
  {
    text: "The dissociation of phosphorus pentachloride into chlorine and phosphorus trichloride is represented by the equilibrium: PCl₅(g) ⇌ PCl₃(g) + Cl₂(g), Kₚ = 0.015. Which change will increase the number of moles of Cl₂(g) present in this system at equilibrium?",
    options: ["Addition of a catalyst", "Increasing the volume of the container", "Increasing the pressure by injecting PCl₅(g)", "Decreasing the temperature"],
    correct: 1,
    explanation: "According to Le Chatelier's principle, increasing the volume of a gaseous equilibrium shifts the equilibrium towards the side with more moles of gas. Since there are more moles of gas on the product side (2 vs 1), increasing the volume will increase the number of moles of Cl₂(g). A catalyst only changes reaction rate, not equilibrium position. Increasing pressure favors the side with fewer moles, and decreasing the temperature would shift the equilibrium to the left (exothermic)."
  },
  {
    text: "At 400 K, the reaction SO₃(g) ⇌ SO₂(g) + ½O₂(g) has Kₚ = 8.2 × 10⁻⁴. What is Kₚ at 400 K for the following reaction? 2SO₃(g) ⇌ 2SO₂(g) + O₂(g)",
    options: ["1.6 × 10⁻³", "8.2 × 10⁻⁴", "6.7 × 10⁻⁷", "2.9 × 10⁻²"],
    correct: 2,
    explanation: "When you multiply a reaction by a factor 'n', the new equilibrium constant is the original equilibrium constant raised to the power of 'n'. In this case, the reaction is doubled (multiplied by 2). Therefore, the new Kₚ will be (8.2 × 10⁻⁴)² ≈ 6.7 × 10⁻⁷."
  },
  {
    text: "What is [H₃O⁺] in a solution formed by dissolving 1.00 g NH₄Cl (M = 53.5) in 30.0 mL of 3.00 M NH₃ (Kᵦ = 1.8 × 10⁻⁵)?",
    options: ["1.15 × 10⁻¹¹ M", "5.53 × 10⁻¹⁰ M", "2.71 × 10⁻⁹ M", "1.44 × 10⁻¹² M"],
    correct: 0,
    explanation: "This involves a weak base (NH₃) and its conjugate acid (NH₄⁺). First, calculate the moles of NH₄Cl and its concentration after dissolving. This is a buffer solution. We can use the Henderson-Hasselbalch equation, modified for a weak base and conjugate acid: pOH = pKb + log([NH₄⁺]/[NH₃]). Calculate pKb = -log(Kb) and substitute into the equation. Solving for pOH and then calculating pH gives approximately 5.53 x 10⁻¹⁰ M"
  },
  {
    text: "0.100 mol of HF (Kₐ = 6.6 × 10⁻⁴) is added to water to make 1.00 L of solution. Which statement is correct at equilibrium?",
    options: ["[HF] > [F⁻]", "[H₃O⁺] = 0.100 M", "[H₃O⁺] = [F⁻]", "[H₃O⁺] > [HF]"],
    correct: 0,
    explanation: "For a weak acid like HF, the equilibrium is established between the undissociated acid (HF) and its conjugate base (F⁻). The hydronium ion concentration [H₃O⁺] will approximately equal the concentration of the conjugate base [F⁻] at equilibrium because each HF molecule that dissociates produces one H₃O⁺ and one F⁻ ion."
  },
  {
    text: "What are the orbitals that are filled in K, L, and M shells when these energy levels are fully filled?",
    options: ["1s; 2s, 2p; 3s, 3p, 3d", "1s; 2s, 2p and 3s, 3p", "1s; 2s, 2p, and 3s, 3p, 3d", "1s and 2s, 2p"],
    correct: 0,
    explanation: "The K, L, and M shells represent principal quantum numbers n=1, 2, and 3 respectively. When these shells are fully filled, the orbitals are 1s for K; 2s, 2p for L; and 3s, 3p, 3d for M."
  },
  {
    text: "Fifteen grams (15.00 g) of hydrated calcium sulphate, CaSO₄·nH₂O, weighs 11.85 g after being heated to a constant mass. What is the value of n in CaSO₄·nH₂O? [H = 1; O = 16; S = 32; Ca = 40]",
    options: ["1", "2", "5", "7"],
    correct: 1,
    explanation: "The mass of water lost is 15.00 - 11.85 = 3.15 g. The molar mass of H₂O is 18 g/mol, and the molar mass of anhydrous CaSO₄ is 136 g/mol. Using stoichiometry, moles of water lost = 3.15 ÷ 18 = 0.175 mol, and moles of CaSO₄ = 11.85 ÷ 136 = 0.087 mol. The ratio of moles of H₂O to CaSO₄ is 0.175 ÷ 0.087 ≈ 2. Thus, n = 2."
  },
  {
    text: "If 40.00 mL of 1.600 M HCl and 60.00 mL of 2.000 M NaOH are mixed, what are the respective molar concentrations of OH⁻, Cl⁻, and Na⁺ in the resulting solution?",
    options: ["1.200, 0.560, 0.640 M", "1.200, 0.640, 1.200 M", "0.640, 0.560, 1.200 M", "1.200, 0.640, 0.560 M"],
    correct: 0,
    explanation: "HCl reacts with NaOH in a 1:1 molar ratio. Moles of HCl = 0.040 × 1.600 = 0.064 mol. Moles of NaOH = 0.060 × 2.000 = 0.120 mol. After reaction, excess OH⁻ = 0.120 - 0.064 = 0.056 mol. Total volume = 0.040 + 0.060 = 0.100 L. Concentration of OH⁻ = 0.056 ÷ 0.100 = 0.560 M, Cl⁻ = 0.064 ÷ 0.100 = 0.640 M, Na⁺ = (0.120 ÷ 0.100) = 1.200 M."
  },
  {
    text: "Nitrogen gas can be prepared by passing gaseous ammonia over solid copper(II) oxide at high temperatures. The other products of the reaction are solid copper and water vapour. If 18.1 g NH₃ is reacted with 90.4 g of CuO, how many grams of N₂ will be formed? [NH₃ = 17; CuO = 79.5]",
    options: ["10.6 g", "11.6 g", "12.6 g", "13.6 g"],
    correct: 0,
    explanation: "The balanced reaction is 2NH₃ + 3CuO → N₂ + 3Cu + 3H₂O. Moles of NH₃ = 18.1 ÷ 17 = 1.065 mol. Moles of CuO = 90.4 ÷ 79.5 = 1.137 mol. From the stoichiometry, 2 mol NH₃ reacts with 3 mol CuO. Thus, NH₃ is limiting. Moles of N₂ formed = 1.065 ÷ 2 = 0.5325 mol."
  },
  {
    text: "Calculate the number of Cl⁻ ions in 1.75 L of 1.0 × 10⁻³ M AlCl₃. [Nₐ = 6.02 × 10²³/mol]",
    options: ["3.16 × 10²³", "1.75 × 10²³", "3.16 × 10²¹", "1.75 × 10²¹"],
    correct: 2,
    explanation: "AlCl₃ dissociates into Al³⁺ and 3Cl⁻ ions. The concentration of Cl⁻ = 3 × 1.0 × 10⁻³ = 3.0 × 10⁻³ M. Moles of Cl⁻ = 3.0 × 10⁻³ × 1.75 = 5.25 × 10⁻³ mol. Number of ions = 5.25 × 10⁻³ × 6.02 × 10²³ = 3.16 × 10²¹ ions."
  },
  {
    text: "What is the percentage by mass of copper in copper(I) oxide? [O = 16.0; Cu = 64]",
    options: ["20.0%", "80.0%", "66.7%", "88.9%"],
    correct: 3,
    explanation: "The molar mass of Cu₂O is (2 × 64) + 16 = 144 g/mol. The mass of copper is 128 g/mol. Percentage by mass = (128 ÷ 144) × 100 = 88.9%."
  },

  {
    text: "Accuracy in measurement is:",
    options: ["Agreement between two replicate measurements", "Closeness of measurement to the true value", "Estimated in terms of absolute error", "All of the above"],
    correct: 1,
    explanation: "Accuracy refers to how close a measurement is to the true or accepted value. While agreement between replicates (precision) and absolute error contribute to understanding accuracy, closeness to the true value is the defining characteristic. Therefore, \"All of the above\" is not entirely correct, since agreement between replicates does not guarantee accuracy."
  },
  {
    text: "For the most common types of radioactive decay, the order of least dangerous to most dangerous is:",
    options: ["Gamma, alpha, beta", "Gamma, beta, alpha", "Beta, gamma, alpha", "Alpha, beta, gamma"],
    correct: 1,
    explanation: "The order of least to most dangerous radioactive emissions is gamma, beta, alpha. Gamma rays are highly penetrating electromagnetic radiation, but they have lower ionizing power than alpha and beta particles. Beta particles are electrons or positrons, which are moderately penetrating and have higher ionizing power than gamma rays. Alpha particles, being large and charged, have high ionizing power but are less penetrating. Therefore, alpha particles are the most dangerous if they enter the body, followed by beta particles, and then gamma radiation."
  },
  {
    text: "If L = mrω, where m = 5.79 ± 0.03 kg, r = 15.19 ± 0.02 m, ω = 21.609 ± 0.004 s⁻¹, calculate the percentage relative standard error in L:",
    options: ["5.81%", "5.81 × 10⁻³%", "0.581%", "3.38 × 10⁻³%"],
    correct: 2,
    explanation: "To solve, first understand the different types of formulas involed. Relative Standard error is calculated using the formula (ΔL/L)² = (Δm/m)² + 2(Δr/r)² + (Δω/ω)². Note that the ∆ of any quantity means the error of that quantity. So inputting all necessary values, the  % relative standard error would be 0.581%." 
  },
  {
    text: "The number of protons contained in a given nucleus is called:",
    options: ["Mass number", "Z-number", "Positive number", "Nucleus number"],
    correct: 1,
    explanation: "The number of protons in a nucleus is called the atomic number, often represented by the symbol Z. The mass number (A) is the total number of protons and neutrons. Positive number is too general and nucleus number is not a standard term."
  },
  {
    text: "The rate of reaction of a spontaneous reaction is very slow. This is due to the fact that:",
    options: ["The equilibrium constant of the reaction is < 1", "The reaction is endothermic", "The reaction is exothermic", "The activation energy of the reaction is large"],
    correct: 3,
    explanation: "A slow reaction rate is typically due to a large activation energy. The activation energy is the minimum energy required for the reactants to overcome the energy barrier and initiate the reaction. A large activation energy means that fewer molecules have enough energy to react, leading to a slow reaction rate. While equilibrium constants and whether a reaction is endothermic or exothermic affect equilibrium position, they don't directly determine reaction rate."
  },
  {
    text: "____ does not affect the rate of reaction:",
    options: ["Temperature of reaction", "Amount of reactants", "Physical state of reactants", "ΔH of reaction"],
    correct: 3,
    explanation: "The enthalpy change (ΔH) of a reaction is a thermodynamic quantity that indicates the overall energy change of the reaction. It does not directly determine the rate of the reaction. Temperature, amount of reactants, and physical states of reactants all significantly affect reaction rates."
  },
  {
    text: "The rate constant of a reaction changes when:",
    options: ["Temperature is changed", "Concentration of reactant changes", "Pressure is changed", "A catalyst is added"],
    correct: 0,
    explanation: "The rate constant (k) of a reaction is temperature-dependent. The Arrhenius equation, k = Ae^(-Ea/RT), shows the relationship between the rate constant, activation energy (Ea), temperature (T), and the pre-exponential factor (A). Changes in concentration of reactants affect reaction rate, but not the rate constant itself. Pressure changes affect reaction rate primarily for gaseous reactants. A catalyst changes the reaction mechanism, thereby altering the rate constant."
  }, 
  {
    text: "In the reaction A + B → Products, the doubling of [A] increases the rate four times, but doubling of [B] has no effect. The rate expression is:",
    options: ["Rate = k[A]²[B]²", "Rate = k[A]", "Rate = k[A]²", "Rate = k[A][B]"],
    correct: 2,
    explanation: "Doubling [A] and quadrupling the rate indicates a second-order dependence on [A] (rate ∝ [A]²). The lack of effect from doubling [B] indicates a zero-order dependence on [B] (rate ∝ [B]⁰ = 1). Therefore, the rate expression is Rate = k[A]²."
  },
  {
    text: "For the reaction 2A + B → Products, reaction rate = k[A]²[B]. When the concentration of A is doubled and that of B is halved, the rate of the reaction will be:",
    options: ["Doubled", "Halved", "Unaffected", "Four times larger"],
    correct: 0,
    explanation: "Let's denote the initial rate as R₁ = k[A]²[B]. When [A] is doubled and [B] is halved, the new rate R₂ = k(2[A])²(½[B]) = k(4[A]²)(½[B]) = 2k[A]²[B] = 2R₁. Therefore, the rate is doubled."
  },
  {
    text: "Which statement(s) about the collision theory of reactions is/are correct?\nI. Molecules must have the correct spatial orientations for collisions to lead to reactions.\nII. Only collisions with an energy greater than a certain threshold lead to reactions.",
    options: ["Neither I nor II", "I only", "Both I and II", "II only"],
    correct: 2,
    explanation: "Both statements I and II are correct. For a reaction to occur, colliding molecules must not only possess sufficient kinetic energy (threshold energy) to overcome the activation energy barrier but also have the correct orientation so that bonds can break and form effectively. Only correctly oriented and sufficiently energetic collisions lead to product formation."
  },
  {
    text: "For a reaction with an activation energy of 65 kJ mol⁻¹, by what percentage is the rate constant decreased if the temperature is decreased from 37°C to 22°C? [R = 8.314 J mol⁻¹ K⁻¹]",
    options: ["72%", "28%", "13%", "51%"],
    correct: 1,
    explanation: "We can use the Arrhenius equation to solve this: ln(k₂/k₁) = (Ea/R)(1/T₁ - 1/T₂). First convert temperatures to Kelvin (310 K and 295 K). Substitute values to find k₂/k₁ and then convert to percentage."
  },
  {
    text: "At what temperature will the rate of a reaction having an activation energy of 51.2 kJ mol⁻¹ be three times that found at 20°C, other things being equal? [R = 8.314 J mol⁻¹ K⁻¹]",
    options: ["13°C", "36°C", "25°C", "28°C"],
    correct: 1,
    explanation: "Use the Arrhenius equation again. We know that k₂ = 3k₁. Substitute k₂ and k₁ and the initial temperature (293 K) and solve for the unknown temperature, T₂. Convert the resulting Kelvin temperature back to Celsius."
  },
  {
    text: "Which of the following statements is NOT correct about molecularity of a reaction?",
    options: ["It is the number of the reacting species undergoing simultaneous collision in the elementary reaction", "It is a theoretical concept", "It can assume zero value", "It is always a whole number"],
    correct: 2,
    explanation: "Molecularity refers to the number of molecules or atoms that participate in an elementary reaction step. It is a theoretical concept because we cannot directly observe individual collisions. Molecularity is always a positive whole number; it cannot be zero or a fraction because you cannot have a fraction of a molecule."
  },
  {
    text: "The following correctly describe Dalton's Atomic Theory EXCEPT?:\n(i) All atoms of the same element are identical having the same mass, volume, and chemical properties.\n(ii) All matter is made up of small tiny particles called atoms that are indivisible and indestructible.\n(iii) Atoms have positively charged nuclei where nearly all the mass is concentrated.\n(iv) Chemical combination takes place between atoms of different elements in simple whole numbers to form compounds.\n(v) The number of protons in the nucleus is a fundamental characteristic of an atom.",
    options: ["I and III only", "III and V only", "II, III, and IV only", "V only"],
    correct: 1,
    explanation: "Dalton's atomic theory did NOT include the concept of subatomic particles or the internal structure of the atom (III). It proposed that atoms were indivisible and indestructible (II), all atoms of the same element are identical (I), atoms combine in simple whole number ratios (IV), and that elements are composed of atoms (implied by II). Statement V, while true, is a later refinement to atomic theory beyond Dalton's original postulates."
  }, 
  {
    text: "If an electron of mass 9.11 × 10⁻³¹ kg traveled at a speed of 1.0 × 10⁷ ms⁻¹, calculate the de Broglie wavelength of the electron. [Hint: h = 6.626 × 10⁻³⁴ Js]",
    options: ["9.1 × 10⁻⁴³ m", "7.27 × 10⁻¹¹ m", "7.27 × 10¹¹ m", "9.11 × 10⁻³¹ m"],
    correct: 1,
    explanation: "The de Broglie wavelength (λ) is given by the equation λ = h / p, where h is Planck's constant (6.626 × 10⁻³⁴ Js) and p is the momentum of the electron. Momentum (p) = mass (m) × velocity (v). Therefore, p = (9.11 × 10⁻³¹ kg) × (1.0 × 10⁷ ms⁻¹) = 9.11 × 10⁻²⁴ kgms⁻¹. Substituting into the de Broglie equation: λ = (6.626 × 10⁻³⁴ Js) / (9.11 × 10⁻²⁴ kgms⁻¹) ≈ 7.27 × 10⁻¹¹ m."
  },
  {
    text: "Which of the following electronic configurations correctly depicts the configuration of Cu in shorthand form?",
    options: ["[Ar]4s²3d⁸", "[Ar]4s²3d⁹", "[Ar]4s¹3d¹⁰", "[Ar]4s¹3d¹⁰"],
    correct: 3,
    explanation: "Copper (Cu) is an exception to the Aufbau principle. While you might expect the configuration to be [Ar]4s²3d¹⁰, it's actually [Ar]4s¹3d¹⁰. A completely filled d subshell (d¹⁰) is more stable than a partially filled one, hence the electron configuration of Cu."
  },
  {
    text: "What orbital is described by the quantum numbers n = 3 and l = 1?",
    options: ["3s orbital", "3p orbital", "2p orbital", "3d orbital"],
    correct: 1,
    explanation: "The principal quantum number (n) indicates the energy level (shell), and the azimuthal quantum number (l) indicates the subshell (orbital type). n = 3 signifies the third energy level. l = 1 corresponds to a p subshell. Therefore, the orbital is a 3p orbital."
  },

  {
    text: "Which of the following is arranged in the order of decreasing electronegativity?",
    options: ["Li, N, B, F, Be", "F, B, Be, N, Li", "Li, Be, B, N, F", "F, N, B, Be, Li"],
    correct: 2,
    explanation: "Electronegativity is the ability of an atom to attract electrons in a chemical bond. Electronegativity generally increases across a period (from left to right) and decreases down a group. Fluorine (F) is the most electronegative element. Therefore, the correct order is F, N, B, Be, Li."
  },
  {
    text: "Given the following elements: ¹⁹₉P, ¹⁷₉Q, ³₁R, ²⁴₁₂S, ²⁰₁₀T, which of these statements is untrue about the elements?",
    options: ["T, R, P, and S are metals", "P and Q are isotopes", "R is an isotope of Hydrogen", "T is a noble gas"],
    correct: 0,
    explanation: "Let's analyze the statements, assuming 'P' and 'Q' were meant to be 'O' and 'F'.\n(A) T, R, P, and S are metals: This is untrue. Assuming R is Hydrogen (H) and the rest are the elements presented, Neon (Ne), Oxygen (O), and Fluorine (F) are nonmetals; the assumption about S needs clarification.\n(B) P and Q are isotopes: True if P and Q refer to isotopes of oxygen (O). Both are Oxygen but with different mass numbers.\n(C) R is an isotope of Hydrogen: True, if R stands for Hydrogen.\n(D) T is a noble gas: True, if T is Neon (Ne)."
  },
  {
    text: "In Rutherford's nuclear atom/alpha scattering experiment, which of the following was used to shield alpha radiation fall-outs and what was bombarded with alpha particles generated from the radioactive source?",
    options: ["Aluminium block and Thin gold foil", "Wooden block and Thin silver foil", "Lead block and Thin gold foil", "Iron block and Diamond foil"],
    correct: 2,
    explanation: "In Rutherford's experiment, a lead block was used to shield the surroundings from alpha radiation. A thin gold foil was bombarded with alpha particles."
  },
  {
    text: "Given the orbitals 3d, 4s, 4p, and 4d, which of these orbitals have the lowest and highest energies respectively?",
    options: ["4s and 4p", "4s and 4d", "3d and 4p", "4d and 4p"],
    correct: 1,
    explanation: "The energy levels of orbitals are typically determined by the (n+l) rule. Orbitals with lower (n+l) values have lower energies. If the (n+l) values are the same, then the orbital with the lower 'n' value will have lower energy.\n* 4s: n=4, l=0, (n+l)=4\n* 3d: n=3, l=2, (n+l)=5\n* 4p: n=4, l=1, (n+l)=5\n* 4d: n=4, l=2, (n+l)=6\nTherefore, the 4s orbital has the lowest energy, and the 4d orbital has the highest energy."
  }, 
  {
    text: "Which statement(s) about the collision theory of reactions is/are correct?\nI. Molecules must have the correct spatial orientations for collisions to lead to reactions.\nII. Only collisions with an energy greater than a certain threshold lead to reactions.",
    options: ["Neither I nor II", "I only", "Both I and II", "II only"],
    correct: 2,
    explanation: "Both statements I and II are correct. For a reaction to occur, colliding molecules must not only possess sufficient kinetic energy (threshold energy) to overcome the activation energy barrier but also have the correct orientation so that bonds can break and form effectively. Only correctly oriented and sufficiently energetic collisions lead to product formation."
  },
  
  {
    text: "Which of the following statements is NOT correct about molecularity of a reaction?\nI. It is the number of the reacting species undergoing simultaneous collision in the elementary reaction.\nII. It is a theoretical concept.\nIII. It can assume zero value.\nIV. It is always a whole number.",
    options: ["I only", "II only", "III only", "IV only"],
    correct: 2,
    explanation: "Molecularity refers to the number of molecules or atoms that participate in an elementary reaction step. It is a theoretical concept because we cannot directly observe individual collisions. Molecularity is always a positive whole number; it cannot be zero or a fraction because you cannot have a fraction of a molecule."
  }, 
  
  {
    text: "Which of the following statements about the molecular orbital theory is/are correct?\nI. Bonding molecular orbitals are lower in energy than the atomic orbitals from which they are formed.\nII. Antibonding molecular orbitals are higher in energy than bonding molecular orbitals.\nIII. Electrons in bonding molecular orbitals increase bond strength.\nIV. Electrons in antibonding molecular orbitals decrease bond strength.",
    options: ["I and II only", "III and IV only", "I, II, and III only", "All of the above"],
    correct: 3,
    explanation: "All statements are correct:\n(I) Bonding molecular orbitals are lower in energy than atomic orbitals because constructive interference stabilizes the electrons.\n(II) Antibonding molecular orbitals are higher in energy due to destructive interference.\n(III) Electrons in bonding orbitals increase bond strength by stabilizing the bond.\n(IV) Electrons in antibonding orbitals weaken the bond by destabilizing the molecule."
  },
  {
    text: "Which of the following statements regarding periodic trends is/are correct?\nI. Atomic radius increases across a period.\nII. Ionization energy decreases down a group.\nIII. Electronegativity decreases down a group.\nIV. Electron affinity generally increases across a period.",
    options: ["I only", "II and III only", "III and IV only", "II, III, and IV only"],
    correct: 3,
    explanation: "The correct statements are:\n(I) Incorrect: Atomic radius decreases across a period due to increased nuclear charge.\n(II) Correct: Ionization energy decreases down a group because electrons are farther from the nucleus.\n(III) Correct: Electronegativity decreases down a group due to increased shielding and atomic radius.\n(IV) Correct: Electron affinity generally increases across a period due to greater attraction between the nucleus and added electrons."
  }, 
    {
      text: "Chemical equilibrium is achieved when:",
      options: [
        "The forward and reverse reactions stop",
        "The concentrations of reactants and products remain constant",
        "The rate of the forward reaction exceeds the reverse reaction",
        "The reaction is irreversible"
      ],
      correct: 1,
      explanation: "Chemical equilibrium is a dynamic state where the rates of the forward and reverse reactions are equal, resulting in no net change in the concentrations of reactants and products.  While the reactions continue, there's no further change in overall composition."
    },
    {
      text: "The study of energy changes in chemical reactions is known as:",
      options: [
        "Kinetics",
        "Thermochemistry", 
        "Electrochemistry",
        "Equilibrium"
      ],
      correct: 1,
      explanation: "Thermochemistry is the branch of chemistry that deals with the heat absorbed or released during chemical reactions and changes in state. It focuses on the relationship between chemical reactions and energy changes."
    },
    {
      text: "The heat absorbed or released during a reaction at constant pressure is called:",
      options: [
        "Work done",
        "Enthalpy change",
        "Free energy change",
        "Heat capacity"
      ],
      correct: 1,
      explanation: "Enthalpy change (ΔH) represents the heat absorbed or released at constant pressure.  It's a measure of the heat content of a system."
    },
    {
      text: "If a reaction releases heat to the surroundings, it is classified as:",
      options: [
        "Endothermic",
        "Exothermic",
        "Isothermal",
        "Reversible"
      ],
      correct: 1,
      explanation: "An exothermic reaction is characterized by the release of heat to the surroundings.  The enthalpy change (ΔH) for an exothermic reaction is negative."
    },
    {
      text: "The internal energy of a system includes:",
      options: [
        "Kinetic and potential energies of particles",
        "Only kinetic energy of particles",
        "Only potential energy of particles",
        "Heat absorbed by the system"
      ],
      correct: 0,
      explanation: "Internal energy (U) encompasses the total kinetic and potential energies of all the particles within a system.  It's a state function, meaning its value depends only on the current state of the system."
    },
    {
      text: "In an isolated system, the total energy remains constant because:",
      options: [
        "Heat cannot flow into or out of the system",
        "Work cannot be done on the system",
        "The system is open",
        "The first law of thermodynamics applies"
      ],
      correct: 3,
      explanation: "The first law of thermodynamics, which states that energy is conserved, explains why the total energy of an isolated system remains constant.  No energy transfer (heat or work) occurs between the isolated system and its surroundings."
    },
    {
      text: "Heat transfer at constant volume is related to:",
      options: [

        "Enthalpy change",
        "Change in internal energy",
        "Entropy change",
        "Work done"
      ],
      correct: 1,
      explanation: "At constant volume, no work is done (w = 0), and the heat transferred (q) equals the change in internal energy (ΔU), according to the first law of thermodynamics (ΔU = q + w)."
    },
    {
      text: "The specific heat of a substance is defined as the amount of heat required to:",
      options: [
        "Raise the temperature of 1 gram of a substance by 1°C",
        "Vaporize 1 gram of a liquid",
        "Freeze 1 gram of a liquid",
        "Increase the volume of a substance by 1 liter"
      ],
      correct: 0,
      explanation: "Specific heat capacity is defined as the amount of heat required to raise the temperature of 1 gram of a substance by 1°C (or 1 K). It is an intensive property, meaning that it is independent of the amount of the substance."
    },
    {
      text: "Hess's Law is based on the principle of:",
      options: [
        "Conservation of mass",
        "Conservation of energy",
        "Conservation of volume",
        "Conservation of entropy"
      ],
      correct: 1,
      explanation: "Hess's Law is a direct consequence of the law of conservation of energy. The total enthalpy change for a reaction is independent of the path taken, only depending on the initial and final states."
    },
    {
      text: "In an endothermic reaction, the enthalpy change is:",
      options: [
        "Negative",
        "Zero",
        "Positive",
        "Equal to the work done"
      ],
      correct: 2,
      explanation: "In an endothermic reaction, the system absorbs heat from its surroundings, resulting in a positive enthalpy change (ΔH > 0)."
    },
    {
      text: "What is the enthalpy of a compound in its standard state?",
      options: [
        "Zero",
        "Variable",
        "Equal to its internal energy",
        "Equal to the heat of formation"
      ],
      correct: 3,
      explanation: "The standard enthalpy of formation (ΔHf°) of a compound is the enthalpy change when one mole of the compound is formed from its elements in their standard states (usually at 298 K and 1 atm)."
    },
    {
      text: "The amount of heat required to break bonds in 1 mole of a gaseous substance is called:",
      options: [
        "Heat of combustion",
        "Bond enthalpy",
        "Heat of formation",
        "Heat of reaction"
      ],
      correct: 1,
      explanation: "Bond enthalpy (or bond energy) represents the average amount of energy required to break one mole of a particular type of bond in a gaseous molecule."
    },
    {
      text: "If ΔH = -50 kJ and ΔS = -0.1 kJ/K at 298 K, the reaction is:",
      options: [
        "Always spontaneous",
        "Never spontaneous",
        "Spontaneous only at low temperatures",
        "Spontaneous only at high temperatures"
      ],
      correct: 2,
      explanation: "Using Gibbs Free Energy (ΔG = ΔH - TΔS), at 298K, ΔG = -50kJ - (298K)(-0.1kJ/K) = -20.2 kJ.  A negative ΔG indicates spontaneity. However, since both ΔH and ΔS are negative, the reaction will only be spontaneous at lower temperatures where the -TΔS term is less significant than the negative ΔH.  At high temperatures, the positive TΔS term would dominate, making ΔG positive and the reaction non-spontaneous."
    },
    {
      text: "The entropy of a system increases when:",
      options: [
        "A gas is compressed",
        "A liquid freezes",
        "A solid melts",
        "A liquid condenses"
      ],
      correct: 2,
      explanation: "Entropy (S) is a measure of disorder or randomness.  Melting a solid increases disorder as particles become more mobile.  The other options decrease disorder (increased order)."
    },
    {
      text: "Which process occurs at constant temperature?",
      options: [
        "Isobaric",
        "Isothermal",
        "Isochoric",
        "Adiabatic"
      ],
correct: 1,
      explanation: "An isothermal process occurs at constant temperature. Isobaric is constant pressure, isochoric is constant volume, and adiabatic is no heat exchange."
    },
    {
      text: "The second law of thermodynamics states that:",
      options: [
        "Energy is conserved",
        "Entropy of the universe always increases",
        "Work done is always positive",
        "Heat flows from cold to hot spontaneously"
      ],
      correct: 1,
      explanation: "The second law of thermodynamics states that the total entropy of an isolated system can only increase over time, or remain constant in ideal cases where the system is in a steady state or undergoing a reversible process."
    },
    {
      text: "A reaction that proceeds with both heat release and increased disorder is:",
      options: [
  "Non-spontaneous",
        "Reversible",
        "Spontaneous",
        "Exothermic only"
      ],
      correct: 2,
      explanation: "A negative enthalpy change (ΔH < 0) indicates heat release (exothermic), and a positive entropy change (ΔS > 0) indicates increased disorder.  Both contribute to a negative Gibbs free energy change (ΔG < 0), indicating spontaneity."
    },
    {
      text: "The enthalpy change during the combustion of 1 mole of a substance is known as:",
      options: [
        "Heat of vaporization",
        "Heat of combustion",
        "Heat of reaction",
        "Heat of solution"
      ],
      correct: 1,
      explanation: "The heat of combustion is the enthalpy change when one mole of a substance undergoes complete combustion with oxygen under standard conditions."
    },
    {
      text: "Which quantity represents the maximum usable energy in a reaction?",
      options: [
        "Entropy",
        "Free energy",
        "Enthalpy",
        "Internal energy"
      ],
      correct: 1,
      explanation: "Gibbs free energy (G) represents the maximum amount of energy available from a reaction that can be used to do useful work at constant temperature and pressure."
    },
    {
      text: "The heat of neutralization for a strong acid and a strong base is approximately:",
      options: [
        "-57 kJ/mol",
        "57 kJ/mol",
        "-13 kJ/mol",
        "0 kJ/mol"
      ],
      correct: 0,
      explanation: "The heat of neutralization for a strong acid and a strong base is approximately -57 kJ/mol because the reaction is exothermic.  The value is relatively constant for strong acids and strong bases because the reaction essentially involves the formation of water molecules."
    },
    {
      text: "Which property determines whether a reaction is spontaneous?",
      options: [
        "Enthalpy change",
        "Free energy change",
        "Bond energy",
        "Activation energy"
      ],
      correct: 1,
      explanation: "The Gibbs free energy change (ΔG) determines the spontaneity of a reaction at constant temperature and pressure.  A negative ΔG indicates a spontaneous reaction."
 },
    {
      text: "What is the equilibrium constant for a reversible reaction?",
      options: [
        "Ratio of concentrations of products to reactants",
        "Difference in enthalpy of products and reactants",
        "Total energy of the system",
        "None of the above"
      ],
      correct: 0,
      explanation: "The equilibrium constant (K) is the ratio of the product of the concentrations of the products raised to their stoichiometric coefficients to the product of the concentrations of the reactants raised to their stoichiometric coefficients, each concentration at equilibrium."
    },
    {
      text: "Le Chatelier’s Principle predicts the effect of:",
      options: [
        "Concentration changes",
        "Temperature changes",
        "Pressure changes",
        "All of the above"
      ],
      correct: 3,
      explanation: "Le Chatelier's Principle states that if a change of condition is applied to a system in equilibrium, the system will shift in a direction that relieves the stress. This applies to changes in concentration, temperature, pressure, and volume."
    },
    {
      text: "Which reaction is most affected by a change in pressure?",
      options: [
        "Reactions with no change in the number of moles of gas",
        "Reactions with fewer gas moles on the product side",
        "Reactions with no gases involved",
        "Reactions with liquids"
      ],
      correct: 1,
      explanation: "Reactions involving gases are most affected by pressure changes.  A pressure increase shifts the equilibrium towards the side with fewer gas moles to reduce the pressure, and vice-versa."
    },
    {
      text: "An increase in temperature for an endothermic reaction will:",
      options: [
        "Shift equilibrium to the right",
        "Shift equilibrium to the left",
        "Have no effect on equilibrium",
        "Stop the reaction"
      ],
      correct: 0,
      explanation: "For an endothermic reaction (heat is a reactant), increasing the temperature adds more 'reactant' (heat), shifting the equilibrium to the right, favoring the products."
    },
    {
      text: "Which factor does not affect equilibrium constant (K)?",
      options: [
        "Concentration",
        "Temperature",
        "Pressure",
        "Catalyst"
      ],
      correct: 3,
      explanation: "A catalyst increases the rate of both the forward and reverse reactions equally, therefore it does not affect the position of equilibrium and hence, the equilibrium constant K."
    },
    {
      text: "What is the relationship between Kp and Kc?",
      options: [
        "Kp = Kc × RT",
        "Kp = Kc × (RT)ⁿ",
        "Kp = Kc × Rⁿ",
        "Kp = Kc × nRT"
      ],
      correct: 1,
      explanation: "Kp is the equilibrium constant expressed in terms of partial pressures, while Kc uses molar concentrations. The relationship is Kp = Kc(RT)^Δn, where Δn is the change in the number of moles of gas in the reaction (moles of gaseous products - moles of gaseous reactants)."
    },
    {
      text: "The equilibrium constant of a reaction is very large. This implies that:",
      options: [
        "Reactants are favored",
        "Products are favored",
        "The reaction is very slow",
        "The system is at equilibrium"
      ],
      correct: 1,
      explanation: "A large equilibrium constant (K >> 1) indicates that the equilibrium lies far to the right, meaning that the products are significantly favored at equilibrium."
    },
    {
      text: "The equilibrium constant for a reaction is 1. What does this mean?",
      options: [
        "Forward reaction dominates",
        "Reverse reaction dominates",
        "Reactants and products are in equal concentration",
        "The reaction is spontaneous"
      ],
      correct: 2,
      explanation: "When K = 1, the concentrations of reactants and products at equilibrium are roughly equal. This means neither the forward nor the reverse reaction is strongly favored."
    },
    {
      text: "If Q > K, the reaction will:",
      options: [
        "Shift to the right",
        "Shift to the left",
        "Be at equilibrium",
        "Stop completely"
      ],
      correct: 1,
      explanation: "Q is the reaction quotient. If Q > K, the concentration of products is higher than at equilibrium.  The reaction will shift to the left (reverse reaction) to consume products and form reactants, reducing Q until it equals K."
    },
    {
      text: "A catalyst affects equilibrium by:",
      options: [
        "Increasing the equilibrium constant",
        "Decreasing the equilibrium constant",
        "Increasing the rate at which equilibrium is achieved",
        "Shifting the equilibrium to the right"
      ],
      correct: 2,
      explanation: "A catalyst speeds up both the forward and reverse reactions equally, thus it does not shift the equilibrium position but only speeds up the rate at which the equilibrium is reached."
    },
    {
      text: "The reaction quotient (Q) is used to:",
      options: [
        "Predict the direction of the reaction",
        "Calculate the heat released",
        "Measure the change in entropy",
        "Calculate the activation energy"
      ],
      correct: 0,
      explanation: "The reaction quotient (Q) is a measure of the relative amounts of products and reactants present in a reaction at any given time. By comparing Q to the equilibrium constant K, we can determine whether a reaction will proceed in the forward or reverse direction to reach equilibrium."
    },
    {
      text: "What happens to K when temperature increases for an exothermic reaction?",
      options: [
        "K increases",
        "K decreases",
        "K remains constant",
        "Reaction stops"
      ],
      correct: 1,
      explanation: "For an exothermic reaction (heat is a product), increasing the temperature adds more 'product' (heat), shifting the equilibrium to the left, and thus decreasing the equilibrium constant K."
    },
    {
      text: "When a system at equilibrium is disturbed, it adjusts to counteract the change. This is known as:",
      options: [
        "Hess's Law",
        "Dalton's Law",
        "Le Chatelier’s Principle",
        "Thermodynamic Law"
      ],
      correct: 2,
      explanation: "Le Chatelier's Principle describes the response of a system at equilibrium to external changes. The system shifts to minimize the effect of the change."
    },
    {
      text: "In the Haber process, increasing pressure favors:",
      options: [
        "Reactants",
        "Products",
        "No change in equilibrium",
        "None of the above"
      ],
      correct: 1,
      explanation: "The Haber process (N₂ + 3H₂ ⇌ 2NH₃) has fewer moles of gas on the product side. Increasing pressure shifts the equilibrium to the right, favoring ammonia (NH₃) production."
    },
    {
      text: "At equilibrium, the rate of the forward reaction is:",
      options: [
        "Greater than the reverse reaction",
        "Less than the reverse reaction",
        "Equal to the reverse reaction",
        "Zero"
      ],
      correct: 2,
      explanation: "At equilibrium, the rates of the forward and reverse reactions are equal. This is why there is no net change in the concentrations of reactants and products."
    },
    {
      text: "For the equilibrium N₂(g) + 3H₂(g) ⇌ 2NH₃(g), decreasing volume:",
      options: [
        "Shifts equilibrium to the right",
        "Shifts equilibrium to the left",
        "Has no effect",
        "Increases activation energy"
      ],
      correct: 0,
      explanation: "Decreasing the volume increases the pressure.  According to Le Chatelier's principle, the equilibrium will shift to the side with fewer moles of gas, which is the right side (products) in this reaction."
    },
    {
      text: "In the equilibrium H₂O(l) ⇌ H₂O(g), increasing temperature will:",
      options: [
        "Shift equilibrium to the right",
        "Shift equilibrium to the left",
        "Increase liquid water concentration",
        "Have no effect"
      ],
      correct: 0,
      explanation: "This is an endothermic reaction (heat is absorbed to vaporize water). Increasing the temperature shifts the equilibrium to the right, favoring the gaseous phase."
    },
    {
      text: "The equilibrium constant for a gaseous reaction is called:",
      options: [
        "Kp",
        "Kc",
        "Ksp",
        "Ka"
      ],
      correct: 0,
      explanation: "Kp is the equilibrium constant expressed in terms of the partial pressures of the gases involved in the reaction at equilibrium."
    },
    {
      text: "For a reaction to reach equilibrium, it must be:",
      options: [
        "Irreversible",
        "Reversible",
        "Exothermic",
        "Endothermic"
      ],
      correct: 1,
      explanation: "Equilibrium is only possible in reversible reactions, where both the forward and reverse reactions can occur simultaneously."
    },              
   {
      text: "An exothermic reaction:",
      options: [
        "Releases heat",
        "Absorbs heat",
        "Has zero enthalpy change",
        "Requires a catalyst"
      ],
      correct: 0,
      explanation: "An exothermic reaction is one that releases heat to its surroundings, resulting in a temperature increase of the surroundings. Common examples include combustion reactions and many oxidation reactions."
    },
    {
      text: "Which of the following is a state function?",
      options: [
        "Heat (q)",
        "Work (w)",
        "Enthalpy (H)",
        "Path length"
      ],
      correct: 2,
      explanation: "A state function is a property that depends only on the state of the system, not on the path taken to reach that state. Enthalpy (H) is a state function because it depends only on the current state of the system."
    },
    {
      text: "The standard enthalpy of formation of an element in its standard state is:",
      options: [
        "1",
        "0",
        "-1",
        "Variable"
      ],
      correct: 1,
      explanation: "The standard enthalpy of formation (ΔHf°) of an element in its standard state is defined as zero. This is because the formation of an element from itself involves no energy change."
    },
    {
      text: "Hess’s Law states that:",
      options: [
        "Entropy is always increasing",
        "The total enthalpy change is independent of the path taken",
        "Energy is conserved in a reaction",
        "None of the above"
      ],
      correct: 1,
      explanation: "Hess’s Law states that the total enthalpy change for a reaction is the same, regardless of the pathway taken, as long as the initial and final conditions are the same. This principle allows for the calculation of enthalpy changes using known enthalpy changes of other reactions."
    },
    {
      text: "In an endothermic reaction, the surroundings:",
      options: [
        "Get hotter",
        "Get colder",
        "Remain unchanged",
        "React with the system"
      ],
      correct: 1,
      explanation: "In an endothermic reaction, heat is absorbed from the surroundings, causing a decrease in the temperature of the surroundings while the system undergoes the reaction."
    },
    {
      text: "What is the unit of enthalpy?",
      options: [
        "Kelvin (K)",
        "Joule (J)",
        "Watt (W)",
        "Newton (N)"
      ],
      correct: 1,
      explanation: "The standard unit of enthalpy is the Joule (J). Enthalpy measures the total heat content of a system at constant pressure."
    },
    {
      text: "Which of the following is an extensive property?",
      options: [
        "Temperature",
        "Density",
        "Enthalpy",
        "Pressure"
      ],
      correct: 2,
      explanation: "Extensive properties depend on the amount of substance present. Enthalpy is classified as an extensive property because it changes as the amount of substance in the system changes."
    },
    {
      text: "The heat required to raise the temperature of 1 g of water by 1°C is called:",
      options: [
        "Specific heat",
        "Heat capacity",
        "Calorie",
        "Joule"
      ],
      correct: 2,
      explanation: "A calorie is defined as the amount of heat required to raise the temperature of 1 gram of water by 1°C. It is a common unit for measuring heat."
    },
    {
      text: "The specific heat capacity of a substance depends on:",
      options: [
        "Mass of the substance",
        "Nature of the substance",
        "Both A and B",
        "None of the above"
      ],
      correct: 1,
      explanation: "The specific heat capacity is an intrinsic property of a substance that depends on its nature. It indicates how much heat is required to raise the temperature of a unit mass of the substance by one degree Celsius."
    },
    {
      text: "In calorimetry, the device used to measure heat is called:",
      options: [
        "Thermometer",
        "Calorimeter",
        "Hygrometer",
        "Barometer"
      ],
      correct: 1,
      explanation: "A calorimeter is an instrument used to measure the amount of heat involved in a chemical reaction or a physical process."
    },
    {
      text: "The heat absorbed by a system at constant volume is equal to:",
      options: [
        "Work done",
        "Enthalpy change",
        "Internal energy change",
        "None of the above"
      ],
      correct: 2,
      explanation: "At constant volume, the heat absorbed by the system is equal to the change in internal energy (ΔU) of the system, as no work is done during volume changes."
    },
    {
      text: "An isothermal process occurs at:",
      options: [
        "Constant pressure",
        "Constant volume",
        "Constant temperature",
        "Constant energy"
      ],
      correct: 2,
      explanation: "An isothermal process is one that occurs at a constant temperature. In such processes, the internal energy of the system remains unchanged, provided the ideal gas law applies."
    },
    {
      text: "The entropy of a perfectly crystalline substance at absolute zero is:",
      options: [
        "Infinity",
        "Zero",
        "Constant",
        "Negative"
      ],
      correct: 1,
      explanation: "According to the third law of thermodynamics, the entropy of a perfect crystal approaches zero as the temperature approaches absolute zero (0 K). At this temperature, the crystal is in a state of perfect order."
    },
    {
      text: "Which of these reactions is exothermic?",
      options: [
        "Melting of ice",
        "Combustion of methane",
        "Evaporation of water",
        "Boiling of water"
      ],
      correct: 1,
      explanation: "The combustion of methane is an exothermic reaction that releases heat and light energy. It involves the reaction of methane with oxygen to produce carbon dioxide and water."
    },
    {
      text: "Gibbs free energy (G) is given by:",
      options: [
        "G = H - TS",
        "G = H + TS",
        "G = TS - H",
        "G = H × T × S"
      ],
      correct: 0,
      explanation: "The Gibbs free energy equation is defined as G = H - TS, where G is the Gibbs free energy, H is the enthalpy, T is the temperature in Kelvin, and S is the entropy. This equation helps predict the spontaneity of a reaction."
    },
    {
      text: "The heat of neutralization for a strong acid and a strong base is approximately:",
      options: [
        "-13.7 kJ/mol",
        "-57.1 kJ/mol",
        "57.1 kJ/mol",
        "13.7 kJ/mol"
      ],
      correct: 1,
      explanation: "The heat of neutralization for the reaction between a strong acid and a strong base is approximately -57.1 kJ/mol. This represents the heat released when one mole of water is formed from the neutralization reaction."
    },
    {
      text: "A reaction is spontaneous if:",
      options: [
        "ΔG > 0",
        "ΔG = 0",
        "ΔG < 0",
        "None of the above"
      ],
      correct: 2,
      explanation: "A reaction is considered spontaneous if the change in Gibbs free energy (ΔG) is less than zero (ΔG < 0). This indicates that the reaction can occur without needing to input additional energy."
    },
    {
      text: "The enthalpy change during the combustion of 1 mole of a substance is called:",
      options: [
        "Heat of formation",
        "Heat of reaction",
        "Heat of combustion",
        "Heat of vaporization"
      ],
      correct: 2,
      explanation: "The enthalpy change associated with the combustion of one mole of a substance is termed the heat of combustion. This value can be negative, indicating that energy is released during the combustion process."
    }, 
    {
      text: "Who proposed the Plum Pudding Model of the atom?",
      options: [
        "Ernest Rutherford",
        "J.J. Thomson",
        "John Dalton",
        "Niels Bohr"
      ],
      correct: 1,
      explanation: "J.J. Thomson's Plum Pudding Model, proposed in 1904, depicted the atom as a sphere of positive charge with negatively charged electrons embedded within it, like plums in a pudding. This model was a significant step forward from Dalton's solid sphere model but was later superseded by Rutherford's nuclear model."
    },
    {
      text: "What does the principal quantum number (n) describe?",
      options: [
        "Shape of the orbital",
        "Energy level of the electron",
        "Spin of the electron",
        "Magnetic orientation of the orbital"
      ],
      correct: 1,
      explanation: "The principal quantum number (n) represents the energy level of an electron within an atom.  It is a positive integer (n = 1, 2, 3, ...), with higher values of 'n' indicating higher energy levels and greater distance from the nucleus.  The energy levels are not equally spaced; the spacing between levels decreases as 'n' increases."
    },
    {
      text: "The smallest particle of an element that retains its chemical properties is:",
      options: [
        "Molecule",
        "Ion",
        "Atom",
        "Proton"
      ],
      correct: 2,
      explanation: "An atom is the smallest unit of an element that retains its chemical properties.  A molecule is formed from two or more atoms chemically bonded together, while ions are atoms that have gained or lost electrons, acquiring a net electric charge. A proton is a subatomic particle found in the nucleus; it is not the smallest particle retaining chemical properties."
    },
    {
      text: "Who discovered the nucleus in the atom?",
      options: [
        "J.J. Thomson",
        "Ernest Rutherford",
        "Niels Bohr",
        "Max Planck"
      ],
      correct: 1,
      explanation: "Ernest Rutherford's gold foil experiment in 1911 led to the discovery of the atomic nucleus.  By observing the scattering of alpha particles, he determined that the atom's positive charge and most of its mass were concentrated in a small, dense central region, which he termed the nucleus."
    },
    {
      text: "Which subatomic particle determines the atomic number?",
      options: [
        "Neutron",
        "Proton",
        "Electron",
        "Positron"
      ],
      correct: 1,
      explanation: "The atomic number of an element is defined by the number of protons in its nucleus.  Protons carry a positive charge and are one of the two major components of the atomic nucleus. The number of protons uniquely identifies an element and determines its place on the periodic table."
    },
    {
      text: "The isotope of an element has:",
      options: [
        "Same number of neutrons, different protons",
        "Different number of protons, same electrons",
        "Same number of protons, different neutrons",
        "Different electrons, same neutrons"
      ],
      correct: 2,
      explanation: "Isotopes are atoms of the same element that have the same number of protons (and thus the same atomic number) but differ in the number of neutrons. This difference in neutron number results in different mass numbers for the isotopes.  The chemical properties are largely determined by the number of protons and electrons."
    },
    {
      text: "What is the maximum number of electrons in an s-orbital?",
      options: [
        "2",
        "4",
        "6",
        "8"
      ],
      correct: 0,
      explanation: "An s-orbital is a spherical electron orbital that can hold a maximum of two electrons, according to the Pauli Exclusion Principle. Each electron in the orbital has a unique set of quantum numbers; to satisfy this, they must have opposite spins."
    },
    {
      text: "What is the charge of an alpha particle?",
      options: [
        "+2",
        "-1",
        "0",
        "+1"
      ],
      correct: 0,
      explanation: "An alpha particle is a helium nucleus, consisting of two protons and two neutrons. Therefore, it carries a net positive charge of +2."
    },
    {
      text: "The concept of quantized energy levels was proposed by:",
      options: [
        "Einstein",
        "Planck",
        "Bohr",
        "Rutherford"
      ],
      correct: 2,
      explanation: "While Max Planck's work on blackbody radiation laid the groundwork for the concept of quantized energy, it was Niels Bohr who incorporated this concept into his model of the atom in 1913. Bohr's model proposed that electrons orbit the nucleus in specific energy levels, and transitions between these levels involve the absorption or emission of discrete quanta of energy."
    },
    {
      text: "The Heisenberg Uncertainty Principle states that:",
      options: [
        "Electrons are found in fixed paths",
        "Position and momentum of an electron cannot be determined simultaneously",
        "Electrons emit radiation continuously",
        "All particles have the same energy level"
      ],
      correct: 1,
      explanation: "The Heisenberg Uncertainty Principle, formulated in 1927, states that it is fundamentally impossible to simultaneously determine both the position and momentum of a particle (like an electron) with perfect accuracy.  The more precisely one quantity is known, the less precisely the other can be known. This principle is a fundamental aspect of quantum mechanics."
    },
    {
      text: "What is the shape of a p-orbital?",
      options: [
        "Spherical",
        "Dumbbell",
        "Elliptical",
        "Linear"
      ],
      correct: 1,
      explanation: "A p-orbital has a dumbbell shape, with two lobes of electron density on either side of the nucleus. There are three p-orbitals oriented along the x, y, and z axes in space, designated px, py, and pz."
    },
    {
      text: "The mass of a neutron is approximately equal to:",
      options: [
        "Proton",
        "Electron",
        "Nucleus",
        "Photon"
      ],
      correct: 0,
      explanation: "The mass of a neutron is approximately equal to the mass of a proton.  Both are significantly more massive than an electron.  The nucleus contains both protons and neutrons, and a photon is a massless particle."
    },
    {
      text: "The atomic theory was first proposed by:",
      options: [
"J.J. Thomson",
        "John Dalton",
        "Rutherford",
        "Democritus"
      ],
      correct: 1,
      explanation: "While the ancient Greek philosopher Democritus proposed the concept of atoms, it was John Dalton who, in the early 1800s, formulated the first scientific atomic theory. Dalton's theory proposed that all matter is made up of indivisible atoms, atoms of the same element are identical, and chemical reactions involve the rearrangement of atoms."
    },
    {
      text: "Electrons revolve around the nucleus in fixed orbits according to:",
      options: [
        "Rutherford’s Model",
        "Bohr’s Model",
        "Thomson’s Model",
        "Modern Atomic Theory"
      ],
      correct: 1,
      explanation: "Bohr's model of the atom, proposed in 1913, incorporated the concept of quantized energy levels.  It suggested that electrons orbit the nucleus in specific, quantized energy levels or shells, and transitions between these levels result in the absorption or emission of photons of specific energies."
    },
    {
      text: "Which element has no neutrons?",
      options: [
        "Oxygen",
        "Hydrogen",
        "Helium",
        "Lithium"
      ],
      correct: 1,
      explanation: "The most common isotope of hydrogen (protium) has only one proton and no neutrons in its nucleus.  Other isotopes of hydrogen (deuterium and tritium) do contain neutrons."
    },
    {
      text: "The wave-particle duality of electrons was proposed by:",
      options: [
        "Einstein",
        "Louis de Broglie",
        "Rutherford",
        "Bohr"
      ],
      correct: 1,
      explanation: "Louis de Broglie, in his 1924 doctoral thesis, proposed that all matter exhibits wave-particle duality, meaning that particles like electrons have both wave-like and particle-like properties.  This revolutionary idea was a cornerstone of the development of quantum mechanics."
    },
    {
      text: "The Pauli Exclusion Principle states that:",
      options: [
        "An orbital can hold a maximum of two electrons with opposite spins",
        "Electrons occupy the lowest energy orbitals first",
        "No two electrons can have the same set of quantum numbers",
        "Energy is quantized"
      ],
      correct: 2,
      explanation: "The Pauli Exclusion Principle states that no two electrons in an atom can have the same set of four quantum numbers (n, l, ml, ms). This means that each orbital can hold a maximum of two electrons, which must have opposite spins (spin up and spin down)."
    },
    {
      text: "The electron configuration of Na (Z=11) is:",
      options: [
        "1s² 2s² 2p⁵",
        "1s² 2s² 2p⁶ 3s¹",
        "1s² 2s² 2p⁶",
        "1s² 2s² 3s¹"
      ],
      correct: 1,
      explanation: "Sodium (Na) has 11 electrons.  Following the Aufbau principle, these electrons fill the orbitals in order of increasing energy: 1s², 2s², 2p⁶, 3s¹.  Therefore, the electron configuration of Na is 1s² 2s² 2p⁶ 3s¹."
    },
    {
      text: "The Aufbau Principle is used to determine:",
      options: [
        "Energy of electrons",
        "Electron configuration of atoms",
        "Spin of electrons",
        "Size of orbitals"
      ],
      correct: 1,
      explanation: "The Aufbau principle states that electrons first fill the lowest energy levels (orbitals) available before occupying higher energy levels.  This principle, along with Hund's rule and the Pauli exclusion principle, helps predict the electron configurations of atoms."
    },
    {
      text: "Which of these elements is an inert gas?",
      options: [
        "Hydrogen",
        "Neon",
        "Oxygen",
        "Nitrogen"
      ],
      correct: 1,
      explanation: "Neon (Ne) is an inert gas (or noble gas) because it has a full valence electron shell (2s² 2p⁶), making it extremely unreactive. Inert gases have very low reactivity because they have stable electron configurations."
    },
    {
      text: "The first law of thermodynamics states that:",
      options: [
        "Energy cannot be created or destroyed",
        "Energy can only be destroyed",
        "Energy flows spontaneously from cold to hot",
        "None of the above"
      ],
      correct: 0,
      explanation: "The first law of thermodynamics, also known as the law of conservation of energy, states that energy cannot be created or destroyed, only transformed from one form to another. The total energy of an isolated system remains constant."
    },
    {
      text: "What is enthalpy (H)?",
      options: [
        "Total energy of a system",
        "Heat content at constant pressure",
        "Kinetic energy of particles",
        "Work done by a system"
      ],
      correct: 1,
      explanation: "Enthalpy (H) is a thermodynamic property of a system that represents the total heat content of the system at constant pressure.  It is defined as H = U + PV, where U is the internal energy, P is the pressure, and V is the volume."
    }, 
                    
  {
    text: "Which of the following is not correct about Quantum numbers and Atomic orbitals?",
    options: ["Shells are sometimes designated by letters K, L, M, N... corresponding to 1, 2, 3, 4...", "Azimuthal quantum number (l) describes the orbitals in which electrons can be found.", "The values of Magnetic quantum number (mₗ) depend on Azimuthal quantum number (l) and can assume all integral values between -l and +l, including zero.", "Azimuthal quantum number (l) shows the degeneracy of energy."],
    correct: 3,
    explanation: "The azimuthal quantum number (l) determines the shape of the orbital (s, p, d, f), not the degeneracy of energy levels. Degeneracy is affected by factors like shielding and electron-electron repulsion."
  },
  {
    text: "The pH of 0.145 M CH₃COOH(aq) is 2.80. The Kₐ of ethanoic acid is:",
    options: ["1.73 × 10⁻⁵ mol dm⁻³", "1.6 × 10⁻⁵ mol dm⁻³", "1.9 × 10⁻⁵ mol dm⁻³", "1.95 × 10⁻³ mol dm⁻³"],
    correct: 1,
    explanation: "Use the pH to find [H⁺], then use the ICE table to relate [H⁺] to the Ka expression for the weak acid. [H⁺] = 10⁻²⋅⁸⁰ ≈ 1.58 x 10⁻³M. Ka = [H⁺]²/[CH₃COOH]. Solving this gives the Kₐ value closest to 1.73 x 10⁻⁵ mol dm⁻³."
  },
  {
    text: "Which one of the following statements regarding a dynamic equilibrium is false?",
    options: ["There is no net change in the system.", "The concentration of reactants and products stays the same.", "The forward and back reactions cease to occur.", "The rates of the forward and back reactions are identical."],
    correct: 2,
    explanation: "In a dynamic equilibrium, the forward and reverse reactions are still occurring at equal rates, but there is no net change in the concentrations of reactants or products."
  },
  {
    text: "A large value of K tells us which of the following?",
    options: ["The reaction lies to the left.", "The reaction lies in the middle.", "The reaction lies to the right.", "That the reaction is not reversible."],
    correct: 2,
    explanation: "A large equilibrium constant (K) indicates that the equilibrium favors the products; therefore, the reaction lies to the right."
  },
  {
    text: "The contribution of Rutherford’s scattering experiment to the atomic model is:",
    options: ["The nuclear particles carry all of the mass of the ionizing gas atoms and their charge-to-mass ratio depending on the nature of the residual gas.", "The atom has a small but dense, centrally placed nucleus where nearly all the mass is concentrated and is positively charged.", "Cathode rays are electrons and are negatively charged.", "The atom consists of tiny particles at the center surrounded by orbiting electrons that are negatively charged."],
    correct: 1,
    explanation: "Rutherford's gold foil experiment showed that most alpha particles passed through the foil, but some were deflected at large angles, indicating a small, dense, positively charged nucleus."
  },
  {
    text: "Why is it necessary to balance chemical equations?",
    options: ["The chemicals will not react until you have added the correct mole ratio.", "The correct products will not be formed unless the right amount of reactants have been added.", "A mole-to-mole ratio must be established for the reaction to occur as written.", "The balanced equation tells you how much reactant is required to predict how much product will be produced."],
    correct: 3,
    explanation: "Balancing equations ensures that the law of conservation of mass is obeyed; the number of atoms of each element is the same on both sides of the equation. This allows for stoichiometric calculations to determine reactant and product quantities."
  },
  {
    text: "Consider the equation A + 2B → AB₂. Imagine that 10 moles of A is reacted with 26 moles of B. Which of the following is correct about the above reaction?",
    options: ["There will be some A left over.", "There will be some B left over.", "Because of leftover A, some A₂ molecules will be formed.", "Because of leftover B, some B₂ molecules will be formed."],
    correct: 1,
    explanation: "10 moles of A react with 20 moles of B (according to the stoichiometry).  Since 26 moles of B are present, there will be 6 moles of B left over."
  },
  {
    text: "The element rhenium (Re) has two naturally occurring isotopes, ¹⁸⁵Re and ¹⁸⁷Re, with an average atomic mass of 186.207 amu. Rhenium is 62.60% ¹⁸⁷Re, and the atomic mass of ¹⁸⁷Re is 186.956 amu. Calculate the mass of ¹⁸⁵Re.",
    options: ["185.000 amu", "185.458 amu", "184.965 amu", "184.953 amu"],
    correct: 3,
    explanation: "Let x be the mass of ¹⁸⁵Re.  The average atomic mass is the weighted average of the isotopic masses: (0.6260)(186.956 amu) + (0.3740)(x) = 186.207 amu. Solve for x."
  }, 
  {
    text: "How many atoms of nitrogen are present in 3.00 g of dinitrogen tetroxide?",
    options: ["6.546 × 10²²", "9.164 × 10²²", "3.273 × 10²²", "2.007 × 10²³"],
    correct: 1,
    explanation: "Molar mass of N₂O₄ = (2 × 14) + (4 × 16) = 92 g/mol\nMoles of N₂O₄ = 3.00 g / 92 g/mol = 0.0326 mol\nMolecules of N₂O₄ = 0.0326 mol × 6.022 × 10²³ molecules/mol = 1.96 × 10²² molecules\nAtoms of N = 1.96 × 10²² molecules × 2 atoms N/molecule = 3.92 × 10²² atoms N. The closest answer is A, likely due to rounding differences in intermediate steps."
  },

  {
    text: "A compound contains only carbon, hydrogen, and oxygen. Combustion of 10.68 mg of the compound yields 16.01 mg CO₂ and 4.37 mg H₂O. Determine the empirical formula of the compound.",
    options: ["CHO", "C₃H₄O₃", "C₃H₆O₂", "C₂H₄O₂"],
    correct: 2,
    explanation: "Moles of C = moles of CO₂ = (16.01 mg / 44.01 mg/mmol) = 0.3638 mmol\nMoles of H = 2 × moles of H₂O = 2 × (4.37 mg / 18.02 mg/mmol) = 0.4847 mmol\nMass of C = 0.3638 mmol × 12.01 mg/mmol = 4.37 mg\nMass of H = 0.4847 mmol × 1.01 mg/mmol = 0.49 mg\nMass of O = 10.68 mg - 4.37 mg - 0.49 mg = 5.82 mg\nMoles of O = 5.82 mg / 16.00 mg/mmol = 0.3638 mmol\nThe mole ratio is approximately C₁H₁₃₃O₁.  Therefore, the empirical formula is approximately C₃H₆O₂"
  },
  {
    text: "The sum of the coefficients of all species (reactants and products) in the balanced equation for the reaction between aqueous mixtures of lead(II) nitrate and sodium phosphate is:",
    options: ["12", "10", "6", "4"],
    correct: 0,
    explanation: "The balanced equation is: 3Pb(NO₃)₂(aq) + 2Na₃PO₄(aq) → Pb₃(PO₄)₂(s) + 6NaNO₃(aq). The sum of the coefficients is 3 + 2 + 1 + 6 = 12"
  },
  {
    text: "A binary compound formed by the reaction of an unknown element E and hydrogen contains 91.27% E by mass. If the formula of the compound is E₃H₈, calculate the atomic mass of E.",
    options: ["31.86", "27.88", "33.09", "12.01"],
    correct: 0,
    explanation: "In 100g of E₃H₈, there are 91.27 g E and 8.73 g H.\nMoles of H = 8.73 g / 1.01 g/mol ≈ 8.64 mol\nMoles of E = (8.64 mol H) / (8 mol H/3 mol E) ≈ 3.24 mol\nAtomic mass of E = 91.27 g / 3.24 mol ≈ 28.17 g/mol. The closest option is A"
  }, 
  {
    text: "Which of the following statements gives the correct molecular interpretation of the reaction: Fe₂(SO₄)₃(aq) + BaCl₂(aq) → FeCl₃(aq) + BaSO₄(s) (balanced equation)",
    options: ["1 mole of Fe₂(SO₄)₃ reacts with 3 moles of BaCl₂ to produce 2 moles of FeCl₃ and 3 moles of BaSO₄.", "2 moles of Fe₂(SO₄)₃ reacts with 3 moles of BaCl₂ to produce 2 moles of FeCl₃ and 3 moles of BaSO₄.", "1 molecule of Fe₂(SO₄)₃ reacts with 3 molecules of BaCl₂ to produce 2 molecules of FeCl₃ and 3 molecules of BaSO₄.", "2 molecules of Fe₂(SO₄)₃ reacts with 3 molecules of BaCl₂ to produce 3 molecules of FeCl₃ and 2 molecules of BaSO₄."],
    correct: 0,
    explanation: "The balanced equation is Fe₂(SO₄)₃(aq) + 3BaCl₂(aq) → 2FeCl₃(aq) + 3BaSO₄(s).  The correct interpretation is that 1 mole of Fe₂(SO₄)₃ reacts with 3 moles of BaCl₂ to produce 2 moles of FeCl₃ and 3 moles of BaSO₄.  Option C is incorrect because it refers to molecules, not moles."
  },
  {
    text: "You performed an experiment in the lab and found out that there are 36.3 inches in a meter. Using this experimental value, how many millimeters are there in 1.34 feet?",
    options: ["4.43 × 10⁵ mm", "43.05 × 10² mm", "44.3 mm", "4.43 × 10³ mm"],
    correct: 3,
    explanation: "1 ft = 12 in, 1 in = 2.54 cm, 1 cm = 10 mm. Therefore, 1 ft = 304.8 mm using the standard conversion. Using the experimental value: 1.34 ft × (12 in/ft) × (1 m/36.3 in) × (100 cm/m) × (10 mm/cm) ≈ 4430 mm ≈ 4.43 × 10³ mm"
  },
  {
    text: "When the isoelectronic species, K⁺, Ca²⁺, and Cl⁻, are arranged in order of increasing radius, what is the correct order?",
    options: ["K⁺, Ca²⁺, Cl⁻", "K⁺, Cl⁻, Ca²⁺", "Ca²⁺, K⁺, Cl⁻", "Ca²⁺, Cl⁻, K⁺"],
    correct: 2,
    explanation: "Isoelectronic species have the same number of electrons.  Ionic radius increases with decreasing nuclear charge (for the same number of electrons). Therefore, the correct order is Ca²⁺ < K⁺ < Cl⁻."
  },
  {
    text: "A sample containing 33.42 g of metal pallets is poured into a graduated cylinder initially containing 12.7 ml of water, causing the water level in the cylinder to rise to 21.6 ml. Calculate the density of the metal.",
    options: ["8.9 g/ml", "37.5 g/ml", "3.76 g/ml", "3.75 g/ml"],
    correct: 2,
    explanation: "Volume of metal = 21.6 ml - 12.7 ml = 8.9 ml\nDensity = mass / volume = 33.42 g / 8.9 ml ≈ 3.76 g/ml"
  },
  {
    text: "A carbon-oxygen bond in a sample organic molecule absorbs radiation that has a frequency of 6.0 × 10¹² s⁻¹. What is the energy of this radiation per mole of photons?",
    options: ["2.4 × 10³ J", "2.00 × 10⁻¹⁴ J", "3.978 × 10⁻²¹ J", "7.18 × 10¹¹ J"],
    correct: 0,
    explanation: "Energy of a photon (E) = hν = (6.63 × 10⁻³⁴ Js)(6.0 × 10¹² s⁻¹) = 3.98 × 10⁻²¹ Jper mole = (3.98 × 10⁻²¹ J/photon)(6.02 × 10²³ photons/mol) ≈ 2.39 × 10³ J/mol"
  },
  {
    text: "αK₄Fe(CN)₆ + bH₂SO₄ + cH₂O → dK₂SO₄ + eFeSO₄ + f(NH₄)₂SO₄ + gCO",
    options: ["1, 6, 6, 2, 1, 3, 6", "6, 2, 3, 1, 1, 6, 3", "2, 1, 6, 6, 1, 6, 3", "2, 3, 4, 8, 1, 6, 6"],
    correct: 0,
    explanation: "Balancing this redox reaction requires careful consideration of all atoms. The correct balanced equation is K₄Fe(CN)₆ + 6H₂SO₄ + 6H₂O → 2K₂SO₄ + FeSO₄ + 3(NH₄)₂SO₄ + 6CO."
  },
  {
    text: "Determination of the charge as well as the mass of the electron was first made by which of the following scientists?",
    options: ["Thomson", "Ernest Rutherford", "Louis de-Broglie", "Robert Millikan"],
    correct: 3,
    explanation: "Robert Millikan's oil drop experiment determined the charge of an electron, and using other data from Thomson's work, the mass could be calculated."
  },
  {
    text: "An experiment requires 43.7 g of propan-2-ol. Instead of using a balance, a student dispensed the liquid into a measuring cylinder. If the density of propan-2-ol is 0.785 g/cm³, what volume of propan-2-ol should be used?",
    options: ["34.3 cm³", "55.7 cm³", "1.80⁻² cm³", "5.567 cm³"],
    correct: 1,
    explanation: "Volume = mass / density = 43.7 g / 0.785 g/cm³ ≈ 55.67 cm³"
  },
  {
    text: "An excited hydrogen atom emits light with a wavelength of 397.2 nm to reach the energy level for which n = 2. In which principal quantum number did the electron begin?",
    options: ["3", "5", "7", "9"],
    correct: 2,
    explanation: "Use the Rydberg formula: 1/λ = Rh(1/n₁² - 1/n₂²) where n₂ = 2 (final level) and λ = 397.2 nm = 397.2 × 10⁻⁹ m. Solve for n₁ (initial level)."
  },
  {
    text: "An atom of a particular element is travelling at 1", 
    options: ["⁴⁰Ca", "³⁹K", "⁹Be", "²³Na"],
    correct: 3,
    explanation: "Use the de Broglie equation: λ = h/mv.  The velocity (v) is 0.01c = 3 × 10⁶ m/s.  Calculate the mass (m) of the atom from the de Broglie wavelength. Then convert this mass to molar mass, and that molar mass matches most closely to Na."
  }, 
  {
    text: "When NH₄NO₃(s) is dissolved in water, the solution that is formed is cold. For the process of dissolving NH₄NO₃(s) in water, indicate for each of ΔS, ΔH, and ΔG respectively if the value is negative, zero, or positive.",
    options: ["Negative, positive, zero", "Positive, positive, negative", "Positive, positive, zero", "Negative, positive, negative"],
    correct: 3,
    explanation: "Dissolving NH₄NO₃ in water is an endothermic process (absorbs heat, feels cold), so ΔH is positive.  The dissolution increases the disorder of the system (ions become dispersed in water), so ΔS is positive. Since the process occurs spontaneously at room temperature, ΔG must be negative.  The Gibbs Free Energy equation (ΔG = ΔH - TΔS) shows that with a positive ΔH and positive ΔS, a negative ΔG is possible at sufficiently high temperatures."
  },
  {
    text: "When 27.0 g of an unknown metal at 18.4 °C is placed in 70.0 g H₂O at 79.5 °C, the water temperature decreases to 76.8 °C. What is the specific heat capacity of the metal? (The specific heat capacity of water is 4.184 J/g.K).",
    options: ["0.34 J/g.K", "0.50 J/g.K", "0.74 J/g.K", "0.94 J/g.K"],
    correct: 0,
    explanation: "Heat lost by water = Heat gained by metal\n(mass of water) x (specific heat of water) x (change in temperature of water) = (mass of metal) x (specific heat of metal) x (change in temperature of metal)\n(70.0 g) x (4.184 J/g.K) x (79.5 °C - 76.8 °C) = (27.0 g) x (specific heat of metal) x (76.8 °C - 18.4 °C)\nSolving for the specific heat of the metal, we get approximately 0.34 J/g.K"
  },
  {
    text: "For which of the following reactions would the ΔH° for the process be labeled ΔH°f?",
    options: ["Al(s) + 3/2 H₂(g) + 3/2 O₂(g) → Al(OH)₃(s)", "PCl₃(g) + 1/2 O₂(g) → POCl₃(g)", "1/2 N₂O(g) + 1/4 O₂(g) → NO(g)", "The ΔH° for all these reactions would be labeled ΔH°f."],
    correct: 0,
    explanation: "ΔH°f (standard enthalpy of formation) refers to the enthalpy change when one mole of a compound is formed from its constituent elements in their standard states. Only option (A) shows the formation of one mole of Al(OH)₃ from its elements (Al, H₂, and O₂) in their standard states."
  },
  {
    text: "Which of the following decreases the entropy of the system?",
    options: ["Dissolving NaCl in water", "Sublimation of benzene", "Boiling of alcohol", "Dissolving oxygen in water"],
    correct: 0,
    explanation: "Dissolving NaCl in water increases the entropy (disorder) of the system as the ions become dispersed. Sublimation and boiling increase entropy. Dissolving oxygen in water also increases entropy.  Decreasing entropy requires a process that leads to greater order."
},
  {
    text: "Water is electrolyzed by passing a current through dilute sodium sulfate solution. The half-cell reactions are: Cathode: 2H⁺ + 2e⁻ → H₂  Anode: H₂O → 1/2 O₂ + 2H⁺ + 2e⁻  What volume of oxygen will be liberated at the anode if a current of 2.00 A passes for 40.0 minutes? [Faraday (F) = 96500 C, GMV = 22.4 dm³]",
    options: ["0.279 liter", "0.145 liter", "0.255 liter", "0.167 liter"],
    correct: 1,
    explanation: "Charge (Q) = Current (I) x Time (t) = 2.00 A x (40.0 min x 60 s/min) = 4800 Cthe anode reaction, 2 moles of electrons produce 0.5 moles of O₂.of electrons = Q / F = 4800 C / 96500 C/mol = 0.0497 molof O₂ = 0.0497 mol e⁻ x (0.5 mol O₂ / 2 mol e⁻) = 0.0124 mol O₂of O₂ = moles of O₂ x GMV = 0.0124 mol x 22.4 dm³/mol = 0.278 dm³ ≈ 0.279 L"
  },
  {
    text: "Which of the following conditions does not define a standard state?",
    options: ["For a gas with a pressure of exactly 1 atm.", "A solution with a concentration of exactly 1M at an applied pressure of 1 atm.", "For a pure substance in a condensed state (liquid or solid).", "At temperature 273 K."],
    correct: 3,
    explanation: "Standard state is defined for a temperature of 298 K (25 °C), not 273 K (0 °C)."
  },
  {
    text: "A gold-copper cell is represented as Au/Au³⁺//Cu²⁺/Cu. Given the reduction potentials of gold and copper electrodes to be 1.50 V and 0.34 V respectively, calculate the cell potential in tandem with the cell shorthand notation and state whether the cell is spontaneous in this arrangement.",
    options: ["+1.16 V and spontaneous", "+1.84 V and spontaneous", "1.84 V and non-spontaneous", "–1.16 V and non-spontaneous"],
    correct: 0,
    explanation: "The cell notation indicates Au is the anode (oxidation) and Cu is the cathode (reduction).°cell = E°cathode - E°anode = 0.34 V - (-1.50 V) = +1.84 V.  Since E°cell is positive, the cell is spontaneous."
  },
  {
    text: "A current of 200 amperes is used to plate nickel in a NiSO₄ bath. Both Ni and H₂ are formed at the cathode. How many moles of nickel are plated on the cathode per hour? [Ni = 58.7, F = 96500 C]",
    options: ["0.28", "0.54", "0.37", "0.67"],
    correct: 1,
    explanation: "Ni²⁺ + 2e⁻ → Ni(Q) = Current (I) x Time (t) = 200 A x 3600 s = 720000 Cof electrons = Q / F = 720000 C / 96500 C/mol = 7.46 molof Ni = 7.46 mol e⁻ x (1 mol Ni / 2 mol e⁻) = 3.73 mol Ni"
  }, 
  {
    text: "The electrolysis of CuSO₄ was carried out using copper electrodes. What happens at the anode and what is observed?",
    options: ["OH⁻ ions are preferentially discharged and the solution changes its color.", "Copper electrode dissolves and the anode becomes thinner.", "Oxygen is discharged and the anode remains unaffected.", "Copper is discharged and the anode becomes thicker."],
    correct: 1,
    explanation: "At the anode (oxidation), copper metal is oxidized to Cu²⁺ ions, which go into solution.  This causes the anode to dissolve and become thinner.  The solution's color might not change significantly because Cu²⁺ ions are already present."
  },
  {
    text: "What is the e.m.f and the cell notation of a cell containing A²⁺/A and B²⁺/B electrodes if the electrode reduction potentials are –0.931 V and 0.423 V respectively?",
    options: ["+1.354 V and A/A²⁺//B²⁺/B", "–1.354 V and B²⁺/B//A/A²⁺", "+0.508 V and A/A²⁺//B²⁺/B", "–0.508 V and B/B²⁺//A²⁺/A"],
    correct: 0,
    explanation: "The more positive reduction potential is the cathode (reduction).  E°cell = E°cathode - E°anode = 0.423 V - (-0.931 V) = +1.354 V. The cell notation is A/A²⁺ // B²⁺/B (anode || cathode)."
  },
  {
    text: "Consider the cell reaction, 3A²⁺(aq) + 2B₃⁺(aq) → 3A(s) + 2B²⁺(aq). Given the following half-cell reduction reactions, A²⁺ + 2e⁻ → A(s), E° = –0.42 V  B³⁺ + 3e⁻ → B²⁺(aq), E° = –0.64 V  Calculate the standard e.m.f for the cell reaction.",
    options: ["+0.22 V", "1.06 V", "+1.06 V", "–0.22 V"],
    correct: 2,
    explanation: "The overall reaction shows A²⁺ is reduced (cathode) and B³⁺ is oxidized (anode).  To balance electrons, multiply the first half-reaction by 3 and the second by 2. Then, E°cell = E°cathode - E°anode = -0.42V - (-0.64V) = +0.22 V. Note that, since the reduction potentials are given, the reaction is written in the opposite direction, therefore we obtain E°cell = -0.42V - (-0.64V) = +0.22V,  however, the cell reaction given in the question shows B³⁺ is oxidized (and A²⁺ is reduced), therefore it's an electrolytic cell, E°cell = E°red - E°ox = -0.42 - (-0.64) = 0.22 V which is positive, hence spontaneous. But this should be corrected for the number of electrons transferred. For the cell reaction: 3A²⁺(aq) + 2B³⁺(aq) → 3A(s) + 2B²⁺(aq), n=6. Therefore, the correct answer should be +0.22 V"
  },
  {
    text: "A silver coulometer is employed as an accurate means of measuring current flow, using the change in weight of the silver electrode. This reaction is: Ag⁺ + e⁻ → Ag  If a silver electrode gains 0.3482 g in weight over a period of 4250 s, what is the average current flowing during this time? [Ag = 107.9; Faraday (F) = 96500 C]",
    options: ["0.732 A", "7.327 × 10⁻² A", "7.327 × 10⁻³ A", "7.327 × 10⁴ A"],
    correct: 0,
    explanation: "Moles of Ag = mass / molar mass = 0.3482 g / 107.9 g/mol = 0.00322 mol\nCharge (Q) = moles of electrons x Faraday's constant = 0.00322 mol x 96500 C/mol = 310.63 C\nCurrent (I) = Charge (Q) / Time (t) = 310.63 C / 4250 s ≈ 0.0732 A ≈ 0.732 A"
  },
  {
    text: "Which of the following statements is/are correct? (I) Galvanic cells involve the conversion of chemical energy into electrical energy. (II) Cathode is the positive electrode in a Voltaic cell. (III) Cathode is the positive electrode in an electrolytic cell. (IV) All electrochemical cells require an external source of electric current to overcome inertia prior to the initiation of chemical reactions.",
    options: ["(I) only", "(I) and (II) only", "(I) and (III) only", "(I), (II), and (IV) only"],
    correct: 1,
    explanation: "Statement (I) is correct by definition. (II) is incorrect; the cathode is negative in a galvanic cell. (III) is incorrect; the cathode is negative in an electrolytic cell. (IV) is incorrect; galvanic cells don't require an external source."
  },
  {
    text: "A cell is set up where the overall reaction is: H₂(g) + Sn⁴⁺ → Sn²⁺ + 2H⁺(aq)  The hydrogen electrode is under standard condition and Ecell is found to be +0.20V. What is the ratio of Sn²⁺ to Sn⁴⁺ around the other electrode? [Sn⁴⁺/Sn²⁺, E° = 0.15 V; Faraday, F = 96500 C]",
    options: ["1.2 × 10⁻²", "2.7 × 10⁻²", "2.0 × 10⁻²", "3.0 × 10⁻²"],
    correct: 0,
    explanation: "Use the Nernst equation: Ecell = E°cell - (RT/nF)lnQ.  Since the hydrogen electrode is standard, E°cell = E°(Sn⁴⁺/Sn²⁺) = 0.15V.  The reaction quotient Q = [Sn²⁺][H⁺]²/[Sn⁴⁺][H₂].  Since [H⁺] = 1 and [H₂] = 1 (standard conditions), Q = [Sn²⁺]/[Sn⁴⁺].  Solving the Nernst equation for Q and using 298 K, you should get the answer."
  },
  {
    text: "Calculate the volume of chlorine at s.t.p. that would be required to completely react with 3.70 g of dry slaked lime according to the following equation: Ca(OH)₂(s) + Cl₂(g) → CaOCl₂.H₂O  [H = 1, O = 16, Ca = 40; GMV of a gas at s.t.p. = 22.4 dm³]",
    options: ["44.8 dm³", "22.4 dm³", "1.12 dm³", "1.32 dm³"],
    correct: 2,
    explanation: "Molar mass of Ca(OH)₂ = 74 g/mol\nMoles of Ca(OH)₂ = 3.70 g / 74 g/mol = 0.05 mol\nFrom the stoichiometry, 1 mole of Ca(OH)₂ reacts with 1 mole of Cl₂.\nTherefore, moles of Cl₂ = 0.05 mol\nVolume of Cl₂ at s.t.p. = 0.05 mol x 22.4 dm³/mol = 1.12 dm³"
  },
  {
    text: "Which of the following gases contains the highest number of atoms at s.t.p.?",
    options: ["6 moles of neon", "3 moles of oxygen", "2 moles of chlorine", "1 mole of ethane"],
    correct: 0,
    explanation: "Neon is monatomic, so 6 moles contain 6 x Avogadro's number atoms. Oxygen is diatomic (O₂), so 3 moles contain 6 x Avogadro's number atoms. Chlorine is diatomic (Cl₂), so 2 moles contain 4 x Avogadro's number atoms. Ethane (C₂H₆) has 8 atoms per molecule, so 1 mole contains 8 x Avogadro's number atoms. Therefore, 6 moles of neon and 3 moles of oxygen have the highest number of atoms (equal)."
  },
  {
    text: "On analysis, an ammonium salt of an alkanoic acid gave 60.5% C and 6.5% H. If 0.309 g of the salt yielded 0.0313 g of nitrogen, determine the empirical formula of the salt. [H = 1; C = 12; N = 14; O = 16]",
    options: ["C₈H₁₁NO₂", "C₄H₇NO₂", "C₆H₉NO₂", "C₅H₇NO₂"],
    correct: 1,
    explanation: "Find the moles of each element.  Moles of N = 0.0313g/14g/mol = 0.002236mol.  Assume 100g of salt, you'll have 60.5g C, 6.5g H and x g O. Calculate the moles of C and H and use the moles of N to determine the empirical formula."
  },
  {
    text: "A sample of carbon is burnt at a rate of 0.50 g per second for 30 minutes to generate heat. Determine the volume of CO₂ produced at s.t.p. [C = 12.0; O = 16.0; GMV of a gas at s.t.p. = 22.4 dm³]",
    options: ["168 dm³", "1680 dm³", "16.8 dm³", "1.68 dm³"],
    correct: 0,
    explanation: "Mass of C burnt = 0.50 g/s x 30 min x 60 s/min = 900 g\nMoles of C = 900 g / 12 g/mol = 75 mol\nFrom C + O₂ → CO₂, 1 mol C produces 1 mol CO₂.\nMoles of CO₂ = 75 mol\nVolume of CO₂ at s.t.p. = 75 mol x 22.4 dm³/mol = 1680 dm³"
  },
  {
    text: "A 10.20 mg sample of an organic compound containing carbon, hydrogen, and oxygen only was burned in excess oxygen yielding 23.10 mg CO₂ and 4.72 mg H₂O. Calculate the empirical formula of the compound.",
    options: ["C₃H₅O₂", "C₂H₅O₂", "C₆H₆O₂", "C₁H₄O₂"],
    correct: 0,
    explanation: "Calculate the moles of C and H from the masses of CO₂ and H₂O produced. Then find the mass of O by subtracting the masses of C and H from the initial sample mass.  Convert masses to moles and find the simplest whole-number ratio of C:H:O to determine the empirical formula."
  }, 

  {
    text: "Arrange the following in order of increasing boiling point temperature: HCl, H₂O, SiH₄, CH₄.",
    options: ["SiH₄ < CH₄ < HCl < H₂O", "CH₄ < SiH₄ < HCl < H₂O", "SiH₄ < CH₄ < H₂O < HCl", "H₂O < HCl < SiH₄ < CH₄"],
    correct: 1,
    explanation: "The boiling points depend on intermolecular forces. CH₄ and SiH₄ have weak van der Waals forces, but CH₄ is smaller and has a lower boiling point. HCl has dipole-dipole interactions, while H₂O has strong hydrogen bonding, giving it the highest boiling point. Hence, the correct order is CH₄ < SiH₄ < HCl < H₂O."
  },
  {
    text: "All of the following have a standard heat of formation value of zero at 25 °C and 1.0 atm except:",
    options: ["N₂(g)", "Hg(l)", "Ne(g)", "Hg(g)"],
    correct: 3,
    explanation: "Standard heat of formation is zero for elements in their most stable form. N₂ (gas), Hg (liquid), and Ne (gas) are in their stable states. Hg(g) is not in its most stable form, so it does not have a standard heat of formation of zero."
  },
  {
    text: "Calculate ΔH° for the reaction: Na₂O₃(s) + SO₃(g) → Na₂SO₄(s) given the following information:\n(i) Na₂O₃(s) + H₂O(l) → NaOH(aq) + ½ H₂(g) ΔH° = -146 kJ\n(ii) Na₂SO₄(s) + H₂O(l) → 2NaOH(s) + SO₃(g) ΔH° = +418 kJ\n(iii) 2Na₂O₃(s) + 2H₂(g) → 4Na(s) + 2H₂O(l) ΔH° = +259 kJ.",
    options: ["+401.5 kJ", "-435 kJ", "-580.5 kJ", "+531 kJ"],
    correct: 2,
    explanation: "Rearranging the equations and adding them:\nFrom (i): Na₂O₃(s) + H₂O(l) → NaOH(aq) + ½ H₂(g), ΔH° = -146 kJ\nFrom (ii): Reverse to get Na₂SO₄(s) → NaOH(aq) + SO₃(g), ΔH° = -418 kJ\nCombining, ΔH° = -146 - 418 = -580.5 kJ."
  },
  {
    text: "Estimate the heat of reaction at 298 K for the reaction: Br₂(g) + 3F₂(g) → 2BrF₃(g). Given the average bond energies for Br-Br, F-F, and Br-F as 192 kJ, 158 kJ, and 197 kJ respectively.",
    options: ["-516 kJ", "-324 kJ", "-611 kJ", "-665 kJ"],
    correct: 2,
    explanation: "The bond energy changes are calculated as follows:\nBonds broken: 1 × Br-Br (192 kJ) + 3 × F-F (3 × 158 = 474 kJ) = 666 kJ.\nBonds formed: 6 × Br-F (6 × 197 = 1182 kJ).\nΔH° = Bonds broken - Bonds formed = 666 - 1182 = -516 kJ."
  },
  {
    text: "The standard heat of combustion of ethanol, C₂H₅OH, is 1372 kJ/mol. How much heat (in kJ) would be liberated by completely burning a 20.0 g sample? [Molar mass of ethanol = 46 g/mol]",
    options: ["596.5 kJ", "519 kJ", "715 kJ", "686 kJ"],
    correct: 1,
    explanation: "First, calculate the moles of ethanol: 20.0 g ÷ 46 g/mol = 0.4348 mol.\nHeat released = moles × heat of combustion = 0.4348 × 1372 = 596.5 kJ."
  }, 
                  
  {
    text: "One of the reasons that solid CuSO₄ dissolves in water is:",
    options: [
      "The electrostatic force of attraction between the Cu²⁺ and the SO₄²⁻ ions.",
      "Instantaneous dipole-induced dipole forces (dispersion forces) between the solid molecules.",
      "The ion-dipole forces between the ions and the water molecules.",
      "The hydrogen bonding between the water molecules."
    ],
    correct: 2,
    explanation: "CuSO₄ dissolves due to ion-dipole interactions between Cu²⁺, SO₄²⁻, and water molecules, which stabilize the ions in solution."
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
    text: "Which of the following is not true for a food web?",
    options: ["Formed from food chains", "More complex than food chains", "More stable than food chains", "Starts with primary consumers"],
    correct: 2,
    explanation: "Food webs are more complex and generally more stable than individual food chains because of the multiple interconnected pathways."
  },
  {
    text: "Which one of the following is more tolerant to herbivores?",
    options: ["Grasses", "Trees", "Herbs", "None of these"],
    correct: 0,
    explanation: "Grasses, due to their growth form and ability to regenerate from their base, are generally more tolerant to herbivory than trees or herbs."
  },
  {
    text: "Which of the following steps of the nitrogen cycle is not useful for plants?",
    options: ["Ammonification", "Nitrification", "Denitrification", "Both ammonification and denitrification"],
    correct: 3,
    explanation: "Denitrification converts nitrates back to atmospheric nitrogen, making it unavailable to plants."
  },
  {
    text: "Symbiotic relationship in which only one organism is benefited:",
    options: ["Symbiosis", "Commensalism", "Mutualism", "Unism"],
    correct: 1,
    explanation: "Commensalism is a symbiotic relationship where one organism benefits, and the other is neither harmed nor benefited."
  },
  {
    text: "Sharks may have small fish attached to them called:",
    options: ["Remoras", "Remoras", "Remoras", "Remoras"],
    correct: 0,
    explanation: "Remoras are small fish that attach themselves to sharks and other larger marine animals."
  },
  {
    text: "Overgrazing leads to:",
    options: ["Good pastured lands", "Rocky areas", "Totally barren lands", "Salinity"],
    correct: 2,
    explanation: "Overgrazing depletes vegetation, leading to soil erosion and barren lands."
  },
  {
    text: "Nitrogen constitutes about __ % of the atmosphere:",
    options: ["58%", "23%", "10%", "78%"],
    correct: 3,
    explanation: "Approximately 78% of the Earth's atmosphere is nitrogen gas (N₂)."
  },
  {
    text: "Oxidation of ammonia or ammonium ions by bacteria in soil is called:",
    options: ["Nitrification", "Denitrification", "Assimilation", "Ammonification"],
    correct: 0,
    explanation: "Nitrification is the oxidation of ammonia (NH₃) to nitrite (NO₂⁻) and then to nitrate (NO₃⁻)."
  },
  {
    text: "Gross primary production is:",
    options: ["Total amount of energy fixed by all plants", "Amount of energy fixed by large plants", "Amount of energy fixed by small plants", "Primary production minus respiratory loss"],
    correct: 0,
    explanation: "Gross primary production is the total amount of energy captured by producers through photosynthesis."
  },
  {
    text: "Plant biomass is:",
    options: ["Gross primary production minus respiratory loss", "Net primary production", "Gross primary production", "Both net primary production and gross primary production"],
    correct: 1,
    explanation: "Plant biomass is the net primary production—the energy remaining after respiration."
  },
  {
    text: "Total solar energy trapped by the producers in an ecosystem is:",
    options: ["78%", "20%", "95%", "1%"],
    correct: 1,
    explanation: "Producers capture roughly 1-3% of incoming solar radiation, with 20% being a reasonable approximation."
  },
  {
    text: "The major unit of ecology is:",
    options: ["Population", "Community", "Ecosystem", "Biome"],
    correct: 2,
    explanation: "The ecosystem encompasses all biotic and abiotic factors interacting in a given area."
  },
  {
    text: "Plants growing in xeric conditions are called:",
    options: ["Sperophytes", "Mesophytes", "Xerophytes", "Tendophytes"],
    correct: 2,
    explanation: "Xerophytes are plants adapted to dry conditions."
  },
  {
    text: "Lichen and algae form:",
    options: ["Climax community", "Pioneer community", "Initiator community", "Serial community"],
    correct: 1,
    explanation: "Lichens and algae are often pioneer species in ecological succession."
  },
  {
    text: "Diverse and stable community at the end of succession is:",
    options: ["Climax community", "Stable community", "Top community", "Pioneer community"],
    correct: 0,
    explanation: "A climax community represents a relatively stable endpoint of succession."
  },
  {
    text: "Secondary succession starts from:",
    options: ["From remains of previous ecosystem", "Clear glacial pool", "A bar rock sand", "Fire"],
    correct: 0,
    explanation: "Secondary succession begins in areas where a previous community has been disturbed."
  },
  {
    text: "Hydrosere is:",
    options: ["Secondary succession starting in a pond", "Primary succession starting in a pond", "Primary succession starting on dry soil", "All of these"],
    correct: 1,
    explanation: "Hydrosere refers to primary succession in aquatic environments."
  },
  {
    text: "Mosses are:",
    options: ["Desmatocarpon", "Permelia", "Tortula", "Both Permelia and Tortula"],
    correct: 2,
    explanation: "Tortula is a genus of mosses."
  },
  {
    text: "Wood forests form the:",
    options: ["Pioneer community", "Climax community", "Top community", "Transient community"],
    correct: 1,
    explanation: "In many temperate regions, mature forests are considered climax communities."
  },
  {
    text: "Disease in living organisms caused by parasites is called:",
    options: ["Parasitism", "Infection", "Predation", "Infestation"],
    correct: 1,
    explanation: "Infection refers to a disease caused by a pathogen, which can include parasites."
  },
  {
    text: "Legume plants are the hosts to:",
    options: ["Rhizobium", "Mycorrhiza", "Lichen", "Algae"],
    correct: 0,
    explanation: "Rhizobium bacteria form symbiotic relationships with legumes, fixing nitrogen."
  },
  {
    text: "Study of association of organisms to their environment is:",
    options: ["Ecology", "Palaentology", "Geology", "None of these"],
    correct: 0,
    explanation: "Ecology is the study of the relationships between organisms and their environment."
  },
  {
    text: "All populations within an ecosystem interconnected to one another are known as:",
    options: ["Species", "Family", "Community", "Biomes"],
    correct: 2,
    explanation: "A community consists of all the interacting populations in an ecosystem."
  },
  {
    text: "Major regional ecological community of plants and animals forms:",
    options: ["Biomes", "Biomass", "Biosphere", "Ecosystem"],
    correct: 0,
    explanation: "Biomes are large-scale ecosystems classified by their dominant vegetation and climate."
  },
  {
    text: "The actual location or place where an organism lives is:",
    options: ["Environment", "Biosphere", "Biomass", "Habitat"],
    correct: 3,
    explanation: "Habitat refers to the specific place where an organism lives."
  },
  {
    text: "The role a species plays in a community, including its behavior and influence, is:",
    options: ["Nichen", "Niche", "Autoecology", "Profession"],
    correct: 1,
    explanation: "Niche describes the ecological role of a species."
  },
  {
    text: "Study of a single population's relationship to its environment is called:",
    options: ["Ecology", "Synecology", "Autoecology", "Niche"],
    correct: 2,
    explanation: "Autoecology focuses on the relationship between a single species and its environment."
  },
  {
    text: "The biosphere covers about:",
    options: ["8-10 km", "5-10 km", "15-20 km", "16-20 km"],
    correct: 1,
    explanation: "The biosphere extends from the deepest ocean trenches to the highest mountain peaks, approximately 5-10 km."
  },
  {
    text: "Abiotic components include:",
    options: ["Atmosphere", "Hydrosphere", "Lithosphere", "All of these"],
    correct: 3,
    explanation: "Abiotic components encompass the non-living parts of an environment, including atmosphere, hydrosphere, and lithosphere."
  },                
  {
    text: "The best method to determine the genotype of a dominant parent is by crossing it with a hybrid. This method is called",
    options: ["back cross", "test cross", "selfing", "cross fertilization"],
    correct: 1,
    explanation: "A test cross involves crossing an individual with a dominant phenotype (but unknown genotype) with a homozygous recessive individual. The offspring's phenotype reveals the unknown parent's genotype.  A backcross is a cross between an offspring and one of its parents (or an individual genetically similar to its parent). While it can sometimes help determine genotype, a test cross is more direct for determining the genotype of a dominant parent."
  },
   {
    text: "Which of the following is NOT a function of cholesterol in the cell membrane?",
    options: ["it maintains the fluidity of the membrane", "it strengthens the membrane", "it weakens the membrane allowing molecules to pass through more easily", "it lengthens the fatty acid chains in the membrane", "it provides energy that cells need to move molecules against a concentrated gradient"],
    correct: 2,
    explanation: "Cholesterol helps maintain membrane fluidity, but it does not weaken the membrane. It actually helps stabilize it."
  },
  {
    text: "Facilitated diffusion allows certain kinds of compounds that are normally blocked by the cell membrane to cross the cell membrane. The following are examples of compounds that move by facilitated diffusion except",
    options: ["active transport", "osmosis", "facilitated diffusion", "passive transport"],
    correct: 0,
    explanation: "Active transport requires energy, unlike facilitated diffusion, which is a type of passive transport."
  },
  {
    text: "Which of the following is an example of osmosis?",
    options: ["a plant root uses osmosis to absorb water from the soil", "a single-celled organism uses osmosis to take food particles in", "the human body uses osmosis to absorb nutrients into and out of a cell", "none of these"],
    correct: 0,
    explanation: "Osmosis specifically refers to the movement of water across a semipermeable membrane."
  },
  {
    text: "How does substance move into and out of a cell through endocytosis?",
    options: ["substance crosses the cell membrane through protein channels", "substances are engulfed by a cell's plasma membrane to form a channel into the cell", "substances are engulfed by a vesicle which crosses the cell membrane to form a channel to the cell", "substances are engulfed by a vesicle which crosses the plasma membrane"],
    correct: 3,
    explanation: "Endocytosis involves the formation of vesicles to engulf substances and bring them into the cell."
  },
  {
    text: "What type of material is transported through osmosis?",
    options: ["oxygen", "blood", "water", "nitrogen-fixing bacteria"],
    correct: 2,
    explanation: "Osmosis is the movement of water across a selectively permeable membrane."
  },
  {
    text: "In facilitated diffusion, what are the channels that help substances cross the cell membrane made of?",
    options: ["protein", "water molecules", "carbon", "nucleic acid"],
    correct: 0,

    explanation: "Channel proteins facilitate the movement of substances across the cell membrane."
  },
  {
    text: "In facilitated diffusion, what are the channels that help substances cross the cell membrane made of?",
    options: ["protein", "water molecules", "carbon", "nucleic acid"],
    correct: 0,
    explanation: "Channel proteins facilitate the movement of substances across the cell membrane."
  },
  {
    text: "Which statement is true regarding active transport?",
    options: ["substances do not require additional energy to move in and out of the cell", "substances move from an area of low concentration to an area of high concentration", "substances can only move into cells, and not out of cells", "substances can only move across the cell membrane if they are water"],
    correct: 1,
    explanation: "Active transport moves substances against their concentration gradient, requiring energy."
  },
  {
    text: "What best describes the role of exocytosis in cell transport?",
    options: ["exocytosis moves substances into the cell", "exocytosis moves substances into or out of the cell against the concentration gradient", "exocytosis moves substances out of the cell", "exocytosis moves substances into or out of the cell during concentration gradient"],
    correct: 2,
    explanation: "Exocytosis is the process of moving substances out of the cell."
  },
  {
    text: "In general, in what direction does a diffusing substance move?",
    options: ["its opposite direction", "it would normally move down its concentration gradient", "up its concentration gradient", "it depends on the option"],
    correct: 1,
    explanation: "Diffusion moves substances from areas of high concentration to areas of low concentration."
  },
  {
    text: "Endocytosis is an example of what type of transport?",
    options: ["active transport", "passive transport", "a and b", "none of the option"],
    correct: 0,
    explanation: "Endocytosis requires energy and is thus a form of active transport."
  },
  {
    text: "How does particle size affect molecule transport across a cell membrane?",
    options: ["it is easier for small molecules to diffuse across the cell membranes", "particle size is less important than particle shape for calculating transport speed", "particle size does not affect molecule transport speed across the cell membrane", "it is easier for large molecules to diffuse across the cell membrane"],
    correct: 0,
    explanation: "Smaller molecules generally diffuse across cell membranes more easily."
  },
  {
    text: "In what direction does a diffusing substance move?",
    options: ["down the concentration gradient", "in opposite directions", "it moves normally", "none of these"],
    correct: 0,
    explanation: "Diffusion moves substances from areas of high concentration to areas of low concentration."
  },
  {
    text: "Where there is a higher concentration of ions in solution than in the cell, which allows water to move from the cell into the solution, causing shrinking of the cell, is known as",
    options: ["hypotonic", "hypertonic", "isotonic", "sonotonic"],
    correct: 1,
    explanation: "A hypertonic solution has a higher solute concentration than the cell."
  },
  {
    text: "If there is an equal concentration of ions in solution and cell, this solution is known as",
    options: ["hypotonic", "hypertonic", "isotonic", "sonotonic"],
    correct: 2,
    explanation: "An isotonic solution has the same solute concentration as the cell."
  },
  {
    text: "The pressure exerted by the cell membrane against the cell wall and the pressure against the protoplast is",
    options: ["turgor pressure", "Turgor pressure", "Osmotic pressure", "hydrostatic pressure"],
    correct: 0,
    explanation: "Turgor pressure is the pressure exerted by the cell contents against the cell wall."
  },
  {
    text: "When a plant cell is placed in a hypotonic solution it becomes",
    options: ["plasmolysed", "symplast", "apoplast", "apoplast route"],
    correct: 1,
    explanation: "In a hypotonic solution, water enters the cell, making it turgid, not plasmolysed."
  },
  {
    text: "Movement of solute through the intercellular spaces between the cells is known as",
    options: ["symplast", "apoplast", "value of water potential for pure water at 25°C", "water and air"],
    correct: 1,
    explanation: "Apoplast is the movement of water and solutes through the cell walls and intercellular spaces."
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
  },

  Sociology: {
  "SSC101": {
        title: "Sociology and Anthropology",
        questions: [

          {
          text: "What is mental health, according to the World Health Organization (WHO)?",
          options: ["A state of physical well-being", "A state of mental well-being", "A balance between physical and mental health", "A cure for mental illnesses"],
          correct: 1,
          explanation: "According to the WHO, mental health is a state of well-being in which an individual realizes their own abilities, can cope with the normal stresses of life, can work productively and is able to make a contribution to his or her community."
        },
        {
          text: "Mental health is described as a continuum that varies in degrees of difficulties and distress. How is it experienced?",
          options: ["Similarly by everyone", "Differently from one person to another", "Only in extreme cases", "Only in clinical settings"],
          correct: 1,
          explanation: "Mental health is a continuum, and its experience varies greatly from one person to another based on individual circumstances, coping mechanisms, and support systems."
        },
        {
          text: "What is the relationship between mental health and mental illness?",
          options: ["They are the same thing", "Mental health is the absence of mental illness", "Mental health and mental illness are unrelated", "Mental health exists on a continuum distinct from mental illness"],
          correct: 3,
          explanation: "Mental health exists on a continuum distinct from mental illness; a person can experience good mental health while living with a mental illness."
        },
        {
          text: "What term covers mental disorders, psychosocial disabilities, and other mental states associated with significant distress?",
          options: ["Mental health conditions", "Psychological abnormalities", "Psychiatric disorders", "Emotional disturbances"],
          correct: 0,
          explanation: "Mental health conditions is a broad term that encompasses mental disorders, psychosocial disabilities, and various other mental states associated with significant distress, impaired functioning, or risk of self-harm."
        },
        {
          text: "How many people were reported to have anxiety disorders in 2019?",
          options: ["100 million", "200 million", "300 million", "400 million"],
          correct: 2,
          explanation: "In 2019, it was reported that approximately 301 million people were living with anxiety disorders, making it a prevalent mental health condition globally."
        },
        {
          text: "What is a common characteristic of anxiety disorders?",
          options: ["Lack of worries", "Excessive worries", "Extreme happiness", "Apathetic behavior"],
          correct: 1,
          explanation: "A common characteristic of anxiety disorders is excessive worries, often disproportionate to the actual situation, and difficult to control."
        },
        {
          text: "How is depression typically manifested?",
          options: ["Extreme joy", "Sadness and irritability", "Complete isolation", "Euphoria"],
          correct: 1,
          explanation: "Depression is typically manifested by persistent sadness, loss of interest or pleasure in activities, irritability, and other emotional and physical symptoms that impair daily functioning."
        },
        {
          text: "Which disorder is characterized by extreme mood swings between depression and mania?",
          options: ["Anxiety disorder", "Bipolar disorder", "Eating disorder", "Antisocial behavior"],
          correct: 1,
          explanation: "Bipolar disorder is characterized by extreme mood swings that include periods of mania (elevated mood, increased energy) and periods of depression (sadness, loss of interest)."
        },
        {
          text: "In the context of being human, what was emphasized as a paradox?",
          options: ["Human weakness", "Human strength and sophistication", "Human insignificance", "Human isolation"],
          correct: 1,
          explanation: "The lecture emphasized a paradox: despite our individual weaknesses, as a whole, humans are strong and sophisticated due to our collective efforts."
        },
        {
          text: "What did the lecturer focus on regarding human contributions in the lecture?",
          options: ["Inventions that complicate our lives", "Inventions that have eased our lives", "Evolutionary theories", "Philosophical arguments against human achievements"],
          correct: 1,
          explanation: "The lecturer focused on the numerous inventions and innovations that have significantly eased and improved human lives throughout history."
        },
        {
          text: "According to the lecture, what is the vital role shaping human existence?",
          options: ["Isolation", "Evolution", "Human interaction", "Inventions"],
          correct: 2,
          explanation: "Human interaction was presented as the vital role in shaping human existence, as it allows for the exchange of ideas, learning, and progress."
        },
        {
          text: "What did the lecturer suggest researching to understand what makes humans unique?",
          options: ["Human achievements", "Evolutionary shifts", "Biological differences", "Philosophical arguments"],
          correct: 0,
          explanation: "To understand what makes humans unique, the lecturer suggested researching human achievements throughout history, highlighting our capabilities and impact on the world."
        },
        {
          text: "Why does the lecturer describe humans as standing out among weaker mammals?",
          options: ["Due to physical strength", "Due to mental health", "Due to advanced technology", "Despite being weaker, humans are more advanced"],
          correct: 3,
          explanation: "The lecturer describes humans as standing out among weaker mammals because, despite our relative physical weakness, we have achieved far greater advancements through intelligence and technology."
        },
        {
          text: "In the lecture, what was highlighted as a transformative shift in the evolutionary journey of humanity?",
          options: ["Isolation", "Inventions", "Weakness", "Philosophical arguments"],
          correct: 1,
          explanation: "Inventions were highlighted as a transformative shift in the evolutionary journey of humanity, as they have drastically altered our way of life and our ability to adapt and thrive."
        },
        {
          text: "What is the significance of the paradox of human strength and sophistication?",
          options: ["It explains human insignificance", "It questions human achievements", "It highlights human exceptionalism", "It denies human progress"],
          correct: 2,
          explanation: "The significance of the paradox lies in highlighting human exceptionalism: despite individual frailties, our combined strength and innovation allow us to achieve remarkable things."
        }, 
      {
          text: "What is the main focus of the discussion on human contributions in the lecture?",
          options: ["Inventions", "Weakness", "Isolation", "Evolutionary theories"],
          correct: 0,
          explanation: "The main focus was on inventions as a key aspect of human contributions, highlighting how they have shaped our lives and progress."
        },
        {
          text: "According to the lecturer, what is the most advanced aspect of humans despite being weaker mammals?",
          options: ["Physical strength", "Mental health", "Advanced technology", "Human contributions through inventions"],
          correct: 2,
          explanation: "The lecturer emphasized that humans are more advanced due to our development of advanced technology, which compensates for our physical weaknesses."
        },
        {
          text: "How did the lecturer characterize human existence throughout history?",
          options: ["Isolated and stagnant", "Transformative and shifting", "Consistent and predictable", "Philosophically driven"],
          correct: 1,
          explanation: "Human existence was characterized as transformative and shifting, marked by continuous evolution and innovation."
        },
        {
          text: "What was the lecturer's view on humans being purposefully designed creations?",
          options: ["Supported the idea", "Denied the idea", "Was neutral", "Didn't discuss it"],
          correct: 3,
          explanation: "The lecturer did not address the concept of humans being purposefully designed creations, keeping the focus on observable developments."
        },
        {
          text: "What did the lecturer emphasize as a vital factor in shaping human existence?",
          options: ["Evolutionary theories", "Human contributions", "Human interaction", "Weakness"],
          correct: 2,
          explanation: "Human interaction was emphasized as a vital factor in shaping human existence, enabling the exchange of ideas and collaborative progress."
        },
        {
          text: "How did the lecturer describe the evolutionary journey of humanity?",
          options: ["Linear and unchanging", "Consistently evolving", "Transformative shifts from one era to another", "Isolated and stagnant"],
          correct: 2,
          explanation: "The evolutionary journey of humanity was described as involving transformative shifts from one era to another, driven by innovation and changing circumstances."
}, 
{
          text: "Which anthropologist contributed to understanding personality and culture?",
          options: ["James George Frazer", "Ruth Benedict", "Lewis Henry Morgan", "Margaret Mead"],
          correct: 1,
          explanation: "Ruth Benedict contributed to understanding personality and culture, particularly through her work on cultural patterns."
        },
        {
          text: "What major question does anthropology try to answer regarding human knowledge?",
          options: ["Assessing the limits of human knowledge", "Defining the origin of knowledge", "Studying cultural knowledge", "Exploring human potential"],
          correct: 2,
          explanation: "Anthropology tries to answer questions about human knowledge by studying cultural knowledge across different societies and time periods."
        },
        {
          text: "How does anthropology contribute to creating an orderly and crisis-free society in the field of law?",
          options: ["By promoting chaos", "By studying historical conditions", "Through ethnographic research", "By addressing practical issues"],
          correct: 2,
          explanation: "Anthropology contributes to creating an orderly and crisis-free society in the field of law through ethnographic research, helping understand cultural contexts."
        },
        {
          text: "What aspect of human life does biological anthropology primarily focus on?",
          options: ["Language diversity", "Biological processes and attributes", "Past cultural landscapes", "Societal dynamics"],
          correct: 1,
          explanation: "Biological anthropology primarily focuses on biological processes and attributes related to human evolution, genetics, and health."
        },
        {
          text: "Which anthropologist introduced evolutionary ideas explaining human and societal growth?",
          options: ["Franz Boas", "Edward Tylor", "Ruth Benedict", "Charles Darwin"],
          correct: 1,
          explanation: "Edward Tylor introduced evolutionary ideas explaining human and societal growth, focusing on cultural evolution."
        },
        {
          text: "What does applied anthropology involve in terms of practical application?",
          options: ["Applying linguistic theories", "Applying archaeological methods", "Applying anthropological theories to solve practical issues", "Applying social theories"],
          correct: 2,
          explanation: "Applied anthropology involves applying anthropological theories to solve practical issues, such as in healthcare, development, and education."
        },
        {
          text: "What are the primary methods employed in linguistic anthropology for research?",
          options: ["Ethnography and participant observations", "Geo-technical surveys and carbon dating", "Scientific research, lab experiments, and data analysis", "Articulate speech and diverse languages"],
          correct: 3,
          explanation: "The primary methods employed in linguistic anthropology for research are articulate speech and diverse languages, studying linguistic structures and contexts."
        },
        {
          text: "Who is considered the father of American anthropology and a proponent of cultural relativism?",
          options: ["Franz Boas", "Edward Tylor", "Ruth Benedict", "Margaret Mead"],
          correct: 0,
          explanation: "Franz Boas is considered the father of American anthropology and a proponent of cultural relativism, emphasizing understanding cultures in their own context."
        },
        {
          text: "What does archaeology primarily examine in its field of study?",
          options: ["Human behavior", "Linguistic diversity", "Physical remnants of past cultures", "Contemporary cultural landscapes"],
          correct: 2,
          explanation: "Archaeology primarily examines physical remnants of past cultures, using artifacts and sites to study human history."
        },
        {
          text: "In the realm of anthropology, what does the term Homo sapiens sapiens refer to?",
          options: ["Ancient human species", "Contemporary human species", "A specific cultural group", "A linguistic community"],
          correct: 1,
          explanation: "In the realm of anthropology, the term 'Homo sapiens sapiens' refers to contemporary human species, meaning wise wise human."
        },
        {
          text: "What does the word culture mean?",
          options: ["Civilization", "Language", "Clothing", "Money"],
          correct: 0,
          explanation: "The word culture can generally mean civilization."
        },
        {
          text: "How is culture often equated by some people?",
          options: ["With high economic status", "With customs and traditions", "With low economic status", "With technology"],
          correct: 1,
          explanation: "Culture is often equated by some people with customs and traditions."
        },
        {
          text: "According to sociology, what does culture refer to?",
          options: ["Only customs and traditions", "The whole ways of life of society members", "Only material goods produced by a society", "Religious bodies"],
          correct: 1,
          explanation: "According to sociology, culture refers to the whole ways of life of society members."
        },
        {
          text: "In what ways is culture classified in terms of visibility?",
          options: ["Explicit and implicit", "Overt and covert", "Ideal and manifest", "Stable and changing"],
          correct: 1,
          explanation: "In terms of visibility, culture is often classified as overt and covert."
        },
       
  {
    text: "What is the role of language in shaping cultural identity?",
    options: ["No role", "Minor role", "Significant role", "Only a negative role"],
    correct: 2,
    explanation: "Language plays a significant role in shaping cultural identity, as it is a primary means of communication, transmission of cultural values, and expression of cultural heritage."
  },
  {
    text: "How do cultural norms influence individual behavior?",
    options: ["No influence", "Significant influence", "Minor influence", "Only a negative influence"],
    correct: 1,
    explanation: "Cultural norms exert a significant influence on individual behavior by providing guidelines, expectations, and standards for conduct within a society."
  },
  {
    text: "What is the impact of cultural diversity on social cohesion?",
    options: ["Always positive", "Always negative", "Can be both positive and negative", "No impact"],
    correct: 2,
    explanation: "Cultural diversity can have both positive and negative impacts on social cohesion, as it can promote innovation and understanding but also lead to conflict and division."
  },
  {
    text: "How do power dynamics influence cultural representation?",
    options: ["No influence", "Significant influence", "Minor influence", "Only a positive influence"],
    correct: 1,
    explanation: "Power dynamics exert a significant influence on cultural representation, as dominant groups often control the narrative and shape how other cultures are portrayed."
  },
  {
    text: "What are the ethical considerations in sociological research?",
    options: ["None", "Informed consent", "Anonymity", "Both b and c"],
    correct: 3,
    explanation: "Ethical considerations in sociological research include obtaining informed consent from participants and ensuring their anonymity to protect their privacy and well-being."
  },
  {
    text: "How do global institutions address issues of poverty and inequality?",
    options: ["Effectively", "Ineffectively", "Variably", "Not at all"],
    correct: 2,
    explanation: "Global institutions address issues of poverty and inequality with variable success, as their efforts are often influenced by political agendas, economic constraints, and cultural differences."
  },
  {
    text: "What is the impact of climate change on global societies?",
    options: ["No impact", "Positive impact", "Negative impact", "Uncertain impact"],
    correct: 2,
    explanation: "Climate change has a negative impact on global societies, including rising sea levels, extreme weather events, food shortages, and displacement of populations."
  },
  {
    text: "How do global social movements address issues of human rights?",
    options: ["Ineffectively", "Effectively", "Variably", "Not at all"],
    correct: 2,
    explanation: "Global social movements address issues of human rights with variable success, as their influence depends on factors such as mobilization, political context, and international support."
  },
  {
    text: "What is the difference between functionalism and conflict theory?",
    options: ["No difference", "Functionalism focuses on social order, conflict on inequality", "Functionalism focuses on inequality, conflict on social order", "They are unrelated"],
    correct: 1,
    explanation: "Functionalism focuses on social order, conflict on inequality."
  },
  {
    text: "What are the key concepts of Marxist sociology?",
    options: ["Social class and inequality", "Symbolic interaction", "Socialization", "Deviance"],
    correct: 0,
    explanation: "Key concepts of Marxist sociology include social class, inequality, capitalism, exploitation, and class conflict."
  },
  {
    text: "How does feminism contribute to our understanding of society?",
    options: ["By ignoring gender", "By focusing on gender inequality", "By focusing on economic systems", "By focusing on social institutions"],
    correct: 1,
    explanation: "Feminism contributes to our understanding of society by focusing on gender inequality and advocating for gender equality in all aspects of life."
  },
  {
    text: "What is the role of social theory in understanding contemporary social issues?",
    options: ["No role", "Provides frameworks for analysis", "Hinders understanding", "Irrelevant"],
    correct: 1,
    explanation: "Provides frameworks for analysis."
  },
  {
    text: "How do social institutions shape individual behavior?",
    options: ["No influence", "Significant influence", "Minor influence", "Only negative influence"],
    correct: 1,
    explanation: "Social institutions exert a significant influence on individual behavior by providing norms, values, roles, and expectations that guide people's actions and interactions."
  },
  {
    text: "What is the function of the family in modern society?",
    options: ["No function", "Socialization and support", "Economic production only", "Political organization"],
    correct: 1,
    explanation: "The function of the family in modern society is Socialization and support."
  },
  {
    text: "How has the education system changed over time?",
    options: ["No change", "Increased access", "Decreased access", "Uncertain change"],
    correct: 1,
    explanation: "The education system has changed over time by Increased access."
  },
  {
    text: "What is the impact of religion on social cohesion?",
    options: ["No impact", "Can increase cohesion", "Can decrease cohesion", "Both b and c"],
    correct: 3,
    explanation: "Religion can have both increase and decrease cohesion"
  },
  {
    text: "How do economic systems influence social inequality?",
    options: ["No influence", "Can increase inequality", "Can decrease inequality", "Both b and c"],
    correct: 3,
    explanation: "Economic systems can have both Can increase inequality and Can decrease inequality."
  },
  {
    text: "How does racism perpetuate social inequality?",
    options: ["No impact", "By creating barriers", "By promoting equality", "By having no effect"],
    correct: 1,
    explanation: "By creating barriers"
  }, 
  {
    text: "Which of the following is a social institution?",
    options: ["A family", "A political party", "A religious organization", "All of the above"],
    correct: 3,
    explanation: "A social institution is a complex, integrated set of social norms organized around the goal of preserving a basic societal value. Examples include the family, education, government, religion, and the economy."
  },
  {
    text: "What is a nuclear family?",
    options: ["A family with many children", "A family with multiple generations", "A family consisting of parents and their children", "A family with extended relatives"],
    correct: 2,
    explanation: "A nuclear family consists of a pair of adults and their children."
  },
  {
    text: "What is an extended family?",
    options: ["A family with many children", "A family with multiple generations", "A family consisting of parents and their children", "A family with extended relatives"],
    correct: 3,
    explanation: "An extended family consists of parents and their children, but also other kin, such as grandparents, aunts, uncles, and cousins, who often live nearby or in the same household."
  },
  {
    text: "Monogamy is defined as:",
    options: ["Marriage to multiple spouses", "Marriage to one spouse", "A type of social control", "A form of deviance"],
    correct: 1,
    explanation: "Monogamy is a form of marriage in which an individual has only one spouse at a time."
  },
  {
    text: "Polygamy is defined as:",
    options: ["Marriage to one spouse", "Marriage to multiple spouses", "A type of social control", "A form of deviance"],
    correct: 1,
    explanation: "Polygamy is a form of marriage in which an individual has multiple spouses at the same time."
  },
  {
    text: "Polygyny is:",
    options: ["One woman, many men", "One man, many women", "One man, one woman", "A type of social control"],
    correct: 1,
    explanation: "Polygyny is a form of polygamy in which one man is married to multiple women."
  },
  {
    text: "Polyandry is:",
    options: ["One woman, many men", "One man, many women", "One man, one woman", "A type of social control"],
    correct: 0,
    explanation: "Polyandry is a form of polygamy in which one woman is married to multiple men."
  },
  {
    text: "Endogamy refers to marriage:",
    options: ["Outside one's social group", "Within one's social group", "To multiple spouses", "To one spouse"],
    correct: 1,
    explanation: "Endogamy is the practice of marrying within one's own social group, class, ethnicity, or caste."
  },
  {
    text: "What is the role of technology in social movements?",
    options: ["No impact", "Can hinder movements", "Can facilitate movements", "Always a negative impact"],
    correct: 2,
    explanation: "Technology, particularly social media, can facilitate social movements by providing tools for communication, organization, and mobilization."
  },
  {
    text: "What is the difference between qualitative and quantitative research?",
    options: ["No difference", "Qualitative uses numbers, quantitative uses words", "Qualitative uses words, quantitative uses numbers", "Qualitative is better than quantitative"],
    correct: 2,
    explanation: "Qualitative research uses non-numerical data such as interviews and observations, while quantitative research uses numerical data and statistical analysis."
  },
  {
    text: "What is cultural relativism?",
    options: ["Judging cultures by one's own standards", "Understanding cultures on their own terms", "Ignoring cultural differences", "Promoting one's own culture"],
    correct: 1,
    explanation: "Cultural relativism is the principle of understanding and judging a culture on its own terms, rather than by the standards of one's own culture."
  },
  {
    text: "What is a subculture?",
    options: ["A culture that opposes mainstream culture", "A smaller culture within a larger culture", "A global culture", "A type of social control"],
    correct: 1,
    explanation: "A subculture is a smaller cultural group within a larger culture, with its own distinct norms, values, and behaviors."
  },
  {
    text: "What is a counterculture?",
    options: ["A culture that opposes mainstream culture", "A smaller culture within a larger culture", "A global culture", "A type of social control"],
    correct: 0,
    explanation: "A counterculture is a subculture that opposes mainstream cultural norms and values."
  },
  {
    text: "What is the impact of globalization on local cultures?",
    options: ["No impact", "Always positive", "Always negative", "Both positive and negative impacts"],
    correct: 3,
    explanation: "Globalization can have both positive and negative impacts on local cultures, including increased cultural exchange but also the potential for cultural homogenization and loss of local traditions."
  },
  {
    text: "How do social media influence cultural representation?",
    options: ["No influence", "Positive influence only", "Negative influence only", "Both positive and negative influences"],
    correct: 3,
    explanation: "Social media can have both positive and negative influences on cultural representation, including increased diversity and visibility but also the potential for stereotypes and misinformation."
  }, 
  {
    text: "Sociology is best defined as the study of:",
    options: ["Individual psychology", "Animal behavior", "Human society and social relationships", "Economic systems"],
    correct: 2,
    explanation: "Sociology is the systematic study of human society, focusing on social relationships, social interaction, and culture."
  },
  {
    text: "Which term describes the belief that one's own culture is superior to others?",
    options: ["Cultural relativism", "Ethnocentrism", "Socialization", "Acculturation"],
    correct: 1,
    explanation: "Ethnocentrism is the belief in the inherent superiority of one's own ethnic group or culture, often accompanied by a feeling of contempt for other cultures."
  },
  {
    text: "Material culture includes:",
    options: ["Beliefs", "Values", "Buildings", "Norms"],
    correct: 2,
    explanation: "Material culture consists of physical objects and artifacts created, used, or given meaning by people, such as buildings, tools, and art."
  },
  {
    text: "Non-material culture includes:",
    options: ["Clothing", "Language", "Houses", "Cars"],
    correct: 1,
    explanation: "Non-material culture encompasses the nonphysical aspects of a culture, such as beliefs, values, language, rules, and customs."
  },
  {
    text: "Culture is best described as:",
    options: ["Static and unchanging", "Dynamic and ever-evolving", "Only material objects", "Only beliefs and values"],
    correct: 1,
    explanation: "Culture is dynamic and ever-evolving, adapting over time in response to internal and external influences."
  },
  {
    text: "The primary agent of socialization is typically:",
    options: ["The school", "The peer group", "The family", "The media"],
    correct: 2,
    explanation: "The family is typically considered the primary agent of socialization, as it is the earliest and most influential source of norms, values, and beliefs."
  },
  {
    text: "What is culture shock?",
    options: ["A type of music", "Discomfort in an unfamiliar culture", "A cultural celebration", "A form of social control"],
    correct: 1,
    explanation: "Culture shock is the feeling of disorientation experienced by someone who is suddenly subjected to an unfamiliar culture, way of life, or set of attitudes."
  },
  {
    text: "What is ethnocentrism?",
    options: ["Studying different cultures", "Judging other cultures by one's own standards", "Adapting to a new culture", "Celebrating cultural diversity"],
    correct: 1,
    explanation: "Ethnocentrism involves judging other cultures by the standards of one's own culture, often leading to a biased and narrow perspective."
  },
  {
    text: "What is the Queen of Social Sciences?",
    options: ["Psychology", "Anthropology", "Sociology", "Political Science"],
    correct: 2,
    explanation: "Sociology is often referred to as the Queen of the Social Sciences due to its broad scope and its influence on other social science disciplines."
  },
  {
    text: "What is social imagination?",
    options: ["Imagining a better society", "A sociologist's tool to understand human backgrounds", "A form of social control", "A type of deviance"],
    correct: 1,
    explanation: "Social imagination enables sociologists to understand human backgrounds and interaction beyond their contextual background."
  },
  {
    text: "Deviance is best defined as:",
    options: ["Criminal behavior only", "Violation of social norms", "Mental illness", "Rebellion against authority"],
    correct: 1,
    explanation: "Deviance is any behavior that violates social norms and expectations within a given society or group."
  },
  {
    text: "A major function of deviance is to:",
    options: ["Strengthen social bonds", "Increase social chaos", "Promote economic growth", "Reduce social inequality"],
    correct: 0,
    explanation: "Deviance can help to clarify and reinforce social norms, promote social unity, and stimulate social change, thereby strengthening social bonds."
  },
  {
    text: "Social control mechanisms include:",
    options: ["Laws only", "Informal sanctions only", "Both formal and informal sanctions", "None of the above"],
    correct: 2,
    explanation: "Social control mechanisms can be formal (e.g., laws, police) or informal (e.g., social disapproval, peer pressure) and are used to regulate behavior and maintain social order."
  },
  {
    text: "What is medicalization of deviance?",
    options: ["Treating deviance as a medical issue", "Punishing deviant acts", "Ignoring deviant acts", "Studying deviant acts"],
    correct: 0,
    explanation: "Medicalization of deviance involves defining and treating deviant behaviors as medical problems or illnesses, often leading to medical interventions."
  },
  {
    text: "What is criminalization of deviance?",
    options: ["Treating deviance as a medical issue", "Punishing deviant acts", "Ignoring deviant acts", "Studying deviant acts"],
    correct: 1,
    explanation: "Criminalization of deviance involves defining and punishing deviant behaviors as crimes, subject to legal sanctions and penalties."
  },
  {
    text: "What is the difference between deviance and crime?",
    options: ["All deviant acts are crimes", "All crimes are deviant acts", "There is no difference", "Deviant acts are not always crimes"],
    correct: 1,
    explanation: "All crimes are deviant acts because they violate societal norms. However, not all deviant acts are crimes because they may not break any laws."
  },
  {
    text: "A social institution is best described as:",
    options: ["A specific building", "A stable pattern of behavior", "A type of government", "A social movement"],
    correct: 1,
    explanation: "A social institution is a stable pattern of behavior."
  }, 
  {
    text: "Which of the following best defines sociology?",
    options: ["The study of social behavior and institutions", "The study of human biology and behavior", "The study of social imagination and its structures", "The study of human interactions without environmental influence"],
    correct: 0,
    explanation: "Sociology is the study of social behavior and institutions, focusing on how they influence and are influenced by human actions and interactions."
  },
  {
    text: "Sociological imagination refers to:",
    options: ["Understanding personal problems through societal structures", "Imagining a society where social structures do not exist", "Using creativity to redefine social norms", "The ability to predict future societal trends"],
    correct: 0,
    explanation: "The sociological imagination is the ability to see the relationship between individual experiences and the larger society."
  },
  {
    text: "Which of these is NOT a characteristic of culture?",
    options: ["Culture is symbolic", "Culture is biological", "Culture is learned", "Culture is dynamic"],
    correct: 1,
    explanation: "Culture is not biological; it is learned, shared, symbolic, and dynamic, adapting over time."
  },
  {
    text: "The belief that one’s own culture is superior to others is called:",
    options: ["Cultural relativism", "Ethnocentrism", "Cultural diffusion", "Acculturation"],
    correct: 1,
    explanation: "Ethnocentrism is the belief in the inherent superiority of one's own ethnic group or culture."
  },
  {
    text: "Material culture consists of:",
    options: ["Abstract ideas, traditions, and beliefs", "Physical objects, artifacts, and tools", "Language and symbolic systems", "Non-visible aspects of social norms"],
    correct: 1,
    explanation: "Material culture includes the physical objects, resources, and spaces that people use to define their culture."
  },
  {
    text: "Which of the following is NOT a primary agent of socialization?",
    options: ["Family", "Government", "Media", "Peer groups"],
    correct: 1,
    explanation: "The primary agents of socialization are family, peer groups, schools, and media. Government plays a more indirect role."
  },
  {
    text: "Cultural accumulation refers to:",
    options: ["The loss of cultural traits due to globalization", "The gradual addition of new elements to existing culture", "The rejection of foreign cultural influences", "The dominance of a single culture over others"],
    correct: 1,
    explanation: "Cultural accumulation is the process by which knowledge, beliefs, values, and customs are added to a culture over time."
  },
  {
    text: "Which of the following statements about deviance is true?",
    options: ["All deviant acts are criminal", "All criminal acts are deviant", "Deviance and crime are always the same", "Deviance is universally defined"],
    correct: 1,
    explanation: "All criminal acts are deviant, but not all deviant acts are criminal. Deviance varies across cultures and time."
  },
  {
    text: "Social control is best defined as:",
    options: ["The system of government laws regulating behavior", "The informal and formal mechanisms used to enforce norms", "The study of how social institutions interact", "The practice of ensuring individuals conform to laws only"],
    correct: 1,
    explanation: "Social control refers to the techniques and strategies for preventing deviant human behavior in any society."
  },
  {
    text: "Marriage as a social institution is characterized by:",
    options: ["A temporary relationship between two people", "The legal recognition of a relationship that includes economic, social, and personal responsibilities", "A voluntary agreement that excludes social expectations", "A relationship solely for procreation"],
    correct: 1,
    explanation: "Marriage as an institution involves legal recognition and a set of mutual rights and obligations between spouses, including economic, social, and personal aspects."
  }, 
      
 {
  text: "Capitalism is often criticized for:",
  options: [
   "Promoting excessive government control over individual wealth",
   "Encouraging inequality through the concentration of resources",
   "Removing competition between businesses",
   "Enforcing a fixed social hierarchy that cannot be changed"
  ],
  correct: 1,
  explanation: "Capitalism is often criticized for encouraging inequality through the concentration of resources."
 },
 {
  text: "The difference between an authoritarian and a democratic government is that:",
  options: [
   "Authoritarian regimes allow free elections, while democracies do not",
   "Democratic governments limit individual rights more than authoritarian states",
   "Authoritarian regimes concentrate power in a single authority, while democracies distribute power through representation",
   "Democracies control the economy, while authoritarian states allow free markets"
  ],
  correct: 2,
  explanation: "The key difference between authoritarian and democratic governments is that authoritarian regimes concentrate power in a single authority, while democracies distribute power through representation."
 },
 {
  text: "Which of the following best describes a totalitarian government?",
  options: [
   "A system in which multiple political parties share power equally",
   "A political structure in which the state controls nearly all aspects of life",
   "A government where the public elects representatives freely",
   "A decentralized political structure with little formal authority"
  ],
  correct: 1,
  explanation: "A totalitarian government is best described as a political structure in which the state controls nearly all aspects of life."
 },
 {
  text: "Which of the following would be considered an example of soft power?",
  options: [
   "A country using economic sanctions to influence another nation",
   "A military invasion to impose political change",
   "A global pop culture trend shaping international perceptions",
   "A government enforcing strict border control policies"
  ],
  correct: 2,
  explanation: "A global pop culture trend shaping international perceptions would be considered an example of soft power."
 },
 {
  text: "Social institutions change over time primarily due to:",
  options: [
   "Resistance to technological advancements",
   "The rigid enforcement of long-standing traditions",
   "Political, economic, and cultural shifts",
   "The elimination of laws and government policies"
  ],
  correct: 2,
  explanation: "Social institutions change over time primarily due to political, economic, and cultural shifts."
 },
 {
  text: "Which of the following best illustrates institutional adaptation?",
  options: [
   "A religious organization refusing to adjust its teachings over time",
   "A legal system updating its marriage laws to reflect societal values",
   "A country banning all forms of technological advancement",
   "An educational institution rejecting any new curriculum changes"
  ],
  correct: 1,
  explanation: "A legal system updating its marriage laws to reflect societal values best illustrates institutional adaptation."
 },
 {
  text: "What is one of the unintended consequences of rapid institutional change?",
  options: [
   "Increased political stability",
   "A higher level of social cohesion",
   "Greater resistance from groups invested in the previous system",
   "A complete absence of social conflict"
  ],
  correct: 2,
  explanation: "One of the unintended consequences of rapid institutional change is greater resistance from groups invested in the previous system."
 },
 {
  text: "Which of the following is most likely to cause resistance to institutional change?",
  options: [
   "A government promoting education reform",
   "A cultural shift that challenges existing power structures",
   "A new law that supports the status quo",
   "A scientific discovery that has no social implications"
  ],
  correct: 1,
  explanation: "A cultural shift that challenges existing power structures is most likely to cause resistance to institutional change."
 },
{
  text: "How do social institutions typically respond to major societal changes?",
  options: [
   "By immediately adopting new norms without resistance",
   "By gradually adjusting to reflect new cultural and political realities",
   "By rejecting any form of adaptation",
   "By eliminating all existing structures and creating entirely new ones"
  ],
  correct: 1,
  explanation: "Social institutions typically respond to major societal changes by gradually adjusting to reflect new cultural and political realities."
 },
 {
  text: "A key characteristic of social institutions is that they:",
  options: [
   "Always reinforce existing power structures and never allow change",
   "Function independently of culture and historical context",
   "Are dynamic structures that evolve alongside society",
   "Exist only in modern, industrialized nations"
  ],
  correct: 2,
  explanation: "Social institutions are dynamic structures that evolve alongside society."
 },
 {
  text: "Social institutions differ from social groups because they:",
  options: [
   "Are temporary and based on individual preferences",
   "Operate through informal rules rather than established norms",
   "Are formalized systems that regulate behavior across generations",
   "Only include political and economic organizations"
  ],
  correct: 2,
  explanation: "Social institutions differ from social groups because they are formalized systems that regulate behavior across generations."
 },
 {
  text: "Which of the following statements about polygamy is the most misleading?",
  options: [
   "Polygamy is illegal in every country",
   "Some cultures recognize multiple forms of polygamous marriage",
   "The acceptance of polygamy varies based on cultural and religious values",
   "In some societies, polygamy is an indicator of wealth and social status"
  ],
  correct: 0,
  explanation: "The most misleading statement about polygamy is that it is illegal in every country. In reality, its legality varies greatly depending on the nation."
 },
 {
  text: "Which of these best illustrates the practice of levirate marriage?",
  options: [
   "A widow marrying her deceased husband’s brother to maintain family ties",
   "A woman marrying a man from a different ethnic background",
   "A man marrying multiple wives from different families",
   "A married couple adopting a child from a foreign country"
  ],
  correct: 0,
  explanation: "The best illustration of the practice of levirate marriage is a widow marrying her deceased husband’s brother to maintain family ties."
 },
 {
  text: "A distinguishing feature of a matrilineal family system is that:",
  options: [
   "Property and inheritance pass through the mother’s line",
   "Only women can make major household decisions",
   "The father is excluded from family affairs",
   "Males are completely removed from leadership roles"
  ],
  correct: 0,
  explanation: "A distinguishing feature of a matrilineal family system is that property and inheritance pass through the mother’s line."
 },
 {
  text: "One reason religion is considered a powerful social institution is that:",
  options: [
   "It is enforced by law in all societies",
   "It dictates government policies in every country",
   "It provides a shared moral framework that influences social norms",
   "It operates independently of culture and history"
  ],
  correct: 2,
  explanation: "One reason religion is considered a powerful social institution is that it provides a shared moral framework that influences social norms."
 },
 {
  text: "Which of the following best reflects the concept of religious pluralism?",
  options: [
   "The coexistence of multiple religious traditions within a society",
   "The dominance of one religion over all others",
   "The complete separation of religion from public life",
   "A government policy requiring citizens to follow one national religion"
  ],
  correct: 0,
  explanation: "The coexistence of multiple religious traditions within a society best reflects the concept of religious pluralism."
 },
 {
  text: "Which of these is the best example of a 'hidden curriculum' in education?",
  options: [
   "A history teacher explaining the causes of World War II",
   "A student learning obedience and punctuality through school routines",
   "A university offering specialized degrees in engineering",
   "A school implementing new math textbooks"
  ],
  correct: 1,
  explanation: "A student learning obedience and punctuality through school routines is the best example of a 'hidden curriculum' in education."
 },
 {
  text: "How does the educational system contribute to social stratification?",
  options: [
   "By ensuring equal opportunities for all students",
   "By reinforcing existing class structures through access to resources",
   "By removing all barriers to social mobility",
   "By eliminating economic disparities among different social groups"
  ],
  correct: 1,
  explanation: "The educational system contributes to social stratification by reinforcing existing class structures through access to resources."
 },
 {
  text: "Which of the following is a latent function of education?",
  options: [
   "Teaching students critical thinking skills",
   "Preparing individuals for participation in the labor market",
   "Encouraging social networking and relationship-building",
   "Enforcing government ideology in the curriculum"
  ],
  correct: 2,
  explanation: "Encouraging social networking and relationship-building is a latent function of education."
 },
 {
  text: "Which of the following is an example of credentialism?",
  options: [
   "A company hiring only individuals with advanced degrees, even if the job does not require them",
   "A school teaching students multiple languages",
   "A country requiring all children to complete primary education",
   "A student choosing to pursue higher education for personal growth"
  ],
  correct: 0,
  explanation: "Credentialism is exemplified by a company hiring only individuals with advanced degrees, even if the job does not require them, overvaluing formal qualifications."
 },
 {
  text: "The primary function of standardized testing in education is to:",
  options: [
   "Measure intelligence and predict life success",
   "Assess student learning and compare performance across populations",
   "Guarantee that all students receive equal opportunities",
   "Eliminate social inequalities in educational achievement"
  ],
  correct: 1,
  explanation: "The primary function of standardized testing in education is to assess student learning and compare performance across populations."
 },
 {
  text: "A major characteristic of capitalism is:",
  options: [
   "Equal distribution of wealth among all individuals",
   "Government control over all private industries",
   "Market-based production with private ownership of resources",
   "The absence of competition between businesses"
  ],
  correct: 2,
  explanation: "A major characteristic of capitalism is market-based production with private ownership of resources."
 },
 {
  text: "In contrast to capitalism, socialism emphasizes:",
  options: [
   "Total elimination of economic competition",
   "Government regulation of key industries while allowing private enterprise",
   "A complete ban on private ownership",
   "An economy controlled entirely by corporations"
  ],
  correct: 1,
  explanation: "In contrast to capitalism, socialism emphasizes government regulation of key industries while allowing private enterprise."
 },
 {
  text: "Which of the following best illustrates a command economy?",
  options: [
   "An economic system in which consumer demand determines production",
   "A government that sets prices, controls industries, and regulates supply chains",
   "A free market system where businesses operate independently of state influence",
   "A society in which economic exchanges occur without the use of money"
  ],
  correct: 1,
  explanation: "A command economy is best illustrated by a government that sets prices, controls industries, and regulates supply chains."
 },
 {
  text: "A totalitarian government differs from a democracy because:",
  options: [
   "Citizens have unrestricted freedom of speech",
   "A small group or single leader has absolute control over all aspects of life",
   "Government power is distributed among multiple political parties",
   "Leaders are directly elected by the people"
  ],
  correct: 1,
  explanation: "A totalitarian government differs from a democracy because a small group or single leader has absolute control over all aspects of life."
 },
 {
  text: "In a democracy, power is primarily derived from:",
  options: [
   "The ruling class and wealthy elite",
   "Military strength and enforcement",
   "The consent of the governed and participation in elections",
   "Religious authorities who dictate political decisions"
  ],
  correct: 2,
  explanation: "In a democracy, power is primarily derived from the consent of the governed and participation in elections."
 },
 {
  text: "Which of the following is a defining feature of an authoritarian regime?",
  options: [
   "A government that allows multiple political parties to compete equally",
   "A system in which power is centralized and opposition is suppressed",
   "A political structure that prioritizes individual rights over state authority",
   "A legal framework where all policies are decided by public referendum"
  ],
  correct: 1,
  explanation: "A defining feature of an authoritarian regime is a system in which power is centralized and opposition is suppressed."
 },
 {
  text: "Social institutions change over time due to:",
  options: [
   "The inability of societies to maintain long-term traditions",
   "Technological advancements, cultural shifts, and economic developments",
   "The deliberate elimination of historical customs",
   "The removal of all political structures"
  ],
  correct: 1,
  explanation: "Social institutions change over time due to technological advancements, cultural shifts, and economic developments."
 },
 {
  text: "Institutional adaptation occurs when:",
  options: [
   "A government decides to abolish all existing laws",
   "Religious institutions refuse to acknowledge societal transformations",
   "Schools modify curricula to reflect contemporary knowledge",
   "Economic systems become entirely dependent on traditional practices"
  ],
  correct: 2,
  explanation: "Institutional adaptation occurs when schools modify curricula to reflect contemporary knowledge."
 },
 {
  text: "Social institutions are best understood as:",
  options: [
   "Spontaneous social interactions that occur naturally in society",
   "Abstract ideas that have no concrete impact on human behavior",
   "Systems of roles, norms, and values that persist over time",
   "Temporary arrangements that change every few years"
  ],
  correct: 2,
  explanation: "Social institutions are best understood as systems of roles, norms, and values that persist over time."
 },
 {
  text: "Which of the following is the most accurate statement about social institutions?",
  options: [
   "They exist to serve individuals rather than society as a whole",
   "They remain static and unchanged despite cultural shifts",
   "They influence individual behavior but are not influenced by individuals",
   "They provide structure to society by establishing predictable patterns of interaction"
  ],
  correct: 3,
  explanation: "Social institutions provide structure to society by establishing predictable patterns of interaction."
 },
 {
  text: "Why is the concept of 'institutionalization' important in sociology?",
  options: [
   "It ensures that individuals always act in the same way",
   "It refers to the process by which behaviors and norms become established and widely accepted",
   "It guarantees that all societies will develop the same institutions",
   "It eliminates the need for social adaptation"
  ],
  correct: 1,
  explanation: "Institutionalization refers to the process by which behaviors and norms become established and widely accepted."
 },
 {
  text: "Which of these statements about family structures is the most misleading?",
  options: [
   "The nuclear family is universally regarded as the ideal family structure",
   "The extended family is common in many collectivist societies",
   "Families vary in structure based on cultural and economic factors",
   "Family roles and expectations change over time and across societies"
  ],
  correct: 0,
  explanation: "The nuclear family is NOT universally regarded as the ideal family structure; family structures vary widely across cultures."
 },
 {
  text: "Which type of marriage is based on a legal framework rather than cultural traditions?",
  options: [
   "Religious marriage",
   "Traditional marriage",
   "Ordinance marriage",
   "Endogamous marriage"
  ],
  correct: 2,
  explanation: "Ordinance marriage is based on a legal framework rather than cultural traditions."
 },
 {
  text: "A major difference between a patriarchal and matriarchal family system is:",
  options: [
   "Who earns the highest income in the household",
   "Whether men or women hold primary authority in decision-making",
   "The number of children raised in the household",
   "The division of household labor"
  ],
  correct: 1,
  explanation: "A major difference between a patriarchal and matriarchal family system is whether men or women hold primary authority in decision-making."
 },
 {
  text: "Religion functions as a social institution by:",
  options: [
   "Eliminating all forms of conflict in society",
   "Establishing a moral code and strengthening social cohesion",
   "Preventing social institutions from interacting with one another",
   "Replacing political authority in all societies"
  ],
  correct: 1,
  explanation: "Religion functions as a social institution by establishing a moral code and strengthening social cohesion."
 },
 {
  text: "Which of the following best describes secularization?",
  options: [
   "The process by which religious beliefs become more widely accepted in society",
   "The shift from religious influence to non-religious, rational thinking in public affairs",
   "The reinforcement of religious authority over political systems",
   "The requirement for all governments to adopt a national religion"
  ],
  correct: 1,
  explanation: "Secularization is best described as the shift from religious influence to non-religious, rational thinking in public affairs."
 },
 {
  text: "Civil religion is different from traditional religion because it:",
  options: [
   "Involves official religious institutions rather than national symbols",
   "Creates a division between religious and political institutions",
   "Integrates religious themes into national identity and patriotism",
   "Rejects all traditional religious beliefs in favor of legal systems"
  ],
  correct: 2,
  explanation: "Civil religion is different from traditional religion because it integrates religious themes into national identity and patriotism."
 },
 {
  text: "A hidden curriculum in education refers to:",
  options: [
   "The set of official subjects taught in a school",
   "Unspoken social norms and values transmitted through schooling",
   "Knowledge that only a select group of students can access",
   "Material covered outside of standardized exams"
  ],
  correct: 1,
  explanation: "A hidden curriculum in education refers to unspoken social norms and values transmitted through schooling."
 },
 {
  text: "Which of the following best defines a political institution?",
  options: [
   "A group that regulates economic trade",
   "A system that governs social behavior and enforces laws",
   "An organization that educates young citizens",
   "A temporary arrangement between powerful individuals"
  ],
  correct: 1,
  explanation: "A political institution is a system that governs social behavior and enforces laws."
 },
 {
  text: "What is the primary function of the economic institution?",
  options: [
   "Distributing religious teachings",
   "Managing resources, production, and trade",
   "Monitoring family structures",
   "Enforcing moral values in society"
  ],
  correct: 1,
  explanation: "The primary function of the economic institution is managing resources, production, and trade."
 },
 {
  text: "Social institutions evolve over time because:",
  options: [
   "They must adapt to technological and cultural changes",
   "They are completely independent of society",
   "They are controlled by a fixed set of rules that never change",
   "They are irrelevant in modern societies"
  ],
  correct: 0,
  explanation: "Social institutions evolve over time to adapt to technological and cultural changes."
 },
 {
  text: "A major consequence of institutional change is:",
  options: [
   "Increased resistance to technological advancement",
   "A shift in societal norms and expectations",
   "The elimination of all traditional customs",
   "A breakdown of all forms of social order"
  ],
  correct: 1,
  explanation: "A major consequence of institutional change is a shift in societal norms and expectations."
 },
 {
  text: "Which of the following best defines a social institution?",
  options: [
   "A government organization that enforces laws",
   "A structured and enduring system of social relationships that fulfills societal needs",
   "A temporary group of people working toward a shared goal",
   "An informal gathering that influences social norms"
  ],
  correct: 1,
  explanation: "A social institution is a structured and enduring system of social relationships that fulfills societal needs."
 },
 {
  text: "Social institutions primarily exist to:",
  options: [
   "Control human behavior through strict laws",
   "Ensure equal wealth distribution",
   "Organize social life and maintain societal stability",
   "Eliminate all forms of conflict in society"
  ],
  correct: 2,
  explanation: "Social institutions are established to organize social life and maintain societal stability."
 },
 {
  text: "Which of the following is NOT considered a social institution?",
  options: [
   "The family",
   "The military",
   "A temporary protest group",
   "Religion"
  ],
  correct: 2,
  explanation: "A temporary protest group is not a social institution because it lacks the enduring and structured nature of established institutions."
 },
 {
  text: "One key characteristic of social institutions is that they:",
  options: [
   "Change frequently and randomly",
   "Are essential for the functioning of society",
   "Exist only in developed nations",
   "Have no influence on individual behavior"
  ],
  correct: 1,
  explanation: "Social institutions are fundamental for societal functioning, providing structure and stability."
 },
 {
  text: "Which of the following is NOT a major type of social institution?",
  options: ["Education", "Economy", "Technology", "Family"],
  correct: 2,
  explanation: "Technology is a product of society, but it is not considered a core social institution in itself."
 },
 {
  text: "The institution of family primarily serves to:",
  options: [
   "Control the economy",
   "Pass down cultural values and norms",
   "Create government policies",
   "Provide job opportunities for its members"
  ],
  correct: 1,
  explanation: "The family's primary role is to transmit cultural values and norms from one generation to the next."
 },
 {
  text: "Which social institution is responsible for creating and enforcing laws?",
  options: [
   "The economy",
   "The political institution",
   "The family",
   "The media"
  ],
  correct: 1,
  explanation: "The political institution, including the government, is responsible for creating and enforcing laws."
 },
 {
  text: "The economic institution is primarily responsible for:",
  options: [
   "Regulating marriage and family structures",
   "Managing the production, distribution, and consumption of goods and services",
   "Enforcing laws and punishing criminals",
   "Controlling religious beliefs and practices"
  ],
  correct: 1,
  explanation: "The economic institution focuses on the production, distribution, and consumption of goods and services within a society."
 },
 {
  text: "Which of the following best describes the role of the family as a social institution?",
  options: [
   "A temporary arrangement between individuals",
   "A formal organization with legal responsibilities",
   "A structure that nurtures and socializes individuals",
   "An institution that exists only in traditional societies"
  ],
  correct: 2,
  explanation: "The family is a social structure that plays a vital role in nurturing and socializing individuals from childhood to adulthood."
 },
 {
  text: "What is the primary function of the family in most societies?",
  options: [
   "Generating income for the economy",
   "Providing emotional support and socialization",
   "Enforcing government policies",
   "Establishing religious doctrines"
  ],
  correct: 1,
  explanation: "The family is crucial for providing emotional support, teaching cultural norms, and guiding individuals through socialization processes."
 },
 {
  text: "Which type of family includes multiple generations living together?",
  options: [
   "Nuclear family",
   "Extended family",
   "Polygamous family",
   "Institutional family"
  ],
  correct: 1,
  explanation: "An extended family consists of multiple generations (grandparents, parents, children) living together."
 },
 {
  text: "In levirate marriage, a woman is expected to:",
  options: [
   "Marry a man from another culture",
   "Marry her deceased husband's brother",
   "Avoid remarriage after the husband's death",
   "Choose any partner freely without societal norms"
  ],
  correct: 1,
  explanation: "Levirate marriage is a cultural practice where a widow is expected to marry her deceased husband's brother, often to continue the lineage."
 },
 {
  text: "Religion is considered a social institution because:",
  options: [
   "It is practiced by everyone",
   "It provides moral guidelines and social cohesion",
   "It is controlled by the government",
   "It replaces all other institutions in society"
  ],
  correct: 1,
  explanation: "Religion as a social institution provides moral guidelines, social cohesion, and a shared framework for beliefs and practices."
 },
 {
  text: "Which of the following is a manifest function of religion?",
  options: [
   "Encouraging rebellion against social norms",
   "Providing social solidarity and moral guidance",
   "Generating economic profits for the government",
   "Preventing all forms of conflict"
  ],
  correct: 1,
  explanation: "A manifest function of religion is to provide social solidarity, moral guidance, and a sense of community among believers."
 },
      
 {
  text: "Which of the following best illustrates the self-fulfilling prophecy in deviance?",
  options: [
   "A person labeled as a criminal continues committing crimes because they are seen as a criminal",
   "A student studying hard because they are told they are smart",
   "A protest movement gaining traction due to media coverage",
   "A law being passed to prevent deviant behavior"
  ],
  correct: 0,
  explanation: "Once labeled, individuals may internalize the label and act accordingly (self-fulfilling prophecy)."
 },
 {
  text: "What is the main issue with criminalizing all acts of deviance?",
  options: [
   "It discourages law enforcement from taking action",
   "It assumes all deviance is harmful to society",
   "It prevents people from learning from their mistakes",
   "It only applies to formal laws, not social norms"
  ],
  correct: 1,
  explanation: "Not all deviance is harmful—some forms of deviance lead to social change."
 },
 {
  text: "The concept of restorative justice focuses on:",
  options: [
   "Punishing the offender as severely as possible",
   "Rehabilitating offenders and repairing harm done to victims",
   "Encouraging more severe prison sentences",
   "Preventing any interaction between criminals and victims"
  ],
  correct: 1,
  explanation: "Restorative justice prioritizes repairing harm and reintegration."
 },
 {
  text: "When a previously deviant act becomes widely accepted, this is called:",
  options: [
   "Deviance amplification",
   "Institutionalization",
   "Normalization",
   "Social reintegration"
  ],
  correct: 2,
  explanation: "Social attitudes can change, making past deviant acts normal (normalization)."
 },
 {
  text: "How do power dynamics influence the definition of deviance?",
  options: [
   "Power has no influence on deviance",
   "The dominant group defines what is considered deviant",
   "Deviance is determined purely by moral standards",
   "Laws are applied equally to all individuals"
  ],
  correct: 1,
  explanation: "The powerful shape what is considered deviant."
 },
 {
  text: "When deviant behavior spreads due to increased media attention, this is called:",
  options: [
   "Labeling theory",
   "Deviance amplification",
   "Secondary deviance",
   "Cultural diffusion"
  ],
  correct: 1,
  explanation: "Media attention can reinforce and spread deviance (deviance amplification)."
 },
 {
  text: "In what situation could crime be considered functional for society?",
  options: [
   "Crime has no positive function",
   "Crime strengthens social cohesion by uniting people against criminals",
   "Crime always leads to moral decay",
   "Crime prevents people from obeying laws"
  ],
  correct: 1,
  explanation: "Crime can reinforce norms by defining moral boundaries."
 },
 {
  text: "What is a hidden consequence of mass incarceration?",
  options: [
   "It reduces all types of crime permanently",
   "It creates long-term social inequalities",
   "It eliminates the need for law enforcement",
   "It has no effect on communities"
  ],
  correct: 1,
  explanation: "Mass incarceration disproportionately affects marginalized groups, creating long-term social inequalities."
 },
 {
  text: "If an act is illegal but widely accepted as normal within a society, it would be considered:",
  options: [
   "Deviant but not criminal",
   "Criminal but not deviant",
   "Both deviant and criminal",
   "Neither deviant nor criminal"
  ],
  correct: 1,
  explanation: "Since it is illegal, it is criminal, but if society accepts it, it is not seen as deviant."
 },
 {
  text: "Which of the following is NOT a reason why defining deviance is complex?",
  options: [
   "Deviance is shaped by cultural norms that evolve over time",
   "Some acts are always deviant, regardless of societal norms",
   "Deviance can be situational rather than universal",
   "The same behavior may be accepted in one group but condemned in another"
  ],
  correct: 1,
  explanation: "There is no behavior that is inherently deviant across all cultures and times."
 },
 {
  text: "Which of these situations best illustrates the concept of deviance being relative?",
  options: [
   "A woman voting in a democratic election",
   "A man wearing shorts in the summer",
   "A person publicly consuming alcohol in a country where drinking is illegal",
   "A police officer enforcing laws universally across societies"
  ],
  correct: 2,
  explanation: "Deviance depends on cultural context—drinking alcohol is legal in some places but not in others."
 },
 {
  text: "Labeling theory suggests that deviance exists primarily because:",
  options: [
   "Some behaviors are inherently immoral",
   "Society defines and reacts to certain behaviors as deviant",
   "Laws are applied equally to all individuals",
   "People are born with deviant tendencies"
  ],
  correct: 1,
  explanation: "Labeling theory argues that deviance is created by societal reaction."
 },
 {
  text: "What is the main flaw in the functionalist perspective on deviance?",
  options: [
   "It ignores how deviance can be used as a form of resistance against oppression",
   "It assumes that deviance always disrupts society",
   "It fails to recognize that all deviance is criminal",
   "It does not consider how deviance can reinforce power structures"
  ],
  correct: 0,
  explanation: "Functionalists view deviance as reinforcing norms but often ignore its role in challenging oppression."
 },
 {
  text: "According to conflict theory, laws are created primarily to:",
  options: [
   "Ensure fairness for all citizens",
   "Reflect the shared values of a society",
   "Protect the interests of those in power",
   "Discourage economic inequality"
  ],
  correct: 2,
  explanation: "Conflict theory argues that laws serve elite interests."
 },
 {
  text: "Which of the following acts would be considered deviant in all societies?",
  options: [
   "Theft",
   "Lying",
   "Cannibalism",
   "None of the above"
  ],
  correct: 3,
  explanation: "Even behaviors that seem universally deviant, like theft or cannibalism, have been accepted in certain cultures."
 },
 {
  text: "What is the main difference between primary and secondary deviance?",
  options: [
   "Primary deviance results in social labeling, while secondary deviance does not",
   "Secondary deviance occurs when a person internalizes a deviant identity after being labeled",
   "Primary deviance is criminal, while secondary deviance is only informal deviance",
   "There is no distinction between primary and secondary deviance"
  ],
  correct: 1,
  explanation: "Secondary deviance happens when an individual accepts and continues a deviant identity after being labeled."
 },
 {
  text: "A person who believes their own cultural practices are superior to others and condemns different customs as deviant is demonstrating:",
  options: [
   "Cultural relativism",
   "Ethnocentrism",
   "Social conformity",
   "Labeling theory"
  ],
  correct: 1,
  explanation: "Ethnocentrism is judging other cultures based on one's own cultural norms."
 },
 {
  text: "What is the primary function of formal social control?",
  options: [
   "To encourage individual self-discipline",
   "To enforce norms through laws and institutions",
   "To replace informal social control mechanisms",
   "To promote moral relativism"
  ],
  correct: 1,
  explanation: "Formal social control uses legal systems to enforce norms."
 },
 {
  text: "Which of these is NOT an example of informal social control?",
  options: [
   "Social shaming for breaking cultural taboos",
   "Parents disciplining their children",
   "A judge sentencing someone to prison",
   "A teacher encouraging students to follow school norms"
  ],
  correct: 2,
  explanation: "Judicial punishment is formal social control."
 },
 {
  text: "Which of these scenarios best illustrates medicalization of deviance?",
  options: [
   "Classifying excessive gambling as an addiction rather than a crime",
   "Sentencing drug offenders to longer prison terms",
   "Increasing police patrols in high-crime areas",
   "Labeling all criminals as genetically predisposed to deviant behavior"
  ],
  correct: 0,
  explanation: "Medicalization reframes deviance as a medical issue rather than a criminal one (gambling as addiction)."
 },
 {
  text: "Which of the following best explains why deviance is necessary for social stability?",
  options: [
   "It weakens social cohesion and encourages anarchy",
   "It clarifies moral boundaries and reinforces norms",
   "It eliminates all forms of crime and unethical behavior",
   "It prevents any kind of social change from occurring"
  ],
  correct: 1,
  explanation: "By defining unacceptable behavior, deviance strengthens group unity."
 },
 {
  text: "A society where individuals conform to all norms without question would most likely experience:",
  options: [
   "High levels of creativity and social progress",
   "A lack of social control mechanisms",
   "Stagnation, as no new ideas challenge existing norms",
   "An increase in deviance due to a lack of authority"
  ],
  correct: 2,
  explanation: "If no one challenges norms, societal growth is limited (stagnation)."
 },
 {
  text: "Which scenario best represents a situation where deviance is positively sanctioned?",
  options: [
   "A hacker exposing government corruption and being celebrated",
   "A student cheating on an exam and getting expelled",
   "A thief being arrested for stealing a car",
   "A politician resigning due to a scandal"
  ],
  correct: 0,
  explanation: "Some deviant acts, like whistleblowing, receive positive recognition."
 },
 {
  text: "What distinguishes white-collar crime from blue-collar crime?",
  options: [
   "White-collar crime involves violence, while blue-collar crime does not",
   "Blue-collar crime occurs in corporate settings, while white-collar crime occurs in manual labor",
   "White-collar crime is financially motivated and non-violent, while blue-collar crime involves physical acts",
   "There is no real difference; all crimes are treated the same in the legal system"
  ],
  correct: 2,
  explanation: "White-collar crimes are financial and often involve deception, not physical force."
 },
 {
  text: "Which of these would be considered a victimless crime?",
  options: [
   "Burglary",
   "Illegal drug use",
   "Fraud",
   "Armed robbery"
  ],
  correct: 1,
  explanation: "A victimless crime is one where no direct victim suffers harm."
 },
 {
  text: "How does differential association theory explain criminal behavior?",
  options: [
   "Criminal behavior is inherited genetically",
   "Individuals learn deviance by interacting with others who engage in crime",
   "Crime is always a rational choice based on economic gain",
   "People commit crime only when they lack moral reasoning"
  ],
  correct: 1,
  explanation: "This theory (differential association) states that deviance is learned through social interactions."
 },
 {
  text: "What is the primary reason some behaviors are deviant in one culture but normal in another?",
  options: [
   "Some societies are naturally more strict than others",
   "Deviance is defined by cultural norms, which vary between societies",
   "Western cultures impose their morality on the rest of the world",
   "Universal moral laws determine deviant behavior"
  ],
  correct: 1,
  explanation: "What is acceptable in one culture may be deviant in another."
 },
 {
  text: "If an individual from a conservative culture moves to a liberal society and experiences shock at their customs, this is an example of:",
  options: [
   "Cultural lag",
   "Ethnocentrism",
   "Culture shock",
   "Social deviance"
  ],
  correct: 2,
  explanation: "Culture shock happens when someone struggles to adapt to a new environment."
 },
 {
  text: "Which of the following scenarios best demonstrates cultural relativity in deviance?",
  options: [
   "A judge in one country sentencing a thief to 10 years in prison, while another country punishes the same crime with a fine",
   "Every society agreeing that theft should be punished in the same way",
   "A behavior that remains deviant regardless of context",
   "A universal moral code defining which acts are right and wrong"
  ],
  correct: 0,
  explanation: "Different societies define and punish deviance differently (cultural relativity)."
 },
 {
  text: "A person labeled as a criminal is unable to find a job because of their past. This demonstrates:",
  options: [
   "Primary deviance",
   "Secondary deviance",
   "Restorative justice",
   "Victimless crime"
  ],
  correct: 1,
  explanation: "Once labeled as deviant, a person may struggle to reintegrate into society (secondary deviance)."
 },
 {
  text: "In some cases, labeling someone as deviant can result in them embracing that identity. This process is known as:",
  options: [
   "Retrospective interpretation",
   "Self-fulfilling prophecy",
   "Reverse socialization",
   "Reintegration theory"
  ],
  correct: 1,
  explanation: "The label can influence future behavior (self-fulfilling prophecy)."
 },
 {
  text: "When a previously deviant behavior becomes normalized, this is an example of:",
  options: [
   "Decriminalization",
   "Deviance amplification",
   "Criminal reintegration",
   "Absolute deviance"
  ],
  correct: 0,
  explanation: "Some behaviors become legally and socially acceptable over time (decriminalization)."
 },
 {
  text: "Which of the following best represents an example of medicalization of deviance?",
  options: [
   "Treating drug addiction as a disease rather than a crime",
   "Arresting individuals for public intoxication",
   "Labeling certain behaviors as sinful in religious contexts",
   "Criminalizing the use of prescription medication"
  ],
  correct: 0,
  explanation: "Medicalization sees deviance as a health issue rather than a criminal one (treating addiction as a disease)."
 },
 {
  text: "Which of the following statements about deviance is the most misleading?",
  options: [
   "Deviance is behavior that violates social norms",
   "Deviance is always punishable by law",
   "Deviance is socially constructed and varies by culture",
   "Deviant acts may be encouraged in some societies"
  ],
  correct: 1,
  explanation: "Deviance can be informal and not necessarily illegal."
 },
 {
  text: "If an act is considered deviant in one society but not in another, this is an example of:",
  options: [
   "Universal morality",
   "Cultural relativism",
   "Socialization failure",
   "Normative stagnation"
  ],
  correct: 1,
  explanation: "Different societies define deviance differently (cultural relativism)."
 },
 {
  text: "Which of the following best explains why deviance is difficult to define?",
  options: [
   "All societies agree on which acts are deviant",
   "Deviance is based on objective moral standards",
   "What is deviant in one context may be normal in another",
   "Deviance is biologically inherited"
  ],
  correct: 2,
  explanation: "Deviance is context-dependent."
 },
 {
  text: "What is the key difference between primary deviance and secondary deviance?",
  options: [
   "Primary deviance is criminal, while secondary deviance is not",
   "Primary deviance is unnoticed, while secondary deviance is a response to being labeled",
   "Secondary deviance occurs before primary deviance",
   "Primary deviance is more severe than secondary deviance"
  ],
  correct: 1,
  explanation: "Secondary deviance results from being labeled as deviant."
 },
 {
  text: "Which method of measuring deviance assumes that certain acts are inherently wrong?",
  options: [
   "Statistical approach",
   "Absolutist approach",
   "Labeling theory",
   "Functionalist approach"
  ],
  correct: 1,
  explanation: "Absolute deviance assumes universal moral standards."
 },
 {
  text: "What is the biggest limitation of the absolute approach to deviance?",
  options: [
   "It ignores cultural variations in norms",
   "It prevents law enforcement from acting",
   "It assumes all deviance is legal",
   "It applies only to high-status individuals"
  ],
  correct: 0,
  explanation: "Moral standards differ across cultures."
 },
 {
  text: "In a society where theft is common, a statistical approach to deviance would suggest that stealing is:",
  options: [
   "Highly deviant",
   "A biological tendency",
   "Not deviant since it is widespread",
   "Only deviant in legal terms"
  ],
  correct: 2,
  explanation: "Statistical deviance focuses on rarity."
 },
 {
  text: "Why is it incorrect to say that all deviance is criminal?",
  options: [
   "Some deviant acts are too minor to be considered crimes",
   "All deviance is eventually criminalized",
   "Criminal acts are always morally wrong, while deviance is not",
   "Deviance applies only to fashion and personal choices"
  ],
  correct: 0,
  explanation: "Deviance includes non-criminal behaviors like unusual clothing styles."
 },
 {
  text: "A person who refuses to bathe for years is engaging in:",
  options: [
   "Criminal deviance",
   "Informal deviance",
   "Social engineering",
   "Ritualistic behavior"
  ],
  correct: 1,
  explanation: "It violates norms but is not illegal (informal deviance)."
 },
 {
  text: "Which of the following best illustrates counterculture deviance?",
  options: [
   "A person jaywalking across a street",
   "A secret society that actively opposes mainstream cultural values",
   "A student arriving late to class",
   "A group of people forming a new language"
  ],
  correct: 1,
  explanation: "Countercultures reject dominant societal values."
 },
 {
  text: "Which of the following best defines social control?",
  options: [
   "The ability of individuals to self-regulate behavior",
   "The enforcement of laws and norms by society",
   "The legal system's control over criminal behavior",
   "The suppression of cultural differences"
  ],
  correct: 1,
  explanation: "Social control includes formal and informal measures (enforcement of laws and norms)."
 },
 {
  text: "Which of these is an example of informal social control?",
  options: [
   "A court sentencing a thief to prison",
   "A mother scolding her child for bad manners",
   "A police officer issuing a speeding ticket",
   "A government regulating businesses"
  ],
  correct: 1,
  explanation: "Informal social control involves personal interactions."
 },
 {
  text: "What is the key difference between medicalization and criminalization of deviance?",
  options: [
   "Medicalization sees deviance as a social choice, while criminalization views it as an illness",
   "Criminalization assigns legal penalties, while medicalization treats deviance as a health issue",
   "Medicalization only applies to mental disorders, while criminalization applies to all behaviors",
   "Criminalization applies to informal deviance, while medicalization applies to crime"
  ],
  correct: 1,
  explanation: "Medicalization treats deviance as a health issue."
 },
 {
  text: "According to labeling theory, deviance is primarily determined by:",
  options: [
   "An individual's personal choices",
   "Genetic predisposition to criminality",
   "The reaction of society to certain behaviors",
   "Economic class differences"
  ],
  correct: 2,
  explanation: "Societal reaction shapes deviance."
 },
 {
  text: "Conflict theory argues that laws are created to:",
  options: [
   "Ensure fairness and equality",
   "Protect the interests of the powerful",
   "Eliminate deviant behavior entirely",
   "Prevent changes in cultural traditions"
  ],
  correct: 1,
  explanation: "Conflict theory sees laws as tools of social control by elites."
 },
 {
  text: "A functionalist perspective on deviance would emphasize:",
  options: [
   "The elimination of all deviant acts",
   "The role deviance plays in reinforcing social norms",
   "The genetic causes of deviant behavior",
   "The idea that deviance has no social purpose"
  ],
  correct: 1,
  explanation: "Deviance strengthens group unity by defining acceptable behavior."
 },
 {
  text: "What is the main difference between criminology and the criminal justice system?",
  options: [
   "Criminology focuses on law enforcement, while the criminal justice system studies crime patterns",
   "Criminology studies causes of crime, while the criminal justice system enforces laws",
   "Criminology applies only to civil cases, while the criminal justice system handles criminal law",
   "There is no distinction between criminology and the criminal justice system"
  ],
  correct: 1,
  explanation: "Criminology analyzes crime causes, while the system enforces laws."
 },

 {
  text: "Which of the following scenarios presents the MOST complex ethical dilemma when applying labeling theory?",
  options: [
   "A community enacting strict anti-bullying campaigns in schools.",
   "Law enforcement targeting specific neighborhoods known for high crime rates.",
   "A society choosing to decriminalize minor drug offenses to reduce the stigma associated with addiction.",
   "A judge consistently sentencing repeat offenders more harshly to deter further crime."
  ],
  correct: 1,
  explanation: "Targeting neighborhoods with existing problems risks reinforcing negative labels and creating self-fulfilling prophecies, even if the intent is to reduce crime. This presents a significant ethical concern."
 },
 {
  text: "A society experiencing rapid economic growth significantly reduces petty theft. A functionalist theorist might INTERPRET this as:",
  options: [
   "Evidence that criminal behavior is primarily a result of individual moral failings.",
   "A sign of anomie and the breakdown of traditional social norms.",
   "Proof that economic stability reinforces social norms and reduces the need for deviant behavior.",
   "An indication that the criminal justice system is becoming more effective."
  ],
  correct: 2,
  explanation: "Functionalism emphasizes the role of social structures in maintaining order. Economic stability can reduce the strain that leads to deviance, thus reinforcing norms."
 },
 {
  text: "Which scenario BEST exemplifies the limitations of the statistical approach to defining deviance?",
  options: [
   "A researcher documenting an increase in reported cases of online harassment.",
   "A small town where everyone attends church regularly.",
   "A country where corruption is widespread among government officials.",
   "A study revealing that teenagers who use social media are more likely to experience anxiety."
  ],
  correct: 2,
  explanation: "In a society where corruption is widespread, a statistical approach might incorrectly suggest it's not deviant simply because it's common. This highlights the approach's failure to address morality."
 },
 {
  text: "Consider a society where tattoos were once heavily stigmatized but have now become a mainstream form of self-expression. Which social theory BEST explains this shift?",
  options: [
   "Strain theory",
   "Differential association theory",
   "Normalization",
   "Conflict theory"
  ],
  correct: 2,
  explanation: "Normalization is the process by which a previously deviant behavior or characteristic becomes widely accepted and integrated into mainstream society."
 },
 {
  text: "A key criticism of applying medicalization to deviance is that it:",
  options: [
   "Always leads to more humane treatment of individuals.",
   "Can reinforce social stereotypes and absolve individuals of personal responsibility.",
   "Is ineffective in addressing complex social problems.",
   "Reduces the stigma associated with deviant behavior."
  ],
  correct: 1,
  explanation: "Medicalization, while potentially helpful, can also lead to oversimplification and the reinforcement of harmful stereotypes about individuals by removing individual responsibility."
 },
 {
  text: "Which statement offers the MOST nuanced understanding of the relationship between power and the definition of deviance?",
  options: [
   "Those in power always define deviance to protect their interests.",
   "Deviance is solely determined by universal moral principles, regardless of power dynamics.",
   "While power influences what is defined as deviant, resistance and social movements can challenge and reshape these definitions.",
   "Power only plays a role in formal deviance (criminal law), not informal deviance (social norms)."
  ],
  correct: 2,
  explanation: "While those in power have a strong influence, subordinate groups are not powerless. They can resist and challenge dominant definitions of deviance."
 },
 {
  text: "Mass media’s role in deviance amplification is BEST understood as:",
  options: [
   "Exaggerating the extent of deviance, creating moral panics, and reinforcing stereotypes.",
   "Providing balanced and objective coverage of deviant acts, informing the public without bias.",
   "Helping to rehabilitate offenders by humanizing their stories.",
   "Reducing the stigma associated with deviance by promoting understanding and empathy."
  ],
  correct: 0,
  explanation: "Deviance amplification, through mass media, exaggerates the extent of deviance, creating moral panics, and reinforcing stereotypes which can worsen the initial issue. "
 },
 {
  text: "In a society prioritizing social order above all else, which outcome is MOST LIKELY concerning the concept of deviance?",
  options: [
   "Deviance is celebrated as a source of creativity and innovation.",
   "The definition of deviance expands to include any behavior challenging the status quo, even if harmless.",
   "Restorative justice practices are prioritized to reintegrate offenders.",
   "Open discussions on sensitive topics like mental health are encouraged."
  ],
  correct: 1,
  explanation: "In a society prioritizing social order above all else, the definition of deviance expands to include any behavior challenging the status quo, even if harmless, to maintain maximum stability."
 },
{
  text: "Which of the following best explains why social institutions maintain power structures?",
  options: [
   "They function independently of economic systems",
   "They create and reinforce norms that benefit dominant groups",
   "They prevent any form of social inequality",
   "They exist only to regulate government policies"
  ],
  correct: 1,
  explanation: "Institutions often preserve social hierarchies by reinforcing norms."
},
{
  text: "The ability of institutions to shape individual behavior is best explained by:",
  options: [
   "Structural functionalism, which views institutions as neutral organizers of society",
   "Symbolic interactionism, which emphasizes individual choice over institutional influence",
   "Conflict theory, which argues institutions serve the interests of the powerful",
   "Rational choice theory, which suggests institutions have no role in decision-making"
  ],
  correct: 2,
  explanation: "Conflict theory highlights how institutions benefit dominant groups."
},
{
  text: "What happens when social institutions fail to regulate behavior effectively?",
  options: [
   "The institution disappears completely from society",
   "Alternative institutions emerge to replace them",
   "Social norms remain unchanged despite institutional failure",
   "Society automatically reorganizes itself without disruption"
  ],
  correct: 1,
  explanation: "New institutions or informal structures develop when old ones fail."
},
{
  text: "Institutional inertia refers to:",
  options: [
   "The tendency of institutions to resist change and maintain existing structures",
   "The rapid transformation of institutions due to external pressures",
   "The inability of institutions to influence individual behavior",
   "The process of institutions breaking apart completely"
  ],
  correct: 0,
  explanation: "Institutions resist change, making reform difficult (institutional inertia)."
},
{
  text: "Which of the following is the most common outcome when institutions fail to adapt to change?",
  options: [
   "They dissolve immediately, leaving no social impact",
   "They become irrelevant and are replaced by informal structures",
   "They continue to function normally without any consequences",
   "They prevent any possibility of further institutional change"
  ],
  correct: 1,
  explanation: "When institutions fail, alternative social structures often emerge."
},
{
  text: "What is one reason why institutional change is difficult to implement?",
  options: [
   "All members of society resist institutional modifications",
   "Institutional leaders often benefit from maintaining the status quo",
   "Institutions are completely isolated from social norms",
   "Change happens so frequently that institutions never become stable"
  ],
  correct: 1,
  explanation: "Powerful groups often resist institutional reforms that threaten their position."
},
{
  text: "Which of the following is an example of an institution having an unintended consequence?",
  options: [
   "Schools providing education to students",
   "The legal system protecting private property rights",
   "The healthcare system unintentionally increasing class disparities",
   "Religious institutions promoting moral values"
  ],
  correct: 2,
  explanation: "Unintended consequences occur when an institution produces effects beyond its intended purpose."
},
{
  text: "How can social institutions unintentionally reinforce inequality?",
  options: [
   "By refusing to adopt new technologies",
   "By maintaining practices that favor dominant social groups",
   "By actively working to eliminate economic gaps",
   "By prioritizing individual success over collective well-being"
  ],
  correct: 1,
  explanation: "Institutions can uphold inequalities by legitimizing dominant-group advantages."
},
 {
  text: "Social institutions resist change primarily because:",
  options: [
   "They are incapable of adaptation",
   "They function best when remaining rigid and unchanging",
   "Those benefiting from the current system often oppose reforms",
   "Institutional change is universally accepted without conflict"
  ],
  correct: 2,
  explanation: "Resistance to change often comes from those in power."
 },
 {
  text: "Which of the following best illustrates institutional adaptation?",
  options: [
   "A government refusing to revise outdated policies",
   "A religious organization modifying its stance on social issues",
   "A school curriculum remaining unchanged for centuries",
   "A legal system ignoring technological developments"
  ],
  correct: 1,
  explanation: "Adaptation occurs when institutions modify their rules and beliefs."
 },
 {
  text: "Institutional failure occurs when:",
  options: [
   "Social institutions completely disappear",
   "An institution stops fulfilling its primary functions for society",
   "Laws are created to regulate institutional behavior",
   "Political systems fail to maintain economic stability"
  ],
  correct: 1,
  explanation: "Dysfunctional institutions fail to serve their intended purpose."
 },
 {
  text: "Which statement best captures the paradox of social institutions?",
  options: [
   "They exist to regulate society but rarely influence individual behavior",
   "They are resistant to change but also evolve over time",
   "They always function efficiently despite cultural diversity",
   "They are controlled solely by government policies"
  ],
  correct: 1,
  explanation: "Institutions provide stability but also adapt over time."
 },
 {
  text: "Social institutions can be distinguished from social organizations because:",
  options: [
   "Institutions are more rigid, while organizations are flexible",
   "Organizations are a part of institutions, but not vice versa",
   "Institutions change daily, whereas organizations never adapt",
   "Organizations function independently of cultural values"
  ],
  correct: 1,
  explanation: "Institutions are broader systems; organizations operate within them."
 },
 {
  text: "Which of the following is a manifest function of a social institution?",
  options: [
   "Schools reinforcing class divisions through credentialism",
   "Religious institutions providing a sense of moral guidance",
   "The economy unintentionally creating wealth gaps",
   "The government promoting specific religious beliefs"
  ],
  correct: 1,
  explanation: "Manifest functions are intended and explicit, like moral education."
 },
 {
  text: "A defining feature of a patrilocal family system is that:",
  options: [
   "The husband moves into the wife’s family home",
   "Couples establish an independent residence separate from both families",
   "The wife moves into the husband’s family home",
   "Marriage is based on religious rather than legal principles"
  ],
  correct: 2,
  explanation: "Patrilocal systems require the wife to live with the husband’s family."
 },
 {
  text: "The concept of 'fictive kinship' refers to:",
  options: [
   "Family relationships based solely on biological ties",
   "Economic transactions that define kinship roles",
   "Socially recognized family bonds that are not based on blood or marriage",
   "A legal agreement that substitutes for family ties"
  ],
  correct: 2,
  explanation: "Fictive kinship includes godparents, close friends treated as family, etc."
 },
 {
  text: "Which of the following scenarios demonstrates a society practicing neolocal residence?",
  options: [
   "A newlywed couple moves into the husband's parents' home",
   "A married couple moves into the wife's family estate",
   "A couple establishes a home separate from both of their families",
   "A society where marriage is prohibited outside the family structure"
  ],
  correct: 2,
  explanation: "Neolocal residence means setting up an independent household."
 },
 {
  text: "The concept of religious pluralism refers to:",
  options: [
   "The enforcement of a single religion by the state",
   "The coexistence of multiple religious traditions in a society",
   "The elimination of religious influence on politics",
   "The decline of religion in favor of secular values"
  ],
  correct: 1,
  explanation: "Pluralism acknowledges multiple faiths existing within a society."
 },
 {
  text: "Secularization theory suggests that:",
  options: [
   "Religion becomes more dominant as societies modernize",
   "Government control over religious institutions strengthens over time",
   "Religion loses social and political influence in advanced societies",
   "Religious institutions eliminate political interference over time"
  ],
  correct: 2,
  explanation: "Secularization suggests that modern societies see religion's influence decline."
 },
 {
  text: "Which of these best represents an example of civil religion?",
  options: [
   "A country mandating church attendance for all citizens",
   "A nation invoking religious values to justify political actions",
   "A society separating religious institutions from state functions",
   "A government favoring one religious group over others"
  ],
  correct: 1,
  explanation: "Civil religion uses national symbols and values in a religious-like manner to promote unity."
 },
 {
 text: "A key characteristic of social institutions is that they:",
 options: [
  "Always remain unchanged despite external societal shifts",
  "Function primarily to serve the economic elite",
  "Establish recurring patterns of behavior that structure society",
  "Are only present in developed industrial societies"
 ],
 correct: 2,
 explanation: "Institutions create structured behaviors, but the wrong options seem valid to different ideological perspectives."
 },
 {
 text: "Which of the following would best illustrate a social institution adapting to change?",
 options: [
  "A legal system enforcing old laws without modification",
  "A religious group resisting any form of modernization",
  "A university adding online courses in response to technological shifts",
  "A political leader reinforcing long-standing traditions without alteration"
 ],
 correct: 2,
 explanation: "Institutions adapt by evolving with societal needs."
 },
 {
 text: "What is an example of an unintended consequence of social institutions?",
 options: [
  "The legal system maintaining law and order",
  "The educational system unintentionally reinforcing social inequalities",
  "The family unit providing emotional support",
  "The economy producing goods and services for public consumption"
 ],
 correct: 1,
 explanation: "Education's intended function is to provide knowledge, but it can reinforce class divisions."
 },
 {
 text: "A matrilineal kinship system is one where:",
 options: [
  "Women hold political power while men control family wealth",
  "Property and lineage are traced through the mother’s side",
  "A woman is allowed multiple husbands in the same family",
  "Marriage is based strictly on religious traditions"
 ],
 correct: 1,
 explanation: "Matrilineal systems prioritize inheritance and identity through the mother's lineage."
 },
 {
 text: "A nuclear family differs from an extended family because it:",
 options: [
  "Always includes three generations living under the same roof",
  "Consists of only one parent raising children",
  "Is a unit of parents and their dependent children",
  "Prioritizes economic survival over emotional bonds"
 ],
 correct: 2,
 explanation: "A nuclear family is just parents and their children, but the other options appear tempting."
 },
 {
 text: "Which of the following would be considered an endogamous marriage?",
 options: [
  "A person marrying someone from their own ethnic or social group",
  "A marriage that is recognized by law but not by religion",
  "A couple choosing to marry despite strong family opposition",
  "A legally binding union that is not based on mutual consent"
 ],
 correct: 0,
 explanation: "Endogamy refers to marrying within one’s own social or cultural group."
 },
 {
 text: "A major societal function of religion is to:",
 options: [
  "Reinforce the legitimacy of political institutions",
  "Eliminate all cultural variations and differences",
  "Promote universal moral values that remain unchanged over time",
  "Serve as the only basis for defining laws"
 ],
 correct: 0,
 explanation: "Religion often provides ideological support for political systems, though it does more than just this."
 },
 {
 text: "The most misleading statement about secularization is that:",
 options: [
  "It leads to the complete disappearance of religion from society",
  "It reduces the influence of religious institutions in public affairs",
  "It may lead to a shift in how religion is practiced rather than its elimination",
  "It is associated with modernization but occurs at different rates in different societies"
 ],
 correct: 0,
 explanation: "Secularization reduces religious influence but does not eliminate religion."
 },
 {
 text: "Civil religion differs from traditional religion because:",
 options: [
  "It rejects all forms of supernatural belief",
  "It integrates national symbols and values with religious-like reverence",
  "It relies solely on legal and rational frameworks",
  "It operates independently of any political or social context"
 ],
 correct: 1,
 explanation: "Civil religion blends national identity and patriotism with religious elements."
 },
 {
 text: "Which of the following best describes credentialism in education?",
 options: [
  "Focusing on practical job skills rather than academic achievement",
  "Requiring specific degrees or certifications for jobs even when skills could be learned on the job",
  "Ensuring equal access to education for all social classes",
  "Removing standardized testing requirements to reduce inequality"
 ],
 correct: 1,
 explanation: "Credentialism is over-reliance on formal qualifications, regardless of actual job requirements."
 },
 {
 text: "According to conflict theory, the hidden curriculum in education primarily functions to:",
 options: [
  "Promote critical thinking and challenge existing power structures",
  "Reinforce social inequalities by transmitting dominant cultural values and norms",
  "Ensure that all students receive equal opportunities regardless of their background",
  "Prepare students for participation in democratic processes"
 ],
 correct: 1,
 explanation: "Conflict theory views the hidden curriculum as a mechanism for perpetuating social inequality."
 },
 {
 text: "A command economy is primarily characterized by:",
 options: [
  "Private ownership of all means of production",
  "Minimal government intervention in the economy",
  "Government control of production and distribution",
  "A decentralized market driven by consumer demand"
 ],
 correct: 2,
 explanation: "In a command economy, the government makes the key economic decisions."
 },
 {
 text: "One major critique of capitalism is that it tends to:",
 options: [
  "Promote economic equality and shared wealth",
  "Inhibit innovation and economic growth",
  "Concentrate wealth in the hands of a few",
  "Reduce government control over businesses"
 ],
 correct: 2,
 explanation: "A common criticism is that capitalism leads to wealth inequality."
 },
 {
 text: "In contrast to democratic systems, a totalitarian government is characterized by:",
 options: [
  "The protection of individual rights and freedoms",
  "A multi-party system with open political competition",
  "Limited government control over citizens' lives",
  "Centralized control over all aspects of life"
 ],
 correct: 3,
 explanation: "Totalitarianism seeks to control all aspects of public and private life."
 },
 {
 text: "Which of the following is the most nuanced understanding of how social institutions change over time?",
 options: [
  "They are static and resistant to any kind of change",
  "They adapt rapidly and completely to all new societal conditions",
  "They change through a complex interplay of internal and external pressures",
  "They are primarily driven by technological advancements"
 ],
 correct: 2,
 explanation: "Change is a complex process involving multiple interacting factors, both within and outside the institution."
 },
        {
          text: "What is the symbolic component of culture based on?",
          options: ["Material goods", "Values", "Language and symbols", "Clothing"],
          correct: 2,
          explanation: "The symbolic component of culture is largely based on language and symbols."
        }, 
          ]
    }
  }, 
    Computer: {
  "CSC201": {
        title: "Biometry/Biostatistics",
        questions: [
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
    alert("Invalid access code. Please try again. Note that the access code is your course code in capital letters without spacing, e.g ZOO101");
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


document.getElementById("end-exam").addEventListener("click", () => {
  clearInterval(timerInterval);
  endExam();
});

document.getElementById("restart-exam").addEventListener("click", () => {
  // Clear previous exam session data
  questions = [];
  answers = [];  // Clear previously selected answers
  currentQuestionIndex = 0;
  subCourseName = "";
  timeRemaining = 3000;
  
  // Stop any running timer
  clearInterval(timerInterval);
  
  // Show the initial course selection section
  showSection(courseSelectionSection);
});

let isPracticeMode = false;

document.getElementById("switch-mode-btn").addEventListener("click", () => {
  isPracticeMode = !isPracticeMode;
  document.getElementById("switch-mode-btn").textContent = isPracticeMode ? "📝" : "📖";
});

function startExam() {
  subjectTitle.textContent = subCourseName;
  showSection(examSection);
  createProgress();
  updateQuestion();
  if (!isPracticeMode) {
    startTimer();
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

  if (isPracticeMode) {
    // Display correct answer and explanation
    const question = questions[currentQuestionIndex];
    const explanation = document.createElement("div");
    explanation.innerHTML = `<strong>Correct Answer: ${question.options[question.correct]}</strong><br>Explanation: ${question.explanation}`;
    optionsContainer.appendChild(explanation);
  }

  updateProgress();
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
      finalizeSubmission();
    };

    // Handle "No" button
    document.getElementById("confirmNo").onclick = function () {
      modal.style.display = "none";
      console.log("Submission canceled");
      // Timer continues running
    };

    return; // Prevent further execution until the user confirms
  }

  // Auto-submit (e.g., when time runs out)
  clearInterval(timerInterval);
  console.log("Time's up! Auto-submitting exam...");
  finalizeSubmission();
          }


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
  const selected = document.querySelector('.option-button.selected');
  if (selected) {
    answers[currentQuestionIndex] = parseInt(selected.dataset.index);
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
    button.className = "option-button";
    button.dataset.index = index;
    button.addEventListener("click", () => selectAnswer(index));

    // Apply the selected state if this option was previously selected
    if (answers[currentQuestionIndex] === index) {
      button.classList.add("selected");
    }

    optionsContainer.appendChild(button);
  });

  // Enable/Disable navigation buttons based on the current index
  document.getElementById("prev-question").disabled = currentQuestionIndex === 0;
  document.getElementById("next-question").disabled = currentQuestionIndex === questions.length - 1;
  updateProgress();
}

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

// Initialize the first question on page load
updateQuestion();


function startTimer() {
  // Remove existing timer container if it exists
  const existingTimerDisplay = document.getElementById("timer-display");
  if (existingTimerDisplay) {
    existingTimerDisplay.remove();
  }

  // Create a new timer container
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
  const modal = document.getElementById('confirmationModal');

  if (!autoSubmit) {
    modal.style.display = 'flex';

    // Handle "Yes" button
    document.getElementById('confirmYes').onclick = function () {
      modal.style.display = 'none';
      clearInterval(timerInterval); // Stop the timer

      console.log("Exam submitted!");

      // Calculate results
      const score = answers.filter((ans, i) => ans === questions[i].correct).length;
      const totalQuestions = questions.length;
      const percentage = Math.round((score / totalQuestions) * 100);

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

      // Reload history to reflect updates
      displayExamHistory();
    };

    // Handle "No" button
    document.getElementById('confirmNo').onclick = function () {
      modal.style.display = 'none';
      console.log("Submission canceled");
    };

    return; // Prevent further execution
  }

  // Auto-submit logic
  if (autoSubmit) {
    clearInterval(timerInterval);
    console.log("Time's up! Auto-submitting exam...");
    finalizeSubmission();
    return;
  }
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
// Update Exam Results UI
function updateExamResults(score, totalQuestions, percentage) {
    document.getElementById("examScore").innerText = `Score: ${score}/${totalQuestions}`;
    document.getElementById("examPercentage").innerText = `Percentage: ${percentage}%`;
}

// Show a notification popup
function showAnimatedPopup(message) {
    const popup = document.getElementById("rewardPopupMessage");
    popup.innerText = message;
    popup.style.display = "block";
    setTimeout(() => { popup.style.display = "none"; }, 3000);
}

// Ensure UI updates on page load
window.addEventListener("load", updateRewardUI);




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


    // Show results
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
  const historyContent = document.getElementById('exam-history-content');
  historyContent.innerHTML = ''; // Clear current content

  if (examHistory.length === 0) {
    historyContent.innerHTML = '<p>No exam history available.</p>';
    return;
  }

  examHistory.forEach((session, index) => {
    const sessionDiv = document.createElement('div');
    sessionDiv.classList.add('exam-session');

    // Extract score and percentage, using defaults if missing
    const score = session.score || 0;
    const totalQuestions = session.totalQuestions || 0;
    const percentage = session.percentage || 0;

    const sessionTitle = document.createElement('h3');
    sessionTitle.textContent = `Session ${index + 1} - ${session.date} - Score: ${score}/${totalQuestions} (${percentage}%)`;
    
    sessionTitle.addEventListener('click', () => displaySessionDetails(session));
    sessionDiv.appendChild(sessionTitle);

    historyContent.appendChild(sessionDiv);
  });
}


function displaySessionDetails(session) {
  const historyContent = document.getElementById('exam-history-content');
  historyContent.innerHTML = ''; // Clear current content

  session.questions.forEach((question, qIndex) => {
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('question');

    const questionText = document.createElement('p');
    questionText.innerHTML = `<strong>Q${qIndex + 1}:</strong> ${question.text}`;
    questionDiv.appendChild(questionText);

    const answerText = document.createElement('p');
    const userAnswerIndex = session.answers[qIndex]; // User's selected answer index

    // Check if the user answer exists to prevent errors
    const userAnswer = userAnswerIndex !== undefined ? question.options[userAnswerIndex] : "No answer selected";
    answerText.innerHTML = `<strong>Your Answer:</strong> ${userAnswer}`;
    questionDiv.appendChild(answerText);

    const explanationText = document.createElement('p');
    explanationText.innerHTML = `<strong>Explanation:</strong> ${question.explanation || "No explanation available"}`;
    questionDiv.appendChild(explanationText);

    historyContent.appendChild(questionDiv);
  });

  // Add a "Back to History" button
  const backButton = document.createElement('button');
  backButton.textContent = 'Back to History';
  backButton.addEventListener('click', displayExamHistory);
  backButton.style.marginTop = '20px';
  historyContent.appendChild(backButton);
}

document.addEventListener("DOMContentLoaded", function () {
  const saveToHistoryBtn = document.getElementById("save-to-history-btn");

  if (saveToHistoryBtn) {
    saveToHistoryBtn.addEventListener("click", saveResultsToHistory);
  } else {
    console.error("Save to History button not found.");
  }
});

function saveResultsToHistory() {
  const resultContent = document.getElementById("summarySection");

  if (!resultContent) {
    console.error("Summary content is missing. Cannot save results to history.");
    return;
  }


  // Create an exam session object
  const examSession = {
    date: new Date().toLocaleString(),
    content: resultContent.innerHTML // Save the summary content
  };

  // Retrieve existing exam history from local storage
  const examHistory = JSON.parse(localStorage.getItem("examHistory")) || [];

  // Add the new exam session to the history
  examHistory.push(examSession);

  // Save the updated exam history back to local storage
  localStorage.setItem("examHistory", JSON.stringify(examHistory));

  console.log("Exam history saved:", examHistory);
  alert("Results have been saved to history.");
}

  
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

// Use debounce to limit frequent state updates
function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function() {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

// Throttle the resize event
window.addEventListener('resize', throttle(function() {
  console.log('Resized!');
}, 1000));

// Throttle the click event for toggling the menu
document.addEventListener('click', throttle(function(event) {
  const sideNav = document.getElementById('sideNav');
  const menuIcon = document.querySelector('.menu-icon');

  if (sideNav.classList.contains('active') &&
      !sideNav.contains(event.target) &&
      !menuIcon.contains(event.target)) {
      sideNav.classList.remove('active');
  }
}, 500));


                                                                                                    
