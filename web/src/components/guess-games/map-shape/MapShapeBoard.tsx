// ==========================================================
// New file: components/guess-games/map-shape/MapShapeBoard.tsx
// UI board: shows the country outline + free-text input with suggestions
// ==========================================================
import * as React from "react";
import type { Question } from "./useMapShapeGuess.ts";
import { COUNTRIES } from "../flag-guess/countries.ts";
import CountryShape from "./CountryShape.tsx";

export type MapShapeBoardProps = {
  phase: "idle" | "playing" | "won" | "wrong" | "finished";
  question: Question | null;
  onSubmit: (countryName: string) => void;
};

export default function MapShapeBoard({
  phase,
  question,
  onSubmit,
}: MapShapeBoardProps) {
  const disabled = phase !== "playing";
  const [guess, setGuess] = React.useState("");

  React.useEffect(() => {
    setGuess("");
  }, [question?.code, phase]);

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

  const submit = () => {
    if (!disabled && guess.trim()) onSubmit(guess.trim());
  };

  const suggestionsId = "country-shape-suggestions";

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        padding: "0px 16px 16px 16px",
      }}
    >
      {/* Country outline */}
      <div
        style={{
          display: "grid",
          placeItems: "center",
          padding: "18px 8px 10px",
        }}
      >
        <div
          style={{
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,.35))",
            lineHeight: 0,
          }}
          aria-label="map-shape"
        >
          {question ? (
            // Bigger map (was 320 x 240)
            <CountryShape code={question.code} width={480} height={360} />
          ) : (
            // Match placeholder size to new map size, but keep it subtle
            <div
              style={{
                width: 480,
                height: 360,
                borderRadius: 8,
                background: "transparent",
              }}
            />
          )}
        </div>
      </div>

      {/* Free-text answer with suggestions */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        style={{ display: "grid", gap: 10, marginTop: 12 }}
      >
        <input
          type="text"
          placeholder="Type the country name…"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          disabled={disabled}
          list={guess.trim().length >= 2 ? suggestionsId : undefined}
          style={{
            height: 48,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,.18)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.05))",
            color: "#e5e7eb",
            padding: "0 14px",
            fontSize: 16,
            outline: "none",
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,.06), 0 4px 12px rgba(0,0,0,.20)",
          }}
          aria-label="Country name"
          autoComplete="off"
        />

        <datalist id={suggestionsId}>
          {guess.trim().length >= 2 &&
            COUNTRIES.filter((c) =>
              c.name.toLowerCase().includes(guess.trim().toLowerCase())
            )
              .slice(0, 20)
              .map((c) => <option key={c.code} value={c.name} />)}
        </datalist>

        <button
          type="submit"
          style={baseBtn}
          disabled={disabled || !guess.trim()}
        >
          Submit
        </button>
      </form>
    </div>
  );
}
