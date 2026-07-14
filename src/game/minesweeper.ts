export type Cell = {
  hasBomb: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentBombs: number;
};

export type Position = {
  row: number;
  column: number;
};

export type GameStatus = 'ready' | 'playing' | 'won' | 'lost';

export type GameSettings = {
  rows: number;
  columns: number;
  bombs: number;
};

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export type RevealResult = {
  board: Cell[][];
  status: GameStatus;
};

export const SETTINGS_LIMITS = {
  minRows: 2,
  maxRows: 30,
  minColumns: 2,
  maxColumns: 30,
  minBombs: 1,
  maxCells: 900,
} as const;

const positionKey = ({ row, column }: Position) => `${row}:${column}`;

export function validateGameSettings(settings: GameSettings): ValidationResult {
  const errors: string[] = [];
  const { rows, columns, bombs } = settings;

  if (!Number.isInteger(rows)) {
    errors.push('Rows must be a whole number.');
  } else if (rows < SETTINGS_LIMITS.minRows || rows > SETTINGS_LIMITS.maxRows) {
    errors.push(`Rows must be between ${SETTINGS_LIMITS.minRows} and ${SETTINGS_LIMITS.maxRows}.`);
  }

  if (!Number.isInteger(columns)) {
    errors.push('Columns must be a whole number.');
  } else if (columns < SETTINGS_LIMITS.minColumns || columns > SETTINGS_LIMITS.maxColumns) {
    errors.push(
      `Columns must be between ${SETTINGS_LIMITS.minColumns} and ${SETTINGS_LIMITS.maxColumns}.`,
    );
  }

  if (!Number.isInteger(bombs)) {
    errors.push('Bombs must be a whole number.');
  } else if (bombs < SETTINGS_LIMITS.minBombs) {
    errors.push('Bomb count must be at least 1.');
  }

  if (Number.isInteger(rows) && Number.isInteger(columns)) {
    const cellCount = rows * columns;

    if (cellCount > SETTINGS_LIMITS.maxCells) {
      errors.push(`Board area must not exceed ${SETTINGS_LIMITS.maxCells} cells.`);
    }

    if (Number.isInteger(bombs) && bombs >= cellCount) {
      errors.push('Bomb count must be less than the number of cells.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function createEmptyBoard(rows: number, columns: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => ({
      hasBomb: false,
      isRevealed: false,
      isFlagged: false,
      adjacentBombs: 0,
    })),
  );
}

export function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

export function getNeighbors(position: Position, rows: number, columns: number): Position[] {
  const neighbors: Position[] = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      if (rowOffset === 0 && columnOffset === 0) {
        continue;
      }

      const row = position.row + rowOffset;
      const column = position.column + columnOffset;

      if (row >= 0 && row < rows && column >= 0 && column < columns) {
        neighbors.push({ row, column });
      }
    }
  }

  return neighbors;
}

export function placeBombs(
  board: Cell[][],
  bombCount: number,
  random: () => number = Math.random,
): Cell[][] {
  const rows = board.length;
  const columns = board[0]?.length ?? 0;
  const cellCount = rows * columns;

  if (!Number.isInteger(bombCount) || bombCount <= 0 || bombCount >= cellCount) {
    throw new Error('Bomb count must be a positive whole number below the number of cells.');
  }

  const nextBoard = cloneBoard(board);
  const availablePositions = Array.from({ length: cellCount }, (_, index) => index);

  for (let placed = 0; placed < bombCount; placed += 1) {
    const selectedIndex = Math.floor(random() * availablePositions.length);
    const [flatPosition] = availablePositions.splice(selectedIndex, 1);
    const row = Math.floor(flatPosition / columns);
    const column = flatPosition % columns;

    nextBoard[row][column].hasBomb = true;
  }

  return nextBoard;
}

export function calculateAdjacentBombs(board: Cell[][]): Cell[][] {
  const rows = board.length;
  const columns = board[0]?.length ?? 0;
  const nextBoard = cloneBoard(board);

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      nextBoard[row][column].adjacentBombs = getNeighbors({ row, column }, rows, columns).filter(
        (neighbor) => board[neighbor.row][neighbor.column].hasBomb,
      ).length;
    }
  }

  return nextBoard;
}

export function createBoard(
  settings: GameSettings,
  random: () => number = Math.random,
): Cell[][] {
  const validation = validateGameSettings(settings);

  if (!validation.isValid) {
    throw new Error(validation.errors.join(' '));
  }

  return calculateAdjacentBombs(
    placeBombs(createEmptyBoard(settings.rows, settings.columns), settings.bombs, random),
  );
}

export function revealEmptyRegion(board: Cell[][], start: Position): Cell[][] {
  const rows = board.length;
  const columns = board[0]?.length ?? 0;
  const nextBoard = cloneBoard(board);
  const visited = new Set<string>();
  const stack: Position[] = [start];

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current) {
      continue;
    }

    const key = positionKey(current);

    if (visited.has(key)) {
      continue;
    }

    visited.add(key);

    if (
      current.row < 0 ||
      current.row >= rows ||
      current.column < 0 ||
      current.column >= columns
    ) {
      continue;
    }

    const cell = nextBoard[current.row][current.column];

    if (cell.hasBomb || cell.isFlagged) {
      continue;
    }

    cell.isRevealed = true;

    if (cell.adjacentBombs > 0) {
      continue;
    }

    stack.push(...getNeighbors(current, rows, columns));
  }

  return nextBoard;
}

export function revealCell(board: Cell[][], position: Position): RevealResult {
  const nextBoard = cloneBoard(board);
  const cell = nextBoard[position.row]?.[position.column];

  if (!cell) {
    return { board: nextBoard, status: 'playing' };
  }

  if (cell.hasBomb) {
    cell.isRevealed = true;
    return { board: revealAllBombs(nextBoard), status: 'lost' };
  }

  if (cell.isFlagged) {
    cell.isFlagged = false;
  }

  const revealedBoard = revealEmptyRegion(nextBoard, position);

  return {
    board: revealedBoard,
    status: checkVictory(revealedBoard) ? 'won' : 'playing',
  };
}

export function toggleFlag(board: Cell[][], position: Position): Cell[][] {
  const nextBoard = cloneBoard(board);
  const cell = nextBoard[position.row]?.[position.column];

  if (!cell || cell.isRevealed) {
    return nextBoard;
  }

  cell.isFlagged = !cell.isFlagged;
  return nextBoard;
}

export function chordCell(board: Cell[][], position: Position): RevealResult {
  const rows = board.length;
  const columns = board[0]?.length ?? 0;
  const cell = board[position.row]?.[position.column];

  if (!cell || !cell.isRevealed || cell.adjacentBombs === 0) {
    return { board: cloneBoard(board), status: 'playing' };
  }

  const neighbors = getNeighbors(position, rows, columns);
  const adjacentFlagCount = neighbors.filter(
    (neighbor) => board[neighbor.row][neighbor.column].isFlagged,
  ).length;

  if (adjacentFlagCount !== cell.adjacentBombs) {
    return { board: cloneBoard(board), status: 'playing' };
  }

  let nextBoard = cloneBoard(board);

  for (const neighbor of neighbors) {
    const neighborCell = nextBoard[neighbor.row][neighbor.column];

    if (neighborCell.isFlagged || neighborCell.isRevealed) {
      continue;
    }

    if (neighborCell.hasBomb) {
      neighborCell.isRevealed = true;
      return { board: revealAllBombs(nextBoard), status: 'lost' };
    }

    nextBoard = revealEmptyRegion(nextBoard, neighbor);
  }

  return {
    board: nextBoard,
    status: checkVictory(nextBoard) ? 'won' : 'playing',
  };
}

export function checkVictory(board: Cell[][]): boolean {
  return board.every((row) => row.every((cell) => cell.hasBomb || cell.isRevealed));
}

export function countFlags(board: Cell[][]): number {
  return board.reduce(
    (total, row) => total + row.filter((cell) => cell.isFlagged).length,
    0,
  );
}

export function revealAllBombs(board: Cell[][]): Cell[][] {
  const nextBoard = cloneBoard(board);

  return nextBoard.map((row) =>
    row.map((cell) => ({
      ...cell,
      isRevealed: cell.isRevealed || cell.hasBomb,
    })),
  );
}
