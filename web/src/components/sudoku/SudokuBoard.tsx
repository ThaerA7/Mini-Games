import React from "react";
import {
  generateSudoku,
  type Difficulty as GenDifficulty,
  // isUniquelySolvable,
} from "./puzzleGenerator.ts";


export type Props = {
  initial?: number[][];
  difficulty?: string;
};

// Map UI label to generator difficulty
function parseDifficulty(d: string | undefined): GenDifficulty {
  const v = String(d ?? "medium").toLowerCase();
  if (v === "16x16") return "16x16";
  if (v === "easy" || v === "medium" || v === "hard" || v === "expert" || v === "extreme")
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
  return Array.from({ length: size }, () => Array.from({ length: size }, () => new Set<number>()));
}
function copyNotes(notes: Notes): Notes {
  return notes.map((row) => row.map((s) => new Set<number>(s)));
}

// ——— let the shimmer paint before heavy work
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

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

    const { puzzle } = generateSudoku(diff, { ensureDifficulty: true, maxAttempts: 50 });
    setBase(puzzle);
    setIsLoading(false);
  }, [initial, diff]);

  React.useEffect(() => {
    loadBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, difficulty]);

  // Board state (depends on base)
  const [grid, setGrid] = React.useState<number[][]>([]);
  const [selected, setSelected] = React.useState<{ r: number; c: number } | null>(null);
  const [mistakes, setMistakes] = React.useState(0);
  const [seconds, setSeconds] = React.useState(0);
  const [notes, setNotes] = React.useState<Notes>([]); // kept for history compatibility
  const [pencilMode, setPencilMode] = React.useState(false);

  // NEW — global digit highlight (e.g. from keypad hover)
  const [highlightDigit, setHighlightDigit] = React.useState<number>(0);

  // history for undo
  type Snapshot = { grid: number[][]; notes: Notes; mistakes: number };
  const [history, setHistory] = React.useState<Snapshot[]>([]);
  const pushHistory = React.useCallback(() => {
    setHistory((h) => [...h, { grid: deepCopy(grid), notes: copyNotes(notes), mistakes }]);
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
      for (let j = bc; j < bc + b; j++) if ((i !== r || j !== c) && g[i][j] === v) return true;
    return false;
  };

  const computeCandidates = React.useCallback((g: number[][], r: number, c: number): number[] => {
    const size = g.length;
    if (g[r][c] !== 0) return [];
    const used = new Set<number>();
    for (let j = 0; j < size; j++) used.add(g[r][j]); // row
    for (let i = 0; i < size; i++) used.add(g[i][c]); // col
    const b = size === 16 ? 4 : 3; // box
    const br = Math.floor(r / b) * b;
    const bc = Math.floor(c / b) * b;
    for (let i = br; i < br + b; i++) for (let j = bc; j < bc + b; j++) used.add(g[i][j]);
    const res: number[] = [];
    for (let v = 1; v <= size; v++) if (!used.has(v)) res.push(v);
    return res;
  }, []);

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

  const keypadBtn: React.CSSProperties = {
    padding: "10px 0",
    width: 40,
    borderRadius: 10,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "white",
    fontSize: 16,
    cursor: "pointer",
    transition: "transform 120ms ease, box-shadow 120ms ease",
  };

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

  const fastPencil = () => {
    if (!base) return;
    setNotes((n) => {
      const nn = copyNotes(n);
      const g = grid;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (g[r][c] === 0) {
            const cand = computeCandidates(g, r, c);
            nn[r][c] = new Set(cand);
          } else {
            nn[r][c].clear();
          }
        }
      }
      return nn;
    });
    setPencilMode(true);
  };

  const [hintMsg, setHintMsg] = React.useState<string | null>(null);
  const showHintMsg = (m: string) => {
    setHintMsg(m);
    window.setTimeout(() => setHintMsg(null), 1200);
  };

  const applyHint = () => {
    if (!base) return;
    const g = grid;
    const singles: Array<{ r: number; c: number; v: number }> = [];
    const checkCell = (r: number, c: number) => {
      if (g[r][c] !== 0) return;
      const cand = computeCandidates(g, r, c);
      if (cand.length === 1) singles.push({ r, c, v: cand[0] });
    };
    if (selected) checkCell(selected.r, selected.c);
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) checkCell(r, c);
    if (singles.length) {
      const { r, c, v } = singles[0];
      placeValue(r, c, v);
      showHintMsg("Hint placed");
    } else {
      showHintMsg("No simple hints right now");
    }
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
  };

  const newPuzzle = async () => {
    if (initial && initial.length) return; // disabled when initial grid is supplied
    setIsLoading(true);
    await nextFrame();
    const { puzzle } = generateSudoku(parseDifficulty(difficulty), { ensureDifficulty: true, maxAttempts: 50 });
    setBase(puzzle);
    setIsLoading(false);
  };

  // --- Simple inline SVG icons
  const iconBtn: React.CSSProperties = {
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
  };
  const Icon = {
    Undo: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M7 7H3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 11a9 9 0 1 0 3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    Eraser: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 17l7-7 7 7-3 3H6l-3-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M14 7l2-2 5 5-2 2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
    Pencil: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 21l3-1 11-11-2-2L4 18l-1 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M14 4l2-2 4 4-2 2-4-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
    Sparkles: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M5 12l2-2-2-2 2-2 2 2 2-2 2 2-2 2 2 2-2 2-2-2-2 2-2-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M17 7l1-3 1 3 3 1-3 1-1 3-1-3-3-1 3-1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
    Bulb: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M9 18h6M8 22h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 2a7 7 0 0 0-4 13c.4.4 1 1.3 1 2h6c0-.7.6-1.6 1-2a7 7 0 0 0-4-13z" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    Reset: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M21 12a9 9 0 1 1-3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M21 3v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    Dice: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
      </svg>
    ),
  };

  // ——— Always-on candidates with clearer highlighting
  const NotesGrid: React.FC<{ r: number; c: number; activeDigit: number }> = ({ r, c, activeDigit }) => {
    const N = size === 16 ? 16 : 9;
    const sub = size === 16 ? 4 : 3;
    const cand = computeCandidates(grid, r, c);
    const isCand = (v: number) => cand.includes(v);
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
          const active = activeDigit > 0 && v === activeDigit && isCand(v);
          return (
            <div
              key={v}
              style={{
                display: "grid",
                placeItems: "center",
                fontSize: size === 16 ? 9 : 12,
                lineHeight: 1,
                visibility: isCand(v) ? "visible" : "hidden",
                color: isCand(v) ? "rgba(255,255,255,0.92)" : "transparent",
                fontWeight: active ? 900 : 600,
                textShadow: active ? "0 0 10px rgba(59,130,246,0.95), 0 0 18px rgba(59,130,246,0.75)" : "none",
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

  // ——— LOADING UI
  const LoadingBoard: React.FC<{ size: number; label: string }> = ({ size, label }) => {
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

  // --- Highlighting logic
  const selectedDigit = React.useMemo(() => {
    if (!selected) return 0;
    const v = grid[selected.r][selected.c];
    return v > 0 ? v : 0;
  }, [selected, grid]);

  // Prefer explicit highlight (from keypad hover) over selected cell
  const activeDigit = highlightDigit || selectedDigit;

  const label = diff === "16x16" ? "16×16" : String(difficulty).trim().length ? String(difficulty) : "Medium";

  if (isLoading || !base) {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        {/* Top info bar (loading) */}
        <div
          style={{
            width: `calc(${containerSize} + 64px)`,
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            color: "rgba(255,255,255,0.95)",
            fontWeight: 600,
            letterSpacing: 0.3,
            userSelect: "none",
            margin: "0 auto",
          }}
        >
          <div style={{ justifySelf: "start", opacity: 0.6 }}>Mistakes: —</div>
          <div style={{ justifySelf: "center", opacity: 0.95 }}>{String(difficulty).toUpperCase()} • generating…</div>
          <div style={{ justifySelf: "end", opacity: 0.6 }}>⏱ --:--</div>
        </div>

        {/* Loading board + disabled toolbar spacer */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `${containerSize} 64px`,
            gap: 16,
            alignItems: "start",
            justifyContent: "center",
          }}
        >
          <LoadingBoard size={derivedSize} label={label} />
          <div
            style={{
              height: containerSize,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 0",
              userSelect: "none",
              opacity: 0.35,
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
      {/* Top info bar */}
      <div
        style={{
          width: `calc(${containerSize} + 64px)`,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          color: "rgba(255,255,255,0.95)",
          fontWeight: 600,
          letterSpacing: 0.3,
          userSelect: "none",
          margin: "0 auto",
        }}
      >
        <div style={{ justifySelf: "start", opacity: 0.9 }}>Mistakes: {mistakes}</div>
        <div style={{ justifySelf: "center", opacity: 0.95 }}>
          {String(difficulty).toUpperCase()} {pencilMode ? " • ✎ Pencil" : ""}
        </div>
        <div style={{ justifySelf: "end", opacity: 0.9 }}>⏱ {formatTime(seconds)}</div>
      </div>

      {/* Board + Right Toolbar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${containerSize} 64px`,
          gap: 16,
          alignItems: "start",
          justifyContent: "center",
        }}
      >
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
              const isActiveSameNumber = activeDigit > 0 && val === activeDigit;

              // If empty and this cell can take the activeDigit, give the whole cell a subtle halo
              const cellHasActiveCandidate = false; // disabled: don't highlight whole cell when digit is a candidate

              let bg = "rgba(255,255,255,0.04)"; // default
              if (state === "wrong") {
                bg = selectedCell ? "rgba(239,68,68,0.45)" : "rgba(239,68,68,0.35)";
              } else if (isActiveSameNumber) {
                bg = "rgba(59,130,246,0.35)"; // same number
              } else if (selectedCell) {
                bg = "rgba(59,130,246,0.25)"; // selected only
              } else if (cellHasActiveCandidate) {
                bg = "rgba(59,130,246,0.18)"; // candidate halo
              }

              const numberColor = isActiveSameNumber ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.78)";

              const insetRing = cellHasActiveCandidate && !selectedCell && state !== "wrong"
                ? (size === 16 ? "inset 0 0 0 1.5px rgba(59,130,246,0.65)" : "inset 0 0 0 2px rgba(59,130,246,0.65)")
                : "none";

              const sameNumberGlow = isActiveSameNumber ? "0 0 14px rgba(59,130,246,0.85)" : "none";

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => setSelected({ r, c })}
                  style={{
                    display: "grid",
                    placeItems: "center",
                    fontSize: size === 16 ? "clamp(12px, 2.4vw, 20px)" : "clamp(18px, 3.2vw, 28px)",
                    fontWeight: given ? 700 : 600,
                    color: numberColor,
                    background: bg,
                    borderRight: `${thickRight ? thick : thin} solid ${borderColor}`,
                    borderBottom: `${thickBottom ? thick : thin} solid ${borderColor}`,
                    transition: "background-color 120ms ease, box-shadow 120ms ease, transform 120ms ease",
                    position: "relative",
                    boxShadow: `${insetRing}, ${sameNumberGlow}`,
                  }}
                >
                  {val !== 0 ? (
                    symbolFor(val)
                  ) : (
                    <NotesGrid r={r} c={c} activeDigit={activeDigit} />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right-side Icons */}
        <div
          style={{
            height: containerSize,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 0",
            userSelect: "none",
          }}
        >
          {[
            { key: "undo", title: "Undo", onClick: popHistory, Icon: Icon.Undo, disabled: history.length === 0 },
            { key: "erase", title: "Erase", onClick: eraseSelected, Icon: Icon.Eraser, disabled: !selected || (selected && givens[selected.r][selected.c]) },
            { key: "pencil", title: pencilMode ? "Exit Pencil" : "Pencil", onClick: () => setPencilMode((v) => !v), Icon: Icon.Pencil, active: pencilMode },
            { key: "fastp", title: "Fast Pencil", onClick: fastPencil, Icon: Icon.Sparkles },
            { key: "hint", title: "Hint", onClick: applyHint, Icon: Icon.Bulb },
            { key: "reset", title: "Reset", onClick: resetPuzzle, Icon: Icon.Reset },
            { key: "new", title: initial && initial.length ? "New Game (disabled for initial puzzles)" : "New Game", onClick: newPuzzle, Icon: Icon.Dice, disabled: !!(initial && initial.length) },
          ].map(({ key, title, onClick, Icon: Ico, disabled, active }) => (
            <button
              key={key}
              aria-label={title}
              title={title}
              onClick={onClick}
              disabled={!!disabled || isLoading}
              style={{
                ...iconBtn,
                ...(active ? { color: "rgba(59,130,246,0.95)" } : null),
                ...((disabled || isLoading) ? { opacity: 0.4, cursor: "not-allowed" } : null),
              }}
              onMouseEnter={(e) => {
                if (disabled || isLoading) return;
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(59,130,246,0.95)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = active ? "rgba(59,130,246,0.95)" : "rgba(255,255,255,0.85)";
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
              ...keypadBtn,
              ...(highlightDigit === n ? { boxShadow: "0 0 0 2px rgba(59,130,246,0.9), 0 4px 20px rgba(59,130,246,0.35)", transform: "translateY(-1px)" } : null),
            }}
            onClick={() => !isLoading && selected && setCell(selected.r, selected.c, n)}
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
          style={{ ...keypadBtn, width: 72 }}
          onClick={() => !isLoading && selected && setCell(selected.r, selected.c, 0)}
          disabled={isLoading}
          onMouseEnter={() => setHighlightDigit(0)}
          onMouseLeave={() => setHighlightDigit(0)}
        >
          Clear
        </button>
        <button
          style={{ ...keypadBtn, width: 72 }}
          onClick={resetPuzzle}
          disabled={isLoading}
          onMouseEnter={() => setHighlightDigit(0)}
          onMouseLeave={() => setHighlightDigit(0)}
        >
          Reset
        </button>
        {!initial && (
          <button
            style={{ ...keypadBtn, width: 110 }}
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
        Click a cell, type 1–9{size === 16 ? " or A–G" : ""} (Backspace/Delete to clear), or use the keypad. Hover a keypad number to spotlight candidate digits (no cell highlight).
        {pencilMode ? " Pencil mode is ON (taps toggle notes)." : ""}
      </p>
      {hintMsg && <p style={{ textAlign: "center", opacity: 0.8 }}>{hintMsg}</p>}
    </div>
  );
}
