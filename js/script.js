document.addEventListener('DOMContentLoaded', function() {
    // ==============================
    // КОНВЕРТ — БЕЗ ВСПЫШЕК
    // ==============================
    const envelopeOverlay  = document.getElementById('envelopeOverlay');
    const envelopeWrapper  = document.getElementById('envelopeWrapper');
    const envelopeClosed   = document.getElementById('envelopeClosed');
    const envelopeOpen     = document.getElementById('envelopeOpen');
    const invitationCard   = document.getElementById('invitationCard');
    const envelopeSeal     = document.getElementById('envelopeSeal');
    const envelopeHint     = document.getElementById('envelopeHint');
    const btnContinue      = document.getElementById('btnContinue');

    // 🔥 Если конверта нет на странице (мы на main.html) — просто показываем сайт
    if (!envelopeOverlay) {
        document.body.classList.add('site-loaded');
        document.body.style.overflow = 'auto';
        document.querySelectorAll('.hero .fade-in').forEach((el, i) => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            el.style.transitionDelay = `${i * 0.15}s`;
        });
    } else {
        // 🔥 Конверт есть (мы на index.html)
        const alreadyOpened = sessionStorage.getItem('envelopeOpened') === 'true';

        if (alreadyOpened) {
            // ✅ Уже открывали — перенаправляем на главную
            window.location.href = 'main.html';
        } else {
            // Первый визит: сайт скрыт, скролл заблокирован
            document.body.style.overflow = 'hidden';

            function openEnvelope() {
                if (envelopeSeal) envelopeSeal.classList.add('hide');
                if (envelopeHint) envelopeHint.classList.add('hide');
                setTimeout(() => {
                    if (envelopeClosed) envelopeClosed.classList.add('hide');
                    if (envelopeOpen) envelopeOpen.classList.add('show');
                }, 300);
                setTimeout(() => {
                    if (invitationCard) invitationCard.classList.add('show');
                }, 700);
            }

            function closeEnvelope() {
                // 1. Запоминаем, что открыли
                sessionStorage.setItem('envelopeOpened', 'true');
                // 2. Плавно убираем конверт
                envelopeOverlay.classList.add('hidden');
                // 3. Перенаправляем на главную страницу
                setTimeout(() => {
                    window.location.href = 'main.html';
                }, 1000);
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
        }
    }

    // ==========================================
    // УМЕНЬШЕНИЕ ПЕЧАТИ ТОЛЬКО НА МОБИЛЬНОМ
    // ==========================================
    function resizeSealForMobile() {
        if (window.innerWidth <= 768) {
            const seal = document.getElementById('envelopeSeal');
            if (seal) {
                seal.style.setProperty('width', '45px', 'important');
                seal.style.setProperty('height', '45px', 'important');
                seal.style.setProperty('min-width', '45px', 'important');
                seal.style.setProperty('min-height', '45px', 'important');
                seal.style.setProperty('max-width', '45px', 'important');
                seal.style.setProperty('max-height', '45px', 'important');
                seal.style.setProperty('top', '50%', 'important');
                const span = seal.querySelector('span');
                if (span) {
                    span.style.setProperty('font-size', '11px', 'important');
                }
            }
        }
    }
    window.addEventListener('load', resizeSealForMobile);
    window.addEventListener('resize', resizeSealForMobile);
    setTimeout(resizeSealForMobile, 500);
    setTimeout(resizeSealForMobile, 1000);

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
                const originals = [...layer.querySelectorAll('.parallax-img')];
                for (let k = 0; k < 3; k++) {
                    originals.forEach(img => layer.appendChild(img.cloneNode(true)));
                }
                const speeds = [-0.12, 0.08, -0.06, 0.05];
                const speed = speeds[index % speeds.length];
                requestAnimationFrame(() => {
                    const setWidth = layer.scrollWidth / 4;
                    let currentX = speed > 0 ? -setWidth : 0;
                    function animate() {
                        const scrollY = window.scrollY;
                        const target = scrollY * speed;
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
    window.addEventListener('load', () => setTimeout(window.initAllParallaxGalleries, 300));

    // ==============================
    // ВИДЕО FADE КАРУСЕЛЬ
    // ==============================
    const videoContainer = document.getElementById('videoFadeCarousel');
    const videoPrevBtn   = document.getElementById('videoFadePrev');
    const videoNextBtn   = document.getElementById('videoFadeNext');
    const videoDots      = document.getElementById('videoFadeDots');
    if (videoContainer && videoDots) {
        const videoSlides = videoContainer.querySelectorAll('.video-fade-slide');
        let vCurrent = 0;
        videoSlides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.classList.add('video-fade-dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToVideo(i));
            videoDots.appendChild(dot);
        });
        const vDots = videoDots.querySelectorAll('.video-fade-dot');
        function goToVideo(index) {
            const currentVid = videoSlides[vCurrent]?.querySelector('video');
            if (currentVid && !currentVid.paused) currentVid.pause();
            vCurrent = index;
            videoSlides.forEach((s, i) => s.classList.toggle('active', i === vCurrent));
            vDots.forEach((d, i) => d.classList.toggle('active', i === vCurrent));
        }
        function nextVideo() { goToVideo((vCurrent + 1) % videoSlides.length); }
        function prevVideo() { goToVideo((vCurrent - 1 + videoSlides.length) % videoSlides.length); }
        if (videoNextBtn) videoNextBtn.addEventListener('click', nextVideo);
        if (videoPrevBtn) videoPrevBtn.addEventListener('click', prevVideo);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') nextVideo();
            if (e.key === 'ArrowLeft') prevVideo();
        });
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
        console.log('🎥 Видео-карусель: только ручное управление');
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

// ===== ПОЛНОЭКРАННОЕ ВИДЕО ОСОБНЯКА =====
function toggleFullscreen(btn) {
    const videoContainer = btn.closest('.location-video');
    const video = videoContainer.querySelector('.venue-video');
    if (!document.fullscreenElement) {
        if (videoContainer.requestFullscreen) {
            videoContainer.requestFullscreen();
        } else if (videoContainer.webkitRequestFullscreen) {
            videoContainer.webkitRequestFullscreen();
        } else if (videoContainer.msRequestFullscreen) {
            videoContainer.msRequestFullscreen();
        }
        btn.innerHTML = '<i class="fas fa-compress"></i>';
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        btn.innerHTML = '<i class="fas fa-expand"></i>';
    }
}
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        const btn = document.querySelector('.video-fullscreen-btn');
        if (btn) btn.innerHTML = '<i class="fas fa-expand"></i>';
    }
});

// ==========================================
// ГАРАНТИРОВАННАЯ ПОДМЕНА ФОНОВ НА МОБИЛЬНОМ
// ==========================================
if (window.innerWidth <= 768) {
    document.addEventListener('DOMContentLoaded', function() {
        const bgElements = document.querySelectorAll('.section-bg-parallax[data-mobile-bg]');
        bgElements.forEach(el => {
            const mobileUrl = el.getAttribute('data-mobile-bg');
            if (mobileUrl) {
                el.style.backgroundImage = `url('${mobileUrl}?v=${Date.now()}')`;
            }
        });
    });
}

// ==========================================
// 🔥 ТАЙМЕР ОБРАТНОГО ОТСЧЕТА
// ==========================================
function initCountdown() {
    const targetDate = new Date('September 12, 2026 00:00:00').getTime();
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) {
        console.warn('⚠️ Элементы таймера не найдены в HTML');
        return;
    }
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate - now;
        if (distance > 0) {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            daysEl.textContent = String(days).padStart(2, '0');
            hoursEl.textContent = String(hours).padStart(2, '0');
            minutesEl.textContent = String(minutes).padStart(2, '0');
            secondsEl.textContent = String(seconds).padStart(2, '0');
        } else {
            daysEl.textContent = '00';
            hoursEl.textContent = '00';
            minutesEl.textContent = '00';
            secondsEl.textContent = '00';
        }
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
    console.log('✅ Таймер обратного отсчёта успешно запущен!');
}
initCountdown();