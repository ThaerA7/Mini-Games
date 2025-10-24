// src/components/sudoku/SudokuOptionsDialog.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Dialog from "../sudoku/SudokuDialog.tsx";

export type Difficulty =
  | "easy"
  | "medium"
  | "hard"
  | "expert"
  | "extreme"
  | "16x16";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartNew: (difficulty: Difficulty) => void; // classic sudoku only
  onContinue: () => void;
};

function useUIButtonFont() {
  React.useEffect(() => {
    const id = "sudoku-ui-font-poppins";
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

// --- MemoryOptionsDialog-like Button ---
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

  const combined: React.CSSProperties = {
    ...buttonBase,
    transform: disabled
      ? "none"
      : hover
      ? active
        ? "translateY(-1px)"
        : "translateY(-2px)"
      : "translateY(0)",
    opacity: disabled ? 0.6 : 1,
    background: disabled ? "rgba(255,255,255,0.06)" : buttonBase.background,
    boxShadow: disabled
      ? "none"
      : active
      ? "0 10px 24px rgba(0,0,0,0.40)"
      : hover
      ? "0 12px 28px rgba(0,0,0,0.45)"
      : "0 8px 20px rgba(0,0,0,0.35)",
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

// --- Simple icons to match style ---
const IconPlay: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M8 5l10 7-10 7V5z" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);
const IconRotate: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M20 12a8 8 0 10-3 6.3M20 12V6m0 6h-6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IconX: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M6 6l12 12M18 6L6 18"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export default function SudokuOptionsDialog({
  open,
  onOpenChange,
  onStartNew,
  onContinue,
}: Props) {
  const navigate = useNavigate();
  useUIButtonFont();

  const [menuOpen, setMenuOpen] = React.useState(false);

  // Classic items without 16x16
  const classicBase: Exclude<Difficulty, "16x16">[] = [
    "easy",
    "medium",
    "hard",
    "expert",
    "extreme",
  ];
  const sixteens: Difficulty = "16x16";

  const stack: React.CSSProperties = {
    display: "grid",
    gap: 12,
    marginTop: 20,
  };

  // Scrollable dropdown
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

  const item: React.CSSProperties = {
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
  };

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setMenuOpen(false);
      }}
      title="Sudoku"
    >
      <div style={stack}>
        {/* Start New with dropdown */}
        <div style={{ position: "relative" }}>
          <Button
            leading={<IconPlay />}
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            Start New ▾
          </Button>

          {menuOpen && (
            <div role="menu" style={menu}>
              {/* Classic Easy → Extreme */}
              {classicBase.map((lvl) => (
                <button
                  key={`classic-${lvl}`}
                  role="menuitem"
                  style={item}
                  onClick={() => {
                    onStartNew(lvl);
                    localStorage.setItem("sudoku:difficulty", lvl);
                    setMenuOpen(false);
                    onOpenChange(false);
                    navigate("/sudoku", { state: { difficulty: lvl } });
                  }}
                >
                  {cap(lvl)}
                </button>
              ))}

              {/* Single Killer Sudoku item (no difficulties), placed between Extreme and 16×16 */}
              <button
                key="killer"
                role="menuitem"
                style={item}
                onClick={() => {
                  setMenuOpen(false);
                  onOpenChange(false);
                  navigate("/killer"); // let /killer choose its default difficulty
                }}
              >
                Killer Sudoku
              </button>

              {/* 16×16 at the end */}
              <button
                key={`classic-${sixteens}`}
                role="menuitem"
                style={item}
                onClick={() => {
                  onStartNew(sixteens);
                  localStorage.setItem("sudoku:difficulty", sixteens);
                  setMenuOpen(false);
                  onOpenChange(false);
                  navigate("/sudoku", { state: { difficulty: sixteens } });
                }}
              >
                16×16
              </button>
            </div>
          )}
        </div>

        {/* Continue */}
        <Button
          leading={<IconRotate />}
          onClick={() => {
            onContinue();
            onOpenChange(false);
            const last = localStorage.getItem("sudoku:difficulty") || "medium";
            navigate("/sudoku", { state: { difficulty: last } });
          }}
        >
          Continue
        </Button>

        {/* Close */}
        <Button
          leading={<IconX />}
          onClick={() => onOpenChange(false)}
          aria-label="Close dialog"
          style={{ background: "rgba(255,255,255,0.06)", boxShadow: "none", fontWeight: 600 }}
        >
          Close
        </Button>
      </div>
    </Dialog>
  );
}
