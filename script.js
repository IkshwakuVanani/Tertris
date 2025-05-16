const COLS = 10, ROWS = 20, CELL = 30;
const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
canvas.width = COLS * CELL;
canvas.height = ROWS * CELL;

const holdCanvas = document.getElementById('hold');
const holdCtx = holdCanvas.getContext('2d');

const scoreEl = document.getElementById('score');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const startOverlay = document.getElementById('startOverlay');
const pausedText = document.getElementById('pausedText');
const gameOverText = document.getElementById('gameOverText');

const bgm = document.getElementById('bgm');
const moveSound = document.getElementById('moveSound');
const dropSound = document.getElementById('dropSound');
const clearSound = document.getElementById('clearSound');

// Tetrominoes
const SHAPES = {
  I: [[1,1,1,1]],
  J: [[1,0,0],[1,1,1]],
  L: [[0,0,1],[1,1,1]],
  O: [[1,1],[1,1]],
  S: [[0,1,1],[1,1,0]],
  Z: [[1,1,0],[0,1,1]],
  T: [[0,1,0],[1,1,1]]
};
const COLORS = {
  I: '#0ff', J: '#00f', L: '#f90',
  O: '#ff0', S: '#0f0', Z: '#f00', T: '#a0f'
};

let board = [];
let current, hold = null;
let canHold = true;
let score = 0;
let paused = false;
let gameOver = false;
let lastDrop = 0;
const dropInterval = 1000;

// === Board Setup ===
function resetBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

// === Piece Handling ===
function spawn() {
  const types = Object.keys(SHAPES);
  const shape = types[Math.floor(Math.random() * types.length)];
  const matrix = SHAPES[shape];
  current = {
    shape,
    matrix,
    x: Math.floor((COLS - matrix[0].length) / 2),
    y: -1
  };
  if (collides(current.matrix, current.x, current.y)) {
    gameOver = true;
    bgm.pause();
    gameOverText.classList.remove('hidden');
  }
  canHold = true;
}

function holdPiece() {
  if (!canHold) return;
  if (!hold) {
    hold = current.shape;
    spawn();
  } else {
    [hold, current.shape] = [current.shape, hold];
    current.matrix = SHAPES[current.shape];
    current.x = Math.floor((COLS - current.matrix[0].length) / 2);
    current.y = -1;
  }
  canHold = false;
  drawHold();
}

function drawHold() {
  holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
  if (!hold) return;
  const shape = SHAPES[hold];
  holdCtx.fillStyle = COLORS[hold];
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        holdCtx.fillRect(c * 25 + 20, r * 25 + 20, 24, 24);
        holdCtx.strokeStyle = 'rgba(0,0,0,0.5)';
        holdCtx.strokeRect(c * 25 + 20, r * 25 + 20, 24, 24);
      }
    }
  }
}

// === Collision Detection ===
function collides(matrix, x, y) {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (!matrix[r][c]) continue;

      const newX = x + c;
      const newY = y + r;

      if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
      if (newY >= 0 && board[newY][newX]) return true;
    }
  }
  return false;
}

// === Movement ===
function move(dir) {
  if (!current) return;
  const newX = current.x + dir;
  if (!collides(current.matrix, newX, current.y)) {
    current.x = newX;
    moveSound.play();
  }
}

function rotate() {
  if (!current) return;
  const rotated = rotateMatrix(current.matrix);
  if (!collides(rotated, current.x, current.y)) {
    current.matrix = rotated;
    moveSound.play();
  }
}

function drop() {
  if (!current) return;
  if (!collides(current.matrix, current.x, current.y + 1)) {
    current.y++;
  } else {
    lock();
    clearLines();
    spawn();
  }
}

function hardDrop() {
  if (!current) return;
  while (!collides(current.matrix, current.x, current.y + 1)) {
    current.y++;
    score += 2;
  }
  lock();
  dropSound.play();
  clearLines();
  spawn();
}

function rotateMatrix(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
}

function lock() {
  const { x, y, matrix, shape } = current;
  matrix.forEach((row, r) => {
    row.forEach((val, c) => {
      if (val && y + r >= 0) board[y + r][x + c] = COLORS[shape];
    });
  });
  canHold = true;
}
function clearLines() {
  let lines = 0;
  board = board.filter(row => {
    if (row.every(cell => cell)) {
      lines++;
      return false;
    }
    return true;
  });
  while (board.length < ROWS) board.unshift(Array(COLS).fill(0));
  if (lines) {
    score += [0, 100, 300, 500, 800][lines];
    scoreEl.textContent = score;
    clearSound.play();
  }
}
function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background board
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) drawBlock(c * CELL, r * CELL, board[r][c]);
      context.strokeStyle = 'rgba(255,255,255,0.05)';
      context.strokeRect(c * CELL, r * CELL, CELL, CELL);
    }
  }

  // Draw ghost
  drawGhost();

  // Draw current piece
  if (current) {
    current.matrix.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val) drawBlock((current.x + c) * CELL, (current.y + r) * CELL, COLORS[current.shape]);
      });
    });
  }
}
function update(time = 0) {
  if (!paused && !gameOver) {
    const delta = time - lastDrop;
    if (delta > dropInterval) {
      drop();
      lastDrop = time;
    }
  }
  draw();
  requestAnimationFrame(update);
}
function togglePause() {
  if (gameOver) return;
  paused = !paused;
  pausedText.classList.toggle('hidden', !paused);
  paused ? bgm.pause() : bgm.play();
}

function startGame() {
  resetBoard();
  score = 0;
  scoreEl.textContent = 0;
  gameOver = false;
  paused = false;
  current = null;
  hold = null;
  drawHold();
  gameOverText.classList.add('hidden');
  pausedText.classList.add('hidden');
  bgm.currentTime = 0;
  bgm.play();
  spawn();
}
// Controls
document.addEventListener('keydown', e => {
  if (gameOver) return;
  switch (e.code) {
    case 'ArrowLeft': move(-1); break;
    case 'ArrowRight': move(1); break;
    case 'ArrowDown': drop(); break;
    case 'ArrowUp': rotate(); break;
    case 'Space': hardDrop(); break;
    case 'ShiftLeft':
    case 'ShiftRight': holdPiece(); break;
    case 'KeyP': togglePause(); break;
  }
});

// Buttons
startOverlay.onclick = () => {
  startOverlay.classList.add('hidden');
  startGame();
};
pauseBtn.onclick = togglePause;
restartBtn.onclick = () => {
  startOverlay.classList.remove('hidden');
  startGame();
};

// Mobile controls
['left', 'right', 'down', 'rotate'].forEach(id => {
  document.getElementById(id + 'Btn').addEventListener('touchstart', e => {
    e.preventDefault();
    ({left: () => move(-1), right: () => move(1), down: drop, rotate} [id])();
  });
});
// Initialize board and run game loop
resetBoard();
requestAnimationFrame(update);
