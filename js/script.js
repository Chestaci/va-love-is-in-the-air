document.addEventListener('DOMContentLoaded', function() {

// ==============================
// КОНВЕРТ — ПОЛНАЯ АНИМАЦИЯ + ЗАПОМИНАНИЕ
// ==============================
const envelopeOverlay  = document.getElementById('envelopeOverlay');
const envelopeWrapper  = document.getElementById('envelopeWrapper');
const envelopeClosed   = document.getElementById('envelopeClosed');
const envelopeOpen     = document.getElementById('envelopeOpen');
const invitationCard   = document.getElementById('invitationCard');
const envelopeSeal     = document.getElementById('envelopeSeal');
const envelopeHint     = document.getElementById('envelopeHint');
const btnContinue      = document.getElementById('btnContinue');

// Проверяем, открывали ли уже в этой вкладке
const alreadyOpened = sessionStorage.getItem('envelopeOpened') === 'true';

if (alreadyOpened && envelopeOverlay) {
    // Если уже открывали → мгновенно скрываем, чтобы не мелькало
    envelopeOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
} else if (envelopeOverlay) {
    // Первый вход → блокируем скролл страницы
    document.body.style.overflow = 'hidden';

    // 🔹 1. Открытие (пошаговая анимация)
    function openEnvelope() {
        if (sessionStorage.getItem('envelopeOpened') === 'true') return;

        // Скрываем печать и подсказку
        if (envelopeSeal) envelopeSeal.classList.add('hide');
        if (envelopeHint) envelopeHint.classList.add('hide');

        // Через 300мс: закрываем старый конверт, показываем открытый
        setTimeout(() => {
            if (envelopeClosed) envelopeClosed.classList.add('hide');
            if (envelopeOpen) envelopeOpen.classList.add('show');
        }, 300);

        // Через 700мс: выезжает карточка с фото и кнопкой
        setTimeout(() => {
            if (invitationCard) invitationCard.classList.add('show');
        }, 700);

        // Запоминаем, что открыли
        sessionStorage.setItem('envelopeOpened', 'true');
    }

    // 🔹 2. Закрытие (переход на сайт)
    function closeEnvelope() {
        envelopeOverlay.classList.add('hidden');
        document.body.style.overflow = 'auto';

        // Плавное появление контента главной страницы
        setTimeout(() => {
            document.querySelectorAll('.hero .fade-in').forEach((el, i) => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
                el.style.transitionDelay = `${i * 0.15}s`;
            });
        }, 400);
    }

    // Клик по конверту или печати
    if (envelopeWrapper) {
        envelopeWrapper.addEventListener('click', function(e) {
            if (!e.target.closest('#btnContinue')) {
                e.preventDefault();
                openEnvelope();
            }
        });
    }

    // Клик по кнопке "Узнать подробнее"
    if (btnContinue) {
        btnContinue.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeEnvelope();
        });
    }
}

    // ==============================
    // ЗАТУХАНИЕ ФОНА ПРИ СКРОЛЛЕ
    // ==============================
    const heroSection = document.getElementById('home');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const heroHeight = heroSection ? heroSection.offsetHeight : window.innerHeight;
        
        if (scrollY > heroHeight * 0.5) {
            heroSection.classList.add('bg-faded');
        } else {
            heroSection.classList.remove('bg-faded');
        }
    });


    // ==============================
    // МОБИЛЬНОЕ МЕНЮ
    // ==============================
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const navLinks  = document.getElementById('navLinks');

    if (toggleBtn && navLinks) {
        toggleBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }


    // ==============================
    // SCROLL REVEAL С ЗАДЕРЖКАМИ
    // ==============================
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        revealObserver.observe(el);
    });


// ==========================================
// ПАРАЛЛАКС: АВТО-ИНИЦИАЛИЗАЦИЯ ВСЕХ ГАЛЕРЕЙ
// ==========================================
window.initAllParallaxGalleries = function() {
    const galleries = document.querySelectorAll('.parallax-gallery');
    if (!galleries.length) return;

    galleries.forEach((gallery) => {
        const layers = gallery.querySelectorAll('.parallax-layer');
        
        layers.forEach((layer, index) => {
            // 1. Дублируем контент для бесшовной прокрутки
            const originals = [...layer.querySelectorAll('.parallax-img')];
            for (let k = 0; k < 3; k++) {
                originals.forEach(img => layer.appendChild(img.cloneNode(true)));
            }

            // 2. Скорость зависит от позиции слоя (чередование направлений)
            const speeds = [-0.12, 0.08, -0.06, 0.05];
            const speed = speeds[index % speeds.length];

            // 3. Запускаем анимацию после рендера
            requestAnimationFrame(() => {
                const setWidth = layer.scrollWidth / 4; // ширина одного полного набора
                let currentX = speed > 0 ? -setWidth : 0;

                function animate() {
                    const scrollY = window.scrollY;
                    const target = scrollY * speed;

                    // Математическое зацикливание
                    if (speed < 0) {
                        currentX = -(Math.abs(target) % setWidth);
                    } else {
                        currentX = -setWidth + (target % setWidth);
                    }

                    layer.style.transform = `translate3d(${currentX}px, 0, 0)`;
                    requestAnimationFrame(animate);
                }
                animate();
            });
        });
    });
    console.log(`✅ Запущено ${galleries.length} параллакс-галерей`);
};

// Автозапуск после загрузки страницы
window.addEventListener('load', () => setTimeout(window.initAllParallaxGalleries, 300));

    // ==============================
    // ВИДЕО FADE КАРУСЕЛЬ
    // ==============================
// 🎥 ВИДЕО КАРУСЕЛЬ (ТОЛЬКО РУЧНОЕ УПРАВЛЕНИЕ)
const videoContainer = document.getElementById('videoFadeCarousel');
const videoPrevBtn   = document.getElementById('videoFadePrev');
const videoNextBtn   = document.getElementById('videoFadeNext');
const videoDots      = document.getElementById('videoFadeDots');

if (videoContainer && videoDots) {
    const videoSlides = videoContainer.querySelectorAll('.video-fade-slide');
    let vCurrent = 0;

    // Создаём точки
    videoSlides.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.classList.add('video-fade-dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToVideo(i));
        videoDots.appendChild(dot);
    });
    const vDots = videoDots.querySelectorAll('.video-fade-dot');

    // Переключение слайда
    function goToVideo(index) {
        // Останавливаем текущее видео
        const currentVid = videoSlides[vCurrent]?.querySelector('video');
        if (currentVid && !currentVid.paused) currentVid.pause();

        vCurrent = index;
        videoSlides.forEach((s, i) => s.classList.toggle('active', i === vCurrent));
        vDots.forEach((d, i) => d.classList.toggle('active', i === vCurrent));
    }

    function nextVideo() { goToVideo((vCurrent + 1) % videoSlides.length); }
    function prevVideo() { goToVideo((vCurrent - 1 + videoSlides.length) % videoSlides.length); }

    // 🔘 Кнопки
    if (videoNextBtn) videoNextBtn.addEventListener('click', nextVideo);
    if (videoPrevBtn) videoPrevBtn.addEventListener('click', prevVideo);

    // ⌨️ Клавиатура
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') nextVideo();
        if (e.key === 'ArrowLeft') prevVideo();
    });

    // 📱 Свайпы (мобильные)
    let touchStartX = 0;
    videoContainer.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    videoContainer.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? nextVideo() : prevVideo();
        }
    }, { passive: true });

    console.log('🎥 Видео-карусель: автопрокрутка отключена, только ручное управление');
}

    // ==============================
    // АКТИВНЫЙ ПУНКТ МЕНЮ
    // ==============================
    const sections = document.querySelectorAll('.section');
    const navLinksAll = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(sec => {
            if (pageYOffset >= sec.offsetTop - 200) {
                current = sec.getAttribute('id');
            }
        });
        navLinksAll.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').slice(1) === current) {
                link.classList.add('active');
            }
        });
    });

});