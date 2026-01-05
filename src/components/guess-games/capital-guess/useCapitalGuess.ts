// components/guess-games/capital-guess/useCapitalGuess.ts
import * as React from "react";
import { COUNTRIES } from "../flag-guess/countries";
import { CAPITALS_BY_CODE } from "./capitals";

type Phase = "idle" | "playing" | "won" | "wrong" | "finished";

export type CapQuestion = {
  code: string; // ISO 3166-1 alpha-2
  flag: string; // fallback emoji
  country: string; // country name (overlay on flag)
  answers: string[]; // accepted capital names
};

const BEST_KEY = "capital-guess-best-score";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .replace(/[\s'’"().,/-]+/g, " ") // punctuation-ish
    .replace(/\s+/g, " ");
}

function makeQuestion(
  code: string,
  name: string,
  flag: string,
): CapQuestion | null {
  const cap = CAPITALS_BY_CODE[code];
  if (!cap) return null;
  const answers = [cap.capital, ...(cap.also ?? [])].map(normalize);
  return { code, flag, country: name, answers };
}

const POOL = COUNTRIES.filter((c) => !!CAPITALS_BY_CODE[c.code]);

export const TOTAL_ITEMS = POOL.length;

export function useCapitalGuess() {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [queue, setQueue] = React.useState<typeof POOL>([]);
  const [idx, setIdx] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [bestScore, setBestScore] = React.useState(
    Number(localStorage.getItem(BEST_KEY) || 0),
  );

  // Pre-generate next queue to keep Level 1 preview in sync with board size
  const [pending, setPending] = React.useState<typeof POOL>(() =>
    shuffle(POOL),
  );
  const firstQuestion = React.useMemo(
    () => makeQuestion(pending[0]?.code, pending[0]?.name, pending[0]?.flag),
    [pending],
  );

  const question = React.useMemo<CapQuestion | null>(() => {
    if (phase === "idle" || phase === "finished" || queue.length === 0)
      return null;
    const c = queue[idx];
    return c ? makeQuestion(c.code, c.name, c.flag) : null;
  }, [queue, idx, phase]);

  const start = React.useCallback(() => {
    setQueue(pending);
    setIdx(0);
    setScore(0);
    setPhase("playing");
    setPending(shuffle(POOL));
  }, [pending]);

  const restart = start;

  const submit = (userInput: string) => {
    if (!question || phase !== "playing") return;
    const guess = normalize(userInput);
    const isCorrect = question.answers.includes(guess);
    if (isCorrect) {
      const next = score + 1;
      if (next > bestScore) {
        setBestScore(next);
        localStorage.setItem(BEST_KEY, String(next));
      }
      setScore(next);
      setPhase("won");
    } else {
      setPhase("wrong");
    }
  };

  const goNext = () => {
    const next = idx + 1;
    if (next >= TOTAL_ITEMS) setPhase("finished");
    else {
      setIdx(next);
      setPhase("playing");
    }
  };

  return {
    level: idx + 1,
    score,
    bestScore,
    total: TOTAL_ITEMS,

    phase,
    question,
    upcomingFirst: firstQuestion,

    start,
    restart,
    submit,
    nextLevel: goNext,
    continueAfterWrong: goNext,
  };
}
