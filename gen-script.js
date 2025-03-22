function toggleMenu() {
            const menu = document.querySelector('.menu-container');
            const button = document.querySelector('.menu-button');
            menu.classList.toggle('menu-open');
            button.classList.toggle('open');
        }
    document.addEventListener('DOMContentLoaded', (event) => {
    const articles = document.querySelectorAll('.article');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    let currentPage = 1;
    const articlesPerPage = 2;

    function showPage(page) {
        const start = (page - 1) * articlesPerPage;
        const end = start + articlesPerPage;
        articles.forEach((article, index) => {
            if (index >= start && index < end) {
                article.style.display = 'block';
            } else {
                article.style.display = 'none';
            }
        });
    }

    function updateButtons() {
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage * articlesPerPage >= articles.length;
    }

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            showPage(currentPage);
            updateButtons();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage * articlesPerPage < articles.length) {
            currentPage++;
            showPage(currentPage);
            updateButtons();
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
