// components/guess-games/flag-guess/useFlagGuess.ts
import * as React from "react";
import { COUNTRIES } from "./countries";

type Phase = "idle" | "playing" | "won" | "wrong" | "finished";

export type Question = {
  code: string;   // ISO 3166-1 alpha-2 (e.g., "US", "DE")
  flag: string;   // fallback emoji (kept, in case you want it later)
  answer: string; // canonical country name from COUNTRIES
};

const BEST_KEY = "flag-guess-best-score";
export const TOTAL_FLAGS = COUNTRIES.length; // 195

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeName(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // strip accents
    .replace(/[\s'’"().,/-]+/g, " ")  // collapse punctuation-ish
    .replace(/\s+/g, " ");            // normalize spaces
}

function makeQuestionFromCountry(c: { code: string; name: string; flag: string }): Question {
  return { code: c.code, flag: c.flag, answer: c.name };
}

export function useFlagGuess() {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [queue, setQueue] = React.useState<typeof COUNTRIES>([]);
  const [levelIndex, setLevelIndex] = React.useState(0); // 0-based position in queue
  const [score, setScore] = React.useState(0);           // correct answers this run
  const [bestScore, setBestScore] = React.useState(
    Number(localStorage.getItem(BEST_KEY) || 0)
  );

  const question = React.useMemo<Question | null>(() => {
    if (phase === "idle" || phase === "finished" || queue.length === 0) return null;
    const c = queue[levelIndex];
    return c ? makeQuestionFromCountry(c) : null;
  }, [queue, levelIndex, phase]);

  const start = React.useCallback(() => {
    const shuffled = shuffle(COUNTRIES);
    setQueue(shuffled);
    setLevelIndex(0);
    setScore(0);
    setPhase("playing");
  }, []);

  const restart = start;

  const submit = (userInput: string) => {
    if (!question || phase !== "playing") return;

    const normGuess = normalizeName(userInput);
    const normAnswer = normalizeName(question.answer);

    const isCorrect = normGuess === normAnswer;

    if (isCorrect) {
      const nextScore = score + 1;
      if (nextScore > bestScore) {
        setBestScore(nextScore);
        localStorage.setItem(BEST_KEY, String(nextScore));
      }
      setScore(nextScore);
      setPhase("won");
    } else {
      setPhase("wrong");
    }
  };

  const goNext = () => {
    const nextIndex = levelIndex + 1;
    if (nextIndex >= TOTAL_FLAGS) {
      setPhase("finished");
    } else {
      setLevelIndex(nextIndex);
      setPhase("playing");
    }
  };

  const continueAfterWrong = goNext;

  return {
    // progress
    level: levelIndex + 1,      // show as X/195
    score,                      // correct answers this run
    bestScore,                  // persistent best
    total: TOTAL_FLAGS,

    // state
    phase,
    question,

    // actions
    start,
    restart,
    submit,
    nextLevel: goNext,
    continueAfterWrong,
  };
}
