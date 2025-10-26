// ==========================================================
// New file: pages/guess_pages/MapShapeGuessPage.tsx
// Page shell (mirrors FlagGuessPage styling/behavior)
// ==========================================================
import * as React from "react";
import TopBar from "../../components/TopBar";
import MapShapeBoard from "../../components/guess-games/map-shape/MapShapeBoard";
import {
  useMapShapeGuess,
  TOTAL_COUNTRIES,
} from "../../components/guess-games/map-shape/useMapShapeGuess";

export default function MapShapeGuessPage() {
  const {
    level,
    score,
    bestScore,
    phase,
    question,
    upcomingFirst,
    start,
    restart,
    nextLevel,
    submit,
    continueAfterWrong,
  } = useMapShapeGuess();

  const [restartPressed, setRestartPressed] = React.useState(false);
  const [restartDlgPressed, setRestartDlgPressed] = React.useState(false);

  const displayQuestion = React.useMemo(
    () => (phase === "idle" ? upcomingFirst : question),
    [phase, upcomingFirst, question]
  );

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

  const showOverlay =
    phase === "idle" ||
    phase === "won" ||
    phase === "finished" ||
    phase === "wrong";

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
          {/* header */}
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
                Current level: {Math.min(level, TOTAL_COUNTRIES)}/
                {TOTAL_COUNTRIES}
              </div>
              <div style={{ justifySelf: "center" }} />
              <div style={{ justifySelf: "end", fontWeight: 700 }}>
                Best score: {bestScore}/{TOTAL_COUNTRIES}
              </div>
            </div>
          </div>

          {/* board */}
          <div
            style={{
              position: "relative",
              width: "min(94vw, 800px)",
              margin: "0 auto",
            }}
          >
            <MapShapeBoard
              phase={phase}
              question={displayQuestion}
              onSubmit={submit}
            />

            {showOverlay && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  background:
                    phase === "idle"
                      ? "rgba(6, 8, 18, 0.40)"
                      : "rgba(6, 8, 18, 0.55)",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: phase === "idle" ? "blur(10px)" : undefined,
                  WebkitBackdropFilter:
                    phase === "idle" ? "blur(10px)" : undefined,
                  overflow: "hidden",
                  zIndex: 1,
                }}
              >
                {/* Foreground dialogs */}
                {phase === "idle" && (
                  <div
                    role="dialog"
                    aria-label="Guess the Country by Map Shape - start"
                    style={{
                      position: "relative",
                      zIndex: 1,
                      textAlign: "center",
                      padding: "24px 20px",
                      borderRadius: 16,
                      background: "rgba(6, 8, 18, 0.75)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.55)",
                      width: "min(560px, 92%)",
                      color: "rgba(255,255,255,0.95)",
                      display: "grid",
                      gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 26, fontWeight: 900 }}>
                      Guess the Country by Map Shape
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.9 }}>
                      Type the country name. You will play through all{" "}
                      <b>{TOTAL_COUNTRIES}</b> shapes — each one appears only
                      once per run.
                    </div>
                    <button
                      onClick={start}
                      style={{ ...baseBtn, height: 56, fontSize: 22 }}
                    >
                      Start Level 1 →
                    </button>
                  </div>
                )}

                {phase === "won" && (
                  <div
                    style={{
                      position: "relative",
                      zIndex: 1,
                      textAlign: "center",
                      padding: 18,
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
                    <div style={{ fontSize: 20, fontWeight: 800 }}>
                      Correct! 🎉
                    </div>
                    <button
                      onClick={nextLevel}
                      style={{ ...baseBtn, height: 56, fontSize: 22 }}
                    >
                      Next Shape →
                    </button>
                  </div>
                )}

                {phase === "wrong" && (
                  <div
                    role="dialog"
                    aria-label="Guess the Country by Map Shape - wrong answer"
                    style={{
                      position: "relative",
                      zIndex: 1,
                      textAlign: "center",
                      padding: 20,
                      borderRadius: 16,
                      background: "rgba(6, 8, 18, 0.78)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.55)",
                      width: "min(560px, 92%)",
                      color: "rgba(255,255,255,0.95)",
                      display: "grid",
                      gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 22, fontWeight: 900 }}>
                      Not quite 😅
                    </div>
                    <div style={{ opacity: 0.9, fontSize: 14 }}>
                      Correct answer: <b>{question?.answer}</b>
                    </div>
                    <button
                      onClick={continueAfterWrong}
                      style={{ ...baseBtn, height: 52, fontSize: 20 }}
                      autoFocus
                    >
                      Next Shape →
                    </button>
                  </div>
                )}

                {phase === "finished" && (
                  <div
                    role="dialog"
                    aria-label="Guess the Country by Map Shape - finished"
                    style={{
                      position: "relative",
                      zIndex: 1,
                      textAlign: "center",
                      padding: 22,
                      borderRadius: 16,
                      background: "rgba(6, 8, 18, 0.80)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.55)",
                      width: "min(560px, 92%)",
                      color: "rgba(255,255,255,0.95)",
                      display: "grid",
                      gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 26, fontWeight: 900 }}>
                      All done! 🎯
                    </div>
                    <div style={{ opacity: 0.9, fontSize: 14 }}>
                      You’ve completed all {TOTAL_COUNTRIES} shapes.
                      <br />
                      Final score:{" "}
                      <b>
                        {score}/{TOTAL_COUNTRIES}
                      </b>
                      <br />
                      Best score:{" "}
                      <b>
                        {bestScore}/{TOTAL_COUNTRIES}
                      </b>
                    </div>
                    <button
                      onClick={restart}
                      aria-pressed={restartDlgPressed}
                      onPointerDown={() => setRestartDlgPressed(true)}
                      onPointerUp={() => setRestartDlgPressed(false)}
                      onPointerLeave={() => setRestartDlgPressed(false)}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" ||
                          e.key === " " ||
                          e.code === "Space"
                        )
                          setRestartDlgPressed(true);
                      }}
                      onKeyUp={(e) => {
                        if (
                          e.key === "Enter" ||
                          e.key === " " ||
                          e.code === "Space"
                        )
                          setRestartDlgPressed(false);
                      }}
                      style={{
                        ...baseBtn,
                        height: 52,
                        ...(restartDlgPressed ? pressedStyles : null),
                      }}
                    >
                      Play again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* bottom restart */}
          <div
            style={{
              width: "min(94vw, 800px)",
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
            <button
              onClick={restart}
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
          </div>
        </section>
      </main>
    </div>
  );
}
