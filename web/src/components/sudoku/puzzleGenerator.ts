
export type Difficulty =
  | "easy"
  | "medium"
  | "hard"
  | "expert"
  | "extreme"
  | "16x16";

export type Size = 9 | 16;
export type Grid = number[][]; // rows of length `size`

export type GeneratedSudoku = {
  puzzle: Grid;
  solution: Grid;
  size: Size;
  difficulty: Difficulty;
  /** Proportion of cells solvable by simple logic (0..1). */
  logicCoverage: number;
};

// ------------------------------------
// Config
// ------------------------------------

const BOX_BY_SIZE: Record<number, number> = { 9: 3, 16: 4 };

// Target clue ranges (inclusive) per difficulty for 9x9
const CLUE_RANGES_9: Record<Exclude<Difficulty, "16x16">, [number, number]> = {
  easy: [36, 45],
  medium: [32, 35],
  hard: [28, 31],
  expert: [24, 27],
  extreme: [22, 23],
};

// Target clue range for 16x16 (single difficulty in this app). 256 cells total.
const CLUE_RANGE_16: [number, number] = [115, 155];

// Logic-coverage targets: how much of the puzzle should be solvable
// using singles & hidden singles for each 9x9 difficulty.
const COVERAGE_GOAL_9: Record<Exclude<Difficulty, "16x16">, number> = {
  easy: 1.0, // completely solvable by singles/hidden-singles
  medium: 0.75,
  hard: 0.5,
  expert: 0.35,
  extreme: 0.2,
};

// For 16x16 we simply aim for a decent chunk solvable by logic.
const COVERAGE_GOAL_16 = 0.35;

// ------------------------------------
// Public API
// ------------------------------------

type Options = {
  /** Symmetry used when digging clues. */
  symmetry?: "none" | "central" | "diagonal";
  /** Try multiple times until coverage/clue goals are met. */
  ensureDifficulty?: boolean;
  /** Max attempts to try generating a puzzle that fits goals. */
  maxAttempts?: number;
};

export function isUniquelySolvable(puzzle: Grid): boolean {
  const size = puzzle.length as Size;
  const box = BOX_BY_SIZE[size];
  if (!(size === 9 || size === 16)) return false;
  return hasUniqueSolution(puzzle, size, box);
}

export function generateSudoku(
  difficulty: Difficulty,
  opts: Options = {}
): GeneratedSudoku {
  const size: Size = difficulty === "16x16" ? 16 : 9;
  const box = BOX_BY_SIZE[size];
  const symmetry = opts.symmetry ?? "central";
  const ensureDifficulty = opts.ensureDifficulty ?? true;
const maxAttempts = Math.max(
  1,
  opts.maxAttempts ?? (size === 16 ? 60 : 25)
);
  const coverageGoal =
    size === 16
      ? COVERAGE_GOAL_16
      : COVERAGE_GOAL_9[difficulty as Exclude<Difficulty, "16x16">];

  const [minClues, maxClues] =
    size === 16
      ? CLUE_RANGE_16
      : CLUE_RANGES_9[difficulty as Exclude<Difficulty, "16x16">];

  // Attempt loop
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const solution = makeRandomSolved(size, box);
    const targetClues = randInt(minClues, maxClues);
    const puzzle = makePuzzleWithUnique(solution, targetClues, { symmetry });

    const { coverage } = logicRate(puzzle, size, box);

    if (!ensureDifficulty || coverage >= coverageGoal) {
      return {
        puzzle,
        solution,
        size,
        difficulty,
        logicCoverage: round2(coverage),
      };
    }
  }

  

  // Fallback (should be rare): return a unique puzzle even if it missed coverage goal
  const solution = makeRandomSolved(size, box);
  const targetClues = randInt(minClues, maxClues);
  const puzzle = makePuzzleWithUnique(solution, targetClues, { symmetry });
  const { coverage } = logicRate(puzzle, size, box);
  return {
    puzzle,
    solution,
    size,
    difficulty,
    logicCoverage: round2(coverage),
  };
}

// ------------------------------------
// Generator helpers
// ------------------------------------

function makeRandomSolved(size: Size, box: number): Grid {
  // Build a base Latin pattern then shuffle rows/cols/bands/stacks & digits
  const base: Grid = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => ((box * (r % box) + Math.floor(r / box) + c) % size) + 1)
  );

  let g = cloneGrid(base);
  // Shuffle rows within bands
  for (let band = 0; band < size; band += box) {
    const rows = range(box).map((i) => band + i);
    shuffle(rows);
    g = reorderRows(g, band, rows);
  }

  // Shuffle columns within stacks
  g = transpose(g);
  for (let stack = 0; stack < size; stack += box) {
    const cols = range(box).map((i) => stack + i);
    shuffle(cols);
    g = reorderRows(g, stack, cols);
  }
  g = transpose(g);

  // Shuffle bands
  const bandIdxs = range(size / box).map((i) => i);
  shuffle(bandIdxs);
  g = reorderBands(g, bandIdxs, box);

  // Shuffle stacks
  g = transpose(g);
  const stackIdxs = range(size / box).map((i) => i);
  shuffle(stackIdxs);
  g = reorderBands(g, stackIdxs, box);
  g = transpose(g);

  // Shuffle digits 1..size
  const map = range(size).map((_, i) => i + 1);
  shuffle(map);
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) g[r][c] = map[g[r][c] - 1];

  return g;
}

function makePuzzleWithUnique(
  solution: Grid,
  targetClues: number,
  { symmetry = "central" as Options["symmetry"] } = {}
): Grid {
  const size = solution.length as Size;
  const box = BOX_BY_SIZE[size];
  const total = size * size;

  // Start with full grid and remove cells while preserving uniqueness
  const puzzle = cloneGrid(solution);

  // Coordinates to try (half the board if using central symmetry)
  const coords: Array<[number, number]> = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (symmetry === "central") {
        // Only include one of each symmetric pair (upper-left half)
        if (r * size + c <= (total - 1) / 2) coords.push([r, c]);
      } else if (symmetry === "diagonal") {
        if (r <= c) coords.push([r, c]);
      } else {
        coords.push([r, c]);
      }
    }
  }
  shuffle(coords);

  // Stop when remaining clues == targetClues
  let clues = total;
  const minClues = Math.max(0, targetClues);

  for (const [r, c] of coords) {
    if (clues <= minClues) break;

    const positions: Array<[number, number]> = [[r, c]];
    if (symmetry === "central") {
      positions.push([size - 1 - r, size - 1 - c]);
    } else if (symmetry === "diagonal") {
      positions.push([c, r]);
    }

    // Skip if already empty
    if (positions.every(([rr, cc]) => puzzle[rr][cc] === 0)) continue;

    const backup: Array<[number, number, number]> = [];
    for (const [rr, cc] of positions) {
      backup.push([rr, cc, puzzle[rr][cc]]);
      puzzle[rr][cc] = 0;
    }

    // If uniqueness is broken, revert
    if (!hasUniqueSolution(puzzle, size, box)) {
      for (const [rr, cc, v] of backup) puzzle[rr][cc] = v;
    } else {
      clues -= positions.length;
      if (clues <= minClues) break;
    }
  }

  // Ensure we didn't undershoot due to symmetry; if we still have too many clues, try random single removals
  const flatCells = allCoords(size);
  shuffle(flatCells);
  for (const [r, c] of flatCells) {
    const v = puzzle[r][c];
    if (v === 0) continue;
    if (clues <= minClues) break;
    puzzle[r][c] = 0;
    if (!hasUniqueSolution(puzzle, size, box)) {
      puzzle[r][c] = v; // revert
    } else {
      clues--;
    }
  }

  return puzzle;
}

// ------------------------------------
// Logic rating (singles & hidden singles)
// ------------------------------------

type RateResult = { coverage: number };

function logicRate(puzzle: Grid, size: Size, box: number): RateResult {
  const g = cloneGrid(puzzle);
  const total = size * size;
  const startFilled = countFilled(g);

  let progress = true;
  while (progress) {
    progress = false;

    // Naked singles
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (g[r][c] !== 0) continue;
        const cand = candidates(g, r, c, size, box);
        if (cand.length === 1) {
          g[r][c] = cand[0];
          progress = true;
        }
      }
    }

    // Hidden singles (rows, cols, boxes)
    // Rows
    for (let r = 0; r < size; r++) {
      const missing = missingDigits(g[r], size);
      for (const d of missing) {
        let place: number | null = null;
        for (let c = 0; c < size; c++) {
          if (g[r][c] === 0 && isSafe(g, r, c, d, size, box)) {
            if (place !== null) {
              place = -1; // more than one spot
              break;
            }
            place = c;
          }
        }
        if (place !== null && place >= 0) {
          g[r][place] = d;
          progress = true;
        }
      }
    }

    // Cols
    for (let c = 0; c < size; c++) {
      const col = getCol(g, c);
      const missing = missingDigits(col, size);
      for (const d of missing) {
        let place: number | null = null;
        for (let r = 0; r < size; r++) {
          if (g[r][c] === 0 && isSafe(g, r, c, d, size, box)) {
            if (place !== null) {
              place = -1;
              break;
            }
            place = r;
          }
        }
        if (place !== null && place >= 0) {
          g[place][c] = d;
          progress = true;
        }
      }
    }

    // Boxes
    for (let br = 0; br < size; br += box) {
      for (let bc = 0; bc < size; bc += box) {
        const cells: Array<[number, number]> = [];
        const values: number[] = [];
        for (let r = br; r < br + box; r++) {
          for (let c = bc; c < bc + box; c++) {
            cells.push([r, c]);
            values.push(g[r][c]);
          }
        }
        const missing = missingDigits(values, size);
        for (const d of missing) {
          let loc: [number, number] | null = null;
          for (const [r, c] of cells) {
            if (g[r][c] === 0 && isSafe(g, r, c, d, size, box)) {
              if (loc !== null) {
                loc = [-1, -1];
                break;
              }
              loc = [r, c];
            }
          }
          if (loc && loc[0] >= 0) {
            g[loc[0]][loc[1]] = d;
            progress = true;
          }
        }
      }
    }
  }

  const endFilled = countFilled(g);
  const solvedByLogic = endFilled - startFilled;
  const blanksAtStart = total - startFilled;
  const coverage = blanksAtStart === 0 ? 1 : solvedByLogic / blanksAtStart;

  return { coverage };
}

// ------------------------------------
// Solver / uniqueness
// ------------------------------------

function hasUniqueSolution(puzzle: Grid, size: Size, box: number): boolean {
  const g = cloneGrid(puzzle);
  let count = 0;

  const trySolve = (): boolean => {
    const cell = findBestEmpty(g, size, box);
    if (!cell) {
      count++;
      return count < 2; // keep searching only if we haven't found 2 solutions yet
    }
    const [r, c, cand] = cell;
    for (const v of cand) {
      g[r][c] = v;
      if (!trySolve()) {
        g[r][c] = 0;
        return false; // early stop (>=2 solutions)
      }
    }
    g[r][c] = 0;
    return true;
  };

  trySolve();
  return count === 1;
}

function findBestEmpty(
  g: Grid,
  size: Size,
  box: number
): [number, number, number[]] | null {
  let best: [number, number, number[]] | null = null;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (g[r][c] !== 0) continue;
      const cand = candidates(g, r, c, size, box);
      if (cand.length === 0) return [r, c, []]; // dead end
      if (!best || cand.length < best[2].length) best = [r, c, cand];
      if (best[2].length === 1) return best; // MRV
    }
  }
  return best;
}

function candidates(g: Grid, r: number, c: number, size: Size, box: number): number[] {
  const used = new Set<number>();
  // row
  for (let j = 0; j < size; j++) used.add(g[r][j]);
  // col
  for (let i = 0; i < size; i++) used.add(g[i][c]);
  // box
  const br = Math.floor(r / box) * box;
  const bc = Math.floor(c / box) * box;
  for (let i = br; i < br + box; i++)
    for (let j = bc; j < bc + box; j++) used.add(g[i][j]);

  const cand: number[] = [];
  for (let v = 1; v <= size; v++) if (!used.has(v)) cand.push(v);
  shuffle(cand); // randomize branch order for variety
  return cand;
}

function isSafe(g: Grid, r: number, c: number, v: number, size: Size, box: number): boolean {
  // row
  for (let j = 0; j < size; j++) if (g[r][j] === v) return false;
  // col
  for (let i = 0; i < size; i++) if (g[i][c] === v) return false;
  // box
  const br = Math.floor(r / box) * box;
  const bc = Math.floor(c / box) * box;
  for (let i = br; i < br + box; i++)
    for (let j = bc; j < bc + box; j++) if (g[i][j] === v) return false;
  return true;
}

// ------------------------------------
// Utils
// ------------------------------------

function reorderRows(g: Grid, start: number, rows: number[]): Grid {
  const size = g.length;
  const copy = cloneGrid(g);
  for (let i = 0; i < rows.length; i++) {
    copy[start + i] = g[rows[i]];
  }
  // Copy untouched rows
  for (let r = 0; r < size; r++) {
    if (r < start || r >= start + rows.length) copy[r] = g[r];
  }
  return copy;
}

function reorderBands(g: Grid, order: number[], box: number): Grid {
  const size = g.length;
  const copy = cloneGrid(g);
  for (let i = 0; i < order.length; i++) {
    const src = order[i] * box;
    const dst = i * box;
    for (let k = 0; k < box; k++) copy[dst + k] = g[src + k];
  }
  // untouched bands
  if (order.length * box < size) {
    for (let r = order.length * box; r < size; r++) copy[r] = g[r];
  }
  return copy;
}

function transpose(g: Grid): Grid {
  const size = g.length;
  const t: Grid = Array.from({ length: size }, () => Array(size).fill(0));
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) t[c][r] = g[r][c];
  return t;
}

function getCol(g: Grid, c: number): number[] {
  return g.map((row) => row[c]);
}

function missingDigits(values: number[], size: number): number[] {
  const present = new Set(values.filter(Boolean));
  const miss: number[] = [];
  for (let v = 1; v <= size; v++) if (!present.has(v)) miss.push(v);
  return miss;
}

function cloneGrid(g: Grid): Grid {
  return g.map((row) => row.slice());
}

function countFilled(g: Grid): number {
  let n = 0;
  for (const row of g) for (const v of row) if (v !== 0) n++;
  return n;
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

function allCoords(size: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) out.push([r, c]);
  return out;
}
