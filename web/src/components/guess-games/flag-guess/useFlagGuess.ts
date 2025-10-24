import * as React from "react";
import { COUNTRIES } from "./countries";

type Phase = "idle" | "playing" | "won" | "wrong" | "lost";

export type Question = {
  flag: string;
  answer: string;
  options: string[];
};

const BEST_KEY = "flag-guess-best";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeQuestion(optionsCount = 4): Question {
  const pool = COUNTRIES;
  const answerCountry = pool[Math.floor(Math.random() * pool.length)];
  const others = shuffle(pool.filter((c) => c.name !== answerCountry.name)).slice(
    0,
    Math.max(0, optionsCount - 1)
  );
  const options = shuffle([answerCountry.name, ...others.map((c) => c.name)]);
  return { flag: answerCountry.flag, answer: answerCountry.name, options };
}

export function useFlagGuess(
  lives = 3,
  optionsCount = 4
) {
  const [level, setLevel] = React.useState(1);
  const [bestLevel, setBestLevel] = React.useState(
    Number(localStorage.getItem(BEST_KEY) || 0)
  );
  const [hearts, setHearts] = React.useState(lives);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [question, setQuestion] = React.useState<Question | null>(null);

  const start = React.useCallback(() => {
    setLevel(1);
    setHearts(lives);
    setQuestion(makeQuestion(optionsCount));
    setPhase("playing");
  }, [lives, optionsCount]);

  const restart = start;

  const submit = (name: string) => {
    if (!question || phase !== "playing") return;
    if (name === question.answer) {
      const next = level + 1;
      const newBest = Math.max(bestLevel, next - 1);
      if (newBest !== bestLevel) {
        setBestLevel(newBest);
        localStorage.setItem(BEST_KEY, String(newBest));
      }
      setPhase("won");
    } else {
      const left = hearts - 1;
      setHearts(left);
      if (left <= 0) {
        setPhase("lost");
      } else {
        setPhase("wrong");
      }
    }
  };

  const nextLevel = () => {
    setLevel((l) => l + 1);
    setQuestion(makeQuestion(optionsCount));
    setPhase("playing");
  };

  const continueAfterWrong = () => {
    // New question, same level
    setQuestion(makeQuestion(optionsCount));
    setPhase("playing");
  };

  return {
    level,
    bestLevel,
    hearts,
    phase,
    question,
    start,
    restart,
    nextLevel,
    submit,
    continueAfterWrong,
  };
}
