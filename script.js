// script.js: Tetris game logic

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const holdCanvas = document.getElementById('hold');
const holdCtx = holdCanvas.getContext('2d');

const COLS = 10, ROWS = 22;      // 10x22 grid (20 visible rows + 2 hidden)
const VISIBLE_ROWS = 20;
const CELL = 30;                // block size in pixels
canvas.width = COLS * CELL;
canvas.height = VISIBLE_ROWS * CELL;

// Game state
let board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
let current = null, currentX = 0, currentY = 0, currentRotation = 0;
let holdPiece = null, holdUsed = false;
let bag = [];

// Tetromino rotation definitions (x,y offsets)
const PIECES = {
  I: [
    [[0,1],[1,1],[2,1],[3,1]],
    [[2,0],[2,1],[2,2],[2,3]],
    [[0,2],[1,2],[2,2],[3,2]],
    [[1,0],[1,1],[1,2],[1,3]]
  ],
  J: [
    [[0,0],[0,1],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[1,2]],
    [[0,1],[1,1],[2,1],[2,2]],
    [[1,0],[1,1],[1,2],[0,2]]
  ],
  L: [
    [[2,0],[0,1],[1,1],[2,1]],
    [[1,0],[1,1],[1,2],[2,2]],
    [[0,1],[1,1],[2,1],[0,2]],
    [[0,0],[1,0],[1,1],[1,2]]
  ],
  O: [
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]],
    [[1,0],[2,0],[1,1],[2,1]]
  ],
  S: [
    [[1,0],[2,0],[0,1],[1,1]],
    [[1,0],[1,1],[2,1],[2,2]],
    [[1,1],[2,1],[0,2],[1,2]],
    [[0,0],[0,1],[1,1],[1,2]]
  ],
  T: [
    [[1,0],[0,1],[1,1],[2,1]],
    [[1,0],[1,1],[2,1],[1,2]],
    [[0,1],[1,1],[2,1],[1,2]],
    [[1,0],[0,1],[1,1],[1,2]]
  ],
  Z: [
    [[0,0],[1,0],[1,1],[2,1]],
    [[2,0],[2,1],[1,1],[1,2]],
    [[0,1],[1,1],[1,2],[2,2]],
    [[1,0],[1,1],[0,1],[0,2]]
  ]
};

// Piece colors
const COLORS = {
  I: '#00f0f0', J: '#0000f0', L: '#f0a000', O: '#f0f000',
  S: '#00f000', T: '#a000f0', Z: '#f00000'
};

// Audio (placeholder .mp3 files in audio/ folder)
const audioMove = new Audio('audio/move.mp3');
const audioDrop = new Audio('audio/drop.mp3');
const audioClear = new Audio('audio/clear.mp3');
const bgm = new Audio('audio/bgm.mp3');
bgm.loop = true;
bgm.volume = 0.5;
// Autoplay workaround: start music on first key press
function startMusic() {
  if (bgm.paused) bgm.play();
  window.removeEventListener('keydown', startMusic);
}
window.addEventListener('keydown', startMusic);

// Check collision of current piece at (x,y,rotation)
function collisionAt(x, y, rotation) {
  const shape = PIECES[current][rotation];
  for (let [dx, dy] of shape) {
    let px = x + dx, py = y + dy;
    if (py < 0) continue;  // skip hidden rows
    if (px < 0 || px >= COLS || py >= ROWS) return true;
    if (board[py][px]) return true;
  }
  return false;
}

// Lock the current piece into the board
function lockPiece() {
  const shape = PIECES[current][currentRotation];
  for (let [dx, dy] of shape) {
    let x = currentX + dx, y = currentY + dy;
    if (y >= 0) {
      board[y][x] = current;
    }
  }
  playAudio(audioDrop);  // drop sound on lock
  clearLines();
  spawnPiece();
}

// Clear full lines
function clearLines() {
  for (let y = ROWS - 1; y >= 2; y--) {
    if (board[y].every(cell => cell !== 0)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
      playAudio(audioClear);
      y++; // re-check same row index
    }
  }
}

// Draw all elements: board, ghost, current piece, and hold
function draw() {
  // Clear board canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw locked blocks
  for (let y = 2; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x]) {
        drawCell(ctx, x, y - 2, COLORS[board[y][x]]);
      }
    }
  }
  // Draw ghost and current piece
  if (current) {
    drawGhost();
    const shape = PIECES[current][currentRotation];
    for (let [dx, dy] of shape) {
      let x = currentX + dx, y = currentY + dy;
      if (y >= 0) drawCell(ctx, x, y - 2, COLORS[current]);
    }
  }
  // Draw hold box
  drawHold();
}

// Draw a single block cell at (x,y) in grid space
function drawCell(context, x, y, color) {
  context.fillStyle = color;
  context.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
  context.strokeStyle = 'rgba(0,0,0,0.2)';
  context.strokeRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
}

// Compute and draw ghost piece (semi-transparent)
function drawGhost() {
  const shape = PIECES[current][currentRotation];
  let gy = currentY;
  while (!collisionAt(currentX, gy + 1, currentRotation)) {
    gy++;
  }
  ctx.globalAlpha = 0.3;
  for (let [dx, dy] of shape) {
    let x = currentX + dx, y = gy + dy;
    if (y >= 0) drawCell(ctx, x, y - 2, '#777');
  }
  ctx.globalAlpha = 1.0;
}

// Draw the held piece in its 4x4 hold canvas (centered)
function drawHold() {
  holdCtx.fillStyle = '#000';
  holdCtx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);
  if (!holdPiece) return;
  const shape = PIECES[holdPiece][0];
  // Centering offsets
  let xs = shape.map(c => c[0]), ys = shape.map(c => c[1]);
  let minx = Math.min(...xs), maxx = Math.max(...xs);
  let miny = Math.min(...ys), maxy = Math.max(...ys);
  let offsetX = Math.floor((4 - (maxx - minx + 1)) / 2) - minx;
  let offsetY = Math.floor((4 - (maxy - miny + 1)) / 2) - miny;
  for (let [dx, dy] of shape) {
    drawCell(holdCtx, dx + offsetX, dy + offsetY, COLORS[holdPiece]);
  }
}

// Spawn next piece from the shuffled 7-bag
function spawnPiece() {
  if (!bag.length) {
    bag = ['I','J','L','O','S','T','Z'];
    // Fisher–Yates shuffle
    for (let i = bag.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  current = bag.pop();
  currentRotation = 0;
  currentX = (current === 'I' ? 3 : (current === 'O' ? 4 : 3));
  currentY = (current === 'I' ? -1 : -2);
  holdUsed = false;
  // Guideline: drop one row if possible
  if (!collisionAt(currentX, currentY + 1, currentRotation)) {
    currentY++;
  }
  // Game Over check
  if (collisionAt(currentX, currentY, currentRotation)) {
    alert('Game Over');
    board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
  }
}

// Move current piece left/right
function move(offset) {
  if (!collisionAt(currentX + offset, currentY, currentRotation)) {
    currentX += offset;
    playAudio(audioMove);
  }
}

// Rotate current piece (1 = clockwise, -1 = CCW)
function rotate(dir) {
  let newRot = (currentRotation + (dir > 0 ? 1 : 3)) % 4;
  if (!collisionAt(currentX, currentY, newRot)) {
    currentRotation = newRot;
  }
}

// Soft drop (one row)
function drop() {
  if (!collisionAt(currentX, currentY + 1, currentRotation)) {
    currentY++;
    playAudio(audioMove);
  } else {
    lockPiece();
  }
}

// Hard drop (fall to bottom)
function hardDrop() {
  while (!collisionAt(currentX, currentY + 1, currentRotation)) {
    currentY++;
  }
  lockPiece();
  playAudio(audioDrop);
}

// Hold current piece
function holdCurrent() {
  if (holdUsed) return;
  if (holdPiece === null) {
    holdPiece = current;
    spawnPiece();
  } else {
    [holdPiece, current] = [current, holdPiece];
    currentRotation = 0;
    currentX = (current === 'I' ? 3 : (current === 'O' ? 4 : 3));
    currentY = (current === 'I' ? -1 : -2);
    if (!collisionAt(currentX, currentY + 1, currentRotation)) {
      currentY++;
    }
  }
  holdUsed = true;
  playAudio(audioMove);
}

// Play a sound effect from start
function playAudio(audio) {
  audio.currentTime = 0;
  audio.play();
}

// Main game loop (automatic drop + redraw)
let dropInterval = 500;
let lastDrop = Date.now();
function gameLoop() {
  const now = Date.now();
  if (now - lastDrop > dropInterval) {
    drop();
    lastDrop = now;
  }
  draw();
  requestAnimationFrame(gameLoop);
}

// Keyboard controls
document.addEventListener('keydown', e => {
  switch (e.code) {
    case 'ArrowLeft':  move(-1);            break;
    case 'ArrowRight': move(1);             break;
    case 'ArrowUp':    rotate(1);           break;
    case 'KeyZ':       rotate(-1);          break;
    case 'ArrowDown':  drop();              break;
    case 'Space':      hardDrop();          break;
    case 'ShiftLeft':
    case 'KeyC':       holdCurrent();       break;
  }
});

// On-screen button controls (mobile)
document.getElementById('left').addEventListener('click',  () => move(-1));
document.getElementById('right').addEventListener('click', () => move(1));
document.getElementById('rotate').addEventListener('click',() => rotate(1));
document.getElementById('down').addEventListener('click',  () => drop());
document.getElementById('drop').addEventListener('click', () => hardDrop());
document.getElementById('hold-btn').addEventListener('click', () => holdCurrent());

// Start the game
spawnPiece();
gameLoop();
