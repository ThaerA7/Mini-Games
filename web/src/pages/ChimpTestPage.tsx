import React from "react";
import TopBar from "../components/TopBar";

type Phase = "idle" | "show" | "input" | "won" | "lost";

type Cell = {
  idx: number;     // 0..(gridSize*gridSize-1)
  number?: number; // 1..N if this cell is part of the round
};

const BEST_KEY = "chimp_best_level";

export default function ChimpTestPage() {
  // -------- state
  const [level, setLevel] = React.useState(1);
  const [bestLevel, setBestLevel] = React.useState<number>(() => {
    const v = localStorage.getItem(BEST_KEY);
    return v ? Number(v) : 1;
  });
  const [hearts, setHearts] = React.useState(3);
  const [running, setRunning] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("idle");

  // fixed 5×5 grid (classic feel). You can tweak later.
  const gridSize = 5;

  // current round
  const [cells, setCells] = React.useState<Cell[]>([]);
  const [count, setCount] = React.useState(4); // how many numbers this level shows
  const [nextExpected, setNextExpected] = React.useState(1);
  const [hit, setHit] = React.useState<Set<number>>(new Set()); // numbers already correctly clicked

  const hideTimeout = React.useRef<number | null>(null);

  // -------- inject font + styles once
  React.useEffect(() => {
    const id = "chimp-font-poppins";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  React.useEffect(() => {
    const id = "chimp-style";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      :root { --ui-font: 'Poppins', system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif; }
      .btn {
        font-family: var(--ui-font);
        height: 44px; padding: 0 18px;
        border-radius: 12px; border: 1px solid rgba(255,255,255,.18);
        background: linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.08));
        color: #e5e7eb; font-weight: 700; letter-spacing: .2px;
        cursor: pointer; backdrop-filter: blur(8px);
        box-shadow: 0 6px 18px rgba(0,0,0,.25), inset 0 0 0 1px rgba(255,255,255,.08);
        transition: transform .15s ease, box-shadow .2s ease, background .2s ease, opacity .2s ease;
      }
      .btn:hover { transform: translateY(-1px) scale(1.01); box-shadow: 0 10px 24px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.18); }
      .btn:active { transform: translateY(0) scale(.985); }
      .btn:disabled { opacity: .65; cursor: not-allowed; }
      .btn--flat { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); box-shadow: none !important; }
      .btn--full { width: 100%; }

      .board { transition: transform .35s ease, opacity .35s ease; }
      .board--won { transform: scale(.96); opacity: 0; }

      .chimp-grid {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(var(--gs), 1fr);
      }
      .chimp-cell {
        position: relative;
        width: 100%; aspect-ratio: 1 / 1;
        border-radius: 10px;
        background: rgba(255,255,255,.06);
        border: 1px solid rgba(255,255,255,.10);
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.06);
        display: grid; place-items: center;
        font-family: var(--ui-font);
        user-select: none; cursor: pointer;
        transition: transform .08s ease, background .2s ease, border-color .2s ease;
      }
      .chimp-cell:active { transform: scale(.98); }
      .chimp-num {
        font-size: clamp(18px, 4vw, 28px);
        font-weight: 700;
        color: #0b1020;
        background: #e5e7eb;
        padding: 4px 10px;
        border-radius: 10px;
        box-shadow: 0 6px 12px rgba(0,0,0,.25), inset 0 0 0 1px rgba(255,255,255,.5);
      }
      .chimp-num--hidden { visibility: hidden; }
      .chimp-num--hit {
        background: #a7f3d0;
      }
      .divider {
        height: 1px; margin: 12px 0 10px; border: none;
        background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.18), rgba(255,255,255,0));
      }
    `;
    document.head.appendChild(style);
  }, []);

  // -------- helpers
  function shuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function planCountForLevel(lv: number) {
    // start at 4 numbers; +1 each level; cap to 10 (fits 5x5 well)
    return Math.min(10, 3 + lv);
  }

  function prepareRound(lv = level) {
    const N = gridSize * gridSize;
    const howMany = planCountForLevel(lv);
    setCount(howMany);

    const order = shuffle(Array.from({ length: N }, (_, i) => i)).slice(
      0,
      howMany
    );
    const withNumbers = Array.from({ length: N }, (_, i) => ({
      idx: i,
      number: undefined as number | undefined,
    }));
    order.forEach((cellIdx, i) => {
      withNumbers[cellIdx].number = i + 1;
    });

    setCells(withNumbers);
    setNextExpected(1);
    setHit(new Set());
  }

  function startRun() {
    setRunning(true);
    setPhase("show");
    prepareRound(level);

    // hide numbers shortly after showing
    if (hideTimeout.current) window.clearTimeout(hideTimeout.current);
    hideTimeout.current = window.setTimeout(() => {
      setPhase("input");
    }, 900) as unknown as number;
  }

  function restartRun() {
    setLevel(1);
    setHearts(3);
    setRunning(false);
    setPhase("idle");
  }

  function handleCellClick(cell: Cell) {
    if (phase !== "input" || !cell.number) return;

    if (cell.number !== nextExpected) {
      // wrong → lose a life
      setHearts((h) => {
        const nh = h - 1;
        if (nh <= 0) {
          setPhase("lost");
          setRunning(false);
        } else {
          // retry same level
          setPhase("show");
          prepareRound(level);
          if (hideTimeout.current) window.clearTimeout(hideTimeout.current);
          hideTimeout.current = window.setTimeout(
            () => setPhase("input"),
            900
          ) as unknown as number;
        }
        return nh;
      });
      return;
    }

    // correct
    setHit((old) => new Set(old).add(cell.number!));
    const next = nextExpected + 1;
    setNextExpected(next);

    if (next > count) {
      // level complete
      setPhase("won");
      const nextLevel = level + 1;
      setBestLevel((b) => {
        const nb = Math.max(b, nextLevel);
        localStorage.setItem(BEST_KEY, String(nb));
        return nb;
      });
    }
  }

  function nextLevel() {
    const nl = level + 1;
    setLevel(nl);
    setPhase("show");
    prepareRound(nl);
    if (hideTimeout.current) window.clearTimeout(hideTimeout.current);
    hideTimeout.current = window.setTimeout(
      () => setPhase("input"),
      900
    ) as unknown as number;
  }

  React.useEffect(() => {
    return () => {
      if (hideTimeout.current) window.clearTimeout(hideTimeout.current);
    };
  }, []);

  // -------- UI bits
  const Button: React.FC<
    React.ButtonHTMLAttributes<HTMLButtonElement>
  > = ({ className, children, ...rest }) => (
    <button {...rest} className={["btn", className].filter(Boolean).join(" ")}>
      {children}
    </button>
  );

  const renderHearts = (count: number) => {
    const total = 3;
    return (
      <div style={{ display: "flex", gap: 6, alignItems: "center" }} aria-label="lives">
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
  const showWonOverlay = phase === "won";
  const isBlurred = showStartOverlay || showLostOverlay || showWonOverlay;

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
        <section style={{ width: "min(960px, 100%)", display: "grid", gap: 16 }}>
          {/* header */}
          <div style={{ width: "min(92vw, 640px)", margin: "0 auto" }}>
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
              <div style={{ justifySelf: "center" }}>{renderHearts(hearts)}</div>
              <div style={{ justifySelf: "end", fontWeight: 700 }}>
                Best Level: {bestLevel}
              </div>
            </div>
          </div>

          {/* board */}
          <div style={{ width: "min(92vw, 640px)", margin: "0 auto" }}>
            <div className={`board ${phase === "won" ? "board--won" : ""}`} style={{ position: "relative" }}>
              <div
                className="chimp-grid"
                style={{
                  "--gs": String(gridSize),
                  filter: isBlurred ? "blur(6px)" : "none",
                } as React.CSSProperties}
              >
                {Array.from({ length: gridSize * gridSize }, (_, i) => {
                  const cell = cells[i] || { idx: i };
                  const num = cell.number;
                  const isHit = num ? hit.has(num) : false;
                  const showNum = num && (phase === "show" || (phase === "input" && isHit));
                  return (
                    <div
                      key={i}
                      className="chimp-cell"
                      onClick={() => handleCellClick(cell)}
                      aria-label={num ? `cell ${num}` : "empty cell"}
                    >
                      {num ? (
                        <span
                          className={[
                            "chimp-num",
                            !showNum ? "chimp-num--hidden" : "",
                            isHit ? "chimp-num--hit" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {num}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {(showStartOverlay || showLostOverlay || showWonOverlay) && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    pointerEvents: "auto",
                  }}
                >
                  {showStartOverlay && (
                    <Button onClick={startRun} style={{ height: 56, padding: "0 24px", fontSize: 22 }}>
                      Start
                    </Button>
                  )}

                  {showLostOverlay && (
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
                      <div style={{ fontSize: 14, opacity: 0.9 }}>Out of lives!</div>
                      <Button onClick={restartRun}>Restart</Button>
                    </div>
                  )}

                  {showWonOverlay && (
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

            {/* bottom actions */}
            <div style={{ marginTop: 10, filter: isBlurred ? "blur(6px)" : "none" }}>
              <hr className="divider" />
              <button className="btn btn--flat btn--full" onClick={restartRun} aria-label="restart-bottom">
                Restart
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
