/***********************************
 * 1. BASIC GAME SETUP
 ***********************************/
let board = document.querySelector(".gameArea");
let blockSize = 60;

// Calculate rows and columns based on board size
const rows = Math.floor(board.clientHeight / blockSize);
const cols = Math.floor(board.clientWidth / blockSize);

// Setup CSS Grid
board.style.gridTemplateRows = `repeat(${rows}, ${blockSize}px)`;
board.style.gridTemplateColumns = `repeat(${cols}, ${blockSize}px)`;

// Store all grid cells by "x-y"
let blocks = {};

/***********************************
 * 2. GAME STATE VARIABLES
 ***********************************/
let gameStarted = false;
let direction = null;
let speed = 180;

let snake = [
  { x: 8, y: 6 },
  { x: 8, y: 5 },
  { x: 8, y: 4 },
];

let food = null;
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let timer = 0;
let timerInterval = null;
let gameLoop = null;

/***********************************
 * 3. CREATE THE BOARD
 ***********************************/
for (let i = 0; i < rows; i++) {
  for (let j = 0; j < cols; j++) {
    let block = document.createElement("div");
    block.classList.add("block");
    blocks[`${i}-${j}`] = block;
    board.appendChild(block);
  }
}

/***********************************
 * 4. RENDER & CLEAR FUNCTIONS
 ***********************************/
function renderSnake() {
  snake.forEach((pos, idx) => {
    let block = blocks[`${pos.x}-${pos.y}`];
    if (!block) return;

    if (idx === 0) {
      block.classList.add("snakeHead");
    } else {
      block.classList.add("snakeBody");
    }
  });
}

function clearSnake() {
  snake.forEach((pos) => {
    const block = blocks[`${pos.x}-${pos.y}`];
    if (!block) return;
    block.classList.remove("snakeHead", "snakeBody");
  });
}

function renderFood() {
  if (!food) return;
  const block = blocks[`${food.x}-${food.y}`];
  if (block) block.classList.add("food");
}

function clearFood() {
  if (!food) return;
  const block = blocks[`${food.x}-${food.y}`];
  if (block) block.classList.remove("food");
}

/***********************************
 * 5. FOOD LOGIC
 ***********************************/
function generateFood() {
  let pos;
  while (true) {
    pos = {
      x: Math.floor(Math.random() * rows),
      y: Math.floor(Math.random() * cols),
    };
    const invalid = snake.some((seg) => seg.x === pos.x && seg.y === pos.y);
    if (!invalid) break;
  }
  food = pos;
}

/***********************************
 * 6. MOVEMENT & COLLISION
 ***********************************/
function checkSelfCollision(head) {
  return snake.slice(1).some((seg) => seg.x === head.x && seg.y === head.y);
}

function moveSnake() {
  if (!gameStarted || !direction) return;

  const head = snake[0];
  let newHead;
  if (direction === "up") newHead = { x: head.x - 1, y: head.y };
  if (direction === "down") newHead = { x: head.x + 1, y: head.y };
  if (direction === "left") newHead = { x: head.x, y: head.y - 1 };
  if (direction === "right") newHead = { x: head.x, y: head.y + 1 };

  // Wall collision
  if (
    newHead.x < 0 ||
    newHead.y < 0 ||
    newHead.x >= rows ||
    newHead.y >= cols
  ) {
    endGame("💥 You hit the wall!");
    return;
  }

  snake.unshift(newHead);

  // Self-collision
  if (checkSelfCollision(newHead)) {
    endGame("🐍 You bit yourself!");
    return;
  }

  // Food collision
  if (food && newHead.x === food.x && newHead.y === food.y) {
    score++;
    updateScore();
    clearFood();
    generateFood();
    renderFood();
  } else {
    snake.pop();
  }
}

/***********************************
 * 7. KEYBOARD CONTROLS
 ***********************************/
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") setDirection("up");
  if (e.key === "ArrowDown" || e.key === "s" || e.key === "S")
    setDirection("down");
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A")
    setDirection("left");
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D")
    setDirection("right");
});

document.getElementById("restartGame").addEventListener("click", restartGame);

function setDirection(newDir) {
  const opposite = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };
  if (direction !== opposite[newDir]) {
    direction = newDir;
    if (!gameStarted) {
      gameStarted = true;
      startTimer();
    }
  }
}

/***********************************
 * 8. SCORE & TIMER
 ***********************************/
function updateScore() {
  document.getElementById("score").textContent = score;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
    document.getElementById("highScore").textContent = highScore;
  }
}

function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    timer++;
    let min = Math.floor(timer / 60);
    let sec = timer % 60;
    document.getElementById("time").textContent = `${String(min).padStart(
      2,
      "0"
    )}:${String(sec).padStart(2, "0")}`;
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timer = 0;
  document.getElementById("time").textContent = "00:00";
}

/***********************************
 * 9. GAME LOOP & MANAGEMENT
 ***********************************/
function endGame(deathMessage) {
  gameStarted = false;
  clearInterval(gameLoop);
  gameLoop = null;
  resetTimer();

  const overlay = document.getElementById("gameOverOverlay");
  const title = document.getElementById("gameOverTitle");
  const msg = document.getElementById("gameOverMsg");

  document.getElementById("finalScore").textContent = score;
  document.getElementById("finalHighScore").textContent = highScore;

  // Display the death message
  if (deathMessage) {
    msg.textContent = deathMessage;
  }

  // Set title based on score
  if (score >= highScore && score > 0) {
    title.textContent = "🎉 NEW HIGH SCORE!";
  } else if (score >= 15) {
    title.textContent = "🔥 Nice Run!";
  } else {
    title.textContent = "💪 Better Luck Next Time";
  }

  overlay.classList.remove("hidden");
}

// Close and restart button logic
document.getElementById("closeGameOver").addEventListener("click", () => {
  document.getElementById("gameOverOverlay").classList.add("hidden");
});

document.getElementById("restartFromModal").addEventListener("click", () => {
  document.getElementById("gameOverOverlay").classList.add("hidden");
  restartGame();
});

function restartGame() {
  clearSnake();
  clearFood();

  snake = [
    { x: 8, y: 6 },
    { x: 8, y: 5 },
    { x: 8, y: 4 },
  ];
  direction = null;
  score = 0;

  document.getElementById("score").textContent = score;
  generateFood();
  renderSnake();
  renderFood();
  resetTimer();
  gameStarted = false;

  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(mainLoop, speed);
}

function mainLoop() {
  if (!gameStarted) return;
  clearSnake();
  moveSnake();
  renderSnake();
}

// Initial setup
document.getElementById("highScore").textContent = highScore;
generateFood();
renderSnake();
renderFood();
gameLoop = setInterval(mainLoop, speed);
