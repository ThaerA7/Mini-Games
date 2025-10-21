// src/components/sequence-memory/useSequenceMemoryGame.ts
import React from "react";

export type SeqPhase = "ready" | "show" | "input" | "countdown" | "lost";

const GRID_SIZE = 4;              // fixed 4x4 grid
const MISTAKES_ALLOWED = 3;       // three strikes (3 hearts)

const FLASH_ON_MS = 520;          // each flash duration
const FLASH_GAP_MS = 230;         // gap between flashes

const STORAGE_KEYS = {
  bestLevel: "seqmem.bestLevel",
  bestScore: "seqmem.bestScore",
} as const;

function pickSequence(total: number, length: number): number[] {
  const seq: number[] = [];
  for (let i = 0; i < length; i++) {
    seq.push(Math.floor(Math.random() * total)); // sample with replacement
  }
  return seq;
}
export function useSequenceMemoryGame() {
  // GAME STATE
  const [phase, setPhase] = React.useState<SeqPhase>("ready");
  const [seqLen, setSeqLen] = React.useState<number>(3); // starts at 3, then 4, 5, ...
  const [sequence, setSequence] = React.useState<number[]>([]);
  const [flashIndex, setFlashIndex] = React.useState<number | null>(null);
  const [inputPos, setInputPos] = React.useState(0);
  const [mistakes, setMistakes] = React.useState(0);
  const [wrongAt, setWrongAt] = React.useState<number | null>(null);
const [inputStartAt, setInputStartAt] = React.useState<number | null>(null);
const [avgMsPerPick, setAvgMsPerPick] = React.useState<number | null>(null);
  // SCORE
  const [score, setScore] = React.useState(0);
  const [bestLevel, setBestLevel] = React.useState<number>(() =>
    Number(localStorage.getItem(STORAGE_KEYS.bestLevel) || 0)
  );
  const [bestScore, setBestScore] = React.useState<number>(() =>
    Number(localStorage.getItem(STORAGE_KEYS.bestScore) || 0)
  );

  // RUN TIMER (total seconds since Start; resets on Start/Restart)
  const [seconds, setSeconds] = React.useState(0);

  // countdown seconds when auto-advancing
  const [countdown, setCountdown] = React.useState(0);

  const timers = React.useRef<number[]>([]);
  const clearTimers = React.useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  // main game loop for showing flashes
  const scheduleShow = React.useCallback((len: number) => {
  const seq = pickSequence(GRID_SIZE * GRID_SIZE, len);
  setSequence(seq);
  setFlashIndex(null);
  setInputPos(0);
  setWrongAt(null);
  setPhase("show");

  let when = 400;
  seq.forEach((_, i) => {
    timers.current.push(window.setTimeout(() => setFlashIndex(i), when));
    when += FLASH_ON_MS;
    timers.current.push(window.setTimeout(() => setFlashIndex(null), when));
    when += FLASH_GAP_MS;
  });

  // NEW: enter input + mark start time
  timers.current.push(window.setTimeout(() => {
    setPhase("input");
    setInputStartAt(Date.now());
    setAvgMsPerPick(null);
  }, when));
}, []);


  const start = React.useCallback(() => {
  clearTimers();
  setScore(0);
  setSeqLen(3);
  setMistakes(0);
  setCountdown(0);
  setSeconds(0);
  setAvgMsPerPick(null);       
  setInputStartAt(null);      
  scheduleShow(3);
}, [clearTimers, scheduleShow]);

  const nextLevel = React.useCallback(() => {
  clearTimers();
  setSeqLen((prev) => {
    const next = prev + 1;
    setAvgMsPerPick(null);     // NEW
    setInputStartAt(null);     // NEW
    scheduleShow(next);
    return next;
  });
}, [clearTimers, scheduleShow]);


  const restart = React.useCallback(() => {
  clearTimers();
  setPhase("ready");
  setSequence([]);
  setFlashIndex(null);
  setInputPos(0);
  setMistakes(0);
  setWrongAt(null);
  setScore(0);
  setSeqLen(3);
  setCountdown(0);
  setSeconds(0);
  setAvgMsPerPick(null);       // NEW
  setInputStartAt(null);       // NEW
}, [clearTimers]);


  const beginAutoAdvance = React.useCallback(() => {
    // 3-second visible countdown then go to next level
    setCountdown(3);
    setPhase("countdown");
    timers.current.push(window.setTimeout(() => setCountdown(2), 1000));
    timers.current.push(window.setTimeout(() => setCountdown(1), 2000));
    timers.current.push(
      window.setTimeout(() => {
        setCountdown(0);
        nextLevel();
      }, 3000)
    );
  }, [nextLevel]);

  const handleCellClick = React.useCallback(
  (index: number) => {
    if (phase !== "input") return;
    const expected = sequence[inputPos];
    if (index === expected) {
      const next = inputPos + 1;
      setInputPos(next);
      if (next >= sequence.length) {
        // finished the level — compute avg ms/pick for this level
        setScore((s) => {
          const ns = s + seqLen;
          if (ns > bestScore) {
            localStorage.setItem(STORAGE_KEYS.bestScore, String(ns));
            setBestScore(ns);
          }
          return ns;
        });
        if (seqLen > bestLevel) {
          localStorage.setItem(STORAGE_KEYS.bestLevel, String(seqLen));
          setBestLevel(seqLen);
        }

        if (inputStartAt != null && sequence.length > 0) {
          const duration = Date.now() - inputStartAt;
          setAvgMsPerPick(duration / sequence.length);
        } else {
          setAvgMsPerPick(null);
        }
        setInputStartAt(null);
        beginAutoAdvance();
      }
    } else {
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      setWrongAt(index);
      const t = window.setTimeout(() => setWrongAt(null), 400);
      timers.current.push(t);

      if (nextMistakes >= MISTAKES_ALLOWED) {
        // compute avg with the correct picks done so far
        const picksSoFar = inputPos;
        if (inputStartAt != null && picksSoFar > 0) {
          const duration = Date.now() - inputStartAt;
          setAvgMsPerPick(duration / picksSoFar);
        } else {
          setAvgMsPerPick(null);
        }
        setInputStartAt(null);
        setPhase("lost");
      }
    }
  },
  [phase, inputPos, sequence, mistakes, seqLen, bestLevel, bestScore, beginAutoAdvance, inputStartAt]
);


  // Run timer: tick when the game is active (not in ready or lost)
  React.useEffect(() => {
    if (phase === "ready" || phase === "lost") return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  React.useEffect(() => () => clearTimers(), [clearTimers]);

  return {
  // constants
  GRID_SIZE,

  // state
  phase,
  sequence,
  flashIndex,
  inputPos,
  mistakes,
  wrongAt,
  seqLen,
  countdown,
  seconds,

  // scores
  score,
  bestLevel,
  bestScore,

  // NEW metric
  avgMsPerPick,

  // actions
  start,
  nextLevel,
  restart,
  handleCellClick,
} as const;

}



