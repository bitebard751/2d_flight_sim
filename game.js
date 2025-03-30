// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 7;
const OBSTACLE_SPEED = 3;
const ENEMY_SPEED = 2;
const OBSTACLE_SPAWN_RATE = 2000; // milliseconds
const ENEMY_SPAWN_RATE = 3000; // milliseconds

// Game state
let canvas, ctx;
let player = {
    x: 100,
    y: CANVAS_HEIGHT / 2,
    width: 40,
    height: 40,
    speed: PLAYER_SPEED
};
let bullets = [];
let obstacles = [];
let enemies = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameLoop;
let isGameOver = false;

// Initialize game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    // Set up event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.getElementById('restartButton').addEventListener('click', restartGame);
    
    // Start game
    startGame();
}

// Start game
function startGame() {
    // Reset game state
    player.y = CANVAS_HEIGHT / 2;
    bullets = [];
    obstacles = [];
    enemies = [];
    score = 0;
    isGameOver = false;
    
    // Update score display
    updateScore();
    
    // Hide game over screen
    document.getElementById('gameOver').classList.add('hidden');
    
    // Start game loop and spawners
    gameLoop = setInterval(update, 1000 / 60);
    setInterval(spawnObstacle, OBSTACLE_SPAWN_RATE);
    setInterval(spawnEnemy, ENEMY_SPAWN_RATE);
}

// Game loop
function update() {
    if (isGameOver) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Update player
    updatePlayer();
    
    // Update bullets
    updateBullets();
    
    // Update obstacles
    updateObstacles();
    
    // Update enemies
    updateEnemies();
    
    // Check collisions
    checkCollisions();
    
    // Draw everything
    draw();
    
    // Update score
    score++;
    updateScore();
}

// Player controls
let keys = {
    ArrowUp: false,
    ArrowDown: false,
    Space: false
};

function handleKeyDown(e) {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        if (e.key === 'Space') {
            shoot();
        }
    }
}

function handleKeyUp(e) {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
    }
}

function updatePlayer() {
    if (keys.ArrowUp && player.y > 0) {
        player.y -= player.speed;
    }
    if (keys.ArrowDown && player.y < CANVAS_HEIGHT - player.height) {
        player.y += player.speed;
    }
}

// Bullet functions
function shoot() {
    bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2,
        width: 10,
        height: 5,
        speed: BULLET_SPEED
    });
}

function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.x += bullet.speed;
        return bullet.x < CANVAS_WIDTH;
    });
}

// Obstacle functions
function spawnObstacle() {
    obstacles.push({
        x: CANVAS_WIDTH,
        y: Math.random() * (CANVAS_HEIGHT - 40),
        width: 20,
        height: 40,
        speed: OBSTACLE_SPEED
    });
}

function updateObstacles() {
    obstacles = obstacles.filter(obstacle => {
        obstacle.x -= obstacle.speed;
        return obstacle.x > -obstacle.width;
    });
}

// Enemy functions
function spawnEnemy() {
    enemies.push({
        x: CANVAS_WIDTH,
        y: Math.random() * (CANVAS_HEIGHT - 40),
        width: 40,
        height: 40,
        speed: ENEMY_SPEED
    });
}

function updateEnemies() {
    enemies = enemies.filter(enemy => {
        enemy.x -= enemy.speed;
        return enemy.x > -enemy.width;
    });
}

// Collision detection
function checkCollisions() {
    // Check bullet collisions with enemies
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (isColliding(bullet, enemy)) {
                bullets.splice(bulletIndex, 1);
                enemies.splice(enemyIndex, 1);
                score += 100;
            }
        });
    });
    
    // Check player collisions with obstacles and enemies
    obstacles.forEach(obstacle => {
        if (isColliding(player, obstacle)) {
            gameOver();
        }
    });
    
    enemies.forEach(enemy => {
        if (isColliding(player, enemy)) {
            gameOver();
        }
    });
}

function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Drawing functions
function draw() {
    // Draw player
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw bullets
    ctx.fillStyle = '#ffff00';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    // Draw obstacles
    ctx.fillStyle = '#ff0000';
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    
    // Draw enemies
    ctx.fillStyle = '#ff00ff';
    enemies.forEach(enemy => {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

// Game over handling
function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').classList.remove('hidden');
}

function restartGame() {
    startGame();
}

// Score handling
function updateScore() {
    document.getElementById('scoreValue').textContent = score;
    document.getElementById('highScoreValue').textContent = highScore;
}

// Start the game when the page loads
window.onload = init; 