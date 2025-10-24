// src/components/sequence-memory/SequenceGameBoard.tsx
import React from "react";
import type { SeqPhase } from "./useSequenceMemoryGame";

type Props = {
  gridSize: number;
  sequence: number[];
  phase: SeqPhase;
  flashIndex: number | null;
  inputPos: number;
  wrongAt: number | null;
  onCellClick: (idx: number) => void;
  isBlurred?: boolean;
};

export default function SequenceGameBoard({
  gridSize,
  sequence,
  phase,
  flashIndex,
  inputPos,
  wrongAt,
  onCellClick,
  isBlurred = false,
}: Props) {
  const count = gridSize * gridSize;

  const containerStyle: React.CSSProperties = {
    width: "min(94vw, 800px)",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
    gap: 10,
    touchAction: "manipulation",
    filter: isBlurred ? "blur(6px)" : "none",
    transition: "filter 160ms ease",
  };

  const baseCell: React.CSSProperties = {
    position: "relative",
    aspectRatio: "1 / 1",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    transition:
      "transform 140ms ease, background 160ms ease, box-shadow 160ms ease",
    boxShadow: "0 6px 16px rgba(0,0,0,0.30)",
    isolation: "isolate",
    contain: "paint",
    cursor: phase === "input" ? "pointer" : "default",
  };

  const glowStyle: React.CSSProperties = {
    background: "#ffffff",
    boxShadow:
      "0 0 0 2px rgba(255,255,255,0.20) inset, 0 10px 22px rgba(255,255,255,0.08)",
    transform: "translateY(-2px)",
  };

  const wrongStyle: React.CSSProperties = {
    background: "rgba(255, 70, 70, 0.9)",
  };

  // Dynamic stepped progress color per cell:
  // Each correct click on the same cell advances one step toward a brighter green.
  function getProgressStyle(total: number, done: number): React.CSSProperties {
    // clamp
    const t = Math.max(1, total);
    const k = Math.min(Math.max(1, done), t);

    // Map step k in [1..t] to HSL lightness & alpha so each step is visually distinct.
    // Hue fixed near green; lightness & alpha increase with progress.
    const hue = 145; // green
    const sat = 65; // %
    const lightMin = 38; // %
    const lightMax = 62; // %
    const alphaMin = 0.55;
    const alphaMax = 0.85;

    const lightness = lightMin + (lightMax - lightMin) * (k / t);
    const alpha = alphaMin + (alphaMax - alphaMin) * (k / t);

    const bg = `hsla(${hue}, ${sat}%, ${lightness}%, ${alpha})`;
    const inset = `0 0 0 1px hsla(${hue}, 80%, ${Math.min(
      75,
      lightness + 8
    )}%, ${0.45 + 0.25 * (k / t)}) inset`;

    return {
      background: bg,
      boxShadow: `${inset}, 0 6px 16px rgba(0,0,0,0.28)`,
      transform: "translateY(-1px)",
    };
  }

  // Which cell is flashing during "show"
  const seqOrderToCell = sequence;
  const flashingCellId =
    phase === "show" && flashIndex !== null ? seqOrderToCell[flashIndex] : null;

  // Build counts
  const totalCounts = React.useMemo(() => {
    const arr = Array<number>(count).fill(0);
    for (const id of sequence) arr[id] += 1;
    return arr;
  }, [sequence, count]);

  const doneCounts = React.useMemo(() => {
    const arr = Array<number>(count).fill(0);
    for (const id of sequence.slice(0, inputPos)) arr[id] += 1;
    return arr;
  }, [sequence, inputPos, count]);

  return (
    <div style={containerStyle} aria-label="sequence-board">
      {Array.from({ length: count }).map((_, i) => {
        const isFlashing = i === flashingCellId;
        const isWrong = i === wrongAt;

        const total = totalCounts[i]; // total times this cell appears in the sequence
        const done = doneCounts[i]; // how many of those have been correctly entered

        // Compose styles by priority:
        // wrong > flashing > progress (only after first correct click) > base
        let style: React.CSSProperties = { ...baseCell };

        if (done > 0) {
          style = { ...style, ...getProgressStyle(total, done) };
        }

        if (isFlashing) style = { ...style, ...glowStyle };
        if (isWrong) style = { ...style, ...wrongStyle };

        return (
          <div
            key={i}
            aria-label={`sq-cell-${i}`}
            style={style}
            onClick={() => phase === "input" && onCellClick(i)}
          />
        );
      })}
    </div>
  );
}
