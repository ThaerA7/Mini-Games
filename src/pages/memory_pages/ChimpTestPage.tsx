// src/pages/ChimpTestPage.tsx
import * as React from "react";
import TopBar from "../../components/TopBar";
import ChimpBoard from "../../components/memory-games/chimp/ChimpBoard";
import { useChimpGame } from "../../components/memory-games/chimp/useChimpGame";

export default function ChimpTestPage() {
  const {
    level,
    bestLevel,
    hearts,
    running,
    phase,
    gridSize,
    cells,
    count,
    roundId,
    restart,
    promotePreviewToRound,
    clickCell,
    clearedNumbers,
    avgMsPerPick,
    previewCells,
    previewRoundId,
    previewLevel,
  } = useChimpGame(6);

  const baseBtnStyle: React.CSSProperties = {
    fontFamily:
      "'Poppins', system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif",
    height: 44,
    padding: "0 18px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.18)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.08))",
    color: "#e5e7eb",
    fontWeight: 700,
    letterSpacing: 0.2,
    cursor: "pointer",
    backdropFilter: "blur(8px)",
    boxShadow:
      "0 6px 18px rgba(0,0,0,.25), inset 0 0 0 1px rgba(255,255,255,.08)",
    transition:
      "transform .15s ease, box-shadow .2s ease, background .2s ease, opacity .2s ease",
  };

  const Button: React.FC<
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
      variant?: "solid" | "flat";
      full?: boolean;
      tall?: boolean;
    }
  > = ({ variant = "solid", full, tall, style, children, ...rest }) => (
    <button
      {...rest}
      style={{
        ...baseBtnStyle,
        ...(variant === "flat"
          ? {
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "none",
            }
          : null),
        ...(full ? { width: "100%" } : null),
        ...(tall ? { height: 56, fontSize: 22, padding: "0 24px" } : null),
        ...style,
      }}
      onMouseDown={(e) =>
        ((e.currentTarget.style.transform as any) = "translateY(0) scale(.985)")
      }
      onMouseUp={(e) =>
        ((e.currentTarget.style.transform as any) =
          "translateY(-1px) scale(1.01)")
      }
      onMouseLeave={(e) => ((e.currentTarget.style.transform as any) = "")}
    >
      {children}
    </button>
  );

  const renderHearts = (n: number) => {
    const total = 3;
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
            {i < n ? "❤" : "♡"}
          </span>
        ))}
      </div>
    );
  };

  const formatSpeed = (ms: number | null) =>
    ms == null
      ? "—"
      : ms >= 1000
        ? `${(ms / 1000).toFixed(2)}s / pick`
        : `${Math.round(ms)}ms / pick`;

  const showStart = !running && phase === "idle";
  const showLost = phase === "lost";
  const showWon = phase === "won";
  const usePreview = showStart || showWon;
  const blurred = showStart || showWon || showLost;

  const boardCells = usePreview ? previewCells : cells;
  const boardRound = usePreview ? previewRoundId : roundId;
  const boardPhase: any = usePreview ? "idle" : phase;
  const boardCleared = usePreview ? [] : clearedNumbers;

  const handleBoardClick = (cell: any) => {
    if (usePreview) return;
    clickCell(cell);
  };

  return (
    <div
      style={{
        minHeight: "50dvh",
        background: "#0b1020",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TopBar />
      <main
        style={{ flex: 1, display: "grid", placeItems: "center", padding: 16 }}
      >
        <section
          style={{ width: "min(1040px, 100%)", display: "grid", gap: 16 }}
        >
          <div style={{ width: "min(94vw, 800px)", margin: "0 auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                alignItems: "center",
                padding: "4px 2px",
                fontSize: 14,
                opacity: 0.95,
              }}
            >
              <div style={{ justifySelf: "start", fontWeight: 700 }}>
                Current Level: {level}
              </div>
              <div style={{ justifySelf: "center" }}>
                {renderHearts(hearts)}
              </div>
              <div style={{ justifySelf: "end", fontWeight: 700 }}>
                Best Level: {bestLevel}
              </div>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <ChimpBoard
              gridSize={gridSize}
              cells={boardCells}
              phase={boardPhase}
              onCellClick={handleBoardClick}
              blurred={blurred}
              roundId={boardRound}
              clearedNumbers={boardCleared}
            />

            {(showStart || showWon) && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  pointerEvents: "auto",
                }}
              >
                {showStart && (
                  <div
                    role="dialog"
                    aria-label="Chimp Test - start"
                    style={{
                      textAlign: "center",
                      padding: "20px 18px",
                      borderRadius: 16,
                      background: "rgba(6, 8, 18, 0.75)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.55)",
                      width: "min(520px, 92%)",
                      color: "rgba(255,255,255,0.95)",
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <div style={{ fontSize: 26, fontWeight: 900 }}>
                      Chimp Test
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>
                      Numbers appear on the screen. Tap 1 to begin, then tap the
                      circles in ascending order from memory. Each level adds
                      one more number. You have 3 lives.
                    </div>
                    <button
                      onClick={() => promotePreviewToRound(previewLevel)}
                      style={{
                        ...baseBtnStyle,
                        height: 56,
                        fontSize: 22,
                        padding: "0 24px",
                        fontWeight: 800,
                      }}
                      aria-label="Start Chimp Test"
                    >
                      Start Level {level} →
                    </button>
                  </div>
                )}

                {showWon && (
                  <div
                    style={{
                      pointerEvents: "auto",
                      display: "grid",
                      gap: 10,
                      placeItems: "center",
                      background: "rgba(6, 8, 18, 0.55)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 14,
                      padding: 16,
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <div style={{ fontSize: 14, opacity: 0.9 }}>
                      Well played — you memorized {count} numbers! 🎯
                    </div>
                    <button
                      onClick={() => promotePreviewToRound(previewLevel)}
                      aria-label="Next Level"
                      style={{
                        ...baseBtnStyle,
                        height: 56,
                        fontSize: 22,
                        padding: "0 24px",
                        fontWeight: 800,
                      }}
                    >
                      Next Level — keep the streak! 🚀
                    </button>
                  </div>
                )}
              </div>
            )}

            {showLost && (
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
                  role="dialog"
                  aria-label="Chimp Test - level failed"
                  style={{
                    textAlign: "center",
                    padding: "22px 20px",
                    borderRadius: 16,
                    background: "rgba(6, 8, 18, 0.80)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.55)",
                    width: "min(520px, 92%)",
                    color: "rgba(255,255,255,0.95)",
                  }}
                >
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

          <div style={{ width: "min(94vw, 800px)", margin: "0 auto" }}>
            <hr
              style={{
                height: 1,
                margin: "12px 0 10px",
                border: "none",
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.18), rgba(255,255,255,0))",
              }}
            />
            <Button
              onClick={restart}
              variant="flat"
              full
              aria-label="restart-bottom"
            >
              Restart
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
