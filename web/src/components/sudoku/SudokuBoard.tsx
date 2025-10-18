// SudokuBoard.tsx
import React from "react";
import {
  generateSudoku,
  type Difficulty as GenDifficulty,
} from "./puzzleGenerator.ts";
import Icons from "./icons";

import {
  parseDifficulty,
  symbolFor,
  deepCopy,
  makeEmptyNotes,
  copyNotes,
  type Notes,
  hasConflict,
  computeCandidates,
  nextFrame,
} from "./sudokuUtils";

import {
  solveOne,
  findNakedSingle,
  findHiddenSingle,
  findBestEmptyCell,
} from "./sudokuSolver";

export type Props = {
  initial?: number[][];
  difficulty?: string;
};

type CellState = "empty" | "given" | "wrong" | "ok";

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

  // keep one solved grid for solution-aware "wrong" detection
  const [solution, setSolution] = React.useState<number[][] | null>(null);

  // Track solved + overlay state
  const [isSolved, setIsSolved] = React.useState(false);
  const [showSolvedOverlay, setShowSolvedOverlay] = React.useState(false);

  // Hints used
  const [hintsUsed, setHintsUsed] = React.useState(0);

  // Generate/adopt base asynchronously so the loader can render
  const loadBase = React.useCallback(async () => {
    setIsLoading(true);
    await nextFrame();

    if (initial && initial.length) {
      const copy = deepCopy(initial);
      setBase(copy);
      const solved = solveOne(copy);
      setSolution(solved);
      setIsLoading(false);
      return;
    }

    const { puzzle } = generateSudoku(diff as GenDifficulty, {
      ensureDifficulty: true,
      maxAttempts: 80,
    });
    setBase(puzzle);
    const solved = solveOne(puzzle);
    setSolution(solved);
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
  const [notes, setNotes] = React.useState<Notes>([]);
  const [pencilMode, setPencilMode] = React.useState(false);

  // global digit highlight (e.g. from keypad hover)
  const [highlightDigit, setHighlightDigit] = React.useState<number>(0);

  // controls auto-candidate visibility (Fast Pencil)
  const [showCandidates, setShowCandidates] = React.useState(false);

  // Hard Mode — disables highlights, fast pencil, and wrong indications
  const [hardMode, setHardMode] = React.useState(false);

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
    setShowCandidates(false);
    setPencilMode(false);
    setIsSolved(false);
    setShowSolvedOverlay(false);
    setHintsUsed(0);
    // keep hardMode as user preference across games
  }, [base]);

  // Timer — stop when solved
  React.useEffect(() => {
    if (isLoading || !base || isSolved) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [isLoading, base, isSolved]);

  const boardRef = React.useRef<HTMLDivElement>(null);

  const givens = React.useMemo(() => {
    if (!base) return [] as boolean[][];
    return base.map((row) => row.map((v) => v !== 0));
  }, [base]);

  // Count of user-entered cells (non-givens that are non-zero)
  const entriesCount = React.useMemo(() => {
    if (!base || !grid.length) return 0;
    let count = 0;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid.length; c++) {
        if (grid[r][c] !== 0) count++; // count givens + user entries
      }
    }
    return count;
  }, [grid, base]);

  // Per-digit counts of user-entered numbers (for keypad badges)
  const perDigitCounts = React.useMemo(() => {
    const sizeLocal = base?.length ?? derivedSize;
    const counts = Array.from({ length: sizeLocal + 1 }, () => 0);
    if (!grid.length) return counts;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid.length; c++) {
        const v = grid[r][c];
        if (v > 0) counts[v] += 1; // include givens
      }
    }
    return counts;
  }, [grid, base, derivedSize]);

  // solution-aware "wrong" detection (disabled in Hard Mode)
  const cellState = React.useMemo<CellState[][]>(() => {
    if (!base) return [] as CellState[][];
    if (hardMode) {
      return grid.map((row, r) =>
        row.map((v, c) => {
          if (v === 0) return "empty";
          if (givens[r][c]) return "given";
          return "ok";
        })
      );
    }
    return grid.map((row, r) =>
      row.map((v, c) => {
        if (v === 0) return "empty";
        if (givens[r][c]) return "given";
        const wrongBySolution = solution ? solution[r][c] !== v : false;
        const wrongByConflict = hasConflict(grid, r, c, v);
        return wrongBySolution || wrongByConflict ? "wrong" : "ok";
      })
    );
  }, [grid, givens, base, solution, hardMode]);

  // Detect solved board and open overlay only on transition to solved
  React.useEffect(() => {
    if (!base || !grid.length) return;

    // Any zeros => not solved
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid.length; c++) {
        if (grid[r][c] === 0) {
          if (isSolved) {
            setIsSolved(false);
            setShowSolvedOverlay(false);
          }
          return;
        }
      }
    }

    let solvedFlag = true;
    if (solution) {
      solvedFlag = grid.every((row, r) => row.every((v, c) => v === solution[r][c]));
    } else {
      outer: for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid.length; c++) {
          const v = grid[r][c];
          if (v === 0 || hasConflict(grid, r, c, v)) { solvedFlag = false; break outer; }
        }
      }
    }

    if (solvedFlag && !isSolved) {
      setIsSolved(true);
      setShowSolvedOverlay(true);
    } else if (!solvedFlag && isSolved) {
      setIsSolved(false);
      setShowSolvedOverlay(false);
    }
  }, [grid, base, solution, isSolved]);

  const placeValue = (r: number, c: number, v: number) => {
    if (!base || isSolved) return;
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

      if (!hardMode) {
        if (v !== 0 && conflict) setMistakes((m) => m + 1);
      }

      return copy;
    });
  };

  const toggleNote = (r: number, c: number, v: number) => {
    if (!base || isSolved) return;
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
      if (isSolved) return;
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
  }, [selected, givens, grid.length, pencilMode, base, isLoading, isSolved]);

  const setCell = (r: number, c: number, v: number) => {
    if (pencilMode && v !== 0) toggleNote(r, c, v);
    else placeValue(r, c, v);
  };

  const containerSize = "min(92vw, 700px)";
  // TOTAL layout width = board (containerSize) + gap (16px) + tools (74px)
  const layoutWidth = `calc(${containerSize} + 16px + 74px)`;

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
    if (!base || !selected || isSolved) return;
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
    if (hardMode || isSolved) return;
    setShowCandidates((v) => !v);
  };

  // Toggle Hard Mode
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

  // ---------- Hints ----------
  const applyHint = () => {
    if (!base) return;
    if (hardMode) {
      showHintMsg("Hints are disabled in Hard Mode");
      return;
    }
    if (isSolved) return;

    const g = grid;

    if (selected) {
      const nsSel = findNakedSingle(g, selected);
      if (nsSel) {
        placeValue(nsSel.r, nsSel.c, nsSel.v);
        setHintsUsed((u) => u + 1);
        showHintMsg("Hint: Naked single");
        return;
      }
    }
    const ns = findNakedSingle(g, null);
    if (ns) {
      placeValue(ns.r, ns.c, ns.v);
      setHintsUsed((u) => u + 1);
      showHintMsg("Hint: Naked single");
      return;
    }

    const hs = findHiddenSingle(g);
    if (hs) {
      placeValue(hs.r, hs.c, hs.v);
      setHintsUsed((u) => u + 1);
      showHintMsg("Hint: Hidden single");
      return;
    }

    const solved = solution ?? solveOne(g);
    if (!solved) {
      showHintMsg("No hint: current board has a contradiction");
      return;
    }

    if (
      selected &&
      g[selected.r][selected.c] === 0 &&
      !givens[selected.r][selected.c]
    ) {
      placeValue(selected.r, selected.c, solved[selected.r][selected.c]);
      setHintsUsed((u) => u + 1);
      showHintMsg("Hint: Solved cell");
      return;
    }

    const cell = findBestEmptyCell(g);
    if (cell) {
      placeValue(cell.r, cell.c, solved[cell.r][cell.c]);
      setHintsUsed((u) => u + 1);
      showHintMsg("Hint: Solved cell");
      return;
    }

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
    setIsSolved(false);
    setShowSolvedOverlay(false);
    setHintsUsed(0);
  };

  const newPuzzle = async () => {
    setIsLoading(true);
    await nextFrame();
    const { puzzle } = generateSudoku(
      parseDifficulty(difficulty) as GenDifficulty,
      {
        ensureDifficulty: true,
        maxAttempts: 80,
      }
    );
    setBase(puzzle);
    const solved = solveOne(puzzle);
    setSolution(solved);
    setIsLoading(false);
    setIsSolved(false);
    setShowSolvedOverlay(false);
    setHintsUsed(0);
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

  const activeDigit = hardMode ? 0 : highlightDigit || selectedDigit;

  const getMarks = (r: number, c: number): number[] => {
    if (grid[r][c] !== 0) return [];
    if (hardMode) return [];
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

  // --- Align toolbar with board (not header)
  const headerRef = React.useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = React.useState(0);
  React.useLayoutEffect(() => {
    const update = () =>
      setHeaderHeight(headerRef.current?.getBoundingClientRect().height ?? 0);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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
            <div style={{ justifySelf: "start", display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', opacity: 0.9 }}>
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
              {String(difficulty).toUpperCase()}
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
          <div style={{ position: "relative", width: containerSize, height: containerSize }}>
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
                borderRadius: 12,
                border: `1px solid ${borderColor}`,
                boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
                overflow: "hidden",
                userSelect: "none",
                filter: showSolvedOverlay ? "blur(4px) saturate(0.8) brightness(0.9)" : "none",
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
                  const cellHasActiveCandidate = false;

                  let bg = "rgba(255,255,255,0.04)";
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

                  const givenColor = "rgba(147, 197, 253, 0.95)"; // blue-300-ish
                  const entryColor = "rgba(255,255,255,0.78)";
                  const baseNumberColor = given ? givenColor : entryColor;
                  const numberColor = isActiveSameNumber
                    ? "rgba(255,255,255,0.98)"
                    : baseNumberColor;

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
                        // Bigger board numbers
                        fontSize:
                          size === 16
                            ? "clamp(13px, 2.7vw, 22px)"
                            : "clamp(20px, 3.6vw, 30px)",
                        fontWeight: given ? 800 : 600,
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

            {/* SOLVED OVERLAY */}
            {showSolvedOverlay && (
              <div
                role="dialog"
                aria-label="Sudoku solved summary"
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
                  {/* Badge */}
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

                  <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 0.2 }}>
                    Puzzle Solved!
                  </div>
                  <div style={{ opacity: 0.85, marginTop: 4, fontSize: 13 }}>
                    Great job finishing this {label} Sudoku.
                  </div>

                  {/* Stats */}
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
                    {[{
                      k: "time",
                      name: "Time",
                      val: formatTime(seconds),
                    }, {
                      k: "mistakes",
                      name: "Mistakes",
                      val: String(mistakes),
                    }, {
                      k: "hints",
                      name: "Hints",
                      val: String(hintsUsed),
                    }, {
                      k: "difficulty",
                      name: "Difficulty",
                      val: label,
                    }].map((s) => (
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
                        <div style={{ fontSize: 11, opacity: 0.85 }}>{s.name}</div>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>{s.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
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

        {/* RIGHT: toolbar — narrow column */}
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
                // Keep Reset/New always available (except while generating)
                const overlayBlock = key === "reset" || key === "new" ? false : (isSolved || showSolvedOverlay);
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
                      (e.currentTarget as HTMLButtonElement).style.color = active
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

      {/* Mobile keypad — bigger numbers and per-digit entered counts; width equals board */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between", // fills the row, equal L/R edges
          gap: 12, // more space between buttons
          padding: "0 8px", // equal side gutters
          width: containerSize, // exactly board width
        }}
      >
        {Array.from({ length: size }, (_, i) => i + 1).map((n) => {
          const entered = perDigitCounts[n] ?? 0;
          const isActive = !hardMode && highlightDigit === n;

          // choose whatever symbol you like here
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
                ...(showSolvedOverlay ? { opacity: 0.5, cursor: "not-allowed" } : null),
              }}
              onClick={() =>
                !isLoading && !showSolvedOverlay && selected && setCell(selected.r, selected.c, n)
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

              {/* badge stays visible; shows a symbol in Hard Mode */}
              <span
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  opacity: 0.9,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  padding: "2px 6px",
                  // if you want the symbol slightly bolder:
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

      {/* Toast / hint message (fixed position) */}
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
