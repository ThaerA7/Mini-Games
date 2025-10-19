import React from "react";

export type SeqPhase = "ready" | "show" | "input" | "won" | "lost";

const GRID_SIZE = 4;              // 4x4 grid
const SEQ_LEN = 3;                // flash 3 cells
const MISTAKES_ALLOWED = 2;       // two strikes

const FLASH_ON_MS = 520;          // each flash duration
const FLASH_GAP_MS = 230;         // gap between flashes

function pickUniqueSequence(total: number, length: number): number[] {
  const pool = Array.from({ length: total }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(total, length));
}

export function useSequenceMemoryGame() {
  const [phase, setPhase] = React.useState<SeqPhase>("ready");
  const [sequence, setSequence] = React.useState<number[]>([]);
  const [flashIndex, setFlashIndex] = React.useState<number | null>(null);
  const [inputPos, setInputPos] = React.useState(0);
  const [mistakes, setMistakes] = React.useState(0);
  const [wrongAt, setWrongAt] = React.useState<number | null>(null);

  const timers = React.useRef<number[]>([]);
  const clearTimers = React.useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const start = React.useCallback(() => {
    clearTimers();
    const seq = pickUniqueSequence(GRID_SIZE * GRID_SIZE, SEQ_LEN);
    setSequence(seq);
    setPhase("show");
    setFlashIndex(null);
    setInputPos(0);
    setMistakes(0);
    setWrongAt(null);

    // Schedule the flashing sequence
    let when = 400; // small lead-in
    seq.forEach((_, i) => {
      // turn "on"
      timers.current.push(
        window.setTimeout(() => setFlashIndex(i), when)
      );
      when += FLASH_ON_MS;

      // turn "off"
      timers.current.push(
        window.setTimeout(() => setFlashIndex(null), when)
      );
      when += FLASH_GAP_MS;
    });

    // After last gap, move to input phase
    timers.current.push(
      window.setTimeout(() => setPhase("input"), when)
    );
  }, [clearTimers]);

  const restart = React.useCallback(() => {
    setPhase("ready");
    setSequence([]);
    setFlashIndex(null);
    setInputPos(0);
    setMistakes(0);
    setWrongAt(null);
    clearTimers();
  }, [clearTimers]);

  const handleCellClick = React.useCallback(
    (index: number) => {
      if (phase !== "input") return;
      const expected = sequence[inputPos];
      if (index === expected) {
        const next = inputPos + 1;
        setInputPos(next);
        if (next >= sequence.length) {
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
    [phase, inputPos, sequence, mistakes]
  );

  React.useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    // constants
    GRID_SIZE,
    SEQ_LEN,
    MISTAKES_ALLOWED,

    // state
    phase,
    sequence,
    flashIndex,     // which item in the sequence is currently flashing (null if none)
    inputPos,       // how many correct steps entered
    mistakes,
    wrongAt,

    // actions
    start,
    restart,
    handleCellClick,
  };
}
