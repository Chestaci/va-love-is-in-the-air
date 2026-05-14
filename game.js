document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('gameScore');
    const startBtn = document.getElementById('gameStart');
    const winDiv = document.getElementById('winMessage');
    const endingImg = document.getElementById('endingImage');
    
    // 🔥 Элемент цели
    let goalDisplay = document.getElementById('gameGoal');
    if (!goalDisplay) {
        goalDisplay = document.createElement('div');
        goalDisplay.id = 'gameGoal';
        goalDisplay.className = 'game-goal';
        canvas.parentElement.insertBefore(goalDisplay, canvas);
    }

    // 🎨 НАСТРОЙКИ
    const GAME_BG_IMG = 'images/game-bg.jpg';
    const GAME_BG_COLOR = '#ffeef2';
    const WIN_SCORE = 15;
    const OBSTACLE_EMOJIS = ['🪵', '🌸', '🎁', '🎈', '🍄', '🧺'];
    
    // 🎪 СМЕШНОЕ НАЗВАНИЕ ИГРЫ
    const GAME_TITLE = "💜 Свадебный раннер";

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
    const GROUND_Y = canvas.height; // 🔥 Земля ровно по нижнему краю холста

    // 👤 Жених (🔥 ЧЁТКО на земле)
    let player = { x: 80, y: GROUND_Y - 140, width: 115, height: 150, dy: 0, gravity: 0.45, jumpPower: -14, grounded: true };
    let obstacles = [], hearts = [], score = 0, gameSpeed = 3;
    let gameRunning = false, animFrameId, lastObstacleTime = 0;
    const OBSTACLE_COOLDOWN = 1500, MIN_DIST = canvas.width * 0.4;

    // 👰 Невеста (🔥 ЧЁТКО на земле)
    let brideActive = false;
    let brideStepTimer = 0; 
    let bride = { x: canvas.width, y: GROUND_Y - 135, width: 112, height: 139 };

    // 🖼️ Картинки
    const GROOM_IMG_SRC = 'img/groom.png';
    const BRIDE_IMG_SRC = 'img/bride.png';
    const HEART_IMG_SRC = 'img/heart.png';
    const ENDING_IMG_SRC = 'img/ending.jpg';
    let groomImg = null, brideImg = null, heartImg = null;
    if (GROOM_IMG_SRC) { groomImg = new Image(); groomImg.src = GROOM_IMG_SRC; }
    if (BRIDE_IMG_SRC) { brideImg = new Image(); brideImg.src = BRIDE_IMG_SRC; }
    if (HEART_IMG_SRC) { heartImg = new Image(); heartImg.src = HEART_IMG_SRC; }

    // 🎨 Фон
    function drawBackground() {
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = GAME_BG_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (gameBgImage?.complete && gameBgImage.naturalWidth > 0) {
            ctx.globalAlpha = 0.5;
            ctx.drawImage(gameBgImage, 0, 0, canvas.width, canvas.height);
        }
        ctx.globalAlpha = 1.0;
    }

    function drawPlayer() {
        if (groomImg?.complete) ctx.drawImage(groomImg, player.x, player.y, player.width, player.height);
        else { ctx.fillStyle='#4a4a4a'; ctx.fillRect(player.x, player.y, player.width, player.height);
               ctx.fillStyle='#a5676e'; ctx.fillRect(player.x+20, player.y+20, 80, 30);
               ctx.fillStyle='white'; ctx.fillRect(player.x+80, player.y+10, 20, 20);
               ctx.fillStyle='black'; ctx.fillRect(player.x+88, player.y+14, 10, 10); }
    }

    function drawBride() {
        if (brideImg?.complete) ctx.drawImage(brideImg, bride.x, bride.y, bride.width, bride.height);
        else { ctx.fillStyle='#fff'; ctx.fillRect(bride.x, bride.y, bride.width, bride.height);
               ctx.fillStyle='#e91e63'; ctx.fillRect(bride.x+10, bride.y+10, 60, 60);
               ctx.fillStyle='#fff'; ctx.fillRect(bride.x+20, bride.y+20, 40, 40); }
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

    function update(now) {
        player.dy += player.gravity; player.y += player.dy;
        // 🔥 Приземление чётко на уровень земли
        if (player.y + player.height >= GROUND_Y) {
            player.y = GROUND_Y - player.height;
            player.dy = 0; player.grounded = true;
        } else player.grounded = false;

        for (let i = obstacles.length-1; i >= 0; i--) {
            const o = obstacles[i]; o.x -= gameSpeed * o.speedMod;
            if (collision(player, o)) { playSound('gameover'); gameOver(); return; }
            if (o.x + o.width < 0) obstacles.splice(i, 1);
        }
        for (let i = hearts.length-1; i >= 0; i--) {
            const h = hearts[i]; h.x -= gameSpeed;
            if (collision(player, h)) { score++; hearts.splice(i, 1); scoreDisplay.textContent = `💜 ${score} / ${WIN_SCORE}`; playSound('collect');
                if (score >= WIN_SCORE) { activateBride(); return; }
            } else if (h.x + h.size < 0) hearts.splice(i, 1);
        }
        // 🔥 ПОШАГОВОЕ ДВИЖЕНИЕ НЕВЕСТЫ
        if (brideActive) {
            if (now - brideStepTimer > 350) { // Пауза ~450мс между шагами
                bride.x -= 10; // Длина шага (пиксели)
                brideStepTimer = now;
            }
            if (collision(player, bride)) { playSound('victory'); victory(); return; }
            if (bride.x + bride.width < -50) brideActive = false;
        }

        if (!brideActive) { spawnObstacle(now); spawnHeart(); }
        gameSpeed = Math.min(7, 3 + Math.floor(score/10)*0.5);
    }

    function activateBride() { 
        brideActive = true; 
        bride.x = canvas.width; 
        brideStepTimer = 0; // 🔥 Сброс таймера шагов
        obstacles = []; 
        hearts = []; 
        gameSpeed = 0.005; 
    }

    function victory() {
        gameRunning = false; cancelAnimationFrame(animFrameId);
        canvas.style.display = 'none'; startBtn.style.display = 'none';
        scoreDisplay.style.display = 'none'; goalDisplay.style.display = 'none';
        winDiv.style.display = 'block';
        if (ENDING_IMG_SRC) { endingImg.src = ENDING_IMG_SRC; endingImg.style.display = 'block'; endingImg.style.maxWidth = '65%'; endingImg.style.margin = '0 auto'; }
        const btn = document.getElementById('gameReplay'); if (btn) btn.style.display = 'inline-block';
    }

    function gameOver() {
        gameRunning = false; cancelAnimationFrame(animFrameId);
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = 'white'; ctx.font = 'bold 22px Marck Script'; ctx.textAlign = 'center';
        ctx.fillText('Попробуйте ещё раз! 💜', canvas.width/2, canvas.height/2);
        startBtn.textContent = '🔁 Играть заново'; startBtn.style.display = 'inline-block';
        goalDisplay.style.display = 'none';
    }

    function draw() {
        drawBackground();
        // 🔥 Мягкий "пол" без линии
        const grd = ctx.createLinearGradient(0, GROUND_Y, 0, canvas.height);
        grd.addColorStop(0, 'rgba(155,126,209,0.15)'); grd.addColorStop(1, 'rgba(155,126,209,0.4)');
        ctx.fillStyle = grd; ctx.fillRect(0, GROUND_Y, canvas.width, 30);

        hearts.forEach(h => drawHeart(h.x, h.y, h.size));
        obstacles.forEach(o => drawObstacle(o));
        if (brideActive) drawBride();
        drawPlayer();
    }

    function gameLoop(ts) { if (!gameRunning) return; update(ts); draw(); animFrameId = requestAnimationFrame(gameLoop); }
    function jump() { if (player.grounded && gameRunning) { player.dy = player.jumpPower; player.grounded = false; playSound('jump'); } }
    
    function resetGame() {
        obstacles=[]; hearts=[]; score=0; gameSpeed=3; brideActive=false;
        player.y = GROUND_Y - player.height; player.dy=0; player.grounded=true;
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
            animFrameId=requestAnimationFrame(gameLoop); goalDisplay.style.display='block'; initAudio(); });
    }

    // 🔥 Название игры над стартовым экраном
    const titleEl = document.createElement('div');
    titleEl.className = 'game-title';
    titleEl.textContent = GAME_TITLE;
    canvas.parentElement.insertBefore(titleEl, canvas);

    startBtn.addEventListener('click', () => {
        initAudio(); resetGame(); gameRunning=true; startBtn.style.display='none'; 
        goalDisplay.style.display='block'; titleEl.style.display='none'; // Скрываем название при старте
        animFrameId=requestAnimationFrame(gameLoop);
    });
    
    document.addEventListener('keydown', e => { if((e.code==='Space'||e.code==='ArrowUp')&&gameRunning) { e.preventDefault(); jump(); }});
    canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); }, {passive:false});
    canvas.addEventListener('mousedown', e => { if(gameRunning) { e.preventDefault(); jump(); }});

    goalDisplay.textContent = `Соберите ${WIN_SCORE} сердечек! 💜`;
    goalDisplay.style.display = 'none'; scoreDisplay.textContent = `💜 0 / ${WIN_SCORE}`;
    drawBackground(); ctx.fillStyle='var(--primary)'; ctx.font='18px var(--heading)'; ctx.textAlign='center';
    ctx.fillText('Нажмите «Начать» 💜', canvas.width/2, canvas.height/2);
});
