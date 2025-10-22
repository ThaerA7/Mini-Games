// src/components/chimp/useChimpGame.ts
import * as React from "react";

export type Phase = "idle" | "show" | "input" | "won" | "lost";

export type Cell = {
  idx: number;
  number?: number;
};

const BEST_KEY = "chimp_best_level";

export function useChimpGame(gridSize = 6) {
  const randSeed = () => (Math.random() * 0xffffffff) >>> 0;

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
  const [roundId, setRoundId] = React.useState<number>(() => randSeed());
  const [previewCells, setPreviewCells] = React.useState<Cell[]>([]);
  const [previewRoundId, setPreviewRoundId] = React.useState<number>(() => randSeed());
  const [previewLevel, setPreviewLevel] = React.useState<number>(1);
  const [avgMsPerPick, setAvgMsPerPick] = React.useState<number | null>(null);
  const pickRef = React.useRef<{ last: number | null; total: number; count: number }>({
    last: null,
    total: 0,
    count: 0,
  });

  const nowMs = () =>
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();

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

  function resetTiming() {
    pickRef.current = { last: null, total: 0, count: 0 };
    setAvgMsPerPick(null);
  }

  function buildCells(howMany: number) {
    const N = gridSize * gridSize;
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
    return withNumbers;
  }

  function makePreviewForLevel(lv: number) {
    setPreviewLevel(lv);
    const howMany = planCountForLevel(lv);
    setPreviewCells(buildCells(howMany));
    setPreviewRoundId(randSeed());
  }

  function prepareRound(lv = level) {
    const howMany = planCountForLevel(lv);
    setCount(howMany);
    setCells(buildCells(howMany));
    setNextExpected(1);
    setClearedNumbers([]);
    resetTiming();
    setRoundId(randSeed());
  }

  function promotePreviewToRound(lv: number) {
    setLevel(lv);
    setCount(planCountForLevel(lv));
    setCells(previewCells);
    setNextExpected(1);
    setClearedNumbers([]);
    resetTiming();
    setRoundId(previewRoundId);
    setRunning(true);
    setPhase("show");
  }

  React.useEffect(() => {
    makePreviewForLevel(1);
  }, []);

  function start() {
    promotePreviewToRound(previewLevel);
  }

  function restart() {
    setLevel(1);
    setHearts(3);
    setRunning(false);
    setPhase("idle");
    setCells([]);
    setNextExpected(1);
    setClearedNumbers([]);
    resetTiming();
    setRoundId(randSeed());
    makePreviewForLevel(1);
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
        setPhase("input");
        setNextExpected(2);
        setClearedNumbers([1]);
        pickRef.current = { last: nowMs(), total: 0, count: 0 };
        setAvgMsPerPick(null);
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
          makePreviewForLevel(level);
        } else {
          setPhase("show");
          prepareRound(level);
        }
        return nh;
      });
      return;
    }
    const t = nowMs();
    const last = pickRef.current.last ?? t;
    const dt = t - last;
    pickRef.current.total += dt;
    pickRef.current.count += 1;
    pickRef.current.last = t;
    setAvgMsPerPick(pickRef.current.total / pickRef.current.count);
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
      makePreviewForLevel(level + 1);
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
    clearedNumbers,
    avgMsPerPick,
    previewCells,
    previewRoundId,
    previewLevel,
    start,
    restart,
    nextLevel,
    promotePreviewToRound,
    clickCell,
  };
}
