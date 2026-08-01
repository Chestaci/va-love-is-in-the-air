document.addEventListener('DOMContentLoaded', function() {
    // ==========================================
    // 🔥 ДЕТЕКТОР iOS
    // ==========================================
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) {
        document.body.classList.add('ios-device');
        console.log('📱 Обнаружен iOS — применяем специальные стили');
    }

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

    if (!envelopeOverlay) {
        // Мы на main.html — просто показываем сайт
        document.body.classList.add('site-loaded');
        document.body.style.overflow = 'auto';
        document.querySelectorAll('.hero .fade-in').forEach((el, i) => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            el.style.transitionDelay = `${i * 0.15}s`;
        });
    } else {
        // Мы на index.html
        const alreadyOpened = sessionStorage.getItem('envelopeOpened') === 'true';
        if (alreadyOpened) {
            window.location.href = 'main.html';
        } else {
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
                sessionStorage.setItem('envelopeOpened', 'true');
                envelopeOverlay.classList.add('hidden');
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
        toggleBtn.addEventListener('click', () => navLinks.classList.toggle('active'));
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('active'));
        });
    }

    // ==============================
    // SCROLL REVEAL
    // ==============================
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('revealed');
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.reveal-on-scroll').forEach(el => revealObserver.observe(el));

    // ==========================================
    // ПАРАЛЛАКС-ГАЛЕРЕИ
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
                        currentX = speed < 0
                            ? -(Math.abs(target) % setWidth)
                            : -setWidth + (target % setWidth);
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
    // АКТИВНЫЙ ПУНКТ МЕНЮ
    // ==============================
    const sections = document.querySelectorAll('.section');
    const navLinksAll = document.querySelectorAll('.nav-links a');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(sec => {
            if (pageYOffset >= sec.offsetTop - 200) current = sec.getAttribute('id');
        });
        navLinksAll.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').slice(1) === current) link.classList.add('active');
        });
    });
});

// ==========================================
// ТАЙМЕР ОБРАТНОГО ОТСЧЕТА
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
            daysEl.textContent = String(Math.floor(distance / 86400000)).padStart(2, '0');
            hoursEl.textContent = String(Math.floor((distance % 86400000) / 3600000)).padStart(2, '0');
            minutesEl.textContent = String(Math.floor((distance % 3600000) / 60000)).padStart(2, '0');
            secondsEl.textContent = String(Math.floor((distance % 60000) / 1000)).padStart(2, '0');
        } else {
            daysEl.textContent = hoursEl.textContent = minutesEl.textContent = secondsEl.textContent = '00';
        }
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
    console.log('✅ Таймер обратного отсчёта запущен!');
}
initCountdown();

// ==========================================
// 🎵 ПЛАСТИНКА С МУЗЫКОЙ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const vinyl = document.getElementById('vinyl');
    const audio = document.getElementById('wedding-audio');
    const statusText = document.querySelector('.vinyl-status');

    if (!vinyl || !audio) return;

    vinyl.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().then(() => {
                vinyl.classList.add('playing');
                if (statusText) statusText.innerText = "Звучит Элвис Пресли!\n💃🕺";
            }).catch(error => {
                console.log("Браузер заблокировал автозвук:", error);
            });
        } else {
            audio.pause();
            vinyl.classList.remove('playing');
            if (statusText) statusText.innerText = "Музыка на паузе\n⏸️";
        }
    });
});

// ==========================================
// ПОДМЕНА ФОНОВ НА МОБИЛЬНОМ
// ==========================================
if (window.innerWidth <= 768) {
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.section-bg-parallax[data-mobile-bg]').forEach(el => {
            const mobileUrl = el.getAttribute('data-mobile-bg');
            if (mobileUrl) {
                el.style.backgroundImage = `url('${mobileUrl}?v=${Date.now()}')`;
            }
        });
    });
}
