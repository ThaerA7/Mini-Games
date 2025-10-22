import * as React from "react";
import TopBar from "../components/TopBar";
import ChimpBoard from "../components/chimp/ChimpBoard";
import { useChimpGame } from "../components/chimp/useChimpGame";

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
    start,
    restart,
    nextLevel,
    clickCell,
    clearedNumbers,
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

  // ✅ missing bits
  const showStart = !running && phase === "idle";
  const showLost = phase === "lost";
  const showWon = phase === "won";
  const blurred = showStart || showLost || showWon;

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
          {/* header (wider) */}
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

          {/* board + overlays */}
          <div style={{ position: "relative" }}>
            <ChimpBoard
              gridSize={gridSize}
              cells={cells}
              phase={phase}
              onCellClick={clickCell}
              blurred={blurred}
              roundId={roundId}
              clearedNumbers={clearedNumbers}
            />

            {(showStart || showLost || showWon) && (
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
                  <Button onClick={start} tall>
                    Start
                  </Button>
                )}
                {showLost && (
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
                      Out of lives!
                    </div>
                    <Button onClick={restart}>Restart</Button>
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
                      Nice! Numbers this round: {count}
                    </div>
                    <Button onClick={nextLevel}>Next Level</Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* bottom actions (wider) */}
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
