document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    // 🔥 ОПТИМИЗАЦИЯ: отключаем прозрачность + убираем сглаживание
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    ctx.imageSmoothingEnabled = false;
    
    const scoreDisplay = document.getElementById('gameScore');
    const startBtn = document.getElementById('gameStart');
    const winDiv = document.getElementById('winMessage');
    const endingImg = document.getElementById('endingImage');
    
    let goalDisplay = document.getElementById('gameGoal');
    if (!goalDisplay) {
        goalDisplay = document.createElement('div');
        goalDisplay.id = 'gameGoal';
        goalDisplay.className = 'game-goal';
        canvas.parentElement.insertBefore(goalDisplay, canvas);
    }
    
    // 🔥 ДЕТЕКТОР iOS ДЛЯ ОПТИМИЗАЦИИ
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // 🔥 ОПТИМИЗАЦИЯ: на iOS уменьшаем канвас и ограничиваем FPS
    const TARGET_FPS = isIOS ? 30 : 60; // 🔥 30 FPS на iOS достаточно
    const FRAME_INTERVAL = 1000 / TARGET_FPS;
    const CANVAS_WIDTH = isIOS ? 400 : 600;  // 🔥 Меньше размер = быстрее
    const CANVAS_HEIGHT = isIOS ? 267 : 400;
    
    // 🎨 НАСТРОЙКИ
    const GAME_BG_IMG = 'images/game/game-bg.jpg';
    const GAME_BG_COLOR = '#ffeef2';
    const WIN_SCORE = 11;
    const OBSTACLE_EMOJIS = ['🍾', '🥂', '🎁', '🎂', '📷', '👠'];
    
    // 🔥 Масштаб для iOS (всё рисуется в "виртуальных" 600x400, но отображается в 400x267)
    const SCALE = isIOS ? (400 / 600) : 1;
    
    const GROOM_SIZE = { width: 112, height: 145 };
    const GROOM_TRANSFORMED_SIZE = { width: 62, height: 150 };
    const BRIDE_SIZE = { width: 105, height: 145 };
    
    const GROUND_Y_OFFSET = 65;
    const PLAYER_START_X = 80;
    const JUMP_POWER = -13;
    const GRAVITY = 0.45;
    const BRIDE_STEP_DELAY = 550;
    const BRIDE_STEP_LENGTH = 30;
    const GROOM_TRANSFORMED_X_SHIFT = 25;
    const ENDING_IMG_MAX_WIDTH = '25%';
    
    let gameBgImage = null;
    if (GAME_BG_IMG) { 
        gameBgImage = new Image(); 
        gameBgImage.src = GAME_BG_IMG; 
    }
    
    // 🔊 Звуки
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    
    function initAudio() { 
        if (!audioCtx) { 
            audioCtx = new AudioCtx(); 
            if (audioCtx.state === 'suspended') audioCtx.resume(); 
        } 
    }
    
    function playSound(type) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); 
        gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        
        switch(type) {
            case 'jump': 
                osc.type='sine'; 
                osc.frequency.setValueAtTime(320,now); 
                osc.frequency.exponentialRampToValueAtTime(640,now+0.1); 
                gain.gain.setValueAtTime(0.25,now); 
                gain.gain.exponentialRampToValueAtTime(0.01,now+0.12); 
                osc.start(now); osc.stop(now+0.12); 
                break;
            case 'collect': 
                osc.type='sine'; 
                osc.frequency.setValueAtTime(880,now); 
                osc.frequency.exponentialRampToValueAtTime(1320,now+0.12); 
                gain.gain.setValueAtTime(0.2,now); 
                gain.gain.exponentialRampToValueAtTime(0.01,now+0.18); 
                osc.start(now); osc.stop(now+0.18); 
                break;
            case 'gameover': 
                osc.type='triangle'; 
                osc.frequency.setValueAtTime(400,now); 
                osc.frequency.exponentialRampToValueAtTime(120,now+0.4); 
                gain.gain.setValueAtTime(0.25,now); 
                gain.gain.exponentialRampToValueAtTime(0.01,now+0.4); 
                osc.start(now); osc.stop(now+0.4); 
                break;
            case 'victory': 
                [523.25,659.25,783.99].forEach((f,i)=>{
                    const o=audioCtx.createOscillator();
                    const g=audioCtx.createGain();
                    o.connect(g); g.connect(audioCtx.destination);
                    o.type='sine'; o.frequency.value=f;
                    g.gain.setValueAtTime(0.15,now+i*0.12);
                    g.gain.exponentialRampToValueAtTime(0.01,now+i*0.12+0.5);
                    o.start(now+i*0.12); o.stop(now+i*0.12+0.5);
                }); 
                return;
        }
    }
    
    // 📐 Канвас
    canvas.width = CANVAS_WIDTH; 
    canvas.height = CANVAS_HEIGHT;
    const GROUND_Y = CANVAS_HEIGHT - (GROUND_Y_OFFSET * SCALE);
    
    // 🔥 КЭШИРОВАНИЕ ЭМОДЗИ (один раз при старте)
    const emojiCache = {};
    
    function createEmojiImage(emoji, size) {
        const offscreen = document.createElement('canvas');
        offscreen.width = size;
        offscreen.height = size;
        const offCtx = offscreen.getContext('2d');
        offCtx.font = `${size * 0.8}px serif`;
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText(emoji, size / 2, size / 2);
        return offscreen;
    }
    
    // Кэшируем все эмодзи при инициализации
    OBSTACLE_EMOJIS.forEach(emoji => {
        emojiCache[emoji] = createEmojiImage(emoji, Math.round(35 * SCALE));
    });
    emojiCache['💍'] = createEmojiImage('💍', Math.round(45 * SCALE));
    emojiCache['💜'] = createEmojiImage('💜', Math.round(38 * SCALE));
    
    // 🔥 КЭШ ЗАСТАВКИ (текст + фон рисуем один раз)
    let idleCache = null;
    
    function buildIdleCache() {
        if (idleCache) return idleCache;
        
        idleCache = document.createElement('canvas');
        idleCache.width = CANVAS_WIDTH;
        idleCache.height = CANVAS_HEIGHT;
        const offCtx = idleCache.getContext('2d');
        
        // Фон
        offCtx.fillStyle = GAME_BG_COLOR;
        offCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        if (gameBgImage?.complete && gameBgImage.naturalWidth > 0) {
            offCtx.drawImage(gameBgImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
        
        // Затемнение
        offCtx.fillStyle = 'rgba(245, 240, 232, 0.7)';
        offCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Заголовок
        offCtx.fillStyle = '#422b5c';
        offCtx.font = `bold ${Math.round(28 * SCALE)}px "Amatic SC", cursive`;
        offCtx.textAlign = 'center';
        offCtx.fillText('💍 Love Leap: Groom Run', CANVAS_WIDTH/2, 45 * SCALE);
        
        // Описание
        offCtx.font = `${Math.round(15 * SCALE)}px "Comfortaa", serif`;
        offCtx.fillStyle = '#55357a';
        offCtx.fillText('Жених спешит к невесте, а путь преграждают', CANVAS_WIDTH/2, 70 * SCALE);
        offCtx.fillText('летящие торты, бокалы и другие «сюрпризы».', CANVAS_WIDTH/2, 90 * SCALE);
        offCtx.fillText('Прыгай, собирай 11 сердечек и встречай невесту!', CANVAS_WIDTH/2, 110 * SCALE);
        
        return idleCache;
    }
    
    // 👤 Игрок
    let player = { 
        x: PLAYER_START_X * SCALE, 
        y: GROUND_Y - GROOM_SIZE.height * SCALE, 
        width: GROOM_SIZE.width * SCALE, 
        height: GROOM_SIZE.height * SCALE, 
        dy: 0, 
        gravity: GRAVITY * SCALE, 
        jumpPower: JUMP_POWER * SCALE, 
        grounded: true 
    };
    
    let obstacles = [], hearts = [], score = 0, gameSpeed = 3 * SCALE;
    let gameRunning = false, animFrameId, lastObstacleTime = 0;
    const OBSTACLE_COOLDOWN = 1500, MIN_DIST = CANVAS_WIDTH * 0.4;
    
    // 👰 Невеста
    let brideActive = false;
    let brideStepTimer = 0; 
    let bride = { 
        x: CANVAS_WIDTH, 
        y: GROUND_Y - BRIDE_SIZE.height * SCALE + 4 * SCALE,
        width: BRIDE_SIZE.width * SCALE, 
        height: BRIDE_SIZE.height * SCALE 
    };
    
    // 💍 Кольцо
    let ringActive = false;
    let groomTransformed = false;
    let ring = { x: 0, y: 0, width: 45 * SCALE, height: 45 * SCALE };
    
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
    
    // 🔥 КЭШ ФОНА
    let bgCache = null;
    
    function cacheBackground() {
        if (!gameBgImage?.complete || gameBgImage.naturalWidth === 0) return;
        
        bgCache = document.createElement('canvas');
        bgCache.width = CANVAS_WIDTH;
        bgCache.height = CANVAS_HEIGHT;
        const bgCtx = bgCache.getContext('2d');
        bgCtx.fillStyle = GAME_BG_COLOR;
        bgCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        bgCtx.drawImage(gameBgImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    // 🎨 Фон
    function drawBackground() {
        if (bgCache) {
            ctx.drawImage(bgCache, 0, 0);
        } else {
            ctx.fillStyle = GAME_BG_COLOR;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            if (gameBgImage?.complete && gameBgImage.naturalWidth > 0) {
                ctx.drawImage(gameBgImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                cacheBackground();
            }
        }
    }
    
    // 🌸 Заставка (используем кэш + рисуем только сердечки)
    let lastIdleUpdate = 0;
    
    function drawIdleScreen(timestamp) {
        // 🔥 FPS limiter
        if (timestamp - lastIdleUpdate < FRAME_INTERVAL) {
            if (!gameRunning) requestAnimationFrame(drawIdleScreen);
            return;
        }
        lastIdleUpdate = timestamp;
        
        // Рисуем кэшированную заставку (текст + фон)
        const cached = buildIdleCache();
        ctx.drawImage(cached, 0, 0);
        
        // 🔥 Рисуем ТОЛЬКО сердечки (они двигаются)
        const t = timestamp / 1000;
        const heartSize = Math.round(26 * SCALE);
        for(let i = 0; i < 6; i++) {
            let x = Math.round((70 + i * 95) * SCALE);
            let y = Math.round((175 + Math.sin(t * 0.7 + i * 1.3) * 18) * SCALE);
            ctx.drawImage(emojiCache['💜'], x - heartSize/2, y - heartSize/2, heartSize, heartSize);
        }
        
        if (!gameRunning) requestAnimationFrame(drawIdleScreen);
    }
    
    // 👤 Жених
    function drawPlayer() {
        if (groomTransformed && groomNewImg?.complete) {
            const yOffset = (GROOM_SIZE.height - GROOM_TRANSFORMED_SIZE.height) * SCALE;
            ctx.drawImage(groomNewImg,
                player.x + GROOM_TRANSFORMED_X_SHIFT * SCALE,
                player.y + yOffset,
                GROOM_TRANSFORMED_SIZE.width * SCALE,
                GROOM_TRANSFORMED_SIZE.height * SCALE);
        } else if (groomImg?.complete) {
            ctx.drawImage(groomImg, player.x, player.y, player.width, player.height);
        } else {
            ctx.fillStyle='#4a4a4a';
            ctx.fillRect(player.x, player.y, player.width, player.height);
        }
    }
    
    function drawBride() {
        if (brideImg?.complete) {
            ctx.drawImage(brideImg, bride.x, bride.y, bride.width, bride.height);
        } else {
            ctx.fillStyle='#fff'; 
            ctx.fillRect(bride.x, bride.y, bride.width, bride.height);
        }
    }
    
    function drawHeart(x, y, size) {
        if (heartImg?.complete) {
            ctx.drawImage(heartImg, x, y, size, size);
        } else { 
            ctx.drawImage(emojiCache['💜'], x, y, size, size);
        }
    }
    
    function drawObstacle(obs) {
        // 🔥 Используем кэш эмодзи
        ctx.drawImage(emojiCache[obs.emoji], obs.x, obs.y, obs.width, obs.height);
    }
    
    function drawRing() {
        if (!ringActive) return;
        const bob = Math.sin(Date.now() / 250) * 5 * SCALE;
        ctx.drawImage(emojiCache['💍'], ring.x, ring.y + bob, ring.width, ring.height);
    }
    
    function collision(a, b) {
        const pad = 8 * SCALE;
        return a.x+pad < b.x+(b.width||b.size)-pad && a.x+a.width-pad > b.x+pad &&
               a.y+pad < b.y+(b.height||b.size)-pad && a.y+a.height-pad > b.y+pad;
    }
    
    function canSpawnObstacle(now) {
        if (now - lastObstacleTime < OBSTACLE_COOLDOWN) return false;
        if (obstacles.length > 0 && obstacles[obstacles.length-1].x > CANVAS_WIDTH - MIN_DIST) return false;
        return obstacles.length < 1;
    }
    
    function spawnObstacle(now) {
        if (!canSpawnObstacle(now)) return;
        obstacles.push({ 
            x: CANVAS_WIDTH, 
            y: GROUND_Y - 35 * SCALE, 
            width: 35 * SCALE, 
            height: 35 * SCALE,
            emoji: OBSTACLE_EMOJIS[Math.floor(Math.random() * OBSTACLE_EMOJIS.length)],
            speedMod: 1 + Math.random() * 0.2 
        });
        lastObstacleTime = now;
    }
    
    function spawnHeart() {
        if (Math.random() < 0.018) {
            hearts.push({ 
                x: CANVAS_WIDTH, 
                y: GROUND_Y - 85 * SCALE - Math.random() * 45 * SCALE, 
                size: 38 * SCALE 
            });
        }
    }
    
    // 🔄 ИГРОВОЙ ЦИКЛ
    function update(now) {
        player.dy += player.gravity; 
        player.y += player.dy;
        
        if (player.y + player.height >= GROUND_Y) {
            player.y = GROUND_Y - player.height; 
            player.dy = 0; 
            player.grounded = true;
        } else {
            player.grounded = false;
        }
        
        for (let i = obstacles.length-1; i >= 0; i--) {
            const o = obstacles[i]; 
            o.x -= gameSpeed * o.speedMod;
            if (collision(player, o)) { 
                playSound('gameover'); 
                gameOver(); 
                return; 
            }
            if (o.x + o.width < 0) obstacles.splice(i, 1);
        }
        
        for (let i = hearts.length-1; i >= 0; i--) {
            const h = hearts[i]; 
            h.x -= gameSpeed;
            if (collision(player, h)) { 
                score++; 
                hearts.splice(i, 1); 
                scoreDisplay.textContent = `💜 ${score} / ${WIN_SCORE}`; 
                playSound('collect');
            } else if (h.x + h.size < 0) {
                hearts.splice(i, 1);
            }
        }
        
        if (score >= WIN_SCORE && !ringActive && !groomTransformed) {
            ringActive = true; 
            obstacles = []; 
            hearts = []; 
            gameSpeed = 0;
            ring.x = CANVAS_WIDTH + 50 * SCALE; 
            ring.y = player.y + 35 * SCALE;
        }
        
        if (ringActive) {
            ring.x -= 2.2 * SCALE;
            if (collision(player, ring)) {
                ringActive = false; 
                groomTransformed = true; 
                playSound('collect');
                setTimeout(activateBride, 800);
            } else if (ring.x < -60 * SCALE) { 
                ring.x = CANVAS_WIDTH + 50 * SCALE; 
            }
        }
        
        if (brideActive) {
            if (now - brideStepTimer > BRIDE_STEP_DELAY) { 
                bride.x -= BRIDE_STEP_LENGTH * SCALE; 
                brideStepTimer = now; 
            }
            if (collision(player, bride)) { 
                playSound('victory'); 
                victory(); 
                return; 
            }
            if (bride.x + bride.width < -50 * SCALE) brideActive = false;
        }
        
        if (!ringActive && !groomTransformed && !brideActive) { 
            spawnObstacle(now); 
            spawnHeart(); 
        }
        
        gameSpeed = Math.min(7 * SCALE, 3 * SCALE + Math.floor(score/10) * 0.5 * SCALE);
    }
    
    function activateBride() { 
        brideActive = true; 
        bride.x = CANVAS_WIDTH + 10 * SCALE; 
        brideStepTimer = 0;
        obstacles = []; 
        hearts = []; 
        gameSpeed = 0.005 * SCALE; 
    }
    
    function victory() {
        gameRunning = false;
        cancelAnimationFrame(animFrameId);
        canvas.style.display = 'none';
        startBtn.style.display = 'none';
        scoreDisplay.style.display = 'none';
        goalDisplay.style.display = 'none';
        winDiv.style.display = 'block';
        
        if (ENDING_IMG_SRC) {
            const finalImg = document.getElementById('endingImage');
            if (finalImg) {
                finalImg.src = ENDING_IMG_SRC;
                finalImg.style.display = 'block';
                finalImg.style.maxWidth = ENDING_IMG_MAX_WIDTH;
                finalImg.style.margin = '0 auto';
                finalImg.style.borderRadius = '12px';
                finalImg.onload = () => { finalImg.style.opacity = '1'; };
                if (finalImg.complete) finalImg.style.opacity = '1';
            } else {
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
        gameRunning = false; 
        cancelAnimationFrame(animFrameId);
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; 
        ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
        ctx.fillStyle = 'white'; 
        ctx.font = `bold ${Math.round(22 * SCALE)}px "Playfair Display", serif`; 
        ctx.textAlign = 'center';
        ctx.fillText('Попробуйте ещё раз! 💜', CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
        startBtn.textContent = 'Играть заново'; 
        startBtn.style.display = 'inline-block';
        goalDisplay.style.display = 'none';
    }
    
    function draw() {
        drawBackground();
        hearts.forEach(h => drawHeart(h.x, h.y, h.size));
        obstacles.forEach(o => drawObstacle(o));
        drawRing();
        if (brideActive) drawBride();
        drawPlayer();
    }
    
    // 🔥 FPS limiter для игрового цикла
    let lastFrameTime = 0;
    
    function gameLoop(ts) { 
        if (!gameRunning) return; 
        
        // 🔥 Ограничиваем FPS
        if (ts - lastFrameTime < FRAME_INTERVAL) {
            animFrameId = requestAnimationFrame(gameLoop);
            return;
        }
        lastFrameTime = ts;
        
        update(ts); 
        draw(); 
        animFrameId = requestAnimationFrame(gameLoop); 
    }
    
    function jump() { 
        if (player.grounded && gameRunning) { 
            player.dy = player.jumpPower; 
            player.grounded = false; 
            playSound('jump'); 
        } 
    }
    
    function resetGame() {
        obstacles=[]; 
        hearts=[]; 
        score=0; 
        gameSpeed = 3 * SCALE; 
        brideActive=false; 
        ringActive=false; 
        groomTransformed=false;
        player.x = PLAYER_START_X * SCALE;
        player.y = GROUND_Y - GROOM_SIZE.height * SCALE; 
        player.dy=0; 
        player.grounded=true;
        lastObstacleTime=0; 
        scoreDisplay.textContent=`💜 0 / ${WIN_SCORE}`;
        canvas.style.display='block'; 
        winDiv.style.display='none';
        startBtn.style.display='inline-block'; 
        startBtn.textContent='▶️ Начать';
        scoreDisplay.style.display='block'; 
        goalDisplay.style.display='none';
    }
    
    let replayBtn = document.getElementById('gameReplay');
    if (!replayBtn) {
        replayBtn = document.createElement('button'); 
        replayBtn.id='gameReplay'; 
        replayBtn.className='game-replay-btn';
        replayBtn.textContent='Повторить игру'; 
        replayBtn.style.display='none'; 
        winDiv.appendChild(replayBtn);
        replayBtn.addEventListener('click', () => { 
            winDiv.style.display='none'; 
            replayBtn.style.display='none';
            if(endingImg) endingImg.style.display='none'; 
            resetGame(); 
            gameRunning=true;
            startBtn.style.display = 'none';
            goalDisplay.style.display = 'none';
            lastFrameTime = 0;
            animFrameId=requestAnimationFrame(gameLoop); 
            goalDisplay.style.display='block'; 
            initAudio(); 
        });
    }
    
    // 🔥 Полноэкранный режим ТОЛЬКО для мобильных
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    }
    
    function enterFullscreen() {
        if (!isMobile()) return;
        const container = document.querySelector('.game-container');
        if (!container) return;
        
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        if (isIOSDevice) {
            container.classList.add('game-fullscreen-mode');
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.top = '0';
            document.body.style.left = '0';
            document.body.style.touchAction = 'none';
            
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu) navMenu.style.display = 'none';
            
            document.querySelectorAll('.section').forEach(section => {
                if (!section.contains(container)) {
                    section.style.visibility = 'hidden';
                }
            });
        } else {
            if (container.requestFullscreen) {
                container.requestFullscreen().catch(() => {});
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            }
            container.classList.add('game-fullscreen-mode');
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        }
        
        if (!document.getElementById('gameExitBtn')) {
            const exitBtn = document.createElement('button');
            exitBtn.id = 'gameExitBtn';
            exitBtn.textContent = '✕';
            exitBtn.style.cssText = 'position:absolute;top:12px;right:12px;z-index:10001;width:36px;height:36px;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
            container.appendChild(exitBtn);
            exitBtn.addEventListener('click', exitFullscreen);
        }
        
        if (screen.orientation?.lock) {
            screen.orientation.lock('landscape').catch(() => {});
        }
    }
    
    function exitFullscreen() {
        const container = document.querySelector('.game-container');
        if (!container) return;
        
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        if (isIOSDevice) {
            container.classList.remove('game-fullscreen-mode');
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.touchAction = '';
            
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu) navMenu.style.display = '';
            
            document.querySelectorAll('.section').forEach(section => {
                section.style.visibility = '';
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            container.classList.remove('game-fullscreen-mode');
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }
        
        const exitBtn = document.getElementById('gameExitBtn');
        if (exitBtn) exitBtn.remove();
        
        if (screen.orientation?.unlock) screen.orientation.unlock();
    }
    
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) exitFullscreen();
    });
    
    // 🚀 СТАРТ ИГРЫ
    startBtn.addEventListener('click', () => {
        enterFullscreen();
        initAudio(); 
        resetGame(); 
        gameRunning=true; 
        startBtn.style.display='none'; 
        goalDisplay.style.display = 'none';
        lastFrameTime = 0;
        animFrameId=requestAnimationFrame(gameLoop);
    });
    
    canvas.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        if(gameRunning) jump(); 
    }, {passive:false});
    
    canvas.addEventListener('mousedown', (e) => { 
        if(gameRunning) { 
            e.preventDefault(); 
            jump(); 
        }
    });
    
    // 🎬 Инициализация
    goalDisplay.style.display = 'none'; 
    scoreDisplay.textContent = `💜 0 / ${WIN_SCORE}`;
    
    // 🔥 Ждём загрузки фонового изображения перед запуском заставки
    if (gameBgImage) {
        gameBgImage.onload = () => {
            buildIdleCache();
            requestAnimationFrame(drawIdleScreen);
        };
        if (gameBgImage.complete) {
            buildIdleCache();
            requestAnimationFrame(drawIdleScreen);
        }
    } else {
        requestAnimationFrame(drawIdleScreen);
    }
    
    console.log(`🎮 Игра запущена. iOS: ${isIOS}, FPS: ${TARGET_FPS}, Canvas: ${CANVAS_WIDTH}x${CANVAS_HEIGHT}`);
});
