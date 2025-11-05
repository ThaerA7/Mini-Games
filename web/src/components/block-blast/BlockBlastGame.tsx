import React from "react";
import {
  // types
  type Board,
  type Piece,
  type SlotPiece,
  type Snapshot,
  type Point,
  type Shape,
  // config
  BOARD_SIZE,
  cellSize,
  lineGap,
  lineColor,
  outerGap,
  outerColor,
  CELL_RADIUS,
  TRAY_PIECE_SIZE,
  TRAY_GAP_FROM_BOARD,
  GRAB_RADIUS_PX,
  BLAST_DURATION_MS,
  BLAST_STAGGER_MS,
  OUTER_RADIUS,
  // data & utils
  PALETTE,
  withAlpha,
  colorIndexForShape,
  shapeBounds,
  emptyBoard,
  trio,
  canPlace,
  place,
  clearLines,
  anyMoves,
  microSnap,
} from "./blockBlastCore";

/** Small inline component that draws a miniature piece (used in tray). */
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
  const edge = `${lineGap / 2}px`;

  return (
    <div
      style={{
        display: "inline-grid",
        gridTemplateColumns: `repeat(${cols}, ${d})`,
        gridTemplateRows: `repeat(${rows}, ${d})`,
        gap: 0,
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
              boxShadow: filled
                ? `inset 0 -2px 0 rgba(255,255,255,0.12), 0 0 0 ${edge} ${lineColor}`
                : "none",
            }}
          />
        );
      })}
    </div>
  );
}

/** Floating piece that follows the cursor while dragging. */
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
                  ? `inset 0 -2px 0 rgba(255,255,255,0.12), 0 4px 18px ${withAlpha(bottom, 0.28)}`
                  : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/** --- Icons --- */
const iconStyle: React.CSSProperties = { display: "block" };

function IconUndo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      style={iconStyle}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="9 14 4 9 9 4" />
      <path d="M20 20a8 8 0 0 0-8-8H4" />
    </svg>
  );
}

function IconRestart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      style={iconStyle}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="3 6 3 12 9 12" />
      <path d="M21 12a9 9 0 1 1-9-9" />
    </svg>
  );
}

function IconTrophy(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      style={iconStyle}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10" />
      <path d="M17 4v4a5 5 0 0 1-10 0V4" />
      <path d="M7 8H4a2 2 0 1 0 0 4h2" />
      <path d="M17 8h3a2 2 0 1 1 0 4h-2" />
    </svg>
  );
}

/** --- Buttons (styled to match board frame) --- */
const btnBase: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(40, 42, 48, 0.35)", // neutral/translucent
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
  backdropFilter: "blur(2px)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};
const btnStyle: React.CSSProperties = {
  ...btnBase,
};
const primaryBtnStyle: React.CSSProperties = {
  ...btnBase,
  border: "1px solid rgba(59,130,246,0.45)",
  background: "rgba(59,130,246,0.18)",
  // no glow
  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
};

/** Score pill styled like a button, but non-interactive */
const scorePillStyle: React.CSSProperties = {
  ...btnBase,
  cursor: "default",
  userSelect: "none",
};

export default function BlockBlastGame() {
  const [board, setBoard] = React.useState<Board>(() => emptyBoard());
  const [bag, setBag] = React.useState<SlotPiece[]>(() => trio());
  const [selectedSlot, setSelectedSlot] = React.useState<number | null>(null);
  const [score, setScore] = React.useState(0);
  const [gameOver, setGameOver] = React.useState(false);
  const [history, setHistory] = React.useState<Snapshot[]>([]);

  // Drag state (by slot index!)
  const [draggingSlot, setDraggingSlot] = React.useState<number | null>(null);
  const [cursor, setCursor] = React.useState<{ x: number; y: number } | null>(
    null
  );
  const [hoverAt, setHoverAt] = React.useState<Point | null>(null);

  // Line-blast FX
  const [blastMap, setBlastMap] = React.useState<Record<string, number>>({});
  const blastTimerRef = React.useRef<number | null>(null);

  const boardRef = React.useRef<HTMLDivElement | null>(null);

  const selectedPiece: Piece | null =
    selectedSlot != null ? (bag[selectedSlot] as Piece | null) : null;
  const selectedColorIdx = selectedPiece
    ? colorIndexForShape(selectedPiece.shape)
    : 0;

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
        last.bag.map((p) =>
          p ? { id: p.id, shape: p.shape.map((pt) => ({ ...pt })) } : null
        )
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
      blastTimerRef.current = window.setTimeout(
        () => {
          setBlastMap({});
          blastTimerRef.current = null;
        },
        BLAST_DURATION_MS + 6 * BLAST_STAGGER_MS
      );
    }

    const available = newBag.filter((p): p is Piece => !!p);
    if (!anyMoves(nextBoard, available)) setGameOver(true);
  };

  /** Map pointer to board cell (null if outside). */
  const cellFromPoint = React.useCallback(
    (clientX: number, clientY: number): Point | null => {
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
    },
    []
  );

  /** Drag: update cursor + exact hover cell; no predictive ghost. */
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
  }, [draggingSlot, hoverAt, selectedPiece, board, cellFromPoint]);

  const blastSet = React.useMemo(
    () => new Set(Object.keys(blastMap)),
    [blastMap]
  );

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

      {/* Width-synced column: header + board + tray share the same width */}
      <div
        style={{
          justifySelf: "center",
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 12,
          width: "fit-content",
        }}
      >
        {/* Header WITHOUT background; score is in a pill like the buttons */}
        <div style={{ alignSelf: "center", width: "100%" }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
              color: "rgba(255,255,255,0.95)",
              fontWeight: 700,
              letterSpacing: 0.3,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              style={scorePillStyle}
              aria-label={`Score ${score}`}
              title="Current score"
            >
              <IconTrophy />
              <span>Score: {score}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={undo}
                disabled={!history.length || gameOver}
                style={btnStyle}
                title="Undo"
              >
                <IconUndo />
                Undo
              </button>
              <button onClick={reset} style={primaryBtnStyle} title="New Game">
                <IconRestart />
                New&nbsp;Game
              </button>
            </div>
          </div>
        </div>

        {/* Board frame */}
        <div
          style={{
            padding: outerGap,
            background: outerColor,
            borderRadius: OUTER_RADIUS,
            alignSelf: "center",
          }}
        >
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
                    ({ x: dx, y: dy }) =>
                      topLeft.x + dx === x && topLeft.y + dy === y
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
                      ? `inset 0 -2px 0 rgba(255,255,255,0.12), 0 4px 18px ${withAlpha(bottom, 0.28)}`
                      : "none",
                    cursor:
                      (selectedPiece && !gameOver) || draggingSlot != null
                        ? "pointer"
                        : "default",
                    transition: "background 100ms ease",
                    borderRadius: CELL_RADIUS,
                  }}
                >
                  {isBlast && (
                    <div
                      className="blastFx"
                      style={{ animationDelay: `${delay}ms` }}
                    >
                      <div
                        className="blastGlow"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                      <div
                        className="blastRing"
                        style={{ animationDelay: `${delay}ms` }}
                      />
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
                  <div style={{ fontSize: 22, fontWeight: 900 }}>
                    No Moves Left
                  </div>
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
                      <IconRestart />
                      Play&nbsp;Again
                    </button>
                    <button
                      onClick={undo}
                      style={btnStyle}
                      disabled={!history.length}
                    >
                      <IconUndo />
                      Undo
                    </button>
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
            minHeight: TRAY_PIECE_SIZE * 5,
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
                        const rect = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect();
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
                onClick={
                  p
                    ? () =>
                        setSelectedSlot((cur) =>
                          cur === slotIdx ? null : slotIdx
                        )
                    : undefined
                }
                style={{
                  height: TRAY_PIECE_SIZE * 5,
                  width: "100%",
                  display: "grid",
                  placeItems: "center",
                  userSelect: "none",
                  touchAction: "none",
                  cursor: p ? "grab" : "default",
                }}
                title={
                  p
                    ? "Drag onto the board, or click to select then click a cell to place"
                    : undefined
                }
              >
                {p && (
                  <div
                    style={{
                      visibility: isDraggingThis ? "hidden" : "visible",
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
