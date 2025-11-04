export type Clue = {
  number: number;
  row: number;
  col: number;
  length: number;
  answer: string;
  clue: string;
};

export type Crossword = {
  size: number;
  blocks: boolean[][]; // true => block
  puzzleGrid: string[][]; // "" for empty, "#" never appears here (use blocks)
  solutionGrid: string[][]; // letters + "#" for convenience
  clues: {
    across: Clue[];
    down: Clue[];
  };
};

type Slot = {
  id: string; // "A-1" / "D-12"
  dir: "across" | "down";
  r: number;
  c: number;
  length: number;
  number: number;
};

import { WORDS, type Entry } from "./wordlist";

// ——————————————————————————————————————————
// 2) A fixed symmetric 11×11 pattern ('.' = open, '#' = block)
const PATTERN_11: string[] = [
  ". . . # . . . # . . .",
  ". . . # . . . # . . .",
  ". . . . . # . . . . .",
  "# # . . . . . . . # #",
  ". . . . . # . . . . .",
  ". . # . . . . . # . .",
  ". . . . . # . . . . .",
  "# # . . . . . . . # #",
  ". . . . . # . . . . .",
  ". . . # . . . # . . .",
  ". . . # . . . # . . .",
].map((row) => row.replace(/\s+/g, "")); // remove spaces

function patternToBlocks(size: number, pat: string[]): boolean[][] {
  const blocks = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      blocks[r][c] = pat[r][c] === "#";
    }
  }
  // Ensure 180° symmetry just in case
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const rr = size - 1 - r,
        cc = size - 1 - c;
      if (blocks[r][c] !== blocks[rr][cc]) {
        blocks[rr][cc] = blocks[r][c];
      }
    }
  }
  return blocks;
}

// ——————————————————————————————————————————
// 3) Slot detection + numbering
function findSlots(blocks: boolean[][]) {
  const size = blocks.length;
  const across: Slot[] = [];
  const down: Slot[] = [];
  let number = 1;

  const isStartAcross = (r: number, c: number) =>
    !blocks[r][c] && (c === 0 || blocks[r][c - 1]) && c + 1 < size && !blocks[r][c + 1];

  const isStartDown = (r: number, c: number) =>
    !blocks[r][c] && (r === 0 || blocks[r - 1][c]) && r + 1 < size && !blocks[r + 1][c];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isStartAcross(r, c)) {
        let len = 0;
        while (c + len < size && !blocks[r][c + len]) len++;
        across.push({ id: `A-${number}`, dir: "across", r, c, length: len, number });
        number++;
      }
      if (isStartDown(r, c)) {
        let len = 0;
        while (r + len < size && !blocks[r + len][c]) len++;
        down.push({ id: `D-${number}`, dir: "down", r, c, length: len, number });
        number++;
      }
    }
  }
  return { across, down };
}

// ——————————————————————————————————————————
// 4) Backtracking fill
function fitCandidates(pattern: (string | null)[], words: Entry[]) {
  const regex = new RegExp("^" + pattern.map((ch) => (ch ? ch : "[A-Z]")).join("") + "$");
  return words.filter((w) => w.answer.length === pattern.length && regex.test(w.answer));
}

function copyGrid(grid: (string | "#")[][]) {
  return grid.map((row) => row.slice());
}

function placeWord(grid: (string | "#")[][], slot: Slot, word: string) {
  const g = copyGrid(grid);
  for (let i = 0; i < slot.length; i++) {
    const rr = slot.r + (slot.dir === "down" ? i : 0);
    const cc = slot.c + (slot.dir === "across" ? i : 0);
    if (g[rr][cc] === "#") return null; // impossible
    if (g[rr][cc] && g[rr][cc] !== word[i]) return null;
    g[rr][cc] = word[i];
  }
  return g;
}

function extractPattern(grid: (string | "#")[][], slot: Slot): (string | null)[] {
  const seq: (string | null)[] = [];
  for (let i = 0; i < slot.length; i++) {
    const rr = slot.r + (slot.dir === "down" ? i : 0);
    const cc = slot.c + (slot.dir === "across" ? i : 0);
    seq.push(grid[rr][cc] && grid[rr][cc] !== "#" ? (grid[rr][cc] as string) : null);
  }
  return seq;
}

function backtrack(
  grid: (string | "#")[][],
  slots: Slot[],
  dict: Entry[],
  used: Set<string>,
  slotIndex = 0
): { grid: (string | "#")[][]; fills: Record<string, Entry> } | null {
  if (slotIndex >= slots.length) return { grid, fills: {} };
  const slot = slots[slotIndex];
  const pattern = extractPattern(grid, slot);
  const candidates = fitCandidates(pattern, dict).filter((e) => !used.has(e.answer));

  // heuristic: sort by candidate count for future overlaps (simple: length rarity)
  candidates.sort((a, b) => a.answer.length - b.answer.length);

  for (const entry of candidates) {
    const placed = placeWord(grid, slot, entry.answer);
    if (!placed) continue;

    used.add(entry.answer);
    const result = backtrack(placed, slots, dict, used, slotIndex + 1);
    if (result) {
      result.fills[slot.id] = entry;
      return result;
    }
    used.delete(entry.answer);
  }
  return null;
}

// ——————————————————————————————————————————
// 5) Main API
export function generateCrossword(size = 11): Crossword {
  if (size !== 11) {
    throw new Error("This sample generator currently supports size=11 only (pattern-based).");
  }

  const blocks = patternToBlocks(size, PATTERN_11);

  // Prepare grids
  const solutionGrid: (string | "#")[][] = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => (blocks[r][c] ? "#" : ""))
  );

  const { across, down } = findSlots(blocks);
  const allSlots = [...across, ...down];

  // Backtracking fill
  const res = backtrack(solutionGrid, allSlots, WORDS, new Set());

  // Fallback: if fill fails, keep the empty solution so the UI still renders.
  const filled = (res?.grid ?? solutionGrid).map((row) => row.slice());

  // Build clues (only for filled slots)
  const fillsById = res?.fills ?? {}; // id => Entry
  const toClues = (slots: Slot[]) =>
    slots.flatMap((s) => {
      const entry = fillsById[s.id];
      return entry
        ? [
            {
              number: s.number,
              row: s.r,
              col: s.c,
              length: s.length,
              answer: entry.answer,
              clue: entry.clue,
            } as Clue,
          ]
        : [];
    });

  const acrossClues = toClues(across);
  const downClues = toClues(down);

  // Create puzzle (empty letters), keep blocks separately
  const puzzleGrid = Array.from({ length: size }, () => Array.from({ length: size }, () => ""));

  // Convert solution to string[][]
  const solutionGridStrings = filled.map((row) => row.map((ch) => ch as string));

  return {
    size,
    blocks,
    puzzleGrid,
    solutionGrid: solutionGridStrings,
    clues: {
      across: acrossClues,
      down: downClues,
    },
  };
}
