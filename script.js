/***********************************
 * AUDIO
 ***********************************/
const bgMusic = new Audio("./sounds/bg-music.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.3;

const moveSound = new Audio("./sounds/move.mp3");
moveSound.volume = 0.05;

const eatSound = new Audio("./sounds/eat.mp3");
eatSound.volume = 0.6;

const gameOverSound = new Audio("./sounds/gameover.mp3");
gameOverSound.volume = 0.6;


/***********************************
 * 1. DOM REFERENCES
 ***********************************/
const board = document.querySelector(".gameArea");
const difficultyOverlay = document.getElementById("difficultyOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const timeEl = document.getElementById("time");

/***********************************
 * 2. DIFFICULTY SETTINGS
 ***********************************/
const difficultySettings = {
  easy: { blockSize: 60, speed: 180 },
  medium: { blockSize: 50, speed: 140 },
  hard: { blockSize: 40, speed: 100 },
};

/***********************************
 * 3. GAME STATE
 ***********************************/
let blockSize;
let speed;

let rows;
let cols;
let blocks = {};

let snake = [];
let food = null;

let direction = null;
let gameStarted = false;

let score = 0;
let highScore = localStorage.getItem("highScore") || 0;

let timer = 0;
let timerInterval = null;
let gameLoop = null;

/***********************************
 * 4. BOARD SETUP
 ***********************************/
function setupBoard() {
  board.innerHTML = "";
  blocks = {};

  rows = Math.floor(board.clientHeight / blockSize);
  cols = Math.floor(board.clientWidth / blockSize);

  board.style.gridTemplateRows = `repeat(${rows}, ${blockSize}px)`;
  board.style.gridTemplateColumns = `repeat(${cols}, ${blockSize}px)`;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const block = document.createElement("div");
      block.classList.add("block");
      blocks[`${i}-${j}`] = block;
      board.appendChild(block);
    }
  }
}

/***********************************
 * 5. DIFFICULTY SELECTION
 ***********************************/
function setDifficulty(level) {
  const settings = difficultySettings[level];

  blockSize = settings.blockSize;
  speed = settings.speed;

  difficultyOverlay.classList.add("hidden");
  restartGame();
}

/***********************************
 * 6. RENDER FUNCTIONS
 ***********************************/
function renderSnake() {
  snake.forEach((seg, idx) => {
    const block = blocks[`${seg.x}-${seg.y}`];
    if (!block) return;

    block.classList.add(idx === 0 ? "snakeHead" : "snakeBody");
  });
}

function clearSnake() {
  snake.forEach((seg) => {
    const block = blocks[`${seg.x}-${seg.y}`];
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
 * 7. FOOD LOGIC
 ***********************************/
function generateFood() {
  let pos;
  while (true) {
    pos = {
      x: Math.floor(Math.random() * rows),
      y: Math.floor(Math.random() * cols),
    };
    const hitSnake = snake.some((seg) => seg.x === pos.x && seg.y === pos.y);
    if (!hitSnake) break;
  }
  food = pos;
}

/***********************************
 * 8. MOVEMENT & COLLISION
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

  // Self collision
  if (checkSelfCollision(newHead)) {
    endGame("🐍 You bit yourself!");
    return;
  }

  // Food
  if (food && newHead.x === food.x && newHead.y === food.y) {
    score++;
    updateScore();

    eatSound.currentTime = 0;
    eatSound.play(); // 🍎 EAT SOUND

    clearFood();
    generateFood();
    renderFood();
  } else {
    snake.pop();
  }
}

/***********************************
 * 9. CONTROLS
 ***********************************/
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" || e.key === "w") setDirection("up");
  if (e.key === "ArrowDown" || e.key === "s") setDirection("down");
  if (e.key === "ArrowLeft" || e.key === "a") setDirection("left");
  if (e.key === "ArrowRight" || e.key === "d") setDirection("right");
});

document.getElementById("restartGame").addEventListener("click", () => {
  difficultyOverlay.classList.remove("hidden");
});

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
      bgMusic.play(); // 🔊 START MUSIC
    }
  }
}

/***********************************
 * 10. SCORE & TIMER
 ***********************************/
function updateScore() {
  scoreEl.textContent = score;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
    highScoreEl.textContent = highScore;
  }
}

function startTimer() {
  if (timerInterval) return;

  timerInterval = setInterval(() => {
    timer++;
    const min = Math.floor(timer / 60);
    const sec = timer % 60;
    timeEl.textContent = `${String(min).padStart(2, "0")}:${String(
      sec
    ).padStart(2, "0")}`;
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timer = 0;
  timeEl.textContent = "00:00";
}

/***********************************
 * 11. GAME LOOP
 ***********************************/
function mainLoop() {
  if (!gameStarted) return;
  clearSnake();
  moveSnake();
  renderSnake();

  moveSound.currentTime = 0;
  moveSound.play(); // 🐍 subtle movement sound

}

/***********************************
 * 12. GAME OVER
 ***********************************/
function endGame(message) {
  gameStarted = false;
  clearInterval(gameLoop);
  resetTimer();

  bgMusic.pause();
  bgMusic.currentTime = 0;

  gameOverSound.currentTime = 0;
  gameOverSound.play(); // 💀 GAME OVER

  document.getElementById("finalScore").textContent = score;
  document.getElementById("finalHighScore").textContent = highScore;
  document.getElementById("gameOverMsg").textContent = message;

  gameOverOverlay.classList.remove("hidden");

  // Close Game Over (X button)
document.getElementById("closeGameOver").addEventListener("click", () => {
  gameOverOverlay.classList.add("hidden");
  difficultyOverlay.classList.remove("hidden");
});

// Play Again button
document.getElementById("restartFromModal").addEventListener("click", () => {
  gameOverOverlay.classList.add("hidden");
  difficultyOverlay.classList.remove("hidden");
});

}

/***********************************
 * 13. RESTART GAME
 ***********************************/
function restartGame() {
  clearInterval(gameLoop);
  clearSnake();
  clearFood();

  setupBoard();

  const startX = Math.floor(rows / 2);
  const startY = Math.floor(cols / 2);

  snake = [
    { x: startX, y: startY },
    { x: startX, y: startY - 1 },
    { x: startX, y: startY - 2 },
  ];

  direction = null;
  score = 0;
  gameStarted = false;

  scoreEl.textContent = score;

  generateFood();
  renderSnake();
  renderFood();
  resetTimer();

  gameLoop = setInterval(mainLoop, speed);
}

/***********************************
 * 14. INIT
 ***********************************/
highScoreEl.textContent = highScore;
difficultyOverlay.classList.remove("hidden");
