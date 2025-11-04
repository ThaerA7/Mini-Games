import React from "react";

type Cell = 0 | 1;
type Board = Cell[][];
type Point = { x: number; y: number };
type Shape = Point[];

type Piece = {
  id: string;
  shape: Shape;
};

const BOARD_SIZE = 10;

// A small but fun set of shapes (relative coordinates, origin at top-left)
const SHAPES: Shape[] = [
  // 1
  [{ x: 0, y: 0 }],
  // 2-line
  [{ x: 0, y: 0 }, { x: 1, y: 0 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }],
  // 3-line
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],
  // 2x2 square
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
  // L (3)
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
  // 4-line
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }],
  // 5-line
  [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 },
    { x: 4, y: 0 },
  ],
  [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 2 },
    { x: 0, y: 3 },
    { x: 0, y: 4 },
  ],
  // T (5)
  [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
  ],
];

function emptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => 0 as Cell)
  );
}

function randomPiece(): Piece {
  const idx = Math.floor(Math.random() * SHAPES.length);
  return { id: Math.random().toString(36).slice(2), shape: SHAPES[idx] };
}

function trio(): Piece[] {
  return [randomPiece(), randomPiece(), randomPiece()];
}

function canPlace(board: Board, piece: Piece, at: Point): boolean {
  return piece.shape.every(({ x, y }) => {
    const cx = at.x + x;
    const cy = at.y + y;
    return (
      cy >= 0 &&
      cy < BOARD_SIZE &&
      cx >= 0 &&
      cx < BOARD_SIZE &&
      board[cy][cx] === 0
    );
  });
}

function place(board: Board, piece: Piece, at: Point): Board {
  const copy = board.map((row) => row.slice()) as Board;
  piece.shape.forEach(({ x, y }) => {
    copy[at.y + y][at.x + x] = 1;
  });
  return copy;
}

function clearLines(board: Board): { next: Board; cleared: number } {
  const rowsFull = board.map((row) => row.every((c) => c === 1));
  const colsFull = Array.from({ length: BOARD_SIZE }, (_, x) =>
    board.every((row) => row[x] === 1)
  );

  const next = board.map((row) => row.slice()) as Board;
  let cleared = 0;

  rowsFull.forEach((full, y) => {
    if (full) {
      cleared++;
      for (let x = 0; x < BOARD_SIZE; x++) next[y][x] = 0;
    }
  });

  colsFull.forEach((full, x) => {
    if (full) {
      cleared++;
      for (let y = 0; y < BOARD_SIZE; y++) next[y][x] = 0;
    }
  });

  return { next, cleared };
}

function anyMoves(board: Board, pieces: Piece[]): boolean {
  for (const p of pieces) {
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (canPlace(board, p, { x, y })) return true;
      }
    }
  }
  return false;
}

type Snapshot = {
  board: Board;
  bag: Piece[];
  score: number;
};

export default function BlockBlastGame() {
  const [board, setBoard] = React.useState<Board>(() => emptyBoard());
  const [bag, setBag] = React.useState<Piece[]>(() => trio());
  const [selected, setSelected] = React.useState<string | null>(null);
  const [score, setScore] = React.useState(0);
  const [gameOver, setGameOver] = React.useState(false);
  const [history, setHistory] = React.useState<Snapshot[]>([]);

  const selectedPiece = bag.find((p) => p.id === selected) || null;

  const pushHistory = React.useCallback(() => {
    setHistory((h) => [...h, { board: board.map(r => r.slice()) as Board, bag: bag.map(b => ({...b, shape: b.shape.map(pt => ({...pt}))})), score }]);
  }, [board, bag, score]);

  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      const last = h[h.length - 1];
      setBoard(last.board.map(r => r.slice()) as Board);
      setBag(last.bag.map(b => ({...b, shape: b.shape.map(pt => ({...pt}))})));
      setScore(last.score);
      setSelected(null);
      setGameOver(false);
      return h.slice(0, -1);
    });
  };

  const reset = () => {
    setBoard(emptyBoard());
    setBag(trio());
    setSelected(null);
    setScore(0);
    setGameOver(false);
    setHistory([]);
  };

  const tryPlaceAt = (x: number, y: number) => {
    if (!selectedPiece || gameOver) return;
    if (!canPlace(board, selectedPiece, { x, y })) return;

    pushHistory();

    let next = place(board, selectedPiece, { x, y });
    const { next: cleared, cleared: lines } = clearLines(next);
    next = cleared;

    const cellsPlaced = selectedPiece.shape.length;
    const lineBonus = lines > 0 ? 10 * lines * lines : 0; // quadratic-ish bonus
    setScore((s) => s + cellsPlaced + lineBonus);

    const remaining = bag.filter((p) => p.id !== selectedPiece.id);
    const refill = remaining.length === 0 ? trio() : remaining;

    setBoard(next);
    setBag(refill);
    setSelected(null);

    // game over?
    const noMoves = !anyMoves(next, refill);
    if (noMoves) setGameOver(true);
  };

  const cellSize = "min(9.8vw, 48px)";
  const gap = 4;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Header / controls */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          color: "rgba(255,255,255,0.95)",
          fontWeight: 700,
          letterSpacing: 0.3,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span>Score: {score}</span>
          <span
            style={{
              fontSize: 12,
              padding: "2px 8px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {history.length} undo
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={undo}
            disabled={!history.length || gameOver}
            style={btnStyle}
            title="Undo"
          >
            Undo
          </button>
          <button onClick={reset} style={primaryBtnStyle} title="New Game">
            New Game
          </button>
        </div>
      </div>

      {/* Board */}
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: `repeat(${BOARD_SIZE}, ${cellSize})`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, ${cellSize})`,
          gap,
          padding: gap,
          borderRadius: 12,
          background: "#0f172a",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
          userSelect: "none",
        }}
      >
        {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
          const x = i % BOARD_SIZE;
          const y = Math.floor(i / BOARD_SIZE);
          const filled = board[y][x] === 1;

          // highlight preview (selected piece hover)
          let preview = false;
          if (selectedPiece) {
            preview = canPlace(board, selectedPiece, { x, y });
          }

          return (
            <div
              key={i}
              onClick={() => tryPlaceAt(x, y)}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 8,
                background: filled
                  ? "linear-gradient(180deg, rgba(59,130,246,0.85), rgba(59,130,246,0.55))"
                  : preview
                  ? "rgba(59,130,246,0.18)"
                  : "rgba(255,255,255,0.06)",
                border: filled
                  ? "1px solid rgba(59,130,246,0.9)"
                  : "1px solid rgba(255,255,255,0.10)",
                boxShadow: filled
                  ? "inset 0 -2px 0 rgba(255,255,255,0.12), 0 4px 18px rgba(59,130,246,0.28)"
                  : "none",
                cursor: selectedPiece && !gameOver ? "pointer" : "default",
                transition: "background 120ms ease, transform 120ms ease",
              }}
            />
          );
        })}
        {gameOver && (
          <div
            role="dialog"
            aria-label="Game over"
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              background: "rgba(2,6,23,0.60)",
              backdropFilter: "blur(2px)",
            }}
          >
            <div
              style={{
                padding: "20px 18px",
                borderRadius: 14,
                background: "rgba(2,6,23,0.9)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "rgba(255,255,255,0.95)",
                textAlign: "center",
                width: 320,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 900 }}>No Moves Left</div>
              <div style={{ marginTop: 6, opacity: 0.85 }}>
                Final score: {score}
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                <button onClick={reset} style={primaryBtnStyle}>Play Again</button>
                <button onClick={undo} style={btnStyle} disabled={!history.length}>
                  Undo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pieces tray */}
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {bag.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected((cur) => (cur === p.id ? null : p.id))}
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background:
                selected === p.id
                  ? "rgba(59,130,246,0.18)"
                  : "rgba(255,255,255,0.06)",
              color: "white",
              borderRadius: 12,
              padding: 10,
              cursor: "pointer",
              boxShadow:
                selected === p.id
                  ? "0 6px 22px rgba(59,130,246,0.35)"
                  : "none",
              transition: "transform 120ms ease, box-shadow 120ms ease",
            }}
            title="Click to select piece, then click a board cell to place"
          >
            <MiniPiece shape={p.shape} />
          </button>
        ))}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const primaryBtnStyle: React.CSSProperties = {
  ...btnStyle,
  border: "1px solid rgba(59,130,246,0.55)",
  background: "rgba(59,130,246,0.18)",
  boxShadow: "0 6px 24px rgba(59,130,246,0.35)",
};

function MiniPiece({ shape }: { shape: Shape }) {
  // derive a snug grid that fits the shape
  const maxX = Math.max(...shape.map((p) => p.x));
  const maxY = Math.max(...shape.map((p) => p.y));
  const cols = maxX + 1;
  const rows = maxY + 1;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(cols, 18px)`,
        gridTemplateRows: `repeat(rows, 18px)`,
        gap: 3,
      } as React.CSSProperties}
    >
      {Array.from({ length: rows * cols }).map((_, i) => {
        const x = i % cols;
        const y = Math.floor(i / cols);
        const filled = shape.some((p) => p.x === x && p.y === y);
        return (
          <div
            key={i}
            style={{
              width: 18,
              height: 18,
              borderRadius: 5,
              background: filled
                ? "linear-gradient(180deg, rgba(59,130,246,0.9), rgba(59,130,246,0.6))"
                : "rgba(255,255,255,0.06)",
              border: filled
                ? "1px solid rgba(59,130,246,0.95)"
                : "1px solid rgba(255,255,255,0.12)",
            }}
          />
        );
      })}
    </div>
  );
}
