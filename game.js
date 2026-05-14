document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('gameScore');
    const startBtn = document.getElementById('gameStart');
    const winDiv = document.getElementById('winMessage');
    const endingImg = document.getElementById('endingImage');

    // Настройки: изображения (необязательные)
    const GROOM_IMG_SRC = 'img/groom.png';
    const BRIDE_IMG_SRC = 'img/bride.png';
    const ENDING_IMG_SRC = 'img/ending.jpg';
    const HEART_IMG_SRC = 'img/heart.png';  // иконка сердечка
    const WIN_SCORE = 7;

    // Увеличиваем canvas для крупных персонажей (сохраняем пропорции)
    canvas.width = 600;
    canvas.height = 400;   // было 200, стало выше
    const GROUND_Y = canvas.height - 30;

    // Персонаж в 4 раза больше: 120x120 (примерно)
    let player = {
        x: 80,
        y: GROUND_Y - 120,
        width: 105,
        height: 140,
        dy: 0,
        gravity: 0.45,
        jumpPower: -15,   // усилим прыжок, чтобы перепрыгивать высокие препятствия
        grounded: true
    };

    let obstacles = [];
    let hearts = [];
    let score = 0;
    let gameSpeed = 3;
    let gameRunning = false;
    let animFrameId;
    let lastObstacleTime = 0;
    const OBSTACLE_COOLDOWN = 1500;
    const MIN_DIST = canvas.width * 0.4; // расстояние между препятствиями

    let brideActive = false;
    let bride = {
        x: canvas.width,
        y: GROUND_Y - 130,
        width: 100,    // невеста чуть изящнее, ширина меньше
        height: 130
    };

    // Загрузка изображений
    let groomImg = null, brideImg = null, heartImg = null;
    if (GROOM_IMG_SRC) { groomImg = new Image(); groomImg.src = GROOM_IMG_SRC; }
    if (BRIDE_IMG_SRC) { brideImg = new Image(); brideImg.src = BRIDE_IMG_SRC; }
    if (HEART_IMG_SRC) {
        heartImg = new Image();
        heartImg.src = HEART_IMG_SRC;
    }

    function drawPlayer() {
        if (groomImg && groomImg.complete) {
            ctx.drawImage(groomImg, player.x, player.y, player.width, player.height);
        } else {
            // Рисованный жених (увеличенный)
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(player.x, player.y, player.width, player.height);
            // Бабочка
            ctx.fillStyle = '#a5676e';
            ctx.fillRect(player.x + 20, player.y + 20, 80, 30);
            // Глаза
            ctx.fillStyle = 'white';
            ctx.fillRect(player.x + 80, player.y + 10, 20, 20);
            ctx.fillStyle = 'black';
            ctx.fillRect(player.x + 88, player.y + 14, 10, 10);
        }
    }

    function drawBride() {
        if (brideImg && brideImg.complete) {
            ctx.drawImage(brideImg, bride.x, bride.y, bride.width, bride.height);
        } else {
            // Рисованная невеста
            ctx.fillStyle = '#fff';
            ctx.fillRect(bride.x, bride.y, bride.width, bride.height);
            ctx.fillStyle = '#e91e63';
            ctx.fillRect(bride.x + 10, bride.y + 10, 60, 60);
            ctx.fillStyle = '#fff';
            ctx.fillRect(bride.x + 20, bride.y + 20, 40, 40);
        }
    }

    function drawHeart(x, y, size) {
        if (heartImg && heartImg.complete) {
            ctx.drawImage(heartImg, x, y, size, size);
        } else {
            // Пиксельное сердечко (увеличенное)
            ctx.fillStyle = '#e91e63';
            ctx.beginPath();
            const topCurveHeight = size * 0.3;
            ctx.moveTo(x, y + topCurveHeight);
            ctx.bezierCurveTo(x, y, x - size/2, y, x - size/2, y + topCurveHeight);
            ctx.bezierCurveTo(x - size/2, y + size * 0.6, x, y + size * 0.8, x, y + size);
            ctx.bezierCurveTo(x, y + size * 0.8, x + size/2, y + size * 0.6, x + size/2, y + topCurveHeight);
            ctx.bezierCurveTo(x + size/2, y, x, y, x, y + topCurveHeight);
            ctx.fill();
        }
    }

    function collision(a, b) {
        return a.x < b.x + (b.width || b.size) &&
               a.x + a.width > b.x &&
               a.y < b.y + (b.height || b.size) &&
               a.y + a.height > b.y;
    }

    function canSpawnObstacle(now) {
        if (now - lastObstacleTime < OBSTACLE_COOLDOWN) return false;
        if (obstacles.length > 0 && obstacles[obstacles.length-1].x > canvas.width - MIN_DIST) return false;
        if (obstacles.length >= 1) return false;
        return true;
    }

    function spawnObstacle(now) {
        if (!canSpawnObstacle(now)) return;
        obstacles.push({
            x: canvas.width,
            y: GROUND_Y - 30,   // высота препятствия 80 (было 20, теперь в 4 раза)
            width: 20,
            height: 30
        });
        lastObstacleTime = now;
    }

    function spawnHeart(now) {
        // теперь не чаще 1.2%, но с учётом увеличенного холста
        if (Math.random() < 0.012) {
            hearts.push({
                x: canvas.width,
                y: GROUND_Y - 80 - Math.random() * 40,
                size: 40   // размер сердечка
            });
        }
    }

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

        // Препятствия
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.x -= gameSpeed;
            if (collision(player, obs)) {
                gameOver();
                return;
            }
            if (obs.x + obs.width < 0) obstacles.splice(i, 1);
        }

        // Сердечки
        for (let i = hearts.length - 1; i >= 0; i--) {
            const h = hearts[i];
            h.x -= gameSpeed;
            if (collision(player, h)) {
                score++;
                hearts.splice(i, 1);
                scoreDisplay.textContent = `Сердечки: ${score}`;
                if (score >= WIN_SCORE) {
                    activateBride();
                    return;
                }
            } else if (h.x + h.size < 0) hearts.splice(i, 1);
        }

        // Невеста
        if (brideActive) {
            bride.x -= gameSpeed/3;
            if (collision(player, bride)) {
                victory();
                return;
            }
            if (bride.x + bride.width < 0) brideActive = false;
        }

        if (!brideActive) {
            spawnObstacle(now);
            spawnHeart(now);
        }

        gameSpeed = Math.min(7, 3 + Math.floor(score / 10) * 0.5);
    }

    function activateBride() {
        brideActive = true;
        bride.x = canvas.width;
        obstacles = [];
        hearts = [];
		gameSpeed = 0.005;
    }

    function victory() {
        gameRunning = false;
        cancelAnimationFrame(animFrameId);
        canvas.style.display = 'none';
        startBtn.style.display = 'none';
        scoreDisplay.style.display = 'none';
        winDiv.style.display = 'block';
        if (ENDING_IMG_SRC) {
            endingImg.src = ENDING_IMG_SRC;
            endingImg.style.display = 'block';
        }
    }

    function gameOver() {
        gameRunning = false;
        cancelAnimationFrame(animFrameId);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '24px Marck Script';
        ctx.textAlign = 'center';
        ctx.fillText('Вы проиграли!', canvas.width/2, canvas.height/2);
        startBtn.textContent = 'Играть заново';
        startBtn.style.display = 'inline-block';
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffeef2';
        ctx.fillRect(0, 0, canvas.width, GROUND_Y);

        // Рисуем сердечки (используем функцию)
        hearts.forEach(h => {
            drawHeart(h.x, h.y, h.size);
        });

        // Препятствия
        obstacles.forEach(o => {
            ctx.fillStyle = '#8d6e63';
            ctx.fillRect(o.x, o.y, o.width, o.height);
        });

        if (brideActive) drawBride();

        // Земля
        ctx.fillStyle = '#a5676e';
        ctx.fillRect(0, GROUND_Y, canvas.width, 4);

        drawPlayer();
    }

    function gameLoop(ts) {
        if (!gameRunning) return;
        update(ts);
        draw();
        animFrameId = requestAnimationFrame(gameLoop);
    }

    function jump() {
        if (player.grounded && gameRunning) {
            player.dy = player.jumpPower;
            player.grounded = false;
        }
    }

    function resetGame() {
        obstacles = [];
        hearts = [];
        score = 0;
        gameSpeed = 3;
        brideActive = false;
        player.y = GROUND_Y - player.height;
        player.dy = 0;
        player.grounded = true;
        lastObstacleTime = 0;
        scoreDisplay.textContent = 'Сердечки: 0';
        canvas.style.display = 'block';
        winDiv.style.display = 'none';
        startBtn.style.display = 'inline-block';
        startBtn.textContent = 'Начать игру';
        scoreDisplay.style.display = 'block';
    }

    startBtn.addEventListener('click', () => {
        resetGame();
        gameRunning = true;
        startBtn.style.display = 'none';
        animFrameId = requestAnimationFrame(gameLoop);
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            jump();
        }
    });
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        jump();
    });
    canvas.addEventListener('mousedown', (e) => {
        e.preventDefault();
        jump();
    });

    // Заглушка при загрузке
    ctx.fillStyle = '#ffeef2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#a5676e';
    ctx.font = '20px Cormorant Garamond';
    ctx.textAlign = 'center';
    ctx.fillText('Нажмите «Начать игру»', canvas.width/2, canvas.height/2);
});
