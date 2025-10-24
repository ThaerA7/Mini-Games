import * as React from "react";
import type { Phase } from "./useNumberMemory";

type Props = {
  phase: Phase;
  target: string;
  msLeft: number;
  revealMs: number;
  onSubmit: (guess: string) => void;
};

export default function NumberMemoryBoard({
  phase,
  target,
  msLeft,
  revealMs,
  onSubmit,
}: Props) {
  const [guess, setGuess] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (phase === "input") {
      setGuess("");
      inputRef.current?.focus();
    }
  }, [phase]);

  const container: React.CSSProperties = {
    width: "100%",

    height: 360,
    margin: "0 auto",
    position: "relative",
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background:
      "radial-gradient(1200px 360px at 50% 100%, rgba(59,130,246,.08), transparent)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,.04)",
    overflow: "hidden",
  };

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

  return (
    <div style={container}>
      {phase === "show" && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily:
                "'Poppins', ui-monospace, SFMono-Regular, Menlo, monospace",
              fontWeight: 900,
              fontSize: "clamp(40px, 10vw, 84px)",
              letterSpacing: 1.5,
              lineHeight: 1,
            }}
            aria-label="number-to-memorize"
          >
            {target}
          </div>
          <div
            style={{
              marginTop: 16,
              width: "min(80%, 520px)",
              height: 8,
              borderRadius: 999,
              background: "rgba(255,255,255,0.1)",
              overflow: "hidden",
              marginInline: "auto",
            }}
            aria-label="reveal-progress"
          >
            <div
              style={{
                height: "100%",
                width: `${(msLeft / revealMs) * 100}%`,
                background:
                  "linear-gradient(90deg, rgba(59,130,246,.9), rgba(147,51,234,.9))",
                transition: "width .06s linear",
              }}
            />
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
            {(msLeft / 1000).toFixed(1)}s left
          </div>
        </div>
      )}

      {phase === "input" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(guess);
          }}
          style={{
            display: "grid",
            gap: 12,
            placeItems: "center",
            width: "min(92%, 520px)",
          }}
        >
          <input
            ref={inputRef}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="enter-the-number"
            value={guess}
            onChange={(e) => setGuess(e.target.value.replace(/[^0-9]/g, ""))}
            style={{
              width: "100%",
              fontFamily:
                "'Poppins', ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "clamp(24px, 5.2vw, 40px)",
              fontWeight: 900,
              textAlign: "center",
              padding: "14px 16px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.06)",
              color: "#e5e7eb",
              outline: "none",
              boxShadow:
                "0 10px 28px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.04)",
            }}
            placeholder="Type the number…"
          />
          <button type="submit" style={{ ...baseBtn, height: 52 }}>
            Check
          </button>
        </form>
      )}
    </div>
  );
}
