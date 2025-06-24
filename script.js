const boardElement = document.getElementById('board');
const statusText = document.getElementById('status');
const resetButton = document.getElementById('reset');
const difficultySelect = document.getElementById('difficulty');
const apiKeyInput = document.getElementById('apiKey');

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
        setTimeout(getAIMove, 700); // Add a slight delay for UX
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


async function getAIMove() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey && currentPlayer === 'O') { // Only ask for key if AI needs to make a move
        // Avoid alert if human wins and AI doesn't need to move
        if (gameActive) {
            alert("Please enter your Gemini API Key to enable AI moves. Falling back to random.");
        }
        statusText.textContent = "API Key required for AI move. Falling back to random.";
        console.warn("API Key missing. AI falling back to random move.");
        makeRandomMove();
        isAITurn = false;
        enableBoardClicks();
        return;
    }

    const difficulty = difficultySelect.value;
    const boardString = boardState.map(s => s || '_').join(''); // Convert board to string like "X_O__XO_X"

    // --- THIS IS A PLACEHOLDER FOR GEMINI API ---
    // Replace with actual Gemini API call structure
    // For now, we'll simulate different difficulties with a random move or a slightly better one.
    console.log(`Calling Gemini (simulated) with board: ${boardString}, difficulty: ${difficulty}`);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let aiMoveIndex = -1;

    // Placeholder logic for difficulty - replace with actual API interaction
    if (difficulty === "easy") {
        aiMoveIndex = findRandomMove();
    } else if (difficulty === "medium") {
        // Try to find a winning move, then a blocking move, then random
        aiMoveIndex = findWinningMove('O') ?? findBlockingMove('X') ?? findRandomMove();
    } else { // hard
        // For "hard", ideally, the Gemini API would provide the optimal move.
        // As a placeholder, let's use the same logic as medium, or a more sophisticated local minimax if available.
        // For now, just more advanced local logic as placeholder.
        aiMoveIndex = findWinningMove('O') ?? findBlockingMove('X') ?? findBestMoveStrategically() ?? findRandomMove();
    }


    if (aiMoveIndex !== -1 && boardState[aiMoveIndex] === '') {
        makeMove(aiMoveIndex, 'O');
    } else {
        // Fallback if API (or simulated logic) fails or returns invalid move
        console.error("AI failed to make a valid move, or API error. Falling back to random.");
        makeRandomMove();
    }

    isAITurn = false;
    enableBoardClicks();
    if (gameActive && currentPlayer === 'X') { // Ensure it's player's turn text if game is still on
        statusText.textContent = `Player X's turn`;
    }
}

function makeRandomMove() {
    const emptyCellsIndexes = boardState.map((val, idx) => val === '' ? idx : -1).filter(idx => idx !== -1);
    if (emptyCellsIndexes.length > 0) {
        const randomIndex = emptyCellsIndexes[Math.floor(Math.random() * emptyCellsIndexes.length)];
        makeMove(randomIndex, 'O');
    }
}

function findWinningMove(player) {
    for (let i = 0; i < 9; i++) {
        if (boardState[i] === '') {
            boardState[i] = player;
            if (checkWin(player)) {
                boardState[i] = ''; // backtrack
                return i;
            }
            boardState[i] = ''; // backtrack
        }
    }
    return null;
}

function findBlockingMove(opponent) {
    return findWinningMove(opponent); // If opponent can win in next move, block it
}

function findBestMoveStrategically() {
    // Simple strategic moves: take center if available, then corners, then sides
    const center = 4;
    if (boardState[center] === '') return center;

    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(idx => boardState[idx] === '');
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    const sides = [1, 3, 5, 7];
    const availableSides = sides.filter(idx => boardState[idx] === '');
    if (availableSides.length > 0) {
        return availableSides[Math.floor(Math.random() * availableSides.length)];
    }
    return null; // Should not happen if findRandomMove is a fallback
}


function findRandomMove() {
    const emptyCellsIndexes = boardState.map((val, idx) => val === '' ? idx : -1).filter(idx => idx !== -1);
    if (emptyCellsIndexes.length > 0) {
        return emptyCellsIndexes[Math.floor(Math.random() * emptyCellsIndexes.length)];
    }
    return -1; // Should not happen if game ends correctly
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
apiKeyInput.addEventListener('change', () => {
    if(gameActive && currentPlayer === 'O' && isAITurn) {
        // If API key is entered while AI is "thinking" and was waiting for key
        // Potentially re-trigger AI move or just let the next turn handle it.
        // For simplicity, we'll let the next AI turn attempt with the new key.
        statusText.textContent = "API Key updated. AI will use it on its next turn.";
    }
});
difficultySelect.addEventListener('change', () => {
    // Optionally, reset the game if difficulty changes mid-game, or just apply to next game.
    // For now, it applies to the next AI move or game.
    console.log("Difficulty changed to: ", difficultySelect.value);
});
