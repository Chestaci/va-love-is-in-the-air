document.addEventListener('DOMContentLoaded', function() {

    // ==============================
    // КОНВЕРТ
    // ==============================
    const envelopeOverlay  = document.getElementById('envelopeOverlay');
    const envelopeWrapper  = document.getElementById('envelopeWrapper');
    const envelopeClosed   = document.getElementById('envelopeClosed');
    const envelopeOpen     = document.getElementById('envelopeOpen');
    const invitationCard   = document.getElementById('invitationCard');
    const envelopeSeal     = document.getElementById('envelopeSeal');
    const envelopeHint     = document.getElementById('envelopeHint');
    const btnContinue      = document.getElementById('btnContinue');

    let envelopeOpened = false;
    document.body.style.overflow = 'hidden';

    function openEnvelope() {
        if (envelopeOpened) return;
        envelopeOpened = true;

        if (envelopeSeal) envelopeSeal.classList.add('hide');
        if (envelopeHint) envelopeHint.classList.add('hide');

        setTimeout(() => {
            if (envelopeClosed) envelopeClosed.classList.add('hide');
            if (envelopeOpen)   envelopeOpen.classList.add('show');
        }, 300);

        setTimeout(() => {
            if (invitationCard) invitationCard.classList.add('show');
        }, 700);
    }

    function closeEnvelope() {
        if (envelopeOverlay) envelopeOverlay.classList.add('hidden');
        document.body.style.overflow = 'auto';

        setTimeout(() => {
            document.querySelectorAll('.hero .fade-in').forEach((el, i) => {
                setTimeout(() => {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, i * 150);
            });
        }, 400);
    }

    if (envelopeWrapper) {
        envelopeWrapper.addEventListener('click', function(e) {
            if (!e.target.closest('#btnContinue')) {
                e.preventDefault();
                openEnvelope();
            }
        });
    }

    if (btnContinue) {
        btnContinue.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeEnvelope();
        });
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


    // ==============================
    // ФОТО КАРУСЕЛЬ С 3D ЭФФЕКТОМ
    // ==============================
    const photoCarousel = document.getElementById('photoCarousel');
    const photoPrev     = document.getElementById('photoPrev');
    const photoNext     = document.getElementById('photoNext');
    const photoDots     = document.getElementById('photoDots');

    if (photoCarousel && photoDots) {
        const slides   = photoCarousel.querySelectorAll('.carousel-slide');
        let current    = 0;
        let autoPlayId = null;

        slides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.classList.add('carousel-dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goTo(i));
            photoDots.appendChild(dot);
        });

        const dots = photoDots.querySelectorAll('.carousel-dot');

        function updateSlides() {
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === current);
            });
        }

        function goTo(index) {
            current = index;
            photoCarousel.style.transform = `translateX(-${current * 100}%)`;
            dots.forEach((d, i) => d.classList.toggle('active', i === current));
            updateSlides();
            resetAuto();
        }

        function next() { goTo((current + 1) % slides.length); }
        function prev() { goTo((current - 1 + slides.length) % slides.length); }

        if (photoNext) photoNext.addEventListener('click', next);
        if (photoPrev) photoPrev.addEventListener('click', prev);

        function resetAuto() {
            clearInterval(autoPlayId);
            autoPlayId = setInterval(next, 6000);
        }
        resetAuto();

        let tx = 0;
        photoCarousel.addEventListener('touchstart', e => { tx = e.changedTouches[0].screenX; });
        photoCarousel.addEventListener('touchend', e => {
            const diff = tx - e.changedTouches[0].screenX;
            if (diff > 50) next();
            if (diff < -50) prev();
        });
    }

// ==========================================
// ПАРАЛЛАКС-ГАЛЕРЕЯ — РАБОЧАЯ ВЕРСИЯ
// ==========================================
window.initParallaxGallery = function() {
    const layer1 = document.getElementById('layer1');
    const layer2 = document.getElementById('layer2');
    const layer3 = document.getElementById('layer3');
    
    if (!layer1 || !layer2 || !layer3) {
        console.log('⚠️ Слои не найдены');
        return;
    }
    
    // Дублируем фото
    function duplicateLayer(layer) {
        const images = [...layer.querySelectorAll('.parallax-img')];
        for(let k=0; k<2; k++) {
            images.forEach(img => layer.appendChild(img.cloneNode(true)));
        }
    }
    
    duplicateLayer(layer1);
    duplicateLayer(layer2);
    duplicateLayer(layer3);
    
    // 🎚 Скорости (немного уменьшил, чтобы второй ряд не уезжал)
    const speeds = {
        layer1: -0.12,  // Влево
        layer2: 0.08,   // Вправо (медленнее)
        layer3: -0.06   // Влево (медленнее)
    };
    
    function updateParallax() {
        const scrollY = window.scrollY;
        
        layer1.style.transform = `translate3d(${scrollY * speeds.layer1}px, 0, 0)`;
        layer2.style.transform = `translate3d(${scrollY * speeds.layer2}px, 0, 0)`;
        layer3.style.transform = `translate3d(${scrollY * speeds.layer3}px, 0, 0)`;
        
        requestAnimationFrame(updateParallax);
    }
    
    updateParallax();
    console.log('✅ Галерея запущена');
};

// Автозапуск
window.addEventListener('load', () => setTimeout(window.initParallaxGallery, 300));

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