// src/components/guess-games/GuessGamesOptionsDialog.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";

// ===== Local, isolated Dialog (no Sudoku dependency) =====

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
};

function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  // Keep the display font (isolated)
  React.useEffect(() => {
    const id = "gg-dialog-font-audiowide";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Audiowide&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  if (!open) return null;

  const panelPadding = 24;

  const overlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(4px)",
    display: "grid",
    placeItems: "center",
    zIndex: 1000,
    padding: 16,
  };

  const panel: React.CSSProperties = {
    width: "min(900px, 96vw)",
    borderRadius: 16,
    background:
      "linear-gradient(180deg, rgba(18,18,21,0.95), rgba(18,18,21,0.9))",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow:
      "0 18px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
    padding: panelPadding,
    color: "white",
    position: "relative",
    maxHeight: "84vh",
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 38,
    lineHeight: 1.2,
    letterSpacing: 0.5,
    textAlign: "center",
    fontFamily:
      '"Audiowide","Orbitron","Russo One",system-ui,Segoe UI,Roboto,sans-serif',
    background: "linear-gradient(90deg, #A7F3D0 0%, #FDE68A 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };

  const descStyle: React.CSSProperties = {
    marginTop: 6,
    opacity: 0.85,
    textAlign: "center",
  };

  const divider: React.CSSProperties = {
    marginTop: 12,
    height: 1,
    background:
      "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 15%, rgba(255,255,255,0.2) 85%, rgba(255,255,255,0) 100%)",
    position: "relative",
    left: -panelPadding,
    width: `calc(100% + ${panelPadding * 2}px)`,
  };

  const content: React.CSSProperties = {
    marginTop: 16,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => onOpenChange(false)}
      style={overlay}
    >
      <div onClick={(e) => e.stopPropagation()} style={panel}>
        {(title || description) && (
          <div>
            {title && <h3 style={titleStyle}>{title}</h3>}
            {description && <p style={descStyle}>{description}</p>}
            <div style={divider} />
          </div>
        )}
        <div style={content}>{children}</div>
      </div>
    </div>
  );
}

// ===== Guess Games options dialog =====

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function useUIButtonFont() {
  React.useEffect(() => {
    const id = "guess-ui-font-poppins";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);
}

const buttonBase: React.CSSProperties = {
  width: "100%",
  padding: "14px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  fontSize: 16,
  fontWeight: 700,
  fontFamily:
    "'Poppins', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji','Segoe UI Emoji'",
  color: "white",
  cursor: "pointer",
  userSelect: "none",
  outline: "none",
  display: "grid",
  gridTemplateColumns: "28px 1fr",
  alignItems: "center",
  gap: 12,
  transition:
    "transform 120ms ease, box-shadow 120ms ease, background 150ms ease, opacity .2s ease",
  willChange: "transform",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.06))",
  boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
};

const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { leading?: React.ReactNode }
> = ({ leading, style, disabled, children, ...rest }) => {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);

  const disabledStyles: React.CSSProperties = disabled
    ? {
        opacity: 0.5,
        cursor: "not-allowed",
        filter: "grayscale(35%) brightness(0.85)",
        boxShadow: "none",
        transform: "none",
        background: "rgba(255,255,255,0.04)",
      }
    : {};

  const combined: React.CSSProperties = {
    ...buttonBase,
    transform: disabled
      ? "none"
      : hover
        ? active
          ? "translateY(-1px)"
          : "translateY(-2px)"
        : "translateY(0)",
    opacity: disabled ? 0.55 : 1,
    background: disabled
      ? "rgba(255,255,255,0.04)"
      : (buttonBase.background as string),
    boxShadow: disabled
      ? "none"
      : active
        ? "0 10px 24px rgba(0,0,0,0.40)"
        : hover
          ? "0 12px 28px rgba(0,0,0,0.45)"
          : "0 8px 20px rgba(0,0,0,0.35)",
    ...disabledStyles,
    ...style,
  };

  return (
    <button
      {...rest}
      style={combined}
      disabled={disabled}
      onMouseEnter={(e) => {
        setHover(true);
        rest.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHover(false);
        setActive(false);
        rest.onMouseLeave?.(e);
      }}
      onMouseDown={(e) => {
        setActive(true);
        rest.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        setActive(false);
        rest.onMouseUp?.(e);
      }}
    >
      <span aria-hidden style={{ display: "grid", placeItems: "center" }}>
        {leading}
      </span>
      <span style={{ textAlign: "left" }}>{children}</span>
    </button>
  );
};

const IconX = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M6 6l12 12M18 6L6 18"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

// ===== Data =====

type GroupItem = {
  label: string;
  key: string;
  emoji?: string;
};

type Group = {
  key: string;
  emoji: string;
  title: string;
  items: GroupItem[];
};

const GROUPS: Group[] = [
  {
    key: "geo",
    emoji: "🌍",
    title: "Geography & Culture",
    items: [
      { label: "Guess the Flag", key: "flags", emoji: "🚩" },
      {
        label: "Guess the Country from Map Shape",
        key: "country-shape",
        emoji: "🗺️",
      },
      { label: "Guess the Capital City", key: "capital-city", emoji: "🏛️" },
      { label: "Guess the Currency", key: "currency", emoji: "💱" },
      { label: "Guess the Landmark / Monument", key: "landmark", emoji: "🗽" },
      {
        label: "Guess the Country from Emoji",
        key: "emoji-country",
        emoji: "🇫🇷",
      },
      {
        label: "Guess the Language from Text Snippet",
        key: "language-snippet",
        emoji: "🔤",
      },
      { label: "Guess the National Dish", key: "national-dish", emoji: "🍲" },
      {
        label: "Guess the Population Range",
        key: "population-range",
        emoji: "👥",
      },
    ],
  },
  {
    key: "movies",
    emoji: "🎬",
    title: "Movies, TV & Entertainment",
    items: [
      { label: "Guess the Movie from Emoji", key: "movie-emoji", emoji: "🍿" },
      {
        label: "Guess the Movie from a Blurred Poster",
        key: "blurred-poster",
        emoji: "🖼️",
      },
      {
        label: "Guess the Movie from a 1sec Clip",
        key: "one-sec-clip",
        emoji: "⏱️",
      },
      {
        label: "Guess the Actor from Childhood Photo",
        key: "actor-childhood",
        emoji: "🧒",
      },
      {
        label: "Guess the Series from Theme Song Clip",
        key: "theme-song",
        emoji: "🎵",
      },
      {
        label: "Guess the Cartoon Character",
        key: "cartoon-character",
        emoji: "🎨",
      },
      { label: "Guess the Movie by Quote", key: "movie-quote", emoji: "❝❞" },
      {
        label: "Guess the Celebrity from Pixelated Image",
        key: "celebrity-pixelated",
        emoji: "🧩",
      },
    ],
  },
  {
    key: "word",
    emoji: "🧠",
    title: "Knowledge & Word Games",
    items: [
      {
        label: "Guess the Word (from Definition)",
        key: "word-definition",
        emoji: "📖",
      },
      {
        label: "Guess the Opposite Word (Antonym Challenge)",
        key: "antonym",
        emoji: "↔️",
      },
      { label: "Guess the Emoji Word", key: "emoji-word", emoji: "🧩" },
      { label: "Guess the Riddle", key: "riddle", emoji: "🗝️" },
      { label: "Guess the Idiom from Emoji", key: "idiom-emoji", emoji: "🗯️" },
      { label: "Guess the Scrambled Word", key: "scrambled-word", emoji: "🔀" },
      { label: "Guess the Missing Letter", key: "missing-letter", emoji: "🔡" },
      { label: "Guess the Synonym", key: "synonym", emoji: "🟰" },
      {
        label: "Guess the Translation (multilingual)",
        key: "translation",
        emoji: "🌐",
      },
      {
        label: "Guess the Brand from Slogan",
        key: "brand-slogan",
        emoji: "🏷️",
      },
    ],
  },
  {
    key: "tech",
    emoji: "💻",
    title: "Tech & Gaming",
    items: [
      { label: "Guess the App Icon", key: "app-icon", emoji: "📱" },
      { label: "Guess the Logo", key: "logo-guess", emoji: "🏷️" },
      {
        label: "Guess the Game from Screenshot",
        key: "game-screenshot",
        emoji: "🕹️",
      },
      {
        label: "Guess the Programming Language (from code snippet)",
        key: "language-from-code",
        emoji: "💾",
      },
      {
        label: "Guess the AI Model (from image or output)",
        key: "ai-model",
        emoji: "🤖",
      },
      { label: "Guess the Tech Founder", key: "tech-founder", emoji: "👤" },
    ],
  },
  {
    key: "sports",
    emoji: "⚽",
    title: "Sports",
    items: [
      {
        label: "Guess the Football Club Logo",
        key: "football-club-logo",
        emoji: "🏟️",
      },
      {
        label: "Guess the Player (from silhouette or stats)",
        key: "player-from-stats",
        emoji: "📊",
      },
      { label: "Guess the Stadium", key: "stadium", emoji: "🏟️" },
      {
        label: "Guess the Olympic Sport from Emoji",
        key: "olympic-emoji",
        emoji: "🏅",
      },
    ],
  },
  {
    key: "animals",
    emoji: "🐾",
    title: "Animals & Nature",
    items: [
      { label: "Guess the Animal Sound", key: "animal-sound", emoji: "🔊" },
      {
        label: "Guess the Animal from Silhouette",
        key: "animal-silhouette",
        emoji: "🌑",
      },
      {
        label: "Guess the Animal from Zoomed-In Image",
        key: "animal-zoom",
        emoji: "🔍",
      },
      { label: "Guess the Breed (dog/cat)", key: "breed", emoji: "🐶" },
      { label: "Guess the Flower/Plant", key: "plant", emoji: "🌸" },
    ],
  },
  {
    key: "art",
    emoji: "🎨",
    title: "Art, History & Culture",
    items: [
      {
        label: "Guess the Painting (blurred or zoomed-in)",
        key: "painting",
        emoji: "🖼️",
      },
      {
        label: "Guess the Artist (Van Gogh, Picasso, etc.)",
        key: "artist",
        emoji: "🧑‍🎨",
      },
      {
        label: "Guess the Historical Figure",
        key: "historical-figure",
        emoji: "📜",
      },
      { label: "Guess the Era or Century", key: "era-century", emoji: "⏳" },
      { label: "Guess the Book by Cover", key: "book-cover", emoji: "📚" },
      {
        label: "Guess the Author from Quote",
        key: "author-quote",
        emoji: "✒️",
      },
      {
        label: "Guess the Mythology (Greek/Norse/etc.)",
        key: "mythology",
        emoji: "⚡",
      },
    ],
  },
  {
    key: "life",
    emoji: "👗",
    title: "Lifestyle & Misc",
    items: [
      {
        label: "Guess the Brand Logo (Fashion Edition)",
        key: "fashion-logo",
        emoji: "👜",
      },
      { label: "Guess the Car Brand", key: "car-brand", emoji: "🚗" },
      {
        label: "Guess the Food from Zoomed-In Image",
        key: "food-zoom",
        emoji: "🍔",
      },
      {
        label: "Guess the Emoji Combination Meaning",
        key: "emoji-combo",
        emoji: "🧩",
      },
      {
        label: "Guess the Makeup Product / Fragrance",
        key: "makeup-fragrance",
        emoji: "💄",
      },
    ],
  },
  {
    key: "fun",
    emoji: "🤖",
    title: "Fun / Internet Culture",
    items: [
      { label: "Guess the Meme Caption", key: "meme-caption", emoji: "😹" },
      { label: "Guess the Viral Tweet", key: "viral-tweet", emoji: "🐦" },
      {
        label: "Guess the AI-Generated vs Real Image",
        key: "ai-vs-real",
        emoji: "🧪",
      },
      {
        label: "Guess the GPT Prompt Output (Real or Fake)",
        key: "gpt-output-real-or-fake",
        emoji: "📝",
      },
      {
        label: "Guess the Influencer from Emoji Hints",
        key: "influencer-emoji",
        emoji: "✨",
      },
    ],
  },
];

export default function GuessGamesOptionsDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  useUIButtonFont();

  // Which category's dropdown is open
  const [openCategoryKey, setOpenCategoryKey] = React.useState<string | null>(
    "geo"
  );

  const wrap: React.CSSProperties = { display: "grid", gap: 12, marginTop: 20 };

  const scrollArea: React.CSSProperties = {
    maxHeight: "64vh",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    overscrollBehavior: "contain",
    paddingRight: 4,
    position: "relative",
  };

  // Sudoku-like dropdown styles
  const menu: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    minWidth: "100%",
    maxHeight: "60vh",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    overscrollBehavior: "contain",
    borderRadius: 12,
    background: "rgba(24,24,27,0.98)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    padding: 8,
    zIndex: 10,
    display: "grid",
    gap: 6,
  };

  const menuItem: React.CSSProperties = {
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid transparent",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 600,
    fontFamily:
      "'Poppins', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji','Segoe UI Emoji'",
    display: "grid",
    gridTemplateColumns: "28px 1fr",
    alignItems: "center",
    gap: 10,
  };

  const menuItemDisabled: React.CSSProperties = {
    ...menuItem,
    opacity: 0.5,
    cursor: "not-allowed",
    filter: "grayscale(35%) brightness(0.85)",
    background: "rgba(255,255,255,0.04)",
  };

   const goItem = (groupKey: string, itemKey: string) => {
  if (groupKey === "geo" && itemKey === "flags") {
    navigate("/flags");
  } else if (groupKey === "geo" && itemKey === "country-shape") {
    navigate("/country-shape");
  } else if (groupKey === "geo" && itemKey === "capital-city") {
    navigate("/guess/capital");
  } else if (groupKey === "geo" && itemKey === "currency") {
    navigate("/guess/currency");
  } else if (groupKey === "geo" && itemKey === "population-range") {
    navigate("/guess/population");
  } else if (groupKey === "geo" && itemKey === "language-snippet") { 
    
    navigate("/guess/language");
    } else if (groupKey === "geo" && itemKey === "emoji-country") { // ← NEW
    navigate("/guess/emoji-country");
  } else {
    navigate(`/guess/${groupKey}/${itemKey}`);
  }
  onOpenChange(false);
};

  const isCategoryEnabled = (gKey: string) => gKey === "geo"; // Geography enabled
  const isItemEnabled = (itemKey: string) =>
  itemKey === "flags" ||
  itemKey === "country-shape" ||
  itemKey === "capital-city" ||
  itemKey === "currency" ||
  itemKey === "population-range" ||
  itemKey === "language-snippet"||
  itemKey === "emoji-country";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setOpenCategoryKey(null);
      }}
      title="Guess Games"
    >
      <div style={wrap}>
        <div style={scrollArea}>
          <div role="menu" style={{ display: "grid", gap: 10 }}>
            {GROUPS.map((g) => {
              const catEnabled = isCategoryEnabled(g.key);
              return (
                <div key={g.key} style={{ position: "relative" }}>
                  <Button
                    leading={
                      <span aria-hidden style={{ fontSize: 22 }}>
                        {g.emoji}
                      </span>
                    }
                    onClick={() => {
                      if (!catEnabled) return;
                      setOpenCategoryKey((prev) =>
                        prev === g.key ? null : g.key
                      );
                    }}
                    disabled={!catEnabled}
                    aria-expanded={openCategoryKey === g.key && catEnabled}
                    aria-haspopup="menu"
                    aria-label={g.title}
                    title={g.title}
                  >
                    {g.title} {catEnabled ? "▾" : ""}
                  </Button>

                  {openCategoryKey === g.key && catEnabled && (
                    <div role="menu" style={menu}>
                      {g.items.map((it) => {
                        const enabled = isItemEnabled(it.key);
                        return (
                          <button
                            key={it.key}
                            role="menuitem"
                            onClick={() => enabled && goItem(g.key, it.key)}
                            disabled={!enabled}
                            style={enabled ? menuItem : menuItemDisabled}
                            aria-label={it.label}
                            title={it.label}
                          >
                            <span
                              aria-hidden
                              style={{ display: "grid", placeItems: "center" }}
                            >
                              {it.emoji ?? "•"}
                            </span>
                            <span style={{ textAlign: "left" }}>
                              {it.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Close */}
        <Button
          leading={<IconX />}
          onClick={() => onOpenChange(false)}
          aria-label="Close dialog"
          style={{
            background: "rgba(255,255,255,0.06)",
            boxShadow: "none",
            fontWeight: 600,
          }}
        >
          Close
        </Button>
      </div>
    </Dialog>
  );
}
