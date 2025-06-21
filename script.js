const board = document.getElementById('board');
const statusText = document.getElementById('status');
const resetButton = document.getElementById('reset');

let currentPlayer = 'X';
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
    if (!gameActive || cells[index].textContent !== '') return;

    cells[index].textContent = currentPlayer;
    checkResult();

    if (gameActive) {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        statusText.textContent = `Player ${currentPlayer}'s turn`;
        // Call Gemini AI for move if it's O's turn
        if (currentPlayer === 'O') {
            setTimeout(getAIMove, 500);
        }
    }
}

function checkResult() {
    let roundWon = false;
    for (let i = 0; i < winningCombinations.length; i++) {
        const [a, b, c] = winningCombinations[i];
        if (cells[a].textContent === currentPlayer &&
            cells[b].textContent === currentPlayer &&
            cells[c].textContent === currentPlayer) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        statusText.textContent = `Player ${currentPlayer} wins!`;
        gameActive = false;
        return;
    }

    if (!cells.some(cell => cell.textContent === '') && !roundWon) {
        statusText.textContent = 'It\'s a draw!';
        gameActive = false;
        return;
    }
}

function getAIMove() {
    // Placeholder for Gemini API integration
    const apiKey = 'YOUR_GEMINI_API_KEY';
    const boardState = cells.map(cell => cell.textContent || '').join('');
    
    // Example API call (not functional without actual API endpoint)
    fetch('https://api.gemini.com/v1/move', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ board: boardState })
    })
    .then(response => response.json())
    .then(data => {
        const moveIndex = data.move;
        cells[moveIndex].textContent = currentPlayer;
        checkResult();
        currentPlayer = 'X';
        statusText.textContent = "Player X's turn";
    })
    .catch(error => {
        console.error('Error:', error);
        // Fallback to random move
        const emptyCells = cells.filter(cell => cell.textContent === '');
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        emptyCells[randomIndex].textContent = currentPlayer;
        checkResult();
        currentPlayer = 'X';
        statusText.textContent = "Player X's turn";
    });
}

function resetGame() {
    currentPlayer = 'X';
    gameActive = true;
    createBoard();
    statusText.textContent = `Player ${currentPlayer}'s turn`;
}

createBoard();
resetButton.addEventListener('click', resetGame);
