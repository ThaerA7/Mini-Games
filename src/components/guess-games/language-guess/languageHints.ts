// components/guess-games/language-guess/languageHints.ts

/**
 * Subtle, non-revealing hints (exactly three, in order):
 * 1) Family (broad group name)
 * 2) Native speakers (very broad category)
 * 3) Broad location (regions, not specific countries)
 *
 * If a language code is missing from the tables, sensible fallbacks are used.
 */

// --- Family map (concise, broad group names) ---
const FAMILY: Record<string, string> = {
  // Germanic
  en: "West Germanic",
  de: "West Germanic",
  nl: "West Germanic",
  af: "West Germanic",
  sv: "North Germanic",
  no: "North Germanic",
  da: "North Germanic",
  is: "North Germanic",
  fy: "West Germanic",
  yi: "West Germanic",

  // Romance
  fr: "Romance",
  es: "Romance",
  it: "Romance",
  pt: "Romance",
  ro: "Romance",
  ca: "Romance",
  gl: "Romance",
  la: "Italic (Classical Latin)",
  ht: "French-based Creole",

  // Slavic
  ru: "East Slavic",
  uk: "East Slavic",
  be: "East Slavic",
  pl: "West Slavic",
  cs: "West Slavic",
  sk: "West Slavic",
  bg: "South Slavic",
  mk: "South Slavic",
  sl: "South Slavic",
  sr: "South Slavic",
  hr: "South Slavic",
  bs: "South Slavic",

  // Uralic
  fi: "Uralic (Finnic)",
  et: "Uralic (Finnic)",
  hu: "Uralic (Ugric)",

  // Baltic
  lt: "Baltic",
  lv: "Baltic",

  // Hellenic / Albanian / Armenian / Kartvelian
  el: "Hellenic",
  sq: "Albanian",
  hy: "Armenian",
  ka: "Kartvelian",

  // Celtic
  ga: "Celtic (Goidelic)",
  gd: "Celtic (Goidelic)",
  cy: "Celtic (Brittonic)",
  br: "Celtic (Brittonic)",

  // Semitic & neighbors
  ar: "Semitic",
  he: "Semitic",
  am: "Semitic (Ethiosemitic)",
  mt: "Semitic",

  // Iranic / Indo-Aryan / Indo-Iranian
  fa: "Iranic (Indo-Iranian)",
  ps: "Iranic (Indo-Iranian)",
  tg: "Iranic (Indo-Iranian)",
  "ku-Latn": "Iranic (Kurdish)",
  ckb: "Iranic (Kurdish)",
  hi: "Indo-Aryan",
  ur: "Indo-Aryan",
  bn: "Indo-Aryan",
  mr: "Indo-Aryan",
  pa: "Indo-Aryan",
  gu: "Indo-Aryan",
  ne: "Indo-Aryan",
  as: "Indo-Aryan",
  or: "Indo-Aryan",
  sd: "Indo-Aryan",
  si: "Indo-Aryan",
  bho: "Indo-Aryan",
  mai: "Indo-Aryan",

  // Dravidian
  ta: "Dravidian",
  te: "Dravidian",
  ml: "Dravidian",
  kn: "Dravidian",

  // Turkic / Mongolic
  tr: "Turkic (Oghuz)",
  az: "Turkic (Oghuz)",
  tk: "Turkic (Oghuz)",
  kk: "Turkic (Kipchak)",
  ky: "Turkic (Kipchak)",
  uz: "Turkic (Karluk)",
  mn: "Mongolic",

  // Sinitic / Japonic / Koreanic / Tai-Kadai / Austroasiatic / Sino-Tibetan
  "zh-Hans": "Sinitic",
  "zh-Hant": "Sinitic",
  ja: "Japonic",
  ko: "Koreanic",
  th: "Tai-Kadai",
  lo: "Tai-Kadai",
  vi: "Austroasiatic (Vietic)",
  km: "Austroasiatic (Khmer)",
  my: "Sino-Tibetan (Burmese)",

  // Austronesian
  id: "Austronesian (Malayic)",
  ms: "Austronesian (Malayic)",
  tl: "Austronesian (Central Philippine)",
  ceb: "Austronesian",
  jv: "Austronesian (Javanic)",
  su: "Austronesian (Sundanese)",
  mi: "Austronesian (Polynesian)",
  sm: "Austronesian (Polynesian)",
  mg: "Austronesian (Barito)",

  // Niger-Congo & neighbors
  sw: "Bantu (Niger-Congo)",
  zu: "Bantu (Niger-Congo)",
  xh: "Bantu (Niger-Congo)",
  sn: "Bantu (Niger-Congo)",
  yo: "Volta–Niger (Niger-Congo)",
  ig: "Volta–Niger (Niger-Congo)",
  ny: "Bantu (Niger-Congo)",
  ha: "Chadic (Afro-Asiatic)",
  so: "Cushitic (Afro-Asiatic)",

  // Constructed
  eo: "Constructed (Planned Language)",
};

// --- Region map (broad regions, non-specific) ---
const REGION: Record<string, string> = {
  en: "Global",
  pt: "Europe, South America & Africa",
  es: "Europe & Latin America",
  fr: "Europe & Africa",
  de: "Europe",
  it: "Europe",
  nl: "Europe",
  sv: "Northern Europe",
  no: "Northern Europe",
  da: "Northern Europe",
  is: "Northern Europe",
  fi: "Northern Europe",
  et: "Northern Europe (Baltic)",
  lv: "Northern Europe (Baltic)",
  lt: "Northern Europe (Baltic)",
  ru: "Eastern Europe & North Asia",
  uk: "Eastern Europe",
  be: "Eastern Europe",
  pl: "Europe",
  cs: "Europe",
  sk: "Europe",
  sl: "Europe",
  hr: "Europe",
  bs: "Europe",
  mk: "Southeastern Europe",
  ro: "Southeastern Europe",
  bg: "Southeastern Europe",
  el: "Southeastern Europe (Mediterranean)",
  tr: "Western Asia",
  az: "South Caucasus & Western Asia",
  hy: "South Caucasus",
  ka: "South Caucasus",
  eu: "Southwestern Europe",
  sq: "Europe",
  ga: "Western Europe",
  gd: "Western Europe",
  cy: "Western Europe",
  br: "Western Europe",
  fy: "Western Europe",
  ar: "Middle East & North Africa",
  he: "Middle East",
  mt: "Mediterranean",
  fa: "Western Asia",
  ps: "South & Central Asia",
  tg: "Central Asia",
  hi: "South Asia",
  ur: "South Asia",
  bn: "South Asia",
  mr: "South Asia",
  pa: "South Asia",
  gu: "South Asia",
  ne: "South Asia",
  as: "South Asia",
  or: "South Asia",
  sd: "South Asia",
  si: "South Asia",
  ta: "South Asia",
  te: "South Asia",
  ml: "South Asia",
  kn: "South Asia",
  bho: "South Asia",
  mai: "South Asia",
  "zh-Hans": "East Asia",
  "zh-Hant": "East Asia",
  ja: "East Asia",
  ko: "East Asia",
  vi: "Southeast Asia",
  th: "Southeast Asia",
  lo: "Southeast Asia",
  km: "Southeast Asia",
  my: "Southeast Asia",
  id: "Southeast Asia",
  ms: "Southeast Asia",
  tl: "Southeast Asia",
  ceb: "Southeast Asia",
  jv: "Southeast Asia",
  su: "Southeast Asia",
  sw: "East Africa",
  am: "Horn of Africa",
  so: "Horn of Africa",
  yo: "West Africa",
  ig: "West Africa",
  ha: "West Africa",
  ny: "Southeast Africa",
  zu: "Southern Africa",
  xh: "Southern Africa",
  sn: "Southern Africa",
  mg: "Indian Ocean (Madagascar)",
  mi: "Oceania (New Zealand)",
  sm: "Oceania (Samoa)",
  la: "No native region (historical/learned)",
  eo: "Global (primarily learned)",
  mn: "East & Central Asia",
  uz: "Central Asia",
  kk: "Central Asia",
  ky: "Central Asia",
  tk: "Central Asia",
  ht: "Caribbean",
  "ku-Latn": "Western Asia",
  ckb: "Western Asia",
  af: "Southern Africa",
  yi: "Central & Eastern Europe (historical)",
};

// --- Native speakers (very broad categories) ---
const HUNDREDS_OF_MILLIONS = new Set([
  "en",
  "es",
  "hi",
  "bn",
  "ar",
  "pt",
  "zh-Hans",
]);

const OVER_ONE_HUNDRED_MILLION = new Set(["ru", "ja", "pa"]);

const TENS_OF_MILLIONS = new Set([
  "de",
  "fr",
  "it",
  "tr",
  "ko",
  "vi",
  "fa",
  "id",
  "ur",
  "pl",
  "uk",
  "nl",
  "ro",
  "th",
  "my",
  "km",
  "si",
  "as",
  "or",
  "sd",
  "ta",
  "te",
  "mr",
  "gu",
  "ms",
  "jv",
  "su",
  "ceb",
  "tl",
  "yo",
  "ig",
  "ha",
  "sw",
  "am",
  "uz",
  "kk",
  "az",
  "bg",
  "hu",
  "he",
  "el",
  "mn",
  "ne",
  "lo",
  "bho",
  "mai",
  "zh-Hant",
]);

const A_FEW_MILLION = new Set([
  "cs",
  "sk",
  "sl",
  "hr",
  "bs",
  "mk",
  "ka",
  "hy",
  "sq",
  "tg",
  "ky",
  "tk",
  "xh",
  "sn",
  "ny",
  "mi",
  "sm",
  "mg",
  "fi",
  "lt",
  "lv",
  "et",
  "si",
  "ht",
  "eu",
  "mt",
  "gd",
  "br",
  "fy",
  "cy",
  "ga",
  "so",
  "be",
]);

const UNDER_ONE_MILLION = new Set([
  "is",
  "yi",
  "gl",
  "pa-Arab", // safeguard if used
]);

const NO_NATIVE_COMMUNITY = new Set(["la", "eo"]);

function speakersCategory(code: string): string {
  if (HUNDREDS_OF_MILLIONS.has(code)) return "hundreds of millions";
  if (OVER_ONE_HUNDRED_MILLION.has(code)) return "over one hundred million";
  if (TENS_OF_MILLIONS.has(code)) return "tens of millions";
  if (A_FEW_MILLION.has(code)) return "a few million";
  if (UNDER_ONE_MILLION.has(code)) return "under one million";
  if (NO_NATIVE_COMMUNITY.has(code))
    return "no native community (primarily learned)";
  // conservative default
  return "millions";
}

/**
 * Returns exactly three subtle hints in this order:
 * 1) Family
 * 2) Native speakers (broad category)
 * 3) Broad location (not specific)
 */
export function getLanguageHints(code: string): string[] {
  const family = FAMILY[code] || "Language family varies";
  const speakers = speakersCategory(code);
  const region = REGION[code] || "Various regions";
  return [
    `Family: ${family}`,
    `Native speakers: ${speakers}`,
    `Broad location: ${region}`,
  ];
}
