function updateMetaTags(articleId) {
    const article = document.getElementById(articleId);
    const title = article.querySelector('h2').innerText;
    const description = article.querySelector('.article-content p').innerText;
    const image = article.querySelector('img').src;
    const url = window.location.href.split('#')[0] + '#' + articleId;

    // Update Open Graph meta tags
    document.getElementById('og-title').setAttribute('content', title);
    document.getElementById('og-description').setAttribute('content', description);
    document.getElementById('og-image').setAttribute('content', image);
    document.getElementById('og-url').setAttribute('content', url);

    // Update Twitter Card meta tags
    document.getElementById('twitter-title').setAttribute('content', title);
    document.getElementById('twitter-description').setAttribute('content', description);
    document.getElementById('twitter-image').setAttribute('content', image);
}

function shareWhatsApp(articleId, event) {
    event.preventDefault();
    updateMetaTags(articleId);
    const url = window.location.href.split('#')[0] + '#' + articleId;
    window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank');
}

function shareFacebook(articleId, event) {
    event.preventDefault();
    updateMetaTags(articleId);
    const url = window.location.href.split('#')[0] + '#' + articleId;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
}

function shareInstagram(articleId, event) {
    event.preventDefault();
    updateMetaTags(articleId);
    const url = window.location.href.split('#')[0] + '#' + articleId;
    // Instagram does not have direct sharing via URL, you might need to handle this differently
}

function shareTelegram(articleId, event) {
    event.preventDefault();
    updateMetaTags(articleId);
    const url = window.location.href.split('#')[0] + '#' + articleId;
    window.open(`https://telegram.me/share/url?url=${encodeURIComponent(url)}`, '_blank');
}

function copyLink(articleId) {
    updateMetaTags(articleId);
    const url = window.location.href.split('#')[0] + '#' + articleId;
    navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard');
    });
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
    let currentPage = 1;
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
            showPage(currentPage);
            updateButtons();
            scrollToTop();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage * articlesPerPage < headers.length) {
            currentPage++;
            showPage(currentPage);
            updateButtons();
            scrollToTop();
        }
    });

    // Initialize the page
    showPage(currentPage);
    updateButtons();
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
