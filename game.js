const table = document.getElementById("randomTable");

const IMG = {
  hunter: "./Hunter.png",
  monster: "./Monster.png",
  obstacle: "./Obstacle.png",
  treasure: "./Treasure.png",
};

const gridSize = 10;
let treasureHunterPosition = null;
let monsters = [];
let obstacles = [];
let treasures = [];

let setupComplete = false;
let gameStage = "setup"; // "setup", "play", "end"
let currentRound = 1;
let playerScore = 0;
let computerScore = 0;

// Initialize the grid
for (let row = 0; row < gridSize; row++) {
  const tr = document.createElement("tr");

  for (let col = 0; col < gridSize; col++) {
    const td = document.createElement("td");
    td.isOccupied = false;
    td.dataset.row = row;
    td.dataset.col = col;

    td.addEventListener("click", function handleClick() {
      if (setupComplete) {
        // Prevent changes after setup
        return;
      }

      if (td.isOccupied) {
        alert("This cell is already occupied!");
        return;
      }

      const input = prompt("Enter a value (1-9 for treasure, h for hunter, m for monster, o for obstacle):");

      if (input === "h") {
        if (treasureHunterPosition !== null) {
          alert("Only one treasure hunter is allowed!");
          return;
        }
        treasureHunterPosition = { row, col };
        td.style.backgroundImage = `url(${IMG.hunter})`;
        td.isOccupied = true;
      } else if (input === "m") {
        monsters.push({ row, col });
        td.style.backgroundImage = `url(${IMG.monster})`;
        td.isOccupied = true;
      } else if (input === "o") {
        obstacles.push({ row, col });
        td.style.backgroundImage = `url(${IMG.obstacle})`;
        td.isOccupied = true;
      } else if (/^[1-9]$/.test(input)) {
        treasures.push({ row, col, value: parseInt(input) });
        td.style.backgroundImage = `url(${IMG.treasure})`;
        td.isOccupied = true;
      } else {
        alert("Invalid input! Please enter a number between 1 and 9, or one of 'h', 'm', 'o'.");
        return;
      }

      td.removeEventListener("click", handleClick); // Lock cell after placement
    });

    tr.appendChild(td);
  }

  table.appendChild(tr);
}

// End Setup Stage button logic
document.getElementById("endSetupButton").addEventListener("click", () => {
  if (treasureHunterPosition === null) {
    alert("Error: You must place the treasure hunter before ending the setup stage!");
    return;
  }
  
  setupComplete = true;
  gameStage = "play";
  document.getElementById("endSetupButton").style.display = "none";
  document.getElementById("playContainer").style.display = "block";
  
  // Initialize game status display
  updateStatusDisplay();
  
  // Set focus to the movement input
  document.getElementById("movementInput").focus();
  
  alert("Setup complete! Starting the game...");
});

// End Play Stage button logic
document.getElementById("endPlayButton").addEventListener("click", () => {
  endGame("Player ended the game");
});

// Function to update the status display
function updateStatusDisplay() {
  document.getElementById("roundDisplay").textContent = currentRound;
  document.getElementById("treasuresDisplay").textContent = treasures.length;
  document.getElementById("playerScoreDisplay").textContent = playerScore;
  document.getElementById("computerScoreDisplay").textContent = computerScore;
}

// Function to get cell by row and column
function getCell(row, col) {
  return document.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
}

// Function to check if a move is valid
function isMoveValid(newRow, newCol) {
  // Check if the move is within bounds
  if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) {
    return false;
  }
  
  // Check for obstacles
  for (const obstacle of obstacles) {
    if (obstacle.row === newRow && obstacle.col === newCol) {
      return false;
    }
  }
  
  return true;
}

// Function to check if a cell is occupied by a monster
function isOccupiedByMonster(row, col) {
  return monsters.some(monster => monster.row === row && monster.col === col);
}

// Function to move the hunter
function moveHunter(newRow, newCol) {
  if (!isMoveValid(newRow, newCol)) {
    alert("Error: Cannot move to that location (out of bounds or obstacle)!");
    return false; // Invalid move, user's turn is over
  }
  
  // Check if the cell is occupied by a monster
  if (isOccupiedByMonster(newRow, newCol)) {
    alert("You moved onto a monster! The treasure hunter has died!");
    
    // Clear the old position
    const oldCell = getCell(treasureHunterPosition.row, treasureHunterPosition.col);
    oldCell.style.backgroundImage = "";
    oldCell.isOccupied = false;
    
    // Update position (hunter is now at the monster's position)
    treasureHunterPosition = { row: newRow, col: newCol };
    
    endGame("Hunter died");
    return true;
  }
  
  // Clear the old position
  const oldCell = getCell(treasureHunterPosition.row, treasureHunterPosition.col);
  oldCell.style.backgroundImage = "";
  oldCell.isOccupied = false;
  
  // Update position
  treasureHunterPosition = { row: newRow, col: newCol };
  const newCell = getCell(newRow, newCol);
  
  // Check for treasure
  const treasureIndex = treasures.findIndex(t => t.row === newRow && t.col === newCol);
  if (treasureIndex !== -1) {
    // Found treasure
    const treasure = treasures[treasureIndex];
    playerScore += treasure.value;
    treasures.splice(treasureIndex, 1);
    alert(`You found a treasure worth ${treasure.value} points!`);
    updateStatusDisplay();
  }
  
  // Display hunter in new position
  newCell.style.backgroundImage = `url(${IMG.hunter})`;
  newCell.isOccupied = true;
  
  return true; // Move was successful
}

// Function to get all possible surrounding cells (including diagonals)
function getSurroundingCells(row, col) {
  const surroundingCells = [];
  
  for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
    for (let colOffset = -1; colOffset <= 1; colOffset++) {
      // Skip the center cell (current position)
      if (rowOffset === 0 && colOffset === 0) continue;
      
      const newRow = row + rowOffset;
      const newCol = col + colOffset;
      
      // Check if the cell is valid (within grid and not an obstacle)
      if (isMoveValid(newRow, newCol)) {
        surroundingCells.push({ row: newRow, col: newCol });
      }
    }
  }
  
  return surroundingCells;
}

// Function to move a monster
function moveMonster(monsterIndex) {
  const monster = monsters[monsterIndex];
  const surroundingCells = getSurroundingCells(monster.row, monster.col);
  
  // Check for hunter in surrounding cells (priority 1)
  const hunterCell = surroundingCells.find(cell => 
    cell.row === treasureHunterPosition.row && cell.col === treasureHunterPosition.col
  );
  
  if (hunterCell) {
    // Monster found hunter - move to hunter's position and kill hunter
    const oldCell = getCell(monster.row, monster.col);
    oldCell.style.backgroundImage = "";
    oldCell.isOccupied = false;
    
    // Update monster position
    monster.row = hunterCell.row;
    monster.col = hunterCell.col;
    
    // Display monster in new position
    const newCell = getCell(monster.row, monster.col);
    newCell.style.backgroundImage = `url(${IMG.monster})`;
    newCell.isOccupied = true;
    
    alert("A monster caught the treasure hunter! The treasure hunter has died!");
    endGame("Hunter died");
    return true; // Monster moved and killed hunter
  }
  
  // Check for treasures in surrounding cells (priority 2)
  const treasureCells = surroundingCells.filter(cell => 
    treasures.some(treasure => treasure.row === cell.row && treasure.col === cell.col)
  );
  
  if (treasureCells.length > 0) {
    // Monster found treasure - move to treasure position and collect it
    const targetCell = treasureCells[0]; // Take the first treasure if multiple are available
    const treasureIndex = treasures.findIndex(t => 
      t.row === targetCell.row && t.col === targetCell.col
    );
    
    // Collect treasure
    const treasure = treasures[treasureIndex];
    computerScore += treasure.value;
    treasures.splice(treasureIndex, 1);
    
    // Clear the old position
    const oldCell = getCell(monster.row, monster.col);
    oldCell.style.backgroundImage = "";
    oldCell.isOccupied = false;
    
    // Update monster position
    monster.row = targetCell.row;
    monster.col = targetCell.col;
    
    // Display monster in new position
    const newCell = getCell(monster.row, monster.col);
    newCell.style.backgroundImage = `url(${IMG.monster})`;
    newCell.isOccupied = true;
    
    alert(`A monster found a treasure worth ${treasure.value} points!`);
    updateStatusDisplay();
    return true; // Monster moved and collected treasure
  }
  
  // Filter out cells occupied by other monsters
  const emptyCells = surroundingCells.filter(cell => 
    !isOccupiedByMonster(cell.row, cell.col)
  );
  
  if (emptyCells.length > 0) {
    // Monster can move to an empty cell
    const targetCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]; // Random empty cell
    
    // Clear the old position
    const oldCell = getCell(monster.row, monster.col);
    oldCell.style.backgroundImage = "";
    oldCell.isOccupied = false;
    
    // Update monster position
    monster.row = targetCell.row;
    monster.col = targetCell.col;
    
    // Display monster in new position
    const newCell = getCell(monster.row, monster.col);
    newCell.style.backgroundImage = `url(${IMG.monster})`;
    newCell.isOccupied = true;
    
    return true; // Monster moved
  }
  
  return false; // Monster couldn't move
}

// Function to check if any movement is possible
function isMovementPossible() {
  // Check if hunter can move
  const hunterSurroundingCells = [
    { row: treasureHunterPosition.row - 1, col: treasureHunterPosition.col }, // Up
    { row: treasureHunterPosition.row + 1, col: treasureHunterPosition.col }, // Down
    { row: treasureHunterPosition.row, col: treasureHunterPosition.col - 1 }, // Left
    { row: treasureHunterPosition.row, col: treasureHunterPosition.col + 1 }  // Right
  ];
  
  const hunterCanMove = hunterSurroundingCells.some(cell => isMoveValid(cell.row, cell.col) && !isOccupiedByMonster(cell.row, cell.col));
  
  // Check if any monster can move
  let monstersCanMove = false;
  for (const monster of monsters) {
    const surroundingCells = getSurroundingCells(monster.row, monster.col);
    
    // Check if the monster can move to a valid cell not occupied by another monster
    const monsterCanMove = surroundingCells.some(cell => 
      !isOccupiedByMonster(cell.row, cell.col) || 
      (cell.row === treasureHunterPosition.row && cell.col === treasureHunterPosition.col)
    );
    
    if (monsterCanMove) {
      monstersCanMove = true;
      break;
    }
  }
  
  return hunterCanMove || monstersCanMove;
}

// Function to handle computer's turn
function computerTurn() {
  if (gameStage !== "play") return;
  
  let monsterMoved = false;
  
  // Try to move each monster
  for (let i = 0; i < monsters.length; i++) {
    const moved = moveMonster(i);
    
    if (moved) {
      monsterMoved = true;
    }
    
    // If the game has ended (hunter killed), stop processing
    if (gameStage === "end") {
      return;
    }
  }
  
  // Check for game end conditions
  if (treasures.length === 0) {
    endGame("No treasures left");
    return;
  }
  
  if (!isMovementPossible()) {
    endGame("No movement possible");
    return;
  }
  
  // Increment round and update display
  currentRound++;
  updateStatusDisplay();
  
  // Reset input field and give focus
  document.getElementById("movementInput").value = "";
  document.getElementById("movementInput").focus();
  
  alert("Computer's turn is over. Your turn.");
}

// Function to handle user's movement input
function handleMovementInput() {
  if (gameStage !== "play") return;
  
  const input = document.getElementById("movementInput").value.toLowerCase();
  let moveSuccessful = false;
  
  switch (input) {
    case "a": // Left
      moveSuccessful = moveHunter(treasureHunterPosition.row, treasureHunterPosition.col - 1);
      break;
    case "d": // Right
      moveSuccessful = moveHunter(treasureHunterPosition.row, treasureHunterPosition.col + 1);
      break;
    case "w": // Up
      moveSuccessful = moveHunter(treasureHunterPosition.row - 1, treasureHunterPosition.col);
      break;
    case "s": // Down
      moveSuccessful = moveHunter(treasureHunterPosition.row + 1, treasureHunterPosition.col);
      break;
    default:
      alert("Invalid input! Please use 'w' (up), 'a' (left), 's' (down), or 'd' (right) to move.");
      document.getElementById("movementInput").value = "";
      document.getElementById("movementInput").focus();
      return;
  }
  
  // Reset input field
  document.getElementById("movementInput").value = "";
  
  // Check if game should end
  if (treasures.length === 0) {
    endGame("No treasures left");
    return;
  }
  
  if (!isMovementPossible()) {
    endGame("No movement possible");
    return;
  }
  
  // If the move was successful and the game is still in the play stage, proceed to computer's turn
  if (moveSuccessful && gameStage === "play") {
    setTimeout(computerTurn, 500); // Short delay before computer's turn
  }
}

// Setup event listener for the movement input
document.getElementById("movementInput").addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    handleMovementInput();
  }
});

document.getElementById("moveButton").addEventListener("click", handleMovementInput);

// Function to determine the game outcome
function determineOutcome() {
  if (gameStage !== "end") return null;
  
  // Check for hunter killed
  if (treasureHunterPosition === null || 
      monsters.some(m => m.row === treasureHunterPosition.row && m.col === treasureHunterPosition.col)) {
    return "computer"; // Computer wins if hunter is killed
  }
  
  // Check scores
  if (playerScore > computerScore) {
    return "player"; // Player wins if hunter is alive and has higher score
  } else if (computerScore > playerScore) {
    return "computer"; // Computer wins if it has higher score
  } else {
    return "draw"; // It's a draw if scores are equal
  }
}

// Function to end the game
function endGame(reason) {
  gameStage = "end";
  
  // Disable further gameplay
  document.getElementById("playContainer").style.display = "none";
  document.getElementById("gameOverContainer").style.display = "block";
  document.getElementById("finalScores").textContent = `Player: ${playerScore} | Computer: ${computerScore}`;
  
  const outcome = determineOutcome();
  let resultMessage = "";
  
  if (reason === "Hunter died") {
    resultMessage = "Game Over! The hunter died.";
  } else if (reason === "No treasures left") {
    resultMessage = "Game Over! All treasures have been collected.";
  } else if (reason === "No movement possible") {
    resultMessage = "Game Over! No movement is possible.";
  } else {
    resultMessage = "Game ended.";
  }
  
  // Add outcome message
  if (outcome === "player") {
    resultMessage += " You win!";
  } else if (outcome === "computer") {
    resultMessage += " Computer wins!";
  } else {
    resultMessage += " It's a draw!";
  }
  
  document.getElementById("gameResult").textContent = resultMessage;
}