document.addEventListener('DOMContentLoaded', function () {
    // 🔧 Ваши оригинальные пути к фото
    const photoList = [
        'img/gallery/1.jpg', 'img/gallery/2.jpg', 'img/gallery/3.jpg',
        'img/gallery/4.jpg', 'img/gallery/5.jpg', 'img/gallery/6.jpg',
        'img/gallery/7.jpg', 'img/gallery/8.jpg', 'img/gallery/9.jpg',
        'img/gallery/10.jpg', 'img/gallery/11.jpg', 'img/gallery/12.jpg',
        ];

    const scene = document.querySelector('.carousel-scene');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');

    const photos = photoList.filter(src => src?.trim());
    const total = photos.length;
    if (total === 0 || !scene) {
        console.warn('Нет фото или сцена не найдена');
        return;
    }

    const cube = document.createElement('div');
    cube.className = 'carousel-cube';
    scene.innerHTML = '';
    scene.appendChild(cube);

    const angleStep = 360 / total;
    let currentIndex = 0;
    let currentAngle = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartAngle = 0;

    // 🎯 ПРАВИЛЬНЫЙ расчёт translateZ для N граней
    function getTranslateZ() {
        const faceWidth = scene.clientWidth * 0.6; // ширина грани в % от сцены
        const halfAngleRad = (angleStep / 2) * (Math.PI / 180);
        // Формула радиуса описанной окружности для правильного N-угольника
        return halfAngleRad > 0 ? (faceWidth / 2) / Math.tan(halfAngleRad) : scene.clientWidth * 0.5;
    }

    const faces = [];
    photos.forEach((src, i) => {
        const face = document.createElement('div');
        face.className = 'face';
        face.dataset.index = i;
        
        const img = document.createElement('img');
        img.src = src;
        img.alt = `Фото ${i+1}`;
        img.loading = 'lazy';
        img.onerror = function() {
            console.error('Не загрузилось:', src);
            this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><rect fill="%23f5f0e8" width="100%" height="100%"/><text x="50%" y="50%" font-size="14" fill="%239b7ed1" text-anchor="middle">Нет фото</text></svg>';
        };
        img.onload = function() {
            // Пересчитываем позицию после загрузки первого изображения
            if (i === 0) updateFacesPosition();
        };
        
        face.appendChild(img);
        cube.appendChild(face);
        faces.push(face);
    });

    function updateFacesPosition() {
        const tz = getTranslateZ();
        faces.forEach((face, i) => {
            face.style.transform = `rotateY(${angleStep * i}deg) translateZ(${tz}px)`;
        });
    }

    function highlightFace(index) {
        faces.forEach(f => f.classList.remove('center'));
        faces[index]?.classList.add('center');
    }

    function rotateToIndex(index, smooth = true) {
        currentIndex = ((index % total) + total) % total;
        currentAngle = -angleStep * currentIndex;
        cube.style.transition = smooth ? 'transform 0.6s cubic-bezier(0.2,0.8,0.2,1)' : 'none';
        cube.style.transform = `rotateY(${currentAngle}deg)`;
        highlightFace(currentIndex);
    }

    // Инициализация
    updateFacesPosition();
    rotateToIndex(0, false);

    // Кнопки
    prevBtn?.addEventListener('click', () => rotateToIndex(currentIndex - 1));
    nextBtn?.addEventListener('click', () => rotateToIndex(currentIndex + 1));

    // Клавиатура
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') rotateToIndex(currentIndex - 1);
        if (e.key === 'ArrowRight') rotateToIndex(currentIndex + 1);
    });

    // 🖱 Драг мышью
    cube.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isDragging = true;
        dragStartX = e.clientX;
        dragStartAngle = currentAngle;
        cube.style.transition = 'none';
        cube.style.cursor = 'grabbing';
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartX;
        const deltaAngle = dx * 0.5; // чувствительность
        const newAngle = dragStartAngle - deltaAngle;
        cube.style.transform = `rotateY(${newAngle}deg)`;
        
        const nearestIndex = Math.round(-newAngle / angleStep) % total;
        const normalizedIndex = ((nearestIndex % total) + total) % total;
        highlightFace(normalizedIndex);
    });

    window.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        cube.style.cursor = 'grab';
        cube.style.transition = 'transform 0.6s cubic-bezier(0.2,0.8,0.2,1)';
        rotateToIndex(currentIndex);
    });

    // 📱 Свайпы
    cube.addEventListener('touchstart', (e) => {
        isDragging = true;
        dragStartX = e.changedTouches[0].screenX;
        dragStartAngle = currentAngle;
        cube.style.transition = 'none';
    }, { passive: true });

    cube.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const dx = e.changedTouches[0].screenX - dragStartX;
        const deltaAngle = dx * 0.7;
        const newAngle = dragStartAngle - deltaAngle;
        cube.style.transform = `rotateY(${newAngle}deg)`;
        
        const nearestIndex = Math.round(-newAngle / angleStep) % total;
        const normalizedIndex = ((nearestIndex % total) + total) % total;
        highlightFace(normalizedIndex);
    }, { passive: true });

    cube.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        cube.style.transition = 'transform 0.6s cubic-bezier(0.2,0.8,0.2,1)';
        rotateToIndex(currentIndex);
    });

    // 🔄 Ресайз
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateFacesPosition();
            rotateToIndex(currentIndex, false);
        }, 150);
    });

    console.log(`🎠 Карусель: ${total} фото, угол=${angleStep}°, translateZ≈${Math.round(getTranslateZ())}px`);
});