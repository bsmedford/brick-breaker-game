const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const brickCountDisplay = document.getElementById('brickCount');

// Game variables
let score = 0;
let gameRunning = true;

// Paddle
const paddle = {
    width: 100,
    height: 15,
    x: canvas.width / 2 - 50,
    y: canvas.height - 30,
    speed: 0,
    maxSpeed: 8
};

// Ball
const ball = {
    x: paddle.x + paddle.width / 2,
    y: paddle.y - 10,
    radius: 6,
    dx: 0,
    dy: 0,
    speed: 5,
    attached: true
};

// Bricks - Triangle formation
let bricks = [];
let brickCount = 0;

function createBricks() {
    bricks = [];
    const rows = 5;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    const brickWidth = 40;
    const brickHeight = 15;
    const padding = 5;
    
    for (let row = 0; row < rows; row++) {
        const bricksInRow = row + 1;
        const rowWidth = bricksInRow * (brickWidth + padding);
        const rowX = (canvas.width - rowWidth) / 2;
        
        for (let col = 0; col < bricksInRow; col++) {
            const x = rowX + col * (brickWidth + padding);
            const y = 50 + row * (brickHeight + padding);
            
            bricks.push({
                x: x,
                y: y,
                width: brickWidth,
                height: brickHeight,
                color: colors[row],
                active: true
            });
        }
    }
    brickCount = bricks.length;
    updateBrickCount();
}

function updateBrickCount() {
    const activeBricks = bricks.filter(b => b.active).length;
    brickCountDisplay.textContent = activeBricks;
}

function updateScore(points) {
    score += points;
    scoreDisplay.textContent = score;
}

// Input handling
const mouse = { x: canvas.width / 2, y: canvas.height - 30 };

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    
    // Move paddle
    paddle.x = Math.max(0, Math.min(mouse.x - paddle.width / 2, canvas.width - paddle.width));
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (ball.attached) {
            launchBall();
        }
    }
});

function launchBall() {
    ball.attached = false;
    const angle = (Math.random() - 0.5) * Math.PI / 3; // -30 to 30 degrees
    ball.dx = Math.sin(angle) * ball.speed;
    ball.dy = -Math.cos(angle) * ball.speed;
}

// Collision detection
function checkPaddleCollision() {
    if (
        ball.y + ball.radius >= paddle.y &&
        ball.y - ball.radius <= paddle.y + paddle.height &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.width
    ) {
        // Determine where on paddle the ball hit
        const hitPos = (ball.x - paddle.x) / paddle.width; // 0 to 1
        const angle = (hitPos - 0.5) * Math.PI / 3; // -30 to 30 degrees
        
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx = Math.sin(angle) * speed;
        ball.dy = -Math.abs(Math.cos(angle) * speed);
        ball.y = paddle.y - ball.radius;
    }
}

function checkWallCollision() {
    // Left and right walls
    if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= canvas.width) {
        ball.dx *= -1;
        ball.x = ball.x - ball.radius <= 0 ? ball.radius : canvas.width - ball.radius;
    }
    
    // Top wall
    if (ball.y - ball.radius <= 0) {
        ball.dy *= -1;
        ball.y = ball.radius;
    }
    
    // Bottom (game over)
    if (ball.y - ball.radius > canvas.height) {
        resetBall();
    }
}

function checkBrickCollision() {
    for (let brick of bricks) {
        if (!brick.active) continue;
        
        // Check if ball intersects brick
        if (
            ball.x + ball.radius >= brick.x &&
            ball.x - ball.radius <= brick.x + brick.width &&
            ball.y + ball.radius >= brick.y &&
            ball.y - ball.radius <= brick.y + brick.height
        ) {
            // Determine collision side
            const overlapLeft = (ball.x + ball.radius) - brick.x;
            const overlapRight = (brick.x + brick.width) - (ball.x - ball.radius);
            const overlapTop = (ball.y + ball.radius) - brick.y;
            const overlapBottom = (brick.y + brick.height) - (ball.y - ball.radius);
            
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
            
            if (minOverlap === overlapTop || minOverlap === overlapBottom) {
                ball.dy *= -1;
            } else {
                ball.dx *= -1;
            }
            
            brick.active = false;
            updateScore(10);
            updateBrickCount();
            
            // Move ball out of brick
            if (minOverlap === overlapTop) ball.y = brick.y - ball.radius;
            else if (minOverlap === overlapBottom) ball.y = brick.y + brick.height + ball.radius;
            else if (minOverlap === overlapLeft) ball.x = brick.x - ball.radius;
            else ball.x = brick.x + brick.width + ball.radius;
            
            break;
        }
    }
}

function resetBall() {
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - 10;
    ball.dx = 0;
    ball.dy = 0;
    ball.attached = true;
}

// Update game state
function update() {
    if (!ball.attached) {
        ball.x += ball.dx;
        ball.y += ball.dy;
        
        // Apply slight speed increase for more dynamic gameplay
        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        if (currentSpeed < ball.speed * 1.2) {
            const acceleration = 1.002;
            ball.dx *= acceleration;
            ball.dy *= acceleration;
        }
    } else {
        // Keep ball attached to paddle
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - 10;
    }
    
    checkPaddleCollision();
    checkWallCollision();
    checkBrickCollision();
    
    // Check win condition
    if (bricks.every(b => !b.active)) {
        createBricks();
        resetBall();
    }
}

// Draw functions
function drawPaddle() {
    ctx.fillStyle = '#00D4FF';
    ctx.shadowColor = 'rgba(0, 212, 255, 0.8)';
    ctx.shadowBlur = 20;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowColor = 'transparent';
}

function drawBall() {
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
}

function drawBricks() {
    for (let brick of bricks) {
        if (!brick.active) continue;
        
        ctx.fillStyle = brick.color;
        ctx.shadowColor = `rgba(0, 0, 0, 0.5)`;
        ctx.shadowBlur = 5;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        
        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        ctx.shadowColor = 'transparent';
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(26, 26, 46, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawBricks();
    drawPaddle();
    drawBall();
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize and start game
createBricks();
gameLoop();