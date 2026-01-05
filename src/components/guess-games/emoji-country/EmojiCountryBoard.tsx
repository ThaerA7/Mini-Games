import * as React from "react";
import type { EmojiQuestion } from "./useEmojiCountry";
import { COUNTRIES } from "../flag-guess/countries";

type Props = {
  phase: "idle" | "playing" | "won" | "wrong" | "finished";
  question: EmojiQuestion | null;
  onSubmit: (country: string) => void;
};

export default function EmojiCountryBoard({
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

  const suggestionsId = "country-suggestions";

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        padding: "5px 16px 16px 16px",
      }}
    >
      {/* Emoji riddle */}
      <div
        style={{
          display: "grid",
          placeItems: "center",
          padding: "8px 16px 12px 16px",
        }}
      >
        <div style={{ width: 456, maxWidth: "94vw", textAlign: "center" }}>
          <div
            style={{
              fontFamily:
                "'Poppins', system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif",
              fontWeight: 900,
              fontSize: 18,
              color: "rgba(255,255,255,0.97)",
              letterSpacing: 0.2,
              textShadow: "0 1px 2px rgba(0,0,0,.35)",
              minHeight: 36,
              marginBottom: 8,
              maxLines: 1,
            }}
          >
            Guess the country from the emojis:
          </div>

          <div
            aria-label="emoji clue"
            style={{
              fontSize: 64,
              lineHeight: 1.2,
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,.35))",
              userSelect: "none",
              marginBottom: 8,
              minHeight: 82,
            }}
          >
            {question ? question.emojis.join(" ") : "❓"}
          </div>

          <div
            style={{
              fontSize: 13,
              opacity: 0.85,
              minHeight: 18,
              transition: "opacity .2s ease",
            }}
          >
            {question?.hint
              ? `Hint: ${question.hint}`
              : "Combine the emojis as a wordplay!"}
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
          placeholder="Type the country name…"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          disabled={disabled}
          list={guess.trim().length >= 1 ? suggestionsId : undefined}
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
          {guess.trim().length >= 1 &&
            COUNTRIES.filter((c) =>
              c.name.toLowerCase().includes(guess.trim().toLowerCase()),
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
