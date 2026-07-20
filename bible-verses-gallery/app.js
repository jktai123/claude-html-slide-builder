// App State Management
let currentTopic = null;
let currentImgList = [];
let currentImgIndex = 0;
let filteredTopics = [];

// DOM Elements
const elSearchInput = document.getElementById('topic-search');
const elBtnRandom = document.getElementById('btn-random-topic');
const elTopicsList = document.getElementById('topics-list');
const elStatsSummary = document.getElementById('stats-summary');

const elCurrentTitle = document.getElementById('current-topic-title');
const elCurrentStats = document.getElementById('current-topic-stats');
const elBtnOriginal = document.getElementById('btn-original-link');

const elWelcomeView = document.getElementById('welcome-view');
const elWelcomeTotalTopics = document.getElementById('welcome-total-topics');
const elWelcomeTotalImages = document.getElementById('welcome-total-images');
const elBtnStartRandom = document.getElementById('btn-start-random');

const elGalleryGrid = document.getElementById('gallery-grid');

// Lightbox Elements
const elLightbox = document.getElementById('lightbox');
const elLightboxImg = document.getElementById('lightbox-image');
const elLightboxCounter = document.getElementById('lightbox-current-index');
const elLightboxTotal = document.getElementById('lightbox-total-count');
const elBtnPrev = document.getElementById('btn-prev-img');
const elBtnNext = document.getElementById('btn-next-img');
const elBtnCopyUrl = document.getElementById('btn-copy-url');
const elBtnDownload = document.getElementById('btn-download-img');
const elBtnClose = document.getElementById('btn-close-lightbox');
const elLightboxLoader = document.querySelector('.lightbox-loader');

// Initialize the Application
function init() {
    if (typeof BIBLE_DATA === 'undefined') {
        elStatsSummary.textContent = "無法載入聖經數據，請確認 data.js 是否存在。";
        return;
    }

    filteredTopics = [...BIBLE_DATA.data];
    
    // Update Sidebar footer stats
    elStatsSummary.textContent = `共 ${BIBLE_DATA.total_topics} 個主題 / ${BIBLE_DATA.total_images} 張圖片`;
    
    // Update Welcome view stats
    elWelcomeTotalTopics.textContent = BIBLE_DATA.total_topics;
    elWelcomeTotalImages.textContent = BIBLE_DATA.total_images;
    
    // Render initial topics list
    renderTopicsList();

    // Set up Event Listeners
    elSearchInput.addEventListener('input', handleSearch);
    elBtnRandom.addEventListener('click', selectRandomTopic);
    elBtnStartRandom.addEventListener('click', selectRandomTopic);
    
    // Lightbox Controls
    elBtnClose.addEventListener('click', closeLightbox);
    document.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);
    elBtnPrev.addEventListener('click', showPrevImg);
    elBtnNext.addEventListener('click', showNextImg);
    elBtnCopyUrl.addEventListener('click', copyCurrentImageUrl);
    
    // Keyboard Navigation
    document.addEventListener('keydown', handleKeyDown);
    
    // Swiping gestures for mobile in lightbox
    setupSwipeGestures();
}

// Render the sidebar topics list
function renderTopicsList() {
    elTopicsList.innerHTML = '';
    
    if (filteredTopics.length === 0) {
        const li = document.createElement('li');
        li.style.cursor = 'default';
        li.innerHTML = '<span class="topic-name" style="color: var(--text-muted);">無搜尋結果</span>';
        elTopicsList.appendChild(li);
        return;
    }
    
    filteredTopics.forEach(topic => {
        const li = document.createElement('li');
        if (currentTopic && currentTopic.topic === topic.topic) {
            li.classList.add('active');
        }
        
        li.innerHTML = `
            <span class="topic-name">${topic.topic}</span>
            <span class="topic-count">${topic.count}</span>
        `;
        
        li.addEventListener('click', () => selectTopic(topic));
        elTopicsList.appendChild(li);
    });
}

// Handle Topic Filtering
function handleSearch(e) {
    const keyword = e.target.value.trim().toLowerCase();
    if (!keyword) {
        filteredTopics = [...BIBLE_DATA.data];
    } else {
        filteredTopics = BIBLE_DATA.data.filter(t => 
            t.topic.toLowerCase().includes(keyword)
        );
    }
    renderTopicsList();
}

// Select a Topic and load its images
function selectTopic(topic) {
    currentTopic = topic;
    currentImgList = topic.images;
    
    // Highlight selected topic in list
    const listItems = elTopicsList.querySelectorAll('li');
    listItems.forEach((li, idx) => {
        const name = filteredTopics[idx] ? filteredTopics[idx].topic : '';
        if (name === topic.topic) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });
    
    // Update header info
    elCurrentTitle.textContent = `關於「${topic.topic}」的聖經金句`;
    elCurrentStats.textContent = `共收錄 ${topic.count} 張圖片`;
    
    elBtnOriginal.href = topic.url;
    elBtnOriginal.style.display = 'inline-flex';
    
    // Toggle view states
    elWelcomeView.style.display = 'none';
    elGalleryGrid.style.display = 'grid';
    
    // Render skeleton loaders for rich feel
    renderSkeletons(topic.count);
    
    // Load images with small delay to show skeleton shimmer effect
    setTimeout(() => {
        renderImages();
    }, 400);
}

// Render skeleton loaders
function renderSkeletons(count) {
    elGalleryGrid.innerHTML = '';
    const displayCount = Math.min(count, 12); // max skeletons to avoid excessive layout
    for (let i = 0; i < displayCount; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
        elGalleryGrid.appendChild(skeleton);
    }
}

// Render target image cards
function renderImages() {
    elGalleryGrid.innerHTML = '';
    
    currentImgList.forEach((imgUrl, index) => {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        
        // Extract script filename or reference for label tag (e.g. galatians-5-1-2.jpg -> 加拉太書 5:1)
        const displayTag = parseImageFilename(imgUrl);
        
        card.innerHTML = `
            <div class="gallery-card-img-wrapper">
                <img src="${imgUrl}" alt="${currentTopic.topic} - ${displayTag}" loading="lazy">
                <div class="gallery-card-overlay">
                    <span class="verse-tag" title="${displayTag}">${displayTag}</span>
                    <span class="card-action-icon"><i class="fa-solid fa-expand"></i></span>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => openLightbox(index));
        elGalleryGrid.appendChild(card);
    });
}

// Helper to make filenames look nicer for display tag
function parseImageFilename(url) {
    try {
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        // e.g. "1-corinthians-6-12-2.jpg" -> "1 Corinthians 6:12"
        const cleanName = filename.replace(/\.jpe?g$/, '');
        
        // Split by dashes and clean ending version numbers
        const tokens = cleanName.split('-');
        if (tokens.length < 2) return cleanName;
        
        // Remove trailing number if it is a duplicate variation (like -2, -3 at the end)
        if (!isNaN(tokens[tokens.length - 1])) {
            tokens.pop();
        }
        
        // Find split for book name, chapter and verses
        // Try to reconstruct a readable english name
        let chapter = tokens.pop(); // typically last element now is verse/chapter
        let bookTokens = tokens;
        
        // If last element is also numeric, we might have multiple verse definitions
        let verse = '';
        if (bookTokens.length > 0 && !isNaN(bookTokens[bookTokens.length - 1])) {
            verse = chapter;
            chapter = bookTokens.pop();
        }
        
        let bookName = bookTokens.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        if (verse) {
            return `${bookName} ${chapter}:${verse}`;
        } else {
            return `${bookName} ${chapter}`;
        }
    } catch (e) {
        return "聖經金句";
    }
}

// Select a random topic
function selectRandomTopic() {
    if (!BIBLE_DATA || BIBLE_DATA.data.length === 0) return;
    const randomIndex = Math.floor(Math.random() * BIBLE_DATA.data.length);
    const randomTopic = BIBLE_DATA.data[randomIndex];
    
    // Scroll selected topic into view in sidebar
    selectTopic(randomTopic);
    
    // Find matching li element and scroll
    setTimeout(() => {
        const activeLi = elTopicsList.querySelector('li.active');
        if (activeLi) {
            activeLi.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 100);
}

// Lightbox Functionality
function openLightbox(index) {
    currentImgIndex = index;
    elLightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    elLightboxTotal.textContent = currentImgList.length;
    updateLightboxImage();
}

function closeLightbox() {
    elLightbox.style.display = 'none';
    document.body.style.overflow = '';
}

function updateLightboxImage() {
    const url = currentImgList[currentImgIndex];
    
    // Show spinner
    elLightboxLoader.style.display = 'block';
    elLightboxImg.style.opacity = '0.3';
    
    elLightboxCounter.textContent = currentImgIndex + 1;
    elLightboxImg.src = url;
    
    // Setup download url
    elBtnDownload.href = url;
    
    elLightboxImg.onload = () => {
        elLightboxLoader.style.display = 'none';
        elLightboxImg.style.opacity = '1';
    };
    
    elLightboxImg.onerror = () => {
        elLightboxLoader.style.display = 'none';
        elLightboxImg.style.opacity = '1';
        alert("載入圖片失敗，此圖片網址可能已失效");
    };
}

function showPrevImg() {
    if (currentImgList.length <= 1) return;
    currentImgIndex = (currentImgIndex - 1 + currentImgList.length) % currentImgList.length;
    updateLightboxImage();
}

function showNextImg() {
    if (currentImgList.length <= 1) return;
    currentImgIndex = (currentImgIndex + 1) % currentImgList.length;
    updateLightboxImage();
}

function copyCurrentImageUrl() {
    const url = currentImgList[currentImgIndex];
    navigator.clipboard.writeText(url).then(() => {
        // Change icon to checkmark temporarily
        const icon = elBtnCopyUrl.querySelector('i');
        icon.className = 'fa-solid fa-check';
        icon.style.color = '#10b981'; // Green
        
        setTimeout(() => {
            icon.className = 'fa-regular fa-copy';
            icon.style.color = '';
        }, 1500);
    }).catch(err => {
        alert("複製失敗，請手動複製圖片網址。");
    });
}

// Keydown handler for keyboard nav
function handleKeyDown(e) {
    if (elLightbox.style.display === 'none') return;
    
    if (e.key === 'ArrowLeft') {
        showPrevImg();
    } else if (e.key === 'ArrowRight') {
        showNextImg();
    } else if (e.key === 'Escape') {
        closeLightbox();
    }
}

// Swipe gestures for touch screens
function setupSwipeGestures() {
    let startX = 0;
    let endX = 0;
    
    elLightbox.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    }, { passive: true });
    
    elLightbox.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        const diffX = endX - startX;
        
        if (Math.abs(diffX) > 50) { // minimum threshold
            if (diffX > 0) {
                showPrevImg(); // swipe right -> show prev
            } else {
                showNextImg(); // swipe left -> show next
            }
        }
    }, { passive: true });
}

// Start Application on Load
window.addEventListener('DOMContentLoaded', init);
