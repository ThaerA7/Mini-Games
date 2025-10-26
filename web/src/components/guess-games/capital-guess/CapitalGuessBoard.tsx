// components/guess-games/capital-guess/CapitalGuessBoard.tsx
import * as React from "react";
import ReactCountryFlag from "react-country-flag";
import type { CapQuestion } from "./useCapitalGuess";
import { CAPITAL_SUGGESTIONS } from "./capitals";

type Props = {
  phase: "idle" | "playing" | "won" | "wrong" | "finished";
  question: CapQuestion | null;
  onSubmit: (capital: string) => void;
};

export default function CapitalGuessBoard({
  phase,
  question,
  onSubmit,
}: Props) {
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

  const suggestionsId = "capital-suggestions";

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        padding: "5px 16px 16px 16px",
      }}
    >
      {/* Country name ABOVE the flag */}
      <div
        style={{
          display: "grid",
          placeItems: "center",
          padding: "0px 16px 10px 16px",
        }}
      >
        <div style={{ width: 456, maxWidth: "94vw" }}>
          <div
            style={{
              textAlign: "center",
              fontFamily:
                "'Poppins', system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif",
              fontWeight: 900,
              fontSize: 38,
              color: "rgba(255,255,255,0.97)",
              letterSpacing: 0.2,
              textShadow: "0 1px 2px rgba(0,0,0,.35)",
              minHeight: 36, // keeps layout stable when switching
              marginBottom: 10,
            }}
          >
            {question ? question.country : ""}
          </div>

          {/* Flag */}
          <div
            style={{
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,.35))",
              lineHeight: 0,
            }}
            aria-label="flag"
          >
            {question ? (
              <ReactCountryFlag
                countryCode={question.code}
                svg
                style={{
                  width: 456,
                  height: 342,
                  borderRadius: 8,
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: 456,
                  height: 342,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.06)",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Answer input with suggestions */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        style={{ display: "grid", gap: 10, marginTop: 12 }}
      >
        <input
          type="text"
          placeholder="Type the capital city…"
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
          aria-label="Capital city"
          autoComplete="off"
        />

        <datalist id={suggestionsId}>
          {guess.trim().length >= 2 &&
            CAPITAL_SUGGESTIONS.filter((c) =>
              c.toLowerCase().includes(guess.trim().toLowerCase())
            )
              .slice(0, 20)
              .map((name) => <option key={name} value={name} />)}
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
