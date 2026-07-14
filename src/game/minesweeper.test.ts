import {
  Cell,
  calculateAdjacentBombs,
  checkVictory,
  chordCell,
  countFlags,
  createBoard,
  createEmptyBoard,
  getNeighbors,
  placeBombs,
  revealCell,
  revealEmptyRegion,
  toggleFlag,
  validateGameSettings,
} from './minesweeper';

function boardWithBombs(rows: number, columns: number, bombs: Array<[number, number]>): Cell[][] {
  const board = createEmptyBoard(rows, columns);

  for (const [row, column] of bombs) {
    board[row][column] = {
      ...board[row][column],
      hasBomb: true,
    };
  }

  return calculateAdjacentBombs(board);
}

function revealed(board: Cell[][]): string[] {
  const positions: string[] = [];

  board.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (cell.isRevealed) {
        positions.push(`${rowIndex}:${columnIndex}`);
      }
    });
  });

  return positions.sort();
}

describe('board generation', () => {
  it('creates the requested dimensions', () => {
    const board = createBoard({ rows: 4, columns: 6, bombs: 3 }, () => 0);

    expect(board).toHaveLength(4);
    expect(board[0]).toHaveLength(6);
  });

  it('creates exactly the requested number of bombs without duplicates', () => {
    const board = placeBombs(createEmptyBoard(3, 3), 4, () => 0);
    const bombPositions = board.flatMap((row, rowIndex) =>
      row.flatMap((cell, columnIndex) => (cell.hasBomb ? [`${rowIndex}:${columnIndex}`] : [])),
    );

    expect(bombPositions).toHaveLength(4);
    expect(new Set(bombPositions).size).toBe(4);
  });

  it('calculates adjacent bomb counts for corners, edges, and center cells', () => {
    const board = boardWithBombs(3, 3, [
      [0, 0],
      [2, 2],
    ]);

    expect(board[0][1].adjacentBombs).toBe(1);
    expect(board[1][0].adjacentBombs).toBe(1);
    expect(board[1][1].adjacentBombs).toBe(2);
    expect(board[2][1].adjacentBombs).toBe(1);
  });

  it('returns valid neighbors for corners, edges, and center cells', () => {
    expect(getNeighbors({ row: 0, column: 0 }, 3, 3)).toHaveLength(3);
    expect(getNeighbors({ row: 0, column: 1 }, 3, 3)).toHaveLength(5);
    expect(getNeighbors({ row: 1, column: 1 }, 3, 3)).toHaveLength(8);
  });

  it('rejects invalid settings', () => {
    expect(validateGameSettings({ rows: 0, columns: 10, bombs: 1 }).isValid).toBe(false);
    expect(validateGameSettings({ rows: 10.5, columns: 10, bombs: 1 }).isValid).toBe(false);
    expect(validateGameSettings({ rows: 10, columns: Number.NaN, bombs: 1 }).isValid).toBe(false);
    expect(validateGameSettings({ rows: 10, columns: 10, bombs: 0 }).isValid).toBe(false);
    expect(validateGameSettings({ rows: 2, columns: 2, bombs: 4 }).isValid).toBe(false);
    expect(validateGameSettings({ rows: 31, columns: 31, bombs: 1 }).isValid).toBe(false);
  });
});

describe('reveal behavior', () => {
  it('reveals a numbered cell', () => {
    const board = boardWithBombs(3, 3, [[0, 0]]);
    const result = revealCell(board, { row: 0, column: 1 });

    expect(result.board[0][1]).toMatchObject({ isRevealed: true, adjacentBombs: 1 });
  });

  it('reveals a connected empty region and numbered boundary cells', () => {
    const board = boardWithBombs(4, 4, [[3, 3]]);
    const result = revealEmptyRegion(board, { row: 0, column: 0 });

    expect(result[0][0].isRevealed).toBe(true);
    expect(result[2][2]).toMatchObject({ isRevealed: true, adjacentBombs: 1 });
    expect(result[3][3].isRevealed).toBe(false);
  });

  it('does not reveal flagged cells', () => {
    const board = toggleFlag(boardWithBombs(3, 3, [[2, 2]]), { row: 0, column: 0 });
    const result = revealEmptyRegion(board, { row: 0, column: 0 });

    expect(result[0][0].isRevealed).toBe(false);
    expect(result[0][0].isFlagged).toBe(true);
  });

  it('does not reveal unrelated regions', () => {
    const board = boardWithBombs(3, 5, [
      [0, 2],
      [1, 2],
      [2, 2],
    ]);
    const result = revealEmptyRegion(board, { row: 0, column: 0 });

    expect(result[0][0].isRevealed).toBe(true);
    expect(result[0][4].isRevealed).toBe(false);
  });

  it('reveals a bomb and returns a lost state', () => {
    const board = boardWithBombs(3, 3, [[1, 1]]);
    const result = revealCell(board, { row: 1, column: 1 });

    expect(result.status).toBe('lost');
    expect(result.board[1][1].isRevealed).toBe(true);
  });

  it('does not mutate the original board', () => {
    const board = boardWithBombs(3, 3, [[2, 2]]);
    const result = revealCell(board, { row: 0, column: 0 });

    expect(result.board).not.toBe(board);
    expect(board[0][0].isRevealed).toBe(false);
  });
});

describe('flags', () => {
  it('adds and removes a flag', () => {
    const board = boardWithBombs(3, 3, [[2, 2]]);
    const flagged = toggleFlag(board, { row: 1, column: 1 });
    const unflagged = toggleFlag(flagged, { row: 1, column: 1 });

    expect(flagged[1][1].isFlagged).toBe(true);
    expect(unflagged[1][1].isFlagged).toBe(false);
  });

  it('does not reveal a flagged safe cell until left-click removes the flag', () => {
    const board = toggleFlag(boardWithBombs(3, 3, [[2, 2]]), { row: 0, column: 0 });
    const result = revealCell(board, { row: 0, column: 0 });

    expect(result.board[0][0]).toMatchObject({ isFlagged: false, isRevealed: true });
  });

  it('tracks the number of flags', () => {
    let board = boardWithBombs(3, 3, [[2, 2]]);

    board = toggleFlag(board, { row: 0, column: 0 });
    board = toggleFlag(board, { row: 1, column: 1 });

    expect(countFlags(board)).toBe(2);
  });
});

describe('chord behavior', () => {
  it('reveals neighboring cells when the adjacent flag count matches', () => {
    let board = boardWithBombs(3, 3, [[0, 0]]);

    board = revealCell(board, { row: 1, column: 1 }).board;
    board = toggleFlag(board, { row: 0, column: 0 });

    const result = chordCell(board, { row: 1, column: 1 });

    expect(result.board[0][1].isRevealed).toBe(true);
    expect(result.status).toBe('won');
  });

  it('does nothing when the adjacent flag count does not match', () => {
    let board = boardWithBombs(3, 3, [[0, 0]]);

    board = revealCell(board, { row: 1, column: 1 }).board;

    const result = chordCell(board, { row: 1, column: 1 });

    expect(revealed(result.board)).toEqual(['1:1']);
  });

  it('can cause a loss when flags are incorrectly placed', () => {
    let board = boardWithBombs(3, 3, [[0, 0]]);

    board = revealCell(board, { row: 1, column: 1 }).board;
    board = toggleFlag(board, { row: 0, column: 1 });

    const result = chordCell(board, { row: 1, column: 1 });

    expect(result.status).toBe('lost');
    expect(result.board[0][0].isRevealed).toBe(true);
  });
});

describe('victory', () => {
  it('returns victory when every non-bomb cell is revealed', () => {
    const board = boardWithBombs(2, 2, [[0, 0]]).map((row) =>
      row.map((cell) => ({
        ...cell,
        isRevealed: !cell.hasBomb,
      })),
    );

    expect(checkVictory(board)).toBe(true);
  });

  it('does not require every bomb to be flagged', () => {
    const board = boardWithBombs(2, 2, [[0, 0]]).map((row) =>
      row.map((cell) => ({
        ...cell,
        isRevealed: !cell.hasBomb,
        isFlagged: false,
      })),
    );

    expect(checkVictory(board)).toBe(true);
  });

  it('does not report victory prematurely', () => {
    const board = boardWithBombs(2, 2, [[0, 0]]);

    expect(checkVictory(board)).toBe(false);
  });
});
