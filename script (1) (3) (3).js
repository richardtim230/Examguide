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

document.addEventListener("DOMContentLoaded", function () {
    const authSection = document.getElementById("login-box");
    const registerSection = document.getElementById("register-box");

    function showLogin() {
        authSection.classList.remove("hidden");
        registerSection.classList.add("hidden");
        window.history.pushState({}, "", "/login-studentsApp"); // Update URL without reloading
    }

    function showRegister() {
        authSection.classList.add("hidden");
        registerSection.classList.remove("hidden");
        window.history.pushState({}, "", "/register-studentsApp"); // Update URL without reloading
    }

    document.getElementById("register-btn").addEventListener("click", showRegister);
    document.getElementById("back-to-login").addEventListener("click", showLogin);

    // Check current URL and show the correct section
    if (window.location.pathname === "/register-studentsApp") {
        showRegister();
    } else {
        showLogin();
    }
});

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('myAppDatabase', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('myStore', { keyPath: 'id' });
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

function saveData(data) {
  openDatabase().then(db => {
    const transaction = db.transaction('myStore', 'readwrite');
    const store = transaction.objectStore('myStore');
    store.put(data);
  }).catch(error => {
    console.error('Error saving data', error);
  });
}

function getData(id) {
  return new Promise((resolve, reject) => {
    openDatabase().then(db => {
      const transaction = db.transaction('myStore', 'readonly');
      const store = transaction.objectStore('myStore');
      const request = store.get(id);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  });
}

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
    questionText.innerHTML = `<strong>Q${qIndex + 1}:</strong> ${question.text.replace(/\n/g, '<br>')}`;
    questionDiv.appendChild(questionText);

    // Display options
    const optionsList = document.createElement('ul');
    question.options.forEach((option, index) => {
      const optionItem = document.createElement('li');
      optionItem.textContent = option;

      // Highlight user's answer and correct answer
      if (session.answers[qIndex] === index) {
        optionItem.style.color = 'red'; // User's answer
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
    explanationText.innerHTML = `<strong>Explanation:</strong> <em>${question.explanation.replace(/\n/g, '<br>') || 'No explanation available'}</em>`;
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

  const activeUserIDs = ["OAU-dlvLS", "OAU-YTA7h", "OAU-OBdO1", "OAU-YTA7h", "OAU-2GXnM", "OAU-3Loap", "OAU-P5nJv", "OAU-h11Pq", "OAU-fGSUo", "OAU-PZ5Tj", "OAU-4jGzj", "OAU-zXQI5", "OAU-Hjf0x", "OAU-8rBBf", "XR0QEV", "OAU-r55Vp", "OAU-Hjf0x", "OAU-wgUFd", "9KPGWE", "OAU-Lmgw1", "OAU-YTA7h", "OAU-Vqd4v", "OAU-4IE79", "MQZiX", "OAU-4fL7Y", "OAU-hIvUm", "OAU-zA5yW", "OAU-pzss7", "OAU-HydrS", "OAU-PZ5Tj", "OAU-2ZlVX", "C4BVOZ", "OAU-2ZIVX", "OAU-pPKoh", "OAU-sTXn4", "9KPGWE", "OAU-gn5H1", "OAU-wQUVg", "OAU-yPb1k", "OAU-J74GF", "OAU-RDOyh", "OAU-ztclb", "3XHF8Z",  "OAU-HkCcs", "OAU-2iTtz", "OAU-Yw4iq", "OAU-HkCcs", "OAU-W3Ldz", "OAU-FG3JH", "OAU-JL36e", "OAU-xupDN", "OAU-a19AX", "OAU-HkCcs", "OAU-iM1rP", "OAU-yPb1k", "OAU-Mafoa", "OAU-Yw4iq", "OAU-ustAs"];
  const morningMessages = ["Good morning", "Rise and Shine", "Hello! How was your night?", 
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
}
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
  const formattedText = question.text.replace(/\n/g, '<br>');
  questionText.innerHTML = `<h3>Que ${currentQuestionIndex + 1}: ${formattedText}</h3>`;
  
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
  questionText.innerHTML = `<h3>Que ${currentQuestionIndex + 1}: ${question.text.replace(/\n/g, '<br>')}</h3>`;
  
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
        ${i + 1}. ${q.text.replace(/\n/g, '<br>')} <br>
        Your Answer: <strong> ${q.options[answers[i]] || "Unanswered"} </strong><br><br>
        <strong> Correct Answer: ${q.options[q.correct]} </strong><br><br>
       <strong> Explanation:</strong> ${q.explanation.replace(/\n/g, '<br>')} <br><br><br>
      </p>`
      )
      .join("")}
  `;
}


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


                                                                                                    
