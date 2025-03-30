// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 7;
const ENEMY_BULLET_SPEED = 5;
const OBSTACLE_SPEED = 3;
const ENEMY_SPEED = 2;
const OBSTACLE_SPAWN_RATE = 2000; // milliseconds
const ENEMY_SPAWN_RATE = 3000; // milliseconds
const CRATE_SPAWN_RATE = 5000; // milliseconds
const HEALTH_PACK_SPAWN_RATE = 7000; // milliseconds
const INITIAL_AMMO = 20; // Starting ammunition
const CRATE_AMMO = 15; // Ammo per crate
const INITIAL_HEALTH = 100; // Starting health
const HEALTH_PACK_HEAL = 20; // Health restored per health pack
const ENEMY_DAMAGE = 10; // Damage per enemy bullet
const ENEMY_SHOOT_RATE = 2000; // milliseconds

// Game state
let canvas, ctx;
let player = {
    x: 100,
    y: CANVAS_HEIGHT / 2,
    width: 40,
    height: 40,
    speed: PLAYER_SPEED,
    ammo: INITIAL_AMMO,
    health: INITIAL_HEALTH
};
let bullets = [];
let enemyBullets = []; // Array for enemy bullets
let obstacles = [];
let enemies = [];
let crates = []; // Array for bullet crates
let healthPacks = []; // Array for health packs
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
    player.ammo = INITIAL_AMMO;
    player.health = INITIAL_HEALTH;
    bullets = [];
    enemyBullets = [];
    obstacles = [];
    enemies = [];
    crates = [];
    healthPacks = [];
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
    setInterval(spawnCrate, CRATE_SPAWN_RATE);
    setInterval(spawnHealthPack, HEALTH_PACK_SPAWN_RATE);
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
    updateEnemyBullets();
    
    // Update obstacles
    updateObstacles();
    
    // Update enemies and their shooting
    updateEnemies();
    
    // Update crates and health packs
    updateCrates();
    updateHealthPacks();
    
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
    ' ': false  // Changed from 'Space' to actual space character
};

function handleKeyDown(e) {
    console.log('Key pressed:', e.key); // Debug log to see what key is being pressed
    
    if (e.key === ' ' || e.key === 'Spacebar') { // Handle both space representations
        e.preventDefault(); // Prevent page scrolling
        shoot();
    }
    
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
}

function handleKeyUp(e) {
    if (e.key === ' ' || e.key === 'Spacebar') {
        keys[' '] = false;
    }
    
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

// Add shooting cooldown
let lastShotTime = 0;
const SHOT_COOLDOWN = 250; // milliseconds between shots

// Bullet functions
function shoot() {
    const currentTime = Date.now();
    if (currentTime - lastShotTime < SHOT_COOLDOWN) {
        console.log('Cooling down...'); // Debug log
        return; // Don't shoot if cooldown hasn't elapsed
    }
    
    if (player.ammo <= 0) {
        console.log('Out of ammo!');
        return; // Don't shoot if out of ammo
    }
    
    lastShotTime = currentTime;
    player.ammo--; // Decrease ammo count
    
    // Create bullet at the center of the player
    const newBullet = {
        x: player.x + player.width,
        y: player.y + (player.height / 2) - 2.5,
        width: 15,
        height: 8,
        speed: BULLET_SPEED
    };
    
    bullets.push(newBullet);
    console.log('Bullet fired! Ammo remaining:', player.ammo);
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
    enemies.forEach(enemy => {
        // Move towards player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const angle = Math.atan2(dy, dx);
        
        enemy.x += Math.cos(angle) * enemy.speed * 0.5; // Reduced speed factor
        enemy.y += Math.sin(angle) * enemy.speed * 0.5;
        
        // Shoot at intervals
        if (!enemy.lastShot || Date.now() - enemy.lastShot >= ENEMY_SHOOT_RATE) {
            enemyShoot(enemy);
            enemy.lastShot = Date.now();
        }
    });
    
    // Remove enemies that are off screen
    enemies = enemies.filter(enemy => enemy.x > -enemy.width);
}

// Add helper function to check if a position is safe to spawn
function isSpawnPositionSafe(x, y, width, height) {
    // Check collision with obstacles
    for (let obstacle of obstacles) {
        if (x < obstacle.x + obstacle.width &&
            x + width > obstacle.x &&
            y < obstacle.y + obstacle.height &&
            y + height > obstacle.y) {
            return false;
        }
    }
    return true;
}

// Modify crate spawn function
function spawnCrate() {
    let attempts = 0;
    const maxAttempts = 10;
    let y;
    
    // Try to find a safe position
    do {
        y = Math.random() * (CANVAS_HEIGHT - 30);
        attempts++;
    } while (!isSpawnPositionSafe(CANVAS_WIDTH, y, 30, 30) && attempts < maxAttempts);
    
    // Only spawn if we found a safe position
    if (attempts < maxAttempts) {
        crates.push({
            x: CANVAS_WIDTH,
            y: y,
            width: 30,
            height: 30,
            speed: OBSTACLE_SPEED
        });
    }
}

// Modify health pack spawn function
function spawnHealthPack() {
    let attempts = 0;
    const maxAttempts = 10;
    let y;
    
    // Try to find a safe position
    do {
        y = Math.random() * (CANVAS_HEIGHT - 30);
        attempts++;
    } while (!isSpawnPositionSafe(CANVAS_WIDTH, y, 30, 30) && attempts < maxAttempts);
    
    // Only spawn if we found a safe position
    if (attempts < maxAttempts) {
        healthPacks.push({
            x: CANVAS_WIDTH,
            y: y,
            width: 30,
            height: 30,
            speed: OBSTACLE_SPEED
        });
    }
}

// Collision detection
function checkCollisions() {
    // Check bullet collisions with enemies
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (isColliding(bullets[i], enemies[j])) {
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score += 100;
                break; // Break inner loop after collision
            }
        }
    }
    
    // Check player collisions with crates
    for (let i = crates.length - 1; i >= 0; i--) {
        if (isColliding(player, crates[i])) {
            player.ammo += CRATE_AMMO;
            crates.splice(i, 1);
            score += 50;
        }
    }
    
    // Check player collisions with obstacles and enemies
    for (let obstacle of obstacles) {
        if (isColliding(player, obstacle)) {
            gameOver();
            return;
        }
    }
    
    for (let enemy of enemies) {
        if (isColliding(player, enemy)) {
            gameOver();
            return;
        }
    }
    
    // Check enemy bullet collisions with player
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (isColliding(player, enemyBullets[i])) {
            player.health -= ENEMY_DAMAGE;
            enemyBullets.splice(i, 1);
            
            if (player.health <= 0) {
                gameOver();
                return;
            }
        }
    }

    // Check player collisions with health packs
    for (let i = healthPacks.length - 1; i >= 0; i--) {
        if (isColliding(player, healthPacks[i])) {
            player.health = Math.min(INITIAL_HEALTH, player.health + HEALTH_PACK_HEAL); // Cap health at max
            healthPacks.splice(i, 1);
            score += 30; // Bonus points for collecting health pack
        }
    }
}

function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Drawing functions
function draw() {
    // Draw player (plane)
    ctx.save(); // Save the current context state
    ctx.fillStyle = '#00ff00';
    ctx.strokeStyle = '#008800';
    ctx.lineWidth = 2;
    
    // Draw plane body
    ctx.beginPath();
    ctx.moveTo(player.x + player.width, player.y + player.height/2); // Nose of the plane
    ctx.lineTo(player.x + player.width * 0.2, player.y + player.height * 0.2); // Top of body
    ctx.lineTo(player.x, player.y + player.height * 0.5); // Back of body
    ctx.lineTo(player.x + player.width * 0.2, player.y + player.height * 0.8); // Bottom of body
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw wing
    ctx.beginPath();
    ctx.moveTo(player.x + player.width * 0.5, player.y + player.height * 0.3); // Top of wing
    ctx.lineTo(player.x + player.width * 0.6, player.y); // Wing tip
    ctx.lineTo(player.x + player.width * 0.7, player.y + player.height * 0.3); // Back of wing
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw tail
    ctx.beginPath();
    ctx.moveTo(player.x + player.width * 0.2, player.y + player.height * 0.2); // Top of tail
    ctx.lineTo(player.x, player.y); // Tail tip
    ctx.lineTo(player.x + player.width * 0.3, player.y + player.height * 0.3); // Back of tail
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore(); // Restore the context state
    
    // Draw bullets with improved visibility
    ctx.fillStyle = '#ff0000'; // Changed to bright red
    bullets.forEach(bullet => {
        // Draw bullet with glow effect
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.shadowBlur = 0; // Reset shadow
    });
    
    // Draw obstacles
    ctx.fillStyle = '#ff0000';
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    
    // Draw enemies
    ctx.fillStyle = '#ff00ff';
    enemies.forEach(enemy => {
        // Draw enemy plane (simpler design)
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y + enemy.height/2); // Nose
        ctx.lineTo(enemy.x + enemy.width * 0.8, enemy.y); // Top
        ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height/2); // Back
        ctx.lineTo(enemy.x + enemy.width * 0.8, enemy.y + enemy.height); // Bottom
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    });
    
    // Draw crates
    ctx.fillStyle = '#ffff00'; // Yellow color for crates
    ctx.strokeStyle = '#888800';
    crates.forEach(crate => {
        ctx.beginPath();
        ctx.rect(crate.x, crate.y, crate.width, crate.height);
        ctx.fill();
        ctx.stroke();
        
        // Draw ammo symbol
        ctx.fillStyle = '#000000';
        ctx.font = '15px Arial';
        ctx.fillText('⚡', crate.x + 8, crate.y + 20);
    });
    
    // Draw enemy bullets
    ctx.fillStyle = '#ff00ff'; // Pink enemy bullets
    enemyBullets.forEach(bullet => {
        ctx.beginPath();
        ctx.rect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.fill();
    });
    
    // Draw health packs
    ctx.fillStyle = '#00ff00'; // Green color for health packs
    ctx.strokeStyle = '#008800';
    healthPacks.forEach(pack => {
        // Draw pack background
        ctx.beginPath();
        ctx.rect(pack.x, pack.y, pack.width, pack.height);
        ctx.fill();
        ctx.stroke();
        
        // Draw health cross symbol
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(pack.x + 12, pack.y + 5, 6, 20); // Vertical line
        ctx.fillRect(pack.x + 5, pack.y + 12, 20, 6); // Horizontal line
    });
    
    // Draw health bar
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthBarX = CANVAS_WIDTH - healthBarWidth - 20;
    const healthBarY = 20;
    
    // Draw background
    ctx.fillStyle = '#333333';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // Draw health
    const healthPercent = player.health / INITIAL_HEALTH;
    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
    
    // Draw health text
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Health: ${player.health}`, healthBarX + healthBarWidth/2, healthBarY + 15);
    ctx.textAlign = 'left'; // Reset text align
    
    // Draw ammo and bullet count
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText(`Ammo: ${player.ammo}`, 10, 60);
    ctx.fillText(`Bullets: ${bullets.length}`, 10, 30);
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

// Enemy shooting function
function enemyShoot(enemy) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const angle = Math.atan2(dy, dx);
    
    enemyBullets.push({
        x: enemy.x,
        y: enemy.y + enemy.height/2,
        width: 10,
        height: 4,
        speed: ENEMY_BULLET_SPEED,
        dx: Math.cos(angle),
        dy: Math.sin(angle)
    });
}

// Update enemy bullets
function updateEnemyBullets() {
    enemyBullets = enemyBullets.filter(bullet => {
        bullet.x += bullet.dx * bullet.speed;
        bullet.y += bullet.dy * bullet.speed;
        return bullet.x > 0 && bullet.x < CANVAS_WIDTH && 
               bullet.y > 0 && bullet.y < CANVAS_HEIGHT;
    });
}

function updateCrates() {
    crates = crates.filter(crate => {
        crate.x -= crate.speed;
        return crate.x > -crate.width;
    });
}

function updateHealthPacks() {
    healthPacks = healthPacks.filter(pack => {
        pack.x -= pack.speed;
        return pack.x > -pack.width;
    });
}

// Start the game when the page loads
window.onload = init; 