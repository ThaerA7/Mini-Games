import * as React from "react";
import { generateCrossword } from "./generateCrossword";

type Dir = "across" | "down";

export default function CrosswordBoard() {
  // Unified container so board width matches the buttons and header
  const CONTAINER = "min(94vw, 800px)";
  const size = 11;

  // Generate a playable crossword (blocks pre-filled as "#")
  const xw = React.useMemo(() => {
    try {
      return generateCrossword(size);
    } catch (err) {
      console.error("Crossword generation failed:", err);
      // Graceful local fallback: empty open grid so the UI still renders.
      const blocks = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => false)
      );
      return {
        size,
        blocks,
        puzzleGrid: Array.from({ length: size }, () =>
          Array.from({ length: size }, () => "")
        ),
        solutionGrid: Array.from({ length: size }, () =>
          Array.from({ length: size }, () => "")
        ),
        clues: { across: [], down: [] },
      };
    }
  }, [size]);

  const [grid, setGrid] = React.useState<string[][]>(() =>
    xw.blocks.map((row) => row.map((b) => (b ? "#" : "")))
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

  const step = React.useCallback(
    (delta: number) => {
      if (!selected) return;
      let { r, c } = selected;
      let attempts = 0;
      while (attempts < size) {
        if (dir === "across") c = clamp(c + delta, 0, size - 1);
        else r = clamp(r + delta, 0, size - 1);
        attempts++;
        if (grid[r][c] !== "#") break;
        // if we hit a block at edge, stop
        if (
          (dir === "across" && (c === 0 || c === size - 1)) ||
          (dir === "down" && (r === 0 || r === size - 1))
        ) {
          break;
        }
      }
      setSelected({ r, c });
    },
    [selected, dir, size, grid]
  );



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
        if (e.key === "ArrowLeft") {
          setDir("across");
          step(-1);
        }
        if (e.key === "ArrowRight") {
          setDir("across");
          step(1);
        }
        if (e.key === "ArrowUp") {
          setDir("down");
          step(-1);
        }
        if (e.key === "ArrowDown") {
          setDir("down");
          step(1);
        }
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
   
      }
    };

    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [selected, dir, size, step]);

  // Pick the first non-block cell once when the crossword changes
  React.useEffect(() => {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!xw.blocks[r][c]) {
          setSelected({ r, c });
          return;
        }
      }
    }
  }, [xw, size]);

  const clearLetters = () => {
    setGrid((g) => g.map((row) => row.map((v) => (v === "#" ? "#" : ""))));
  };

  const clearAll = () => {
    setGrid(xw.blocks.map((row) => row.map((b) => (b ? "#" : ""))));
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
          <div style={{ justifySelf: "start", fontWeight: 700 }}>Crossword (Beta)</div>
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
          width: CONTAINER, // match buttons
          height: CONTAINER, // keep it square and big
          display: "grid",
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
          background: "#f1e6e6ff",
          borderRadius: 8,
          border: "2px solid #000",
          overflow: "hidden",
          outline: "none",
          WebkitTapHighlightColor: "transparent",
          WebkitTouchCallout: "none",
          caretColor: "transparent",
          userSelect: "none",
          margin: "0 auto",
        }}
      >
        {grid.map((row, r) =>
          row.map((val, c) => {
            const isSelected = selected?.r === r && selected?.c === c;

            const baseBg = val === "#" ? "#000" : "#fff"; // classic black & white
            const bg = isSelected ? "rgba(0,0,0,0.08)" : baseBg;

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => {
                  if (grid[r][c] === "#") return;
                  setSelected({ r, c });
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
                  WebkitTapHighlightColor: "transparent",
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
    </div>
  );
}
