import './App.css';
import {
  Cell,
  GameSettings,
  GameStatus,
  Position,
  chordCell,
  countFlags,
  createBoard,
  revealCell,
  toggleFlag,
  validateGameSettings,
} from './game/minesweeper';
import Square from './components/Square';
import SquareRow from './components/SquareRow';
import { useReducer, useState } from 'react';

type GameState = {
  board: Cell[][];
  settings: GameSettings;
  status: GameStatus;
};

type GameAction =
  | { type: 'reveal'; position: Position }
  | { type: 'toggleFlag'; position: Position }
  | { type: 'chord'; position: Position }
  | { type: 'newGame'; settings: GameSettings };

const DEFAULT_SETTINGS: GameSettings = {
  rows: 10,
  columns: 10,
  bombs: 13,
};

function createInitialState(settings: GameSettings = DEFAULT_SETTINGS): GameState {
  return {
    board: createBoard(settings),
    settings,
    status: 'playing',
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.status === 'won' || state.status === 'lost') {
    if (action.type !== 'newGame') {
      return state;
    }
  }

  switch (action.type) {
    case 'reveal': {
      const result = revealCell(state.board, action.position);
      return {
        ...state,
        board: result.board,
        status: result.status,
      };
    }
    case 'toggleFlag':
      return {
        ...state,
        board: toggleFlag(state.board, action.position),
      };
    case 'chord': {
      const result = chordCell(state.board, action.position);
      return {
        ...state,
        board: result.board,
        status: result.status,
      };
    }
    case 'newGame':
      return createInitialState(action.settings);
  }
}

function parseInputValue(value: string): number {
  if (value.trim() === '') {
    return Number.NaN;
  }

  return Number(value);
}

function App() {
  const [gameState, dispatch] = useReducer(gameReducer, undefined, () => createInitialState());
  const [draftSettings, setDraftSettings] = useState({
    rows: String(DEFAULT_SETTINGS.rows),
    columns: String(DEFAULT_SETTINGS.columns),
    bombs: String(DEFAULT_SETTINGS.bombs),
  });

  const parsedSettings: GameSettings = {
    rows: parseInputValue(draftSettings.rows),
    columns: parseInputValue(draftSettings.columns),
    bombs: parseInputValue(draftSettings.bombs),
  };
  const validation = validateGameSettings(parsedSettings);
  const flagsUsed = countFlags(gameState.board);
  const flagsRemaining = gameState.settings.bombs - flagsUsed;
  const statusText =
    gameState.status === 'won'
      ? 'Victory. Every safe cell has been revealed.'
      : gameState.status === 'lost'
        ? 'Defeat. A bomb was revealed.'
        : 'Game in progress.';

  function updateDraftSetting(field: keyof GameSettings, value: string) {
    setDraftSettings((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startNewGame() {
    if (!validation.isValid) {
      return;
    }

    dispatch({ type: 'newGame', settings: parsedSettings });
  }

  return (
    <main className={`app game-${gameState.status}`}>
      <section className="game-shell" aria-labelledby="game-title">
        <header className="game-header">
          <div>
            <h1 id="game-title">Minesweeper</h1>
            <p className="game-status" role="status" aria-live="polite">
              {statusText}
            </p>
          </div>
          <div className="scoreboard" aria-label="Game counters">
            <span aria-label={`Bombs: ${gameState.settings.bombs}`}>
              Bombs <strong>{gameState.settings.bombs}</strong>
            </span>
            <span aria-label={`Flags used: ${flagsUsed}`}>
              Flags <strong>{flagsUsed}</strong>
            </span>
            <span aria-label={`Flags remaining: ${flagsRemaining}`}>
              Left <strong>{flagsRemaining}</strong>
            </span>
          </div>
        </header>

        <form className="controls" onSubmit={(event) => event.preventDefault()}>
          <label>
            Rows
            <input
              type="number"
              min="2"
              max="30"
              step="1"
              value={draftSettings.rows}
              onChange={(event) => updateDraftSetting('rows', event.target.value)}
            />
          </label>
          <label>
            Columns
            <input
              type="number"
              min="2"
              max="30"
              step="1"
              value={draftSettings.columns}
              onChange={(event) => updateDraftSetting('columns', event.target.value)}
            />
          </label>
          <label>
            Bombs
            <input
              type="number"
              min="1"
              step="1"
              value={draftSettings.bombs}
              onChange={(event) => updateDraftSetting('bombs', event.target.value)}
            />
          </label>
          <button type="button" className="new-game-button" onClick={startNewGame}>
            New Game
          </button>
        </form>

        {!validation.isValid && (
          <p className="validation-message" role="alert">
            {validation.errors[0]}
          </p>
        )}

        <div
          className="board"
          role="grid"
          aria-label="Minesweeper board"
        >
          {gameState.board.map((row, rowIndex) => (
            <SquareRow key={rowIndex}>
              {row.map((cell, columnIndex) => {
                const position = { row: rowIndex, column: columnIndex };

                return (
                  <Square
                    key={`${rowIndex}-${columnIndex}`}
                    cell={cell}
                    position={position}
                    isGameOver={gameState.status === 'won' || gameState.status === 'lost'}
                    onReveal={() => dispatch({ type: 'reveal', position })}
                    onToggleFlag={() => dispatch({ type: 'toggleFlag', position })}
                    onChord={() => dispatch({ type: 'chord', position })}
                  />
                );
              })}
            </SquareRow>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
