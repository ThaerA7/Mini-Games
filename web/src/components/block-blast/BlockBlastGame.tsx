import React from "react";

type Cell = 0 | 1;
type Board = Cell[][];
type Point = { x: number; y: number };
type Shape = Point[];

type Piece = {
  id: string;
  shape: Shape;
};

const BOARD_SIZE = 8; // 1) 8x8
const cellSize = "clamp(48px, 8.5vw, 72px)"; // big but responsive
const lineGap = 3;                            // one place to control line thickness
const lineColor = "rgba(0,0,0,0.9)";
const uiGrey = "#555";

// Outside frame (different color than inner grid lines) — not a border, just a wrapper background.
const outerGap = 8;                                // thickness of the outside frame
const outerColor = "rgba(50, 51, 54, 0.35)";        // choose any color you like

// 4) A familiar set of shapes (like common block puzzle games)
// All shapes are defined in their "natural" orientation; no rotation in-game.
const SHAPES: Shape[] = [
  // 1
  [{ x: 0, y: 0 }],

  // 2-line
  [{ x: 0, y: 0 }, { x: 1, y: 0 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }],

  // 3-line
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],

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

  // 2x2 square
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],

  // Corners (3 blocks) └ and ┐
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],

  // L (4 blocks) two orientations
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }],

  // T (5 blocks)
  [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
  ],

  // Z / S (3 blocks)
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
  [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
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

  // 3) Drag & drop
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [cursor, setCursor] = React.useState<{ x: number; y: number } | null>(
    null
  );
  const [hoverAt, setHoverAt] = React.useState<Point | null>(null);

  const selectedPiece = bag.find((p) => p.id === selected) || null;

  const pushHistory = React.useCallback(() => {
    setHistory((h) => [
      ...h,
      {
        board: board.map((r) => r.slice()) as Board,
        bag: bag.map((b) => ({
          ...b,
          shape: b.shape.map((pt) => ({ ...pt })),
        })),
        score,
      },
    ]);
  }, [board, bag, score]);

  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      const last = h[h.length - 1];
      setBoard(last.board.map((r) => r.slice()) as Board);
      setBag(
        last.bag.map((b) => ({ ...b, shape: b.shape.map((pt) => ({ ...pt })) }))
      );
      setScore(last.score);
      setSelected(null);
      setGameOver(false);
      setDraggingId(null);
      setHoverAt(null);
      setCursor(null);
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
    setDraggingId(null);
    setHoverAt(null);
    setCursor(null);
  };

  const tryPlaceAt = (x: number, y: number) => {
    if (!selectedPiece || gameOver) return;
    if (!canPlace(board, selectedPiece, { x, y })) return;

    pushHistory();

    let next = place(board, selectedPiece, { x, y });
    const { next: cleared, cleared: lines } = clearLines(next);
    next = cleared;

    const cellsPlaced = selectedPiece.shape.length;
    const lineBonus = lines > 0 ? 10 * lines * lines : 0;
    setScore((s) => s + cellsPlaced + lineBonus);

    const remaining = bag.filter((p) => p.id !== selectedPiece.id);
    const refill = remaining.length === 0 ? trio() : remaining;

    setBoard(next);
    setBag(refill);
    setSelected(null);

    const noMoves = !anyMoves(next, refill);
    if (noMoves) setGameOver(true);
  };

  // Global pointer listeners while dragging
  React.useEffect(() => {
    if (!draggingId) return;

    const onMove = (e: PointerEvent) => {
      setCursor({ x: e.clientX, y: e.clientY });
    };
    const onUp = () => {
      if (draggingId && selectedPiece && hoverAt && canPlace(board, selectedPiece, hoverAt)) {
        tryPlaceAt(hoverAt.x, hoverAt.y);
      }
      setDraggingId(null);
      setHoverAt(null);
      setCursor(null);
      setSelected(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [draggingId, hoverAt, selectedPiece, board]);

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
              borderRadius: 0,
              background: uiGrey,
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

      {/* Board frame (outside color) */}
      <div
        style={{
          justifySelf: "center",      // center the board inside this component
          padding: outerGap,          // thickness of the outside frame
          background: outerColor,     // frame color (different from inner lineColor)
          borderRadius: 0,
        }}
      >
        {/* Board grid */}
        <div
          style={{
            position: "relative",
            display: "inline-grid",                         // shrink to content
            width: "max-content",                           // prevents extra right area
            gridTemplateColumns: `repeat(${BOARD_SIZE}, ${cellSize})`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, ${cellSize})`,
            gap: lineGap,                                   // inner line thickness
            padding: lineGap,                               // shows lineColor in the padding gaps
            border: "none",
            borderRadius: 0,
            background: lineColor,                          // appears in the gaps (inner grid lines)
            boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
            userSelect: "none",
          }}
        >
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
            const x = i % BOARD_SIZE;
            const y = Math.floor(i / BOARD_SIZE);
            const filled = board[y][x] === 1;

            // Show a ghost of the piece over the cells it would occupy while dragging
            let ghost = false;
            if (selectedPiece && hoverAt && canPlace(board, selectedPiece, hoverAt)) {
              ghost = selectedPiece.shape.some(
                ({ x: dx, y: dy }) => hoverAt.x + dx === x && hoverAt.y + dy === y
              );
            }

            return (
              <div
                key={i}
                onClick={() => tryPlaceAt(x, y)}
                onPointerEnter={() => {
                  if (draggingId) setHoverAt({ x, y });
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  // 2) cells with NO edges (no border/no radius). Black lines are the gaps.
                  border: "none",
                  borderRadius: 0,
                  background: filled
                    ? "linear-gradient(180deg, rgba(59,130,246,0.9), rgba(59,130,246,0.55))"
                    : ghost
                    ? "rgba(59,130,246,0.25)"
                    : "rgba(255,255,255,0.06)",
                  boxShadow: filled
                    ? "inset 0 -2px 0 rgba(255,255,255,0.12), 0 4px 18px rgba(59,130,246,0.28)"
                    : "none",
                  cursor:
                    (selectedPiece && !gameOver) || draggingId ? "pointer" : "default",
                  transition: "background 100ms ease",
                }}
              />
            );
          })}

          {/* Optional overlay to show where the pointer is when dragging (small circle) */}
          {draggingId && cursor && (
            <div
              style={{
                position: "fixed",
                left: cursor.x,
                top: cursor.y,
                transform: "translate(-50%, -50%)",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.6)",
                pointerEvents: "none",
              }}
            />
          )}

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
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent: "center",
                    marginTop: 14,
                  }}
                >
                  <button onClick={reset} style={primaryBtnStyle}>
                    Play Again
                  </button>
                  <button onClick={undo} style={btnStyle} disabled={!history.length}>
                    Undo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pieces tray – shows exactly 3 pieces and supports drag */}
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {bag.map((p) => (
          <div
            key={p.id}
            role="button"
            onPointerDown={(e) => {
              e.preventDefault();
              setSelected(p.id);
              setDraggingId(p.id);
              setCursor({ x: e.clientX, y: e.clientY });
            }}
            onClick={() => {
              // allow simple click to select/deselect too
              setSelected((cur) => (cur === p.id ? null : p.id));
            }}
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background:
                selected === p.id
                  ? "rgba(59,130,246,0.18)"
                  : "rgba(255,255,255,0.06)",
              color: "white",
              borderRadius: 12,
              padding: 10,
              cursor: "grab",
              boxShadow:
                selected === p.id
                  ? "0 6px 22px rgba(59,130,246,0.35)"
                  : "none",
              transition: "transform 120ms ease, box-shadow 120ms ease",
              touchAction: "none",
            }}
            title="Drag onto the board, or click to select then click a cell to place"
          >
            <MiniPiece shape={p.shape} />
          </div>
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
        gridTemplateColumns: `repeat(${cols}, 18px)`,
        gridTemplateRows: `repeat(${rows}, 18px)`,
        gap: lineGap,
        background: lineColor, // show tiny separators same as board inner lines
        padding: lineGap,
      }}
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
              border: "none",
              borderRadius: 0,
              background: filled
                ? "linear-gradient(180deg, rgba(59,130,246,0.95), rgba(59,130,246,0.65))"
                : "rgba(255,255,255,0.06)",
            }}
          />
        );
      })}
    </div>
  );
}
