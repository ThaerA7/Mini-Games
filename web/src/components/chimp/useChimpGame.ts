import * as React from "react";

export type Phase = "idle" | "show" | "input" | "won" | "lost";

export type Cell = {
  idx: number; // 0..(gridSize*gridSize-1)
  number?: number; // 1..N if this slot has a number
};

const BEST_KEY = "chimp_best_level";

export function useChimpGame(gridSize = 6) {
  const [level, setLevel] = React.useState(1);
  const [bestLevel, setBestLevel] = React.useState<number>(() => {
    const v =
      typeof window !== "undefined" ? localStorage.getItem(BEST_KEY) : null;
    return v ? Number(v) : 1;
  });
  const [hearts, setHearts] = React.useState(3);
  const [running, setRunning] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [clearedNumbers, setClearedNumbers] = React.useState<number[]>([]);

  const [cells, setCells] = React.useState<Cell[]>([]);
  const [count, setCount] = React.useState(5);
  const [nextExpected, setNextExpected] = React.useState(1);
  const [roundId, setRoundId] = React.useState(0); // ▶️ identifies a specific layout so positions stay stable

  function shuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function planCountForLevel(lv: number) {
    return Math.min(gridSize * gridSize, 4 + lv);
  }

  function prepareRound(lv = level) {
    const N = gridSize * gridSize;
    const howMany = planCountForLevel(lv);
    setCount(howMany);

    const order = shuffle(Array.from({ length: N }, (_, i) => i)).slice(
      0,
      howMany
    );
    const withNumbers = Array.from({ length: N }, (_, i) => ({
      idx: i,
      number: undefined as number | undefined,
    }));
    order.forEach((cellIdx, i) => {
      withNumbers[cellIdx].number = i + 1;
    });

    setCells(withNumbers);
    setNextExpected(1);
    setClearedNumbers([]);
    setRoundId((r) => r + 1); // ▶️ new layout -> new seed for positions
  }

  function start() {
    setRunning(true);
    setPhase("show");
    prepareRound(level);
  }

  function restart() {
    setLevel(1);
    setHearts(3);
    setRunning(false);
    setPhase("idle");
    setCells([]);
    setNextExpected(1);
    setClearedNumbers([]);
    setRoundId((r) => r + 1);
  }

  function nextLevel() {
    const nl = level + 1;
    setLevel(nl);
    setPhase("show");
    prepareRound(nl);
  }

  function clickCell(cell: Cell) {
    if (!cell.number) return;

    if (phase === "show") {
      if (cell.number === 1) {
        setPhase("input"); // ▶️ after clicking 1, hide numbers (ChimpBoard will render blanks)
        setNextExpected(2);
        setClearedNumbers([1]);
      }
      return;
    }
    if (phase !== "input") return;

    if (cell.number !== nextExpected) {
      setHearts((h) => {
        const nh = h - 1;
        if (nh <= 0) {
          setPhase("lost");
          setRunning(false);
        } else {
          setPhase("show");
          prepareRound(level);
        }
        return nh;
      });
      return;
    }

    setClearedNumbers((prev) =>
      prev.includes(cell.number!) ? prev : [...prev, cell.number!]
    );
    const next = nextExpected + 1;
    setNextExpected(next);

    if (next > count) {
      setPhase("won");
      const nextLevelVal = level + 1;
      setBestLevel((b) => {
        const nb = Math.max(b, nextLevelVal);
        if (typeof window !== "undefined")
          localStorage.setItem(BEST_KEY, String(nb));
        return nb;
      });
    }
  }

  return {
    level,
    bestLevel,
    hearts,
    running,
    phase,
    gridSize,
    cells,
    count,
    nextExpected,
    roundId,
    clearedNumbers, // 👈 expose
    start,
    restart,
    nextLevel,
    clickCell,
  };
}
