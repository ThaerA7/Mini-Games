// components/guess-games/language-guess/LanguageGuessBoard.tsx
import * as React from "react";
import type { LangQuestion } from "./useLanguageGuess";
import { LANGUAGE_SUGGESTIONS } from "./languages";
import { getLanguageHints } from "./languageHints";

type Props = {
  phase: "idle" | "playing" | "won" | "wrong" | "finished";
  question: LangQuestion | null;
  onSubmit: (value: string) => void;
  onHintReveal?: () => void;
};

export default function LanguageGuessBoard({ phase, question, onSubmit, onHintReveal }: Props) {
  const disabled = phase !== "playing";
  const [guess, setGuess] = React.useState("");
  const [hintCount, setHintCount] = React.useState(0);

  React.useEffect(() => {
    setGuess("");
    setHintCount(0); // reset hints on new question / phase change
  }, [question?.code, phase]);

  const submit = () => {
    if (!disabled && guess.trim()) onSubmit(guess.trim());
  };

  const suggestionsId = "language-suggestions";

  // Load a general-purpose font for wide script coverage
  React.useEffect(() => {
    const id = "guess-font-noto";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

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

  // Lookup entry (not used in hints now, but handy if needed later)

  const allHints = React.useMemo(() => {
    if (!question) return [] as string[];
    // Subtle: family, native speakers (broad), broad location
    return getLanguageHints(question.code);
  }, [question]);

  const revealHint = () => {
    if (disabled || hintCount >= 3) return;
    setHintCount((c) => Math.min(3, c + 1)); // reveal up to 3
    onHintReveal?.(); // NEW: increment global counter
  };

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        padding: "5px 16px 16px 16px",
      }}
    >
      {/* Language title area (kept blank during play to avoid spoilers) */}
      <div
        style={{
          display: "grid",
          placeItems: "center",
          padding: "16px 16px 10px 16px",
        }}
      >
        <div style={{ width: 640, maxWidth: "94vw" }}>
          {/* Snippet card — icon sits directly on this card */}
          <div
            lang={question?.code}
            dir={question?.dir}
            style={{
              position: "relative", // anchor the icon to this card
              borderRadius: 12,
              padding: "20px 18px",
              background:
                "linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.06))",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 8px 24px rgba(0,0,0,.35)",
              minHeight: 120,
              display: "grid",
              placeItems: "center",
              textAlign: question?.dir === "rtl" ? "right" : "left",
              fontFamily:
                "'Noto Sans', system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif",
              fontSize: 24,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.96)",
            }}
            aria-label="language snippet"
          >
            <span style={{ display: "block", maxWidth: 640 }}>
              {question ? question.sample : "—"}
            </span>

            {/* Hint icon button — PURE ICON (no box, no border, no shadow) */}
            <button
              type="button"
              onClick={revealHint}
              disabled={disabled || hintCount >= 3}
              title={
                disabled
                  ? "Hints are available during play"
                  : hintCount < 3
                  ? `Get hint ${hintCount + 1}/3`
                  : "No more hints"
              }
              aria-label="Get a hint"
              style={{
                position: "absolute",
                right: 8,
                bottom: 10,
                // pure icon look:
                background: "transparent",
                border: "none",
                boxShadow: "none",
                padding: 0,
                margin: 0,
                width: "auto",
                height: "auto",
                borderRadius: 0,
                // big, tappable emoji:
                fontSize: 22,
                lineHeight: 1,
                color: "inherit",
                cursor: disabled || hintCount >= 3 ? "not-allowed" : "pointer",
                // no backdrop effects:
                backdropFilter: "none",
              }}
            >
              💡
            </button>
          </div>

          {/* Hints area (progressively revealed) */}
          {hintCount > 0 && (
            <div
              aria-live="polite"
              style={{
                marginTop: 10,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,.12)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.04))",
                boxShadow: "0 6px 16px rgba(0,0,0,.28)",
                fontSize: 14.5,
                lineHeight: 1.5,
                color: "rgba(229,231,235,0.95)",
              }}
            >
              {Array.from({ length: hintCount }).map((_, i) => (
                <div key={i} style={{ marginBottom: i === hintCount - 1 ? 0 : 6 }}>
                  <b>{`Hint ${i + 1}:`}</b> {allHints[i]}
                </div>
              ))}
            </div>
          )}
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
          placeholder="Type the language name… (e.g., German, Arabic)"
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
          aria-label="Language name"
          autoComplete="off"
        />

        <datalist id={suggestionsId}>
          {guess.trim().length >= 1 &&
            LANGUAGE_SUGGESTIONS.filter((n) =>
              n.toLowerCase().includes(guess.trim().toLowerCase())
            )
              .slice(0, 20)
              .map((name) => <option key={name} value={name} />)}
        </datalist>

        <button type="submit" style={baseBtn} disabled={disabled || !guess.trim()}>
          Submit
        </button>
      </form>
    </div>
  );
}
