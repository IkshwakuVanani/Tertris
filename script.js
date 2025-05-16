// JavaScript for Tetris game

const COLS = 10, ROWS = 20;
const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const pausedText = document.getElementById('pausedText');
const gameOverText = document.getElementById('gameOverText');

const bgm = document.getElementById('bgm');
const moveSound = document.getElementById('moveSound');
const dropSound = document.getElementById('dropSound');
const clearSound = document.getElementById('clearSound');

// Define Tetromino shapes (4x4 matrices) and colors
const SHAPES = {
  I: [
    [0,0,0,0],
    [1,1,1,1],
    [0,0,0,0],
    [0,0,0,0]
  ],
  J: [
    [1,0,0,0],
    [1,1,1,0],
    [0,0,0,0],
    [0,0,0,0]
  ],
  L: [
    [0,0,1,0],
    [1,1,1,0],
    [0,0,0,0],
    [0,0,0,0]
  ],
  O: [
    [1,1,0,0],
    [1,1,0,0],
    [0,0,0,0],
    [0,0,0,0]
  ],
  S: [
    [0,1,1,0],
    [1,1,0,0],
    [0,0,0,0],
    [0,0,0,0]
  ],
  Z: [
    [1,1,0,0],
    [0,1,1,0],
    [0,0,0,0],
    [0,0,0,0]
  ],
  T: [
    [0,1,0,0],
    [1,1,1,0],
    [0,0,0,0],
    [0,0,0,0]
  ]
};
const COLORS = {
  I: '#0ff',  // cyan
  J: '#00f',  // blue
  L: '#f90',  // orange
  O: '#ff0',  // yellow
  S: '#0f0',  // green
  Z: '#f00',  // red
  T: '#a0f'   // purple
};

let board = [];
let currentPiece = null;
let gameOver = false;
let paused = false;
let score = 0;
let dropInterval = 1000;     // drop every 1000 ms
let lastDropTime = Date.now();

// Initialize canvas size (each cell 30×30)
canvas.width = COLS * 30;
canvas.height = ROWS * 30;

// Create an empty board (2D array)
function initBoard() {
  board = [];
  for (let r = 0; r < ROWS; r++) {
    board[r] = new Array(COLS).fill(0);
  }
}

// Draw the current game state
function draw() {
  // Clear canvas
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Grid cell size
  const cellSize = 30;

  // Draw locked pieces from board
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) {
        context.fillStyle = board[r][c];
        context.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }

      // Draw grid lines (even on empty cells)
      context.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      context.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
    }
  }

  // Draw current piece
  if (currentPiece) {
    context.fillStyle = COLORS[currentPiece.shape];
    for (let r = 0; r < currentPiece.matrix.length; r++) {
      for (let c = 0; c < currentPiece.matrix[r].length; c++) {
        if (currentPiece.matrix[r][c]) {
          const x = (currentPiece.x + c) * cellSize;
          const y = (currentPiece.y + r) * cellSize;
          context.fillRect(x, y, cellSize, cellSize);
          context.strokeRect(x, y, cellSize, cellSize);  // grid line on tetromino
        }
      }
    }
  }
}

// Rotate a matrix clockwise
function rotateMatrix(matrix) {
  const N = matrix.length;
  let result = matrix.map(row => row.slice());
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      result[x][N - 1 - y] = matrix[y][x];
    }
  }
  return result;
}

// Check collision of a piece at (x,y) with board or walls
function collide(x, y, matrix) {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) {
        let newX = x + c;
        let newY = y + r;
        // Check bounds
        if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
        // Check if occupied (only if inside top of board)
        if (newY >= 0 && board[newY][newX]) return true;
      }
    }
  }
  return false;
}

// Lock the current piece into the board array
function placePiece() {
  const {shape, matrix, x, y} = currentPiece;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] && y + r >= 0) {
        board[y + r][x + c] = COLORS[shape];
      }
    }
  }
  clearLines();
  newPiece();
}

// Clear any full lines and update score
function clearLines() {
  let lines = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(cell => cell !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      lines++;
      r++; // re-check this row
    }
  }
  if (lines > 0) {
    // Scoring: 1 line=100, 2=300, 3=500, 4=800 (classic style) [oai_citation:8‡tetris.wiki](https://tetris.wiki/Scoring#:~:text=Action%20Points%20Single%20100%20%C3%97,Single%20800%20%C3%97%20level%3B%20difficult)
    const points = [0, 100, 300, 500, 800];
    score += points[lines];
    scoreElement.textContent = score;
    clearSound.play();
  }
}

// Spawn a new random piece
function newPiece() {
  const shapes = Object.keys(SHAPES);
  const rand = shapes[Math.floor(Math.random() * shapes.length)];
  const matrix = SHAPES[rand];
  currentPiece = {
    shape: rand,
    matrix: matrix,
    x: Math.floor(COLS/2) - 2,
    y: -2
  };
  // If the new piece collides immediately, it's game over
  if (collide(currentPiece.x, currentPiece.y, currentPiece.matrix)) {
    gameOver = true;
    gameOverText.classList.remove('hidden');
    bgm.pause();
  }
}

// Move the piece down one row (if possible), else lock it
function drop() {
  if (!currentPiece) return;
  if (!collide(currentPiece.x, currentPiece.y + 1, currentPiece.matrix)) {
    currentPiece.y++;
  } else {
    placePiece();
  }
}

// Move left or right (dir = -1 or +1)
function move(dir) {
  if (!currentPiece) return;
  const newX = currentPiece.x + dir;
  if (!collide(newX, currentPiece.y, currentPiece.matrix)) {
    currentPiece.x = newX;
    moveSound.play();
  }
}

// Rotate the piece
function rotate() {
  if (!currentPiece) return;
  const newMatrix = rotateMatrix(currentPiece.matrix);
  if (!collide(currentPiece.x, currentPiece.y, newMatrix)) {
    currentPiece.matrix = newMatrix;
    moveSound.play();
  }
}

// Hard drop: drop to bottom instantly
function hardDrop() {
  if (!currentPiece) return;
  while (!collide(currentPiece.x, currentPiece.y + 1, currentPiece.matrix)) {
    currentPiece.y++;
    score += 2;  // small bonus per dropped row
  }
  placePiece();
  dropSound.play();
}

// Handle key input
document.addEventListener('keydown', (event) => {
  if (gameOver) return;
  switch (event.code) {
    case 'ArrowLeft':  move(-1); break;
    case 'ArrowRight': move(1); break;
    case 'ArrowUp':    rotate(); break;
    case 'ArrowDown':  drop(); break;
    case 'Space':      hardDrop(); break;
    case 'KeyP':       togglePause(); break;
  }
});

// Main game loop using requestAnimationFrame [oai_citation:9‡developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Games/Anatomy#:~:text=window,of%20a%20simple%20main%20loop) 
function update() {
  const now = Date.now();
  if (!paused && !gameOver) {
    if (now - lastDropTime > dropInterval) {
      drop();
      lastDropTime = now;
    }
  }
  draw();
  requestAnimationFrame(update);
}

// Start a new game
function startGame() {
  initBoard();
  score = 0;
  scoreElement.textContent = score;
  gameOver = false;
  paused = false;
  gameOverText.classList.add('hidden');
  pausedText.classList.add('hidden');
  bgm.currentTime = 0;
  bgm.play();
  newPiece();
}

// Toggle pause/resume
function togglePause() {
  if (gameOver) return;
  paused = !paused;
  pausedText.classList.toggle('hidden', !paused);
  if (paused) {
    bgm.pause();
  } else {
    bgm.play();
    lastDropTime = Date.now();
  }
}

// Restart game (same as start)
function restartGame() {
  startGame();
}

// Button event listeners
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', restartGame);

// Initialize board and begin the loop
initBoard();

requestAnimationFrame(update);
// Mobile touch control bindings
document.getElementById('leftBtn').addEventListener('touchstart', e => {
  e.preventDefault(); move(-1);
});
document.getElementById('rightBtn').addEventListener('touchstart', e => {
  e.preventDefault(); move(1);
});
document.getElementById('rotateBtn').addEventListener('touchstart', e => {
  e.preventDefault(); rotate();
});
document.getElementById('downBtn').addEventListener('touchstart', e => {
  e.preventDefault(); drop();
});
document.getElementById('startBtnMobile').addEventListener('touchstart', e => {
  e.preventDefault(); startGame();
});
document.getElementById('pauseBtnMobile').addEventListener('touchstart', e => {
  e.preventDefault(); togglePause();
});
document.getElementById('restartBtnMobile').addEventListener('touchstart', e => {
  e.preventDefault(); restartGame();
});
