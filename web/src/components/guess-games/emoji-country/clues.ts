import * as emoji from "node-emoji";

export type EmojiClue = {
  // At least one token required at compile-time
  emojis: [string, ...string[]]; // emoji and/or short text tokens shown big on the board
  hint?: string; // short phonetic breakdown for accessibility
};

/**
 * Pronunciation-first, punny clues.
 * - Keep segments short and obvious.
 * - Feel free to mix text tokens (e.g. "J", E('pore','🫗')) with emoji.
 * - Only countries included here appear in the game.
 * - Rule: each country must include **at least one actual emoji** among its tokens.
 */
// --- Emoji helper via node-emoji and curated aliases ---
const ALIAS: Record<string, string> = {
  pore: "pouring_liquid",
  gym: "person_lifting_weights",
  girl: "girl",
  grapes: "grapes",
  oats: "sheaf_of_rice",
  grease: "lotion_bottle",
  net: "goal_net",
  door: "door",
  woman: "woman",
  man: "man",
  boss: "office_worker",
  rug: "couch_and_lamp",
  equals: "heavy_equals_sign",
  
  column: "classical_building",
};

export function E(name: string, fallback?: string): string {
  const key = ALIAS[name] || name;
  try {
    // @ts-ignore - node-emoji typings vary by version
    if ((emoji as any).has?.(key)) return (emoji as any).get?.(key) ?? (fallback ?? key);
  } catch {}
  try {
    // @ts-ignore
    const val = (emoji as any).emojify?.(`:${key}:`);
    if (val && typeof val === "string" && !val.includes(`:${key}:`)) return val;
  } catch {}
  return fallback ?? key;
}

export const CLUES_BY_CODE: Record<string, EmojiClue> = {
  // ===== exact examples you asked for =====
  TH: { emojis: ["👔", "🏝️"]}, // Thailand
  DE: { emojis: ["🦠", "💰"]}, // Germany
  IS: { emojis: ["🧊", "🏝️"]}, // Iceland
  JP: { emojis: ["J", "🍳"]}, // Japan
  BH: { emojis: ["🅱️", "🌧️"]}, // Bahrain

  // ===== clean “LAND” puns =====
  FI: { emojis: ["🐟", "🏝️"]}, // Finland
  PL: { emojis: ["🎣", "🏝️"]}, // Poland (fishing pole)
  IE: { emojis: ["😠", "🏝️"]}, // Ireland
  NL: { emojis: ["🥅", "👩", "🏝️"]}, // Netherlands
  NZ: { emojis: ["🆕", "🌊", "🏝️"]}, // New Zealand
  GL: { emojis: ["🟩", "🏝️"]}, // Greenland (if you use XK codes; else remove)

  // ===== short & punchy homophones =====
  ES: { emojis: ["S", "🤕"]}, // Spain
  GR: { emojis: [E('grease','🧴')]}, // Greece
  HU: { emojis: ["🍔"]}, // Hungary
  DK: { emojis: ["🕳️", "✅"]}, // Denmark
  NO: { emojis: ["🚫", "🛣️"]}, // Norway
  IT: { emojis: ["👁️", "📊"]}, // Italy

  // ===== Middle East / North Africa (phonetic) =====
  KW: { emojis: ["Q", "⏳"]}, // Kuwait
  OM: { emojis: ["🅾️", "👨"]}, // Oman
  IR: { emojis: ["👁️", "🏃"]}, // Iran
  IQ: { emojis: ["👁️", "🪨"]}, // Iraq
  YE: { emojis: ["👍", "👨‍👨‍👦"]}, // Yemen
  CY: { emojis: ["😮‍💨", "🗞️"]}, // Cyprus
  IL: { emojis: ["ℹ️", "🚆"]}, // Israel
  JO: { emojis: ["🗣️", "DAN"]}, // Jordan
  QA: { emojis: ["✂️", "🧵"]}, // Qatar
  TR: { emojis: ["🦃", "🔑"]}, // Turkey

  // ===== South / East / SE Asia =====
  SG: { emojis: ["🎤", "A", E('pore','🫗')]}, // Singapore
  CN: { emojis: ["🍵", "🙅"]}, // China
  IN: { emojis: ["IN", "🦌", "YA"]}, // India
  NP: { emojis: ["🦵", "👤"]}, // Nepal
  BT: { emojis: ["👢", "🟫"]}, // Bhutan
  MY: { emojis: ["🏬", "🌏"]}, // Malaysia
  LA: { emojis: ["LA", "🅾️", "S"]}, // Laos (ensure an emoji)
  VN: { emojis: ["🩺", "😋"]}, // Vietnam
  KR: { emojis: ["⬇️", "KOREA"]}, // South Korea
  KP: { emojis: ["⬆️", "KOREA"]}, // North Korea
  TW: { emojis: ["👔", "1️⃣"]}, // Taiwan

  // ===== Oceania =====
  AU: { emojis: ["🧙‍♂️", "🥾", "YA"]}, // Australia
  FJ: { emojis: ["💶", "G"]}, // Fiji
  TO: { emojis: ["👅", "🅰️"]}, // Tonga
  VU: { emojis: ["🚐", "👉", "2️⃣"]}, // Vanuatu
  PG: { emojis: ["📄", "🆕", "🐹"]}, // Papua New Guinea

  // ===== Europe more =====
  UA: { emojis: ["U", "🏗️"]}, // Ukraine
  RU: { emojis: ["🏃", "YA"]}, // Russia (playful)
  SE: { emojis: ["S", "👥", "🦊", "🏠"] }, // Sweden, // Sweden (ensure an emoji)
  CH: { emojis: ["🧀", "ER", "🏝️"]}, // Switzerland
  AT: { emojis: [E('oats','🌾'), "🌳", "A"]}, // Austria
  PT: { emojis: ["🛳️", "YOU", E('girl','👧')]}, // Portugal
  BE: { emojis: ["🔔", E('gym','🏋️')]}, // Belgium
  RO: { emojis: ["RO", "🤪"]}, // Romania
  CZ: { emojis: ["✅", "YA"]}, // Czechia
  SK: { emojis: ["🎿", "YA"]}, // Slovakia
  SI: { emojis: ["🐌", E('grapes'), "YA"]}, // Slovenia
  HR: { emojis: ["🐦", "🌏"]}, // Croatia
  BA: { emojis: [E('boss','👔'), "🦵", "A"]}, // Bosnia
  ME: { emojis: ["⛰️", "🫖", "🖤"] }, // Montenegro, // very playful; added emoji
  AL: { emojis: ["🦉", "🚫", "YA"] }, // Albania, // Albania

  // ===== Americas =====
  US: { emojis: ["U", "🧶", "🗽"] }, // United States, // United States (added emoji)
  CA: { emojis: ["🥫", "🍁"] }, // Canada, // Canada
  MX: { emojis: ["🧪", "🌿"] }, // Mexico, // Mexico
  CU: { emojis: ["🧊", "🅰️"]}, // Cuba
  HT: { emojis: ["🌾", "🍵"]}, // Haiti
  CL: { emojis: ["🌶️", "E"]}, // Chile
  PE: { emojis: ["🍐", "🦘"]}, // Peru
  BR: { emojis: ["👙", "🦭"]}, // Brazil
  AR: { emojis: ["🥈", "🥫", "A"] }, // Argentina,
  CO: { emojis: [E('column','🏛️'), "🐝", "A"] },
  UY: { emojis: ["YOU", E('rug','🛋️'), "❓"]},
  PY: { emojis: ["🪂", "👨", "❓"] }, // Paraguay,
  EC: { emojis: ["💧", "🚪"] }, // Ecuador,
  VE: { emojis: ["🏟️", "🦓", "👧"] }, // Venezuela,

  // ===== Africa (safe/fun picks) =====
  MA: { emojis: ["➕", "🪨", "🅾️"] }, // Morocco,
  MG: { emojis: ["😡", "⛽", "🚗"]},
  GA: { emojis: ["💬", "🔛"]},
  SO: { emojis: ["SO", "😷", "YA"]},
  EG: { emojis: ["E", "🚙", "T"]}, // playful stretch, ensured emoji
  ZA: { emojis: ["⬇️", "🌍", "🦁"] }, // South Africa,
};

// -------- Utility: validate rule "has at least one emoji token" --------
// Uses ES Unicode property escapes; covers nearly all emoji.
const emojiRe = /\p{Extended_Pictographic}/u;
const hasEmojiChar = (s: string) => emojiRe.test(s);

export function validateClues(clues: Record<string, EmojiClue> = CLUES_BY_CODE): string[] {
  const missing: string[] = [];
  for (const [code, clue] of Object.entries(clues)) {
    if (!clue.emojis.some(hasEmojiChar)) missing.push(code);
  }
  return missing; // empty array means all good
}


