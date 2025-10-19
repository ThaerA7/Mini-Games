// src/components/sequence-memory/useSequenceMemoryGame.ts
import React from "react";

export type SeqPhase = "ready" | "show" | "input" | "won" | "lost";

const GRID_SIZE = 4;              // fixed 4x4 grid
const MISTAKES_ALLOWED = 2;       // two strikes

const FLASH_ON_MS = 520;          // each flash duration
const FLASH_GAP_MS = 230;         // gap between flashes

const STORAGE_KEYS = {
  bestLevel: "seqmem.bestLevel",
  bestScore: "seqmem.bestScore",
} as const;

function pickUniqueSequence(total: number, length: number): number[] {
  const pool = Array.from({ length: total }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(total, length));
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

  // SCORE
  const [score, setScore] = React.useState(0);
  const [bestLevel, setBestLevel] = React.useState<number>(() =>
    Number(localStorage.getItem(STORAGE_KEYS.bestLevel) || 0)
  );
  const [bestScore, setBestScore] = React.useState<number>(() =>
    Number(localStorage.getItem(STORAGE_KEYS.bestScore) || 0)
  );

  const timers = React.useRef<number[]>([]);
  const clearTimers = React.useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const scheduleShow = React.useCallback((len: number) => {
    const seq = pickUniqueSequence(GRID_SIZE * GRID_SIZE, len);
    setSequence(seq);
    setFlashIndex(null);
    setInputPos(0);
    setMistakes(0);
    setWrongAt(null);
    setPhase("show");

    // schedule flashes
    let when = 400; // small lead-in
    seq.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setFlashIndex(i), when));
      when += FLASH_ON_MS;
      timers.current.push(window.setTimeout(() => setFlashIndex(null), when));
      when += FLASH_GAP_MS;
    });
    timers.current.push(window.setTimeout(() => setPhase("input"), when));
  }, []);

  const start = React.useCallback(() => {
    clearTimers();
    setScore(0);
    setSeqLen(3);
    scheduleShow(3);
  }, [clearTimers, scheduleShow]);

  const nextLevel = React.useCallback(() => {
    clearTimers();
    setScore((s) => s); // no change here; score was granted on win
    setSeqLen((prev) => {
      const next = prev + 1;
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
  }, [clearTimers]);

  const handleCellClick = React.useCallback(
    (index: number) => {
      if (phase !== "input") return;
      const expected = sequence[inputPos];
      if (index === expected) {
        const next = inputPos + 1;
        setInputPos(next);
        if (next >= sequence.length) {
          // WON this level
          setScore((s) => {
            const ns = s + seqLen; // 1 point per correct pick
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
          setPhase("won");
        }
      } else {
        const nextMistakes = mistakes + 1;
        setMistakes(nextMistakes);
        setWrongAt(index);
        const t = window.setTimeout(() => setWrongAt(null), 400);
        timers.current.push(t);
        if (nextMistakes >= MISTAKES_ALLOWED) {
          setPhase("lost");
        }
      }
    },
    [phase, inputPos, sequence, mistakes, seqLen, bestLevel, bestScore]
  );

  React.useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    // constants
    GRID_SIZE,

    // state
    phase,
    sequence,
    flashIndex,     // which item in the sequence is currently flashing (null if none)
    inputPos,       // how many correct steps entered
    mistakes,
    wrongAt,
    seqLen,

    // scores
    score,
    bestLevel,
    bestScore,

    // actions
    start,
    nextLevel,
    restart,
    handleCellClick,
  } as const;
}
