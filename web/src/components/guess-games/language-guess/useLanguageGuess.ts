// components/guess-games/language-guess/useLanguageGuess.ts
import * as React from "react";
import { LANGUAGES } from "./languages";

type Phase = "idle" | "playing" | "won" | "wrong" | "finished";

export type LangQuestion = {
  code: string;
  language: string;
  dir: "ltr" | "rtl";
  sample: string;
  answers: string[]; // normalized accepted names
};

const BEST_KEY = "language-guess-best-score";

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
    .replace(/[\u0300-\u036f]/g, "")   // accents
    .replace(/[\s'’"().,/-]+/g, " ")   // punctuation-ish
    .replace(/\s+/g, " ");
}

function makeQuestion(idx: number): LangQuestion {
  const entry = LANGUAGES[idx];
  const sample =
    entry.samples[Math.floor(Math.random() * entry.samples.length)] || entry.samples[0];

  const answers = [entry.name, ...(entry.also ?? [])].map(normalize);

  return {
    code: entry.code,
    language: entry.name,
    dir: entry.dir ?? "ltr",
    sample,
    answers,
  };
}

const POOL_INDEXES = LANGUAGES.map((_, i) => i);
export const TOTAL_ITEMS = POOL_INDEXES.length;

export function useLanguageGuess() {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [queue, setQueue] = React.useState<number[]>([]);
  const [idx, setIdx] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [bestScore, setBestScore] = React.useState(
    Number(localStorage.getItem(BEST_KEY) || 0)
  );

  // Pre-shuffle the next run for preview
  const [pending, setPending] = React.useState<number[]>(() => shuffle(POOL_INDEXES));
  const firstQuestion = React.useMemo(() => makeQuestion(pending[0] ?? 0), [pending]);

  const question = React.useMemo<LangQuestion | null>(() => {
    if (phase === "idle" || phase === "finished" || queue.length === 0) return null;
    const qIdx = queue[idx];
    return qIdx !== undefined ? makeQuestion(qIdx) : null;
  }, [queue, idx, phase]);

  const start = React.useCallback(() => {
    setQueue(pending);
    setIdx(0);
    setScore(0);
    setPhase("playing");
    setPending(shuffle(POOL_INDEXES));
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
