// src/pages/SequenceMemoryPage.tsx
import React from "react";
import TopBar from "../components/TopBar";
import SequenceGameBoard from "../components/sequence-memory/SequenceGameBoard";
import { useSequenceMemoryGame } from "../components/sequence-memory/useSequenceMemoryGame";

export default function SequenceMemoryPage() {
  const {
    GRID_SIZE,
    SEQ_LEN,
    MISTAKES_ALLOWED,
    phase,
    sequence,
    flashIndex,
    inputPos,
    mistakes,
    wrongAt,
    start,
    restart,
    handleCellClick,
  } = useSequenceMemoryGame();

  const pill: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    fontSize: 14,
    fontWeight: 600,
  };

  const bigBtn: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06))",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    color: "#e5e7eb",
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#0b1020",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TopBar />
      <main
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          padding: 16,
        }}
      >
        <div style={{ width: "min(92vw, 680px)", display: "grid", gap: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={pill}>Grid: 4×4</span>
            <span style={pill}>Sequence: {SEQ_LEN}</span>
            <span style={pill}>
              Mistakes: {mistakes}/{MISTAKES_ALLOWED}
            </span>
            {phase === "ready" ? (
              <button style={bigBtn} onClick={start} aria-label="Start">
                Start
              </button>
            ) : (
              <button style={bigBtn} onClick={restart} aria-label="Restart">
                Restart
              </button>
            )}
          </div>

          <SequenceGameBoard
            gridSize={GRID_SIZE}
            sequence={sequence}
            phase={phase}
            flashIndex={flashIndex}
            inputPos={inputPos}
            wrongAt={wrongAt}
            onCellClick={handleCellClick}
          />

          <div
            style={{
              textAlign: "center",
              minHeight: 24,
              fontWeight: 700,
              opacity: 0.9,
            }}
          >
            {phase === "ready" && <span>Tap Start to see the sequence.</span>}
            {phase === "show" && <span>Watch carefully…</span>}
            {phase === "input" && <span>Now repeat the sequence in order.</span>}
            {phase === "won" && <span>Nice! You got it 🎉</span>}
            {phase === "lost" && (
              <span>Two mistakes — you lost. Try again!</span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
