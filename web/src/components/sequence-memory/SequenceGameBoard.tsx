import React from "react";
import type { SeqPhase } from "./useSequenceMemoryGame";

type Props = {
  gridSize: number;           // 4
  sequence: number[];         // e.g. [5, 2, 11]
  phase: SeqPhase;            // "show" | "input" | ...
  flashIndex: number | null;  // which index in sequence is glowing during "show"
  inputPos: number;           // how many correct clicks so far
  wrongAt: number | null;     // last wrong cell clicked (for a brief red flash)
  onCellClick: (idx: number) => void;
};

export default function SequenceGameBoard({
  gridSize,
  sequence,
  phase,
  flashIndex,
  inputPos,
  wrongAt,
  onCellClick,
}: Props) {
  const count = gridSize * gridSize;
  const containerStyle: React.CSSProperties = {
    width: "min(92vw, 640px)",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
    gap: 10,
    touchAction: "manipulation",
  };

  const baseCell: React.CSSProperties = {
    aspectRatio: "1 / 1",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    transition: "transform 140ms ease, background 160ms ease, box-shadow 160ms ease",
    boxShadow: "0 6px 16px rgba(0,0,0,0.30)",
    isolation: "isolate",
    contain: "paint",
    cursor: phase === "input" ? "pointer" : "default",
  };

  const glowStyle: React.CSSProperties = {
    background: "#ffffff",
    boxShadow: "0 0 0 2px rgba(255,255,255,0.20) inset, 0 10px 22px rgba(255,255,255,0.08)",
    transform: "translateY(-2px)",
  };

  const correctSoFarStyle: React.CSSProperties = {
    background: "rgba(90, 220, 90, 0.85)",
  };

  const wrongStyle: React.CSSProperties = {
    background: "rgba(255, 70, 70, 0.9)",
  };

  // Map of sequence index -> cell id
  const seqOrderToCell = sequence;

  // Set of cells already correctly entered
  const enteredSet = new Set(seqOrderToCell.slice(0, inputPos));

  const flashingCellId =
    phase === "show" && flashIndex !== null ? seqOrderToCell[flashIndex] : null;

  return (
    <div style={containerStyle} aria-label="sequence-board">
      {Array.from({ length: count }).map((_, i) => {
        const isFlashing = i === flashingCellId;
        const isEntered = enteredSet.has(i);
        const isWrong = i === wrongAt;

        const style: React.CSSProperties = {
          ...baseCell,
          ...(isFlashing ? glowStyle : null),
          ...(isEntered ? correctSoFarStyle : null),
          ...(isWrong ? wrongStyle : null),
        };

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
