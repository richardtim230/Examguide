// Array of article titles and corresponding images for different times
const scheduleNotifications = [
    { time: "6:00 AM", title: "Wake up and morning routine", image: "morning.jpg" },
    { time: "7:00 AM", title: "Time for Breakfast", image: "breakfast.jpg" },
    { time: "8:00 AM", title: "First study session", image: "study1.jpg" },
    { time: "10:00 AM", title: "Short break", image: "break.jpg" },
    { time: "10:15 AM", title: "Second study session", image: "study2.jpg" },
    { time: "12:00 PM", title: "Lunch break", image: "lunch.jpg" },
    { time: "1:00 PM", title: "Third study session", image: "study3.jpg" },
    { time: "3:00 PM", title: "Short break", image: "break.jpg" },
    { time: "3:15 PM", title: "Fourth study session", image: "study4.jpg" },
    { time: "5:00 PM", title: "Rest and leisure time", image: "rest.jpg" },
    { time: "6:00 PM", title: "Dinner", image: "dinner.jpg" },
    { time: "7:00 PM", title: "Fifth study session", image: "study5.jpg" },
    { time: "8:30 PM", title: "Short break", image: "break.jpg" },
    { time: "9:15 PM", title: "Review and recap session", image: "review.jpg" },
    { time: "10:00 PM", title: "Relax and wind down", image: "relax.jpg" },
    { time: "10:30 PM", title: "Sleep", image: "sleep.jpg" }
];

// Check if the browser supports notifications and service workers
if ("Notification" in window && "serviceWorker" in navigator) {
    console.log("Browser supports notifications and service workers.");
    // Register the service worker
    navigator.serviceWorker.register('/service-worker.js')
    .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
        // Request notification permission from the user
        Notification.requestPermission().then(permission => {
            console.log(`Notification permission: ${permission}`);
            if (permission === "granted") {
                scheduleDailyNotifications();
                checkMissedNotifications(); // Check for missed notifications
                setInterval(checkMissedNotifications, 60000); // Check every minute
            }
        });
    })
    .catch(error => {
        console.log('Service Worker registration failed:', error);
    });
} else {
    console.error("Browser does not support notifications or service workers.");
}

// Function to schedule daily notifications
function scheduleDailyNotifications() {
    console.log("Scheduling daily notifications...");

    scheduleNotifications.forEach(notification => {
        const [hour, minute] = notification.time.split(/[: ]/).map(Number);
        scheduleNotification(hour, minute, 0, notification);
    });
}

// Function to schedule a notification at the specified hour, minute, and second
function scheduleNotification(hour, minute, second, article) {
    const now = new Date();
    const notificationTime = new Date();

    notificationTime.setHours(hour, minute, second, 0);

    // If time has already passed today, set for the next day
    if (now.getTime() > notificationTime.getTime()) {
        notificationTime.setDate(now.getDate() + 1);
    }

    const timeout = notificationTime.getTime() - now.getTime();
    console.log(`Scheduling notification at ${notificationTime} with a timeout of ${timeout} ms.`);

    const notificationData = {
        time: notificationTime.getTime(),
        article: article
    };

    // Store the notification in local storage
    const notifications = JSON.parse(localStorage.getItem('scheduledNotifications')) || [];
    notifications.push(notificationData);
    localStorage.setItem('scheduledNotifications', JSON.stringify(notifications));

    setTimeout(() => {
        showNotification(article);
        // Remove the notification from local storage after showing it
        removeNotificationFromStorage(notificationTime.getTime());
    }, timeout);
}

// Function to show the notification
function showNotification(article) {
    console.log(`Showing notification: ${article.title}`);

    // Send push notification through the service worker
    navigator.serviceWorker.ready.then(registration => {
        console.log("Sending notification through service worker...");
        registration.showNotification("QUICK REMINDER", {
            body: article.title,
            icon: "logo.png", // Optional: Path to an icon image
            image: article.image // Image to display in the notification
        });
    }).catch(error => {
        console.error("Service Worker is not ready:", error);
    });
}

// Function to remove a notification from local storage after it has been shown
function removeNotificationFromStorage(notificationTime) {
    const notifications = JSON.parse(localStorage.getItem('scheduledNotifications')) || [];
    const updatedNotifications = notifications.filter(notification => notification.time !== notificationTime);
    localStorage.setItem('scheduledNotifications', JSON.stringify(updatedNotifications));
}

// Function to check for missed notifications
function checkMissedNotifications() {
    const now = Date.now();
    const notifications = JSON.parse(localStorage.getItem('scheduledNotifications')) || [];

    const remainingNotifications = notifications.filter(notification => {
        if (notification.time <= now) {
            showNotification(notification.article);
            return false;
        }
        return true;
    });

    localStorage.setItem('scheduledNotifications', JSON.stringify(remainingNotifications));
}

// Function to load the article based on the URL's article ID parameter or fragment
function loadArticle() {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('article') || window.location.hash.substring(1);
    if (articleId) {
        const articleElement = document.getElementById(articleId);
        if (articleElement) {
            articleElement.style.display = 'block';
            // Update the URL to include the article title
            const title = articleElement.getAttribute('data-title');
            history.pushState(null, '', `${window.location.pathname}#${title}`);
        } else {
            console.error(`Article with ID '${articleId}' not found.`);
        }
    }
}

// Call the function to load the article when the page loads
window.onload = loadArticle;

function copyLink(articleId) {
    const article = document.getElementById(articleId);
    const url = window.location.href.split('#')[0] + '#' + articleId;
    navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard');
    });
}

function getArticleMeta(articleId) {
    const article = document.getElementById(articleId);
    const date = article.querySelector('.article-date').textContent;
    const time = article.querySelector('.article-time').textContent;
    const title = article.querySelector('h2').textContent;
    const url = window.location.href.split('#')[0] + '#' + articleId;

    // Extract the first passage
    const firstPassage = article.querySelector('p').textContent;

    // Customize the message format here
    return `🌟 *${title}* 🌟\n🗓️ Published on: ${date} at ${time}\n\n${firstPassage}\n\n🔗 Read more: ${url}\n\n🔥 Discover more exciting content on our website!`;
}

function shareWhatsApp(articleId, event) {
    event.preventDefault();
    const meta = getArticleMeta(articleId);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(meta)}`;
    window.open(url, '_blank');
}

function shareFacebook(articleId, event) {
    event.preventDefault();
    const meta = getArticleMeta(articleId);
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(meta)}`;
    window.open(url, '_blank');
}

function shareInstagram(articleId, event) {
    event.preventDefault();
    // Instagram does not support direct sharing via URL, so we redirect to Instagram's website
    const meta = getArticleMeta(articleId);
    alert(`Instagram does not support direct sharing. Copy the following text and share it on Instagram:\n\n${meta}`);
}

function shareTelegram(articleId, event) {
    event.preventDefault();
    const meta = getArticleMeta(articleId);
    const url = `https://telegram.me/share/url?url=${encodeURIComponent(meta)}`;
    window.open(url, '_blank');
}

function toggleMenu() {
    const menu = document.querySelector('.menu-container');
    const button = document.querySelector('.menu-button');
    menu.classList.toggle('menu-open');
    button.classList.toggle('open');
}

document.addEventListener('DOMContentLoaded', (event) => {
    const articles = document.querySelectorAll('.blog-post');
    const headers = document.querySelectorAll('.blog-post h2');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    let currentPage = parseInt(localStorage.getItem('currentPage')) || 1; // Retrieve saved page or default to 1
    const articlesPerPage = 2;

    function showPage(page) {
        const start = (page - 1) * articlesPerPage;
        const end = start + articlesPerPage;
        let count = 0;

        articles.forEach((article, index) => {
            const headerIndex = Array.from(headers).indexOf(article.querySelector('h2'));
            if (headerIndex >= start && headerIndex < end && count < articlesPerPage) {
                article.style.display = 'block';
                count++;
            } else {
                article.style.display = 'none';
            }
        });
    }

    function updateButtons() {
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage * articlesPerPage >= headers.length;
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            localStorage.setItem('currentPage', currentPage); // Save current page
            location.reload(); // Reload the page
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage * articlesPerPage < headers.length) {
            currentPage++;
            localStorage.setItem('currentPage', currentPage); // Save current page
            location.reload(); // Reload the page
        }
    });

    // Initialize the page
    showPage(currentPage);
    updateButtons();
    scrollToTop(); // Scroll to top after initializing
});

document.addEventListener("DOMContentLoaded", function() {
    let slider = document.querySelector(".slider");
    let index = 0;

    // Automatic slider transition
    setInterval(() => {
        index++;
        if (index > 2) index = 0;
        slider.style.transform = `translateX(-${index * 90}%)`;
    }, 3000);

    // News section - one at a time
    let newsItems = document.querySelectorAll(".news-item");
    let newsIndex = 0;

    setInterval(() => {
        newsItems.forEach(item => item.classList.remove("active"));
        newsItems[newsIndex].classList.add("active");

        newsIndex++;
        if (newsIndex >= newsItems.length) {
            newsIndex = 0;
        }
    }, 5000);
});

// Open Modal
function openModal(imgElement) {
    var modal = document.getElementById("imageModal");
    var modalImg = document.getElementById("modalImage");
    modal.style.display = "block";
    modalImg.src = imgElement.src;
    modalImg.style.width = imgElement.naturalWidth + "px";
    modalImg.style.height = imgElement.naturalHeight + "px";
}

// Close Modal
function closeModal() {
    var modal = document.getElementById("imageModal");
    modal.style.display = "none";
}

// Show More Images
function showMoreImages() {
    var galleryItems = document.querySelectorAll('.gallery-item');
    var showMoreBtn = document.getElementById('showMoreBtn');
    galleryItems.forEach((item, index) => {
        if (index >= 4) {
            item.style.display = 'block';
        }
    });
    showMoreBtn.style.display = 'none';
}

// Initial setup to limit gallery items to 4
document.addEventListener('DOMContentLoaded', () => {
    var galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach((item, index) => {
        if (index >= 4) {
            item.style.display = 'none';
        }
    });
});
