import React from "react";
import {
  generateSudoku,
  type Difficulty as GenDifficulty,
} from "./puzzleGenerator.ts";
import Icons from "./icons";

export type Props = {
  initial?: number[][];
  difficulty?: string;
};

// Map UI label to generator difficulty
function parseDifficulty(d: string | undefined): GenDifficulty {
  const v = String(d ?? "medium").toLowerCase();
  if (v === "16x16") return "16x16";
  if (
    v === "easy" ||
    v === "medium" ||
    v === "hard" ||
    v === "expert" ||
    v === "extreme"
  )
    return v;
  return "medium";
}

// Render value as symbol (1..9, A..G for 10..16)
function symbolFor(v: number) {
  if (v <= 0) return "";
  if (v <= 9) return String(v);
  return String.fromCharCode(55 + v); // 10->A, ... 16->G
}

function deepCopy(g: number[][]) {
  return g.map((r) => r.slice());
}

type Notes = Array<Array<Set<number>>>;
function makeEmptyNotes(size: number): Notes {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => new Set<number>())
  );
}
function copyNotes(notes: Notes): Notes {
  return notes.map((row) => row.map((s) => new Set<number>(s)));
}

// ——— let the shimmer paint before heavy work
const nextFrame = () =>
  new Promise<void>((r) => requestAnimationFrame(() => r()));

export default function SudokuBoard({ initial, difficulty = "Medium" }: Props) {
  const diff = parseDifficulty(difficulty);
  const derivedSize = initial?.length ?? (diff === "16x16" ? 16 : 9);
  const [isLoading, setIsLoading] = React.useState(true);

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

  // Base (generated or provided)
  const [base, setBase] = React.useState<number[][] | null>(null);

  // Generate/adopt base asynchronously so the loader can render
  const loadBase = React.useCallback(async () => {
    setIsLoading(true);
    await nextFrame();

    if (initial && initial.length) {
      setBase(deepCopy(initial));
      setIsLoading(false);
      return;
    }

    const { puzzle } = generateSudoku(diff, {
      ensureDifficulty: true,
      maxAttempts: 50,
    });
    setBase(puzzle);
    setIsLoading(false);
  }, [initial, diff]);

  React.useEffect(() => {
    loadBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, difficulty]);

  // Board state (depends on base)
  const [grid, setGrid] = React.useState<number[][]>([]);
  const [selected, setSelected] = React.useState<{
    r: number;
    c: number;
  } | null>(null);
  const [mistakes, setMistakes] = React.useState(0);
  const [seconds, setSeconds] = React.useState(0);
  const [notes, setNotes] = React.useState<Notes>([]); // kept for history compatibility
  const [pencilMode, setPencilMode] = React.useState(false);

  // NEW — global digit highlight (e.g. from keypad hover)
  const [highlightDigit, setHighlightDigit] = React.useState<number>(0);

  // NEW — controls auto-candidate visibility (Fast Pencil)
  const [showCandidates, setShowCandidates] = React.useState(false);

  // history for undo
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

  // Reset state when base changes
  React.useEffect(() => {
    if (!base) return;
    setGrid(deepCopy(base));
    setNotes(makeEmptyNotes(base.length));
    setMistakes(0);
    setSeconds(0);
    setHistory([]);
    setSelected(null);
    setHighlightDigit(0);
    setShowCandidates(false); // reset overlay on new puzzle
    setPencilMode(false); // reset pencil mode on new puzzle
  }, [base]);

  // Timer
  React.useEffect(() => {
    if (isLoading || !base) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [isLoading, base]);

  const boardRef = React.useRef<HTMLDivElement>(null);

  // --- Helpers ---
  const hasConflict = (g: number[][], r: number, c: number, v: number) => {
    if (v === 0) return false;
    const size = g.length;
    if (g[r].some((x, i) => i !== c && x === v)) return true; // row
    for (let i = 0; i < size; i++) if (i !== r && g[i][c] === v) return true; // col
    const b = size === 16 ? 4 : 3; // box
    const br = Math.floor(r / b) * b;
    const bc = Math.floor(c / b) * b;
    for (let i = br; i < br + b; i++)
      for (let j = bc; j < bc + b; j++)
        if ((i !== r || j !== c) && g[i][j] === v) return true;
    return false;
  };

  const computeCandidates = React.useCallback(
    (g: number[][], r: number, c: number): number[] => {
      const size = g.length;
      if (g[r][c] !== 0) return [];
      const used = new Set<number>();
      for (let j = 0; j < size; j++) used.add(g[r][j]); // row
      for (let i = 0; i < size; i++) used.add(g[i][c]); // col
      const b = size === 16 ? 4 : 3; // box
      const br = Math.floor(r / b) * b;
      const bc = Math.floor(c / b) * b;
      for (let i = br; i < br + b; i++)
        for (let j = bc; j < bc + b; j++) used.add(g[i][j]);
      const res: number[] = [];
      for (let v = 1; v <= size; v++) if (!used.has(v)) res.push(v);
      return res;
    },
    []
  );

  type CellState = "empty" | "given" | "wrong" | "ok";
  const givens = React.useMemo(() => {
    if (!base) return [] as boolean[][];
    return base.map((row) => row.map((v) => v !== 0));
  }, [base]);

  const cellState = React.useMemo<CellState[][]>(() => {
    if (!base) return [] as CellState[][];
    return grid.map((row, r) =>
      row.map((v, c) => {
        if (v === 0) return "empty";
        if (givens[r][c]) return "given";
        return hasConflict(grid, r, c, v) ? "wrong" : "ok";
      })
    );
  }, [grid, givens, base]);

  const placeValue = (r: number, c: number, v: number) => {
    if (!base) return;
    if (givens[r][c]) return;
    setGrid((g) => {
      const copy = g.map((row) => row.slice());
      const size = copy.length;
      if (v < 0 || v > size) return copy;
      if (copy[r][c] === v) return copy;
      pushHistory();
      const conflict = hasConflict(copy, r, c, v);
      copy[r][c] = v;
      setNotes((n) => {
        const nn = copyNotes(n);
        nn[r][c].clear();
        return nn;
      });
      if (v !== 0 && conflict) setMistakes((m) => m + 1);
      return copy;
    });
  };

  const toggleNote = (r: number, c: number, v: number) => {
    if (!base) return;
    if (givens[r][c] || v === 0) return;
    setNotes((n) => {
      const nn = copyNotes(n);
      const s = nn[r][c];
      if (s.has(v)) s.delete(v);
      else s.add(v);
      return nn;
    });
  };

  // Keyboard input (supports 1..9 and A..G for 10..16)
  React.useEffect(() => {
    const el = boardRef.current;
    if (!el || !base || isLoading) return;
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return;
      const { r, c } = selected;
      if (givens[r][c]) return;
      const size = grid.length;
      const k = e.key;
      if (k >= "1" && k <= "9") {
        const val = Number(k);
        if (val <= size) {
          if (pencilMode) toggleNote(r, c, val);
          else placeValue(r, c, val);
        }
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
      } else if (/^[a-gA-G]$/.test(k) && size === 16) {
        const val = k.toUpperCase().charCodeAt(0) - 55; // A=>10
        if (pencilMode) toggleNote(r, c, val);
        else placeValue(r, c, val);
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [selected, givens, grid.length, pencilMode, base, isLoading]);

  const setCell = (r: number, c: number, v: number) => {
    if (pencilMode && v !== 0) toggleNote(r, c, v);
    else placeValue(r, c, v);
  };

  const containerSize = "min(92vw, 700px)";
  const borderColor = "rgba(255,255,255,0.25)";
  const thin = "1px";
  const thick = "2px";

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };

  const size = base?.length ?? derivedSize;
  const box = size === 16 ? 4 : 3;

  // --- Toolbar actions ---
  const eraseSelected = () => {
    if (!base || !selected) return;
    const { r, c } = selected;
    if (givens[r][c]) return;
    placeValue(r, c, 0);
    setNotes((n) => {
      const nn = copyNotes(n);
      nn[r][c].clear();
      return nn;
    });
  };

  // Toggle auto-candidates overlay (does not flip pencilMode)
  const fastPencil = () => {
    setShowCandidates((v) => !v);
  };

  const [hintMsg, setHintMsg] = React.useState<string | null>(null);
  const showHintMsg = (m: string) => {
    setHintMsg(m);
    window.setTimeout(() => setHintMsg(null), 1400);
  };

  // ---------- HINT HELPERS (naked single, hidden single, solver fallback) ----------

  // find a naked single anywhere (optionally prioritize selected first)
  const findNakedSingle = (
    g: number[][],
    prefer?: { r: number; c: number } | null
  ): { r: number; c: number; v: number } | null => {
    const tryCell = (r: number, c: number) => {
      if (g[r][c] !== 0) return null;
      const cand = computeCandidates(g, r, c);
      if (cand.length === 1) return { r, c, v: cand[0] };
      return null;
    };
    if (prefer) {
      const x = tryCell(prefer.r, prefer.c);
      if (x) return x;
    }
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const x = tryCell(r, c);
        if (x) return x;
      }
    }
    return null;
  };

  // hidden single in rows/cols/boxes
  const findHiddenSingle = (
    g: number[][]
  ): { r: number; c: number; v: number } | null => {
    // rows
    for (let r = 0; r < size; r++) {
      const present = new Set<number>(g[r].filter(Boolean));
      for (let v = 1; v <= size; v++) {
        if (present.has(v)) continue;
        let spot: number | null = null;
        for (let c = 0; c < size; c++) {
          if (g[r][c] !== 0) continue;
          const cand = computeCandidates(g, r, c);
          if (cand.includes(v)) {
            if (spot !== null) {
              spot = -1;
              break;
            }
            spot = c;
          }
        }
        if (spot !== null && spot >= 0) return { r, c: spot, v };
      }
    }
    // cols
    for (let c = 0; c < size; c++) {
      const col = g.map((row) => row[c]);
      const present = new Set<number>(col.filter(Boolean));
      for (let v = 1; v <= size; v++) {
        if (present.has(v)) continue;
        let spot: number | null = null;
        for (let r = 0; r < size; r++) {
          if (g[r][c] !== 0) continue;
          const cand = computeCandidates(g, r, c);
          if (cand.includes(v)) {
            if (spot !== null) {
              spot = -1;
              break;
            }
            spot = r;
          }
        }
        if (spot !== null && spot >= 0) return { r: spot, c, v };
      }
    }
    // boxes
    const B = size === 16 ? 4 : 3;
    for (let br = 0; br < size; br += B) {
      for (let bc = 0; bc < size; bc += B) {
        const coords: Array<[number, number]> = [];
        const vals: number[] = [];
        for (let r = br; r < br + B; r++) {
          for (let c = bc; c < bc + B; c++) {
            coords.push([r, c]);
            vals.push(g[r][c]);
          }
        }
        const present = new Set<number>(vals.filter(Boolean));
        for (let v = 1; v <= size; v++) {
          if (present.has(v)) continue;
          let loc: [number, number] | null = null;
          for (const [r, c] of coords) {
            if (g[r][c] !== 0) continue;
            const cand = computeCandidates(g, r, c);
            if (cand.includes(v)) {
              if (loc !== null) {
                loc = [-1, -1];
                break;
              }
              loc = [r, c];
            }
          }
          if (loc && loc[0] >= 0) return { r: loc[0], c: loc[1], v };
        }
      }
    }
    return null;
  };

  // MRV: find empty cell with the fewest candidates
  const findBestEmptyCell = (
    g: number[][]
  ): { r: number; c: number; cand: number[] } | null => {
    let best: { r: number; c: number; cand: number[] } | null = null;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (g[r][c] !== 0) continue;
        const cand = computeCandidates(g, r, c);
        if (cand.length === 0) return { r, c, cand }; // contradiction
        if (!best || cand.length < best.cand.length) best = { r, c, cand };
        if (best.cand.length === 1) return best;
      }
    }
    return best;
  };

  // simple backtracking solver (find ONE solution) using MRV
  const solveOne = (g0: number[][]): number[][] | null => {
    const g = deepCopy(g0);
    const dfs = (): boolean => {
      const cell = findBestEmptyCell(g);
      if (!cell) return true; // solved
      const { r, c, cand } = cell;
      if (cand.length === 0) return false; // contradiction
      for (const v of cand) {
        g[r][c] = v;
        if (dfs()) return true;
        g[r][c] = 0;
      }
      return false;
    };
    return dfs() ? g : null;
  };

  // ---------- applyHint: always finds a move or reports contradiction ----------
  const applyHint = () => {
    if (!base) return;
    const g = grid;

    // 1) Naked single (prioritize selected, then global)
    if (selected) {
      const nsSel = findNakedSingle(g, selected);
      if (nsSel) {
        placeValue(nsSel.r, nsSel.c, nsSel.v);
        showHintMsg("Hint: Naked single");
        return;
      }
    }
    const ns = findNakedSingle(g, null);
    if (ns) {
      placeValue(ns.r, ns.c, ns.v);
      showHintMsg("Hint: Naked single");
      return;
    }

    // 2) Hidden single (row / column / box)
    const hs = findHiddenSingle(g);
    if (hs) {
      placeValue(hs.r, hs.c, hs.v);
      showHintMsg("Hint: Hidden single");
      return;
    }

    // 3) Solver fallback — fill a logically safe cell using the solved board
    const solved = solveOne(g);
    if (!solved) {
      showHintMsg("No hint: current board has a contradiction");
      return;
    }

    // prefer selected cell if it's empty and not a given
    if (
      selected &&
      g[selected.r][selected.c] === 0 &&
      !givens[selected.r][selected.c]
    ) {
      placeValue(selected.r, selected.c, solved[selected.r][selected.c]);
      showHintMsg("Hint: Solved cell");
      return;
    }

    // otherwise pick an MRV cell to fill from the solution
    const cell = findBestEmptyCell(g);
    if (cell) {
      placeValue(cell.r, cell.c, solved[cell.r][cell.c]);
      showHintMsg("Hint: Solved cell");
      return;
    }

    // nothing to do (shouldn't happen)
    showHintMsg("No hint available");
  };

  const resetPuzzle = () => {
    if (!base) return;
    setGrid(deepCopy(base));
    setNotes(makeEmptyNotes(size));
    setMistakes(0);
    setSeconds(0);
    setHistory([]);
    setSelected(null);
    setHighlightDigit(0);
    setShowCandidates(false);
    setPencilMode(false);
  };

  const newPuzzle = async () => {
    if (initial && initial.length) return; // disabled when initial grid is supplied
    setIsLoading(true);
    await nextFrame();
    const { puzzle } = generateSudoku(parseDifficulty(difficulty), {
      ensureDifficulty: true,
      maxAttempts: 50,
    });
    setBase(puzzle);
    setIsLoading(false);
  };

  // ——— Render small digits inside a cell (either user notes OR auto-candidates)
  const MarksGrid: React.FC<{ marks: number[]; activeDigit: number }> = ({
    marks,
    activeDigit,
  }) => {
    const N = size === 16 ? 16 : 9;
    const sub = size === 16 ? 4 : 3;

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          gridTemplateColumns: `repeat(${sub}, 1fr)`,
          gridTemplateRows: `repeat(${sub}, 1fr)`,
          gap: size === 16 ? 1 : 2,
          padding: size === 16 ? 2 : 4,
        }}
      >
        {Array.from({ length: N }, (_, i) => i + 1).map((v) => {
          const visible = marks.includes(v);
          const active = visible && activeDigit > 0 && v === activeDigit;
          return (
            <div
              key={v}
              style={{
                display: "grid",
                placeItems: "center",
                fontSize: size === 16 ? 9 : 12,
                lineHeight: 1,
                visibility: visible ? "visible" : "hidden",
                color: visible ? "rgba(255,255,255,0.92)" : "transparent",
                fontWeight: active ? 900 : 600,
                textShadow: active
                  ? "0 0 10px rgba(59,130,246,0.95), 0 0 18px rgba(59,130,246,0.75)"
                  : "none",
                transform: active ? "scale(1.12)" : "none",
                borderRadius: 6,
                padding: size === 16 ? "1px 0" : "2px 0",
                background: active ? "rgba(59,130,246,0.28)" : "transparent",
              }}
            >
              {symbolFor(v)}
            </div>
          );
        })}
      </div>
    );
  };

  // --- Highlighting logic
  const selectedDigit = React.useMemo(() => {
    if (!selected) return 0;
    const v = grid[selected.r][selected.c];
    return v > 0 ? v : 0;
  }, [selected, grid]);

  // Prefer explicit highlight (from keypad hover) over selected cell
  const activeDigit = highlightDigit || selectedDigit;

  // marks to show in an EMPTY cell:
  //  - if pencilMode => user's notes
  //  - else if showCandidates => auto-computed candidates
  //  - else => none
  const getMarks = (r: number, c: number): number[] => {
    if (grid[r][c] !== 0) return [];
    if (pencilMode) return Array.from(notes[r][c]).sort((a, b) => a - b);
    if (showCandidates) return computeCandidates(grid, r, c);
    return [];
  };

  const label =
    diff === "16x16"
      ? "16×16"
      : String(difficulty).trim().length
        ? String(difficulty)
        : "Medium";

  // ——— LOADING UI
  const LoadingBoard: React.FC<{ size: number; label: string }> = ({
    size,
    label,
  }) => {
    const b = size === 16 ? 4 : 3;
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
            Generating {label} puzzle…
          </div>
        </div>
      </div>
    );
  };

  // ——— RENDER ———
  if (isLoading || !base) {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        {/* Loading layout: header sits above the board ONLY (left column), no icons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `${containerSize} 64px`,
            gap: 16,
            alignItems: "start",
            justifyContent: "center",
          }}
        >
          {/* LEFT: header + board */}
          <div style={{ display: "grid", gap: 16 }}>
            {/* Top info bar — text only */}
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
              <div style={{ justifySelf: "start", opacity: 0.6 }}>
                Mistakes: —
              </div>
              <div style={{ justifySelf: "center", opacity: 0.95 }}>
                {String(difficulty).toUpperCase()} • generating…
              </div>
              <div style={{ justifySelf: "end", opacity: 0.6 }}>
                Time: --:--
              </div>
            </div>

            <LoadingBoard size={derivedSize} label={label} />
          </div>

          {/* RIGHT: toolbar skeleton */}
          <div
            style={{
              height: containerSize, // exactly the board’s height
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-evenly", // evenly spaced from top to bottom
              padding: 0, // avoid adding height
              userSelect: "none",
              overflow: "hidden", // protect from accidental overflow
            }}
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 74,
                  height: 74,
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
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Main layout: header sits above the board ONLY (left column), no icons in header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${containerSize} 64px`,
          gap: 16,
          alignItems: "start",
          justifyContent: "center",
        }}
      >
        {/* LEFT: header + board */}
        <div style={{ display: "grid", gap: 16 }}>
          {/* Top info bar — text only */}
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
              {String(difficulty).toUpperCase()}
              {pencilMode ? " • Pencil" : ""}
              {showCandidates ? " • Fast Pencil" : ""}
            </div>
            <div style={{ justifySelf: "end", opacity: 0.9 }}>
              Time: {formatTime(seconds)}
            </div>
          </div>

          {/* Board */}
          <div
            ref={boardRef}
            tabIndex={0}
            onClick={() => boardRef.current?.focus()}
            style={{
              outline: "none",
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
                const thickRight = (c + 1) % box === 0 && c !== size - 1;
                const thickBottom = (r + 1) % box === 0 && r !== size - 1;

                const given = givens[r][c];
                const state = cellState[r][c];
                const selectedCell = selected?.r === r && selected?.c === c;

                // Prefer activeDigit (keypad hover) to selected-digit match
                const isActiveSameNumber =
                  activeDigit > 0 && val === activeDigit;

                // halo disabled
                const cellHasActiveCandidate = false;

                let bg = "rgba(255,255,255,0.04)"; // default
                if (state === "wrong") {
                  bg = selectedCell
                    ? "rgba(239,68,68,0.45)"
                    : "rgba(239,68,68,0.35)";
                } else if (isActiveSameNumber) {
                  bg = "rgba(59,130,246,0.35)"; // same number
                } else if (selectedCell) {
                  bg = "rgba(59,130,246,0.25)"; // selected only
                } else if (cellHasActiveCandidate) {
                  bg = "rgba(59,130,246,0.18)"; // candidate halo
                }

                const numberColor = isActiveSameNumber
                  ? "rgba(255,255,255,0.98)"
                  : "rgba(255,255,255,0.78)";

                const insetRing =
                  cellHasActiveCandidate && !selectedCell && state !== "wrong"
                    ? size === 16
                      ? "inset 0 0 0 1.5px rgba(59,130,246,0.65)"
                      : "inset 0 0 0 2px rgba(59,130,246,0.65)"
                    : "none";

                const sameNumberGlow = isActiveSameNumber
                  ? "0 0 14px rgba(59,130,246,0.85)"
                  : "none";

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => setSelected({ r, c })}
                    style={{
                      display: "grid",
                      placeItems: "center",
                      fontSize:
                        size === 16
                          ? "clamp(12px, 2.4vw, 20px)"
                          : "clamp(18px, 3.2vw, 28px)",
                      fontWeight: given ? 700 : 600,
                      color: numberColor,
                      background: bg,
                      borderRight: `${thickRight ? thick : thin} solid ${borderColor}`,
                      borderBottom: `${thickBottom ? thick : thin} solid ${borderColor}`,
                      transition:
                        "background-color 120ms ease, box-shadow 120ms ease, transform 120ms ease",
                      position: "relative",
                      boxShadow: `${insetRing}, ${sameNumberGlow}`,
                    }}
                  >
                    {val !== 0
                      ? symbolFor(val)
                      : (() => {
                          const marks = getMarks(r, c);
                          return marks.length ? (
                            <MarksGrid
                              marks={marks}
                              activeDigit={activeDigit}
                            />
                          ) : null;
                        })()}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: toolbar */}
        <div
          style={{
            height: containerSize, // exactly the board’s height
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-evenly", // evenly spaced from top to bottom
            padding: 0, // avoid adding height
            userSelect: "none",
            overflow: "hidden", // protect from accidental overflow
          }}
        >
          {[
            {
              key: "undo",
              title: "Undo",
              onClick: popHistory,
              Icon: Icons.Undo,
              disabled: history.length === 0,
            },
            {
              key: "erase",
              title: "Erase",
              onClick: eraseSelected,
              Icon: Icons.Eraser,
              disabled:
                !selected || (selected && givens[selected.r][selected.c]),
            },
            {
              key: "pencil",
              title: pencilMode ? "Exit Pencil" : "Pencil",
              onClick: () => setPencilMode((v) => !v),
              Icon: Icons.Pencil,
              active: pencilMode,
            },
            {
              key: "fastp",
              title: "Fast Pencil",
              onClick: fastPencil,
              Icon: Icons.Sparkles,
              active: showCandidates,
            },
            {
              key: "hint",
              title: "Hint",
              onClick: applyHint,
              Icon: Icons.Bulb,
            },
            {
              key: "reset",
              title: "Reset",
              onClick: resetPuzzle,
              Icon: Icons.Reset,
            },
            {
              key: "new",
              title:
                initial && initial.length
                  ? "New Game (disabled for initial puzzles)"
                  : "New Game",
              onClick: newPuzzle,
              Icon: Icons.Dice,
              disabled: !!(initial && initial.length),
            },
          ].map(({ key, title, onClick, Icon: Ico, disabled, active }) => (
            <button
              key={key}
              aria-label={title}
              title={title}
              onClick={onClick}
              disabled={!!disabled || isLoading}
              style={{
                width: 74,
                height: 74,
                border: "none",
                background: "transparent",
                color: "rgba(255, 255, 255, 0.42)",
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
                ...(disabled || isLoading
                  ? { opacity: 0.4, cursor: "not-allowed" }
                  : null),
              }}
              onMouseEnter={(e) => {
                if (disabled || isLoading) return;
                (e.currentTarget as HTMLButtonElement).style.color =
                  "rgba(59,130,246,0.95)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = active
                  ? "rgba(59,130,246,0.95)"
                  : "rgba(255,255,255,0.85)";
              }}
            >
              <Ico />
            </button>
          ))}
        </div>
      </div>

      {/* Mobile keypad */}
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          flexWrap: "wrap",
          maxWidth: `calc(${containerSize} + 64px)`,
          margin: "0 auto",
        }}
      >
        {Array.from({ length: size }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            style={{
              padding: "10px 0",
              width: 40,
              borderRadius: 10,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "white",
              fontSize: 16,
              cursor: "pointer",
              transition: "transform 120ms ease, box-shadow 120ms ease",
              ...(highlightDigit === n
                ? {
                    boxShadow:
                      "0 0 0 2px rgba(59,130,246,0.9), 0 4px 20px rgba(59,130,246,0.35)",
                    transform: "translateY(-1px)",
                  }
                : null),
            }}
            onClick={() =>
              !isLoading && selected && setCell(selected.r, selected.c, n)
            }
            disabled={isLoading}
            onMouseEnter={() => setHighlightDigit(n)}
            onMouseLeave={() => setHighlightDigit(0)}
            onFocus={() => setHighlightDigit(n)}
            onBlur={() => setHighlightDigit(0)}
            aria-pressed={highlightDigit === n}
          >
            {symbolFor(n)}
          </button>
        ))}
        <button
          style={{
            padding: "10px 0",
            width: 72,
            borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "white",
            fontSize: 16,
            cursor: "pointer",
            transition: "transform 120ms ease, box-shadow 120ms ease",
          }}
          onClick={() =>
            !isLoading && selected && setCell(selected.r, selected.c, 0)
          }
          disabled={isLoading}
          onMouseEnter={() => setHighlightDigit(0)}
          onMouseLeave={() => setHighlightDigit(0)}
        >
          Clear
        </button>
        <button
          style={{
            padding: "10px 0",
            width: 72,
            borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "white",
            fontSize: 16,
            cursor: "pointer",
            transition: "transform 120ms ease, box-shadow 120ms ease",
          }}
          onClick={resetPuzzle}
          disabled={isLoading}
          onMouseEnter={() => setHighlightDigit(0)}
          onMouseLeave={() => setHighlightDigit(0)}
        >
          Reset
        </button>
        {!initial && (
          <button
            style={{
              padding: "10px 0",
              width: 110,
              borderRadius: 10,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "white",
              fontSize: 16,
              cursor: "pointer",
              transition: "transform 120ms ease, box-shadow 120ms ease",
            }}
            onClick={newPuzzle}
            disabled={isLoading}
            onMouseEnter={() => setHighlightDigit(0)}
            onMouseLeave={() => setHighlightDigit(0)}
          >
            New Puzzle
          </button>
        )}
      </div>

      <p style={{ textAlign: "center", opacity: 0.7, marginTop: -8 }}>
        Click a cell, type 1–9{size === 16 ? " or A–G" : ""} (Backspace/Delete
        to clear), or use the keypad. Hover a keypad number to spotlight that
        digit. Use <strong>Pencil</strong> to edit your own notes. Toggle{" "}
        <strong>Fast Pencil</strong> to show/hide auto candidates.
        {pencilMode ? " Pencil mode is ON (taps toggle notes)." : ""}
      </p>
      {hintMsg && (
        <p style={{ textAlign: "center", opacity: 0.8 }}>{hintMsg}</p>
      )}
    </div>
  );
}
