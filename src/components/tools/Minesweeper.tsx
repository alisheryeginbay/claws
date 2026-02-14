'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// --- Types ---

type CellState = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

type Difficulty = 'beginner' | 'intermediate' | 'expert';

type DifficultyConfig = { rows: number; cols: number; mines: number };

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

const NUMBER_COLORS: Record<number, string> = {
  1: '#0000FF',
  2: '#008000',
  3: '#FF0000',
  4: '#000080',
  5: '#800000',
  6: '#008080',
  7: '#000000',
  8: '#808080',
};

// --- Helpers ---

function createEmptyBoard(rows: number, cols: number): CellState[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );
}

function placeMines(board: CellState[][], mines: number, safeRow: number, safeCol: number): CellState[][] {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  let placed = 0;

  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (newBoard[r][c].isMine) continue;
    if (Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1) continue;
    newBoard[r][c].isMine = true;
    placed++;
  }

  // Count adjacent mines
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (newBoard[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
            count++;
          }
        }
      }
      newBoard[r][c].adjacentMines = count;
    }
  }

  return newBoard;
}

function floodReveal(board: CellState[][], row: number, col: number): CellState[][] {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map((r) => r.map((c) => ({ ...c })));
  const stack: [number, number][] = [[row, col]];

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
    if (newBoard[r][c].isRevealed || newBoard[r][c].isFlagged) continue;

    newBoard[r][c].isRevealed = true;

    if (newBoard[r][c].adjacentMines === 0 && !newBoard[r][c].isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          stack.push([r + dr, c + dc]);
        }
      }
    }
  }

  return newBoard;
}

function checkWin(board: CellState[][]): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.isMine && !cell.isRevealed) return false;
    }
  }
  return true;
}

// --- Component ---

export function Minesweeper() {
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [board, setBoard] = useState<CellState[][]>(() => {
    const { rows, cols } = DIFFICULTIES.beginner;
    return createEmptyBoard(rows, cols);
  });
  const [status, setStatus] = useState<GameStatus>('idle');
  const [timer, setTimer] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pressing, setPressing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const config = DIFFICULTIES[difficulty];

  const flagCount = board.flat().filter((c) => c.isFlagged).length;
  const minesRemaining = config.mines - flagCount;

  const resetGame = useCallback((diff?: Difficulty) => {
    const d = diff ?? difficulty;
    const { rows, cols } = DIFFICULTIES[d];
    setBoard(createEmptyBoard(rows, cols));
    setStatus('idle');
    setTimer(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (diff) setDifficulty(d);
  }, [difficulty]);

  // Timer
  useEffect(() => {
    if (status === 'playing') {
      timerRef.current = setInterval(() => {
        setTimer((t) => Math.min(t + 1, 999));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleCellClick = (row: number, col: number) => {
    if (status === 'won' || status === 'lost') return;
    const cell = board[row][col];
    if (cell.isFlagged || cell.isRevealed) return;

    let currentBoard = board;

    // First click — place mines
    if (status === 'idle') {
      currentBoard = placeMines(board, config.mines, row, col);
      setStatus('playing');
    }

    if (currentBoard[row][col].isMine) {
      // Reveal all mines
      const lostBoard = currentBoard.map((r) =>
        r.map((c) => ({
          ...c,
          isRevealed: c.isMine ? true : c.isRevealed,
        }))
      );
      // Mark the clicked mine
      lostBoard[row][col] = { ...lostBoard[row][col], isRevealed: true };
      setBoard(lostBoard);
      setStatus('lost');
      return;
    }

    const newBoard = floodReveal(currentBoard, row, col);
    setBoard(newBoard);

    if (checkWin(newBoard)) {
      // Auto-flag remaining mines on win
      const wonBoard = newBoard.map((r) =>
        r.map((c) => (c.isMine ? { ...c, isFlagged: true } : c))
      );
      setBoard(wonBoard);
      setStatus('won');
    }
  };

  const handleCellRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (status === 'won' || status === 'lost' || status === 'idle') return;
    const cell = board[row][col];
    if (cell.isRevealed) return;

    const newBoard = board.map((r) => r.map((c) => ({ ...c })));
    newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
    setBoard(newBoard);
  };

  const smiley = status === 'won' ? '😎' : status === 'lost' ? '💀' : pressing ? '😮' : '🙂';

  const formatLCD = (n: number) => {
    const clamped = Math.max(-99, Math.min(999, n));
    const str = Math.abs(clamped).toString().padStart(3, '0');
    return clamped < 0 ? '-' + str.slice(1) : str;
  };

  return (
    <div
      className="flex-1 flex flex-col select-none"
      style={{ backgroundColor: '#C0C0C0', fontFamily: 'Tahoma, sans-serif' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Menu bar */}
      <div className="flex text-[11px]" style={{ borderBottom: '1px solid #808080' }}>
        <div className="relative" ref={menuRef}>
          <button
            className="px-2 py-0.5 hover:bg-[#316AC5] hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            Game
          </button>
          {menuOpen && (
            <div
              className="absolute top-full left-0 bg-[#F6F6F6] border border-[#808080] shadow-md z-50 min-w-[160px] py-0.5"
            >
              <button
                className="w-full text-left px-6 py-0.5 hover:bg-[#316AC5] hover:text-white text-[11px]"
                onClick={() => { resetGame(); setMenuOpen(false); }}
              >
                New
              </button>
              <div className="border-t border-[#C0C0C0] my-0.5" />
              {(['beginner', 'intermediate', 'expert'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  className="w-full text-left px-6 py-0.5 hover:bg-[#316AC5] hover:text-white text-[11px] flex items-center"
                  onClick={() => { resetGame(d); setMenuOpen(false); }}
                >
                  <span className="w-4 inline-block">{difficulty === d ? '✓' : ''}</span>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 flex flex-col items-center p-1.5 overflow-auto">
        {/* Top panel: mine counter, smiley, timer */}
        <div
          className="flex items-center justify-between w-full mb-1.5 px-1 py-1"
          style={{
            border: '2px inset #808080',
            backgroundColor: '#C0C0C0',
          }}
        >
          {/* Mine counter */}
          <div
            className="font-bold text-base tracking-wider px-1"
            style={{
              backgroundColor: '#000',
              color: '#FF0000',
              fontFamily: "'Courier New', monospace",
              border: '1px inset #808080',
              minWidth: '39px',
              textAlign: 'center',
              lineHeight: '1.3',
            }}
          >
            {formatLCD(minesRemaining)}
          </div>

          {/* Smiley */}
          <button
            className="text-lg leading-none"
            style={{
              width: '26px',
              height: '26px',
              border: '2px outset #FFF',
              backgroundColor: '#C0C0C0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
            }}
            onClick={() => resetGame()}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLElement).style.border = '2px inset #808080';
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLElement).style.border = '2px outset #FFF';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.border = '2px outset #FFF';
            }}
          >
            {smiley}
          </button>

          {/* Timer */}
          <div
            className="font-bold text-base tracking-wider px-1"
            style={{
              backgroundColor: '#000',
              color: '#FF0000',
              fontFamily: "'Courier New', monospace",
              border: '1px inset #808080',
              minWidth: '39px',
              textAlign: 'center',
              lineHeight: '1.3',
            }}
          >
            {formatLCD(timer)}
          </div>
        </div>

        {/* Grid */}
        <div
          style={{
            border: '3px inset #808080',
            display: 'inline-block',
            lineHeight: 0,
          }}
        >
          {board.map((row, r) => (
            <div key={r} style={{ display: 'flex' }}>
              {row.map((cell, c) => (
                <Cell
                  key={`${r}-${c}`}
                  cell={cell}
                  gameStatus={status}
                  onClick={() => handleCellClick(r, c)}
                  onRightClick={(e) => handleCellRightClick(e, r, c)}
                  onPressChange={setPressing}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Cell Component ---

function Cell({
  cell,
  gameStatus,
  onClick,
  onRightClick,
  onPressChange,
}: {
  cell: CellState;
  gameStatus: GameStatus;
  onClick: () => void;
  onRightClick: (e: React.MouseEvent) => void;
  onPressChange: (pressing: boolean) => void;
}) {
  const size = 18;

  if (!cell.isRevealed) {
    // Unrevealed cell
    const showWrongFlag = gameStatus === 'lost' && cell.isFlagged && !cell.isMine;

    return (
      <button
        style={{
          width: size,
          height: size,
          border: '2px outset #FFF',
          backgroundColor: '#C0C0C0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          cursor: gameStatus === 'won' || gameStatus === 'lost' ? 'default' : 'pointer',
          fontSize: '11px',
          lineHeight: 1,
        }}
        onClick={onClick}
        onContextMenu={onRightClick}
        onMouseDown={() => onPressChange(true)}
        onMouseUp={() => onPressChange(false)}
        onMouseLeave={() => onPressChange(false)}
      >
        {cell.isFlagged && !showWrongFlag && '🚩'}
        {showWrongFlag && (
          <span style={{ color: '#FF0000', fontWeight: 'bold', fontSize: '12px' }}>✕</span>
        )}
      </button>
    );
  }

  // Revealed cell
  if (cell.isMine) {
    return (
      <div
        style={{
          width: size,
          height: size,
          border: '1px solid #808080',
          backgroundColor: gameStatus === 'lost' ? '#FF0000' : '#C0C0C0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          lineHeight: 1,
        }}
      >
        💣
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        border: '1px solid #808080',
        backgroundColor: '#C0C0C0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        fontWeight: 'bold',
        lineHeight: 1,
        color: NUMBER_COLORS[cell.adjacentMines] ?? '#000',
      }}
    >
      {cell.adjacentMines > 0 ? cell.adjacentMines : ''}
    </div>
  );
}
