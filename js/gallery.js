document.addEventListener('DOMContentLoaded', function() {
    
// ========== ПРОСТОЕ ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ==========
function showTab(tabName) {
    const photosSection = document.getElementById('photosSection');
    const videosSection = document.getElementById('videosSection');
    const tabs = document.querySelectorAll('.tab-btn');
    
    // Останавливаем все видео при переключении
    document.querySelectorAll('video').forEach(vid => vid.pause());
    
    if (tabName === 'photos') {
        photosSection.style.display = 'block';
        videosSection.style.display = 'none';
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        photosSection.style.display = 'none';
        videosSection.style.display = 'block';
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
    
    // Плавная прокрутка к контенту
    setTimeout(() => {
        window.scrollTo({ top: 150, behavior: 'smooth' });
    }, 100);
}
    
    // ========== ЛАЙТБОКС ==========
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    
    let currentImageIndex = 0;
    let visibleImages = [];
    
    // Открытие лайтбокса
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            const img = this.querySelector('img');
            const caption = img.alt;
            
            // Собираем только видимые изображения
            visibleImages = Array.from(document.querySelectorAll('.gallery-item:not(.hidden)'));
            currentImageIndex = visibleImages.indexOf(this);
            
            lightboxImg.src = img.src;
            lightboxCaption.textContent = caption;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });
    
    // Закрытие
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) closeLightbox();
    });
    
    // Навигация
    function showImage(index) {
        if (index < 0) index = visibleImages.length - 1;
        if (index >= visibleImages.length) index = 0;
        
        const img = visibleImages[index].querySelector('img');
        lightboxImg.src = img.src;
        lightboxCaption.textContent = img.alt;
        currentImageIndex = index;
    }
    
    lightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        showImage(currentImageIndex - 1);
    });
    
    lightboxNext.addEventListener('click', (e) => {
        e.stopPropagation();
        showImage(currentImageIndex + 1);
    });
    
    // Клавиатура
    document.addEventListener('keydown', function(e) {
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showImage(currentImageIndex - 1);
        if (e.key === 'ArrowRight') showImage(currentImageIndex + 1);
    });
    
    // ========== МОБИЛЬНОЕ МЕНЮ ==========
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
        
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }
    
    console.log('✅ Галерея загружена');
});

// ========== ЛАЙТБОКС ДЛЯ ФОТО ==========
document.addEventListener('DOMContentLoaded', () => {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');
    const grid = document.querySelector('.photo-grid-container');

    if (!grid || !lightbox) return;

    // Клик по фото
    grid.addEventListener('click', (e) => {
        const img = e.target.closest('.photo-item img');
        if (!img) return; // Игнорируем клики по видео
        
        lightboxImg.src = img.src;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Закрытие
    function close() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => { if(e.target === lightbox) close(); });
    document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && lightbox.classList.contains('active')) close(); });
});