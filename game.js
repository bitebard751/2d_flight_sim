// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 7;
const ENEMY_BULLET_SPEED = 5;
const OBSTACLE_SPEED = 3;
const ENEMY_SPEED = 2;
const OBSTACLE_SPAWN_RATE = 1000; // Changed from 2000 to 1000 (spawns every 1 second)
const ENEMY_SPAWN_RATE = 1500; // Changed from 3000 to 1500 (spawns every 1.5 seconds)
const CRATE_SPAWN_RATE = 5000; // milliseconds
const HEALTH_PACK_SPAWN_RATE = 7000; // milliseconds
const INITIAL_AMMO = 20; // Starting ammunition
const CRATE_AMMO = 15; // Ammo per crate
const INITIAL_HEALTH = 100; // Starting health
const HEALTH_PACK_HEAL = 20; // Health restored per health pack
const ENEMY_DAMAGE = 10; // Damage per enemy bullet
const ENEMY_SHOOT_RATE = 2000; // milliseconds
const SPEED_INCREASE_INTERVAL = 10000; // 10 seconds
const SPEED_INCREASE_FACTOR = 1.1; // 10% increase
const SPREAD_SHOT_AMMO_COST = 3; // Cost in ammo for spread shot
const SPREAD_SHOT_COOLDOWN = 1500; // Increased from 500 to 1500ms (1.5 seconds)
const SPREAD_SHOT_BULLETS = 5; // Number of bullets in spread shot

// Add background constants
const STAR_COUNT = 100;
const STAR_SPEED_MULTIPLIER = 0.5;

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
let enemyBullets = [];
let obstacles = [];
let enemies = [];
let crates = [];
let healthPacks = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameLoop;
let isGameOver = false;

// Add spawn interval variables
let obstacleSpawnInterval;
let enemySpawnInterval;
let crateSpawnInterval;
let healthPackSpawnInterval;
let speedIncreaseInterval;

// Add speed state
let currentObstacleSpeed = OBSTACLE_SPEED;
let currentEnemySpeed = ENEMY_SPEED;
let currentEnemyBulletSpeed = ENEMY_BULLET_SPEED;

// Add background state
let stars = [];

// Add sound effects
let shootSound;
let gameOverSound;

// Add spread shot cooldown
let lastSpreadShotTime = 0;

// Add menu state
let isInMenu = true;

// Player controls
let keys = {
    ArrowUp: false,
    ArrowDown: false,
    ' ': false,
    'x': false,
    'X': false
};

// Add particle system arrays
let particles = [];
let engineTrails = [];

// Particle class
class Particle {
    constructor(x, y, color, type) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type; // 'explosion' or 'engine'
        this.size = type === 'explosion' ? Math.random() * 3 + 2 : Math.random() * 2 + 1;
        this.speedX = type === 'explosion' 
            ? (Math.random() - 0.5) * 8
            : -Math.random() * 2 - 2;
        this.speedY = type === 'explosion'
            ? (Math.random() - 0.5) * 8
            : (Math.random() - 0.5) * 2;
        this.life = type === 'explosion' ? 1 : 0.5;
        this.alpha = 1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.02;
        this.alpha = this.life;
        
        if (this.type === 'engine') {
            this.size *= 0.95;
        }
        
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Add screen shake variables
let screenShake = 0;
let screenShakeIntensity = 0;

// Function to create explosion
function createExplosion(x, y, color) {
    for (let i = 0; i < 30; i++) {
        particles.push(new Particle(x, y, color, 'explosion'));
    }
    screenShake = 10;
    screenShakeIntensity = 5;
}

// Function to create engine trail
function createEngineTrail(x, y) {
    if (Math.random() < 0.3) { // Only create particles sometimes to avoid too many
        engineTrails.push(new Particle(
            x,
            y + Math.random() * 10 - 5,
            `hsl(${Math.random() * 30 + 20}, 100%, 50%)`,
            'engine'
        ));
    }
}

// Initialize game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    // Initialize stars
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 2 + 1
        });
    }
    
    // Initialize sound effects
    shootSound = new Audio('assets/sounds/shoot.mp3');
    shootSound.volume = 0.3;
    gameOverSound = new Audio('assets/sounds/explosion.mp3');
    gameOverSound.volume = 0.5; // Make it a bit quieter than the explosion sound
    
    // Set up event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.getElementById('restartButton').addEventListener('click', restartGame);
    
    // Start menu animation loop
    requestAnimationFrame(menuLoop);
}

// Menu animation loop
function menuLoop() {
    if (!isInMenu) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Update and draw background
    updateStars();
    drawBackground();
    
    // Draw menu
    drawMenu();
    
    requestAnimationFrame(menuLoop);
}

// Draw menu function
function drawMenu() {
    // Draw title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE DEFENDER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    
    // Draw animated subtitle
    const pulseAmount = Math.sin(Date.now() / 500) * 0.2 + 0.8; // Pulsing effect
    ctx.font = `${24 * pulseAmount}px Arial`;
    ctx.fillStyle = `rgba(255, 255, 255, ${pulseAmount})`;
    ctx.fillText('Press ENTER to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    // Draw controls
    ctx.font = '20px Arial';
    ctx.fillStyle = '#aaaaaa';
    const controlsY = CANVAS_HEIGHT * 0.7;
    ctx.fillText('Controls:', CANVAS_WIDTH / 2, controlsY);
    ctx.fillText('↑/↓ - Move Ship', CANVAS_WIDTH / 2, controlsY + 30);
    ctx.fillText('SPACE - Shoot', CANVAS_WIDTH / 2, controlsY + 60);
    ctx.fillText('X - Spread Shot', CANVAS_WIDTH / 2, controlsY + 90);
    
    // Draw high score
    ctx.font = '24px Arial';
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`High Score: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
}

// Modify handleKeyDown to handle menu state
function handleKeyDown(e) {
    if (isInMenu && e.key === 'Enter') {
        isInMenu = false;
        startGame();
        return;
    }
    
    if (isInMenu) return; // Ignore other keys while in menu
    
    console.log('Key pressed:', e.key);
    
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        shoot();
    }
    
    if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        shootSpreadShot();
    }
    
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
}

function handleKeyUp(e) {
    if (e.key === ' ' || e.key === 'Spacebar') {
        keys[' '] = false;
    }
    
    if (e.key === 'x' || e.key === 'X') {
        keys['x'] = false;
        keys['X'] = false;
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
    
    // Play shooting sound
    shootSound.currentTime = 0; // Reset sound to start
    shootSound.play().catch(error => console.log('Error playing sound:', error));
    
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
        if (bullet.dx && bullet.dy) {
            // Spread shot bullets
            bullet.x += bullet.dx * bullet.speed;
            bullet.y += bullet.dy * bullet.speed;
        } else {
            // Regular bullets
            bullet.x += bullet.speed;
        }
        return bullet.x < CANVAS_WIDTH && bullet.x > 0 && 
               bullet.y > 0 && bullet.y < CANVAS_HEIGHT;
    });
}

// Obstacle functions
function spawnObstacle() {
    obstacles.push({
        x: CANVAS_WIDTH,
        y: Math.random() * (CANVAS_HEIGHT - 80), // Adjusted for larger height
        width: 40,  // Doubled from 20
        height: 80, // Doubled from 40
        speed: currentObstacleSpeed
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
        speed: currentEnemySpeed
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
    // Only spawn if there are no crates on screen
    if (crates.length > 0) {
        return;
    }

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
    // Only spawn if there are no health packs on screen
    if (healthPacks.length > 0) {
        return;
    }

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
    // Check bullet collisions with obstacles and enemies
    for (let i = bullets.length - 1; i >= 0; i--) {
        // Check obstacle collisions
        for (let j = obstacles.length - 1; j >= 0; j--) {
            if (isColliding(bullets[i], obstacles[j])) {
                createExplosion(bullets[i].x, bullets[i].y, '#888888');
                bullets.splice(i, 1);
                break;
            }
        }
        
        // Check enemy collisions (only if bullet wasn't destroyed by obstacle)
        if (bullets[i]) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                if (isColliding(bullets[i], enemies[j])) {
                    createExplosion(enemies[j].x + enemies[j].width/2, 
                                  enemies[j].y + enemies[j].height/2, 
                                  '#ff3333');
                    bullets.splice(i, 1);
                    enemies.splice(j, 1);
                    score += 100;
                    // Add health when killing an enemy
                    player.health = Math.min(INITIAL_HEALTH, player.health + 5);
                    break;
                }
            }
        }
    }
    
    // Check player collision with enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (isColliding(player, enemies[i])) {
            createExplosion(enemies[i].x + enemies[i].width/2, 
                          enemies[i].y + enemies[i].height/2, 
                          '#ff3333');
            enemies.splice(i, 1);
            player.health -= 20;
            screenShake = 15;
            screenShakeIntensity = 8;
            if (player.health <= 0) {
                createExplosion(player.x + player.width/2, 
                              player.y + player.height/2, 
                              '#00ff00');
                gameOver();
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
    // Draw player (rocket ship)
    ctx.save(); // Save the current context state
    
    // Draw engine flame
    const flameSize = 20;
    const flameGradient = ctx.createLinearGradient(
        player.x - flameSize, player.y + player.height/2,
        player.x + flameSize, player.y + player.height/2
    );
    flameGradient.addColorStop(0, 'rgba(255, 100, 0, 0)');
    flameGradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.8)');
    flameGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    
    ctx.fillStyle = flameGradient;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.height * 0.3);
    ctx.lineTo(player.x - flameSize, player.y + player.height/2);
    ctx.lineTo(player.x, player.y + player.height * 0.7);
    ctx.fill();
    
    // Draw rocket body
    ctx.fillStyle = '#00ff00';
    ctx.strokeStyle = '#008800';
    ctx.lineWidth = 2;
    
    // Main body (elongated)
    ctx.beginPath();
    ctx.moveTo(player.x + player.width, player.y + player.height/2); // Nose
    ctx.lineTo(player.x + player.width * 0.7, player.y + player.height * 0.2); // Top curve
    ctx.lineTo(player.x + player.width * 0.3, player.y + player.height * 0.2); // Top body
    ctx.lineTo(player.x, player.y + player.height * 0.35); // Top back
    ctx.lineTo(player.x, player.y + player.height * 0.65); // Bottom back
    ctx.lineTo(player.x + player.width * 0.3, player.y + player.height * 0.8); // Bottom body
    ctx.lineTo(player.x + player.width * 0.7, player.y + player.height * 0.8); // Bottom curve
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Draw window
    ctx.fillStyle = '#99ffff'; // Light blue for window
    ctx.beginPath();
    ctx.arc(
        player.x + player.width * 0.6,
        player.y + player.height * 0.5,
        player.height * 0.15,
        0, Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();
    
    // Draw fins
    ctx.fillStyle = '#00ff00';
    
    // Top fin
    ctx.beginPath();
    ctx.moveTo(player.x + player.width * 0.5, player.y + player.height * 0.2);
    ctx.lineTo(player.x + player.width * 0.3, player.y);
    ctx.lineTo(player.x + player.width * 0.15, player.y + player.height * 0.2);
    ctx.fill();
    ctx.stroke();
    
    // Bottom fin
    ctx.beginPath();
    ctx.moveTo(player.x + player.width * 0.5, player.y + player.height * 0.8);
    ctx.lineTo(player.x + player.width * 0.3, player.y + player.height);
    ctx.lineTo(player.x + player.width * 0.15, player.y + player.height * 0.8);
    ctx.fill();
    ctx.stroke();
    
    // Add some detail lines
    ctx.beginPath();
    ctx.moveTo(player.x + player.width * 0.3, player.y + player.height * 0.2);
    ctx.lineTo(player.x + player.width * 0.3, player.y + player.height * 0.8);
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
    
    // Draw obstacles as circular asteroids with craters
    obstacles.forEach(obstacle => {
        // Save context state
        ctx.save();
        
        const centerX = obstacle.x + obstacle.width / 2;
        const centerY = obstacle.y + obstacle.height / 2;
        // Use the larger dimension to ensure the asteroid fills its hitbox
        const radius = Math.min(obstacle.width, obstacle.height) / 2;
        
        // Draw main asteroid body (ellipse to match rectangular hitbox)
        ctx.beginPath();
        // Scale the context to draw a circular asteroid as an ellipse
        ctx.translate(centerX, centerY);
        ctx.scale(obstacle.width / obstacle.height, 1);
        ctx.arc(0, 0, radius * (obstacle.height / obstacle.width), 0, Math.PI * 2);
        ctx.scale(obstacle.height / obstacle.width, 1); // Reset scale for the fill/stroke
        ctx.translate(-centerX, -centerY);
        
        ctx.fillStyle = '#2c3347';  // Dark blue-gray
        ctx.fill();
        ctx.strokeStyle = '#4a5464';  // Lighter blue-gray
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw craters
        const numCraters = 7;  // Increased number of craters for larger area
        ctx.fillStyle = '#1a1f2b';  // Darker color for craters
        
        for (let i = 0; i < numCraters; i++) {
            const angle = (Math.PI * 2 * i) / numCraters + (obstacle.x % 1);
            // Adjust crater positions to match elliptical shape
            const craterX = centerX + (Math.cos(angle) * (obstacle.width / 2) * 0.6);
            const craterY = centerY + (Math.sin(angle) * (obstacle.height / 2) * 0.6);
            const craterRadius = Math.min(obstacle.width, obstacle.height) * 0.15;
            
            ctx.beginPath();
            ctx.arc(craterX, craterY, craterRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Debug hitbox (uncomment to see hitbox)
        /*
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        */
        
        ctx.restore();
    });
    
    // Draw enemies
    enemies.forEach(enemy => {
        ctx.save(); // Save context state
        
        // Draw enemy ship body
        ctx.fillStyle = '#ff0033'; // Bright red base color
        ctx.strokeStyle = '#990000'; // Darker red outline
        ctx.lineWidth = 2;
        
        // Main body (pointed shape)
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y + enemy.height/2); // Nose
        ctx.lineTo(enemy.x + enemy.width * 0.4, enemy.y + enemy.height * 0.2); // Top front
        ctx.lineTo(enemy.x + enemy.width * 0.8, enemy.y + enemy.height * 0.2); // Top back
        ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height * 0.5); // Back
        ctx.lineTo(enemy.x + enemy.width * 0.8, enemy.y + enemy.height * 0.8); // Bottom back
        ctx.lineTo(enemy.x + enemy.width * 0.4, enemy.y + enemy.height * 0.8); // Bottom front
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw wing details
        ctx.fillStyle = '#cc0000'; // Slightly darker red for wings
        
        // Top wing
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.2);
        ctx.lineTo(enemy.x + enemy.width * 0.6, enemy.y);
        ctx.lineTo(enemy.x + enemy.width * 0.7, enemy.y + enemy.height * 0.2);
        ctx.fill();
        ctx.stroke();
        
        // Bottom wing
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.8);
        ctx.lineTo(enemy.x + enemy.width * 0.6, enemy.y + enemy.height);
        ctx.lineTo(enemy.x + enemy.width * 0.7, enemy.y + enemy.height * 0.8);
        ctx.fill();
        ctx.stroke();
        
        // Add engine glow
        const gradient = ctx.createRadialGradient(
            enemy.x + enemy.width, enemy.y + enemy.height/2, 0,
            enemy.x + enemy.width, enemy.y + enemy.height/2, enemy.width * 0.5
        );
        gradient.addColorStop(0, 'rgba(255, 100, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width, enemy.y + enemy.height/2, enemy.width * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Add cockpit
        ctx.fillStyle = '#660000'; // Dark red
        ctx.beginPath();
        ctx.ellipse(
            enemy.x + enemy.width * 0.3,
            enemy.y + enemy.height * 0.5,
            enemy.width * 0.15,
            enemy.height * 0.15,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
        
        ctx.restore(); // Restore context state
    });
    
    // Draw crates
    ctx.fillStyle = '#ffff00'; // Yellow color for crates
    ctx.strokeStyle = '#888800';
    crates.forEach(crate => {
        ctx.beginPath();
        ctx.rect(crate.x, crate.y, crate.width, crate.height);
        ctx.fill();
        ctx.stroke();
        
        // Draw ammo symbol (lightning bolt)
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
    
    // Draw spread shot indicator and cooldown
    const currentTime = Date.now();
    const timeSinceLastSpreadShot = currentTime - lastSpreadShotTime;
    const cooldownPercent = Math.min(1, timeSinceLastSpreadShot / SPREAD_SHOT_COOLDOWN);
    const canSpreadShot = player.ammo >= SPREAD_SHOT_AMMO_COST && cooldownPercent >= 1;
    
    // Draw spread shot text
    ctx.fillStyle = canSpreadShot ? '#00ff00' : '#ff0000';
    ctx.font = '16px Arial';
    ctx.fillText('Press X for Spread Shot', 10, 90);
    ctx.fillText(`Costs ${SPREAD_SHOT_AMMO_COST} ammo`, 10, 110);
    
    // Draw cooldown bar
    const barWidth = 200;
    const barHeight = 10;
    const barX = 10;
    const barY = 130;
    
    // Draw bar background
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Draw cooldown progress
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(barX, barY, barWidth * cooldownPercent, barHeight);
    
    // Draw cooldown text
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    if (cooldownPercent < 1) {
        const remainingCooldown = ((SPREAD_SHOT_COOLDOWN - timeSinceLastSpreadShot) / 1000).toFixed(1);
        ctx.fillText(`Cooldown: ${remainingCooldown}s`, barX + barWidth + 10, barY + 8);
    } else {
        ctx.fillText('Ready!', barX + barWidth + 10, barY + 8);
    }
}

// Game over handling
function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    clearInterval(obstacleSpawnInterval);
    clearInterval(enemySpawnInterval);
    clearInterval(crateSpawnInterval);
    clearInterval(healthPackSpawnInterval);
    clearInterval(speedIncreaseInterval);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').classList.remove('hidden');
    
    // Remove any existing menu buttons first
    const existingMenuButtons = document.querySelectorAll('#gameOver button:not(#restartButton)');
    existingMenuButtons.forEach(button => button.remove());
    
    // Add button to return to menu
    const menuButton = document.createElement('button');
    menuButton.textContent = 'Return to Menu';
    menuButton.onclick = () => {
        document.getElementById('gameOver').classList.add('hidden');
        isInMenu = true;
        requestAnimationFrame(menuLoop);
    };
    document.getElementById('gameOver').appendChild(menuButton);
    
    // Play game over sound
    gameOverSound.currentTime = 0; // Reset sound to start
    gameOverSound.play();
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
        speed: currentEnemyBulletSpeed,
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

// Add function to update stars
function updateStars() {
    stars.forEach(star => {
        star.x -= star.speed * STAR_SPEED_MULTIPLIER;
        if (star.x < 0) {
            star.x = CANVAS_WIDTH;
            star.y = Math.random() * CANVAS_HEIGHT;
        }
    });
}

// Add function to draw background
function drawBackground() {
    // Fill background with dark color
    ctx.fillStyle = '#000033';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw stars
    ctx.fillStyle = '#ffffff';
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Add function to increase speeds
function increaseSpeeds() {
    if (isGameOver) return;
    
    // Increase speeds
    currentObstacleSpeed *= SPEED_INCREASE_FACTOR;
    currentEnemySpeed *= SPEED_INCREASE_FACTOR;
    currentEnemyBulletSpeed *= SPEED_INCREASE_FACTOR;
    
    // Update enemy speeds
    enemies.forEach(enemy => {
        enemy.speed = currentEnemySpeed;
    });
    
    // Update obstacle speeds
    obstacles.forEach(obstacle => {
        obstacle.speed = currentObstacleSpeed;
    });
    
    // Update enemy bullet speeds
    enemyBullets.forEach(bullet => {
        bullet.speed = currentEnemyBulletSpeed;
    });
    
    console.log('Speeds increased! Current speeds:', {
        obstacleSpeed: currentObstacleSpeed,
        enemySpeed: currentEnemySpeed,
        enemyBulletSpeed: currentEnemyBulletSpeed
    });
}

// Add spread shot function
function shootSpreadShot() {
    const currentTime = Date.now();
    if (currentTime - lastSpreadShotTime < SPREAD_SHOT_COOLDOWN) {
        console.log('Spread shot cooling down...');
        return;
    }
    
    if (player.ammo < SPREAD_SHOT_AMMO_COST) {
        console.log('Not enough ammo for spread shot!');
        return;
    }
    
    // Play shooting sound
    shootSound.currentTime = 0;
    shootSound.play().catch(error => console.log('Error playing sound:', error));
    
    lastSpreadShotTime = currentTime;
    player.ammo -= SPREAD_SHOT_AMMO_COST;
    
    // Calculate spread angles
    const spreadAngle = Math.PI / 6; // 30 degrees total spread
    const angleStep = spreadAngle / (SPREAD_SHOT_BULLETS - 1);
    const startAngle = -spreadAngle / 2;
    
    // Create spread shot bullets
    for (let i = 0; i < SPREAD_SHOT_BULLETS; i++) {
        const angle = startAngle + (i * angleStep);
        const newBullet = {
            x: player.x + player.width,
            y: player.y + (player.height / 2) - 2.5,
            width: 15,
            height: 8,
            speed: BULLET_SPEED,
            dx: Math.cos(angle),
            dy: Math.sin(angle)
        };
        
        bullets.push(newBullet);
    }
    
    console.log('Spread shot fired! Ammo remaining:', player.ammo);
}

// Modify startGame function
function startGame() {
    isInMenu = false;
    
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
    
    // Reset speeds
    currentObstacleSpeed = OBSTACLE_SPEED;
    currentEnemySpeed = ENEMY_SPEED;
    currentEnemyBulletSpeed = ENEMY_BULLET_SPEED;
    
    // Update score display
    updateScore();
    
    // Hide game over screen
    document.getElementById('gameOver').classList.add('hidden');
    
    // Clear any existing intervals
    clearInterval(gameLoop);
    clearInterval(obstacleSpawnInterval);
    clearInterval(enemySpawnInterval);
    clearInterval(crateSpawnInterval);
    clearInterval(healthPackSpawnInterval);
    clearInterval(speedIncreaseInterval);
    
    // Start game loop and spawners
    gameLoop = setInterval(update, 1000 / 60);
    obstacleSpawnInterval = setInterval(spawnObstacle, OBSTACLE_SPAWN_RATE);
    enemySpawnInterval = setInterval(spawnEnemy, ENEMY_SPAWN_RATE);
    crateSpawnInterval = setInterval(spawnCrate, CRATE_SPAWN_RATE);
    healthPackSpawnInterval = setInterval(spawnHealthPack, HEALTH_PACK_SPAWN_RATE);
    speedIncreaseInterval = setInterval(increaseSpeeds, SPEED_INCREASE_INTERVAL);
}

// Add game update function
function update() {
    if (isGameOver) return;
    
    // Clear canvas with screen shake
    ctx.save();
    if (screenShake > 0) {
        const shakeX = Math.random() * screenShakeIntensity * 2 - screenShakeIntensity;
        const shakeY = Math.random() * screenShakeIntensity * 2 - screenShakeIntensity;
        ctx.translate(shakeX, shakeY);
        screenShake--;
        screenShakeIntensity *= 0.9;
    }
    
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Update and draw background
    updateStars();
    drawBackground();
    
    // Create engine trails for player
    createEngineTrail(player.x, player.y + player.height * 0.3);
    createEngineTrail(player.x, player.y + player.height * 0.7);
    
    // Update engine trails
    engineTrails = engineTrails.filter(particle => {
        const isAlive = particle.update();
        if (isAlive) {
            particle.draw(ctx);
        }
        return isAlive;
    });
    
    // Update explosion particles
    particles = particles.filter(particle => {
        const isAlive = particle.update();
        if (isAlive) {
            particle.draw(ctx);
        }
        return isAlive;
    });
    
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
    
    ctx.restore();
}

// Start the game when the page loads
window.onload = init; 