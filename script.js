document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('#grid');
  const width = 10;
  const squares = [];

  for (let i = 0; i < 200; i++) {
    const square = document.createElement('div');
    grid.appendChild(square);
    squares.push(square);
  }

  for (let i = 0; i < 10; i++) {
    const square = document.createElement('div');
    square.classList.add('taken');
    grid.appendChild(square);
    squares.push(square);
  }

  const lTetromino = [
    [1, width + 1, width * 2 + 1, 2],
    [width, width + 1, width + 2, width * 2 + 2],
    [1, width + 1, width * 2 + 1, width * 2],
    [width, width * 2, width * 2 + 1, width * 2 + 2],
  ];

  const zTetromino = [
    [0, width, width + 1, width * 2 + 1],
    [width + 1, width + 2, width * 2, width * 2 + 1],
    [0, width, width + 1, width * 2 + 1],
    [width + 1, width + 2, width * 2, width * 2 + 1],
  ];

  const tTetromino = [
    [1, width, width + 1, width + 2],
    [1, width + 1, width + 2, width * 2 + 1],
    [width, width + 1, width + 2, width * 2 + 1],
    [1, width, width + 1, width * 2 + 1],
  ];

  const oTetromino = [
    [0, 1, width, width + 1],
    [0, 1, width, width + 1],
    [0, 1, width, width + 1],
    [0, 1, width, width + 1],
  ];

  const iTetromino = [
    [1, width + 1, width * 2 + 1, width * 3 + 1],
    [width, width + 1, width + 2, width + 3],
    [1, width + 1, width * 2 + 1, width * 3 + 1],
    [width, width + 1, width + 2, width + 3],
  ];

  const theTetrominoes = [
    lTetromino,
    zTetromino,
    tTetromino,
    oTetromino,
    iTetromino,
  ];

  let currentPosition = 4;
  let currentRotation = 0;

  let random = Math.floor(Math.random() * theTetrominoes.length);
  let current = theTetrominoes[random][currentRotation];

  function draw() {
    current.forEach(index => {
      squares[currentPosition + index].classList.add('tetromino');
    });
  }

  function undraw() {
    current.forEach(index => {
      squares[currentPosition + index].classList.remove('tetromino');
    });
  }

  let timerId;
  const scoreDisplay = document.querySelector('#score');
  let score = 0;

  function moveDown() {
    undraw();
    currentPosition += width;
    draw();
    freeze();
  }

  function freeze() {
    if (
      current.some(index =>
        squares[currentPosition + index + width].classList.contains('taken')
      )
    ) {
      current.forEach(index =>
        squares[currentPosition + index].classList.add('taken')
      );
      random = Math.floor(Math.random() * theTetrominoes.length);
      current = theTetrominoes[random][currentRotation];
      currentPosition = 4;
      draw();
      addScore();
      gameOver();
    }
  }

  function moveLeft() {
    undraw();
    const isAtLeftEdge = current.some(index => (currentPosition + index) % width === 0);
    if (!isAtLeftEdge) currentPosition -= 1;
    if (current.some(index => squares[currentPosition + index].classList.contains('taken'))) {
      currentPosition += 1;
    }
    draw();
  }

  function moveRight() {
    undraw();
    const isAtRightEdge = current.some(index => (currentPosition + index) % width === width - 1);
    if (!isAtRightEdge) currentPosition += 1;
    if (current.some(index => squares[currentPosition + index].classList.contains('taken'))) {
      currentPosition -= 1;
    }
    draw();
  }

  function rotate() {
    undraw();
    currentRotation = (currentRotation + 1) % current.length;
    current = theTetrominoes[random][currentRotation];
    draw();
  }

  function control(e) {
    if (e.key === 'ArrowLeft') moveLeft();
    if (e.key === 'ArrowRight') moveRight();
    if (e.key === 'ArrowUp') rotate();
    if (e.key === 'ArrowDown') moveDown();
  }

  document.addEventListener('keydown', control);

  const startButton = document.querySelector('#start-button');
  startButton.addEventListener('click', () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    } else {
      draw();
      timerId = setInterval(moveDown, 1000);
    }
  });

  function addScore() {
    for (let i = 0; i < 199; i += width) {
      const row = Array.from({ length: width }, (_, k) => i + k);
      if (row.every(index => squares[index].classList.contains('taken'))) {
        score += 10;
        scoreDisplay.textContent = score;
        row.forEach(index => {
          squares[index].classList.remove('taken');
          squares[index].classList.remove('tetromino');
        });
        const removed = squares.splice(i, width);
        squares.unshift(...removed);
        squares.forEach(cell => grid.appendChild(cell));
      }
    }
  }

  function gameOver() {
    if (current.some(index => squares[currentPosition + index].classList.contains('taken'))) {
      scoreDisplay.textContent = 'Game Over';
      clearInterval(timerId);
    }
  }
});
