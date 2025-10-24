// src/pages/VisualMemoryPage.tsx
import React from "react";
import TopBar from "../components/TopBar";
import GameBoard from "../components/visual-memory/GameBoard";
import { useVisualMemoryGame } from "../components/visual-memory/useVisualMemoryGame";

export default function VisualMemoryPage() {
  const {
    level,
    gridSize,
    phase,
    pattern,
    selected,
    stats,
    hearts,
    running,
    startRun,
    restartRun,
    handleCellClick,
    isCellCorrect,
  } = useVisualMemoryGame();

  // Inject Poppins once
  React.useEffect(() => {
    const id = "poppins-font-link";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  // CSS
  React.useEffect(() => {
    const id = "vm-style";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      :root { --ui-font: 'Poppins', system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif; }
      .vm-btn {
        font-family: var(--ui-font);
        height: 44px;
        padding: 0 18px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.18);
        background: linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.08));
        color: #e5e7eb;
        font-weight: 700;
        letter-spacing: .2px;
        cursor: pointer;
        backdrop-filter: blur(8px);
        box-shadow:
          0 6px 18px rgba(0,0,0,.25),
          inset 0 0 0 1px rgba(255,255,255,.08);
        transition: transform .15s ease, box-shadow .2s ease, background .2s ease, opacity .2s ease;
      }
      .vm-btn:hover { transform: translateY(-1px) scale(1.01); box-shadow: 0 10px 24px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.18); }
      .vm-btn:active { transform: translateY(0) scale(.985); }
      .vm-btn:disabled { opacity: .65; cursor: not-allowed; }

      /* Grid/Button divider */
      .vm-divider {
        height: 1px;
        margin: 12px 0 10px;
        border: none;
        background: linear-gradient(
          90deg,
          rgba(255,255,255,0),
          rgba(255,255,255,0.18),
          rgba(255,255,255,0)
        );
      }
      /* Flat, full-width variant for the bottom button (no floating) */
      .vm-btn--flat { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); box-shadow: none !important; transform: none !important; backdrop-filter: blur(6px); }
      .vm-btn--flat:hover, .vm-btn--flat:active { background: rgba(255,255,255,0.12); box-shadow: none !important; transform: none !important; }
      .vm-btn--full { width: 100%; }

      /* Board transition + blur */
      .vm-board { transition: transform .35s ease, opacity .35s ease, filter .16s ease; will-change: transform, opacity; }
      .vm-board--won { transform: scale(.96); opacity: 0; }

      /* Card flip helpers */
      .vm-card.is-flipped { transform: rotateY(180deg) !important; }
      .vm-card.is-picked-correct .front { background: rgba(255,255,255,0.9) !important; box-shadow: 0 0 0 2px rgba(255,255,255,0.22) inset !important; }
      .vm-card.is-picked-wrong .front { background: rgba(239,68,68,0.85) !important; box-shadow: 0 0 0 2px rgba(239,68,68,0.60) inset !important; }
    `;
    document.head.appendChild(style);
  }, []);

  const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
    children,
    className,
    ...rest
  }) => (
    <button
      {...rest}
      className={["vm-btn", className].filter(Boolean).join(" ")}
    >
      {children}
    </button>
  );

  const renderHearts = (count: number) => {
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
            {i < count ? "❤" : "♡"}
          </span>
        ))}
      </div>
    );
  };

  const showStartOverlay = !running && phase === "idle";
  const showLostOverlay = phase === "lost";
  const isBlurred = showStartOverlay || showLostOverlay;

  return (
    <div
      style={{
        // MATCH SequenceMemoryPage
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
        // MATCH SequenceMemoryPage
        style={{ flex: 1, display: "grid", placeItems: "center", padding: 16 }}
      >
        <section
          // MATCH SequenceMemoryPage outer cap
          style={{ width: "min(1040px, 100%)", display: "grid", gap: 16 }}
        >
          {/* HEADER */}
          <div
            // MATCH SequenceMemoryPage inner cap
            style={{ width: "min(94vw, 800px)", margin: "0 auto" }}
          >
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
                Best Level: {stats.bestLevel}
              </div>
            </div>
          </div>

          {/* BOARD SHELL: width + centering only */}
          <div
            // MATCH SequenceMemoryPage inner cap
            style={{
              width: "min(94vw, 800px)",
              margin: "0 auto",
            }}
          >
            {/* ANIMATES ONLY THE GRID (and the overlay that sits on top of it) */}
            <div
              className={`vm-board ${phase === "won" ? "vm-board--won" : ""}`}
              style={{
                position: "relative",
              }}
            >
              <GameBoard
                gridSize={gridSize}
                phase={phase}
                highlightCells={pattern}
                selected={selected}
                onCellClick={handleCellClick}
                isCellCorrect={isCellCorrect}
                isBlurred={isBlurred} // grid blurs, overlay stays sharp
              />

              {(showStartOverlay || showLostOverlay) && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    pointerEvents: "auto",
                  }}
                >
                  {showStartOverlay ? (
                    <Button
                      onClick={startRun}
                      style={{ height: 56, padding: "0 24px", fontSize: 22 }}
                    >
                      Start
                    </Button>
                  ) : (
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
                      <Button onClick={restartRun}>Restart</Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* This section no longer lives inside the animated container */}
            <div
              style={{
                marginTop: 10,
                filter: isBlurred ? "blur(6px)" : "none",
              }}
            >
              <hr className="vm-divider" />
              <Button
                className="vm-btn--flat vm-btn--full"
                onClick={restartRun}
                aria-label="restart-bottom"
              >
                Restart
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
