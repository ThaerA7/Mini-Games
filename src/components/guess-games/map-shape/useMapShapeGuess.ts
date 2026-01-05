import * as React from "react";
import { COUNTRIES } from "../flag-guess/countries";

export type Phase = "idle" | "playing" | "won" | "wrong" | "finished";

export type Question = {
  code: string; // ISO 3166-1 alpha-2
  answer: string; // canonical name from COUNTRIES
};

const BEST_KEY = "map-shape-best-score";
export const TOTAL_COUNTRIES = COUNTRIES.length; // 195

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
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[\s'’"().,\/-]+/g, " ") // collapse punctuation-ish
    .replace(/\s+/g, " "); // normalize spaces
}

// alias map for user-friendly answers.
const ALIASES: Record<string, string> = {
  "ivory coast": "Côte d'Ivoire",
  "cote d ivoire": "Côte d'Ivoire",
  "czech republic": "Czechia",
  swaziland: "Eswatini",
  burma: "Myanmar",
  "cape verde": "Cabo Verde",
  turkey: "Türkiye",
  uae: "United Arab Emirates",
  "united arab emirates": "United Arab Emirates",
  uk: "United Kingdom",
  "united kingdom": "United Kingdom",
  usa: "United States",
  "united states of america": "United States",
  vatican: "Holy See",
  "vatican city": "Holy See",
  palestine: "State of Palestine",
  drc: "Democratic Republic of the Congo",
  "congo kinshasa": "Democratic Republic of the Congo",
  "congo brazzaville": "Congo",
  "sao tome": "São Tomé and Príncipe",
  "sao tome and principe": "São Tomé and Príncipe",
  laos: "Laos",
  "brunei darussalam": "Brunei",
  "east timor": "Timor-Leste",
};

function makeQuestionFromCountry(c: { code: string; name: string }): Question {
  return { code: c.code, answer: c.name };
}

export function useMapShapeGuess() {
  const [phase, setPhase] = React.useState<Phase>("idle");

  const [queue, setQueue] = React.useState<typeof COUNTRIES>([]);
  const [levelIndex, setLevelIndex] = React.useState(0);
  const [score, setScore] = React.useState(0);

  const [bestScore, setBestScore] = React.useState(
    Number(localStorage.getItem(BEST_KEY) || 0),
  );

  const [pendingQueue, setPendingQueue] = React.useState<typeof COUNTRIES>(() =>
    shuffle(COUNTRIES),
  );
  const upcomingFirst: Question = React.useMemo(
    () => makeQuestionFromCountry(pendingQueue[0]),
    [pendingQueue],
  );

  const question = React.useMemo<Question | null>(() => {
    if (phase === "idle" || phase === "finished" || queue.length === 0)
      return null;
    const c = queue[levelIndex];
    return c ? makeQuestionFromCountry(c) : null;
  }, [queue, levelIndex, phase]);

  const start = React.useCallback(() => {
    setQueue(pendingQueue);
    setLevelIndex(0);
    setScore(0);
    setPhase("playing");
    setPendingQueue(shuffle(COUNTRIES));
  }, [pendingQueue]);

  const restart = start;

  const canonicalize = (raw: string): string => {
    const norm = normalizeName(raw);
    const alias = ALIASES[norm];
    return alias ?? raw.trim();
  };

  const submit = (userInput: string) => {
    if (!question || phase !== "playing") return;

    const guessText = canonicalize(userInput);

    const isCorrect =
      normalizeName(guessText) === normalizeName(question.answer);

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
    if (nextIndex >= TOTAL_COUNTRIES) {
      setPhase("finished");
    } else {
      setLevelIndex(nextIndex);
      setPhase("playing");
    }
  };

  const continueAfterWrong = goNext;

  return {
    // progress
    level: levelIndex + 1,
    score,
    bestScore,
    total: TOTAL_COUNTRIES,

    // state
    phase,
    question,
    upcomingFirst,

    // actions
    start,
    restart,
    submit,
    nextLevel: goNext,
    continueAfterWrong,
  };
}
