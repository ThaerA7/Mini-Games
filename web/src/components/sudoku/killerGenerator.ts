// src/components/killer/killerGenerator2.ts

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
  // givens are typically empty in killer; keep here for flexibility
  givens: number[][];
};

export type KillerOptions = {
  size?: 9 | 16;        // default 9
  minCage?: number;     // default 2
  maxCage?: number;     // default 4
  seedAttempts?: number;// how many times we try to grow a cage from a random seed (default 2)
};

export function generateKillerSudoku(opts: KillerOptions = {}): KillerPuzzle {
  const size: 9 | 16 = (opts.size ?? 9) as 9 | 16;
  const minCage = Math.max(1, opts.minCage ?? 2);
  const maxCage = Math.max(minCage, opts.maxCage ?? 4);
  const seedAttempts = Math.max(1, opts.seedAttempts ?? 2);

  // Reuse your solved grid from the normal generator
  const solved = generateSudoku(size === 16 ? "16x16" : "easy", {
    ensureDifficulty: false,
  }).solution;

  const used: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  const cages: KillerCage[] = [];
  let nextId = 1;

  const inBounds = (r: number, c: number) => r >= 0 && c >= 0 && r < size && c < size;

  // 4-neighborhood
  const neigh = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;

  // choose an unassigned cell
  const pickSeed = (): Cell | null => {
    for (let tries = 0; tries < seedAttempts * size * size; tries++) {
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      if (!used[r][c]) return { r, c };
    }
    // fallback linear scan
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (!used[r][c]) return { r, c };
    return null;
  };

  while (true) {
    const seed = pickSeed();
    if (!seed) break; // done (all assigned)

    const cage: KillerCage = { id: nextId++, sum: 0, cells: [] };
    const target = Math.floor(Math.random() * (maxCage - minCage + 1)) + minCage;

    // grow the cage with unique digits (killer rule) + connectivity
    const frontier: Cell[] = [seed];
    const taken = new Set<number>(); // digits already inside this cage

    while (frontier.length && cage.cells.length < target) {
      const idx = Math.floor(Math.random() * frontier.length);
      const cur = frontier.splice(idx, 1)[0];
      if (used[cur.r][cur.c]) continue;

      const d = solved[cur.r][cur.c];
      if (taken.has(d)) continue; // no repeats inside cage

      // accept this cell
      used[cur.r][cur.c] = true;
      cage.cells.push(cur);
      taken.add(d);

      // push neighbors to frontier
      for (const [dr, dc] of neigh) {
        const nr = cur.r + dr,
          nc = cur.c + dc;
        if (!inBounds(nr, nc) || used[nr][nc]) continue;
        frontier.push({ r: nr, c: nc });
      }
    }

    // if we only got 1 cell and minCage > 1, try to force one neighbor
    if (cage.cells.length === 1 && minCage > 1) {
      const only = cage.cells[0];
      const shuffled = [...neigh].sort(() => Math.random() - 0.5);
      for (const [dr, dc] of shuffled) {
        const nr = only.r + dr,
          nc = only.c + dc;
        if (!inBounds(nr, nc) || used[nr][nc]) continue;
        const d = solved[nr][nc];
        if (!taken.has(d)) {
          used[nr][nc] = true;
          cage.cells.push({ r: nr, c: nc });
          taken.add(d);
          break;
        }
      }
    }

    // compute sum from solution
    cage.sum = cage.cells.reduce((acc, { r, c }) => acc + solved[r][c], 0);
    cages.push(cage);
  }

  // empty givens (classic killer)
  const givens = Array.from({ length: size }, () => Array(size).fill(0));
  return { size, cages, solution: solved, givens };
}
