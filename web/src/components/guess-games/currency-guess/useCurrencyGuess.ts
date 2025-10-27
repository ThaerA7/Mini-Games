import * as React from "react";
import { COUNTRIES } from "../flag-guess/countries";

type Phase = "idle" | "playing" | "won" | "wrong" | "finished";

export type Question = {
  // country
  code: string;          // ISO 3166-1 alpha-2 country code (e.g., "DE")
  flag: string;          // emoji fallback
  country: string;       // country name (for UI)
  // currency
  canonical: string;     // pretty answer, e.g. "Euro (EUR)"
  accepted: string[];    // normalized accepted answers (names + codes)
  rawAccepted: string[]; // for suggestions (un-normalized, e.g., ["Euro","EUR"])
};

const BEST_KEY = "currency-guess-best-score";

// ===== Helpers =====

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeName(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")     // strip accents
    .replace(/[\s'’"().,/-]+/g, " ")     // collapse punctuation-ish
    .replace(/\s+/g, " ");               // normalize spaces
}

// Single normalized lane for both names & codes
function normAns(s: string): string {
  return normalizeName(s);
}

// ===== Currency rule model =====

type Rule = {
  countries: string[];     // ISO2 countries impacted by this rule
  code: string;            // ISO 4217 code (e.g., "EUR")
  names: string[];         // primary names (e.g., ["Euro"])
  extra?: string[];        // optional aliases/synonyms (e.g., ["EURO"])
  symbol?: string;         // optional symbol (e.g., "€")
};

type BankItem = {
  code: string;    // country code
  flag: string;
  country: string;
  canonical: string;        // "Euro (EUR)" picked from first name + code
  accepted: Set<string>;    // normalized (names + codes)
  rawAccepted: Set<string>; // raw strings for suggestions (names + code)
};

// Utility: expand a group into a rule
const group = (countries: string[], code: string, names: string[], extra: string[] = [], symbol?: string): Rule => ({
  countries, code, names, extra, symbol,
});

// ----- Currency groups / rules (compact & readable) -----

// Euro area + euroized microstates (+ Montenegro)
const EUR = ["AT","BE","CY","DE","EE","ES","FI","FR","GR","IE","IT","LT","LU","LV","MT","NL","PT","SI","SK","HR","AD","MC","SM","VA","ME"];

// West African CFA (XOF)
const XOF = ["BJ","BF","CI","GW","ML","NE","SN","TG"];

// Central African CFA (XAF)
const XAF = ["CM","CF","TD","CG","GQ","GA"];

// East Caribbean dollar (XCD)
const XCD = ["AG","DM","GD","KN","LC","VC"];

// USD countries (fully dollarized)
const USD_FULL = ["EC","SV","TL","FM","MH","PW"];

// AUD shared
const AUD_SHARED = ["NR","KI","TV"];

// Build the rules list
const RULES: Rule[] = [
  // --- Big & common currencies ---
  group(["US"], "USD", ["United States dollar","US dollar","U.S. dollar"], ["American dollar","Dollar"], "$"),
  group(["GB"], "GBP", ["Pound sterling","British pound"], ["Pound","Sterling"], "£"),
  group(EUR, "EUR", ["Euro"], [], "€"),
  group(["JP"], "JPY", ["Japanese yen","Yen"], ["JPY"], "¥"),
  group(["CN"], "CNY", ["Chinese yuan","Renminbi","Yuan","RMB"], ["Renminbi yuan","Rénmínbì"], "¥"),
  group(["IN"], "INR", ["Indian rupee","Rupee"], ["₹","Rs","Rupees"], "₹"),
  group(["RU"], "RUB", ["Russian ruble"], ["Rouble"]),
  group(["CA"], "CAD", ["Canadian dollar"], ["CAD"]),
  group(["AU"], "AUD", ["Australian dollar"], ["AUD"]),
  group(AUD_SHARED, "AUD", ["Australian dollar"], ["AUD"]),
  group(["NZ"], "NZD", ["New Zealand dollar"], ["NZD"]),
  group(["CH","LI"], "CHF", ["Swiss franc"], ["Franc","CHF"]),
  group(["SE"], "SEK", ["Swedish krona"], ["Krona","SEK"]),
  group(["NO"], "NOK", ["Norwegian krone"], ["Krone","NOK"]),
  group(["DK"], "DKK", ["Danish krone"], ["Krone","DKK"]),
  group(["PL"], "PLN", ["Polish zloty","Polish złoty","Zloty","Złoty"], ["PLN"]),
  group(["CZ"], "CZK", ["Czech koruna","Koruna"], ["CZK"]),
  group(["HU"], "HUF", ["Forint"], ["HUF"]),
  group(["RO"], "RON", ["Romanian leu","Leu","Lei"], ["RON"]),
  group(["BG"], "BGN", ["Bulgarian lev","Lev","Leva"], ["BGN"]),
  group(["TR"], "TRY", ["Turkish lira","Lira"], ["TRY"]),
  group(["BR"], "BRL", ["Brazilian real","Real","Reais"], ["BRL"]),
  group(["MX"], "MXN", ["Mexican peso","Peso"], ["MXN"]),
  group(["AR"], "ARS", ["Argentine peso","Peso"], ["ARS"]),
  group(["CL"], "CLP", ["Chilean peso","Peso"], ["CLP"]),
  group(["CO"], "COP", ["Colombian peso","Peso"], ["COP"]),
  group(["PE"], "PEN", ["Peruvian sol","Sol"], ["PEN"]),
  group(["UY"], "UYU", ["Uruguayan peso","Peso"], ["UYU"]),
  group(["VE"], "VES", ["Venezuelan bolivar","Bolívar","Bolivar"], ["VES"]),
  group(["ZA"], "ZAR", ["South African rand","Rand"], ["ZAR"]),
  // --- MENA / West & South Asia ---
  group(["EG"], "EGP", ["Egyptian pound","Pound"], ["EGP"]),
  group(["SA"], "SAR", ["Saudi riyal","Riyal"], ["SAR"]),
  group(["AE"], "AED", ["UAE dirham","United Arab Emirates dirham","Dirham"], ["AED"]),
  group(["QA"], "QAR", ["Qatari riyal","Riyal"], ["QAR"]),
  group(["KW"], "KWD", ["Kuwaiti dinar","Dinar"], ["KWD"]),
  group(["BH"], "BHD", ["Bahraini dinar","Dinar"], ["BHD"]),
  group(["OM"], "OMR", ["Omani rial","Rial"], ["OMR"]),
  group(["YE"], "YER", ["Yemeni rial","Rial"], ["YER"]),
  group(["JO"], "JOD", ["Jordanian dinar","Dinar"], ["JOD"]),
  group(["IQ"], "IQD", ["Iraqi dinar","Dinar"], ["IQD"]),
  group(["IR"], "IRR", ["Iranian rial","Rial"], ["IRR"]),
  group(["LB"], "LBP", ["Lebanese pound","Lira"], ["LBP"]),
  group(["SY"], "SYP", ["Syrian pound","Lira"], ["SYP"]),
  group(["IL"], "ILS", ["Israeli new shekel","New shekel","Shekel","NIS"], ["ILS"]),
  // State of Palestine (ILS & JOD commonly circulate)
  group(["PS"], "ILS", ["Israeli new shekel","New shekel","Shekel","NIS"], ["ILS"]),
  group(["PS"], "JOD", ["Jordanian dinar","Dinar"], ["JOD"]),
  // --- South / Southeast / East Asia ---
  group(["PK"], "PKR", ["Pakistani rupee","Rupee"], ["PKR"]),
  group(["BD"], "BDT", ["Taka"], ["BDT"]),
  group(["LK"], "LKR", ["Sri Lankan rupee","Rupee"], ["LKR"]),
  group(["NP"], "NPR", ["Nepalese rupee","Nepalese rupee","Rupee"], ["NPR"]),
  group(["TH"], "THB", ["Baht"], ["THB"]),
  group(["VN"], "VND", ["Dong","Đồng","Dong (đồng)"], ["VND"]),
  group(["PH"], "PHP", ["Philippine peso","Peso"], ["PHP"]),
  group(["ID"], "IDR", ["Rupiah"], ["IDR"]),
  group(["MY"], "MYR", ["Ringgit","Malaysian ringgit"], ["MYR"]),
  group(["SG"], "SGD", ["Singapore dollar"], ["SGD"]),
  group(["KR"], "KRW", ["South Korean won","Won"], ["KRW"]),
  group(["KP"], "KPW", ["North Korean won","Won"], ["KPW"]),
  group(["LA"], "LAK", ["Kip"], ["LAK"]),
  group(["KH"], "KHR", ["Riel"], ["KHR"]),
  group(["MM"], "MMK", ["Kyat"], ["MMK"]),
  group(["MN"], "MNT", ["Togrog","Tögrög","Tugrik"], ["MNT"]),
  // Bhutan dual (BTN + INR accepted)
  group(["BT"], "BTN", ["Ngultrum"], ["BTN"]),
  group(["BT"], "INR", ["Indian rupee","Rupee"], ["INR"]),
  // Brunei dual (BND + SGD accepted)
  group(["BN"], "BND", ["Brunei dollar"], ["BND"]),
  group(["BN"], "SGD", ["Singapore dollar"], ["SGD"]),
  // Timor-Leste USD
  ...USD_FULL.map(c => group([c], "USD", ["United States dollar","US dollar","U.S. dollar"], ["Dollar"], "$")),
  // --- Europe (non-euro that aren’t above) ---
  group(["UA"], "UAH", ["Hryvnia","Ukrainian hryvnia"], ["UAH"]),
  group(["BY"], "BYN", ["Belarusian ruble","Ruble","Rouble"], ["BYN"]),
  group(["MD"], "MDL", ["Moldovan leu","Leu","Lei"], ["MDL"]),
  group(["AL"], "ALL", ["Lek"], ["ALL"]),
  group(["RS"], "RSD", ["Serbian dinar","Dinar"], ["RSD"]),
  group(["BA"], "BAM", ["Convertible mark","Bosnia and Herzegovina convertible mark","Marka"], ["BAM"]),
  group(["MK"], "MKD", ["Denar","Macedonian denar"], ["MKD"]),
  group(["IS"], "ISK", ["Icelandic króna","Krona","Króna"], ["ISK"]),
  // --- Africa big block ---
  group(["DZ"], "DZD", ["Algerian dinar","Dinar"], ["DZD"]),
  group(["MA"], "MAD", ["Moroccan dirham","Dirham"], ["MAD"]),
  group(["TN"], "TND", ["Tunisian dinar","Dinar"], ["TND"]),
  group(["LY"], "LYD", ["Libyan dinar","Dinar"], ["LYD"]),
  group(["MR"], "MRU", ["Ouguiya"], ["MRU"]),
  group(["SD"], "SDG", ["Sudanese pound","Pound"], ["SDG"]),
  group(["SS"], "SSP", ["South Sudanese pound","Pound"], ["SSP"]),
  group(["ET"], "ETB", ["Birr","Ethiopian birr"], ["ETB"]),
  group(["ER"], "ERN", ["Nakfa"], ["ERN"]),
  group(["DJ"], "DJF", ["Djiboutian franc","Franc"], ["DJF"]),
  group(["SO"], "SOS", ["Somali shilling","Shilling"], ["SOS"]),
  group(["KE"], "KES", ["Kenyan shilling","Shilling"], ["KES"]),
  group(["UG"], "UGX", ["Ugandan shilling","Shilling"], ["UGX"]),
  group(["TZ"], "TZS", ["Tanzanian shilling","Shilling"], ["TZS"]),
  group(["RW"], "RWF", ["Rwandan franc","Franc"], ["RWF"]),
  group(["BI"], "BIF", ["Burundian franc","Franc"], ["BIF"]),
  group(["CD"], "CDF", ["Congolese franc","Franc"], ["CDF"]),
  ...XAF.map(c => group([c], "XAF", ["Central African CFA franc","CFA franc","Franc"], ["FCFA"])),
  ...XOF.map(c => group([c], "XOF", ["West African CFA franc","CFA franc","Franc"], ["FCFA"])),
  group(["GN"], "GNF", ["Guinean franc","Franc"], ["GNF"]),
  group(["GW"], "XOF", ["West African CFA franc","CFA franc","Franc"], ["FCFA"]),
  group(["LR"], "LRD", ["Liberian dollar","Dollar"], ["LRD"]),
  group(["SL"], "SLL", ["Leone"], ["SLL"]),
  group(["GH"], "GHS", ["Ghanaian cedi","Cedi"], ["GHS"]),
  group(["NG"], "NGN", ["Naira","Nigerian naira"], ["NGN"]),
  group(["BJ"], "XOF", ["West African CFA franc","CFA franc","Franc"], ["FCFA"]),
  group(["TG"], "XOF", ["West African CFA franc","CFA franc","Franc"], ["FCFA"]),
  group(["ZM"], "ZMW", ["Zambian kwacha","Kwacha"], ["ZMW"]),
  group(["MW"], "MWK", ["Malawian kwacha","Kwacha"], ["MWK"]),
  group(["MZ"], "MZN", ["Mozambican metical","Metical"], ["MZN"]),
  group(["MG"], "MGA", ["Ariary","Malagasy ariary"], ["MGA"]),
  group(["KM"], "KMF", ["Comorian franc","Franc"], ["KMF"]),
  group(["SC"], "SCR", ["Seychellois rupee","Rupee"], ["SCR"]),
  group(["MU"], "MUR", ["Mauritian rupee","Rupee"], ["MUR"]),
  group(["LS"], "LSL", ["Loti","Lesotho loti"], ["LSL"]),
  group(["SZ"], "SZL", ["Lilangeni","Eswatini lilangeni"], ["SZL"]),
  group(["BW"], "BWP", ["Pula"], ["BWP"]),
  group(["NA"], "NAD", ["Namibian dollar","Dollar"], ["NAD"]),
  group(["AO"], "AOA", ["Kwanza"], ["AOA"]),
  group(["CV"], "CVE", ["Cape Verdean escudo","Escudo"], ["CVE"]),
  group(["ST"], "STN", ["Dobra","São Tomé and Príncipe dobra"], ["STN"]),
  // --- Central America & Caribbean ---
  group(["GT"], "GTQ", ["Quetzal","Guatemalan quetzal"], ["GTQ"]),
  group(["HN"], "HNL", ["Lempira"], ["HNL"]),
  group(["NI"], "NIO", ["Cordoba","Córdoba","Nicaraguan córdoba"], ["NIO"]),
  group(["CR"], "CRC", ["Colón","Costa Rican colón"], ["CRC"]),
  // El Salvador USD (already in USD_FULL)
  // Panama dual (PAB + USD)
  group(["PA"], "PAB", ["Balboa","Panamanian balboa"], ["PAB"]),
  group(["PA"], "USD", ["United States dollar","US dollar","U.S. dollar","Dollar"], ["USD"]),
  group(["BZ"], "BZD", ["Belize dollar","Dollar"], ["BZD"]),
  group(["BS"], "BSD", ["Bahamian dollar","Dollar"], ["BSD"]),
  group(["BB"], "BBD", ["Barbadian dollar","Dollar"], ["BBD"]),
  group(["CU"], "CUP", ["Cuban peso","Peso"], ["CUP"]),
  group(["DO"], "DOP", ["Dominican peso","Peso"], ["DOP"]),
  group(["HT"], "HTG", ["Gourde","Haitian gourde"], ["HTG"]),
  group(["JM"], "JMD", ["Jamaican dollar","Dollar"], ["JMD"]),
  group(["TT"], "TTD", ["Trinidad and Tobago dollar","Dollar"], ["TTD"]),
  // East Caribbean XCD block (above)
  ...XCD.map(c => group([c], "XCD", ["East Caribbean dollar"], ["XCD"])),
  // --- Oceania & Pacific ---
  group(["PG"], "PGK", ["Kina","Papua New Guinean kina"], ["PGK"]),
  group(["SB"], "SBD", ["Solomon Islands dollar","Dollar"], ["SBD"]),
  group(["FJ"], "FJD", ["Fijian dollar","Dollar"], ["FJD"]),
  group(["VU"], "VUV", ["Vatu"], ["VUV"]),
  group(["TO"], "TOP", ["Paʻanga","Paanga"], ["TOP"]),
  group(["WS"], "WST", ["Tala","Samoan tala"], ["WST"]),
  group(["TV"], "AUD", ["Australian dollar"], ["AUD"]),
];

// Build a country -> bank item map by merging overlapping rules (multi-currency acceptance)
function buildBank(): BankItem[] {
  const byCountry = new Map<string, BankItem>();

  for (const r of RULES) {
    for (const cc of r.countries) {
      const country = COUNTRIES.find((c) => c.code === cc);
      if (!country) continue;

      const exists = byCountry.get(cc);
      const baseName = r.names[0] ?? r.code;
      const canonical = `${baseName} (${r.code})`;

      const namesRaw = new Set<string>([...r.names, ...(r.extra ?? []), r.code]);
      const accepted = new Set<string>(Array.from(namesRaw).map(normAns));

      if (exists) {
        // merge
        for (const a of accepted) exists.accepted.add(a);
        for (const raw of namesRaw) exists.rawAccepted.add(raw);
        // keep original canonical
      } else {
        byCountry.set(cc, {
          code: cc,
          flag: country.flag,
          country: country.name,
          canonical,
          accepted,
          rawAccepted: namesRaw,
        });
      }
    }
  }

  return Array.from(byCountry.values());
}

const BANK: BankItem[] = buildBank();
export const TOTAL_CURRENCY_QUESTIONS = BANK.length;

// Suggestions list: union of all raw names & codes
export const CURRENCY_SUGGESTIONS: string[] = Array.from(
  BANK.reduce((acc, item) => {
    item.rawAccepted.forEach((x) => acc.add(x));
    return acc;
  }, new Set<string>())
).sort((a, b) => a.localeCompare(b));

// Question view-model conversion
function makeQuestion(b: BankItem): Question {
  return {
    code: b.code,
    flag: b.flag,
    country: b.country,
    canonical: b.canonical,
    accepted: Array.from(b.accepted),
    rawAccepted: Array.from(b.rawAccepted),
  };
}

// ===== Hook =====
export function useCurrencyGuess() {
  const [phase, setPhase] = React.useState<Phase>("idle");

  // queue & progress
  const [queue, setQueue] = React.useState<BankItem[]>([]);
  const [levelIndex, setLevelIndex] = React.useState(0);
  const [score, setScore] = React.useState(0);

  // best score (persistent)
  const [bestScore, setBestScore] = React.useState(
    Number(localStorage.getItem(BEST_KEY) || 0)
  );

  // pre-generated queue for the NEXT run
  const [pendingQueue, setPendingQueue] = React.useState<BankItem[]>(() =>
    shuffle(BANK)
  );

  const upcomingFirst: Question = React.useMemo(
    () => makeQuestion(pendingQueue[0]),
    [pendingQueue]
  );

  const question = React.useMemo<Question | null>(() => {
    if (phase === "idle" || phase === "finished" || queue.length === 0) return null;
    const b = queue[levelIndex];
    return b ? makeQuestion(b) : null;
  }, [queue, levelIndex, phase]);

  const start = React.useCallback(() => {
    setQueue(pendingQueue);
    setLevelIndex(0);
    setScore(0);
    setPhase("playing");
    setPendingQueue(shuffle(BANK));
  }, [pendingQueue]);

  const restart = start;

  const submit = (userInput: string) => {
    if (!question || phase !== "playing") return;
    const g = normAns(userInput);
    const isCorrect = question.accepted.includes(g);
    if (isCorrect) {
      const nextScore = score + 1;
      if (nextScore > bestScore) {
        setBestScore(nextScore);
        localStorage.setItem(BEST_KEY, String(nextScore));
      }
      setScore(nextScore);
      setPhase("won");
    } else {
      setPhase("wrong");
    }
  };

  const goNext = () => {
    const nextIndex = levelIndex + 1;
    if (nextIndex >= TOTAL_CURRENCY_QUESTIONS) {
      setPhase("finished");
    } else {
      setLevelIndex(nextIndex);
      setPhase("playing");
    }
  };

  const continueAfterWrong = goNext;

  return {
    // progress
    level: levelIndex + 1,
    score,
    bestScore,
    total: TOTAL_CURRENCY_QUESTIONS,

    // state
    phase,
    question,
    upcomingFirst,

    // actions
    start,
    restart,
    submit,
    nextLevel: goNext,
    continueAfterWrong,
  };
}
