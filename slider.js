document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('weddingSlider');
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    const dotsContainer = document.getElementById('sliderDots');

    if (!slider || !prevBtn || !nextBtn) {
        console.error('❌ Ошибка: элементы #weddingSlider, #sliderPrev или #sliderNext не найдены в HTML');
        return;
    }

    const items = slider.querySelectorAll('.slider-item');
    let currentIndex = 0; // Начинаем с первого
    const total = items.length;
    if (total === 0) return;

    // Создаем точки
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        items.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = `slider-dot${i === 0 ? ' active' : ''}`;
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        });
    }
    const dots = dotsContainer ? dotsContainer.querySelectorAll('.slider-dot') : [];

    // Обновление состояния
    function updateSlider() {
        items.forEach((item, i) => item.classList.toggle('active', i === currentIndex));
        dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
    }

    function goToSlide(index) {
        currentIndex = ((index % total) + total) % total;
        updateSlider();
        resetAutoPlay();
    }

    function nextSlide() { goToSlide(currentIndex + 1); }
    function prevSlide() { goToSlide(currentIndex - 1); }

    // 🖱 Привязка кнопок
    prevBtn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        console.log('⬅️ Prev clicked');
        prevSlide();
    });

    nextBtn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        console.log('➡️ Next clicked');
        nextSlide();
    });

    // ⏱ Автоплей
    let autoTimer = setInterval(nextSlide, 6000);
    function resetAutoPlay() {
        clearInterval(autoTimer);
        autoTimer = setInterval(nextSlide, 6000);
    }

    // 📱 Свайпы
    let touchStartX = 0;
    slider.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, {passive: true});
    slider.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? nextSlide() : prevSlide();
        resetAutoPlay();
    }, {passive: true});

    // Пауза при наведении
    slider.addEventListener('mouseenter', () => clearInterval(autoTimer));
    slider.addEventListener('mouseleave', resetAutoPlay);

    // Инициализация
    updateSlider();
    console.log(`✅ Слайдер запущен: ${total} слайдов`);
});