// src/components/visual-memory/useVisualMemoryGame.ts
import React from "react";
import type { Phase } from "./GameBoard";

type Stats = { rounds: number; bestLevel: number };

// === Timing (fixed for all levels) ===
const REVEAL_MS_FIXED = 1200;
const ADVANCE_MS = 380; // fast but smooth next-level hop

// === Hearts ===
const HEARTS_INITIAL = 3;

// === Grid & pattern rules ===
const GRID_MIN = 3;
// allow going far beyond 20x20 if someone gets that far ;)
const GRID_MAX = 99;
const MAX_PATTERN_RATIO = 0.6; // cap white squares at 60%

// Repeats per grid size:
// - 3x3 repeats 3 times (3,4,5)
// - 4x4 and larger repeat 5 times (N, N+1, N+2, N+3, N+4)
const playsPerSizeForGrid = (g: number) => (g === 3 ? 3 : 5);

// Base white squares for an N×N grid start at N.
const basePatternCountForGrid = (g: number) => g;

// Hearts rule (unchanged):
// - 3x3 & 4x4: 1 mistake => lose a heart
// - 5x5 and larger: 3 mistakes => lose a heart
const mistakesPerHeartForGrid = (g: number) => (g <= 4 ? 1 : 3);

const clampPattern = (g: number, count: number) =>
  Math.min(count, Math.floor(g * g * MAX_PATTERN_RATIO));

export function useVisualMemoryGame() {
  // Level increases after each win
  const [level, setLevel] = React.useState(1);

  // Phase + timers
  const [phase, setPhase] = React.useState<Phase>("idle");
  const revealTimer = React.useRef<number | null>(null);
  const advanceTimer = React.useRef<number | null>(null);

  // Current grid state
  const [gridSize, setGridSize] = React.useState(GRID_MIN);
  const [repeatAtSize, setRepeatAtSize] = React.useState(0); // 0..(playsPerSizeForGrid-1)
  const [patternCount, setPatternCount] = React.useState(
    basePatternCountForGrid(GRID_MIN)
  );
  const [revealMs, setRevealMs] = React.useState(REVEAL_MS_FIXED);

  // Pattern & selections
  const [pattern, setPattern] = React.useState<number[]>([]);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());

  // Run stats
  const [stats, setStats] = React.useState<Stats>({ rounds: 0, bestLevel: 1 });
  const [running, setRunning] = React.useState(false);

  // Hearts + mistake bucket (mistakes since last heart loss)
  const [hearts, setHearts] = React.useState(HEARTS_INITIAL);
  const [mistakes, setMistakes] = React.useState(0);

  const clearTimers = React.useCallback(() => {
    if (revealTimer.current) {
      window.clearTimeout(revealTimer.current);
      revealTimer.current = null;
    }
    if (advanceTimer.current) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }, []);

  function pickRandomCells(totalCells: number, count: number): number[] {
    const indices = Array.from({ length: totalCells }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices
      .slice(0, Math.max(0, Math.min(count, totalCells)))
      .sort((a, b) => a - b);
  }

  const startLevel = React.useCallback(() => {
    const g = gridSize;
    const effectiveCount = clampPattern(g, patternCount);

    setRevealMs(REVEAL_MS_FIXED);
    setSelected(new Set());
    setPattern(pickRandomCells(g * g, effectiveCount));
    setPhase("show");

    clearTimers();
    revealTimer.current = window.setTimeout(
      () => setPhase("guess"),
      REVEAL_MS_FIXED
    );
  }, [gridSize, patternCount, clearTimers]);

  const startRun = React.useCallback(() => {
    clearTimers();
    setHearts(HEARTS_INITIAL);
    setMistakes(0);

    setLevel(1);
    setRunning(true);
    setPhase("idle");

    setGridSize(GRID_MIN);
    setRepeatAtSize(0);
    setPatternCount(basePatternCountForGrid(GRID_MIN));
    setRevealMs(REVEAL_MS_FIXED);
  }, [clearTimers]);

  const restartRun = React.useCallback(() => {
    clearTimers();
    setRunning(false);

    setHearts(HEARTS_INITIAL);
    setMistakes(0);
    setSelected(new Set());
    setPattern([]);

    setLevel(1);
    setPhase("idle");
    setGridSize(GRID_MIN);
    setRepeatAtSize(0);
    setPatternCount(basePatternCountForGrid(GRID_MIN));
    setRevealMs(REVEAL_MS_FIXED);
  }, [clearTimers]);

  // Auto-start the first level when a run begins, and each subsequent level when we switch back to idle
  React.useEffect(() => {
    if (running && phase === "idle") {
      startLevel();
    }
  }, [running, phase, startLevel]);

  const handleCellClick = React.useCallback(
    (index: number) => {
      if (phase !== "guess") return;

      setSelected((prev) => {
        if (prev.has(index)) return prev;
        const next = new Set(prev);
        next.add(index);

        const correctSet = new Set(pattern);
        const isWrong = !correctSet.has(index);

        if (isWrong) {
          // Mistake handling w/ dynamic threshold based on grid size
          const threshold = mistakesPerHeartForGrid(gridSize);
          let bucket = mistakes + 1;
          let heartsLeft = hearts;

          if (bucket >= threshold) {
            bucket -= threshold;
            heartsLeft = Math.max(0, heartsLeft - 1);
          }

          setMistakes(bucket);
          if (heartsLeft !== hearts) setHearts(heartsLeft);

          if (heartsLeft <= 0) {
            setPhase("lost");
            setRunning(false);
            setStats((s) => ({
              rounds: s.rounds + 1,
              bestLevel: Math.max(s.bestLevel, level),
            }));
            return next;
          }
        }

        // Check win
        const allFound = Array.from(correctSet).every((i) => next.has(i));
        if (allFound) {
          setPhase("won");
          setStats((s) => ({ ...s, bestLevel: Math.max(s.bestLevel, level) }));

          // Progression per rules described above
          const currentSize = gridSize;
          const currentRepeat = repeatAtSize;
          const currentCount = patternCount;

          const totalPlaysForSize = playsPerSizeForGrid(currentSize);

          let nextSize = currentSize;
          let nextRepeat = currentRepeat;
          let nextCount = currentCount;

          if (currentRepeat < totalPlaysForSize - 1) {
            // Repeat same size: +1 white square (capped by ratio)
            nextRepeat = currentRepeat + 1;
            nextCount = clampPattern(currentSize, currentCount + 1);
          } else {
            // Advance size: reset repeat counter and base count = next grid size
            nextSize = Math.min(currentSize + 1, GRID_MAX);
            nextRepeat = 0;
            nextCount = basePatternCountForGrid(nextSize);
          }

          clearTimers();
          advanceTimer.current = window.setTimeout(() => {
            setLevel((l) => l + 1);
            setGridSize(nextSize);
            setRepeatAtSize(nextRepeat);
            setPatternCount(nextCount);
            setPhase("idle");
          }, ADVANCE_MS);
        }

        return next;
      });
    },
    [
      phase,
      pattern,
      gridSize,
      repeatAtSize,
      patternCount,
      hearts,
      mistakes,
      level,
      clearTimers,
    ]
  );

  const isCellCorrect = React.useCallback(
    (index: number) => pattern.includes(index),
    [pattern]
  );

  React.useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    // state
    level,
    gridSize,
    phase,
    revealMs,
    pattern,
    selected,
    stats,
    hearts,
    running,
    // actions
    startRun,
    restartRun,
    handleCellClick,
    isCellCorrect,
  };
}
