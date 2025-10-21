// src/pages/SequenceMemoryPage.tsx
import React from "react";
import TopBar from "../components/TopBar";
import SequenceGameBoard from "../components/sequence-memory/SequenceGameBoard";
import { useSequenceMemoryGame } from "../components/sequence-memory/useSequenceMemoryGame";

export default function SequenceMemoryPage() {
  const {
    GRID_SIZE,
    phase,
    sequence,
    flashIndex,
    inputPos,
    wrongAt,
    start,
    restart,
    bestLevel,
    bestScore,
    score,
    seqLen,
    mistakes,
    countdown,
    handleCellClick,
  } = useSequenceMemoryGame();

  // inject minimal styles once
  React.useEffect(() => {
    const id = "seq-style";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      :root { --ui-font: system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif; }
      .sm-btn {
        font-family: var(--ui-font);
        height: 44px;
        padding: 0 18px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.16);
        background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
        color: #e5e7eb;
        font-weight: 800;
        letter-spacing: .2px;
        cursor: pointer;
        box-shadow: 0 6px 18px rgba(0,0,0,.25);
        transition: transform .15s ease, box-shadow .2s ease, background .2s ease, opacity .2s ease;
      }
      .sm-btn:hover { transform: translateY(-1px) scale(1.01); box-shadow: 0 10px 24px rgba(0,0,0,.35); }
      .sm-btn:active { transform: translateY(0) scale(.985); }
      .sm-btn:disabled { opacity: .65; cursor: not-allowed; }
      .sm-btn--flat { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); box-shadow: none !important; }
      .sm-btn--full { width: 100%; }
      .sm-divider {
        height: 1px; margin: 12px 0 10px; border: none;
        background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.18), rgba(255,255,255,0));
      }
      .countdown-bubble {
        font-family: var(--ui-font);
        font-weight: 900;
        font-size: clamp(42px, 8vw, 84px);
        line-height: 1;
        letter-spacing: .5px;
        color: rgba(255,255,255,0.98);
        padding: 10px 18px;
        border-radius: 16px;
        background: rgba(2,6,23,0.75);
        border: 1px solid rgba(255,255,255,0.16);
        box-shadow: 0 16px 48px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.06);
        transform: scale(1);
        transition: transform .24s ease;
      }
    `;
    document.head.appendChild(style);
  }, []);

  const Pill: React.FC<React.PropsWithChildren> = ({ children }) => (
    <span
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.06)",
        fontSize: 14,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );

  const renderHearts = (mistakes: number) => {
    const total = 3;
    const filled = Math.max(0, total - mistakes);
    return (
      <div style={{ display: "flex", gap: 6, alignItems: "center" }} aria-label="lives">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            style={{ fontSize: 18, lineHeight: 1, filter: "drop-shadow(0 0 4px rgba(255,255,255,0.25))", opacity: 0.95 }}
            aria-hidden
          >
            {i < filled ? "❤" : "♡"}
          </span>
        ))}
      </div>
    );
  };

  const isBlurred = phase === "ready" || phase === "countdown" || phase === "lost";

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#0b1020",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--ui-font)",
      }}
    >
      <TopBar />
      <main style={{ flex: 1, display: "grid", placeItems: "center", padding: 16 }}>
        <section style={{ width: "min(92vw, 720px)", display: "grid", gap: 16 }}>
          {/* TOP BAR: Level • Hearts • Best Level */}
          <div
            style={{
              width: "min(92vw, 640px)",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              fontSize: 14,
            }}
          >
            <div style={{ justifySelf: "start", fontWeight: 900 }}>Level: {seqLen}</div>
            <div style={{ justifySelf: "center" }}>{renderHearts(mistakes)}</div>
            <div style={{ justifySelf: "end", fontWeight: 900 }}>Best Level: {bestLevel}</div>
          </div>

          {/* BOARD WRAPPER */}
          <div style={{ width: "min(92vw, 640px)", margin: "0 auto", position: "relative" }}>
            <SequenceGameBoard
              gridSize={GRID_SIZE}
              sequence={sequence}
              phase={phase}
              flashIndex={flashIndex}
              inputPos={inputPos}
              wrongAt={wrongAt}
              onCellClick={handleCellClick}
              isBlurred={isBlurred}
            />

            {/* BOTTOM divider + full-width Restart */}
            <div style={{ marginTop: 10, filter: isBlurred ? "blur(6px)" : "none", transition: "filter 160ms ease" }}>
              <hr className="sm-divider" />
              <button className="sm-btn sm-btn--flat sm-btn--full" onClick={restart} aria-label="Restart">
                Restart
              </button>
            </div>

            {/* OVERLAYS */}
            {phase === "ready" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  pointerEvents: "auto",
                }}
              >
                <button className="sm-btn" onClick={start} aria-label="Start">
                  Start
                </button>
              </div>
            )}

            {phase === "countdown" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  pointerEvents: "none",
                }}
              >
                <div className="countdown-bubble" aria-live="polite" role="status">
                  {countdown}
                </div>
              </div>
            )}

            {/* LOST OVERLAY WITH STATS */}
            {phase === "lost" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  pointerEvents: "auto",
                }}
              >
                <div
                  style={{
                    pointerEvents: "auto",
                    display: "grid",
                    gap: 12,
                    placeItems: "center",
                    background: "rgba(6, 8, 18, 0.55)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 14,
                    padding: 16,
                    backdropFilter: "blur(6px)",
                    width: "min(520px, 92%)",
                  }}
                >
                  <div style={{ fontSize: 20, fontWeight: 900 }}>You lost!</div>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    <Pill>Reached: {seqLen}</Pill>
                    <Pill>Score: {score}</Pill>
                    <Pill>Best Level: {bestLevel}</Pill>
                    <Pill>Best Score: {bestScore}</Pill>
                  </div>
                  <button className="sm-btn" onClick={restart} aria-label="Restart overlay">
                    Restart
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}