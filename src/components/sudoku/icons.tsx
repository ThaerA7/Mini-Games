// ./icons.tsx
import * as React from "react";

export type IconProps = React.SVGProps<SVGSVGElement> & {
  /** width/height, defaults to 22 like your current icons */
  size?: number | string;
};

const Svg: React.FC<IconProps> = ({ size = 22, children, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const Undo: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path
      d="M7 7H3v4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 11a9 9 0 1 0 3-6.7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const Eraser: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path
      d="M3 17l7-7 7 7-3 3H6l-3-3z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M14 7l2-2 5 5-2 2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </Svg>
);

export const Pencil: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path
      d="M3 21l3-1 11-11-2-2L4 18l-1 3z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M14 4l2-2 4 4-2 2-4-4z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </Svg>
);

export const Sparkles: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path
      d="M5 12l2-2-2-2 2-2 2 2 2-2 2 2-2 2 2 2-2 2-2-2-2 2-2-2 2-2z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M17 7l1-3 1 3 3 1-3 1-1 3-1-3-3-1 3-1z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </Svg>
);

export const Bulb: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path
      d="M9 18h6M8 22h8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 2a7 7 0 0 0-4 13c.4.4 1 1.3 1 2h6c0-.7.6-1.6 1-2a7 7 0 0 0-4-13z"
      stroke="currentColor"
      strokeWidth="2"
    />
  </Svg>
);

export const Reset: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <path
      d="M21 12a9 9 0 1 1-3-6.7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M21 3v6h-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const Dice: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="4"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
  </Svg>
);

export const Hard: React.FC<IconProps> = (props) => (
  <Svg {...props}>
    {/* Eye outline */}
    <path
      d="M2 12s3.5-5 10-5 10 5 10 5-3.5 5-10 5-10-5-10-5z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Pupil */}
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    {/* Slash */}
    <path
      d="M4 4l16 16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

export const Icons = {
  Undo,
  Eraser,
  Pencil,
  Sparkles,
  Bulb,
  Reset,
  Dice,
  Hard,
} as const;
export default Icons;

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
