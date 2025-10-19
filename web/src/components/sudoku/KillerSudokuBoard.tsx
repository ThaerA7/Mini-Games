// src/components/KillerSudokuBoard.tsx
import React from "react";
import {
  generateKillerSudoku,
  type KillerPuzzle,
  type KillerCage,
} from "./killerGenerator";
import Icons from "./icons";

// ---------- Types ----------
type CellState = "empty" | "given" | "wrong" | "ok";

type Notes = Array<Array<Set<number>>>;

// ---------- Small utils (self-contained to avoid cross-file deps) ----------
const deepCopy = (grid: number[][]): number[][] => grid.map((r) => r.slice());
const makeEmptyNotes = (size: number): Notes =>
  Array.from({ length: size }, () =>
    Array.from({ length: size }, () => new Set<number>())
  );
const copyNotes = (n: Notes): Notes =>
  n.map((row) => row.map((s) => new Set(s)));
const symbolFor = (n: number) =>
  n <= 9 ? String(n) : String.fromCharCode(55 + n);
const nextFrame = () =>
  new Promise<void>((r) => requestAnimationFrame(() => r()));

export default function KillerSudokuBoard() {
  // ---------- Loading & base puzzle ----------
  const [isLoading, setIsLoading] = React.useState(true);
  const [puzzle, setPuzzle] = React.useState<KillerPuzzle | null>(null);

  // In KillerSudokuBoard.tsx

  const loadPuzzle = React.useCallback(async () => {
    setIsLoading(true);
    await nextFrame();
    const p = generateKillerSudoku({
      size: 9,
      minCage: 2,
      maxCage: 4,
      difficulty: "hard",
      baseNumbersCount: 22,
      symmetricGivens: true,
      avoidEasyPairSums: true,
    });
    setPuzzle(p);
    setGrid(deepCopy(p.givens));
    setNotes(makeEmptyNotes(p.size));
    setMistakes(0);
    setSeconds(0);
    setHistory([]);
    setSelected(null);
    setHighlightDigit(0);
    setShowCandidates(false);
    setPencilMode(false);
    setIsSolved(false);
    setShowSolvedOverlay(false);
    setHintsUsed(0);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    loadPuzzle();
  }, [loadPuzzle]);

  // ---------- Board state ----------
  const [grid, setGrid] = React.useState<number[][]>([]);
  const [selected, setSelected] = React.useState<{
    r: number;
    c: number;
  } | null>(null);
  const [mistakes, setMistakes] = React.useState(0);
  const [seconds, setSeconds] = React.useState(0);
  const [notes, setNotes] = React.useState<Notes>([]);
  const [pencilMode, setPencilMode] = React.useState(false);
  const [showCandidates, setShowCandidates] = React.useState(false);
  const [hardMode, setHardMode] = React.useState(false);
  const [isSolved, setIsSolved] = React.useState(false);
  const [showSolvedOverlay, setShowSolvedOverlay] = React.useState(false);
  const [hintsUsed, setHintsUsed] = React.useState(0);

  // Undo history
  type Snapshot = { grid: number[][]; notes: Notes; mistakes: number };
  const [history, setHistory] = React.useState<Snapshot[]>([]);
  const pushHistory = React.useCallback(() => {
    setHistory((h) => [
      ...h,
      { grid: deepCopy(grid), notes: copyNotes(notes), mistakes },
    ]);
  }, [grid, notes, mistakes]);
  const popHistory = React.useCallback(() => {
    setHistory((h) => {
      if (!h.length) return h;
      const last = h[h.length - 1];
      setGrid(deepCopy(last.grid));
      setNotes(copyNotes(last.notes));
      setMistakes(last.mistakes);
      return h.slice(0, -1);
    });
  }, []);

  // Timer
  React.useEffect(() => {
    if (isLoading || !puzzle || isSolved) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [isLoading, puzzle, isSolved]);

  const boardRef = React.useRef<HTMLDivElement>(null);

  // ---------- Deriveds & lookups ----------
  const size = puzzle?.size ?? 9;
  const box = 3;

  const givens: boolean[][] = React.useMemo(() => {
    if (!puzzle) return [];
    return puzzle.givens.map((row) => row.map((v) => v !== 0));
  }, [puzzle]);

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

  // Candidates for Killer (row/col, cage uniqueness + sum lower/upper bounds by loose math)
  const computeCandidatesKiller = React.useCallback(
    (g: number[][], r: number, c: number): number[] => {
      if (!puzzle) return [];
      if (g[r][c] !== 0) return [];
      const presentRow = new Set(g[r]);
      const presentCol = new Set(g.map((row) => row[c]));

      const cage = cagesById.get(cageIdByCell[r][c]);
      if (!cage) return [];

      // used in cage
      const usedInCage = new Set<number>();
      let currentSum = 0;
      let remainingCells = 0;
      for (const cell of cage.cells) {
        const val = g[cell.r][cell.c];
        if (val !== 0) {
          usedInCage.add(val);
          currentSum += val;
        } else {
          remainingCells += 1;
        }
      }

      // function: minimal & maximal sums possible for k cells with distinct digits from 1..9 excluding used
      const availableDigitsAll = Array.from(
        { length: 9 },
        (_, i) => i + 1
      ).filter((d) => !usedInCage.has(d));
      const minSumFor = (k: number, exclude: number[] = []) => {
        const pool = availableDigitsAll
          .filter((d) => !exclude.includes(d))
          .sort((a, b) => a - b);
        return pool.slice(0, k).reduce((s, n) => s + n, 0);
      };
      const maxSumFor = (k: number, exclude: number[] = []) => {
        const pool = availableDigitsAll
          .filter((d) => !exclude.includes(d))
          .sort((a, b) => b - a);
        return pool.slice(0, k).reduce((s, n) => s + n, 0);
      };

      const out: number[] = [];
      for (let v = 1; v <= 9; v++) {
        if (presentRow.has(v) || presentCol.has(v)) continue;
        if (usedInCage.has(v)) continue; // no repeats in cage
        const partial = currentSum + v;
        if (partial > cage.sum) continue; // upper bound
        const kLeft = remainingCells - 1; // other empties in this cage after placing v here
        if (kLeft < 0) continue;
        // Loose bound feasibility: can the rest reach the target?
        const minPossible = partial + minSumFor(kLeft, [v]);
        const maxPossible = partial + (kLeft > 0 ? maxSumFor(kLeft, [v]) : 0);
        if (minPossible > cage.sum) continue;
        if (maxPossible < cage.sum) continue;
        out.push(v);
      }
      return out;
    },
    [puzzle, cagesById, cageIdByCell]
  );

  // solution-aware cell state (disabled in Hard Mode)
  const cellState: CellState[][] = React.useMemo(() => {
    if (!puzzle) return [] as CellState[][];
    if (hardMode) {
      // Hide correctness in Hard Mode
      return grid.map((row, r) =>
        row.map((v, c) => (v === 0 ? "empty" : givens[r][c] ? "given" : "ok"))
      );
    }
    // Not hard mode: check directly against solution
    return grid.map((row, r) =>
      row.map((v, c) => {
        if (v === 0) return "empty";
        if (givens[r][c]) return "given";
        return v === puzzle.solution[r][c] ? "ok" : "wrong";
      })
    );
  }, [grid, givens, puzzle, hardMode]);

  // Detect solved & overlay
  React.useEffect(() => {
    if (!puzzle) return;

    // Must be fully filled
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 0) return;
      }
    }

    // Must match the solution exactly
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] !== puzzle.solution[r][c]) return;
      }
    }

    if (!isSolved) {
      setIsSolved(true);
      setShowSolvedOverlay(true);
    }
  }, [grid, puzzle, size, isSolved]);

  // ---------- Placement & notes ----------
  const placeValue = (r: number, c: number, v: number) => {
    if (!puzzle || isSolved) return;
    if (givens[r][c]) return;
    setGrid((g) => {
      const copy = deepCopy(g);
      const N = copy.length;
      if (v < 0 || v > N) return copy;
      if (copy[r][c] === v) return copy;

      pushHistory();

      // Apply the change
      copy[r][c] = v;

      // clear notes in that cell
      setNotes((n) => {
        const nn = copyNotes(n);
        nn[r][c].clear();
        return nn;
      });

      // Solution-aware mistake counting (only in non-hard mode)
      if (!hardMode && v !== 0 && v !== puzzle.solution[r][c]) {
        setMistakes((m) => m + 1);
      }

      return copy;
    });
  };

  const toggleNote = (r: number, c: number, v: number) => {
    if (!puzzle || isSolved) return;
    if (givens[r][c] || v === 0) return;
    setNotes((n) => {
      const nn = copyNotes(n);
      const s = nn[r][c];
      if (s.has(v)) s.delete(v);
      else s.add(v);
      return nn;
    });
  };

  const setCell = (r: number, c: number, v: number) => {
    if (pencilMode && v !== 0) toggleNote(r, c, v);
    else placeValue(r, c, v);
  };

  // Keyboard input
  React.useEffect(() => {
    const el = boardRef.current;
    if (!el || !puzzle || isLoading) return;
    const onKey = (e: KeyboardEvent) => {
      if (isSolved) return;
      if (!selected) return;
      const { r, c } = selected;
      if (givens[r][c]) return;
      const k = e.key;
      if (k >= "1" && k <= "9") {
        const val = Number(k);
        if (pencilMode) toggleNote(r, c, val);
        else placeValue(r, c, val);
      } else if (k === "Backspace" || k === "Delete" || k === "0") {
        if (pencilMode) {
          setNotes((n) => {
            const nn = copyNotes(n);
            nn[r][c].clear();
            return nn;
          });
        } else {
          placeValue(r, c, 0);
        }
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [selected, givens, puzzle, isLoading, isSolved, pencilMode]);

  // ---------- UI metrics & helpers ----------
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };

  const entriesCount = React.useMemo(() => {
    if (!grid.length) return 0;
    let count = 0;
    for (let r = 0; r < grid.length; r++)
      for (let c = 0; c < grid.length; c++) if (grid[r][c] !== 0) count++;
    return count;
  }, [grid]);

  const perDigitCounts = React.useMemo(() => {
    const counts = Array.from({ length: size + 1 }, () => 0);
    if (!grid.length) return counts;
    for (let r = 0; r < grid.length; r++)
      for (let c = 0; c < grid.length; c++) {
        const v = grid[r][c];
        if (v > 0) counts[v] += 1;
      }
    return counts;
  }, [grid, size]);

  // highlighting
  const [highlightDigit, setHighlightDigit] = React.useState<number>(0);
  const selectedDigit = React.useMemo(() => {
    if (!selected) return 0;
    const v = grid[selected.r][selected.c];
    return v > 0 ? v : 0;
  }, [selected, grid]);
  const activeDigit = hardMode ? 0 : highlightDigit || selectedDigit;

  // compute marks for a cell (notes or auto-candidates)
  const getMarks = (r: number, c: number): number[] => {
    if (grid[r][c] !== 0) return [];
    if (hardMode) return [];
    if (pencilMode) return Array.from(notes[r][c]).sort((a, b) => a - b);
    if (showCandidates) return computeCandidatesKiller(grid, r, c);
    return [];
  };

  // ---------- Toolbar actions ----------
  const eraseSelected = () => {
    if (!puzzle || !selected || isSolved) return;
    const { r, c } = selected;
    if (givens[r][c]) return;
    placeValue(r, c, 0);
    setNotes((n) => {
      const nn = copyNotes(n);
      nn[r][c].clear();
      return nn;
    });
  };

  const fastPencil = () => {
    if (hardMode || isSolved) return;
    setShowCandidates((v) => !v);
  };

  const toggleHardMode = () => {
    if (isSolved) return;
    setHardMode((on) => {
      const next = !on;
      if (next) {
        setHighlightDigit(0);
        setShowCandidates(false);
      }
      return next;
    });
  };

  const [hintMsg, setHintMsg] = React.useState<string | null>(null);
  const showHintMsg = (m: string) => {
    setHintMsg(m);
    window.setTimeout(() => setHintMsg(null), 1400);
  };

  // Very light hint system: pick a cell with a single candidate
  const applyHint = () => {
    if (!puzzle) return;
    if (hardMode) {
      showHintMsg("Hints are disabled in Hard Mode");
      return;
    }
    if (isSolved) return;

    // Prefer selected cell if it has one candidate
    if (
      selected &&
      grid[selected.r][selected.c] === 0 &&
      !givens[selected.r][selected.c]
    ) {
      const cands = computeCandidatesKiller(grid, selected.r, selected.c);
      if (cands.length === 1) {
        placeValue(selected.r, selected.c, cands[0]);
        setHintsUsed((u) => u + 1);
        showHintMsg("Hint: Naked single");
        return;
      }
    }

    // Otherwise search globally
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] !== 0 || givens[r][c]) continue;
        const cands = computeCandidatesKiller(grid, r, c);
        if (cands.length === 1) {
          placeValue(r, c, cands[0]);
          setHintsUsed((u) => u + 1);
          showHintMsg("Hint: Naked single");
          return;
        }
      }
    }

    showHintMsg("No hint available");
  };

  const resetPuzzle = () => {
    if (!puzzle) return;
    setGrid(deepCopy(puzzle.givens));
    setNotes(makeEmptyNotes(size));
    setMistakes(0);
    setSeconds(0);
    setHistory([]);
    setSelected(null);
    setHighlightDigit(0);
    setShowCandidates(false);
    setPencilMode(false);
    setIsSolved(false);
    setShowSolvedOverlay(false);
    setHintsUsed(0);
  };

  const newPuzzle = async () => {
    await loadPuzzle();
  };

  // ---------- Layout & styling tokens (match SudokuBoard) ----------
  const containerSize = "min(92vw, 700px)";
  const layoutWidth = `calc(${containerSize} + 16px + 74px)`; // board + gap + toolbar
  const borderColor = "rgba(255,255,255,0.25)";
  const thin = "1px";
  const thick = "2px";

  // Killer-specific visuals
  const cageLine = "rgba(138, 150, 185, 1)";
  const cageInset = 3; // px inset for dotted borders
  const cageBorderWidth = 2; // px
  const labelOffset = Math.max(0, Math.floor(cageInset - cageBorderWidth / 0));

  // --- Align toolbar with board header ---
  const headerRef = React.useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = React.useState(0);
  React.useLayoutEffect(() => {
    const update = () =>
      setHeaderHeight(headerRef.current?.getBoundingClientRect().height ?? 0);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Inject keyframes for loader once
  React.useEffect(() => {
    const id = "sudoku-loading-keyframes";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `
@keyframes sudokuShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes sudokuSpin { to { transform: rotate(360deg); } }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // ---------- Loading UI ----------
  const LoadingBoard: React.FC<{ size: number; label: string }> = ({
    size,
    label,
  }) => {
    const b = 3;
    return (
      <div
        style={{
          position: "relative",
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
        aria-busy="true"
      >
        {Array.from({ length: size }).map((_, r) =>
          Array.from({ length: size }).map((_, c) => {
            const thickRight = (c + 1) % b === 0 && c !== size - 1;
            const thickBottom = (r + 1) % b === 0 && r !== size - 1;
            return (
              <div
                key={`${r}-${c}`}
                style={{
                  borderRight: `${thickRight ? thick : thin} solid ${borderColor}`,
                  borderBottom: `${thickBottom ? thick : thin} solid ${borderColor}`,
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
                  backgroundSize: "200% 100%",
                  animation: "sudokuShimmer 1.1s linear infinite",
                }}
              />
            );
          })
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "rgba(255,255,255,0.95)",
              fontWeight: 700,
              letterSpacing: 0.3,
              padding: "10px 14px",
              borderRadius: 12,
              background: "rgba(2,6,23,0.5)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: "3px solid rgba(255,255,255,0.35)",
                borderTopColor: "rgba(59,130,246,0.95)",
                animation: "sudokuSpin 0.9s linear infinite",
              }}
            />
            Generating {label}…
          </div>
        </div>
      </div>
    );
  };

  // ---------- Cage border helpers ----------
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

  // ---------- RENDER ----------
  if (isLoading || !puzzle) {
    return (
      <div
        style={{
          display: "grid",
          gap: 16,
          width: layoutWidth,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `${containerSize} 74px`,
            gap: 16,
            alignItems: "start",
            justifyContent: "center",
            margin: "0 auto",
            width: layoutWidth,
          }}
        >
          {/* LEFT: header + board */}
          <div style={{ display: "grid", gap: 16 }}>
            <div
              ref={headerRef}
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
              <div style={{ justifySelf: "start", opacity: 0.6 }}>
                Mistakes: —
              </div>
              <div style={{ justifySelf: "center", opacity: 0.95 }}>
                KILLER SUDOKU • generating…
              </div>
              <div style={{ justifySelf: "end", opacity: 0.6 }}>
                Time: --:--
              </div>
            </div>
            <LoadingBoard size={size} label="Killer Sudoku" />
          </div>

          {/* RIGHT: toolbar skeleton */}
          <div
            style={{
              height: containerSize,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              userSelect: "none",
              overflow: "hidden",
              marginTop: headerHeight + 16,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                maxHeight: "100%",
                overflowY: "auto",
              }}
            >
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 74,
                    height: 92,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background:
                      "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
                    backgroundSize: "200% 100%",
                    animation: "sudokuShimmer 1.2s linear infinite",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ display: "grid", gap: 16, width: layoutWidth, margin: "0 auto" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${containerSize} 74px`,
          gap: 16,
          alignItems: "start",
          justifyContent: "center",
          margin: "0 auto",
          width: layoutWidth,
        }}
      >
        {/* LEFT: header + board */}
        <div style={{ display: "grid", gap: 16 }}>
          <div
            ref={headerRef}
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
            <div
              style={{
                justifySelf: "start",
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
                opacity: 0.9,
              }}
            >
              <span> Mistakes: {hardMode ? "—" : mistakes}</span>
              {!hardMode && (
                <span
                  style={{
                    padding: "2px 6px",
                    fontSize: 11,
                    lineHeight: 1.2,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.9)",
                    verticalAlign: "middle",
                  }}
                  title="All filled cells (givens + your entries)"
                >
                  Filled: {entriesCount}
                </span>
              )}
              <span
                style={{
                  padding: "2px 6px",
                  fontSize: 11,
                  lineHeight: 1.2,
                  borderRadius: 8,
                  background: "rgba(59,130,246,0.12)",
                  border: "1px solid rgba(59,130,246,0.35)",
                  color: "rgba(191,219,254,0.95)",
                  verticalAlign: "middle",
                }}
                title="Number of hints you've used in this puzzle"
              >
                Hints: {hintsUsed}
              </span>
            </div>
            <div style={{ justifySelf: "center", opacity: 0.95 }}>
              KILLER SUDOKU
              {pencilMode ? " • Pencil" : ""}
              {!hardMode && showCandidates ? " • Fast Pencil" : ""}
              {hardMode ? " • Hard Mode" : ""}
              {isSolved ? " • Solved!" : ""}
            </div>
            <div style={{ justifySelf: "end", opacity: 0.9 }}>
              Time: {formatTime(seconds)}
            </div>
          </div>

          {/* Board + overlay wrapper */}
          <div
            style={{
              position: "relative",
              width: containerSize,
              height: containerSize,
            }}
          >
            {/* Board */}
            <div
              ref={boardRef}
              tabIndex={0}
              onClick={() => boardRef.current?.focus()}
              style={{
                outline: "none",
                width: "100%",
                height: "100%",
                display: "grid",
                gridTemplateColumns: `repeat(${size}, 1fr)`,
                gridTemplateRows: `repeat(${size}, 1fr)`,
                background: "#0f172a",
                borderRadius: 0,
                border: `1px solid ${borderColor}`,
                boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
                overflow: "hidden",
                userSelect: "none",
                filter: showSolvedOverlay
                  ? "blur(4px) saturate(0.8) brightness(0.9)"
                  : "none",
                pointerEvents: showSolvedOverlay ? "none" : "auto",
                transition: "filter 200ms ease",
              }}
            >
              {grid.map((row, r) =>
                row.map((val, c) => {
                  const thickRight = (c + 1) % box === 0 && c !== size - 1;
                  const thickBottom = (r + 1) % box === 0 && r !== size - 1;

                  const given = givens[r][c];
                  const state = cellState[r][c];
                  const selectedCell = selected?.r === r && selected?.c === c;

                  const isActiveSameNumber =
                    activeDigit > 0 && val === activeDigit;
                  const cellMarks = getMarks(r, c);
                  const cellHasActiveCandidate =
                    !val && activeDigit > 0 && cellMarks.includes(activeDigit);

                  let bg = "rgba(8, 13, 24, 1)";
                  if (!hardMode && state === "wrong") {
                    bg = selectedCell
                      ? "rgba(239,68,68,0.45)"
                      : "rgba(239,68,68,0.35)";
                  } else if (isActiveSameNumber) {
                    bg = "rgba(59,130,246,0.35)";
                  } else if (selectedCell) {
                    bg = "rgba(59,130,246,0.25)";
                  } else if (cellHasActiveCandidate) {
                    bg = "rgba(59,130,246,0.18)";
                  }

                  const givenColor = "rgba(255,255,255,0.78)";
                  const entryColor = "rgba(147, 197, 253, 0.95)";
                  const baseNumberColor = given ? givenColor : entryColor;
                  const numberColor = isActiveSameNumber
                    ? "rgba(255,255,255,0.98)"
                    : baseNumberColor;

                  const insetRing =
                    cellHasActiveCandidate && !selectedCell && state !== "wrong"
                      ? "inset 0 0 0 2px rgba(59,130,246,0.65)"
                      : "none";

                  const sameNumberGlow = isActiveSameNumber
                    ? "0 0 14px rgba(59,130,246,0.85)"
                    : "none";

                  // killer cage borders
                  const cageTop = isCageBorder(r, c, "top");
                  const cageLeft = isCageBorder(r, c, "left");
                  const cageRight = isCageBorder(r, c, "right");
                  const cageBottom = isCageBorder(r, c, "bottom");

                  // draw strategy (avoid double lines)
                  const drawTop = cageTop;
                  const drawLeft = cageLeft;
                  const drawRight = cageRight && c === size - 1;
                  const drawBottom = cageBottom && r === size - 1;

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => setSelected({ r, c })}
                      style={{
                        display: "grid",
                        placeItems: "center",
                        fontSize: "clamp(20px, 3.6vw, 30px)",
                        fontWeight: given ? 800 : 600,
                        color: numberColor,
                        background: bg,
                        borderRight: `${thickRight ? thick : thin} solid ${borderColor}`,
                        borderBottom: `${thickBottom ? thick : thin} solid ${borderColor}`,
                        position: "relative",
                        transition:
                          "background-color 120ms ease, box-shadow 120ms ease, transform 120ms ease",
                        boxShadow: `${insetRing}, ${sameNumberGlow}`,
                      }}
                    >
                      {/* number (above cage lines) */}
                      {val !== 0 ? (
                        <span
                          style={{
                            position: "relative",
                            zIndex: 2,
                            transform: "translateY(1px)",
                          }}
                        >
                          {symbolFor(val)}
                        </span>
                      ) : (
                        // Notes / candidates grid
                        (() => {
                          const marks = cellMarks;
                          if (!marks.length) return null;
                          const sub = 3;
                          return (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "grid",
                                gridTemplateColumns: `repeat(${sub}, 1fr)`,
                                gridTemplateRows: `repeat(${sub}, 1fr)`,
                                gap: 2,
                                padding: 4,
                                position: "relative",
                                zIndex: 2,
                              }}
                            >
                              {Array.from({ length: 9 }, (_, i) => i + 1).map(
                                (v) => {
                                  const visible = marks.includes(v);
                                  const active =
                                    visible &&
                                    activeDigit > 0 &&
                                    v === activeDigit;
                                  return (
                                    <div
                                      key={v}
                                      style={{
                                        display: "grid",
                                        placeItems: "center",
                                        fontSize: 12,
                                        lineHeight: 1,
                                        visibility: visible
                                          ? "visible"
                                          : "hidden",
                                        color: visible
                                          ? "rgba(255,255,255,0.92)"
                                          : "transparent",
                                        fontWeight: active ? 900 : 600,
                                        textShadow: active
                                          ? "0 0 10px rgba(59,130,246,0.95), 0 0 18px rgba(59,130,246,0.75)"
                                          : "none",
                                        transform: active
                                          ? "scale(1.12)"
                                          : "none",
                                        borderRadius: 6,
                                        padding: "2px 0",
                                        background: active
                                          ? "rgba(59,130,246,0.28)"
                                          : "transparent",
                                      }}
                                    >
                                      {symbolFor(v)}
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          );
                        })()
                      )}

                      {/* cage sum label */}
                      {isCageLabelCell(r, c) && (
                        <div
                          style={{
                            position: "absolute",
                            left: labelOffset,
                            top: labelOffset,
                            zIndex: 3,
                            lineHeight: 1,
                            userSelect: "none",
                            pointerEvents: "none",
                            background: "rgba(8, 13, 24, 1)", // light box background
                            padding: "2.5px 2.5px",
                            borderRadius: 4,
                            fontSize: 8,
                            fontWeight: 800,
                            color: "rgba(255, 255, 255, 1)",
                            boxShadow: "none", // no shadow
                            textShadow: "none", // no shadow on text either
                          }}
                        >
                          {cagesById.get(cageIdByCell[r][c])?.sum}
                        </div>
                      )}

                      {/* cage border overlay */}
                      <div
                        aria-hidden
                        style={{
                          position: "absolute",
                          inset: cageInset,
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

            {/* SOLVED OVERLAY */}
            {showSolvedOverlay && (
              <div
                role="dialog"
                aria-label="Killer sudoku solved summary"
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  padding: 16,
                  background:
                    "radial-gradient(1200px 1200px at 50% 50%, rgba(2,6,23,0.68), rgba(2,6,23,0.92))",
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    padding: "22px 20px",
                    borderRadius: 16,
                    background: "rgba(2,6,23,0.86)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.55)",
                    width: "min(520px, 92%)",
                    color: "rgba(255,255,255,0.95)",
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      margin: "0 auto 10px",
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      background:
                        "conic-gradient(from 0deg, rgba(59,130,246,0.9), rgba(147,51,234,0.9), rgba(59,130,246,0.9))",
                      boxShadow: "0 8px 30px rgba(59,130,246,0.35)",
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        background: "#0b1220",
                        border: "1px solid rgba(255,255,255,0.18)",
                        fontSize: 34,
                        fontWeight: 900,
                      }}
                      aria-hidden
                    >
                      ✓
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 900,
                      letterSpacing: 0.2,
                    }}
                  >
                    Puzzle Solved!
                  </div>
                  <div style={{ opacity: 0.85, marginTop: 4, fontSize: 13 }}>
                    Great job finishing this Killer Sudoku.
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 10,
                      marginTop: 14,
                      flexWrap: "wrap",
                    }}
                  >
                    {[
                      { k: "time", name: "Time", val: formatTime(seconds) },
                      {
                        k: "mistakes",
                        name: "Mistakes",
                        val: String(mistakes),
                      },
                      { k: "hints", name: "Hints", val: String(hintsUsed) },
                      {
                        k: "mode",
                        name: "Mode",
                        val: hardMode
                          ? "Hard"
                          : pencilMode
                            ? "Pencil"
                            : "Normal",
                      },
                    ].map((s) => (
                      <div
                        key={s.k}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 10,
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.14)",
                          minWidth: 110,
                        }}
                      >
                        <div style={{ fontSize: 11, opacity: 0.85 }}>
                          {s.name}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>
                          {s.val}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: 16,
                      display: "flex",
                      gap: 12,
                      justifyContent: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => setShowSolvedOverlay(false)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "rgba(255,255,255,0.08)",
                        color: "white",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Review Board
                    </button>
                    <button
                      onClick={newPuzzle}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid rgba(59,130,246,0.55)",
                        background: "rgba(59,130,246,0.18)",
                        color: "white",
                        fontWeight: 800,
                        cursor: isLoading ? "not-allowed" : "pointer",
                        boxShadow: "0 6px 24px rgba(59,130,246,0.35)",
                        opacity: isLoading ? 0.6 : 1,
                      }}
                      disabled={isLoading}
                    >
                      New Game
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: toolbar */}
        <div
          style={{
            height: containerSize,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            userSelect: "none",
            overflow: "hidden",
            marginTop: headerHeight + 16,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              maxHeight: "100%",
              overflowY: "auto",
            }}
          >
            {[
              {
                key: "undo",
                title: "Undo",
                label: "Undo",
                onClick: popHistory,
                Icon: Icons.Undo,
                disabled: history.length === 0,
              },
              {
                key: "erase",
                title: "Erase",
                label: "Erase",
                onClick: eraseSelected,
                Icon: Icons.Eraser,
                disabled:
                  !selected || (selected && givens[selected.r][selected.c]),
              },
              {
                key: "pencil",
                title: pencilMode ? "Exit Pencil" : "Pencil",
                label: "Pencil",
                onClick: () => setPencilMode((v) => !v),
                Icon: Icons.Pencil,
                active: pencilMode,
              },
              {
                key: "fastp",
                title: "Fast Pencil",
                label: "Fast Pencil",
                onClick: fastPencil,
                Icon: Icons.Sparkles,
                active: showCandidates,
                disabled: hardMode,
              },
              {
                key: "hint",
                title: hardMode ? "Hint (disabled in Hard Mode)" : "Hint",
                label: "Hint",
                onClick: applyHint,
                Icon: Icons.Bulb,
                disabled: hardMode,
              },
              {
                key: "reset",
                title: "Reset",
                label: "Reset",
                onClick: resetPuzzle,
                Icon: Icons.Reset,
              },
              {
                key: "new",
                title: "New Game",
                label: "New Game",
                onClick: newPuzzle,
                Icon: Icons.Dice,
              },
              {
                key: "hard",
                title: hardMode ? "Hard Mode: ON" : "Hard Mode: OFF",
                label: "Hard Mode",
                onClick: toggleHardMode,
                Icon: Icons.Hard,
                active: hardMode,
              },
            ].map(
              ({ key, title, label, onClick, Icon: Ico, disabled, active }) => {
                const baseDisabled = !!disabled || isLoading;
                const overlayBlock =
                  key === "reset" || key === "new"
                    ? false
                    : isSolved || showSolvedOverlay;
                const isDisabled = baseDisabled || overlayBlock;
                return (
                  <button
                    key={key}
                    aria-label={title}
                    title={title}
                    onClick={onClick}
                    disabled={isDisabled}
                    style={{
                      width: 74,
                      height: 92,
                      border: "none",
                      background: "transparent",
                      color: "rgba(255, 255, 255, 0.85)",
                      cursor: "pointer",
                      borderRadius: 12,
                      display: "grid",
                      placeItems: "center",
                      transition: "color 120ms ease, opacity 120ms ease",
                      outline: "none",
                      boxShadow: "none",
                      WebkitTapHighlightColor: "transparent",
                      appearance: "none",
                      ...(active ? { color: "rgba(59,130,246,0.95)" } : null),
                      ...(isDisabled
                        ? { opacity: 0.4, cursor: "not-allowed" }
                        : null),
                    }}
                    onMouseEnter={(e) => {
                      if (isDisabled) return;
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "rgba(59,130,246,0.95)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color =
                        active
                          ? "rgba(59,130,246,0.95)"
                          : "rgba(255,255,255,0.85)";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        lineHeight: 1.1,
                      }}
                    >
                      <Ico />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          letterSpacing: 0.2,
                          textAlign: "center",
                          whiteSpace: "normal",
                          color: "currentColor",
                          opacity: isDisabled ? 0.9 : 1,
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* Mobile keypad */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          padding: "0 8px",
          width: containerSize,
        }}
      >
        {Array.from({ length: size }, (_, i) => i + 1).map((n) => {
          const entered = perDigitCounts[n] ?? 0;
          const isActive = !hardMode && highlightDigit === n;
          const hardModeSymbol = "•";
          const badgeContent = hardMode ? hardModeSymbol : entered;
          return (
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
                transition: "transform 120ms ease, box-shadow 120ms ease",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                lineHeight: 1.05,
                ...(isActive
                  ? {
                      boxShadow:
                        "0 0 0 2px rgba(59,130,246,0.9), 0 6px 24px rgba(59,130,246,0.35)",
                      transform: "translateY(-1px)",
                    }
                  : null),
                ...(showSolvedOverlay
                  ? { opacity: 0.5, cursor: "not-allowed" }
                  : null),
              }}
              onClick={() =>
                !isLoading &&
                !showSolvedOverlay &&
                selected &&
                setCell(selected.r, selected.c, n)
              }
              disabled={isLoading || showSolvedOverlay}
              onMouseEnter={() => {
                if (!hardMode && !showSolvedOverlay) setHighlightDigit(n);
              }}
              onMouseLeave={() => {
                if (!hardMode) setHighlightDigit(0);
              }}
              onFocus={() => {
                if (!hardMode && !showSolvedOverlay) setHighlightDigit(n);
              }}
              onBlur={() => {
                if (!hardMode) setHighlightDigit(0);
              }}
              aria-pressed={isActive}
              aria-label={
                hardMode
                  ? `Digit ${symbolFor(n)}`
                  : `Digit ${symbolFor(n)}. Entered ${entered}`
              }
              title={
                hardMode ? "Count hidden in Hard Mode" : `Entered: ${entered}`
              }
            >
              <span style={{ fontSize: 26, fontWeight: 800 }}>
                {symbolFor(n)}
              </span>
              <span
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  opacity: 0.9,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  padding: "2px 6px",
                  fontWeight: hardMode ? 800 : 600,
                  letterSpacing: hardMode ? 1 : 0,
                }}
              >
                {badgeContent}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toast / hint message */}
      {hintMsg && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            left: "50%",
            bottom: 24,
            transform: "translateX(-50%)",
            padding: "8px 12px",
            borderRadius: 10,
            background: "rgba(2,6,23,0.9)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.95)",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            pointerEvents: "none",
          }}
        >
          {hintMsg}
        </div>
      )}
    </div>
  );
}
