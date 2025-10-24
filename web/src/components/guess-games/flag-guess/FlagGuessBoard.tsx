import * as React from "react";
import type { Question } from "./useFlagGuess";

type Props = {
  phase: "idle" | "playing" | "won" | "wrong" | "lost";
  question: Question | null;
  onSubmit: (countryName: string) => void;
};

export default function FlagGuessBoard({ phase, question, onSubmit }: Props) {
  const disabled = phase !== "playing";

  const baseBtn: React.CSSProperties = {
    fontFamily:
      "'Poppins', system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif",
    height: 48,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,.18)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.08))",
    color: "#e5e7eb",
    fontWeight: 700,
    letterSpacing: 0.2,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    backdropFilter: "blur(8px)",
    boxShadow:
      "0 6px 18px rgba(0,0,0,.25), inset 0 0 0 1px rgba(255,255,255,.08)",
    transition: "transform .12s ease, box-shadow .2s ease, opacity .2s ease",
  };

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        padding: 16,
      }}
    >
      {/* Flag */}
      <div
        style={{
          display: "grid",
          placeItems: "center",
          padding: "18px 8px 10px",
        }}
      >
        <div
          style={{
            fontSize: 96,
            lineHeight: 1,
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,.35))",
          }}
          aria-label="flag"
        >
          {question?.flag ?? "🏳️"}
        </div>
      </div>

      {/* Options */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0,1fr))",
          gap: 10,
          marginTop: 12,
        }}
      >
        {question?.options.map((opt) => (
          <button
            key={opt}
            style={baseBtn}
            disabled={disabled}
            onClick={() => onSubmit(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
