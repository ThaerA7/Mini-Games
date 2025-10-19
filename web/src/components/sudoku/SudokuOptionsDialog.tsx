// src/components/sudoku/SudokuOptionsDialog.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Dialog from "../sudoku/SudokuDialog.tsx";

export type Difficulty = "easy" | "medium" | "hard" | "expert" | "extreme" | "16x16";

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
        "https://fonts.googleapis.com/css2?family=Poppins:wght@500;600&display=swap";
      document.head.appendChild(link);
    }
  }, []);
}

const buttonBase: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  fontSize: 18,
  fontFamily:
    '"Orbitron","Audiowide","Russo One",system-ui,Segoe UI,Roboto,sans-serif',
  color: "white",
  cursor: "pointer",
  userSelect: "none",
  outline: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  transition: "transform 120ms ease, box-shadow 120ms ease",
  willChange: "transform",
};

type FloatingButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  bg: string;
};

function FloatingButton({
  bg,
  style,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  ...rest
}: FloatingButtonProps) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);

  const baseShadow = "0 8px 20px rgba(0,0,0,0.35)";
  const hoverShadow = "0 12px 28px rgba(0,0,0,0.45)";
  const activeShadow = "0 10px 24px rgba(0,0,0,0.40)";

  const combinedStyle: React.CSSProperties = {
    ...buttonBase,
    background: bg,
    transform: hover ? (active ? "translateY(-1px)" : "translateY(-2px)") : "translateY(0)",
    boxShadow: active ? activeShadow : hover ? hoverShadow : baseShadow,
    ...style,
  };

  return (
    <button
      {...rest}
      style={combinedStyle}
      onMouseEnter={(e) => {
        setHover(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHover(false);
        setActive(false);
        onMouseLeave?.(e);
      }}
      onMouseDown={(e) => {
        setActive(true);
        onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        setActive(false);
        onMouseUp?.(e);
      }}
    />
  );
}

const startNewColor = "#16a34a";
const continueColor = "#3b82f6";
const closeColor = "#4b5563";

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
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 20,
  };

  const startNewWrap: React.CSSProperties = { position: "relative" };

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
    fontSize: 18,
    fontFamily:
      '"Poppins", system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
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
        <div style={startNewWrap}>
          <FloatingButton
            bg={startNewColor}
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            Start New ▾
          </FloatingButton>

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

        <FloatingButton
          bg={continueColor}
          onClick={() => {
            onContinue();
            onOpenChange(false);
            const last = localStorage.getItem("sudoku:difficulty") || "Medium";
            navigate("/sudoku", { state: { difficulty: last } });
          }}
        >
          Continue
        </FloatingButton>

        <FloatingButton bg={closeColor} onClick={() => onOpenChange(false)}>
          Close
        </FloatingButton>
      </div>
    </Dialog>
  );
}
