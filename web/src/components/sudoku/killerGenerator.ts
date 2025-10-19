// src/components/killer/killerGenerator.ts
import { generateSudoku } from "../sudoku/puzzleGenerator.ts";

export type Cell = { r: number; c: number };
export type KillerCage = {
  id: number;
  sum: number;
  cells: Cell[];
};
export type KillerPuzzle = {
  size: 9 | 16;
  cages: KillerCage[];
  solution: number[][];
  givens: number[][];
};

export type KillerOptions = {
  size?: 9 | 16; // default 9
  minCage?: number; // default 2
  maxCage?: number; // default 4
  seedAttempts?: number; // default depends on difficulty
  difficulty?: "easy" | "medium" | "hard";
  baseNumbersCount?: number; // how many givens to reveal (0 = classic killer)
  symmetricGivens?: boolean; // place givens with 180° rotational symmetry
  avoidEasyPairSums?: boolean; // avoid pair sums {3,4,16,17} (9x9) where possible
};

const randPick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export function generateKillerSudoku(opts: KillerOptions = {}): KillerPuzzle {
  const size: 9 | 16 = (opts.size ?? 9) as 9 | 16;
  const difficulty = opts.difficulty ?? "hard";
  const minCage = Math.max(2, opts.minCage ?? 2);
  const maxCage = Math.max(minCage, opts.maxCage ?? 4);
  const seedAttempts =
    opts.seedAttempts ??
    (difficulty === "hard" ? 4 : difficulty === "medium" ? 3 : 2);

  const avoidEasyPairSums = opts.avoidEasyPairSums ?? difficulty !== "easy";

  // Use your solved classic grid
  const preset =
    size === 16 ? "16x16" : difficulty === "easy" ? "easy" : "hard";
  const solved = generateSudoku(preset as any, {
    ensureDifficulty: false,
  }).solution;

  const used: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  const cages: KillerCage[] = [];
  let nextId = 1;

  const inBounds = (r: number, c: number) =>
    r >= 0 && c >= 0 && r < size && c < size;

  const neigh = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;

  // Bias target cage sizes by difficulty
  // (Still randomized, just nudged toward 3–4 for "hard")
  const sizeWeights =
    difficulty === "hard"
      ? new Map<number, number>([
          [2, 0.3],
          [3, 0.4],
          [4, 0.3],
        ])
      : difficulty === "medium"
        ? new Map<number, number>([
            [2, 0.45],
            [3, 0.35],
            [4, 0.2],
          ])
        : new Map<number, number>([
            [2, 0.55],
            [3, 0.3],
            [4, 0.15],
          ]);

  const sampleTargetSize = () => {
    const candidates = [];
    for (let k = minCage; k <= maxCage; k++) {
      const w = sizeWeights.get(k) ?? 1;
      for (let i = 0; i < Math.round(w * 100); i++) candidates.push(k);
    }
    return randPick(candidates);
  };

  const pickSeed = (): Cell | null => {
    for (let tries = 0; tries < seedAttempts * size * size; tries++) {
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      if (!used[r][c]) return { r, c };
    }
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) if (!used[r][c]) return { r, c };
    return null;
  };

  // try to extend a cage by one extra valid neighbor (unique digit within the cage)
  const tryExtendCageOnce = (cage: KillerCage, taken: Set<number>): boolean => {
    const border: Cell[] = [];
    for (const cur of cage.cells) {
      for (const [dr, dc] of neigh) {
        const nr = cur.r + dr,
          nc = cur.c + dc;
        if (!inBounds(nr, nc) || used[nr][nc]) continue;
        border.push({ r: nr, c: nc });
      }
    }
    // randomize
    for (let i = border.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [border[i], border[j]] = [border[j], border[i]];
    }
    for (const cand of border) {
      const d = solved[cand.r][cand.c];
      if (!taken.has(d)) {
        used[cand.r][cand.c] = true;
        cage.cells.push(cand);
        taken.add(d);
        return true;
      }
    }
    return false;
  };

  // Build cages
  while (true) {
    const seed = pickSeed();
    if (!seed) break;

    const cage: KillerCage = { id: nextId++, sum: 0, cells: [] };
    const target = sampleTargetSize();

    const frontier: Cell[] = [seed];
    const taken = new Set<number>();

    while (frontier.length && cage.cells.length < target) {
      const idx = Math.floor(Math.random() * frontier.length);
      const cur = frontier.splice(idx, 1)[0];
      if (used[cur.r][cur.c]) continue;

      const d = solved[cur.r][cur.c];
      if (taken.has(d)) continue;

      used[cur.r][cur.c] = true;
      cage.cells.push(cur);
      taken.add(d);

      for (const [dr, dc] of neigh) {
        const nr = cur.r + dr,
          nc = cur.c + dc;
        if (!inBounds(nr, nc) || used[nr][nc]) continue;
        frontier.push({ r: nr, c: nc });
      }
    }

    // If only got a singleton (shouldn't happen with minCage=2), force-grow once
    if (cage.cells.length === 1 && minCage > 1) {
      tryExtendCageOnce(cage, taken);
    }

    // Optional: avoid "easy" pair sums by growing 2->3 if possible
    if (avoidEasyPairSums && cage.cells.length === 2 && size === 9) {
      const sum2 =
        solved[cage.cells[0].r][cage.cells[0].c] +
        solved[cage.cells[1].r][cage.cells[1].c];
      const bad = new Set([3, 4, 16, 17]);
      if (bad.has(sum2)) {
        // try to add a third cell
        tryExtendCageOnce(cage, taken);
      }
    }

    cage.sum = cage.cells.reduce((acc, { r, c }) => acc + solved[r][c], 0);
    cages.push(cage);
  }

  // ---- Givens (base numbers) ----
  const givens = Array.from({ length: size }, () => Array(size).fill(0));
  const wanted = Math.max(
    0,
    opts.baseNumbersCount ??
      (difficulty === "hard" ? 10 : difficulty === "medium" ? 14 : 18)
  );
  if (wanted > 0) {
    // helper: cage lookup to avoid fully revealing a 2-cell cage
    const cageIdGrid = Array.from({ length: size }, () =>
      Array<number>(size).fill(0)
    );
    for (const c of cages)
      for (const cell of c.cells) cageIdGrid[cell.r][cell.c] = c.id;
    const cageById = new Map<number, KillerCage>(cages.map((c) => [c.id, c]));

    const selected = new Set<string>();
    const pushCell = (r: number, c: number) => selected.add(`${r},${c}`);
    const hasCell = (r: number, c: number) => selected.has(`${r},${c}`);

    // Candidate order: prefer cells in 3–4 cages (slightly more interesting)
    const allCells: Cell[] = [];
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) allCells.push({ r, c });
    allCells.sort((a, b) => {
      const ca = cageById.get(cageIdGrid[a.r][a.c])!;
      const cb = cageById.get(cageIdGrid[b.r][b.c])!;
      // prefer larger cages first
      return cb.cells.length - ca.cells.length;
    });

    const symmetric = opts.symmetricGivens ?? true;

    const tryAddPair = (r: number, c: number) => {
      const mirrorR = size - 1 - r;
      const mirrorC = size - 1 - c;

      // do not fully reveal a 2-cell cage
      const thisId = cageIdGrid[r][c];
      const thatId = cageIdGrid[mirrorR][mirrorC];
      const thisCage = cageById.get(thisId)!;
      const thatCage = cageById.get(thatId)!;
      if (thisCage.cells.length === 2) {
        const other = thisCage.cells.find((x) => !(x.r === r && x.c === c))!;
        if (hasCell(other.r, other.c)) return false;
      }
      if (thatCage.cells.length === 2) {
        const other = thatCage.cells.find(
          (x) => !(x.r === mirrorR && x.c === mirrorC)
        )!;
        if (hasCell(other.r, other.c)) return false;
      }

      pushCell(r, c);
      if (!(mirrorR === r && mirrorC === c)) pushCell(mirrorR, mirrorC);
      return true;
    };

    for (const cell of allCells) {
      if (selected.size >= wanted) break;
      if (hasCell(cell.r, cell.c)) continue;

      if (symmetric) {
        tryAddPair(cell.r, cell.c);
      } else {
        pushCell(cell.r, cell.c);
      }
    }

    // Materialize givens
    let placed = 0;
    for (const key of selected) {
      if (placed >= wanted) break;
      const [r, c] = key.split(",").map(Number);
      givens[r][c] = solved[r][c];
      placed++;
    }
  }

  return { size, cages, solution: solved, givens };
}
