import type { Difficulty as GenDifficulty } from "./puzzleGenerator.ts";

// Map UI label to generator difficulty
export function parseDifficulty(d: string | undefined): GenDifficulty {
  const v = String(d ?? "medium").toLowerCase();
  if (v === "16x16") return "16x16";
  if (
    v === "easy" ||
    v === "medium" ||
    v === "hard" ||
    v === "expert" ||
    v === "extreme"
  ) {
    return v;
  }
  return "medium";
}

// Render value as symbol (1..9, A..G for 10..16)
export function symbolFor(v: number) {
  if (v <= 0) return "";
  if (v <= 9) return String(v);
  return String.fromCharCode(55 + v); // 10->A, ... 16->G
}

export function deepCopy(g: number[][]) {
  return g.map((r) => r.slice());
}

export type Notes = Array<Array<Set<number>>>;

export function makeEmptyNotes(size: number): Notes {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => new Set<number>()),
  );
}

export function copyNotes(notes: Notes): Notes {
  return notes.map((row) => row.map((s) => new Set<number>(s)));
}

// ——— let the shimmer paint before heavy work
export const nextFrame = () =>
  new Promise<void>((r) => requestAnimationFrame(() => r()));

// Basic conflict checks
export function hasConflict(g: number[][], r: number, c: number, v: number) {
  if (v === 0) return false;
  const size = g.length;

  // row
  if (g[r].some((x, i) => i !== c && x === v)) return true;

  // col
  for (let i = 0; i < size; i++) if (i !== r && g[i][c] === v) return true;

  // box
  const b = size === 16 ? 4 : 3;
  const br = Math.floor(r / b) * b;
  const bc = Math.floor(c / b) * b;
  for (let i = br; i < br + b; i++) {
    for (let j = bc; j < bc + b; j++) {
      if ((i !== r || j !== c) && g[i][j] === v) return true;
    }
  }
  return false;
}

// Candidate computation (shared by UI & solver)
export function computeCandidates(
  g: number[][],
  r: number,
  c: number,
): number[] {
  const size = g.length;
  if (g[r][c] !== 0) return [];
  const used = new Set<number>();

  // row
  for (let j = 0; j < size; j++) used.add(g[r][j]);

  // col
  for (let i = 0; i < size; i++) used.add(g[i][c]);

  // box
  const b = size === 16 ? 4 : 3;
  const br = Math.floor(r / b) * b;
  const bc = Math.floor(c / b) * b;
  for (let i = br; i < br + b; i++) {
    for (let j = bc; j < bc + b; j++) used.add(g[i][j]);
  }

  const res: number[] = [];
  for (let v = 1; v <= size; v++) if (!used.has(v)) res.push(v);
  return res;
}
