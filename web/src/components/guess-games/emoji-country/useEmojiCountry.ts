import * as React from "react";
import { COUNTRIES } from "../flag-guess/countries";
import { CLUES_BY_CODE } from "./clues";

type Phase = "idle" | "playing" | "won" | "wrong" | "finished";

export type EmojiQuestion = {
  code: string;        // ISO 3166-1 alpha-2
  country: string;     // country display name
  emojis: string[];    // emoji sequence as clues
  hint?: string;       // optional short hint
  answers: string[];   // accepted country names / aliases
};

const BEST_KEY = "emoji-country-best-score";

/** normalize user text for forgiving matches */
function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")         // accents
    .replace(/[\s'’"().,/-]+/g, " ")         // punctuation-ish
    .replace(/\s+/g, " ");
}

/** country aliases for friendlier acceptance */
const ALIASES_BY_CODE: Record<string, string[]> = {
  US: ["usa", "us", "united states", "united states of america", "america"],
  GB: ["uk", "u.k.", "united kingdom", "great britain", "britain"],
  AE: ["uae", "united arab emirates"],
  CN: ["prc", "people's republic of china", "peoples republic of china"],
  KR: ["south korea", "republic of korea", "korea south", "korea (south)"],
  KP: ["north korea", "dprk", "democratic people's republic of korea", "korea north", "korea (north)"],
  RU: ["russia", "russian federation"],
  CZ: ["czechia", "czech republic"],
  CD: ["drc", "congo-kinshasa", "democratic republic of the congo"],
  CG: ["congo", "republic of the congo", "congo-brazzaville"],
  CI: ["cote d'ivoire", "cote d ivoire", "ivory coast"],
  MK: ["north macedonia", "macedonia"],
  SZ: ["eswatini", "swaziland"],
  TR: ["turkiye", "turkey"],
  NL: ["netherlands", "holland"],
  VA: ["vatican", "holy see", "the holy see"],
  PS: ["palestine", "state of palestine", "palestinian territories"],
  IR: ["iran", "islamic republic of iran"],
  BO: ["bolivia", "plurinational state of bolivia"],
  TZ: ["tanzania", "united republic of tanzania"],
  // add more as needed
};

/** make a playable question from a country record if we have clues */
function makeQuestion(code: string, name: string): EmojiQuestion | null {
  const clue = CLUES_BY_CODE[code];
  if (!clue) return null;

  const canonical = normalize(name);
  const aliases = (ALIASES_BY_CODE[code] ?? []).map(normalize);
  const answers = Array.from(new Set([canonical, ...aliases]));

  return {
    code,
    country: name,
    emojis: clue.emojis,
    hint: clue.hint,
    answers,
  };
}

/** only include countries we actually have clues for */
const POOL = COUNTRIES.filter((c) => !!CLUES_BY_CODE[c.code]);

export const TOTAL_ITEMS = POOL.length;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useEmojiCountry() {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [queue, setQueue] = React.useState<typeof POOL>([]);
  const [idx, setIdx] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [bestScore, setBestScore] = React.useState(
    Number(localStorage.getItem(BEST_KEY) || 0)
  );

  // Pre-generate to keep Level 1 preview in sync
  const [pending, setPending] = React.useState<typeof POOL>(() => shuffle(POOL));
  const firstQuestion = React.useMemo(
    () => (pending[0] ? makeQuestion(pending[0].code, pending[0].name) : null),
    [pending]
  );

  const question = React.useMemo<EmojiQuestion | null>(() => {
    if (phase === "idle" || phase === "finished" || queue.length === 0) return null;
    const c = queue[idx];
    return c ? makeQuestion(c.code, c.name) : null;
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
