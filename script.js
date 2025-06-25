const board = document.getElementById('board');
const statusText = document.getElementById('status');
const resetButton = document.getElementById('reset');
const difficultySelector = document.getElementById('difficulty');
const animationOverlay = document.getElementById('animation-overlay');
const animationMessage = document.getElementById('animation-message');

let currentPlayer = 'X';
let currentDifficulty = 'medium'; // Default difficulty
let gameActive = true;
let cells = [];

const winningCombinations = [
    [0,1,2], [3,4,5], [6,7,8], // Rows
    [0,3,6], [1,4,7], [2,5,8], // Columns
    [0,4,8], [2,4,6]           // Diagonals
];

function createBoard() {
    board.innerHTML = '';
    cells = [];
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('click', handleCellClick);
        board.appendChild(cell);
        cells.push(cell);
    }
}

function handleCellClick(e) {
    const index = e.target.dataset.index;
    const cell = cells[index];
    if (!gameActive || cell.textContent !== '') return;

    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer); // Add class for styling X or O
    checkResult();

    if (gameActive) {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        statusText.textContent = `Player ${currentPlayer}'s turn`;
        if (currentPlayer === 'O') {
            // Disable board during AI's turn
            board.style.pointerEvents = 'none';
            setTimeout(() => {
                getAIMove();
                // Re-enable board after AI's turn
                if(gameActive) board.style.pointerEvents = 'auto';
            }, 700); // Slightly longer delay for better UX
        }
    }
}

function checkResult() {
    let roundWon = false;
    let winningPlayer = null;
    for (let i = 0; i < winningCombinations.length; i++) {
        const [a, b, c] = winningCombinations[i];
        if (cells[a].textContent &&
            cells[a].textContent === cells[b].textContent &&
            cells[a].textContent === cells[c].textContent) {
            roundWon = true;
            winningPlayer = cells[a].textContent;
            // Highlight winning cells
            [cells[a], cells[b], cells[c]].forEach(cell => cell.style.backgroundColor = 'rgba(255,255,255,0.3)');
            break;
        }
    }

    if (roundWon) {
        // statusText.textContent = `Player ${winningPlayer} wins!`; // Keep original status for a moment
        gameActive = false;
        board.style.pointerEvents = 'none'; // Disable board on game over
        showEndGameAnimation(winningPlayer);
        return;
    }

    if (!cells.some(cell => cell.textContent === '') && !roundWon) {
        // statusText.textContent = 'It\'s a draw!'; // Keep original status for a moment
        gameActive = false;
        board.style.pointerEvents = 'none'; // Disable board on game over
        showEndGameAnimation('draw');
        return;
    }
}

function showEndGameAnimation(winner) {
    animationOverlay.classList.remove('hidden');
    animationOverlay.classList.remove('win', 'lose', 'draw'); // Clear previous result classes
    animationOverlay.classList.add('visible');

    if (winner === 'X') {
        animationMessage.textContent = 'You Win!';
        animationOverlay.classList.add('win');
    } else if (winner === 'O') {
        animationMessage.textContent = 'AI Wins!';
        animationOverlay.classList.add('lose');
    } else {
        animationMessage.textContent = 'It\'s a Draw!';
        animationOverlay.classList.add('draw');
    }
    // Optional: Add a delay before player can click overlay to reset, or auto-reset
    // For now, player can click reset button or the overlay (if we add event listener to it)
}


function getAIMove() {
    const boardState = cells.map(cell => cell.textContent || null); // Use null for empty cells for easier processing
    let moveIndex = -1;

    // AI logic based on difficulty
    const difficulty = currentDifficulty;

    if (difficulty === 'easy') {
        moveIndex = getRandomMove(boardState);
    } else if (difficulty === 'medium') {
        moveIndex = getMediumMove(boardState);
    } else { // Hard
        moveIndex = getBestMove(boardState);
    }

    if (moveIndex !== -1 && cells[moveIndex].textContent === '') {
        const cell = cells[moveIndex];
        cell.textContent = currentPlayer;
        cell.classList.add(currentPlayer); // Add class for styling X or O
        checkResult();
        if (gameActive) {
            currentPlayer = 'X';
            statusText.textContent = "Player X's turn";
        }
    } else if (gameActive) {
        // If AI fails to make a move (should not happen with proper logic), try a random move as a fallback.
        // This can happen if all cells are full but gameActive is still true (a bug elsewhere)
        // or if the AI logic has an issue.
        console.warn("AI failed to select a valid move, or no moves available. Attempting random fallback.");
        moveIndex = getRandomMove(boardState);
        if (moveIndex !== -1 && cells[moveIndex].textContent === '') {
            cells[moveIndex].textContent = currentPlayer;
            checkResult();
             if (gameActive) {
                currentPlayer = 'X';
                statusText.textContent = "Player X's turn";
            }
        } else if (gameActive) {
            console.error("Fallback random move also failed. Game might be in an inconsistent state.");
            // If even random move fails, it implies no empty cells are left,
            // which should have been caught by checkResult or led to a draw.
        }
    }
}

function getRandomMove(board) {
    const emptyCellsIndexes = [];
    board.forEach((cell, index) => {
        if (cell === null) emptyCellsIndexes.push(index);
    });
    if (emptyCellsIndexes.length === 0) return -1;
    return emptyCellsIndexes[Math.floor(Math.random() * emptyCellsIndexes.length)];
}

function getMediumMove(board) {
    // Medium: Win if possible, block if player is about to win, otherwise random
    // Check for winning move for AI
    for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
            board[i] = 'O'; // Try placing AI's move
            if (checkWin(board, 'O')) {
                board[i] = null; // Reset
                return i;
            }
            board[i] = null; // Reset
        }
    }
    // Check for blocking move against player
    for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
            board[i] = 'X'; // Try placing player's move
            if (checkWin(board, 'X')) {
                board[i] = null; // Reset
                return i;
            }
            board[i] = null; // Reset
        }
    }
    // Otherwise, random move
    return getRandomMove(board);
}


function getBestMove(board) {
    let bestScore = -Infinity;
    let move = -1;
    for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
            board[i] = 'O'; // AI's move
            let score = minimax(board, 0, false);
            board[i] = null; // Undo move
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move !== -1 ? move : getRandomMove(board); // Fallback if no move found (shouldn't happen)
}

const scores = {
    'O': 1,  // AI wins
    'X': -1, // Player wins
    'tie': 0
};

function minimax(board, depth, isMaximizing) {
    let winner = checkWinAndGetWinner(board);
    if (winner !== null) {
        return scores[winner];
    }

    if (isMaximizing) { // AI's turn (O)
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) {
                board[i] = 'O';
                let score = minimax(board, depth + 1, false);
                board[i] = null;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else { // Player's turn (X)
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) {
                board[i] = 'X';
                let score = minimax(board, depth + 1, true);
                board[i] = null;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// Helper function to check for a win for a specific player on a given board state
function checkWin(board, player) {
    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a] === player && board[b] === player && board[c] === player) {
            return true;
        }
    }
    return false;
}

// Helper function to check for win/draw and return winner or 'tie' or null if game ongoing
function checkWinAndGetWinner(board) {
    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // 'X' or 'O'
        }
    }
    if (board.every(cell => cell !== null)) {
        return 'tie';
    }
    return null; // Game is not over
}


function resetGame() {
    currentPlayer = 'X';
    gameActive = true;
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('X', 'O');
        cell.style.backgroundColor = ''; // Reset winning cell highlight
    });
    statusText.textContent = `Player ${currentPlayer}'s turn`;
    board.style.pointerEvents = 'auto'; // Re-enable board
    animationOverlay.classList.add('hidden');
    animationOverlay.classList.remove('visible');
    animationMessage.textContent = '';


    // If AI is 'O' and it's 'O's turn (e.g. player chose 'O' or some other logic), AI should make the first move.
    // For this game, player is always 'X' and starts.
    if (currentPlayer === 'O' && gameActive) { // This condition might not be hit with current setup where X always starts
        setTimeout(getAIMove, 500);
    }
}

createBoard(); // Initial board creation
resetButton.addEventListener('click', resetGame);
difficultySelector.addEventListener('change', (e) => {
    currentDifficulty = e.target.value;
    resetGame(); // Reset the game when difficulty changes
});

// Allow closing animation overlay by clicking on it
animationOverlay.addEventListener('click', () => {
    // Only hide if game is over, otherwise it might hide during an animation that shouldn't be interruptable by click
    if (!gameActive) {
        animationOverlay.classList.add('hidden');
        animationOverlay.classList.remove('visible');
        // Optionally, could also call resetGame() here, or just hide the overlay
        // and let the user click the reset button. For now, just hide.
    }
});
