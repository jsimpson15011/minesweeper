# Minesweeper

A compact Minesweeper game built with React, TypeScript, and Vite.

## Features

- Configurable row, column, and bomb counts
- Left-click reveal and right-click flagging
- Middle-click chording on revealed numbered cells
- Flood reveal for connected empty cells
- Win and loss states with visible bombs after defeat
- Keyboard support for cells: `F` toggles a flag and `C` chords a revealed number
- Validation for unsafe board settings

## Technical Overview

The React layer owns UI state and dispatches game actions through a reducer. Core Minesweeper rules live in pure TypeScript functions in `src/game/minesweeper.ts`, which makes board generation, reveal behavior, flagging, chording, and victory checks independently testable.

The board is represented consistently as:

```ts
Cell[][]
```

Coordinates use `board[row][column]`, with positions represented as:

```ts
type Position = {
  row: number;
  column: number;
};
```

Each cell stores all relevant state in one object:

```ts
type Cell = {
  hasBomb: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentBombs: number;
};
```

## Flood Fill

Empty-region reveal uses an iterative stack rather than recursion. It reveals connected zero-adjacent cells, reveals numbered boundary cells, skips flagged cells, skips bombs, and tracks visited positions to avoid repeated work.

## Setup

```bash
npm install
npm run dev
```

## Tests

```bash
npm test
```

The test suite covers pure game logic and a smaller set of React integration behavior using React Testing Library.

## Build

```bash
npm run build
```
