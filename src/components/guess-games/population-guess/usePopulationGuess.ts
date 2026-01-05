// components/guess-games/population-guess/usePopulationGuess.ts
import * as React from "react";
import { COUNTRIES } from "../flag-guess/countries";
import { POP_BY_CODE } from "./populations";

export type Phase = "idle" | "playing" | "won" | "wrong" | "finished";

export type PopQuestion = {
  code: string; // ISO 3166-1 alpha-2
  flag: string; // fallback emoji (same as other games)
  country: string; // display name
  population: number; // ground truth
  acceptedMin: number; // inclusive
  acceptedMax: number; // inclusive
};

const BEST_KEY = "population-guess-best-score";
const TOLERANCE_PCT = 0.15; // ±15% feels fair: challenging but forgiving

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeQuestion(
  code: string,
  name: string,
  flag: string,
): PopQuestion | null {
  const pop = POP_BY_CODE[code];
  if (!pop) return null;
  const delta = Math.round(pop * TOLERANCE_PCT);
  const acceptedMin = Math.max(0, pop - delta);
  const acceptedMax = pop + delta;
  return {
    code,
    flag,
    country: name,
    population: pop,
    acceptedMin,
    acceptedMax,
  };
}

const POOL_RAW = COUNTRIES.filter((c) => !!POP_BY_CODE[c.code]);
export const TOTAL_ITEMS = POOL_RAW.length;

export function usePopulationGuess() {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [queue, setQueue] = React.useState<typeof POOL_RAW>([]);
  const [idx, setIdx] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [bestScore, setBestScore] = React.useState(
    Number(localStorage.getItem(BEST_KEY) || 0),
  );

  // Precompute a pending queue so Level 1 preview stays in sync
  const [pending, setPending] = React.useState<typeof POOL_RAW>(() =>
    shuffle(POOL_RAW),
  );
  const firstQuestion = React.useMemo(
    () => makeQuestion(pending[0]?.code, pending[0]?.name, pending[0]?.flag),
    [pending],
  );

  const question = React.useMemo<PopQuestion | null>(() => {
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
    setPending(shuffle(POOL_RAW));
  }, [pending]);

  const restart = start;

  // Parse flexible numeric input, e.g. "83m", "1.4b", "83,200,000", "83 million"
  function parsePopulationInput(raw: string): number | null {
    const s = raw.trim().toLowerCase();
    if (!s) return null;

    // Replace commas/underscores/spaces around numbers, keep decimal point
    let t = s.replace(/,/g, "").replace(/_/g, "").replace(/\s+/g, " ").trim();

    // Detect units
    let multiplier = 1;
    if (/\b(b|bn|billion)\b/.test(t)) multiplier = 1_000_000_000;
    else if (/\b(m|mn|million)\b/.test(t)) multiplier = 1_000_000;
    else if (/\b(k|thousand)\b/.test(t)) multiplier = 1_000;

    t = t.replace(/\b(bn?|billion|mn?|million|k|thousand)\b/g, "").trim();

    const num = parseFloat(t);
    if (Number.isFinite(num)) return Math.round(num * multiplier);

    // Last resort: extract first number chunk
    const m = t.match(/\d+(?:\.\d+)?/);
    if (m) return Math.round(parseFloat(m[0]) * multiplier);

    return null;
  }

  const submit = (userInput: string) => {
    if (!question || phase !== "playing") return;
    const guess = parsePopulationInput(userInput);
    if (guess == null) {
      setPhase("wrong");
      return;
    }
    const { acceptedMin, acceptedMax } = question;
    const isCorrect = guess >= acceptedMin && guess <= acceptedMax;
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

  // helpers for UI
  const fmt = (n: number) => new Intl.NumberFormat(undefined).format(n);

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

    format: fmt,
    tolerancePct: TOLERANCE_PCT,
  };
}
