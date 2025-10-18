// src/components/killer/KillerSudokuBoard.tsx
import React from "react";
import {
  generateKillerSudoku,
  type KillerPuzzle,
  type KillerCage,
} from "./killerGenerator";

type CellState = "empty" | "given" | "wrong" | "ok";

export default function KillerSudokuBoard() {
  const [puzzle, setPuzzle] = React.useState<KillerPuzzle | null>(null);
  const [grid, setGrid] = React.useState<number[][]>([]);
  const [selected, setSelected] = React.useState<{
    r: number;
    c: number;
  } | null>(null);
  const [seconds, setSeconds] = React.useState(0);
  const [mistakes, setMistakes] = React.useState(0);
  const [isSolved, setIsSolved] = React.useState(false);

  // generate once
  React.useEffect(() => {
    const p = generateKillerSudoku({ size: 9, minCage: 2, maxCage: 4 });
    setPuzzle(p);
    setGrid(p.givens.map((r) => r.slice()));
  }, []);

  // timer
  React.useEffect(() => {
    if (!puzzle || isSolved) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [puzzle, isSolved]);

  const size = puzzle?.size ?? 9;
  const box = 3;
  const containerSize = "min(92vw, 700px)";
  const borderColor = "rgba(255,255,255,0.25)"; // thin grid
  const subgridColor = "rgba(255,255,255,0.25)"; // thicker 3x3 lines
  const cageLine = "rgba(138, 150, 185, 1)";

  // NEW: cage line inset + width
  const cageInset = 3; // px – how far inside the cell the dotted lines should sit
  const cageBorderWidth = 2; // px
  const labelOffset = Math.max(4, Math.floor(cageInset - cageBorderWidth / 5));

  // helpers
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };

  const givens: boolean[][] = React.useMemo(() => {
    if (!puzzle) return [];
    return puzzle.givens.map((row) => row.map((v) => v !== 0));
  }, [puzzle]);

  // cage lookups
  const cageIdByCell = React.useMemo(() => {
    if (!puzzle) return [] as number[][];
    const map = Array.from({ length: size }, () => Array(size).fill(0));
    for (const c of puzzle.cages)
      for (const { r, c: cc } of c.cells) map[r][cc] = c.id;
    return map;
  }, [puzzle, size]);

  const cagesById = React.useMemo(() => {
    if (!puzzle) return new Map<number, KillerCage>();
    const m = new Map<number, KillerCage>();
    for (const c of puzzle.cages) m.set(c.id, c);
    return m;
  }, [puzzle]);

  // conflict logic (row/col + killer cage constraints)
  const hasConflict = (g: number[][], r: number, c: number, v: number) => {
    if (v === 0) return false;

    // row / col normal
    for (let j = 0; j < size; j++) if (j !== c && g[r][j] === v) return true;
    for (let i = 0; i < size; i++) if (i !== r && g[i][c] === v) return true;

    // killer cage constraints
    const id = cageIdByCell[r][c];
    const cage = cagesById.get(id);
    if (!cage) return false;

    let sum = v;
    const seen = new Set<number>([v]);
    for (const cell of cage.cells) {
      if (cell.r === r && cell.c === c) continue;
      const val = g[cell.r][cell.c];
      if (val !== 0) {
        if (seen.has(val)) return true; // no repeats inside cage
        seen.add(val);
        sum += val;
      }
    }
    if (sum > cage.sum) return true; // partial sums must not exceed target

    // when all filled, sum must match exactly
    const allFilled = cage.cells.every(({ r: rr, c: cc }) =>
      rr === r && cc === c ? v !== 0 : g[rr][cc] !== 0
    );
    if (allFilled) return sum !== cage.sum;

    return false;
  };

  const cellState: CellState[][] = React.useMemo(() => {
    if (!puzzle) return [] as CellState[][];
    return grid.map((row, r) =>
      row.map((v, c) => {
        if (v === 0) return "empty";
        if (givens[r][c]) return "given";
        return hasConflict(grid, r, c, v) ? "wrong" : "ok";
      })
    );
  }, [grid, givens]); // eslint-disable-line react-hooks/exhaustive-deps

  // solved?
  React.useEffect(() => {
    if (!puzzle) return;
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) if (grid[r][c] === 0) return;
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (hasConflict(grid, r, c, grid[r][c])) return;
    setIsSolved(true);
  }, [grid, puzzle, size]); // eslint-disable-line react-hooks/exhaustive-deps

  const placeValue = (r: number, c: number, v: number) => {
    if (!puzzle || isSolved) return;
    if (givens[r][c]) return;
    setGrid((g) => {
      const copy = g.map((row) => row.slice());
      if (copy[r][c] === v) return copy;
      if (v < 0 || v > size) return copy;
      const conflict = hasConflict(copy, r, c, v);
      copy[r][c] = v;
      if (v !== 0 && conflict) setMistakes((m) => m + 1);
      return copy;
    });
  };

  // borders: draw thick line where neighbor cage id differs
  const isCageBorder = (
    r: number,
    c: number,
    dir: "top" | "left" | "right" | "bottom"
  ) => {
    if (!puzzle) return false;
    const id = cageIdByCell[r][c];
    const dr = dir === "top" ? -1 : dir === "bottom" ? 1 : 0;
    const dc = dir === "left" ? -1 : dir === "right" ? 1 : 0;
    const nr = r + dr,
      nc = c + dc;
    if (nr < 0 || nc < 0 || nr >= size || nc >= size) return true; // outer border
    return cageIdByCell[nr][nc] !== id;
  };

  // sum label position: minimum (r,c) cell in the cage
  const isCageLabelCell = (r: number, c: number) => {
    const id = cageIdByCell[r][c];
    const cage = cagesById.get(id);
    if (!cage) return false;
    let min = cage.cells[0];
    for (const cell of cage.cells) {
      if (cell.r < min.r || (cell.r === min.r && cell.c < min.c)) min = cell;
    }
    return min.r === r && min.c === c;
  };

  if (!puzzle) {
    return (
      <div
        style={{
          width: containerSize,
          height: containerSize,
          display: "grid",
          placeItems: "center",
          color: "white",
          margin: "0 auto",
        }}
      >
        Generating Killer Sudoku…
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        width: `calc(${containerSize})`,
        margin: "0 auto",
      }}
    >
      {/* header */}
      <div
        style={{
          width: containerSize,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          color: "rgba(255,255,255,0.95)",
          fontWeight: 600,
          letterSpacing: 0.3,
          userSelect: "none",
        }}
      >
        <div style={{ justifySelf: "start", opacity: 0.9 }}>
          Mistakes: {mistakes}
        </div>
        <div style={{ justifySelf: "center", opacity: 0.95 }}>
          KILLER SUDOKU
        </div>
        <div style={{ justifySelf: "end", opacity: 0.9 }}>
          Time: {formatTime(seconds)}
        </div>
      </div>

      {/* board */}
      <div
        style={{
          width: containerSize,
          height: containerSize,
          display: "grid",
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
          background: "#0f172a",
          borderRadius: 12,
          border: `1px solid ${borderColor}`,
          boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        {grid.map((row, r) =>
          row.map((val, c) => {
            const selectedCell = selected?.r === r && selected?.c === c;
            const state = cellState[r][c];

            // base styles
            let bg = "rgba(255,255,255,0.04)";
            if (state === "wrong") {
              bg = selectedCell
                ? "rgba(239,68,68,0.45)"
                : "rgba(239,68,68,0.35)";
            } else if (selectedCell) {
              bg = "rgba(59,130,246,0.25)";
            }

            // normal 3x3 borders (subgrid)
            const thickRight = (c + 1) % box === 0 && c !== size - 1;
            const thickBottom = (r + 1) % box === 0 && r !== size - 1;

            // cage borders
            const cageTop = isCageBorder(r, c, "top");
            const cageLeft = isCageBorder(r, c, "left");
            const cageRight = isCageBorder(r, c, "right");
            const cageBottom = isCageBorder(r, c, "bottom");

            // draw strategy:
            // - draw only TOP and LEFT for internal boundaries (to avoid double lines)
            // - draw RIGHT only if it's the outermost column
            // - draw BOTTOM only if it's the outermost row
            const drawTop = cageTop;
            const drawLeft = cageLeft;
            const drawRight = cageRight && c === size - 1;
            const drawBottom = cageBottom && r === size - 1;

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => setSelected({ r, c })}
                style={{
                  position: "relative",
                  display: "grid",
                  placeItems: "center",
                  color: "rgba(255,255,255,0.85)",
                  fontWeight: givens[r][c] ? 800 : 600,
                  fontSize: "clamp(20px, 3.6vw, 30px)",
                  background: bg,
                  borderRight: `${thickRight ? 2 : 1}px solid ${thickRight ? subgridColor : borderColor}`,
                  borderBottom: `${thickBottom ? 2 : 1}px solid ${thickBottom ? subgridColor : borderColor}`,
                }}
              >
                {/* number (nudged & layered above cage lines) */}
                {val !== 0 ? (
                  <span
                    style={{
                      position: "relative",
                      zIndex: 2,
                      transform: "translateY(1px)",
                    }}
                  >
                    {val <= 9 ? val : String.fromCharCode(55 + val)}
                  </span>
                ) : null}

                {/* cage sum label (corner-aligned, hides dotted line beneath) */}
                {isCageLabelCell(r, c) && (
                  <div
                    style={{
                      position: "absolute",
                      left: labelOffset,
                      top: labelOffset,
                      zIndex: 3,
                      // keep layout tight
                      lineHeight: 1,
                      userSelect: "none",
                      pointerEvents: "none",
                      // the chip that masks the cage line behind the text:
                      background: bg, // <-- same as the cell background
                      padding: "1px 3px 0px", // tiny padding to fully cover the dots
                      borderRadius: 3,
                      // text styling
                      fontSize: 11,
                      fontWeight: 800,
                      color: "rgba(191,219,254,0.95)",
                      textShadow: "0 0 8px rgba(59,130,246,0.55)",
                    }}
                  >
                    {cagesById.get(cageIdByCell[r][c])?.sum}
                  </div>
                )}

                {/* cage border overlay (inset inside the cell) */}
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: cageInset, // <-- bring the dotted borders inside
                    borderTop: drawTop
                      ? `${cageBorderWidth}px dotted ${cageLine}`
                      : "none",
                    borderLeft: drawLeft
                      ? `${cageBorderWidth}px dotted ${cageLine}`
                      : "none",
                    borderRight: drawRight
                      ? `${cageBorderWidth}px dotted ${cageLine}`
                      : "none",
                    borderBottom: drawBottom
                      ? `${cageBorderWidth}px dotted ${cageLine}`
                      : "none",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                />
              </div>
            );
          })
        )}
      </div>

      {/* keypad */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          padding: "0 8px",
          width: containerSize,
        }}
      >
        {Array.from({ length: size }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            style={{
              padding: "12px 0 8px",
              width: 58,
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "white",
              cursor: "pointer",
            }}
            onClick={() => selected && placeValue(selected.r, selected.c, n)}
            title={`Digit ${n}`}
          >
            <span style={{ fontSize: 26, fontWeight: 800 }}>
              {n <= 9 ? n : String.fromCharCode(55 + n)}
            </span>
          </button>
        ))}
        <button
          style={{
            padding: "12px 0 8px",
            width: 58,
            borderRadius: 12,
            background: "rgba(239,68,68,0.2)",
            border: "1px solid rgba(239,68,68,0.5)",
            color: "white",
            cursor: "pointer",
            fontWeight: 800,
          }}
          onClick={() => selected && placeValue(selected.r, selected.c, 0)}
          title="Clear"
        >
          ⌫
        </button>
      </div>

      {/* solved banner */}
      {isSolved && (
        <div
          role="status"
          style={{
            marginTop: 8,
            textAlign: "center",
            color: "rgba(191,219,254,0.98)",
            fontWeight: 900,
            letterSpacing: 0.3,
          }}
        >
          ✓ Killer Sudoku solved in {formatTime(seconds)} with {mistakes}{" "}
          mistakes.
        </div>
      )}
    </div>
  );
}
