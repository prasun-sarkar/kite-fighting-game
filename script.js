const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ================= GAME STATE =================
let windOffset = 0;
let rotation = 0;
let score = 0;
let gameOver = false;

let playerLives = 3;
let playerColors = ["red", "green", "orange", "purple"];
let currentPlayerColor = playerColors[0];

let playerCut = false;
let enemyCut = false;
let enemyHitCount = 0;

// ================= PLAYER =================
let kite = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 40,
    speed: 5,
    vy: 0,
    fallSpeed: 0
};

// ================= ENEMY =================
let enemy = {
    x: canvas.width / 2 + 200,
    y: 150,
    size: 40,
    speed: 2,
    fallSpeed: 0
};

// ================= BACKGROUND KITES =================
let backgroundKites = [];
let bgColors = ["yellow", "pink", "cyan", "lime", "white", "gold"];

for (let i = 0; i < 10; i++) {
    backgroundKites.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height / 2,
        size: 15 + Math.random() * 15,
        color: bgColors[Math.floor(Math.random() * bgColors.length)],
        speedX: (Math.random() - 0.5) * 1.5,
        speedY: (Math.random() - 0.5) * 0.8
    });
}

// ================= KEY CONTROLS =================
let keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

document.body.addEventListener("touchmove", function(e){
    e.preventDefault();
}, { passive: false });

// ================= MOBILE TOUCH CONTROL =================
canvas.addEventListener("touchmove", function (e) {

    let rect = canvas.getBoundingClientRect();
    let touch = e.touches[0];

    let touchX = touch.clientX - rect.left;
    let touchY = touch.clientY - rect.top;

    // Move kite toward finger
    kite.x += (touchX - kite.x) * 0.1;
    kite.y += (touchY - kite.y) * 0.1;

});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ================= MOVE BACKGROUND KITES =================
function moveBackgroundKites() {

    backgroundKites.forEach(k => {

        k.x += k.speedX;
        k.y += k.speedY;

        // Wrap around screen
        if (k.x < -20) k.x = canvas.width + 20;
        if (k.x > canvas.width + 20) k.x = -20;

        if (k.y < 0) k.y = canvas.height / 2;
        if (k.y > canvas.height / 2) k.y = 0;
    });
}

// ================= DRAW BACKGROUND KITES =================
function drawBackgroundKites() {

    backgroundKites.forEach(k => {

        ctx.beginPath();
        ctx.moveTo(k.x, k.y - k.size);
        ctx.lineTo(k.x + k.size, k.y);
        ctx.lineTo(k.x, k.y + k.size);
        ctx.lineTo(k.x - k.size, k.y);
        ctx.closePath();
        ctx.fillStyle = k.color;
        ctx.fill();

        // Small string
        ctx.beginPath();
        ctx.moveTo(k.x, k.y);
        ctx.lineTo(k.x, k.y + k.size + 40);
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.stroke();
    });
}

// ================= MOVE PLAYER =================
function moveKite() {

    if (playerCut) {
        kite.fallSpeed += 0.4;
        kite.y += kite.fallSpeed;
        rotation += 0.05;

        if (kite.y > canvas.height + 100) {
            respawnPlayer();
        }
        return;
    }

    if (keys["ArrowUp"]) kite.vy -= 0.4;
    if (keys["ArrowDown"]) kite.vy += 0.4;

    kite.vy *= 0.95;
    kite.vy = Math.max(-5, Math.min(5, kite.vy));
    kite.y += kite.vy;

    if (keys["ArrowLeft"]) {
        kite.x -= kite.speed;
        rotation = -0.3;
    }
    else if (keys["ArrowRight"]) {
        kite.x += kite.speed;
        rotation = 0.3;
    }
    else {
        rotation *= 0.9;
    }

    if (kite.x < 50) kite.x = 50;
    if (kite.x > canvas.width - 50) kite.x = canvas.width - 50;

    if (kite.y < 80) {
        kite.y = 80;
        kite.vy *= -0.5;
    }

    if (kite.y > canvas.height - 100) {
        kite.y = canvas.height - 100;
        kite.vy = 0;
    }
}

// ================= MOVE ENEMY =================
function moveEnemy() {

    if (enemyCut) {
        enemy.fallSpeed += 0.4;
        enemy.y += enemy.fallSpeed;

        if (enemy.y > canvas.height + 100) {
            respawnEnemy();
        }
        return;
    }

    // Random movement instead of always following
    enemy.x += Math.sin(Date.now() * 0.001) * enemy.speed;
    enemy.y += Math.cos(Date.now() * 0.0015) * 0.5;

    // Sometimes approach player
    if (Math.random() < 0.02) {
        if (enemy.x < kite.x) enemy.x += enemy.speed;
        else enemy.x -= enemy.speed;
    }
}

// ================= STRING FIGHT LOGIC =================
function checkStringFight() {

    if (playerCut || enemyCut) return;

    let horizontalDistance = Math.abs(kite.x - enemy.x);

    if (horizontalDistance < 15) {

        let totalStringHeight = canvas.height - enemy.y;
        let dangerZone = enemy.y + totalStringHeight * 0.25;
        let weakZone = enemy.y + totalStringHeight * 0.60;

        let playerStringY = kite.y;

        if (playerStringY < dangerZone) {
            playerCut = true;
            kite.fallSpeed = 0;
        }
        else if (playerStringY > weakZone) {

            enemyHitCount++;

            if (enemyHitCount >= 2) {
                enemyCut = true;
                enemy.fallSpeed = 0;
                enemyHitCount = 0;
                score += 20;
            }
        }
    }
}

// ================= RESPAWN =================
function respawnPlayer() {

    playerLives--;

    if (playerLives < 0) {
        gameOver = true;
        return;
    }

    playerCut = false;
    kite.fallSpeed = 0;
    kite.vy = 0;

    kite.x = canvas.width / 2;
    kite.y = canvas.height / 2;

    currentPlayerColor =
        playerColors[Math.floor(Math.random() * playerColors.length)];
}

function respawnEnemy() {

    enemyCut = false;
    enemy.fallSpeed = 0;

    enemy.x = Math.random() * (canvas.width - 200) + 100;
    enemy.y = 150;

    enemy.speed += 0.3;
}

// ================= DRAW PLAYER =================
function drawKite() {

    let floatY = Math.sin(windOffset) * 5;

    ctx.save();
    ctx.translate(kite.x, kite.y + floatY);
    ctx.rotate(rotation);

    ctx.beginPath();
    ctx.moveTo(0, -kite.size);
    ctx.lineTo(kite.size, 0);
    ctx.lineTo(0, kite.size);
    ctx.lineTo(-kite.size, 0);
    ctx.closePath();
    ctx.fillStyle = currentPlayerColor;
    ctx.fill();

    ctx.restore();

    if (!playerCut) {
        ctx.beginPath();
        ctx.moveTo(kite.x, kite.y);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// ================= DRAW ENEMY =================
function drawEnemy() {

    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    ctx.beginPath();
    ctx.moveTo(0, -enemy.size);
    ctx.lineTo(enemy.size, 0);
    ctx.lineTo(0, enemy.size);
    ctx.lineTo(-enemy.size, 0);
    ctx.closePath();
    ctx.fillStyle = "blue";
    ctx.fill();

    ctx.restore();

    if (!enemyCut) {
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y);
        ctx.lineTo(enemy.x + 100, canvas.height);
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// ================= UI =================
function drawUI() {
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 20, 30);
    ctx.fillText("Lives: " + playerLives, 20, 60);
}

// ================= GAME LOOP =================
function gameLoop() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "60px Arial";
        ctx.fillText("GAME OVER", canvas.width / 2 - 180, canvas.height / 2);
        return;
    }

    windOffset += 0.05;

    moveBackgroundKites();
    moveKite();
    moveEnemy();
    checkStringFight();

    drawBackgroundKites();
    drawKite();
    drawEnemy();
    drawUI();

    requestAnimationFrame(gameLoop);
}

gameLoop();