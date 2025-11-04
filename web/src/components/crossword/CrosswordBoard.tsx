// components/crossword/CrosswordBoard.tsx
import * as React from "react";

type Dir = "across" | "down";

export default function CrosswordBoard() {
  // Unified container so board width matches the buttons and header
  const CONTAINER = "min(94vw, 800px)";
  const size = 11;

  // Grid letters; "#" means a block. Start empty.
  const [grid, setGrid] = React.useState<string[][]>(() =>
    Array.from({ length: size }, () => Array.from({ length: size }, () => ""))
  );

  const [selected, setSelected] = React.useState<{ r: number; c: number } | null>(null);
  const [dir, setDir] = React.useState<Dir>("across");
  const [restartPressed, setRestartPressed] = React.useState(false);
  const [resetPressed, setResetPressed] = React.useState(false);

  const boardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    boardRef.current?.focus();
  }, []);

  // --- styles to match CapitalGuessPage buttons ---
  const baseBtn: React.CSSProperties = {
    fontFamily:
      "'Poppins', system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif",
    height: 44,
    padding: "0 18px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.18)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.08))",
    color: "#e5e7eb",
    fontWeight: 800,
    letterSpacing: 0.2,
    cursor: "pointer",
    backdropFilter: "blur(8px)",
    boxShadow:
      "0 6px 18px rgba(0,0,0,.25), inset 0 0 0 1px rgba(255,255,255,.08)",
    transition:
      "transform .15s ease, box-shadow .2s ease, background .2s ease, opacity .2s ease",
  };

  const pressedStyles: React.CSSProperties = {
    transform: "translateY(1px) scale(0.985)",
    boxShadow:
      "0 3px 10px rgba(0,0,0,.28), inset 0 0 0 1px rgba(255,255,255,.06)",
    background:
      "linear-gradient(180deg, rgba(160, 8, 8, 0.12), rgba(255,255,255,.06))",
    opacity: 0.98,
  };

  // --- helpers ---
  const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
  const step = (delta: number) => {
    if (!selected) return;
    let { r, c } = selected;
    if (dir === "across") c = clamp(c + delta, 0, size - 1);
    else r = clamp(r + delta, 0, size - 1);
    setSelected({ r, c });
  };

  const toggleBlock = (r: number, c: number) => {
    setGrid((g) => {
      const next = g.map((row) => row.slice());
      next[r][c] = next[r][c] === "#" ? "" : "#";
      return next;
    });
  };

  const getWordCells = React.useCallback(
    (r: number, c: number, d: Dir) => {
      if (grid[r][c] === "#") return [];
      const cells: Array<{ r: number; c: number }> = [];
      let sr = r, sc = c;

      // backward
      while (true) {
        const nr = d === "down" ? sr - 1 : sr;
        const nc = d === "across" ? sc - 1 : sc;
        if (nr < 0 || nc < 0 || grid[nr][nc] === "#") break;
        sr = nr; sc = nc;
      }
      // forward
      let cr = sr, cc = sc;
      while (cr < size && cc < size && grid[cr][cc] !== "#") {
        cells.push({ r: cr, c: cc });
        if (d === "down") cr += 1; else cc += 1;
      }
      return cells;
    },
    [grid, size]
  );

  const activeWordSet = React.useMemo(() => {
    if (!selected) return new Set<string>();
    return new Set(getWordCells(selected.r, selected.c, dir).map((p) => `${p.r}-${p.c}`));
  }, [selected, dir, getWordCells]);

  // keyboard
  React.useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    const onKey = (e: KeyboardEvent) => {
      if (!selected) return;

      if (e.key === " ") {
        e.preventDefault();
        setDir((d) => (d === "across" ? "down" : "across"));
        return;
      }

      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        if (e.key === "ArrowLeft") { setDir("across"); step(-1); }
        if (e.key === "ArrowRight") { setDir("across"); step(1); }
        if (e.key === "ArrowUp") { setDir("down"); step(-1); }
        if (e.key === "ArrowDown") { setDir("down"); step(1); }
        return;
      }

      const { r, c } = selected;

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        setGrid((g) => {
          const next = g.map((row) => row.slice());
          if (next[r][c] !== "#") next[r][c] = "";
          return next;
        });
        if (e.key === "Backspace") step(-1);
        return;
      }

      if (e.key === "." || e.key === "#") {
        e.preventDefault();
        toggleBlock(r, c);
        step(1);
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        const ch = e.key.toUpperCase();
        setGrid((g) => {
          const next = g.map((row) => row.slice());
          if (next[r][c] !== "#") next[r][c] = ch;
          return next;
        });
        step(1);
      }
    };

    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [selected, dir, size, step]);

  const clearLetters = () => {
    setGrid((g) => g.map((row) => row.map((v) => (v === "#" ? "#" : ""))));
  };

  const clearAll = () => {
    setGrid(Array.from({ length: size }, () =>
      Array.from({ length: size }, () => "")
    ));
    setSelected(null);
    setDir("across");
  };

  // --- UI ---
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Top text (matches CapitalGuessPage header line) */}
      <div style={{ width: CONTAINER, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            padding: "4px 2px",
            fontSize: 14,
            opacity: 0.95,
            color: "#e5e7eb",
          }}
        >
          <div style={{ justifySelf: "start", fontWeight: 700 }}>
            Crossword (Beta)
          </div>
          <div style={{ justifySelf: "center" }} />
          <div style={{ justifySelf: "end", fontWeight: 700 }}>
            Direction: {dir === "across" ? "Across" : "Down"} • Size: {size}×{size}
          </div>
        </div>
      </div>

      {/* Board (ONLY the board is white). Bigger + same width as buttons */}
      <div
        ref={boardRef}
        tabIndex={0}
        onClick={() => boardRef.current?.focus()}
        style={{
          width: CONTAINER,          // match buttons
          height: CONTAINER,         // keep it square and big
          display: "grid",
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
          background: "#000",
          borderRadius: 8,
          border: "2px solid #000",
          overflow: "hidden",
          outline: "none",
          userSelect: "none",
          margin: "0 auto",
        }}
      >
        {grid.map((row, r) =>
          row.map((val, c) => {
            const isSelected = selected?.r === r && selected?.c === c;
            const isInWord = selected && activeWordSet.has(`${r}-${c}`) && !isSelected;

            const baseBg = val === "#" ? "#000" : "#fff"; // classic black & white
            const bg = isSelected
              ? "rgba(0,0,0,0.08)"
              : isInWord
                ? "rgba(0,0,0,0.04)"
                : baseBg;

            return (
              <div
                key={`${r}-${c}`}
                onClick={(e) => {
                  setSelected({ r, c });
                  if (e.detail === 2) toggleBlock(r, c);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  toggleBlock(r, c);
                }}
                style={{
                  position: "relative",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "clamp(20px, 3.8vw, 42px)", // slightly larger text for bigger board
                  fontWeight: 800,
                  letterSpacing: 0.6,
                  color: val === "#" ? "#fff" : "#111",
                  background: bg,
                  borderRight: "1px solid #000", // thin lines only
                  borderBottom: "1px solid #000",
                  cursor: "pointer",
                }}
                aria-label={`r${r + 1} c${c + 1}`}
              >
                {val === "#" ? "" : grid[r][c]}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom: divider + two buttons (same width as board) */}
      <div
        style={{
          width: CONTAINER,
          margin: "0px auto 0",
          fontSize: 18,
        }}
      >
        <hr
          style={{
            height: 1,
            margin: "0px 0 10px",
            border: "none",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.18), rgba(255,255,255,0))",
          }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button
            onClick={clearLetters}
            aria-label="restart-bottom"
            aria-pressed={restartPressed}
            onPointerDown={() => setRestartPressed(true)}
            onPointerUp={() => setRestartPressed(false)}
            onPointerLeave={() => setRestartPressed(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " " || e.code === "Space")
                setRestartPressed(true);
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter" || e.key === " " || e.code === "Space")
                setRestartPressed(false);
            }}
            style={{
              ...baseBtn,
              width: "100%",
              ...(restartPressed ? pressedStyles : null),
            }}
          >
            Restart
          </button>

          <button
            onClick={clearAll}
            aria-label="reset-bottom"
            aria-pressed={resetPressed}
            onPointerDown={() => setResetPressed(true)}
            onPointerUp={() => setResetPressed(false)}
            onPointerLeave={() => setResetPressed(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " " || e.code === "Space")
                setResetPressed(true);
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter" || e.key === " " || e.code === "Space")
                setResetPressed(false);
            }}
            style={{
              ...baseBtn,
              width: "100%",
              ...(resetPressed ? pressedStyles : null),
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* How to play (same container width) */}
      <div
        style={{
          margin: "0 auto",
          width: CONTAINER,
          color: "rgba(229,231,235,0.8)",
          fontSize: 12,
        }}
      >
        <b>How to play:</b> click a cell to select • type A–Z to fill • Backspace/Delete to erase •
        Arrow keys move • <kbd>Space</kbd> toggles direction • Right-click (or “.” / “#”) to toggle
        a block. Double-click a cell also toggles a block.
      </div>
    </div>
  );
}