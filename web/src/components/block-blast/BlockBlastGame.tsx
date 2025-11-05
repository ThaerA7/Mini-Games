import React from "react";

/** --- Types --- */
type Cell = 0 | number; // 0 = empty, >0 = color index (1-based)
type Board = Cell[][];
type Point = { x: number; y: number };
type Shape = Point[];
type Piece = { id: string; shape: Shape };
type SlotPiece = Piece | null;
type Snapshot = { board: Board; bag: SlotPiece[]; score: number };

/** --- Config / Styling --- */
const BOARD_SIZE = 8;
const cellSize = "clamp(48px, 8.5vw, 72px)";
const lineGap = 3;
const lineColor = "rgba(0,0,0,0.9)";
const uiGrey = "#555";
const outerGap = 8;
const outerColor = "rgba(50, 51, 54, 0.35)";
const CELL_RADIUS = 6;

const TRAY_PIECE_SIZE = 26;     // bigger tray pieces
const TRAY_GAP_FROM_BOARD = 6;  // tiny visual gap between board and tray

// Very minimal forgiveness
const GRAB_RADIUS_PX = 42;      // tray pickup radius
// NO predictive hover. On drop/click allow only a 1-cell nudge on one axis:
const MICRO_SNAP_ORDER: Point[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

// Line clear FX
const BLAST_DURATION_MS = 480;
const BLAST_STAGGER_MS = 26;

/** --- Palette --- */
const PALETTE: [string, string][] = [
  ["rgba(59,130,246,0.95)", "rgba(59,130,246,0.65)"],
  ["rgba(168,85,247,0.95)", "rgba(168,85,247,0.65)"],
  ["rgba(34,197,94,0.95)", "rgba(34,197,94,0.65)"],
  ["rgba(234,179,8,0.95)", "rgba(234,179,8,0.65)"],
  ["rgba(249,115,22,0.95)", "rgba(249,115,22,0.65)"],
  ["rgba(244,63,94,0.95)", "rgba(244,63,94,0.65)"],
  ["rgba(20,184,166,0.95)", "rgba(20,184,166,0.65)"],
  ["rgba(99,102,241,0.95)", "rgba(99,102,241,0.65)"],
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
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
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
  return h % PALETTE.length;
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

/** Placement helpers */
function canPlace(board: Board, piece: Piece, at: Point): boolean {
  return piece.shape.every(({ x, y }) => {
    const cx = at.x + x;
    const cy = at.y + y;
    return cy >= 0 && cy < BOARD_SIZE && cx >= 0 && cx < BOARD_SIZE && board[cy][cx] === 0;
  });
}
function place(board: Board, piece: Piece, at: Point, val: number): Board {
  const copy = board.map((row) => row.slice()) as Board;
  piece.shape.forEach(({ x, y }) => {
    copy[at.y + y][at.x + x] = val;
  });
  return copy;
}

/** Line clear returns affected cells (for FX) */
function clearLines(board: Board): {
  next: Board; cleared: number; rows: number[]; cols: number[]; cells: { x: number; y: number }[];
} {
  const rowsFull = board.map((row) => row.every((c) => c !== 0));
  const colsFull = Array.from({ length: BOARD_SIZE }, (_, x) => board.every((row) => row[x] !== 0));

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

  const cells: { x: number; y: number }[] = [];
  const seen = new Set<string>();
  for (const y of rows) for (let x = 0; x < BOARD_SIZE; x++) { const k = `${x},${y}`; if (!seen.has(k)) { seen.add(k); cells.push({ x, y }); } }
  for (const x of cols) for (let y = 0; y < BOARD_SIZE; y++) { const k = `${x},${y}`; if (!seen.has(k)) { seen.add(k); cells.push({ x, y }); } }

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

/** Micro-snap: only allow shifting by ONE cell on ONE axis (no diagonals) */
function microSnap(board: Board, piece: Piece, targetTL: Point): Point | null {
  if (canPlace(board, piece, targetTL)) return targetTL;
  for (const d of MICRO_SNAP_ORDER) {
    const cand = { x: targetTL.x + d.x, y: targetTL.y + d.y };
    if (canPlace(board, piece, cand)) return cand;
  }
  return null;
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

/** MiniPiece: board-like edges WITHOUT any wrapper background.
 * We draw the dark separators using an outer box-shadow on each filled cell.
 * Grid gap is 0; the overlapping shadows create a lineColor seam between cells.
 */
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
  const edge = `${lineGap / 2}px`; // half on each neighbor → total ≈ lineGap

  return (
    <div
      style={{
        display: "inline-grid",
        gridTemplateColumns: `repeat(${cols}, ${d})`,
        gridTemplateRows: `repeat(${rows}, ${d})`,
        gap: 0, // no wrapper background; edges come from cell box-shadows
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
              borderRadius: CELL_RADIUS,
              background: filled
                ? `linear-gradient(180deg, ${top}, ${bottom})`
                : "transparent",
              // bevel + outer stroke to simulate board lines between cells
              boxShadow: filled
                ? `inset 0 -2px 0 rgba(255,255,255,0.12),
                   0 0 0 ${edge} ${lineColor}`
                : "none",
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
        transform: "translate(-50%, -50%)",
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
                borderRadius: CELL_RADIUS,
                background: filled
                  ? `linear-gradient(180deg, ${top}, ${bottom})`
                  : "transparent",
                boxShadow: filled
                  ? `inset 0 -2px 0 rgba(255,255,255,0.12),
                     0 4px 18px ${withAlpha(bottom, 0.28)}`
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
  const [bag, setBag] = React.useState<SlotPiece[]>(() => trio());
  const [selectedSlot, setSelectedSlot] = React.useState<number | null>(null);
  const [score, setScore] = React.useState(0);
  const [gameOver, setGameOver] = React.useState(false);
  const [history, setHistory] = React.useState<Snapshot[]>([]);

  // Drag state (by slot index!)
  const [draggingSlot, setDraggingSlot] = React.useState<number | null>(null);
  const [cursor, setCursor] = React.useState<{ x: number; y: number } | null>(null);
  const [hoverAt, setHoverAt] = React.useState<Point | null>(null);

  // Line-blast FX
  const [blastMap, setBlastMap] = React.useState<Record<string, number>>({});
  const blastTimerRef = React.useRef<number | null>(null);

  const boardRef = React.useRef<HTMLDivElement | null>(null);

  const selectedPiece: Piece | null = selectedSlot != null ? bag[selectedSlot] : null;
  const selectedColorIdx = selectedPiece ? colorIndexForShape(selectedPiece.shape) : 0;

  // Constant tray height (no layout jump). We removed mini grid gaps, so height = rows * size.
  const MAX_ROWS = React.useMemo(() => Math.max(...SHAPES.map((s) => shapeBounds(s).rows)), []);
  const TRAY_SLOT_HEIGHT = MAX_ROWS * TRAY_PIECE_SIZE;

  const pushHistory = React.useCallback(() => {
    setHistory((h) => [
      ...h,
      {
        board: board.map((r) => r.slice()) as Board,
        bag: bag.map((p) =>
          p ? { id: p.id, shape: p.shape.map((pt) => ({ ...pt })) } : null
        ),
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
      setBag(
        last.bag.map((p) => (p ? { id: p.id, shape: p.shape.map((pt) => ({ ...pt })) } : null))
      );
      setScore(last.score);
      setSelectedSlot(null);
      setGameOver(false);
      setDraggingSlot(null);
      setHoverAt(null);
      setCursor(null);
      clearBlast();
      return h.slice(0, -1);
    });
  };

  const reset = () => {
    setBoard(emptyBoard());
    setBag(trio());
    setSelectedSlot(null);
    setScore(0);
    setGameOver(false);
    setHistory([]);
    setDraggingSlot(null);
    setHoverAt(null);
    setCursor(null);
    clearBlast();
  };

  /** After placement: empty that slot; refill only when all 3 are empty. */
  const consumeSlotAndMaybeRefill = React.useCallback(
    (slotIdx: number): SlotPiece[] => {
      const nextBag = bag.slice();
      nextBag[slotIdx] = null;
      if (nextBag.every((p) => p === null)) {
        const [a, b, c] = trio();
        return [a, b, c];
      }
      return nextBag;
    },
    [bag]
  );

  const tryPlaceAt = (x: number, y: number) => {
    if (!selectedPiece || gameOver || selectedSlot == null) return;
    if (!canPlace(board, selectedPiece, { x, y })) return;

    pushHistory();

    const colorIdx = colorIndexForShape(selectedPiece.shape);
    let nextBoard = place(board, selectedPiece, { x, y }, colorIdx + 1);

    const clearedInfo = clearLines(nextBoard);
    nextBoard = clearedInfo.next;

    const cellsPlaced = selectedPiece.shape.length;
    const lines = clearedInfo.cleared;
    const lineBonus = lines > 0 ? 10 * lines * lines : 0;
    setScore((s) => s + cellsPlaced + lineBonus);

    const newBag = consumeSlotAndMaybeRefill(selectedSlot);
    setBoard(nextBoard);
    setBag(newBag);
    setSelectedSlot(null);

    // blast FX
    clearBlast();
    if (clearedInfo.cells.length > 0) {
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

    const available = newBag.filter((p): p is Piece => !!p);
    if (!anyMoves(nextBoard, available)) setGameOver(true);
  };

  /** Map pointer to board cell (null if outside). */
  const cellFromPoint = React.useCallback((clientX: number, clientY: number): Point | null => {
    const el = boardRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();

    const left = rect.left + lineGap;
    const top = rect.top + lineGap;
    if (clientX < left || clientY < top) return null;

    const innerW = rect.width - 2 * lineGap;
    const innerH = rect.height - 2 * lineGap;
    const totalGapsW = (BOARD_SIZE - 1) * lineGap;
    const totalGapsH = (BOARD_SIZE - 1) * lineGap;
    const cellW = (innerW - totalGapsW) / BOARD_SIZE;
    const cellH = (innerH - totalGapsH) / BOARD_SIZE;

    const gx = (clientX - left) / (cellW + lineGap);
    const gy = (clientY - top) / (cellH + lineGap);
    const x = Math.floor(gx);
    const y = Math.floor(gy);
    if (x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE) return null;
    return { x, y };
  }, []);

  /** Drag: update cursor + exact hover cell; NO predictive ghost. On drop use micro-snap (±1 cell). */
  React.useEffect(() => {
    if (draggingSlot == null) return;
    const onMove = (e: PointerEvent) => {
      setCursor({ x: e.clientX, y: e.clientY });
      setHoverAt(cellFromPoint(e.clientX, e.clientY));
    };

    const onUp = () => {
      const p = selectedPiece;
      if (draggingSlot != null && p && hoverAt) {
        const { cols, rows } = shapeBounds(p.shape);
        const ax = Math.floor(cols / 2);
        const ay = Math.floor(rows / 2);
        const at = { x: hoverAt.x - ax, y: hoverAt.y - ay };
        const snapped = microSnap(board, p, at);
        if (snapped) tryPlaceAt(snapped.x, snapped.y);
      }
      setDraggingSlot(null);
      setHoverAt(null);
      setCursor(null);
      setSelectedSlot(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [draggingSlot, hoverAt, selectedPiece, board]);

  const blastSet = React.useMemo(() => new Set(Object.keys(blastMap)), [blastMap]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* LINE-CLEAR CSS */}
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
        .cellWrap { position: relative; overflow: hidden; }
        .blastFx { position: absolute; inset: 0; pointer-events: none; }
        .blastGlow {
          position: absolute; inset: -2px; border-radius: ${CELL_RADIUS + 2}px;
          background: radial-gradient(circle at center, rgba(255,255,255,0.55), rgba(255,255,255,0) 60%);
          animation: lineBlastPop ${BLAST_DURATION_MS}ms ease-out forwards;
          mix-blend-mode: screen;
        }
        .blastRing {
          position: absolute; inset: -8px; border-radius: ${CELL_RADIUS + 4}px;
          background: conic-gradient(from 0deg, rgba(255,255,255,0.45), rgba(255,255,255,0) 40%, rgba(255,255,255,0.45));
          filter: blur(6px);
          animation: lineBlastRing ${BLAST_DURATION_MS}ms ease-out forwards;
          mix-blend-mode: screen;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", color: "rgba(255,255,255,0.95)", fontWeight: 700, letterSpacing: 0.3 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span>Score: {score}</span>
          <span style={{ fontSize: 12, padding: "2px 8px", background: uiGrey, border: "1px solid rgba(255,255,255,0.12)" }}>
            {history.length} undo
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={undo} disabled={!history.length || gameOver} style={btnStyle} title="Undo">Undo</button>
          <button onClick={reset} style={primaryBtnStyle} title="New Game">New Game</button>
        </div>
      </div>

      {/* Column wrapper: board + tray share width */}
      <div style={{ justifySelf: "center", display: "inline-flex", flexDirection: "column", alignItems: "stretch", gap: 12 }}>
        {/* Board frame */}
        <div style={{ padding: outerGap, background: outerColor, borderRadius: 0, alignSelf: "center" }}>
          <div
            ref={boardRef}
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

              let ghost = false;
              const selectedPieceLocal = selectedPiece;
              if (selectedPieceLocal && hoverAt) {
                const { cols, rows } = shapeBounds(selectedPieceLocal.shape);
                const ax = Math.floor(cols / 2);
                const ay = Math.floor(rows / 2);
                const topLeft = { x: hoverAt.x - ax, y: hoverAt.y - ay };
                if (canPlace(board, selectedPieceLocal, topLeft)) {
                  ghost = selectedPieceLocal.shape.some(
                    ({ x: dx, y: dy }) => topLeft.x + dx === x && topLeft.y + dy === y
                  );
                }
              }

              const [top, bottom] = filled
                ? PALETTE[((val as number) - 1) % PALETTE.length]
                : selectedPiece
                ? PALETTE[colorIndexForShape(selectedPiece.shape)]
                : PALETTE[0];

              const k = `${x},${y}`;
              const isBlast = blastSet.has(k);
              const delay = blastMap[k] ?? 0;

              return (
                <div
                  key={i}
                  onClick={() => {
                    if (!selectedPiece || selectedSlot == null) return;
                    const { cols, rows } = shapeBounds(selectedPiece.shape);
                    const ax = Math.floor(cols / 2);
                    const ay = Math.floor(rows / 2);
                    const at = { x: x - ax, y: y - ay };
                    const snapped = microSnap(board, selectedPiece, at);
                    if (snapped) tryPlaceAt(snapped.x, snapped.y);
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
                      ? `inset 0 -2px 0 rgba(255,255,255,0.12),
                         0 4px 18px ${withAlpha(bottom, 0.28)}`
                      : "none",
                    cursor: (selectedPiece && !gameOver) || draggingSlot != null ? "pointer" : "default",
                    transition: "background 100ms ease",
                    borderRadius: CELL_RADIUS,
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
              <div role="dialog" aria-label="Game over" style={{
                position: "absolute", inset: 0, display: "grid", placeItems: "center",
                background: "rgba(2,6,23,0.60)", backdropFilter: "blur(2px)",
              }}>
                <div style={{
                  padding: "20px 18px", borderRadius: 14, background: "rgba(2,6,23,0.9)",
                  border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.95)",
                  textAlign: "center", width: 320,
                }}>
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

        {/* TRAY: 3 fixed slots (no shifting); piece hides while dragging; empty remains after placement */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            width: "100%",
            alignItems: "center",
            justifyItems: "stretch",
            marginTop: TRAY_GAP_FROM_BOARD,
            minHeight: TRAY_SLOT_HEIGHT,
          }}
        >
          {[0, 1, 2].map((slotIdx) => {
            const p = bag[slotIdx];
            const isDraggingThis = draggingSlot === slotIdx;

            return (
              <div
                key={`slot-${slotIdx}`}
                role={p ? "button" : undefined}
                onPointerDown={
                  p
                    ? (e) => {
                        // start drag only if within grab radius from slot center
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const cx = rect.left + rect.width / 2;
                        const cy = rect.top + rect.height / 2;
                        const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
                        if (dist > GRAB_RADIUS_PX) return;

                        e.preventDefault();
                        setSelectedSlot(slotIdx);
                        setDraggingSlot(slotIdx);
                        setCursor({ x: e.clientX, y: e.clientY });
                      }
                    : undefined
                }
                onClick={p ? () => setSelectedSlot((cur) => (cur === slotIdx ? null : slotIdx)) : undefined}
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
                  <div style={{ visibility: isDraggingThis ? "hidden" : "visible" }}>
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
      {draggingSlot != null && selectedPiece && (
        <GrabbedPiece
          shape={selectedPiece.shape}
          colorIdx={selectedColorIdx}
          cursor={cursor}
        />
      )}
    </div>
  );
}
