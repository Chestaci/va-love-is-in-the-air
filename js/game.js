document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('gameScore');
    const startBtn = document.getElementById('gameStart');
    const winDiv = document.getElementById('winMessage');
    const endingImg = document.getElementById('endingImage');
    
    // Элемент цели
    let goalDisplay = document.getElementById('gameGoal');
    if (!goalDisplay) {
        goalDisplay = document.createElement('div');
        goalDisplay.id = 'gameGoal';
        goalDisplay.className = 'game-goal';
        canvas.parentElement.insertBefore(goalDisplay, canvas);
    }

    // 🎨 НАСТРОЙКИ (🔥 МЕНЯЙТЕ ЗДЕСЬ)
    const GAME_BG_IMG = 'images/game/game-bg.jpg';
    const GAME_BG_COLOR = '#ffeef2';
    const WIN_SCORE = 11;
    
    // 🔥 Ваши эмодзи-препятствия
    const OBSTACLE_EMOJIS = ['🍾', '🥂', '🎁', '🎂', '📷', '👠'];
    
    // 🔥 Размеры картинок (если отличаются)
    const GROOM_SIZE = { width: 112, height: 145 };           // Первая картинка жениха
    const GROOM_TRANSFORMED_SIZE = { width: 62, height: 150 }; // 🔥 Вторая картинка (после кольца) — подставьте свои значения!
    const BRIDE_SIZE = { width: 105, height: 145 };
    
    // 🔥 Позиции и физика
    const GROUND_Y_OFFSET = 65;  // Отступ земли от низа канваса
    const PLAYER_START_X = 80;
    const JUMP_POWER = -13;
    const GRAVITY = 0.45;
    const BRIDE_STEP_DELAY = 550; // Пауза между шагами невесты (мс)
    const BRIDE_STEP_LENGTH = 30; // Длина шага невесты (пиксели)
    // 🔥 Сдвиг второй картинки жениха (пиксели)
    // Положительное число = правее, Отрицательное = левее
    const GROOM_TRANSFORMED_X_SHIFT = 25; // 🎯 Подбирайте значение: 10, 15, 20...
    
    // 🔥 Финальная картинка
    const ENDING_IMG_MAX_WIDTH = '25%'; // Размер финального изображения
    
    const GAME_BG_COLOR_IDLE = '#ffeef2';
    
    let gameBgImage = null;
    if (GAME_BG_IMG) { gameBgImage = new Image(); gameBgImage.src = GAME_BG_IMG; }

    // 🔊 Звуки
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    function initAudio() { if (!audioCtx) { audioCtx = new AudioCtx(); if (audioCtx.state === 'suspended') audioCtx.resume(); } }
    function playSound(type) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        switch(type) {
            case 'jump': osc.type='sine'; osc.frequency.setValueAtTime(320,now); osc.frequency.exponentialRampToValueAtTime(640,now+0.1); gain.gain.setValueAtTime(0.25,now); gain.gain.exponentialRampToValueAtTime(0.01,now+0.12); osc.start(now); osc.stop(now+0.12); break;
            case 'collect': osc.type='sine'; osc.frequency.setValueAtTime(880,now); osc.frequency.exponentialRampToValueAtTime(1320,now+0.12); gain.gain.setValueAtTime(0.2,now); gain.gain.exponentialRampToValueAtTime(0.01,now+0.18); osc.start(now); osc.stop(now+0.18); break;
            case 'gameover': osc.type='triangle'; osc.frequency.setValueAtTime(400,now); osc.frequency.exponentialRampToValueAtTime(120,now+0.4); gain.gain.setValueAtTime(0.25,now); gain.gain.exponentialRampToValueAtTime(0.01,now+0.4); osc.start(now); osc.stop(now+0.4); break;
            case 'victory': [523.25,659.25,783.99].forEach((f,i)=>{const o=audioCtx.createOscillator();const g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0.15,now+i*0.12);g.gain.exponentialRampToValueAtTime(0.01,now+i*0.12+0.5);o.start(now+i*0.12);o.stop(now+i*0.12+0.5);}); return;
        }
    }

    // 📐 Канвас
    canvas.width = 600; canvas.height = 400;
    const GROUND_Y = canvas.height - GROUND_Y_OFFSET; // 🔥 Ваш уровень земли

    // 👤 Игрок (🔥 с вашими настройками)
    let player = { 
        x: PLAYER_START_X, 
        y: GROUND_Y - GROOM_SIZE.height, 
        width: GROOM_SIZE.width, 
        height: GROOM_SIZE.height, 
        dy: 0, 
        gravity: GRAVITY, 
        jumpPower: JUMP_POWER, 
        grounded: true 
    };
    
    let obstacles = [], hearts = [], score = 0, gameSpeed = 3;
    let gameRunning = false, animFrameId, lastObstacleTime = 0;
    const OBSTACLE_COOLDOWN = 1500, MIN_DIST = canvas.width * 0.4;

    // 👰 Невеста (🔥 с вашими настройками)
    let brideActive = false;
    let brideStepTimer = 0; 
    let bride = { 
        x: canvas.width, 
        y: GROUND_Y - BRIDE_SIZE.height + 4, // +4 для визуальной посадки
        width: BRIDE_SIZE.width, 
        height: BRIDE_SIZE.height 
    };

    // 💍 Кольцо и трансформация
    let ringActive = false;
    let groomTransformed = false;
    let ring = { x: 0, y: 0, width: 45, height: 45 };

    // 🖼️ Картинки
    const GROOM_IMG_SRC = 'images/game/groom.png';
    const BRIDE_IMG_SRC = 'images/game/bride.png';
    const HEART_IMG_SRC = 'images/game/heart.png';
    const ENDING_IMG_SRC = 'images/game/ending.png';
    const NEW_GROOM_IMG_SRC = 'images/game/groom-transformed.png';
    
    let groomImg = null, brideImg = null, heartImg = null, groomNewImg = null;
    if (GROOM_IMG_SRC) { groomImg = new Image(); groomImg.src = GROOM_IMG_SRC; }
    if (BRIDE_IMG_SRC) { brideImg = new Image(); brideImg.src = BRIDE_IMG_SRC; }
    if (HEART_IMG_SRC) { heartImg = new Image(); heartImg.src = HEART_IMG_SRC; }
    if (NEW_GROOM_IMG_SRC) { groomNewImg = new Image(); groomNewImg.src = NEW_GROOM_IMG_SRC; }

    // 🎨 Фон
    function drawBackground() {
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = GAME_BG_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (gameBgImage?.complete && gameBgImage.naturalWidth > 0) {
            ctx.globalAlpha = 1;
            ctx.drawImage(gameBgImage, 0, 0, canvas.width, canvas.height);
        }
        ctx.globalAlpha = 1.0;
    }

    // 🌸 Заставка до начала игры (🔥 с вашим текстом и переносом строк)
    let idleAnimId = null;

    function drawIdleScreen() {
    drawBackground();
    ctx.fillStyle = 'rgba(245, 240, 232, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 🔥 ЗАГОЛОВОК — меняйте цвет здесь (было #340a83, стало #5D4037 — тёплый коричневый)
    ctx.fillStyle = '#5D4037';  // ← ИЗМЕНИТЕ ЦВЕТ ЗДЕСЬ
    ctx.font = 'bold 28px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('💍 Love Leap: Groom Run', canvas.width/2, 45);

    // Описание
    ctx.font = '15px "Playfair Display", Georgia, serif';
    ctx.fillStyle = '#49352f';
    const descLine1 = 'Жених спешит к невесте, а путь преграждают';
    const descLine2 = 'летящие торты, бокалы и другие «сюрпризы».';
    const descLine3 = 'Прыгай, собирай 11 сердечек и встречай невесту!';
    ctx.fillText(descLine1, canvas.width/2, 70);
    ctx.fillText(descLine2, canvas.width/2, 90);
    ctx.fillText(descLine3, canvas.width/2, 110);

    // Плавающие сердечки
    const t = Date.now() / 1000;
    ctx.font = '26px serif';
    for(let i = 0; i < 6; i++) {
        let x = 70 + i * 95;
        let y = 175 + Math.sin(t * 0.7 + i * 1.3) * 18;
        ctx.fillText('💜', x, y);
    }

    if (!gameRunning) idleAnimId = requestAnimationFrame(drawIdleScreen);
}

    // 👤 Жених (🔥 с поддержкой разных размеров)
// 👤 Жених (🔥 с коррекцией позиции для второй картинки)
function drawPlayer() {
    if (groomTransformed && groomNewImg?.complete) {
        const yOffset = GROOM_SIZE.height - GROOM_TRANSFORMED_SIZE.height;
        // 🔥 Добавляем горизонтальный сдвиг: player.x + GROOM_TRANSFORMED_X_SHIFT
        ctx.drawImage(groomNewImg, 
                      player.x + GROOM_TRANSFORMED_X_SHIFT, 
                      player.y + yOffset, 
                      GROOM_TRANSFORMED_SIZE.width, 
                      GROOM_TRANSFORMED_SIZE.height);
    } else if (groomImg?.complete) {
        ctx.drawImage(groomImg, player.x, player.y, GROOM_SIZE.width, GROOM_SIZE.height);
    } else {
        ctx.fillStyle='#4a4a4a'; 
        ctx.fillRect(player.x, player.y, GROOM_SIZE.width, GROOM_SIZE.height);
        ctx.fillStyle='#a5676e'; ctx.fillRect(player.x+20, player.y+20, 80, 30);
        ctx.fillStyle='white'; ctx.fillRect(player.x+80, player.y+10, 20, 20);
        ctx.fillStyle='black'; ctx.fillRect(player.x+88, player.y+14, 10, 10);
    }
}

    function drawBride() {
        if (brideImg?.complete) {
            ctx.drawImage(brideImg, bride.x, bride.y, BRIDE_SIZE.width, BRIDE_SIZE.height);
        } else {
            ctx.fillStyle='#fff'; ctx.fillRect(bride.x, bride.y, BRIDE_SIZE.width, BRIDE_SIZE.height);
            ctx.fillStyle='#e91e63'; ctx.fillRect(bride.x+10, bride.y+10, 60, 60);
            ctx.fillStyle='#fff'; ctx.fillRect(bride.x+20, bride.y+20, 40, 40);
        }
    }

    function drawHeart(x, y, size) {
        if (heartImg?.complete) ctx.drawImage(heartImg, x, y, size, size);
        else { ctx.fillStyle='#e91e63'; ctx.beginPath(); const t=size*0.3; ctx.moveTo(x,y+t);
               ctx.bezierCurveTo(x,y,x-size/2,y,x-size/2,y+t); ctx.bezierCurveTo(x-size/2,y+size*0.6,x,y+size*0.8,x,y+size);
               ctx.bezierCurveTo(x,y+size*0.8,x+size/2,y+size*0.6,x+size/2,y+t); ctx.bezierCurveTo(x+size/2,y,x,y,x,y+t); ctx.fill(); }
    }

    function drawObstacle(obs) {
        ctx.globalAlpha = 1.0;
        ctx.font = `${obs.height}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(obs.emoji, obs.x + obs.width/2, obs.y + obs.height/2 + 3);
        ctx.globalAlpha = 1.0;
    }

    function drawRing() {
        if (ringActive) {
            ctx.globalAlpha = 1.0;
            ctx.font = '42px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            const bob = Math.sin(Date.now() / 250) * 5;
            ctx.fillText('💍', ring.x + ring.width/2, ring.y + ring.height/2 + 5 + bob);
            ctx.globalAlpha = 1.0;
        }
    }

    function collision(a, b) {
        const pad = 8;
        return a.x+pad < b.x+(b.width||b.size)-pad && a.x+a.width-pad > b.x+pad &&
               a.y+pad < b.y+(b.height||b.size)-pad && a.y+a.height-pad > b.y+pad;
    }

    function canSpawnObstacle(now) {
        if (now - lastObstacleTime < OBSTACLE_COOLDOWN) return false;
        if (obstacles.length > 0 && obstacles[obstacles.length-1].x > canvas.width - MIN_DIST) return false;
        return obstacles.length < 1;
    }

    function spawnObstacle(now) {
        if (!canSpawnObstacle(now)) return;
        obstacles.push({ x: canvas.width, y: GROUND_Y - 35, width: 35, height: 35,
                         emoji: OBSTACLE_EMOJIS[Math.floor(Math.random() * OBSTACLE_EMOJIS.length)],
                         speedMod: 1 + Math.random() * 0.2 });
        lastObstacleTime = now;
    }

    function spawnHeart() {
        if (Math.random() < 0.018) hearts.push({ x: canvas.width, y: GROUND_Y - 85 - Math.random()*45, size: 38 });
    }

    // 🔄 ИГРОВОЙ ЦИКЛ
    function update(now) {
        player.dy += player.gravity; player.y += player.dy;
        if (player.y + player.height >= GROUND_Y) {
            player.y = GROUND_Y - player.height; player.dy = 0; player.grounded = true;
        } else player.grounded = false;

        for (let i = obstacles.length-1; i >= 0; i--) {
            const o = obstacles[i]; o.x -= gameSpeed * o.speedMod;
            if (collision(player, o)) { playSound('gameover'); gameOver(); return; }
            if (o.x + o.width < 0) obstacles.splice(i, 1);
        }
        for (let i = hearts.length-1; i >= 0; i--) {
            const h = hearts[i]; h.x -= gameSpeed;
            if (collision(player, h)) { score++; hearts.splice(i, 1); scoreDisplay.textContent = `💜 ${score} / ${WIN_SCORE}`; playSound('collect');
            } else if (h.x + h.size < 0) hearts.splice(i, 1);
        }

        // 💍 Кольцо
        if (score >= WIN_SCORE && !ringActive && !groomTransformed) {
            ringActive = true; obstacles = []; hearts = []; gameSpeed = 0;
            ring.x = canvas.width + 50; ring.y = player.y + 35;
        }
        if (ringActive) {
            ring.x -= 2.2;
            if (collision(player, ring)) {
                ringActive = false; groomTransformed = true; playSound('collect');
                setTimeout(activateBride, 800);
            } else if (ring.x < -60) { ring.x = canvas.width + 50; }
        }

        // 👰 Невеста (🔥 с вашими настройками шага)
        if (brideActive) {
            if (now - brideStepTimer > BRIDE_STEP_DELAY) { bride.x -= BRIDE_STEP_LENGTH; brideStepTimer = now; }
            if (collision(player, bride)) { playSound('victory'); victory(); return; }
            if (bride.x + bride.width < -50) brideActive = false;
        }

        if (!ringActive && !groomTransformed && !brideActive) { spawnObstacle(now); spawnHeart(); }
        gameSpeed = Math.min(7, 3 + Math.floor(score/10)*0.5);
    }

    function activateBride() { 
        brideActive = true; bride.x = canvas.width + 10; brideStepTimer = 0;
        obstacles = []; hearts = []; gameSpeed = 0.005; 
    }

// 🔥 Финальная картинка — исправленная версия
function victory() {
    gameRunning = false; 
    cancelAnimationFrame(animFrameId);
    canvas.style.display = 'none'; 
    startBtn.style.display = 'none';
    scoreDisplay.style.display = 'none'; 
    goalDisplay.style.display = 'none';
    winDiv.style.display = 'block';
    
    // 🔥 Надёжное отображение финальной картинки
    if (ENDING_IMG_SRC) {
        const finalImg = document.getElementById('endingImage');
        if (finalImg) {
            finalImg.src = ENDING_IMG_SRC;
            finalImg.style.display = 'block';
            finalImg.style.maxWidth = ENDING_IMG_MAX_WIDTH;
            finalImg.style.margin = '0 auto';
            finalImg.style.borderRadius = '12px';
            // Принудительная перезагрузка, если картинка в кэше
            finalImg.onload = () => { finalImg.style.opacity = '1'; };
            if (finalImg.complete) finalImg.style.opacity = '1';
        } else {
            // 🔥 Если элемента нет — создаём его динамически
            const newImg = document.createElement('img');
            newImg.id = 'endingImage';
            newImg.src = ENDING_IMG_SRC;
            newImg.style.maxWidth = ENDING_IMG_MAX_WIDTH;
            newImg.style.margin = '0 auto';
            newImg.style.display = 'block';
            newImg.style.borderRadius = '12px';
            newImg.style.marginTop = '15px';
            winDiv.insertBefore(newImg, document.getElementById('gameReplay'));
        }
    }
    
    const btn = document.getElementById('gameReplay'); 
    if (btn) btn.style.display = 'inline-block';
}

    function gameOver() {
        gameRunning = false; cancelAnimationFrame(animFrameId);
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = 'white'; ctx.font = 'bold 22px "Playfair Display", serif'; ctx.textAlign = 'center';
        ctx.fillText('Попробуйте ещё раз! 💜', canvas.width/2, canvas.height/2);
        startBtn.textContent = '🔁 Играть заново'; startBtn.style.display = 'inline-block';
        goalDisplay.style.display = 'none';
    }

    function draw() {
        drawBackground();
        // 🔥 "Пол" убран по вашему запросу

        hearts.forEach(h => drawHeart(h.x, h.y, h.size));
        obstacles.forEach(o => drawObstacle(o));
        drawRing();
        if (brideActive) drawBride();
        drawPlayer();
    }

    function gameLoop(ts) { if (!gameRunning) return; update(ts); draw(); animFrameId = requestAnimationFrame(gameLoop); }
    
    function jump() { 
        if (player.grounded && gameRunning) { 
            player.dy = player.jumpPower; player.grounded = false; 
            playSound('jump'); 
        } 
    }
    
    function resetGame() {
        obstacles=[]; hearts=[]; score=0; gameSpeed=3; brideActive=false; ringActive=false; groomTransformed=false;
        player.y = GROUND_Y - GROOM_SIZE.height; player.dy=0; player.grounded=true;
        lastObstacleTime=0; scoreDisplay.textContent=`💜 0 / ${WIN_SCORE}`;
        canvas.style.display='block'; winDiv.style.display='none';
        startBtn.style.display='inline-block'; startBtn.textContent='▶️ Начать';
        scoreDisplay.style.display='block'; goalDisplay.style.display='none';
    }

    let replayBtn = document.getElementById('gameReplay');
    if (!replayBtn) {
        replayBtn = document.createElement('button'); replayBtn.id='gameReplay'; replayBtn.className='game-replay-btn';
        replayBtn.textContent='🔁 Повторить игру'; replayBtn.style.display='none'; winDiv.appendChild(replayBtn);
        replayBtn.addEventListener('click', () => { winDiv.style.display='none'; replayBtn.style.display='none';
            if(endingImg) endingImg.style.display='none'; resetGame(); gameRunning=true;
            startBtn.style.display = 'none'; // 🔥 Сразу скрываем кнопку, т.к. игра уже запущена
            goalDisplay.style.display = 'none'; // 🔥 БЫЛО 'block' → СТАЛО 'none'
            animFrameId=requestAnimationFrame(gameLoop); goalDisplay.style.display='block'; initAudio(); });
    }

    // 🔥 Полноэкранный режим ТОЛЬКО для мобильных
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    }

function enterFullscreen() {
    if (!isMobile()) return;
    
    const container = document.querySelector('.game-container');
    if (!container) return;

    if (container.requestFullscreen) container.requestFullscreen().catch(() => {});
    else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();

    container.classList.add('game-fullscreen-mode');
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    // 🔥 Визуальная подсказка повернуть телефон (только для портретного режима)
    if (!document.getElementById('rotateHint')) {
        const hint = document.createElement('div');
        hint.id = 'rotateHint';
        hint.innerHTML = '🔄 Поверните телефон для лучшего опыта';
        hint.style.cssText = `
            position:fixed; top:50%; left:50%; 
            transform:translate(-50%,-50%) rotate(-90deg);
            background:rgba(52,10,131,0.9); color:white;
            padding:12px 25px; border-radius:30px;
            font-family:var(--heading); font-size:16px;
            z-index:10002; white-space:nowrap;
            animation:pulseRotate 2s ease-in-out infinite;
            display:none;
        `;
        document.body.appendChild(hint);
        
        // Показываем только если экран в портрете
        if (window.innerHeight > window.innerWidth) {
            hint.style.display = 'block';
            setTimeout(() => { hint.style.opacity = '0'; hint.style.transition = 'opacity 0.5s'; }, 4000);
        }
    }
    
    // Кнопка выхода для iOS
    if (!document.getElementById('gameExitBtn')) {
        const exitBtn = document.createElement('button');
        exitBtn.id = 'gameExitBtn';
        exitBtn.textContent = '✕';
        exitBtn.style.cssText = 'position:absolute;top:12px;right:12px;z-index:10001;width:36px;height:36px;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
        container.appendChild(exitBtn);
        exitBtn.addEventListener('click', exitFullscreen);
    }
    
    // Пытаемся заблокировать ориентацию (работает в некоторых браузерах)
    if (screen.orientation?.lock) {
        screen.orientation.lock('landscape').catch(() => {});
    }
}

function exitFullscreen() {
    const container = document.querySelector('.game-container');
    if (!container) return;
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    container.classList.remove('game-fullscreen-mode');
    
    const exitBtn = document.getElementById('gameExitBtn');
    if (exitBtn) exitBtn.remove();
    
    // 🔥 УДАЛЯЕМ подсказку "Поверните телефон"
    const hint = document.getElementById('rotateHint');
    if (hint) hint.remove();
    
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    
    // Разблокируем ориентацию
    if (screen.orientation?.unlock) screen.orientation.unlock();
}

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) exitFullscreen();
    });

    // 🚀 СТАРТ ИГРЫ
    startBtn.addEventListener('click', () => {
        enterFullscreen(); // 🔥 Только на мобильных
        initAudio(); resetGame(); gameRunning=true; startBtn.style.display='none'; 
        goalDisplay.style.display = 'none'; // ✅ Скрываем надпись во время игры
        animFrameId=requestAnimationFrame(gameLoop);
    });
    
  
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); if(gameRunning) jump(); }, {passive:false});
    canvas.addEventListener('mousedown', (e) => { if(gameRunning) { e.preventDefault(); jump(); }});

    // 🎬 Инициализация
    goalDisplay.style.display = 'none'; scoreDisplay.textContent = `💜 0 / ${WIN_SCORE}`;
    
    // Запускаем заставку
    drawIdleScreen();
});
