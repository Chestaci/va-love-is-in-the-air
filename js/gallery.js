document.addEventListener('DOMContentLoaded', () => {
    const lightbox = document.getElementById('lightbox');
    const lightboxContent = document.getElementById('lightbox-content');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    const grid = document.querySelector('.photo-grid-container');

    if (!grid || !lightbox) return;

    let currentIndex = 0;
    let items = [];

    // Обновляем список элементов (игнорируем скрытые, если будут фильтры)
    function updateItems() {
        items = Array.from(grid.querySelectorAll('.photo-item'));
    }
    updateItems();

    // Клик по элементу галереи
    grid.addEventListener('click', (e) => {
        const item = e.target.closest('.photo-item');
        if (!item) return;

        updateItems();
        currentIndex = items.indexOf(item);
        openLightbox(currentIndex);
    });

    function openLightbox(index) {
        if (index < 0 || index >= items.length) return;
        const item = items[index];
        const media = item.querySelector('img, video');
        if (!media) return;

        lightboxContent.innerHTML = ''; // Очищаем предыдущее

        if (media.tagName === 'VIDEO') {
            // Создаём видео для лайтбокса: со звуком, с контролами
            const video = document.createElement('video');
            video.src = media.src || media.querySelector('source')?.src;
            video.controls = true;
            video.autoplay = true;
            video.muted = false; // 🔊 Включаем звук
            video.loop = false;
            video.playsInline = true;
            video.className = 'lightbox-media';
            lightboxContent.appendChild(video);
            
            // Автозапуск после клика (браузеры разрешают звук при жесте пользователя)
            video.play().catch(err => console.log('Autoplay blocked:', err));
        } else {
            const img = document.createElement('img');
            img.src = media.src;
            img.alt = media.alt;
            img.className = 'lightbox-media';
            lightboxContent.appendChild(img);
        }

        lightboxCaption.textContent = media.alt || '';
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        lightboxContent.innerHTML = ''; // Останавливаем видео и освобождаем память
    }

    function navigate(dir) {
        currentIndex += dir;
        if (currentIndex < 0) currentIndex = items.length - 1;
        if (currentIndex >= items.length) currentIndex = 0;
        openLightbox(currentIndex);
    }

    // Обработчики кнопок
    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); navigate(-1); });
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); navigate(1); });

    // Клавиатура
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigate(-1);
        if (e.key === 'ArrowRight') navigate(1);
    });
});
