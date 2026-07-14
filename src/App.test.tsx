import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import type { GameSettings } from './game/minesweeper';

vi.mock('./game/minesweeper', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./game/minesweeper')>();

  return {
    ...actual,
    createBoard: (settings: GameSettings) => {
      const board = actual.createEmptyBoard(settings.rows, settings.columns);
      board[0][0] = {
        ...board[0][0],
        hasBomb: true,
      };

      for (let row = 0; row < settings.rows; row += 1) {
        for (let column = 0; column < settings.columns; column += 1) {
          if (row !== 0 || column !== 0) {
            board[row][column].hasBomb = false;
          }
        }
      }

      return actual.calculateAdjacentBombs(board);
    },
  };
});

describe('App', () => {
  it('renders the initial game', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Minesweeper' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Game in progress.');
    expect(
      screen.getByRole('button', { name: /^Hidden cell at row 1, column 1$/i }),
    ).toBeInTheDocument();
  });

  it('starts a new game and resets flags', () => {
    render(<App />);

    fireEvent.contextMenu(screen.getByRole('button', { name: /row 1, column 2/i }));
    expect(screen.getByLabelText('Flags used: 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'New Game' }));

    expect(screen.getByLabelText('Flags used: 0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hidden cell at row 1, column 2/i })).toBeInTheDocument();
  });

  it('changes valid configuration', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.clear(screen.getByLabelText('Rows'));
    await user.type(screen.getByLabelText('Rows'), '4');
    await user.clear(screen.getByLabelText('Columns'));
    await user.type(screen.getByLabelText('Columns'), '5');
    await user.clear(screen.getByLabelText('Bombs'));
    await user.type(screen.getByLabelText('Bombs'), '3');
    await user.click(screen.getByRole('button', { name: 'New Game' }));

    expect(screen.getByRole('button', { name: /Hidden cell at row 4, column 5/i })).toBeInTheDocument();
  });

  it('rejects invalid configuration', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.clear(screen.getByLabelText('Rows'));
    await user.type(screen.getByLabelText('Rows'), '2');
    await user.clear(screen.getByLabelText('Columns'));
    await user.type(screen.getByLabelText('Columns'), '2');
    await user.clear(screen.getByLabelText('Bombs'));
    await user.type(screen.getByLabelText('Bombs'), '4');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Bomb count must be less than the number of cells.',
    );
  });

  it('flags a cell with right click', () => {
    render(<App />);

    fireEvent.contextMenu(screen.getByRole('button', { name: /Hidden cell at row 1, column 2/i }));

    expect(screen.getByRole('button', { name: /Flagged cell at row 1, column 2/i })).toHaveTextContent(
      'F',
    );
  });

  it('displays a win state', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.clear(screen.getByLabelText('Rows'));
    await user.type(screen.getByLabelText('Rows'), '2');
    await user.clear(screen.getByLabelText('Columns'));
    await user.type(screen.getByLabelText('Columns'), '2');
    await user.clear(screen.getByLabelText('Bombs'));
    await user.type(screen.getByLabelText('Bombs'), '1');
    await user.click(screen.getByRole('button', { name: 'New Game' }));
    await user.click(screen.getByRole('button', { name: /Hidden cell at row 1, column 2/i }));
    await user.click(screen.getByRole('button', { name: /Hidden cell at row 2, column 1/i }));
    await user.click(screen.getByRole('button', { name: /Hidden cell at row 2, column 2/i }));

    expect(screen.getByRole('status')).toHaveTextContent('Victory');
  });

  it('displays a loss state', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /^Hidden cell at row 1, column 1$/i }));

    expect(screen.getByRole('status')).toHaveTextContent('Defeat');
    expect(screen.getByRole('button', { name: /Bomb at row 1, column 1/i })).toHaveTextContent('*');
  });
});
