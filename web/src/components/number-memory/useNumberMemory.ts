import * as React from "react";

export type Phase = "idle" | "show" | "input" | "won" | "lost" | "wrong";

const BEST_KEY = "number_best_level";
const REVEAL_MS_DEFAULT = 3000;

export function useNumberMemory(revealMs: number = REVEAL_MS_DEFAULT) {
  const [level, setLevel] = React.useState(1);
  const [bestLevel, setBestLevel] = React.useState<number>(() => {
    const v =
      typeof window !== "undefined" ? localStorage.getItem(BEST_KEY) : null;
    return v ? Number(v) : 1;
  });
  const [hearts, setHearts] = React.useState(3);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [target, setTarget] = React.useState<string>("");
  const [msLeft, setMsLeft] = React.useState<number>(revealMs);

  const makeNumber = React.useCallback((len: number) => {
    const first = String(Math.floor(Math.random() * 9) + 1);
    let s = first;
    for (let i = 1; i < len; i++) s += String(Math.floor(Math.random() * 10));
    return s;
  }, []);

  const prepareRound = React.useCallback(
    (len: number) => {
      setTarget(makeNumber(len));
      setMsLeft(revealMs);
      setPhase("show");
    },
    [makeNumber, revealMs]
  );

  // countdown while showing number
  React.useEffect(() => {
    if (phase !== "show") return;
    let raf = 0;
    const start = performance.now();

    const tick = (t: number) => {
      const dt = t - start;
      const remain = Math.max(0, revealMs - dt);
      setMsLeft(remain);
      if (remain <= 0) {
        setPhase("input");
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, revealMs]);

  function start() {
    setHearts(3);
    setLevel(1);
    prepareRound(1);
  }

  function restart() {
    setHearts(3);
    setLevel(1);
    setPhase("idle");
    setTarget("");
    setMsLeft(revealMs);
  }

  function nextLevel() {
    const nl = level + 1;
    setLevel(nl);
    prepareRound(nl);
  }

  function submit(guess: string) {
    if (phase !== "input") return;
    if (guess.trim() === target) {
      const nextLevelVal = level + 1;
      setBestLevel((b) => {
        const nb = Math.max(b, nextLevelVal);
        if (typeof window !== "undefined")
          localStorage.setItem(BEST_KEY, String(nb));
        return nb;
      });
      setPhase("won");
    } else {
      setHearts((h) => {
        const nh = h - 1;
        if (nh <= 0) {
          setPhase("lost");
        } else {
          // Show a dialog; user can manually retry same level.
          setPhase("wrong");
        }
        return nh;
      });
    }
  }

  // Called from the "wrong" dialog to retry the same level.
  function continueAfterWrong() {
    if (phase === "wrong") {
      prepareRound(level);
    }
  }

  return {
    level,
    bestLevel,
    hearts,
    phase,
    target,
    msLeft,
    start,
    restart,
    nextLevel,
    submit,
    continueAfterWrong,
  };
}
