const boardElement = document.getElementById('board');
const statusText = document.getElementById('status');
const resetButton = document.getElementById('reset');
const difficultySelect = document.getElementById('difficulty');
// const apiKeyInput = document.getElementById('apiKey'); // Removed

let currentPlayer = 'X'; // X is human, O is AI
let gameActive = true;
let cells = []; // Array to store cell DOM elements
let boardState = Array(9).fill(''); // ['', '', '', '', '', '', '', '', '']
let isAITurn = false;
let winningLine = null; // To store the current winning combination for drawing line

const winningCombinations = [
    // Rows
    { id: 'row-0', combo: [0, 1, 2], type: 'row', index: 0 },
    { id: 'row-1', combo: [3, 4, 5], type: 'row', index: 1 },
    { id: 'row-2', combo: [6, 7, 8], type: 'row', index: 2 },
    // Columns
    { id: 'col-0', combo: [0, 3, 6], type: 'col', index: 0 },
    { id: 'col-1', combo: [1, 4, 7], type: 'col', index: 1 },
    { id: 'col-2', combo: [2, 5, 8], type: 'col', index: 2 },
    // Diagonals
    { id: 'diag-0', combo: [0, 4, 8], type: 'diag', index: 0 }, // Top-left to bottom-right
    { id: 'diag-1', combo: [2, 4, 6], type: 'diag', index: 1 }  // Top-right to bottom-left
];

function createBoard() {
    boardElement.innerHTML = '';
    cells = [];
    boardState = Array(9).fill('');
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('click', handleCellClick);
        boardElement.appendChild(cell);
        cells.push(cell);
    }
}

function handleCellClick(e) {
    if (isAITurn || !gameActive) return; // Prevent clicks during AI's turn or if game is over

    const index = parseInt(e.target.dataset.index);

    if (boardState[index] !== '') return; // Cell already taken

    makeMove(index, currentPlayer);

    if (gameActive && currentPlayer === 'O') { // AI's turn
        isAITurn = true;
        statusText.textContent = `AI (O) is thinking...`;
        disableBoardClicks();
        setTimeout(makeLocalAIMove, 700); // Updated function name
    }
}

function makeMove(index, player) {
    if (!gameActive || boardState[index] !== '') return false;

    boardState[index] = player;
    cells[index].textContent = player;
    cells[index].classList.add(player); // Add class for X or O styling

    const winCheck = checkWin(player);
    if (winCheck.isWin) {
        statusText.textContent = `${player === 'X' ? 'Player X' : 'AI (O)'} wins!`;
        gameActive = false;
        winningLine = winCheck.combination; // Store the winning combination object
        drawWinningLine();
        triggerWinAnimation(player); // Trigger confetti and text animation
        enableBoardClicks(); // Re-enable clicks if game ends
        return true;
    }

    if (boardState.every(cell => cell !== '')) {
        statusText.textContent = 'It\'s a draw!';
        gameActive = false;
        enableBoardClicks(); // Re-enable clicks if game ends
        return true;
    }

    currentPlayer = player === 'X' ? 'O' : 'X';
    if (gameActive) {
        statusText.textContent = `Player ${currentPlayer}'s turn`;
    }
    return false; // Game continues
}

function checkWin(player) {
    for (const combination of winningCombinations) {
        if (combination.combo.every(index => boardState[index] === player)) {
            return { isWin: true, combination: combination };
        }
    }
    return { isWin: false, combination: null };
}

function drawWinningLine() {
    if (!winningLine) return;

    const lineElement = document.createElement('div');
    lineElement.classList.add('winning-line');
    lineElement.id = 'current-winning-line'; // To easily remove later

    // Calculate cell size and gap (assuming board is responsive)
    const boardWidth = boardElement.offsetWidth;
    const cellWidth = (boardWidth - 2 * 10) / 3; // 10px gap, 3 cells
    const cellHeight = cellWidth; // Assuming square cells
    const gap = 10;

    const { type, index: comboIndex } = winningLine;

    lineElement.style.backgroundColor = currentPlayer === 'X' ? 'rgba(0, 123, 255, 0.7)' : 'rgba(253, 126, 20, 0.7)';


    if (type === 'row') {
        lineElement.style.width = '90%';
        lineElement.style.height = '8px';
        lineElement.style.top = `${comboIndex * (cellHeight + gap) + cellHeight / 2 - 4}px`;
        lineElement.style.left = '5%';
        lineElement.style.transform = 'translateY(-50%)';
    } else if (type === 'col') {
        lineElement.style.width = '8px';
        lineElement.style.height = '90%';
        lineElement.style.left = `${comboIndex * (cellWidth + gap) + cellWidth / 2 - 4}px`;
        lineElement.style.top = '5%';
        lineElement.style.transform = 'translateX(-50%)';
    } else if (type === 'diag') {
        lineElement.style.width = '120%'; // Longer for diagonal
        lineElement.style.height = '8px';
        lineElement.style.top = '50%';
        lineElement.style.left = '-10%'; // Start from outside
        if (comboIndex === 0) { // Top-left to bottom-right
            lineElement.style.transform = 'translateY(-50%) rotate(45deg)';
        } else { // Top-right to bottom-left (diag-1)
            lineElement.style.transform = 'translateY(-50%) rotate(-45deg)';
        }
    }
    boardElement.appendChild(lineElement);
}

function removeWinningLine() {
    const existingLine = document.getElementById('current-winning-line');
    if (existingLine) {
        existingLine.remove();
    }
    winningLine = null;
}

function triggerWinAnimation(winner) {
    // Winner text animation
    statusText.classList.add(winner === 'X' ? 'winner-text-x' : 'winner-text-o');

    // Confetti animation
    const confettiContainer = document.createElement('div');
    confettiContainer.classList.add('confetti-container');
    confettiContainer.id = 'confetti-throw'; // To remove it later
    document.body.appendChild(confettiContainer);

    const confettiColors = ['#007bff', '#fd7e14', '#28a745', '#ffc107', '#dc3545', '#17a2b8'];
    for (let i = 0; i < 100; i++) { // Create 100 pieces of confetti
        const confettiPiece = document.createElement('div');
        confettiPiece.classList.add('confetti');
        confettiPiece.style.left = Math.random() * 100 + 'vw'; // Random horizontal start
        confettiPiece.style.animationDelay = Math.random() * 2 + 's'; // Random delay
        confettiPiece.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        // Vary size and shape slightly for more visual interest
        const size = Math.random() * 8 + 4; // Size between 4px and 12px
        confettiPiece.style.width = size + 'px';
        confettiPiece.style.height = size * (Math.random() * 0.5 + 0.75) + 'px'; // Slightly rectangular
        confettiPiece.style.transform = `translateY(-10vh) rotateZ(${Math.random() * 360}deg)`;


        confettiContainer.appendChild(confettiPiece);
    }

    // Remove confetti container after animation finishes (e.g., 3s for fall + 2s delay = 5s)
    setTimeout(() => {
        if (confettiContainer) {
            confettiContainer.remove();
        }
    }, 5000);
}

function resetWinAnimation() {
    statusText.classList.remove('winner-text-x', 'winner-text-o');
    const confettiContainer = document.getElementById('confetti-throw');
    if (confettiContainer) {
        confettiContainer.remove();
    }
}


function disableBoardClicks() {
    cells.forEach(cell => cell.style.pointerEvents = 'none');
}

function enableBoardClicks() {
    cells.forEach(cell => cell.style.pointerEvents = 'auto');
}

// Renamed to reflect it's now local AI, not fetching from API
async function makeLocalAIMove() {
    const difficulty = difficultySelect.value;
    // statusText.textContent = `AI (${currentPlayer}) is thinking...`; // Already set in handleCellClick

    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400)); // Shorter, slightly variable delay

    let aiMoveIndex = -1;

    if (difficulty === "easy") {
        aiMoveIndex = findRandomEmptyCell();
    } else if (difficulty === "medium") {
        // Try to find a winning move for AI, then a blocking move against Player, then strategic, then random
        aiMoveIndex = findWinningMove('O') ?? findBlockingMove('X') ?? findBestMoveStrategically() ?? findRandomEmptyCell();
    } else { // hard - This will be replaced by Minimax
        // For now, using the same as medium as a temporary placeholder before Minimax is added.
        // aiMoveIndex = findWinningMove('O') ?? findBlockingMove('X') ?? findBestMoveStrategically() ?? findRandomEmptyCell();
        // Placeholder for Minimax call:
        aiMoveIndex = findBestMoveUsingMinimax(); // This function will be implemented next
    }

    if (aiMoveIndex !== -1 && boardState[aiMoveIndex] === '') {
        makeMove(aiMoveIndex, 'O');
    } else {
        // Fallback if AI logic somehow fails (e.g. no empty cells but game active, or minimax returns error)
        console.error("AI failed to make a valid move. Attempting random fallback.");
        const randomFallbackMove = findRandomEmptyCell();
        if (randomFallbackMove !== -1) {
            makeMove(randomFallbackMove, 'O');
        } else {
            console.error("AI Critical Error: No empty cells for fallback move. Game state:", boardState);
            // This case should ideally not be reached if game logic is correct.
        }
    }

    isAITurn = false;
    enableBoardClicks();
    // Status update for player's turn is handled by makeMove if game is still active
}

// Renamed from makeRandomMove for clarity, as it's a specific part of AI strategy now
function makeAIMoveAtEmptyCell(indexToMove) {
    if (indexToMove !== -1 && boardState[indexToMove] === '') {
        makeMove(indexToMove, 'O');
    } else {
        // Fallback if a specific move is invalid (should ideally not happen with correct logic)
        const randomMove = findRandomEmptyCell();
        if (randomMove !== -1) makeMove(randomMove, 'O');
    }
}

// Renamed from findRandomMove for clarity
function findRandomEmptyCell() {
    const emptyCellsIndexes = boardState.map((val, idx) => val === '' ? idx : -1).filter(idx => idx !== -1);
    if (emptyCellsIndexes.length > 0) {
        return emptyCellsIndexes[Math.floor(Math.random() * emptyCellsIndexes.length)];
    }
    return -1; // No empty cells
}

// This is the main checkWin that operates on the global boardState
function checkWin(player) {
    for (const combination of winningCombinations) {
        if (combination.combo.every(index => boardState[index] === player)) {
            return { isWin: true, combination: combination };
        }
    }
    return { isWin: false, combination: null };
}


// Helper function to check win on an arbitrary board array (e.g. a copy for AI simulation)
function checkWinInternal(board, player) {
    for (const combination of winningCombinations) {
        if (combination.combo.every(index => board[index] === player)) {
            return { isWin: true, combination: combination };
        }
    }
    return { isWin: false, combination: null };
}


function findWinningMove(player, currentBoard = boardState) {
    for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === '') {
            currentBoard[i] = player;
            if (checkWinInternal(currentBoard, player).isWin) { // Use internal check for arbitrary boards
                currentBoard[i] = ''; // backtrack
                return i;
            }
            currentBoard[i] = ''; // backtrack
        }
    }
    return null;
}

function findBlockingMove(opponentPlayer, currentBoard = boardState) {
    return findWinningMove(opponentPlayer, currentBoard);
}

function findBestMoveStrategically(currentBoard = boardState) {
    // Simple strategic moves: take center if available, then corners, then sides
    const center = 4;
    if (currentBoard[center] === '') return center;

    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(idx => currentBoard[idx] === '');
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    const sides = [1, 3, 5, 7];
    const availableSides = sides.filter(idx => currentBoard[idx] === '');
    if (availableSides.length > 0) {
        return availableSides[Math.floor(Math.random() * availableSides.length)];
    }
    return null;
}

// findRandomMove function removed as it's a duplicate of findRandomEmptyCell (after correction)

// Minimax Implementation
const AI_PLAYER = 'O';
const HUMAN_PLAYER = 'X';

function getEmptyCellIndices(board) {
    return board.reduce((acc, cell, index) => {
        if (cell === '') acc.push(index);
        return acc;
    }, []);
}

// The main minimax function
function minimax(currentBoard, depth, isMaximizingPlayer) {
    // Check for terminal states (win, loss, draw)
    const humanWinDetails = checkWinInternal(currentBoard, HUMAN_PLAYER);
    if (humanWinDetails.isWin) {
        return -10 + depth; // Prioritize faster losses for the opponent (AI perspective)
    }

    const aiWinDetails = checkWinInternal(currentBoard, AI_PLAYER);
    if (aiWinDetails.isWin) {
        return 10 - depth; // Prioritize faster wins for AI
    }

    const emptyCells = getEmptyCellIndices(currentBoard);
    if (emptyCells.length === 0) {
        return 0; // Draw
    }

    // Recursive calls for AI (Maximizer) and Human (Minimizer)
    if (isMaximizingPlayer) { // AI's turn
        let bestScore = -Infinity;
        for (const cellIndex of emptyCells) {
            currentBoard[cellIndex] = AI_PLAYER;
            let score = minimax(currentBoard, depth + 1, false); // Next turn is human (minimizer)
            currentBoard[cellIndex] = ''; // Undo the move
            bestScore = Math.max(score, bestScore);
        }
        return bestScore;
    } else { // Human's turn
        let bestScore = Infinity;
        for (const cellIndex of emptyCells) {
            currentBoard[cellIndex] = HUMAN_PLAYER;
            let score = minimax(currentBoard, depth + 1, true); // Next turn is AI (maximizer)
            currentBoard[cellIndex] = ''; // Undo the move
            bestScore = Math.min(score, bestScore);
        }
        return bestScore;
    }
}

function findBestMoveUsingMinimax() {
    let bestScore = -Infinity;
    let bestMove = -1;
    const tempBoard = [...boardState]; // Create a copy of the current board state

    const emptyCells = getEmptyCellIndices(tempBoard);

    if (emptyCells.length === 9) { // If board is empty, AI can take center or a corner for speed.
      return 4; // Center is generally a strong opening move.
    }


    for (const cellIndex of emptyCells) {
        tempBoard[cellIndex] = AI_PLAYER; // AI makes a move
        // Score is evaluated from the perspective of the next player (human, so isMaximizingPlayer = false)
        let moveScore = minimax(tempBoard, 0, false);
        tempBoard[cellIndex] = ''; // Undo the move

        if (moveScore > bestScore) {
            bestScore = moveScore;
            bestMove = cellIndex;
        }
    }
    // console.log(`Minimax best move: ${bestMove} with score: ${bestScore}`);
    return bestMove !== -1 ? bestMove : findRandomEmptyCell(); // Fallback, though Minimax should always find a move.
}


function resetGame() {
    currentPlayer = 'X';
    gameActive = true;
    isAITurn = false;
    removeWinningLine(); // Remove the line before creating a new board
    resetWinAnimation(); // Reset confetti and text animations
    createBoard(); // This also resets boardState
    statusText.textContent = `Player ${currentPlayer}'s turn`;
    enableBoardClicks();
}

// Initial setup
createBoard();
resetButton.addEventListener('click', resetGame);
// apiKeyInput event listener removed
difficultySelect.addEventListener('change', () => {
    // Optionally, reset the game if difficulty changes mid-game, or just apply to next game.
    // For now, it applies to the next AI move or game.
    // Could also add: if (gameActive) resetGame(); to apply to a fresh game.
    console.log("Difficulty changed to: ", difficultySelect.value);
});
