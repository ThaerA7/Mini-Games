// src/pages/SequenceMemoryPage.tsx
import React from "react";
import TopBar from "../components/TopBar";
import SequenceGameBoard from "../components/guess-games/sequence-memory/SequenceGameBoard";
import { useSequenceMemoryGame } from "../components/guess-games/sequence-memory/useSequenceMemoryGame";

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
    level, // 👈 was seqLen
    mistakes,
    countdown,
    handleCellClick,
    avgMsPerPick,
  } = useSequenceMemoryGame();

  const formatSpeed = (ms: number | null) =>
    ms == null
      ? "—"
      : ms >= 1000
        ? `${(ms / 1000).toFixed(2)}s / pick`
        : `${Math.round(ms)}ms / pick`;

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

  const renderHearts = (mistakes: number) => {
    const total = 3;
    const filled = Math.max(0, total - mistakes);
    return (
      <div
        style={{ display: "flex", gap: 6, alignItems: "center" }}
        aria-label="lives"
      >
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            style={{
              fontSize: 18,
              lineHeight: 1,
              filter: "drop-shadow(0 0 4px rgba(255,255,255,0.25))",
              opacity: 0.95,
            }}
            aria-hidden
          >
            {i < filled ? "❤" : "♡"}
          </span>
        ))}
      </div>
    );
  };

  const isBlurred =
    phase === "ready" || phase === "countdown" || phase === "lost";

  return (
    <div
      style={{
        minHeight: "50dvh",
        background: "#0b1020",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--ui-font)",
      }}
    >
      <TopBar />
      <main
        style={{ flex: 1, display: "grid", placeItems: "center", padding: 16 }}
      >
        <section
          // Match NumberMemory layout: outer section up to 1040px
          style={{ width: "min(1040px, 100%)", display: "grid", gap: 16 }}
        >
          {/* TOP BAR: Level • Hearts • Best Level */}
          <div
            style={{
              // Match NumberMemory inner width: 800px cap / 94vw
              width: "min(94vw, 800px)",
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              fontSize: 14,
            }}
          >
            <div style={{ justifySelf: "start", fontWeight: 900 }}>
              Current Level: {level}
            </div>
            <div style={{ justifySelf: "center" }}>
              {renderHearts(mistakes)}
            </div>
            <div style={{ justifySelf: "end", fontWeight: 900 }}>
              Best Level: {bestLevel}
            </div>
          </div>

          {/* BOARD WRAPPER */}
          <div
            style={{
              // Match NumberMemory inner width: 800px cap / 94vw
              width: "min(94vw, 800px)",
              margin: "0 auto",
            }}
          >
            {/* Board + overlays (relative to the grid only) */}
            <div style={{ position: "relative" }}>
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

              {/* OVERLAYS — centered on the grid, not counting the Restart row */}
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
                  <button
                    className="sm-btn"
                    onClick={start}
                    style={{ height: 56, padding: "0 24px", fontSize: 22 }}
                    aria-label="Start"
                  >
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

              {phase === "lost" && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    pointerEvents: "auto",
                    background: "transparent",
                  }}
                >
                  <div
                    role="dialog"
                    aria-label="Sequence Memory - level failed"
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
                          "conic-gradient(from 0deg, rgba(239,68,68,0.9), rgba(147,51,234,0.9), rgba(239,68,68,0.9))",
                        boxShadow: "0 8px 30px rgba(239,68,68,0.35)",
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
                        ✕
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 900,
                        letterSpacing: 0.2,
                      }}
                    >
                      Level Failed
                    </div>
                    <div style={{ opacity: 0.85, marginTop: 4, fontSize: 13 }}>
                      Keep going — you’ve got this!
                    </div>

                    {/* Stats — ONLY the three requested */}
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
                      {[
                        { k: "level", name: "Current Level", val: String(level) },
                        { k: "best", name: "Best Level", val: String(bestLevel) },
                        {
                          k: "speed",
                          name: "Avg Speed",
                          val: formatSpeed(avgMsPerPick),
                        },
                      ].map((s) => (
                        <div
                          key={s.k}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 10,
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.14)",
                            minWidth: 120,
                          }}
                        >
                          <div style={{ fontSize: 11, opacity: 0.85 }}>
                            {s.name}
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 800 }}>
                            {s.val}
                          </div>
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
                        onClick={restart}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: "1px solid rgba(59,130,246,0.55)",
                          background: "rgba(59,130,246,0.18)",
                          color: "white",
                          fontWeight: 800,
                          cursor: "pointer",
                          boxShadow: "0 6px 24px rgba(59,130,246,0.35)",
                        }}
                        aria-label="Restart"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM divider + full-width Restart (not counted for centering) */}
            <div
              style={{
                marginTop: 10,
                filter: isBlurred ? "blur(6px)" : "none",
                transition: "filter 160ms ease",
              }}
            >
              <hr className="sm-divider" />
              <button
                className="sm-btn sm-btn--flat sm-btn--full"
                onClick={restart}
                aria-label="Restart"
              >
                Restart
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
