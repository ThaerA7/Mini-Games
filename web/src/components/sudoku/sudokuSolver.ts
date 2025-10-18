import { deepCopy, computeCandidates } from "./sudokuUtils";

// MRV: find empty cell with the fewest candidates
export function findBestEmptyCell(
  g: number[][]
): { r: number; c: number; cand: number[] } | null {
  let best: { r: number; c: number; cand: number[] } | null = null;
  const size = g.length;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (g[r][c] !== 0) continue;
      const cand = computeCandidates(g, r, c);
      if (cand.length === 0) return { r, c, cand }; // contradiction
      if (!best || cand.length < best.cand.length) best = { r, c, cand };
      if (best.cand.length === 1) return best;
    }
  }
  return best;
}

// simple backtracking solver (find ONE solution) using MRV
export function solveOne(g0: number[][]): number[][] | null {
  const g = deepCopy(g0);

  const dfs = (): boolean => {
    const cell = findBestEmptyCell(g);
    if (!cell) return true; // solved
    const { r, c, cand } = cell;
    if (cand.length === 0) return false; // contradiction
    for (const v of cand) {
      g[r][c] = v;
      if (dfs()) return true;
      g[r][c] = 0;
    }
    return false;
  };

  return dfs() ? g : null;
}

// find a naked single anywhere (optionally prioritize selected first)
export function findNakedSingle(
  g: number[][],
  prefer?: { r: number; c: number } | null
): { r: number; c: number; v: number } | null {
  const size = g.length;

  const tryCell = (r: number, c: number) => {
    if (g[r][c] !== 0) return null;
    const cand = computeCandidates(g, r, c);
    if (cand.length === 1) return { r, c, v: cand[0] };
    return null;
  };

  if (prefer) {
    const x = tryCell(prefer.r, prefer.c);
    if (x) return x;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const x = tryCell(r, c);
      if (x) return x;
    }
  }
  return null;
}

// hidden single in rows/cols/boxes
export function findHiddenSingle(
  g: number[][]
): { r: number; c: number; v: number } | null {
  const size = g.length;
  const B = size === 16 ? 4 : 3;

  // rows
  for (let r = 0; r < size; r++) {
    const present = new Set<number>(g[r].filter(Boolean));
    for (let v = 1; v <= size; v++) {
      if (present.has(v)) continue;
      let spot: number | null = null;
      for (let c = 0; c < size; c++) {
        if (g[r][c] !== 0) continue;
        const cand = computeCandidates(g, r, c);
        if (cand.includes(v)) {
          if (spot !== null) {
            spot = -1;
            break;
          }
          spot = c;
        }
      }
      if (spot !== null && spot >= 0) return { r, c: spot, v };
    }
  }

  // cols
  for (let c = 0; c < size; c++) {
    const col = g.map((row) => row[c]);
    const present = new Set<number>(col.filter(Boolean));
    for (let v = 1; v <= size; v++) {
      if (present.has(v)) continue;
      let spot: number | null = null;
      for (let r = 0; r < size; r++) {
        if (g[r][c] !== 0) continue;
        const cand = computeCandidates(g, r, c);
        if (cand.includes(v)) {
          if (spot !== null) {
            spot = -1;
            break;
          }
          spot = r;
        }
      }
      if (spot !== null && spot >= 0) return { r: spot, c, v };
    }
  }

  // boxes
  for (let br = 0; br < size; br += B) {
    for (let bc = 0; bc < size; bc += B) {
      const coords: Array<[number, number]> = [];
      const vals: number[] = [];
      for (let r = br; r < br + B; r++) {
        for (let c = bc; c < bc + B; c++) {
          coords.push([r, c]);
          vals.push(g[r][c]);
        }
      }
      const present = new Set<number>(vals.filter(Boolean));
      for (let v = 1; v <= size; v++) {
        if (present.has(v)) continue;
        let loc: [number, number] | null = null;
        for (const [r, c] of coords) {
          if (g[r][c] !== 0) continue;
          const cand = computeCandidates(g, r, c);
          if (cand.includes(v)) {
            if (loc !== null) {
              loc = [-1, -1];
              break;
            }
            loc = [r, c];
          }
        }
        if (loc && loc[0] >= 0) return { r: loc[0], c: loc[1], v };
      }
    }
  }

  return null;
}
