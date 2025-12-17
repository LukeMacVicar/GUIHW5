// Scrabble Game Logic - Luke MacVicar - GUI Programming HW5 - Dec 2025

// Board Layout Configuration
// Legend: N=Normal, DL=Double Letter, TL=Triple Letter, DW=Double Word, TW=Triple Word, C=Center
const BOARD_LAYOUT = [
    ['TW', 'N', 'N', 'DL', 'N', 'N', 'N', 'TW', 'N', 'N', 'N', 'DL', 'N', 'N', 'TW'],
    ['N', 'DW', 'N', 'N', 'N', 'TL', 'N', 'N', 'N', 'TL', 'N', 'N', 'N', 'DW', 'N'],
    ['N', 'N', 'DW', 'N', 'N', 'N', 'DL', 'N', 'DL', 'N', 'N', 'N', 'DW', 'N', 'N'],
    ['DL', 'N', 'N', 'DW', 'N', 'N', 'N', 'DL', 'N', 'N', 'N', 'DW', 'N', 'N', 'DL'],
    ['N', 'N', 'N', 'N', 'DW', 'N', 'N', 'N', 'N', 'N', 'DW', 'N', 'N', 'N', 'N'],
    ['N', 'TL', 'N', 'N', 'N', 'TL', 'N', 'N', 'N', 'TL', 'N', 'N', 'N', 'TL', 'N'],
    ['N', 'N', 'DL', 'N', 'N', 'N', 'DL', 'N', 'DL', 'N', 'N', 'N', 'DL', 'N', 'N'],
    ['TW', 'N', 'N', 'DL', 'N', 'N', 'N', 'C', 'N', 'N', 'N', 'DL', 'N', 'N', 'TW'],
    ['N', 'N', 'DL', 'N', 'N', 'N', 'DL', 'N', 'DL', 'N', 'N', 'N', 'DL', 'N', 'N'],
    ['N', 'TL', 'N', 'N', 'N', 'TL', 'N', 'N', 'N', 'TL', 'N', 'N', 'N', 'TL', 'N'],
    ['N', 'N', 'N', 'N', 'DW', 'N', 'N', 'N', 'N', 'N', 'DW', 'N', 'N', 'N', 'N'],
    ['DL', 'N', 'N', 'DW', 'N', 'N', 'N', 'DL', 'N', 'N', 'N', 'DW', 'N', 'N', 'DL'],
    ['N', 'N', 'DW', 'N', 'N', 'N', 'DL', 'N', 'DL', 'N', 'N', 'N', 'DW', 'N', 'N'],
    ['N', 'DW', 'N', 'N', 'N', 'TL', 'N', 'N', 'N', 'TL', 'N', 'N', 'N', 'DW', 'N'],
    ['TW', 'N', 'N', 'DL', 'N', 'N', 'N', 'TW', 'N', 'N', 'N', 'DL', 'N', 'N', 'TW']
];

// Square type to CSS class mapping
const SQUARE_CLASSES = {
    'N': 'normal',
    'DL': 'double-letter',
    'TL': 'triple-letter',
    'DW': 'double-word',
    'TW': 'triple-word',
    'C': 'center'
};

// Multiplier values
const LETTER_MULTIPLIERS = {
    'normal': 1, 'double-letter': 2, 'triple-letter': 3,
    'double-word': 1, 'triple-word': 1, 'center': 1
};

const WORD_MULTIPLIERS = {
    'normal': 1, 'double-letter': 1, 'triple-letter': 1,
    'double-word': 2, 'triple-word': 3, 'center': 2
};

// Game State
let gameState = {
    totalScore: 0,
    currentTurnTiles: [], // Tiles placed this turn: { letter, value, row, col, tileElement }
    boardState: [], // 15x15 array tracking placed tiles
    tilesRemaining: 0,
    isFirstWord: true
};

// Initialization
$(document).ready(function () {
    initializeGame();
});

function initializeGame() {
    // Reset tile counts
    resetTileDistribution();

    // Initialize board state
    gameState.boardState = Array(15).fill(null).map(() => Array(15).fill(null));
    gameState.totalScore = 0;
    gameState.currentTurnTiles = [];
    gameState.isFirstWord = true;

    // Generate UI
    generateBoard();
    refillRack();
    updateDisplay();

    // Set up event handlers
    $('#submit-word').on('click', submitWord);
    $('#recall-tiles').on('click', recallTiles);
    $('#restart-game').on('click', restartGame);

    showMessage('Drag tiles to the board to form words!', 'info');
}

function resetTileDistribution() {
    // Reset all tiles to original distribution
    for (let letter in ScrabbleTiles) {
        ScrabbleTiles[letter]['number-remaining'] = ScrabbleTiles[letter]['original-distribution'];
    }
    updateTilesRemaining();
}

function updateTilesRemaining() {
    let total = 0;
    for (let letter in ScrabbleTiles) {
        total += ScrabbleTiles[letter]['number-remaining'];
    }
    gameState.tilesRemaining = total;
    $('#tiles-remaining').text(total);
}


// Board Generation
function generateBoard() {
    const $board = $('#scrabble-board');
    $board.empty();

    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
            const squareType = BOARD_LAYOUT[row][col];
            const squareClass = SQUARE_CLASSES[squareType];

            const $square = $('<div>')
                .addClass('board-square')
                .addClass(squareClass)
                .attr('data-row', row)
                .attr('data-col', col)
                .attr('data-type', squareClass);

            // Make droppable
            $square.droppable({
                accept: '.tile',
                tolerance: 'intersect',
                hoverClass: 'ui-droppable-hover',
                drop: function (event, ui) {
                    handleTileDrop($(this), ui.draggable);
                }
            });

            $board.append($square);
        }
    }
}

// Tile Management
function drawTile() {
    // Build array of available letters
    const availableLetters = [];
    for (let letter in ScrabbleTiles) {
        const remaining = ScrabbleTiles[letter]['number-remaining'];
        for (let i = 0; i < remaining; i++) {
            availableLetters.push(letter);
        }
    }

    if (availableLetters.length === 0) {
        return null; // No tiles left
    }

    // Pick random letter
    const randomIndex = Math.floor(Math.random() * availableLetters.length);
    const letter = availableLetters[randomIndex];

    // Decrease count
    ScrabbleTiles[letter]['number-remaining']--;
    updateTilesRemaining();

    return {
        letter: letter,
        value: ScrabbleTiles[letter]['value']
    };
}

function createTileElement(tileData) {
    const letterKey = tileData.letter === '_' ? 'Blank' : tileData.letter;
    const imagePath = `graphics_data/tiles/Scrabble_Tile_${letterKey}.jpg`;

    const $tile = $('<div>')
        .addClass('tile')
        .attr('data-letter', tileData.letter)
        .attr('data-value', tileData.value);

    const $img = $('<img>')
        .attr('src', imagePath)
        .attr('alt', `Tile ${tileData.letter}`)
        .addClass('tile-img');

    $tile.append($img);

    // Make draggable
    $tile.draggable({
        revert: 'invalid',
        revertDuration: 200,
        zIndex: 1000,
        start: function () {
            $(this).addClass('ui-draggable-dragging');
        },
        stop: function () {
            $(this).removeClass('ui-draggable-dragging');
        }
    });

    return $tile;
}

function refillRack() {
    const $rack = $('#tile-rack');
    const currentTiles = $rack.find('.tile').length;
    const tilesToDraw = 7 - currentTiles;

    for (let i = 0; i < tilesToDraw; i++) {
        const tileData = drawTile();
        if (tileData) {
            const $tile = createTileElement(tileData);
            $rack.append($tile);
        }
    }

    // Make rack droppable for returning tiles
    if (!$rack.data('droppable-initialized')) {
        $rack.droppable({
            accept: '.tile',
            drop: function (event, ui) {
                handleTileReturnToRack(ui.draggable);
            }
        });
        $rack.data('droppable-initialized', true);
    }
}

// Drag & Drop Handlers
function handleTileDrop($square, $tile) {
    const row = parseInt($square.attr('data-row'));
    const col = parseInt($square.attr('data-col'));

    // Check if square is already occupied
    if ($square.hasClass('occupied')) {
        $tile.draggable('option', 'revert', true);
        return;
    }

    // Check if this tile was previously placed elsewhere this turn
    const tileId = $tile.data('tile-id') || generateTileId();
    $tile.data('tile-id', tileId);

    // Remove from previous position if it was placed this turn
    const existingIndex = gameState.currentTurnTiles.findIndex(t => t.tileId === tileId);
    if (existingIndex !== -1) {
        const existing = gameState.currentTurnTiles[existingIndex];
        gameState.boardState[existing.row][existing.col] = null;
        $(`.board-square[data-row="${existing.row}"][data-col="${existing.col}"]`).removeClass('occupied');
        gameState.currentTurnTiles.splice(existingIndex, 1);
    }

    // Snap tile to square
    $tile.detach().css({
        position: 'relative',
        top: 0,
        left: 0
    }).appendTo($square);

    $square.addClass('occupied');

    // Record placement
    const letter = $tile.attr('data-letter');
    const value = parseInt($tile.attr('data-value'));

    gameState.currentTurnTiles.push({
        letter: letter,
        value: value,
        row: row,
        col: col,
        tileElement: $tile,
        tileId: tileId
    });

    gameState.boardState[row][col] = { letter, value };

    // Update display
    calculateCurrentScore();
    updateWordDisplay();
}

function handleTileReturnToRack($tile) {
    const tileId = $tile.data('tile-id');

    // Remove from current turn tiles
    const index = gameState.currentTurnTiles.findIndex(t => t.tileId === tileId);
    if (index !== -1) {
        const tileData = gameState.currentTurnTiles[index];
        gameState.boardState[tileData.row][tileData.col] = null;
        $(`.board-square[data-row="${tileData.row}"][data-col="${tileData.col}"]`).removeClass('occupied');
        gameState.currentTurnTiles.splice(index, 1);
    }

    // Move tile back to rack
    $tile.detach().css({
        position: 'relative',
        top: 0,
        left: 0
    }).appendTo('#tile-rack');

    // Update display
    calculateCurrentScore();
    updateWordDisplay();
}

function generateTileId() {
    return 'tile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Scoring
function calculateCurrentScore() {
    if (gameState.currentTurnTiles.length === 0) {
        $('#current-score').text('0');
        return 0;
    }

    // Get all placed tiles (this turn + previous turns)
    const allWords = findAllWords();
    let totalWordScore = 0;

    allWords.forEach(word => {
        totalWordScore += calculateWordScore(word);
    });

    // Bonus for using all 7 tiles
    if (gameState.currentTurnTiles.length === 7) {
        totalWordScore += 50;
    }

    $('#current-score').text(totalWordScore);
    return totalWordScore;
}

function calculateWordScore(wordTiles) {
    let letterScore = 0;
    let wordMultiplier = 1;

    wordTiles.forEach(tile => {
        const $square = $(`.board-square[data-row="${tile.row}"][data-col="${tile.col}"]`);
        const squareType = $square.attr('data-type');

        // Only apply bonus if this tile was placed this turn
        const isNewTile = gameState.currentTurnTiles.some(t => t.row === tile.row && t.col === tile.col);

        if (isNewTile) {
            letterScore += tile.value * LETTER_MULTIPLIERS[squareType];
            wordMultiplier *= WORD_MULTIPLIERS[squareType];
        } else {
            letterScore += tile.value;
        }
    });

    return letterScore * wordMultiplier;
}

function findAllWords() {
    const words = [];

    if (gameState.currentTurnTiles.length === 0) return words;

    // Determine if tiles are placed horizontally or vertically
    const rows = [...new Set(gameState.currentTurnTiles.map(t => t.row))];
    const cols = [...new Set(gameState.currentTurnTiles.map(t => t.col))];

    // Get the main word
    if (rows.length === 1) {
        // Horizontal placement - get full horizontal word
        const row = rows[0];
        const word = getHorizontalWord(row, Math.min(...cols));
        if (word.length > 1) words.push(word);

        // Check for vertical cross-words
        gameState.currentTurnTiles.forEach(tile => {
            const vertWord = getVerticalWord(tile.row, tile.col);
            if (vertWord.length > 1) words.push(vertWord);
        });
    } else if (cols.length === 1) {
        // Vertical placement - get full vertical word
        const col = cols[0];
        const word = getVerticalWord(Math.min(...rows), col);
        if (word.length > 1) words.push(word);

        // Check for horizontal cross-words
        gameState.currentTurnTiles.forEach(tile => {
            const horizWord = getHorizontalWord(tile.row, tile.col);
            if (horizWord.length > 1) words.push(horizWord);
        });
    } else {
        // Single tile or invalid placement - just get any connected words
        gameState.currentTurnTiles.forEach(tile => {
            const horizWord = getHorizontalWord(tile.row, tile.col);
            if (horizWord.length > 1) words.push(horizWord);
            const vertWord = getVerticalWord(tile.row, tile.col);
            if (vertWord.length > 1) words.push(vertWord);
        });
    }

    return words;
}

function getHorizontalWord(row, startCol) {
    const word = [];

    // Find start of word
    let col = startCol;
    while (col > 0 && gameState.boardState[row][col - 1]) {
        col--;
    }

    // Collect all letters in word
    while (col < 15 && gameState.boardState[row][col]) {
        const tile = gameState.boardState[row][col];
        word.push({ ...tile, row, col });
        col++;
    }

    return word;
}

function getVerticalWord(startRow, col) {
    const word = [];

    // Find start of word
    let row = startRow;
    while (row > 0 && gameState.boardState[row - 1][col]) {
        row--;
    }

    // Collect all letters in word
    while (row < 15 && gameState.boardState[row][col]) {
        const tile = gameState.boardState[row][col];
        word.push({ ...tile, row, col });
        row++;
    }

    return word;
}

// Word Validation
function getCurrentWord() {
    if (gameState.currentTurnTiles.length === 0) return '';

    const words = findAllWords();
    if (words.length === 0) return '';

    // Return the main word (longest or first)
    const mainWord = words.reduce((a, b) => a.length > b.length ? a : b);
    return mainWord.map(t => t.letter === '_' ? '?' : t.letter).join('');
}

function validateWord(word) {
    if (!word || word.length < 2) return false;

    // Use dictionary if available
    if (typeof SCRABBLE_DICTIONARY !== 'undefined') {
        return SCRABBLE_DICTIONARY.has(word.toUpperCase());
    }

    // Fallback: accept any word
    return true;
}

function updateWordDisplay() {
    const word = getCurrentWord();
    $('#current-word').text(word || '—');

    const $status = $('#word-status');
    if (word && word.length >= 2) {
        const isValid = validateWord(word);
        $status.text(isValid ? '✓ Valid' : '✗ Invalid')
            .removeClass('valid invalid')
            .addClass(isValid ? 'valid' : 'invalid');
    } else {
        $status.text('').removeClass('valid invalid');
    }
}

// Placement Validation
function validatePlacement() {
    if (gameState.currentTurnTiles.length === 0) {
        return { valid: false, message: 'Place at least one tile!' };
    }

    // Check tiles are in a line
    const rows = [...new Set(gameState.currentTurnTiles.map(t => t.row))];
    const cols = [...new Set(gameState.currentTurnTiles.map(t => t.col))];

    if (rows.length > 1 && cols.length > 1) {
        return { valid: false, message: 'Tiles must be placed in a straight line!' };
    }

    // Check for gaps
    if (rows.length === 1) {
        // Horizontal - check for gaps
        const row = rows[0];
        const sortedCols = cols.sort((a, b) => a - b);
        for (let c = sortedCols[0]; c <= sortedCols[sortedCols.length - 1]; c++) {
            if (!gameState.boardState[row][c]) {
                return { valid: false, message: 'No gaps allowed between tiles!' };
            }
        }
    } else if (cols.length === 1) {
        // Vertical - check for gaps
        const col = cols[0];
        const sortedRows = rows.sort((a, b) => a - b);
        for (let r = sortedRows[0]; r <= sortedRows[sortedRows.length - 1]; r++) {
            if (!gameState.boardState[r][col]) {
                return { valid: false, message: 'No gaps allowed between tiles!' };
            }
        }
    }

    // First word must cover center
    if (gameState.isFirstWord) {
        const coversCenter = gameState.currentTurnTiles.some(t => t.row === 7 && t.col === 7);
        if (!coversCenter) {
            return { valid: false, message: 'First word must cover the center star!' };
        }
    } else {
        // Subsequent words must connect to existing tiles
        let connects = false;
        for (const tile of gameState.currentTurnTiles) {
            const adjacents = [
                [tile.row - 1, tile.col],
                [tile.row + 1, tile.col],
                [tile.row, tile.col - 1],
                [tile.row, tile.col + 1]
            ];

            for (const [r, c] of adjacents) {
                if (r >= 0 && r < 15 && c >= 0 && c < 15) {
                    const adjTile = gameState.boardState[r][c];
                    if (adjTile && !gameState.currentTurnTiles.some(t => t.row === r && t.col === c)) {
                        connects = true;
                        break;
                    }
                }
            }
            if (connects) break;
        }

        if (!connects) {
            return { valid: false, message: 'Word must connect to existing tiles!' };
        }
    }

    // Validate word in dictionary
    const word = getCurrentWord();
    if (word.length < 2) {
        return { valid: false, message: 'Word must be at least 2 letters!' };
    }

    if (!validateWord(word)) {
        return { valid: false, message: `"${word}" is not a valid word!` };
    }

    return { valid: true };
}

// Game Actions
function submitWord() {
    const validation = validatePlacement();

    if (!validation.valid) {
        showMessage(validation.message, 'error');
        return;
    }

    // Calculate and add score
    const score = calculateCurrentScore();
    gameState.totalScore += score;
    $('#total-score').text(gameState.totalScore);

    // Lock tiles (make them non-draggable)
    gameState.currentTurnTiles.forEach(tile => {
        tile.tileElement.draggable('disable');
        tile.tileElement.css('cursor', 'default');
    });

    // Clear current turn
    const word = getCurrentWord();
    gameState.currentTurnTiles = [];
    gameState.isFirstWord = false;

    // Refill rack
    refillRack();

    // Update display
    $('#current-score').text('0');
    updateWordDisplay();

    showMessage(`"${word}" scored ${score} points!`, 'success');

    // Check if game is over
    if (gameState.tilesRemaining === 0 && $('#tile-rack .tile').length === 0) {
        showMessage(`Game Over! Final score: ${gameState.totalScore}`, 'info');
    }
}

function recallTiles() {
    // Return all tiles from current turn to rack
    gameState.currentTurnTiles.forEach(tile => {
        gameState.boardState[tile.row][tile.col] = null;
        $(`.board-square[data-row="${tile.row}"][data-col="${tile.col}"]`).removeClass('occupied');

        tile.tileElement.detach().css({
            position: 'relative',
            top: 0,
            left: 0
        }).appendTo('#tile-rack');
    });

    gameState.currentTurnTiles = [];

    // Update display
    $('#current-score').text('0');
    updateWordDisplay();

    showMessage('Tiles returned to rack', 'info');
}

function restartGame() {
    if (gameState.totalScore > 0 || gameState.currentTurnTiles.length > 0) {
        if (!confirm('Start a new game? Your current progress will be lost.')) {
            return;
        }
    }

    // Clear board
    $('#scrabble-board').empty();
    $('#tile-rack').empty();

    // Re-initialize
    initializeGame();
}

// UI Helpers
function updateDisplay() {
    $('#total-score').text(gameState.totalScore);
    $('#current-score').text('0');
    updateWordDisplay();
}

function showMessage(text, type = 'info') {
    const $message = $('#game-message');
    $message.text(text)
        .removeClass('hidden success error info')
        .addClass(type);

    // Auto-hide after delay
    clearTimeout(window.messageTimeout);
    window.messageTimeout = setTimeout(() => {
        $message.addClass('hidden');
    }, 4000);
}
