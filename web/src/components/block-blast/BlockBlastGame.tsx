import React from "react";

/** --- Types --- */
type Cell = 0 | number; // 0 = empty, >0 = color index (1-based)
type Board = Cell[][];
type Point = { x: number; y: number };
type Shape = Point[];
type Piece = { id: string; shape: Shape };
type Snapshot = { board: Board; bag: Piece[]; score: number };

/** --- Config / Styling --- */
const BOARD_SIZE = 8;
const cellSize = "clamp(48px, 8.5vw, 72px)";
const lineGap = 3;
const lineColor = "rgba(0,0,0,0.9)";
const uiGrey = "#555";
const outerGap = 8;
const outerColor = "rgba(50, 51, 54, 0.35)";
const TRAY_PIECE_SIZE = 26;       // bigger tray pieces
const TRAY_GAP_FROM_BOARD = 6;    // tiny visual gap between board and tray
const BLAST_DURATION_MS = 480;    // how long the line-clear animation runs
const BLAST_STAGGER_MS = 26;      // stagger per cell (by distance)

/** --- Palette --- */
const PALETTE: [string, string][] = [
  ["rgba(59,130,246,0.95)", "rgba(59,130,246,0.65)"], // blue
  ["rgba(168,85,247,0.95)", "rgba(168,85,247,0.65)"], // purple
  ["rgba(34,197,94,0.95)", "rgba(34,197,94,0.65)"],   // green
  ["rgba(234,179,8,0.95)", "rgba(234,179,8,0.65)"],   // yellow
  ["rgba(249,115,22,0.95)", "rgba(249,115,22,0.65)"], // orange
  ["rgba(244,63,94,0.95)", "rgba(244,63,94,0.65)"],   // rose
  ["rgba(20,184,166,0.95)", "rgba(20,184,166,0.65)"], // teal
  ["rgba(99,102,241,0.95)", "rgba(99,102,241,0.65)"], // indigo
];

const withAlpha = (rgba: string, a: number) =>
  rgba.replace(
    /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([.\d]+)\)/,
    (_, r, g, b) => `rgba(${r}, ${g}, ${b}, ${a})`
  );

/** --- Shapes --- */
const SHAPES: Shape[] = [
  [{ x: 0, y: 0 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }],
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
  [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }],
  [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
  ],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
  [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
];

/** --- Utils --- */
const shapeKey = (shape: Shape) =>
  shape
    .slice()
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((p) => `${p.x},${p.y}`)
    .join("|");

const colorIndexForShape = (shape: Shape) => {
  const key = shapeKey(shape);
  let h = 0 >>> 0;
  for (let i = 0; i < key.length; i++) h = ((h * 31) + key.charCodeAt(i)) >>> 0;
  return h % PALETTE.length; // 0..len-1
};

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

// place with a cell value (color index 1..N)
function place(board: Board, piece: Piece, at: Point, val: number): Board {
  const copy = board.map((row) => row.slice()) as Board;
  piece.shape.forEach(({ x, y }) => {
    copy[at.y + y][at.x + x] = val;
  });
  return copy;
}

/** Return which rows/cols cleared + all cells affected (for animation) */
function clearLines(board: Board): {
  next: Board;
  cleared: number;
  rows: number[];
  cols: number[];
  cells: { x: number; y: number }[];
} {
  const rowsFull = board.map((row) => row.every((c) => c !== 0));
  const colsFull = Array.from({ length: BOARD_SIZE }, (_, x) =>
    board.every((row) => row[x] !== 0)
  );

  const rows: number[] = [];
  const cols: number[] = [];
  rowsFull.forEach((full, y) => full && rows.push(y));
  colsFull.forEach((full, x) => full && cols.push(x));

  const next = board.map((row) => row.slice()) as Board;
  let cleared = 0;

  rows.forEach((y) => {
    cleared++;
    for (let x = 0; x < BOARD_SIZE; x++) next[y][x] = 0;
  });
  cols.forEach((x) => {
    cleared++;
    for (let y = 0; y < BOARD_SIZE; y++) next[y][x] = 0;
  });

  // union of all cells in cleared rows/cols
  const cells: { x: number; y: number }[] = [];
  const seen = new Set<string>();
  for (const y of rows) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const k = `${x},${y}`;
      if (!seen.has(k)) {
        seen.add(k);
        cells.push({ x, y });
      }
    }
  }
  for (const x of cols) {
    for (let y = 0; y < BOARD_SIZE; y++) {
      const k = `${x},${y}`;
      if (!seen.has(k)) {
        seen.add(k);
        cells.push({ x, y });
      }
    }
  }

  return { next, cleared, rows, cols, cells };
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

/** --- Buttons --- */
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

/** --- Render helpers --- */
function shapeBounds(shape: Shape) {
  const maxX = Math.max(...shape.map((p) => p.x));
  const maxY = Math.max(...shape.map((p) => p.y));
  return { cols: maxX + 1, rows: maxY + 1 };
}

function MiniPiece({
  shape,
  colorIdx,
  size = 18,
}: {
  shape: Shape;
  colorIdx: number;
  size?: number;
}) {
  const { cols, rows } = shapeBounds(shape);
  const [top, bottom] = PALETTE[colorIdx];
  const d = `${size}px`;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${d})`,
        gridTemplateRows: `repeat(${rows}, ${d})`,
        gap: lineGap,
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
              width: d,
              height: d,
              background: filled
                ? `linear-gradient(180deg, ${top}, ${bottom})`
                : "transparent",
            }}
          />
        );
      })}
    </div>
  );
}

function GrabbedPiece({
  shape,
  colorIdx,
  cursor,
}: {
  shape: Shape;
  colorIdx: number;
  cursor: { x: number; y: number } | null;
}) {
  if (!cursor) return null;
  const { cols, rows } = shapeBounds(shape);
  const [top, bottom] = PALETTE[colorIdx];
  return (
    <div
      style={{
        position: "fixed",
        left: cursor.x,
        top: cursor.y,
        transform: "translate(-50%, -50%)", // center the piece on the cursor
        zIndex: 9999,
        pointerEvents: "none",
        opacity: 0.95,
        filter: "drop-shadow(0 12px 26px rgba(0,0,0,0.5))",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, ${cellSize})`,
          gridTemplateRows: `repeat(${rows}, ${cellSize})`,
          gap: lineGap,
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
                width: "100%",
                height: "100%",
                background: filled
                  ? `linear-gradient(180deg, ${top}, ${bottom})`
                  : "transparent",
                boxShadow: filled
                  ? `inset 0 -2px 0 rgba(255,255,255,0.12), 0 4px 18px ${withAlpha(
                      bottom,
                      0.28
                    )}`
                  : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/** --- Component --- */
export default function BlockBlastGame() {
  const [board, setBoard] = React.useState<Board>(() => emptyBoard());
  const [bag, setBag] = React.useState<Piece[]>(() => trio());
  const [selected, setSelected] = React.useState<string | null>(null);
  const [score, setScore] = React.useState(0);
  const [gameOver, setGameOver] = React.useState(false);
  const [history, setHistory] = React.useState<Snapshot[]>([]);

  // Drag state
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [cursor, setCursor] = React.useState<{ x: number; y: number } | null>(null);
  const [hoverAt, setHoverAt] = React.useState<Point | null>(null);

  // Line-blast animation map: key "x,y" -> delay (ms)
  const [blastMap, setBlastMap] = React.useState<Record<string, number>>({});
  const blastTimerRef = React.useRef<number | null>(null);

  const selectedPiece = bag.find((p) => p.id === selected) || null;
  const selectedColorIdx = selectedPiece ? colorIndexForShape(selectedPiece.shape) : 0;

  // Reserve constant tray height so the board never shifts
  const MAX_ROWS = React.useMemo(() => Math.max(...SHAPES.map((s) => shapeBounds(s).rows)), []);
  const TRAY_SLOT_HEIGHT = MAX_ROWS * TRAY_PIECE_SIZE + (MAX_ROWS - 1) * lineGap;

  const pushHistory = React.useCallback(() => {
    setHistory((h) => [
      ...h,
      {
        board: board.map((r) => r.slice()) as Board,
        bag: bag.map((b) => ({ ...b, shape: b.shape.map((pt) => ({ ...pt })) })),
        score,
      },
    ]);
  }, [board, bag, score]);

  const clearBlast = React.useCallback(() => {
    if (blastTimerRef.current) {
      window.clearTimeout(blastTimerRef.current);
      blastTimerRef.current = null;
    }
    setBlastMap({});
  }, []);

  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      const last = h[h.length - 1];
      setBoard(last.board.map((r) => r.slice()) as Board);
      setBag(last.bag.map((b) => ({ ...b, shape: b.shape.map((pt) => ({ ...pt })) })));
      setScore(last.score);
      setSelected(null);
      setGameOver(false);
      setDraggingId(null);
      setHoverAt(null);
      setCursor(null);
      clearBlast();
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
    clearBlast();
  };

  const tryPlaceAt = (x: number, y: number) => {
    if (!selectedPiece || gameOver) return;
    if (!canPlace(board, selectedPiece, { x, y })) return;

    pushHistory();

    const colorIdx = colorIndexForShape(selectedPiece.shape); // 0..N-1
    let next = place(board, selectedPiece, { x, y }, colorIdx + 1); // store 1-based color

    const clearedInfo = clearLines(next);
    next = clearedInfo.next;

    // scoring
    const cellsPlaced = selectedPiece.shape.length;
    const lines = clearedInfo.cleared;
    const lineBonus = lines > 0 ? 10 * lines * lines : 0;
    setScore((s) => s + cellsPlaced + lineBonus);

    // Refill bag
    const remaining = bag.filter((p) => p.id !== selectedPiece.id);
    const refill = remaining.length === 0 ? trio() : remaining;

    setBoard(next);
    setBag(refill);
    setSelected(null);

    // Trigger blast animation if any lines cleared
    clearBlast();
    if (clearedInfo.cells.length > 0) {
      // use piece center as wave origin
      const { cols, rows } = shapeBounds(selectedPiece.shape);
      const ax = Math.floor(cols / 2);
      const ay = Math.floor(rows / 2);
      const origin = { x: x + ax, y: y + ay };

      const map: Record<string, number> = {};
      for (const c of clearedInfo.cells) {
        const d = Math.abs(c.x - origin.x) + Math.abs(c.y - origin.y);
        map[`${c.x},${c.y}`] = d * BLAST_STAGGER_MS;
      }
      setBlastMap(map);

      blastTimerRef.current = window.setTimeout(() => {
        setBlastMap({});
        blastTimerRef.current = null;
      }, BLAST_DURATION_MS + 6 * BLAST_STAGGER_MS);
    }

    if (!anyMoves(next, refill)) setGameOver(true);
  };

  // Accurate drag placement: anchor the shape center to the hovered cell
  React.useEffect(() => {
    if (!draggingId) return;
    const onMove = (e: PointerEvent) => setCursor({ x: e.clientX, y: e.clientY });
    const onUp = () => {
      if (draggingId && selectedPiece && hoverAt) {
        const { cols, rows } = shapeBounds(selectedPiece.shape);
        const ax = Math.floor(cols / 2);
        const ay = Math.floor(rows / 2);
        const at = { x: hoverAt.x - ax, y: hoverAt.y - ay };
        if (canPlace(board, selectedPiece, at)) {
          tryPlaceAt(at.x, at.y);
        }
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

  const blastSet = React.useMemo(() => new Set(Object.keys(blastMap)), [blastMap]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* LINE-CLEAR CSS (scoped) */}
      <style>{`
        @keyframes lineBlastPop {
          0%   { transform: scale(0.9); filter: brightness(1);   opacity: 0.0; }
          30%  { transform: scale(1.06); filter: brightness(1.7); opacity: 1; }
          100% { transform: scale(1);    filter: brightness(1);   opacity: 0; }
        }
        @keyframes lineBlastRing {
          0%   { transform: scale(0.6) rotate(0deg);   opacity: 0.9; }
          100% { transform: scale(1.25) rotate(160deg); opacity: 0; }
        }
        .cellWrap {
          position: relative;
          overflow: hidden;
        }
        .blastFx {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .blastGlow {
          position: absolute;
          inset: -2px;
          border-radius: 8px;
          background: radial-gradient(circle at center, rgba(255,255,255,0.55), rgba(255,255,255,0) 60%);
          animation: lineBlastPop ${BLAST_DURATION_MS}ms ease-out forwards;
          mix-blend-mode: screen;
        }
        .blastRing {
          position: absolute;
          inset: -8px;
          border-radius: 12px;
          background: conic-gradient(from 0deg, rgba(255,255,255,0.45), rgba(255,255,255,0) 40%, rgba(255,255,255,0.45));
          filter: blur(6px);
          animation: lineBlastRing ${BLAST_DURATION_MS}ms ease-out forwards;
          mix-blend-mode: screen;
        }
      `}</style>

      {/* Header */}
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
              background: uiGrey,
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {history.length} undo
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={undo} disabled={!history.length || gameOver} style={btnStyle} title="Undo">
            Undo
          </button>
          <button onClick={reset} style={primaryBtnStyle} title="New Game">
            New Game
          </button>
        </div>
      </div>

      {/* Column wrapper: board + tray share width */}
      <div
        style={{
          justifySelf: "center",
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 12,
        }}
      >
        {/* Board frame */}
        <div
          style={{
            padding: outerGap,
            background: outerColor,
            borderRadius: 0,
            alignSelf: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              display: "inline-grid",
              width: "max-content",
              gridTemplateColumns: `repeat(${BOARD_SIZE}, ${cellSize})`,
              gridTemplateRows: `repeat(${BOARD_SIZE}, ${cellSize})`,
              gap: lineGap,
              padding: lineGap,
              background: lineColor,
              boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
              userSelect: "none",
            }}
          >
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
              const x = i % BOARD_SIZE;
              const y = Math.floor(i / BOARD_SIZE);
              const val = board[y][x];
              const filled = val !== 0;

              // ghost highlight using same anchor logic as drop
              let ghost = false;
              if (selectedPiece && hoverAt) {
                const { cols, rows } = shapeBounds(selectedPiece.shape);
                const ax = Math.floor(cols / 2);
                const ay = Math.floor(rows / 2);
                const topLeft = { x: hoverAt.x - ax, y: hoverAt.y - ay };
                if (canPlace(board, selectedPiece, topLeft)) {
                  ghost = selectedPiece.shape.some(
                    ({ x: dx, y: dy }) => topLeft.x + dx === x && topLeft.y + dy === y
                  );
                }
              }

              const [top, bottom] = filled
                ? PALETTE[((val as number) - 1) % PALETTE.length]
                : selectedPiece
                ? PALETTE[selectedColorIdx]
                : PALETTE[0];

              const k = `${x},${y}`;
              const isBlast = blastSet.has(k);
              const delay = blastMap[k] ?? 0;

              return (
                <div
                  key={i}
                  onClick={() => tryPlaceAt(x, y)}
                  onPointerEnter={() => {
                    if (draggingId) setHoverAt({ x, y });
                  }}
                  className="cellWrap"
                  style={{
                    width: "100%",
                    height: "100%",
                    background: filled
                      ? `linear-gradient(180deg, ${top}, ${bottom})`
                      : ghost
                      ? withAlpha(top, 0.25)
                      : "rgba(255,255,255,0.06)",
                    boxShadow: filled
                      ? `inset 0 -2px 0 rgba(255,255,255,0.12), 0 4px 18px ${withAlpha(
                          bottom,
                          0.28
                        )}`
                      : "none",
                    cursor:
                      (selectedPiece && !gameOver) || draggingId ? "pointer" : "default",
                    transition: "background 100ms ease",
                    borderRadius: 6,
                  }}
                >
                  {isBlast && (
                    <div className="blastFx" style={{ animationDelay: `${delay}ms` }}>
                      <div className="blastGlow" style={{ animationDelay: `${delay}ms` }} />
                      <div className="blastRing" style={{ animationDelay: `${delay}ms` }} />
                    </div>
                  )}
                </div>
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
                  <div style={{ marginTop: 6, opacity: 0.85 }}>Final score: {score}</div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                    <button onClick={reset} style={primaryBtnStyle}>Play Again</button>
                    <button onClick={undo} style={btnStyle} disabled={!history.length}>Undo</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TRAY: 3 fixed-height slots; grabbed piece disappears but slot stays (no shifting) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            width: "100%",
            alignItems: "center",
            justifyItems: "stretch",
            marginTop: TRAY_GAP_FROM_BOARD,
            minHeight: TRAY_SLOT_HEIGHT, // reserve space
          }}
        >
          {[0, 1, 2].map((slotIdx) => {
            const p = bag[slotIdx];
            const isDraggingThis = !!p && draggingId === p.id;

            return (
              <div
                key={p?.id ?? `empty-${slotIdx}`}
                role={p ? "button" : undefined}
                onPointerDown={
                  p
                    ? (e) => {
                        e.preventDefault();
                        setSelected(p.id);
                        setDraggingId(p.id);
                        setCursor({ x: e.clientX, y: e.clientY });
                      }
                    : undefined
                }
                onClick={p ? () => setSelected((cur) => (cur === p.id ? null : p.id)) : undefined}
                style={{
                  height: TRAY_SLOT_HEIGHT,
                  width: "100%",
                  display: "grid",
                  placeItems: "center",
                  userSelect: "none",
                  touchAction: "none",
                  cursor: p ? "grab" : "default",
                }}
                title={p ? "Drag onto the board, or click to select then click a cell to place" : undefined}
              >
                {p && (
                  <div
                    style={{
                      visibility: isDraggingThis ? "hidden" : "visible", // disappears while dragging (slot stays)
                      transition: "visibility 0s linear 0s",
                    }}
                  >
                    <MiniPiece
                      shape={p.shape}
                      colorIdx={colorIndexForShape(p.shape)}
                      size={TRAY_PIECE_SIZE}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating grabbed piece that follows the cursor (centered) */}
      {draggingId && selectedPiece && (
        <GrabbedPiece
          shape={selectedPiece.shape}
          colorIdx={selectedColorIdx}
          cursor={cursor}
        />
      )}
    </div>
  );
}
