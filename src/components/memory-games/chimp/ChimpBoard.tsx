// src/components/chimp/ChimpBoard.tsx
import * as React from "react";
import type { Cell, Phase } from "./useChimpGame";

type Props = {
  gridSize: number;
  cells: Cell[];
  phase: Phase;
  onCellClick: (c: Cell) => void;
  blurred?: boolean;
  roundId: number;
  clearedNumbers: number[];
};

export default function ChimpBoard({
  gridSize,
  cells,
  phase,
  onCellClick,
  blurred = false,
  roundId,
  clearedNumbers,
}: Props) {
  const showNumbers = phase === "show";
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const [size, setSize] = React.useState({ w: 480, h: 480 });

  React.useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setSize({ w: Math.max(240, rect.width), h: Math.max(240, rect.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tokens = React.useMemo(
    () =>
      cells.filter((c) => typeof c.number === "number") as Array<
        Required<Cell>
      >,
    [cells],
  );

  function rng(seed: number) {
    let t = seed >>> 0;
    return () => {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  const placements = React.useMemo(() => {
    const r = rng(roundId * 100003 + tokens.length * 97 + gridSize * 13);
    const W = size.w;
    const H = size.h;
    const base = Math.min(W, H);
    const density = Math.max(1, Math.sqrt(tokens.length));
    const diameter = Math.max(
      36,
      Math.min(92, Math.floor(base / (density + 1.75))),
    );
    const margin = Math.max(4, Math.floor(diameter * 0.15));
    type P = {
      left: number;
      top: number;
      d: number;
      n: number;
      cell: Required<Cell>;
    };
    const placed: P[] = [];
    const maxLeft = Math.max(0, W - diameter - margin);
    const maxTop = Math.max(0, H - diameter - margin);
    function overlaps(a: P, b: P) {
      return !(
        a.left + a.d + margin < b.left ||
        b.left + b.d + margin < a.left ||
        a.top + a.d + margin < b.top ||
        b.top + b.d + margin < a.top
      );
    }
    const sorted = [...tokens].sort((a, b) => a.number! - b.number!);
    for (const cell of sorted) {
      let placedOne: P | null = null;
      const attempts = 600;
      for (let k = 0; k < attempts; k++) {
        const left = Math.floor(margin + r() * maxLeft);
        const top = Math.floor(margin + r() * maxTop);
        const candidate: P = { left, top, d: diameter, n: cell.number!, cell };
        if (placed.every((p) => !overlaps(candidate, p))) {
          placedOne = candidate;
          break;
        }
      }
      if (!placedOne) {
        placedOne = {
          left: Math.floor(margin + r() * maxLeft),
          top: Math.floor(margin + r() * maxTop),
          d: diameter,
          n: cell.number!,
          cell,
        };
      }
      placed.push(placedOne);
    }
    return placed;
  }, [roundId, tokens, gridSize, size.w, size.h]);

  const wrapStyle: React.CSSProperties = {
    width: "min(94vw, 800px)",
    height: "min(94vw, 500px)",
    margin: "0 auto",
    position: "relative",
    filter: blurred ? "blur(6px)" : "none",
    transition: "filter .2s ease",
    background: "transparent",
    borderRadius: 16,
  };

  const tokenStyleBase: React.CSSProperties = {
    position: "absolute",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9999px",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow:
      "0 8px 18px rgba(0,0,0,.28), inset 0 0 0 1px rgba(255,255,255,.06)",
    cursor: "pointer",
    userSelect: "none",
    transition: "transform .08s ease",
  };

  const numStyle: React.CSSProperties = {
    fontFamily:
      "'Poppins', system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif",
    fontWeight: 800,
    fontSize: "clamp(28px, 4.8vw, 50px)",
    lineHeight: 1,
    color: "#e5e7eb",
    padding: 0,
    textAlign: "center",
    fontVariantNumeric: "tabular-nums lining-nums",
    fontFeatureSettings: "'tnum' 1, 'lnum' 1",
  };

  const clearedSet = React.useMemo(
    () => new Set(clearedNumbers),
    [clearedNumbers],
  );

  return (
    <div ref={wrapRef} style={wrapStyle} aria-label="chimp-random-board">
      {placements
        .filter((p) => !clearedSet.has(p.n))
        .map((p) => (
          <button
            key={p.n}
            onClick={() => onCellClick(p.cell)}
            aria-label={showNumbers ? `cell ${p.n}` : "cell"}
            style={{
              ...tokenStyleBase,
              left: p.left,
              top: p.top,
              width: p.d,
              height: p.d,
            }}
            onMouseDown={(e) =>
              ((e.currentTarget.style.transform as any) = "scale(.97)")
            }
            onMouseUp={(e) => ((e.currentTarget.style.transform as any) = "")}
            onMouseLeave={(e) =>
              ((e.currentTarget.style.transform as any) = "")
            }
          >
            {showNumbers ? <span style={numStyle}>{p.n}</span> : null}
          </button>
        ))}
    </div>
  );
}
