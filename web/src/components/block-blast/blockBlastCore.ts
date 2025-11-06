// blockBlastCore.ts
// Pure types, config, shapes, helpers, and new difficulty-aware piece generation for Block Blast.

export type Cell = 0 | number;         // 0 = empty, >0 = color index (1-based)
export type Board = Cell[][];
export type Point = { x: number; y: number };
export type Shape = Point[];
export type Piece = { id: string; shape: Shape };
export type SlotPiece = Piece | null;
export type Snapshot = { board: Board; bag: SlotPiece[]; score: number };

export type Difficulty = "Easy" | "Medium" | "Hard";

/** --- Config / Styling --- */
export const BOARD_SIZE = 9;
export const SCORE_MULTIPLIER = 15;
export const cellSize = "clamp(48px, 8.5vw, 72px)";
export const lineGap = 3;
export const lineColor = "rgba(0,0,0,0.9)";
export const uiGrey = "#555";
export const outerGap = 8;
export const outerColor = "rgba(40, 42, 48, 0.35)";
export const CELL_RADIUS = 6;
export const OUTER_RADIUS = 16;
export const TRAY_PIECE_SIZE = 26;     // bigger tray pieces
export const TRAY_GAP_FROM_BOARD = 6;  // tiny visual gap between board and tray

// Very minimal forgiveness
export const GRAB_RADIUS_PX = 42;      // tray pickup radius
// NO predictive hover. On drop/click allow only a 1-cell nudge on one axis:
export const MICRO_SNAP_ORDER: Point[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

// Line clear FX
export const BLAST_DURATION_MS = 480;
export const BLAST_STAGGER_MS = 26;

/** --- Palette --- */
export const PALETTE: [string, string][] = [
  ["rgba(59,130,246,0.95)", "rgba(59,130,246,0.65)"],
  ["rgba(168,85,247,0.95)", "rgba(168,85,247,0.65)"],
  ["rgba(34,197,94,0.95)", "rgba(34,197,94,0.65)"],
  ["rgba(234,179,8,0.95)", "rgba(234,179,8,0.65)"],
  ["rgba(249,115,22,0.95)", "rgba(249,115,22,0.65)"],
  ["rgba(244,63,94,0.95)", "rgba(244,63,94,0.65)"],
  ["rgba(20,184,166,0.95)", "rgba(20,184,166,0.65)"],
  ["rgba(99,102,241,0.95)", "rgba(99,102,241,0.65)"],
];

export const withAlpha = (rgba: string, a: number) =>
  rgba.replace(
    /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([.\d]+)\)/,
    (_, r, g, b) => `rgba(${r}, ${g}, ${b}, ${a})`
  );

/** --- Shapes --- */
export const SHAPES: Shape[] = [
  // minis
  [{ x: 0, y: 0 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
  [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],

  // T tetromino (up, right)
  [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 1 }],

  // S/Z
  [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],

  // Pentominoes
  [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }], // X
  [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], // U
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }], // V
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }], // W
  [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }], // P
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 1, y: 3 }], // L5
  [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 0, y: 3 }], // J5
  [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }], // N
];

/** --- Utils --- */
export const shapeKey = (shape: Shape) =>
  shape
    .slice()
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((p) => `${p.x},${p.y}`)
    .join("|");

export const colorIndexForShape = (shape: Shape) => {
  const key = shapeKey(shape);
  let h = 0 >>> 0;
  for (let i = 0; i < key.length; i++) h = ((h * 31) + key.charCodeAt(i)) >>> 0;
  return h % PALETTE.length;
};

export function emptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => 0 as Cell)
  );
}

/** Legacy random (kept for compatibility) */
export function randomPiece(): Piece {
  const idx = Math.floor(Math.random() * SHAPES.length);
  return { id: Math.random().toString(36).slice(2), shape: SHAPES[idx] };
}
export function trio(): Piece[] {
  return [randomPiece(), randomPiece(), randomPiece()];
}

/** Placement helpers */
export function canPlace(board: Board, piece: Piece, at: Point): boolean {
  return piece.shape.every(({ x, y }) => {
    const cx = at.x + x;
    const cy = at.y + y;
    return cy >= 0 && cy < BOARD_SIZE && cx >= 0 && cx < BOARD_SIZE && board[cy][cx] === 0;
  });
}
export function place(board: Board, piece: Piece, at: Point, val: number): Board {
  const copy = board.map((row) => row.slice()) as Board;
  piece.shape.forEach(({ x, y }) => {
    copy[at.y + y][at.x + x] = val;
  });
  return copy;
}

/** Line clear returns affected cells (for FX) */
export function clearLines(board: Board): {
  next: Board; cleared: number; rows: number[]; cols: number[]; cells: { x: number; y: number }[];
} {
  const rowsFull = board.map((row) => row.every((c) => c !== 0));
  const colsFull = Array.from({ length: BOARD_SIZE }, (_, x) => board.every((row) => row[x] !== 0));

  const rows: number[] = [];
  const cols: number[] = [];
  rowsFull.forEach((full, y) => full && rows.push(y));
  colsFull.forEach((full, x) => full && cols.push(x));

  const next = board.map((row) => row.slice()) as Board;
  let cleared = 0;

  rows.forEach((y) => {
    cleared++;
    for (let x = 0; x < BOARD_SIZE; x++) next[y][x] = 0;
  });
  cols.forEach((x) => {
    cleared++;
    for (let y = 0; y < BOARD_SIZE; y++) next[y][x] = 0;
  });

  const cells: { x: number; y: number }[] = [];
  const seen = new Set<string>();
  for (const y of rows) for (let x = 0; x < BOARD_SIZE; x++) { const k = `${x},${y}`; if (!seen.has(k)) { seen.add(k); cells.push({ x, y }); } }
  for (const x of cols) for (let y = 0; y < BOARD_SIZE; y++) { const k = `${x},${y}`; if (!seen.has(k)) { seen.add(k); cells.push({ x, y }); } }

  return { next, cleared, rows, cols, cells };
}

export function anyMoves(board: Board, pieces: Piece[]): boolean {
  for (const p of pieces) {
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        if (canPlace(board, p, { x, y })) return true;
      }
    }
  }
  return false;
}

/** Micro-snap: only allow shifting by ONE cell on ONE axis (no diagonals) */
export function microSnap(board: Board, piece: Piece, targetTL: Point): Point | null {
  if (canPlace(board, piece, targetTL)) return targetTL;
  for (const d of MICRO_SNAP_ORDER) {
    const cand = { x: targetTL.x + d.x, y: targetTL.y + d.y };
    if (canPlace(board, piece, cand)) return cand;
  }
  return null;
}

export function shapeBounds(shape: Shape) {
  const maxX = Math.max(...shape.map((p) => p.x));
  const maxY = Math.max(...shape.map((p) => p.y));
  return { cols: maxX + 1, rows: maxY + 1 };
}

/** --- Difficulty & score-weighted piece generation --- */
export const shapeSize = (s: Shape) => s.length;

export function difficultyForScore(score: number): Difficulty {
  if (score < 50000) return "Easy";
  if (score < 100000) return "Medium";
  return "Hard";
}

/**
 * Pool of shapes unlocked for the given score.
 * Easy: size ≤ 3 + 2x2 square
 * Medium: adds most tetrominoes (size 4)
 * Hard: emphasizes pentominoes (size ≥ 5) while keeping some variety
 */
export function piecePoolForScore(score: number): Shape[] {
  const tier = difficultyForScore(score);
  const all = SHAPES;

  const easy = all.filter((sh) => {
    const n = shapeSize(sh);
    // include 2x2 square explicitly
    const isSquare2x2 =
      n === 4 &&
      new Set(sh.map((p) => `${p.x},${p.y}`)).size === 4 &&
      Math.max(...sh.map((p) => p.x)) === 1 &&
      Math.max(...sh.map((p) => p.y)) === 1;
    return n <= 3 || isSquare2x2;
  });

  const medium = all.filter((sh) => shapeSize(sh) === 4);
  const hard = all.filter((sh) => shapeSize(sh) >= 5);

  if (tier === "Easy") return easy;

  if (tier === "Medium") {
    // weighted mix (more medium, some easy, a hint of hard)
    return [
      ...easy, ...easy,
      ...medium, ...medium, ...medium, ...medium,
      ...hard // rare teaser
    ];
  }

  // Hard: bias towards bigger/awkward shapes but keep variety
  return [
    ...easy,
    ...medium, ...medium,
    ...hard, ...hard, ...hard, ...hard
  ];
}

/** Random piece from score-weighted pool */
export function randomPieceForScore(score: number): Piece {
  const pool = piecePoolForScore(score);
  const idx = Math.floor(Math.random() * pool.length);
  return { id: Math.random().toString(36).slice(2), shape: pool[idx] };
}

/** Trio based on score */
export function trioForScore(score: number): Piece[] {
  return [randomPieceForScore(score), randomPieceForScore(score), randomPieceForScore(score)];
}
