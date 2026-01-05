// src/components/memory/MemoryOptionsDialog.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Dialog from "../../sudoku/SudokuDialog";

function useUIButtonFont() {
  React.useEffect(() => {
    const id = "memory-ui-font-poppins";
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

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

// icons
const IconEye: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);
const IconBolt: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);
const IconBanana: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M5 16c5 4 12 1 14-6" stroke="currentColor" strokeWidth="1.6" />
    <path d="M18 4c.5 2.5 0 3.5-2 5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);
const Icon123: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M5 16V8l-2 2" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M10 16c2 0 3-3 0-3 3 0 2-3 0-3"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path d="M18 16h-3l3-4h-3" stroke="currentColor" strokeWidth="1.6" />
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

export default function MemoryOptionsDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  useUIButtonFont();

  const stack: React.CSSProperties = {
    display: "grid",
    gap: 12,
    marginTop: 20,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Memory Games">
      <div style={stack}>
        <Button
          leading={<IconEye />}
          onClick={() => {
            onOpenChange(false);
            navigate("/memory");
          }}
          aria-label="Start Visual Memory"
        >
          Visual Memory
        </Button>

        <Button
          leading={<IconBolt />}
          onClick={() => {
            onOpenChange(false);
            navigate("/sequence");
          }}
          aria-label="Start Sequence Memory"
        >
          Sequence Memory
        </Button>

        <Button
          leading={<IconBanana />}
          onClick={() => {
            onOpenChange(false);
            navigate("/chimp");
          }}
          aria-label="Start Chimp Test"
        >
          Chimp Test
        </Button>

        <Button
          leading={<Icon123 />}
          onClick={() => {
            onOpenChange(false);
            navigate("/number");
          }}
          aria-label="Start Number Memory"
        >
          Number Memory
        </Button>

        {/* Updated close with icon */}
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
