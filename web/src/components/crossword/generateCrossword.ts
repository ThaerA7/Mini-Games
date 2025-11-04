// lib/crossword/generateCrossword.ts
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
  blocks: boolean[][];         // true => block
  puzzleGrid: string[][];      // "" for empty, "#" never appears here (use blocks)
  solutionGrid: string[][];    // letters + "#" for convenience
  clues: {
    across: Clue[];
    down: Clue[];
  };
};

type Slot = {
  id: string;         // "A-1" / "D-12"
  dir: "across" | "down";
  r: number;
  c: number;
  length: number;
  number: number;
};

type Entry = { answer: string; clue: string };

// ——————————————————————————————————————————
// 1) A modest wordlist with varied lengths (3–11)
const WORDS: Entry[] = [
  { answer: "AREA", clue: "Two-dimensional measure" },
  { answer: "ORBIT", clue: "Path around a star" },
  { answer: "ATOM", clue: "Basic unit of matter" },
  { answer: "ARRAY", clue: "Data structure of elements" },
  { answer: "REACT", clue: "Popular front-end library" },
  { answer: "STATE", clue: "Condition or mode" },
  { answer: "DELTA", clue: "Letter after gamma" },
  { answer: "RIVER", clue: "Natural watercourse" },
  { answer: "PARIS", clue: "City on the Seine" },
  { answer: "BERLIN", clue: "Brandenburg Gate city" },
  { answer: "LONDON", clue: "City with the Thames" },
  { answer: "PYTHON", clue: "Language with indentation" },
  { answer: "SCRIPT", clue: "Text for a play" },
  { answer: "EDITOR", clue: "One who revises text" },
  { answer: "PUZZLE", clue: "Something to solve" },
  { answer: "CLUE", clue: "Hint for a solver" },
  { answer: "NODE", clue: "Graph vertex" },
  { answer: "EDGE", clue: "Graph connection" },
  { answer: "ALGORITHM", clue: "Step-by-step procedure" },
  { answer: "GRADIENT", clue: "Slope in math or color" },
  { answer: "NETWORK", clue: "Connected system" },
  { answer: "COMPILER", clue: "Translator for source code" },
  { answer: "BROWSER", clue: "Software to view the web" },
  { answer: "ENGINEER", clue: "Problem solver by trade" },
  { answer: "ROUTER", clue: "Network traffic director" },
  { answer: "ARRAYS", clue: "Multiple linear containers" },
  { answer: "LIST", clue: "Linear collection" },
  { answer: "QUEUE", clue: "FIFO structure" },
  { answer: "STACK", clue: "LIFO structure" },
  { answer: "INPUT", clue: "What you type" },
  { answer: "OUTPUT", clue: "What you get" },
  { answer: "METRIC", clue: "Standard of measurement" },
  { answer: "SUDOKU", clue: "Number-placement puzzle" },
  { answer: "CROSSWORD", clue: "Black-and-white word puzzle" },
  { answer: "ASYNC", clue: "Not happening at once" },
  { answer: "KERNEL", clue: "Core of an OS" },
  { answer: "SERVER", clue: "Provides resources on a network" },
  { answer: "CLIENT", clue: "Consumer on a network" },
  { answer: "VECTOR", clue: "Quantity with magnitude and direction" },
  { answer: "MATRIX", clue: "Rectangular array in math" },
  { answer: "REWRITE", clue: "Do over in new words" },
  { answer: "THEME", clue: "Unifying idea" },
  { answer: "LETTER", clue: "Alphabet member" },
  { answer: "NUMBER", clue: "Mathematical value" },
  { answer: "LATENCY", clue: "Delay on a network" },
  { answer: "BANDWIDTH", clue: "Capacity of a link" },
  { answer: "FRONTEND", clue: "UI side of a stack" },
  { answer: "BACKEND", clue: "Server side of a stack" },
  { answer: "DART", clue: "Language used with Flutter" },
  { answer: "FLUTTER", clue: "UI toolkit by Google" },
  { answer: "RECHARGE", clue: "Fill the battery again" },
  { answer: "SOLDER", clue: "Join with molten metal" },
  { answer: "PARSER", clue: "Component that builds ASTs" },
  { answer: "CACHE", clue: "Speedy memory" },
  { answer: "COOKIE", clue: "Small web token" },
  { answer: "SESSION", clue: "Period of activity" },
  { answer: "STORAGE", clue: "Place for keeping data" },
  { answer: "MOBILE", clue: "Designed for phones" },
  { answer: "DESKTOP", clue: "Designed for PCs" },
  { answer: "BIT", clue: "Binary digit" },
  { answer: "BYTE", clue: "Eight bits" },
  { answer: "EMAIL", clue: "Electronic message" },
  { answer: "LOGIN", clue: "Start a session" },
  { answer: "TOKEN", clue: "Access credential" },
  { answer: "SECRET", clue: "Keep it hidden" },
  { answer: "SECURE", clue: "Safe from threats" },
];

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
      const rr = size - 1 - r, cc = size - 1 - c;
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
    !blocks[r][c] && (c === 0 || blocks[r][c - 1]) && (c + 1 < size && !blocks[r][c + 1]);

  const isStartDown = (r: number, c: number) =>
    !blocks[r][c] && (r === 0 || blocks[r - 1][c]) && (r + 1 < size && !blocks[r + 1][c]);

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
  if (!res) {
    throw new Error("Failed to generate a fill with the current dictionary. Add more WORDS.");
  }

  // Compose solution grid
  const filled = res.grid.map((row) => row.slice());

  // Build clues
  const fillsById = res.fills; // id => Entry
  const toClues = (slots: Slot[]) =>
    slots.map((s) => {
      const entry = fillsById[s.id];
      return {
        number: s.number,
        row: s.r,
        col: s.c,
        length: s.length,
        answer: entry.answer,
        clue: entry.clue,
      } as Clue;
    });

  const acrossClues = toClues(across);
  const downClues = toClues(down);

  // Create puzzle (empty letters), keep blocks separately
  const puzzleGrid = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => (blocks[r][c] ? "" : ""))
  );

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

// Example usage:
// const xw = generateCrossword(11);
// xw.puzzleGrid    // play grid (all empty letters)
// xw.solutionGrid  // fully filled solution
// xw.blocks        // where the blocks are
// xw.clues.across / xw.clues.down