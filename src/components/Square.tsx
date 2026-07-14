import './Square.css';
import { KeyboardEvent, MouseEvent } from 'react';
import { Cell, Position } from '../game/minesweeper';

type Props = {
  cell: Cell;
  position: Position;
  isGameOver: boolean;
  onReveal: () => void;
  onToggleFlag: () => void;
  onChord: () => void;
};

function getCellLabel(cell: Cell, position: Position): string {
  const coordinate = `row ${position.row + 1}, column ${position.column + 1}`;

  if (cell.isFlagged) {
    return `Flagged cell at ${coordinate}`;
  }

  if (!cell.isRevealed) {
    return `Hidden cell at ${coordinate}`;
  }

  if (cell.hasBomb) {
    return `Bomb at ${coordinate}`;
  }

  if (cell.adjacentBombs === 0) {
    return `Empty revealed cell at ${coordinate}`;
  }

  return `Revealed cell at ${coordinate} with ${cell.adjacentBombs} adjacent bombs`;
}

function Square({ cell, position, isGameOver, onReveal, onToggleFlag, onChord }: Props) {
  const displayValue = cell.isFlagged
    ? 'F'
    : cell.isRevealed && cell.hasBomb
      ? '*'
      : cell.isRevealed && cell.adjacentBombs > 0
        ? String(cell.adjacentBombs)
        : '';

  function handleContextMenu(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    if (!isGameOver) {
      onToggleFlag();
    }
  }

  function handleAuxClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    if (isGameOver) {
      return;
    }

    if (event.button === 1) {
      onChord();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (isGameOver) {
      return;
    }

    if (event.key.toLowerCase() === 'f') {
      event.preventDefault();
      onToggleFlag();
    }

    if (event.key.toLowerCase() === 'c') {
      event.preventDefault();
      onChord();
    }
  }

  return (
    <button
      type="button"
      className="square"
      data-revealed={cell.isRevealed}
      data-flagged={cell.isFlagged}
      data-bomb={cell.isRevealed && cell.hasBomb}
      data-count={cell.isRevealed ? cell.adjacentBombs : undefined}
      aria-label={getCellLabel(cell, position)}
      aria-pressed={cell.isFlagged}
      disabled={isGameOver}
      onClick={onReveal}
      onContextMenu={handleContextMenu}
      onAuxClick={handleAuxClick}
      onKeyDown={handleKeyDown}
    >
      {displayValue}
    </button>
  );
}

export default Square;
